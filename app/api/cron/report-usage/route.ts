// [api/cron/report-usage] — daily 04:00 UTC sweep.
// For each active-subscription user: compute this period's orders + listings,
// record overage to Stripe via usage records (metered prices), and persist a
// row to public.usage_reports. Unique(user_id, period_end) makes retries safe.
//
// TODO Stage C.4 (Stripe rewrite): migrate subscription state from `users` to
// `organizations`. This route should then iterate organizations with active
// subscriptions, compute per-org usage, and write usage_reports with
// organization_id. Today the per-user path still works because service-role
// bypasses RLS and user_id is 1:1 with personal_org via Stage A backfill.

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { computeOverageCharges, currentPeriod, getMonthlyUsage, getPlanLimits } from '../../../lib/billing/usage'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
)

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null
  if (expected && authHeader !== expected && !request.headers.get('x-vercel-cron')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = getSupabase()
  const stripe = getStripe()

  // Pull all users on a paid plan with an active subscription.
  const { data: users, error } = await db
    .from('users')
    .select('id, plan, subscription_status, stripe_subscription_id, stripe_customer_id, billing_interval')
    .in('plan', ['starter', 'growth', 'scale'])
    .in('subscription_status', ['active', 'trialing', 'past_due'])
    .limit(10_000)

  if (error) {
    console.error('[api/cron/report-usage:GET] user select failed', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { start, end } = currentPeriod()
  const priceOrders   = process.env.STRIPE_PRICE_ORDERS_METERED
  const priceListings = process.env.STRIPE_PRICE_LISTINGS_METERED
  // Stripe Billing Meter event names — set these to the `event_name` on the
  // meters backing the metered prices above.
  const meterOrders   = process.env.STRIPE_METER_EVENT_ORDERS   || 'orders_overage'
  const meterListings = process.env.STRIPE_METER_EVENT_LISTINGS || 'listings_overage'

  let reported = 0
  let skipped = 0
  const failures: Array<{ userId: string; err: string }> = []

  for (const u of users || []) {
    try {
      // Idempotency: if a row already exists for this user+period_end, skip.
      const { data: existing } = await db
        .from('usage_reports')
        .select('id')
        .eq('user_id', u.id)
        .eq('period_end', end.toISOString())
        .maybeSingle()
      if (existing) { skipped++; continue }

      const usage = await getMonthlyUsage(db, u.id)
      const overage = computeOverageCharges(u.plan, usage)
      const limits = getPlanLimits(u.plan)

      let ordersUsageRecordId: string | null = null
      let listingsUsageRecordId: string | null = null

      // Report to Stripe only when: we have a subscription, we have metered
      // price env vars, and there's overage to record. We look up the
      // subscription item that matches the metered price.
      if (u.stripe_customer_id && (overage.ordersOverage > 0 || overage.listingsOverage > 0)) {
        try {
          if (overage.ordersOverage > 0 && priceOrders) {
            const ev = await stripe.billing.meterEvents.create({
              event_name: meterOrders,
              payload: {
                stripe_customer_id: u.stripe_customer_id,
                value: String(overage.ordersOverage),
              },
              // Idempotency via deterministic identifier per user+period.
              identifier: `usage-orders-${u.id}-${end.toISOString()}`,
            })
            ordersUsageRecordId = (ev as any).identifier || null
          }

          if (overage.listingsOverage > 0 && priceListings && limits.includedListings !== Number.POSITIVE_INFINITY) {
            const ev = await stripe.billing.meterEvents.create({
              event_name: meterListings,
              payload: {
                stripe_customer_id: u.stripe_customer_id,
                value: String(overage.listingsOverage),
              },
              identifier: `usage-listings-${u.id}-${end.toISOString()}`,
            })
            listingsUsageRecordId = (ev as any).identifier || null
          }
        } catch (stripeErr: any) {
          console.error('[api/cron/report-usage:GET] stripe meter event failed for', u.id, stripeErr.message)
          // Fall through — still write the usage_reports row so we have a record.
        }
      }

      const { error: insErr } = await db.from('usage_reports').insert({
        user_id: u.id,
        period_start: start.toISOString(),
        period_end:   end.toISOString(),
        orders_count:   usage.orders,
        listings_count: usage.listings,
        orders_overage:   overage.ordersOverage,
        listings_overage: overage.listingsOverage,
        overage_cents: overage.totalCents,
        plan: u.plan,
        stripe_orders_usage_record_id:   ordersUsageRecordId,
        stripe_listings_usage_record_id: listingsUsageRecordId,
      })

      if (insErr) {
        // 23505 == unique_violation — raced with another run, treat as skip.
        if ((insErr as any).code === '23505') { skipped++; continue }
        throw new Error(insErr.message)
      }
      reported++
    } catch (err: any) {
      console.error('[api/cron/report-usage:GET] failed for', u.id, err)
      failures.push({ userId: u.id, err: err.message || String(err) })
    }
  }

  return NextResponse.json({ ok: true, reported, skipped, failures, period_end: end.toISOString() })
}
