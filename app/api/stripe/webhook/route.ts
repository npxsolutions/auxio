import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPostHogClient } from '../../../lib/posthog'

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

  // ── Idempotency gate ──────────────────────────────────────────────────────
  // Stripe delivers events at-least-once. Attempt to reserve event.id in the
  // ledger BEFORE processing. On unique-violation (23505), this is a duplicate
  // redelivery — acknowledge 200 immediately and short-circuit.
  try {
    const { error: insertErr } = await getSupabase()
      .from('stripe_webhook_events')
      .insert({ event_id: event.id, event_type: event.type })

    if (insertErr) {
      // 23505 = Postgres unique_violation
      if ((insertErr as any).code === '23505') {
        return NextResponse.json({ duplicate: true, ok: true }, { status: 200 })
      }
      console.error('[stripe/webhook:POST] idempotency ledger insert failed', insertErr)
      // Fail open — still process the event so we don't drop legitimate deliveries.
    }
  } catch (err) {
    console.error('[stripe/webhook:POST] idempotency ledger threw', err)
    // Fail open.
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId  = session.metadata?.supabase_user_id
        const plan    = session.metadata?.plan
        if (!userId) break

        await getSupabase().from('users').upsert({
          id: userId,
          plan,
          stripe_customer_id: session.customer as string,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })

        // Track subscription started
        const ph = getPostHogClient()
        if (ph && userId) {
          ph.capture({ distinctId: userId, event: 'subscription_started', properties: { plan, revenue: session.amount_total ? session.amount_total / 100 : 0 } })
          await ph.shutdown()
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.supabase_user_id
        if (!userId) break

        const priceId = sub.items.data[0]?.price.id
        const plan    = PLAN_BY_PRICE[priceId] || 'growth'
        const prevPriceId = (event.data.previous_attributes as any)?.items?.data?.[0]?.price?.id
        const prevPlan    = prevPriceId ? (PLAN_BY_PRICE[prevPriceId] || 'unknown') : null

        await getSupabase().from('users').upsert({
          id: userId,
          plan,
          subscription_status: sub.status,
          updated_at: new Date().toISOString(),
        })

        // Track upgrades/downgrades (key for NRR)
        if (prevPlan && prevPlan !== plan) {
          const ph = getPostHogClient()
          if (ph) {
            ph.capture({ distinctId: userId, event: 'plan_changed', properties: { from: prevPlan, to: plan } })
            await ph.shutdown()
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.supabase_user_id
        if (!userId) break

        const priceId = sub.items.data[0]?.price.id
        const plan    = PLAN_BY_PRICE[priceId] || 'unknown'

        await getSupabase().from('users').upsert({
          id: userId,
          plan: 'free',
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString(),
        })

        // Track churn
        const ph = getPostHogClient()
        if (ph) {
          ph.capture({ distinctId: userId, event: 'subscription_cancelled', properties: { plan } })
          await ph.shutdown()
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subRef = invoice.parent?.subscription_details?.subscription
        const sub = typeof subRef === 'string'
          ? await getStripe().subscriptions.retrieve(subRef)
          : subRef as Stripe.Subscription | null
        const userId = sub?.metadata?.supabase_user_id
        if (!userId) break

        const db = getSupabase()
        // Find a pending/signed_up referral for this user.
        const { data: ref } = await db
          .from('referrals')
          .select('id, referrer_user_id, credit_amount_cents, status, first_payment_at')
          .eq('referred_user_id', userId)
          .in('status', ['pending', 'signed_up'])
          .maybeSingle()

        if (ref && !ref.first_payment_at) {
          // Flip referral → paid
          await db.from('referrals').update({
            status: 'paid',
            first_payment_at: new Date().toISOString(),
          }).eq('id', ref.id)

          // Write credit row for the referrer — idempotent via uq_user_credits_source_ref.
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
        const subRef = invoice.parent?.subscription_details?.subscription
        const sub = typeof subRef === 'string'
          ? await getStripe().subscriptions.retrieve(subRef)
          : subRef as Stripe.Subscription | null
        const userId = sub?.metadata?.supabase_user_id
        if (userId) {
          await getSupabase().from('users').upsert({
            id: userId,
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[stripe/webhook:POST] handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
