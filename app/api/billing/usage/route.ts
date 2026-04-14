// [api/billing/usage] — returns this period's counts + overage for the signed-in user.
// Powers the "This period" panel on /billing.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { computeOverageCharges, getMonthlyUsage, getPlanLimits } from '../../../lib/billing/usage'

export const runtime = 'nodejs'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: row } = await supabase
    .from('users')
    .select('plan, billing_interval')
    .eq('id', user.id)
    .maybeSingle()

  const plan = row?.plan ?? 'free'
  const limits = getPlanLimits(plan)

  try {
    const usage = await getMonthlyUsage(supabase as any, user.id)
    const overage = computeOverageCharges(plan, usage)

    return NextResponse.json({
      plan,
      billing_interval: row?.billing_interval ?? 'month',
      period_start: usage.periodStart.toISOString(),
      period_end:   usage.periodEnd.toISOString(),
      orders: {
        used: usage.orders,
        included: limits.includedOrders === Number.POSITIVE_INFINITY ? null : limits.includedOrders,
        overage: overage.ordersOverage,
        overage_cents: overage.ordersOverageCents,
      },
      listings: {
        used: usage.listings,
        included: limits.includedListings === Number.POSITIVE_INFINITY ? null : limits.includedListings,
        overage: overage.listingsOverage,
        overage_cents: overage.listingsOverageCents,
      },
      projected_overage_cents: overage.totalCents,
    })
  } catch (err: any) {
    console.error('[api/billing/usage:GET] failed', err)
    return NextResponse.json({ error: err.message || 'failed' }, { status: 500 })
  }
}
