import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = Date.now()
    const d37 = new Date(now - 37 * 86_400_000).toISOString()

    // Pull last 37 days of transactions with SKU
    // (37 = 30d stats window + 7d sparkline buffer)
    const { data: rows, error } = await supabase
      .from('transactions')
      .select('sku, gross_revenue, true_profit, order_date, channel')
      .eq('user_id', user.id)
      .gte('order_date', d37)

    if (error) throw error

    type StatEntry = {
      units_7d:    number
      units_30d:   number
      revenue_7d:  number
      revenue_30d: number
      profit_30d:  number
      sparkline:   number[]  // 7 values, index 0 = 6 days ago, index 6 = today
      channels_30d: Set<string>
    }

    const map: Record<string, StatEntry> = {}

    for (const row of rows || []) {
      const sku = (row.sku || '').trim()
      if (!sku) continue

      if (!map[sku]) {
        map[sku] = {
          units_7d: 0, units_30d: 0,
          revenue_7d: 0, revenue_30d: 0,
          profit_30d: 0,
          sparkline: [0, 0, 0, 0, 0, 0, 0],
          channels_30d: new Set(),
        }
      }

      const daysAgo = (now - new Date(row.order_date).getTime()) / 86_400_000

      if (daysAgo < 30) {
        map[sku].units_30d++
        map[sku].revenue_30d += row.gross_revenue || 0
        map[sku].profit_30d  += row.true_profit   || 0
        if (row.channel) map[sku].channels_30d.add(row.channel)
      }

      if (daysAgo < 7) {
        map[sku].units_7d++
        map[sku].revenue_7d += row.gross_revenue || 0
        const idx = 6 - Math.floor(daysAgo)
        if (idx >= 0 && idx < 7) map[sku].sparkline[idx]++
      }
    }

    // Serialise (Set → Array, compute derived fields)
    const stats: Record<string, {
      units_7d:    number
      units_30d:   number
      revenue_7d:  number
      revenue_30d: number
      margin_30d:  number | null
      velocity:    number          // units per day (7d average)
      days_supply: number | null   // filled in on client with quantity
      sparkline:   number[]
      channels_30d: string[]
    }> = {}

    for (const [sku, s] of Object.entries(map)) {
      stats[sku] = {
        units_7d:     s.units_7d,
        units_30d:    s.units_30d,
        revenue_7d:   s.revenue_7d,
        revenue_30d:  s.revenue_30d,
        margin_30d:   s.revenue_30d > 0 ? (s.profit_30d / s.revenue_30d) * 100 : null,
        velocity:     s.units_7d / 7,   // avg units/day over past 7 days
        days_supply:  null,             // client fills: quantity / velocity
        sparkline:    s.sparkline,
        channels_30d: Array.from(s.channels_30d),
      }
    }

    return NextResponse.json({ stats })
  } catch (err: any) {
    console.error('[listings/stats]', err.message)
    return NextResponse.json({ stats: {} })
  }
}
