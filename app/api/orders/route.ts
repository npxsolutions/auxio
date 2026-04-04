import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = request.nextUrl
    const channel  = searchParams.get('channel')   // 'shopify' | 'ebay' | 'amazon' | null
    const days     = parseInt(searchParams.get('days') || '30')
    const page     = parseInt(searchParams.get('page') || '1')
    const pageSize = 50

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('order_date', since)
      .order('order_date', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (channel) query = query.eq('channel', channel)

    const { data, count, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Aggregate summary stats across the full date range (not just the page)
    const { data: summary, error: summaryError } = await supabase
      .from('transactions')
      .select('channel, gross_revenue, true_profit')
      .eq('user_id', user.id)
      .gte('order_date', since)

    if (summaryError) console.error('[orders] summary error:', summaryError.message)

    const stats = {
      totalRevenue: 0,
      totalProfit:  0,
      totalOrders:  count || 0,
      byChannel:    {} as Record<string, { revenue: number; profit: number; orders: number }>,
    }

    for (const row of summary || []) {
      stats.totalRevenue += row.gross_revenue || 0
      stats.totalProfit  += row.true_profit   || 0
      const ch = row.channel as string
      if (!stats.byChannel[ch]) stats.byChannel[ch] = { revenue: 0, profit: 0, orders: 0 }
      stats.byChannel[ch].revenue += row.gross_revenue || 0
      stats.byChannel[ch].profit  += row.true_profit   || 0
      stats.byChannel[ch].orders  += 1
    }

    console.log(`[orders] user=${user.id} days=${days} channel=${channel || 'all'} total=${count}`)
    return NextResponse.json({ orders: data, stats, total: count, page, pageSize })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
