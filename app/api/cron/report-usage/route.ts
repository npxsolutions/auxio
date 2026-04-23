// [api/cron/report-usage] — daily 04:00 UTC sweep.
// Iterates organizations on a paid plan, computes this period's orders +
// listings, reports overage to Stripe via metered Billing Meter events, and
// persists a row to public.usage_reports. Unique(organization_id, period_end)
// makes retries safe.

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { computeOverageCharges, currentPeriod, getMonthlyOrgUsage, getPlanLimits } from '../../../lib/billing/usage'

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

  // Pull all orgs on a paid plan with an active subscription.
  const { data: orgs, error } = await db
    .from('organizations')
    .select('id, owner_user_id, plan, subscription_status, stripe_subscription_id, stripe_customer_id, billing_interval')
    .in('plan', ['starter', 'growth', 'scale'])
    .in('subscription_status', ['active', 'trialing', 'past_due'])
    .limit(10_000)

  if (error) {
    console.error('[api/cron/report-usage:GET] org select failed', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { start, end } = currentPeriod()
  const priceOrders   = process.env.STRIPE_PRICE_ORDERS_METERED
  const priceListings = process.env.STRIPE_PRICE_LISTINGS_METERED
  const meterOrders   = process.env.STRIPE_METER_EVENT_ORDERS   || 'orders_overage'
  const meterListings = process.env.STRIPE_METER_EVENT_LISTINGS || 'listings_overage'

  let reported = 0
  let skipped = 0
  const failures: Array<{ organizationId: string; err: string }> = []

  for (const o of orgs || []) {
    try {
      // Idempotency: if a row already exists for this org+period_end, skip.
      const { data: existing } = await db
        .from('usage_reports')
        .select('id')
        .eq('organization_id', o.id)
        .eq('period_end', end.toISOString())
        .maybeSingle()
      if (existing) { skipped++; continue }

      const usage = await getMonthlyOrgUsage(db, o.id as string, o.owner_user_id as string)
      const overage = computeOverageCharges(o.plan, usage)
      const limits = getPlanLimits(o.plan)

      let ordersUsageRecordId: string | null = null
      let listingsUsageRecordId: string | null = null

      if (o.stripe_customer_id && (overage.ordersOverage > 0 || overage.listingsOverage > 0)) {
        try {
          if (overage.ordersOverage > 0 && priceOrders) {
            const ev = await stripe.billing.meterEvents.create({
              event_name: meterOrders,
              payload: {
                stripe_customer_id: o.stripe_customer_id as string,
                value: String(overage.ordersOverage),
              },
              identifier: `usage-orders-${o.id}-${end.toISOString()}`,
            })
            ordersUsageRecordId = (ev as any).identifier || null
          }

          if (overage.listingsOverage > 0 && priceListings && limits.includedListings !== Number.POSITIVE_INFINITY) {
            const ev = await stripe.billing.meterEvents.create({
              event_name: meterListings,
              payload: {
                stripe_customer_id: o.stripe_customer_id as string,
                value: String(overage.listingsOverage),
              },
              identifier: `usage-listings-${o.id}-${end.toISOString()}`,
            })
            listingsUsageRecordId = (ev as any).identifier || null
          }
        } catch (stripeErr: any) {
          console.error('[api/cron/report-usage:GET] stripe meter event failed for', o.id, stripeErr.message)
          // Fall through — still write the usage_reports row so we have a record.
        }
      }

      const { error: insErr } = await db.from('usage_reports').insert({
        organization_id: o.id,
        user_id:         o.owner_user_id,
        period_start:    start.toISOString(),
        period_end:      end.toISOString(),
        orders_count:    usage.orders,
        listings_count:  usage.listings,
        orders_overage:  overage.ordersOverage,
        listings_overage: overage.listingsOverage,
        overage_cents: overage.totalCents,
        plan: o.plan,
        stripe_orders_usage_record_id:   ordersUsageRecordId,
        stripe_listings_usage_record_id: listingsUsageRecordId,
      })

      if (insErr) {
        if ((insErr as any).code === '23505') { skipped++; continue }
        throw new Error(insErr.message)
      }
      reported++
    } catch (err: any) {
      console.error('[api/cron/report-usage:GET] failed for', o.id, err)
      failures.push({ organizationId: o.id as string, err: err.message || String(err) })
    }
  }

  return NextResponse.json({ ok: true, reported, skipped, failures, period_end: end.toISOString() })
}
