import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuthWithOrg } from '../../lib/auth'
import { checkApiRateLimit } from '../../../../lib/rate-limit/api-public'

export async function GET(request: NextRequest) {
  try {
    const { organizationId, error, supabase } = await requireApiAuthWithOrg(request)
    if (error) return error

    const rl = await checkApiRateLimit(request)
    if (!rl.ok) return rl.response!

    const sp      = request.nextUrl.searchParams
    const days    = Math.min(parseInt(sp.get('days') ?? '30'), 365)
    const channel = sp.get('channel')
    const since   = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase!
      .from('transactions')
      .select('gross_revenue, true_profit, channel, advertising_cost, created_at')
      .eq('organization_id', organizationId!)
      .gte('created_at', since)

    if (channel) query = query.eq('channel', channel)

    const { data, error: dbError } = await query
    if (dbError) {
      console.error('[api/v1/profit/summary] db error', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    const txns    = data ?? []
    const revenue = txns.reduce((s, t) => s + (Number(t.gross_revenue)    || 0), 0)
    const profit  = txns.reduce((s, t) => s + (Number(t.true_profit)      || 0), 0)
    const adSpend = txns.reduce((s, t) => s + (Number(t.advertising_cost) || 0), 0)
    const margin  = revenue > 0 ? (profit / revenue) * 100 : 0

    const byChannel: Record<string, { revenue: number; profit: number; orders: number }> = {}
    for (const t of txns) {
      const ch = t.channel || 'unknown'
      if (!byChannel[ch]) byChannel[ch] = { revenue: 0, profit: 0, orders: 0 }
      byChannel[ch].revenue += Number(t.gross_revenue) || 0
      byChannel[ch].profit  += Number(t.true_profit)   || 0
      byChannel[ch].orders  += 1
    }

    return NextResponse.json({
      data: {
        period_days:   days,
        orders:        txns.length,
        gross_revenue: Math.round(revenue * 100) / 100,
        true_profit:   Math.round(profit  * 100) / 100,
        ad_spend:      Math.round(adSpend * 100) / 100,
        margin_pct:    Math.round(margin  * 10)  / 10,
        by_channel:    byChannel,
      },
    })
  } catch (err) {
    console.error('[api/v1/profit/summary] error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
