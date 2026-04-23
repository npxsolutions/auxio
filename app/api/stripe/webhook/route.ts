/**
 * Stripe webhook — org-scoped (Phase 1 Stage C.4).
 *
 * Resolves the target organization for each event via (in order):
 *   1. `metadata.organization_id` on the Checkout Session or Subscription
 *   2. `organizations.stripe_customer_id` lookup
 *   3. legacy fallback: `users.id = metadata.supabase_user_id` → user's personal org
 *
 * During the transition window we also mirror writes into `users` so existing
 * code paths that read plan/subscription_status from the user row keep working.
 * The mirror can be dropped after 30 days of clean webhook delivery AND once
 * all readers (usage API, plan gates) are switched to the org row.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPostHogClient } from '../../../lib/posthog'

export const runtime = 'nodejs'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// Service-role client — webhooks run outside user session
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const PLAN_BY_PRICE: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER    || 'price_starter']:    'starter',
  [process.env.STRIPE_PRICE_GROWTH     || 'price_growth']:     'growth',
  [process.env.STRIPE_PRICE_SCALE      || 'price_scale']:      'scale',
  [process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise']: 'enterprise',
}

type ResolvedTarget = {
  organizationId: string | null
  userId: string | null
}

/**
 * Find the org (and optionally the owner user) for a given event.
 * Tries metadata first, then stripe_customer_id lookup, then user-metadata
 * fallback for legacy events.
 */
async function resolveTarget(
  db: SupabaseClient,
  opts: { metadataOrgId?: string | null; metadataUserId?: string | null; customerId?: string | null },
): Promise<ResolvedTarget> {
  const { metadataOrgId, metadataUserId, customerId } = opts

  // 1. Explicit metadata on the session/subscription.
  if (metadataOrgId) {
    return { organizationId: metadataOrgId, userId: metadataUserId ?? null }
  }

  // 2. Stripe customer → org lookup.
  if (customerId) {
    const { data: org } = await db
      .from('organizations')
      .select('id, owner_user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    if (org) {
      return {
        organizationId: org.id as string,
        userId: metadataUserId ?? (org.owner_user_id as string),
      }
    }
  }

  // 3. Legacy fallback: user_id in metadata → user's personal org.
  if (metadataUserId) {
    const { data: personalOrg } = await db
      .from('organizations')
      .select('id')
      .eq('owner_user_id', metadataUserId)
      .like('slug', 'u-%')
      .maybeSingle()
    if (personalOrg) {
      return { organizationId: personalOrg.id as string, userId: metadataUserId }
    }
    console.warn('[stripe/webhook] personal org missing for user', metadataUserId)
    return { organizationId: null, userId: metadataUserId }
  }

  return { organizationId: null, userId: null }
}

// Columns dropped from `users` as of Stage D — not part of the compat shim.
const USER_DROPPED_COLS = new Set([
  'stripe_customer_id',
  'stripe_subscription_id',
])

/**
 * Mirror an updates payload to both `organizations` (primary) and `users`
 * (compatibility shim for readers that still read plan/subscription_status
 * from users — e.g. admin metrics page, AppSidebar plan badge).
 *
 * Strips Stripe-only fields from the users shim because those columns are
 * dropped in phase1_stage_d_drop_user_billing.sql.
 */
async function writeBillingUpdate(
  db: SupabaseClient,
  target: ResolvedTarget,
  updates: Record<string, unknown>,
) {
  const now = new Date().toISOString()

  if (target.organizationId) {
    const { error } = await db
      .from('organizations')
      .update({ ...updates, updated_at: now })
      .eq('id', target.organizationId)
    if (error) console.error('[stripe/webhook] org update failed', error.message)
  } else {
    console.warn('[stripe/webhook] no organization_id on event — skipping org write')
  }

  if (target.userId) {
    const userUpdates: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(updates)) {
      if (!USER_DROPPED_COLS.has(k)) userUpdates[k] = v
    }
    if (Object.keys(userUpdates).length > 0) {
      const { error } = await db
        .from('users')
        .upsert({ id: target.userId, ...userUpdates, updated_at: now })
      if (error) console.error('[stripe/webhook] user shim update failed', error.message)
    }
  }
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[stripe/webhook:POST] signature failed:', err.message)
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  const db = getSupabase()

  // ── Idempotency gate ──────────────────────────────────────────────────────
  try {
    const { error: insertErr } = await db
      .from('stripe_webhook_events')
      .insert({ event_id: event.id, event_type: event.type })

    if (insertErr) {
      if ((insertErr as any).code === '23505') {
        return NextResponse.json({ duplicate: true, ok: true }, { status: 200 })
      }
      console.error('[stripe/webhook:POST] idempotency ledger insert failed', insertErr)
    }
  } catch (err) {
    console.error('[stripe/webhook:POST] idempotency ledger threw', err)
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const target = await resolveTarget(db, {
          metadataOrgId:  session.metadata?.organization_id ?? null,
          metadataUserId: session.metadata?.supabase_user_id ?? null,
          customerId:     typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
        })
        if (!target.organizationId && !target.userId) break

        // Lifetime one-time purchase — mode=payment and matching price id.
        const isLifetime = session.metadata?.offer === 'lifetime_scale' || session.mode === 'payment'
        const lifetimePriceId = process.env.STRIPE_PRICE_LIFETIME_SCALE
        if (isLifetime && lifetimePriceId) {
          let matched = session.metadata?.offer === 'lifetime_scale'
          try {
            const items = await getStripe().checkout.sessions.listLineItems(session.id, { limit: 5 })
            matched = matched || items.data.some(li => li.price?.id === lifetimePriceId)
          } catch {}
          if (matched) {
            await writeBillingUpdate(db, target, {
              plan: 'lifetime_scale',
              billing_interval: 'lifetime',
              stripe_customer_id: session.customer as string,
              subscription_status: 'active',
              lifetime_purchased_at: new Date().toISOString(),
            })
            const ph = getPostHogClient()
            if (ph && target.userId) {
              ph.capture({
                distinctId: target.userId,
                event: 'lifetime_purchased',
                properties: {
                  organization_id: target.organizationId,
                  revenue: session.amount_total ? session.amount_total / 100 : 0,
                },
              })
              await ph.shutdown()
            }
            break
          }
        }

        const plan = session.metadata?.plan
        let billingInterval: string | null = null
        let subscriptionId: string | null = null
        if (session.mode === 'subscription' && session.subscription) {
          subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          try {
            const sub = await getStripe().subscriptions.retrieve(subscriptionId)
            const interval = sub.items.data[0]?.price.recurring?.interval
            billingInterval = interval === 'year' ? 'year' : 'month'
          } catch {}
        }

        await writeBillingUpdate(db, target, {
          plan,
          stripe_customer_id: session.customer as string,
          subscription_status: 'active',
          ...(billingInterval ? { billing_interval: billingInterval } : {}),
          ...(subscriptionId   ? { stripe_subscription_id: subscriptionId } : {}),
        })

        const ph = getPostHogClient()
        if (ph && target.userId) {
          ph.capture({
            distinctId: target.userId,
            event: 'subscription_started',
            properties: {
              plan,
              organization_id: target.organizationId,
              revenue: session.amount_total ? session.amount_total / 100 : 0,
            },
          })
          await ph.shutdown()
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const target = await resolveTarget(db, {
          metadataOrgId:  sub.metadata?.organization_id ?? null,
          metadataUserId: sub.metadata?.supabase_user_id ?? null,
          customerId:     typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null,
        })
        if (!target.organizationId && !target.userId) break

        const priceId     = sub.items.data[0]?.price.id
        const plan        = PLAN_BY_PRICE[priceId] || 'growth'
        const prevPriceId = (event.data.previous_attributes as any)?.items?.data?.[0]?.price?.id
        const prevPlan    = prevPriceId ? (PLAN_BY_PRICE[prevPriceId] || 'unknown') : null

        const interval        = sub.items.data[0]?.price.recurring?.interval
        const billingInterval = interval === 'year' ? 'year' : 'month'

        await writeBillingUpdate(db, target, {
          plan,
          subscription_status: sub.status,
          billing_interval: billingInterval,
          stripe_subscription_id: sub.id,
        })

        if (prevPlan && prevPlan !== plan && target.userId) {
          const ph = getPostHogClient()
          if (ph) {
            ph.capture({
              distinctId: target.userId,
              event: 'plan_changed',
              properties: {
                from: prevPlan,
                to: plan,
                organization_id: target.organizationId,
              },
            })
            await ph.shutdown()
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const target = await resolveTarget(db, {
          metadataOrgId:  sub.metadata?.organization_id ?? null,
          metadataUserId: sub.metadata?.supabase_user_id ?? null,
          customerId:     typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null,
        })
        if (!target.organizationId && !target.userId) break

        const priceId = sub.items.data[0]?.price.id
        const plan    = PLAN_BY_PRICE[priceId] || 'unknown'

        await writeBillingUpdate(db, target, {
          plan: 'free',
          subscription_status: 'cancelled',
        })

        if (target.userId) {
          const ph = getPostHogClient()
          if (ph) {
            ph.capture({
              distinctId: target.userId,
              event: 'subscription_cancelled',
              properties: { plan, organization_id: target.organizationId },
            })
            await ph.shutdown()
          }
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subRef  = invoice.parent?.subscription_details?.subscription
        const sub = typeof subRef === 'string'
          ? await getStripe().subscriptions.retrieve(subRef)
          : subRef as Stripe.Subscription | null
        const target = await resolveTarget(db, {
          metadataOrgId:  sub?.metadata?.organization_id ?? null,
          metadataUserId: sub?.metadata?.supabase_user_id ?? null,
          customerId:     typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null,
        })
        if (!target.userId) break

        // Find a pending/signed_up referral for this user.
        // TODO Stage A.1: referrals references user_id; referral credits can stay user-level for now.
        const { data: ref } = await db
          .from('referrals')
          .select('id, referrer_user_id, credit_amount_cents, status, first_payment_at')
          .eq('referred_user_id', target.userId)
          .in('status', ['pending', 'signed_up'])
          .maybeSingle()

        if (ref && !ref.first_payment_at) {
          await db.from('referrals').update({
            status: 'paid',
            first_payment_at: new Date().toISOString(),
          }).eq('id', ref.id)

          const { error: credErr } = await db.from('user_credits').insert({
            user_id: ref.referrer_user_id,
            amount_cents: ref.credit_amount_cents || 5000,
            source: 'referral',
            source_ref: ref.id,
            applied: false,
          })
          if (credErr && (credErr as any).code !== '23505') {
            console.error('[stripe/webhook:POST] referral credit insert failed', credErr)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subRef  = invoice.parent?.subscription_details?.subscription
        const sub = typeof subRef === 'string'
          ? await getStripe().subscriptions.retrieve(subRef)
          : subRef as Stripe.Subscription | null
        const target = await resolveTarget(db, {
          metadataOrgId:  sub?.metadata?.organization_id ?? null,
          metadataUserId: sub?.metadata?.supabase_user_id ?? null,
          customerId:     typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null,
        })
        if (!target.organizationId && !target.userId) break

        await writeBillingUpdate(db, target, { subscription_status: 'past_due' })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[stripe/webhook:POST] handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
