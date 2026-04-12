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

    const since90 = new Date()
    since90.setDate(since90.getDate() - 90)

    const [txRes, invRes] = await Promise.all([
      supabase.from('transactions')
        .select('sku, title, order_date, sale_price, supplier_cost')
        .eq('user_id', user.id)
        .gte('order_date', since90.toISOString())
        .order('order_date', { ascending: true }),
      supabase.from('inventory')
        .select('sku, stock_level, reorder_point, reorder_qty')
        .eq('user_id', user.id),
    ])

    const txs = txRes.data || []
    const inv  = invRes.data || []

    // Build stock map
    const stockMap: Record<string, { stock: number; reorder_point: number; reorder_qty: number }> = {}
    for (const i of inv) {
      stockMap[i.sku] = {
        stock:         Number(i.stock_level  || 0),
        reorder_point: Number(i.reorder_point || 0),
        reorder_qty:   Number(i.reorder_qty  || 50),
      }
    }

    // Aggregate sales per SKU
    const skuMap: Record<string, { title: string; unitsSold: number; revenue: number; cogs: number; firstDate: string; lastDate: string }> = {}
    for (const t of txs) {
      const sku = t.sku || 'UNKNOWN'
      if (!skuMap[sku]) skuMap[sku] = { title: t.title || sku, unitsSold: 0, revenue: 0, cogs: 0, firstDate: t.order_date, lastDate: t.order_date }
      skuMap[sku].unitsSold += 1
      skuMap[sku].revenue   += Number(t.sale_price   || 0)
      skuMap[sku].cogs      += Number(t.supplier_cost || 0)
      if (t.order_date > skuMap[sku].lastDate) skuMap[sku].lastDate = t.order_date
    }

    const forecasts = Object.entries(skuMap).map(([sku, d]) => {
      const days      = Math.max(1, Math.round((new Date(d.lastDate).getTime() - new Date(d.firstDate).getTime()) / 86400000) + 1)
      const dailyRate = d.unitsSold / days
      const weeklyRate = dailyRate * 7
      const monthlyRate = dailyRate * 30

      const stock      = stockMap[sku]?.stock         ?? 0
      const reorderPt  = stockMap[sku]?.reorder_point ?? Math.ceil(dailyRate * 14)
      const reorderQty = stockMap[sku]?.reorder_qty   ?? Math.ceil(monthlyRate * 2)
      const daysStock  = dailyRate > 0 ? Math.round(stock / dailyRate) : 999
      const risk: 'critical' | 'low' | 'ok' =
        daysStock <= 7 ? 'critical' : daysStock <= 21 ? 'low' : 'ok'

      return {
        sku,
        title:        d.title,
        unitsSold90d: d.unitsSold,
        dailyRate:    Math.round(dailyRate * 100) / 100,
        weeklyRate:   Math.round(weeklyRate * 10) / 10,
        monthlyRate:  Math.round(monthlyRate * 10) / 10,
        stock,
        daysStock:    daysStock > 999 ? null : daysStock,
        reorderPoint: reorderPt,
        reorderQty,
        risk,
        suggestedPoQty: risk !== 'ok' ? reorderQty : 0,
        avgRevPerUnit: d.unitsSold > 0 ? Math.round(d.revenue / d.unitsSold * 100) / 100 : 0,
      }
    }).sort((a, b) => {
      const rOrder = { critical: 0, low: 1, ok: 2 }
      return rOrder[a.risk] - rOrder[b.risk] || b.unitsSold90d - a.unitsSold90d
    })

    const summary = {
      total:    forecasts.length,
      critical: forecasts.filter(f => f.risk === 'critical').length,
      low:      forecasts.filter(f => f.risk === 'low').length,
      ok:       forecasts.filter(f => f.risk === 'ok').length,
    }

    return NextResponse.json({ forecasts, summary })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
