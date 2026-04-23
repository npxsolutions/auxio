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
    // ORG CONTEXT — every scoped fetch below is filtered by RLS via the active
    // org membership. No .eq('user_id', ...) needed on any of these queries.
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()

    const now       = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

    // Parallel fetch all transaction windows — RLS scopes each by active org
    const [
      { data: txnsToday },
      { data: txnsMonth },
      { data: txns30d },
      { data: txnsPrevMonth },
      { data: listings },
      { data: channels },
      { data: pendingActions },
    ] = await Promise.all([
      supabase.from('transactions').select('gross_revenue, true_profit, channel')
        .gte('order_date', todayStart),
      supabase.from('transactions').select('gross_revenue, true_profit, channel')
        .gte('order_date', monthStart),
      supabase.from('transactions').select('gross_revenue, true_profit, advertising_cost, channel, sku, title, order_date')
        .gte('order_date', thirtyDaysAgo),
      supabase.from('transactions').select('gross_revenue, true_profit')
        .gte('order_date', prevMonthStart).lte('order_date', prevMonthEnd),
      supabase.from('listings').select('id, status, listing_channels(status)'),
      supabase.from('channels').select('type, active, last_synced_at').eq('active', true),
      supabase.from('agent_pending_actions').select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ])

    // ── Today ──
    const revenueToday = (txnsToday || []).reduce((s, t) => s + (t.gross_revenue || 0), 0)
    const profitToday  = (txnsToday || []).reduce((s, t) => s + (t.true_profit  || 0), 0)
    const ordersToday  = (txnsToday || []).length

    // ── This month ──
    const revenueMonth = (txnsMonth || []).reduce((s, t) => s + (t.gross_revenue || 0), 0)
    const profitMonth  = (txnsMonth || []).reduce((s, t) => s + (t.true_profit  || 0), 0)
    const ordersMonth  = (txnsMonth || []).length

    // ── Previous month (for WoW/MoM comparison) ──
    const revenuePrevMonth = (txnsPrevMonth || []).reduce((s, t) => s + (t.gross_revenue || 0), 0)

    // ── 30-day avg margin ──
    const totalRev30 = (txns30d || []).reduce((s, t) => s + (t.gross_revenue || 0), 0)
    const totalPro30 = (txns30d || []).reduce((s, t) => s + (t.true_profit  || 0), 0)
    const avgMargin  = totalRev30 > 0 ? (totalPro30 / totalRev30) * 100 : 0

    // ── Blended ROAS (30d) ──
    const totalAdSpend = (txns30d || []).reduce((s, t) => s + (t.advertising_cost || 0), 0)
    const blendedRoas  = totalAdSpend > 0 ? totalRev30 / totalAdSpend : 0

    // ── Channel breakdown (30d) ──
    const channelMap: Record<string, { revenue: number; profit: number; orders: number }> = {}
    for (const t of txns30d || []) {
      const ch = t.channel || 'unknown'
      if (!channelMap[ch]) channelMap[ch] = { revenue: 0, profit: 0, orders: 0 }
      channelMap[ch].revenue += t.gross_revenue || 0
      channelMap[ch].profit  += t.true_profit  || 0
      channelMap[ch].orders  += 1
    }
    const topChannel = Object.entries(channelMap).sort((a, b) => b[1].revenue - a[1].revenue)[0]?.[0] || null

    // ── Top products by profit (30d) ──
    const skuMap: Record<string, { sku: string; title: string; revenue: number; profit: number; orders: number }> = {}
    for (const t of txns30d || []) {
      const key = t.sku || t.title || 'unknown'
      if (!skuMap[key]) skuMap[key] = { sku: t.sku || '', title: t.title || key, revenue: 0, profit: 0, orders: 0 }
      skuMap[key].revenue += t.gross_revenue || 0
      skuMap[key].profit  += t.true_profit  || 0
      skuMap[key].orders  += 1
    }
    const topProducts = Object.values(skuMap)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5)
      .map(p => ({ ...p, margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0 }))

    // ── Listing health ──
    const totalListings     = (listings || []).length
    const publishedListings = (listings || []).filter(l =>
      (l.listing_channels as any[])?.some((lc: any) => lc.status === 'published')
    ).length
    const draftListings = totalListings - publishedListings

    // ── Active alerts (simple rule-based) ──
    let activeAlerts = 0
    // Check for channels with no recent sync (>24h)
    for (const ch of channels || []) {
      const lastSync = ch.last_synced_at ? new Date(ch.last_synced_at) : null
      if (!lastSync || Date.now() - lastSync.getTime() > 24 * 60 * 60 * 1000) activeAlerts++
    }
    // Check for margin below 10%
    if (avgMargin > 0 && avgMargin < 10) activeAlerts++

    const momChange = revenuePrevMonth > 0 ? ((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 100 : 0

    return NextResponse.json({
      revenueToday,  profitToday,  ordersToday,
      revenueMonth,  profitMonth,  ordersMonth,
      avgMargin,     blendedRoas,  topChannel,
      totalRev30,    totalPro30,
      channelBreakdown: channelMap,
      topProducts,
      totalListings, publishedListings, draftListings,
      activeAlerts,
      pendingActions: (pendingActions as any)?.count || 0,
      momChange,
      connectedChannels: (channels || []).map(c => c.type),
    })
  } catch (err: any) {
    console.error('[dashboard:stats]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
