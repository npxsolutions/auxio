import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { requireActiveOrg } from '@/app/lib/org/context'

const getSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const period = request.nextUrl.searchParams.get('period') || '30d'
    const now    = new Date()
    let   since  = new Date()
    if (period === '7d')   since.setDate(now.getDate() - 7)
    else if (period === '30d')  since.setDate(now.getDate() - 30)
    else if (period === '90d')  since.setDate(now.getDate() - 90)
    else if (period === '1y')   since.setFullYear(now.getFullYear() - 1)
    else since = new Date('2000-01-01')  // 'all'

    const [txRes, listingsRes, channelsRes, rulesRes] = await Promise.all([
      supabase.from('transactions')
        .select('channel, sale_price, true_profit, true_margin, order_date, sku, title, supplier_cost, channel_fee')
        .gte('order_date', since.toISOString())
        .order('order_date', { ascending: true }),
      supabase.from('listings').select('id, status'),
      supabase.from('channels').select('type, active'),
      supabase.from('feed_rules').select('id, active'),
    ])

    const txs = txRes.data || []

    // ── Totals ──
    const totalRevenue = txs.reduce((s, t) => s + Number(t.sale_price || 0), 0)
    const totalProfit  = txs.reduce((s, t) => s + Number(t.true_profit || 0), 0)
    const totalOrders  = txs.length
    const avgMargin    = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    // ── By channel ──
    const channelMap: Record<string, { revenue: number; profit: number; orders: number; margin: number }> = {}
    for (const t of txs) {
      const ch = t.channel || 'unknown'
      if (!channelMap[ch]) channelMap[ch] = { revenue: 0, profit: 0, orders: 0, margin: 0 }
      channelMap[ch].revenue += Number(t.sale_price || 0)
      channelMap[ch].profit  += Number(t.true_profit || 0)
      channelMap[ch].orders  += 1
    }
    const byChannel = Object.entries(channelMap).map(([channel, v]) => ({
      channel,
      revenue: Math.round(v.revenue * 100) / 100,
      profit:  Math.round(v.profit  * 100) / 100,
      orders:  v.orders,
      margin:  v.revenue > 0 ? Math.round((v.profit / v.revenue) * 10000) / 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue)

    // ── Time series (daily) ──
    const dayMap: Record<string, { revenue: number; profit: number; orders: number }> = {}
    for (const t of txs) {
      const day = t.order_date?.slice(0, 10) || '?'
      if (!dayMap[day]) dayMap[day] = { revenue: 0, profit: 0, orders: 0 }
      dayMap[day].revenue += Number(t.sale_price || 0)
      dayMap[day].profit  += Number(t.true_profit || 0)
      dayMap[day].orders  += 1
    }
    const timeSeries = Object.entries(dayMap).map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue * 100) / 100,
      profit:  Math.round(v.profit  * 100) / 100,
      orders:  v.orders,
    })).sort((a, b) => a.date.localeCompare(b.date))

    // ── Top SKUs ──
    const skuMap: Record<string, { title: string; revenue: number; profit: number; orders: number }> = {}
    for (const t of txs) {
      const key = t.sku || t.title || 'unknown'
      if (!skuMap[key]) skuMap[key] = { title: t.title || key, revenue: 0, profit: 0, orders: 0 }
      skuMap[key].revenue += Number(t.sale_price || 0)
      skuMap[key].profit  += Number(t.true_profit || 0)
      skuMap[key].orders  += 1
    }
    const topSkus = Object.entries(skuMap).map(([sku, v]) => ({
      sku,
      title:  v.title,
      revenue: Math.round(v.revenue * 100) / 100,
      profit:  Math.round(v.profit  * 100) / 100,
      orders:  v.orders,
      margin:  v.revenue > 0 ? Math.round((v.profit / v.revenue) * 10000) / 100 : 0,
    })).sort((a, b) => b.profit - a.profit).slice(0, 10)

    // ── Listing health ──
    const listings = listingsRes.data || []
    const listingHealth = {
      total:     listings.length,
      published: listings.filter(l => l.status === 'published').length,
      partial:   listings.filter(l => l.status === 'partially_published').length,
      draft:     listings.filter(l => l.status === 'draft').length,
    }

    // ── Platform stats ──
    const platformStats = {
      channels:    (channelsRes.data || []).filter(c => c.active).length,
      rules:       (rulesRes.data || []).filter(r => r.active).length,
      totalRules:  (rulesRes.data || []).length,
    }

    // ── Prev period comparison (same duration, prior window) ──
    const durationMs = now.getTime() - since.getTime()
    const prevSince  = new Date(since.getTime() - durationMs)
    const { data: prevTxs } = await supabase.from('transactions')
      .select('sale_price, true_profit')
      .gte('order_date', prevSince.toISOString())
      .lt('order_date', since.toISOString())

    const prevRevenue = (prevTxs || []).reduce((s, t) => s + Number(t.sale_price || 0), 0)
    const prevProfit  = (prevTxs || []).reduce((s, t) => s + Number(t.true_profit || 0), 0)
    const prevOrders  = (prevTxs || []).length

    const comparison = {
      revenueChange: prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10 : null,
      profitChange:  prevProfit  > 0 ? Math.round(((totalProfit  - prevProfit)  / prevProfit)  * 1000) / 10 : null,
      ordersChange:  prevOrders  > 0 ? Math.round(((totalOrders  - prevOrders)  / prevOrders)  * 1000) / 10 : null,
    }

    return NextResponse.json({
      period,
      totals: {
        revenue: Math.round(totalRevenue * 100) / 100,
        profit:  Math.round(totalProfit  * 100) / 100,
        orders:  totalOrders,
        margin:  Math.round(avgMargin    * 100) / 100,
      },
      comparison,
      byChannel,
      timeSeries,
      topSkus,
      listingHealth,
      platformStats,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
