/**
 * Financials API (12-month P&L + working capital).
 *
 * `transactions` is org-scoped (Stage A). `purchase_orders` is Stage A.1
 * follow-up — still user-scoped. `users.plan` still lives on the users row
 * for Phase 1; moves to `organizations` during Stripe rewrite (C.4).
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { requireActiveOrg } from '@/app/lib/org/context'

const getSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

export async function GET() {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const since12m = new Date()
    since12m.setMonth(since12m.getMonth() - 12)

    const [txRes, poRes, userRes] = await Promise.all([
      supabase.from('transactions')
        .select('order_date, sale_price, true_profit, supplier_cost, channel_fee, channel')
        .gte('order_date', since12m.toISOString())
        .order('order_date', { ascending: true }),
      supabase.from('purchase_orders')
        .select('order_date, total_cost, status')
        .gte('order_date', since12m.toISOString().slice(0, 10)),
      supabase.from('organizations')
        .select('plan')
        .eq('id', ctx.id)
        .single(),
    ])

    const txs = txRes.data || []
    const pos = poRes.data || []

    // Monthly P&L buckets
    const monthMap: Record<string, {
      revenue: number; cogs: number; fees: number; profit: number; orders: number; cogsPurchased: number
    }> = {}

    const monthKey = (dateStr: string) => dateStr?.slice(0, 7) || '?'

    for (const t of txs) {
      const mk = monthKey(t.order_date)
      if (!monthMap[mk]) monthMap[mk] = { revenue: 0, cogs: 0, fees: 0, profit: 0, orders: 0, cogsPurchased: 0 }
      monthMap[mk].revenue += Number(t.sale_price    || 0)
      monthMap[mk].cogs    += Number(t.supplier_cost  || 0)
      monthMap[mk].fees    += Number(t.channel_fee    || 0)
      monthMap[mk].profit  += Number(t.true_profit    || 0)
      monthMap[mk].orders  += 1
    }

    for (const po of pos) {
      if (po.status === 'cancelled') continue
      const mk = monthKey(po.order_date)
      if (!monthMap[mk]) monthMap[mk] = { revenue: 0, cogs: 0, fees: 0, profit: 0, orders: 0, cogsPurchased: 0 }
      monthMap[mk].cogsPurchased += Number(po.total_cost || 0)
    }

    const monthly = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        revenue:        Math.round(v.revenue * 100) / 100,
        cogs:           Math.round(v.cogs    * 100) / 100,
        fees:           Math.round(v.fees    * 100) / 100,
        gross_profit:   Math.round((v.revenue - v.cogs) * 100) / 100,
        net_profit:     Math.round(v.profit * 100) / 100,
        margin:         v.revenue > 0 ? Math.round((v.profit / v.revenue) * 10000) / 100 : 0,
        orders:         v.orders,
        cogs_purchased: Math.round(v.cogsPurchased * 100) / 100,
      }))

    // Totals
    const totals = monthly.reduce((acc, m) => ({
      revenue:      acc.revenue      + m.revenue,
      cogs:         acc.cogs         + m.cogs,
      fees:         acc.fees         + m.fees,
      gross_profit: acc.gross_profit + m.gross_profit,
      net_profit:   acc.net_profit   + m.net_profit,
      orders:       acc.orders       + m.orders,
    }), { revenue: 0, cogs: 0, fees: 0, gross_profit: 0, net_profit: 0, orders: 0 })

    // Working capital estimate
    const openPoValue = pos
      .filter(p => !['received', 'cancelled'].includes(p.status))
      .reduce((s, p) => s + Number(p.total_cost || 0), 0)

    const last30Revenue = txs
      .filter(t => new Date(t.order_date) >= new Date(Date.now() - 30 * 86400000))
      .reduce((s, t) => s + Number(t.sale_price || 0), 0)

    const plan = (userRes.data?.plan || 'free') as 'free' | 'starter' | 'growth' | 'scale' | 'enterprise'
    const monthlyFee = ({ free: 0, starter: 79.99, growth: 199, scale: 599, enterprise: 1500 } as const)[plan] ?? 0

    return NextResponse.json({
      monthly,
      totals: {
        revenue:      Math.round(totals.revenue      * 100) / 100,
        cogs:         Math.round(totals.cogs         * 100) / 100,
        fees:         Math.round(totals.fees         * 100) / 100,
        gross_profit: Math.round(totals.gross_profit * 100) / 100,
        net_profit:   Math.round(totals.net_profit   * 100) / 100,
        orders:       totals.orders,
        margin:       totals.revenue > 0 ? Math.round((totals.net_profit / totals.revenue) * 10000) / 100 : 0,
      },
      workingCapital: {
        openPoCommitments: Math.round(openPoValue    * 100) / 100,
        last30Revenue:     Math.round(last30Revenue  * 100) / 100,
        platformFee:       monthlyFee,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
