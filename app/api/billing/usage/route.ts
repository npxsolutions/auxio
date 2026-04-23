// [api/billing/usage] — returns this period's counts + overage for the active org.
// Powers the "This period" panel on /billing.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { computeOverageCharges, getMonthlyOrgUsage, getPlanLimits } from '../../../lib/billing/usage'
import { requireActiveOrg } from '@/app/lib/org/context'

export const runtime = 'nodejs'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

export async function GET() {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = getAdmin()
  const { data: org } = await admin
    .from('organizations')
    .select('plan, billing_interval, owner_user_id')
    .eq('id', ctx.id)
    .maybeSingle()

  const plan = org?.plan ?? 'free'
  const limits = getPlanLimits(plan)

  try {
    const usage = await getMonthlyOrgUsage(admin, ctx.id, (org?.owner_user_id as string) ?? ctx.user.id)
    const overage = computeOverageCharges(plan, usage)

    return NextResponse.json({
      organization_id: ctx.id,
      plan,
      billing_interval: org?.billing_interval ?? 'month',
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
