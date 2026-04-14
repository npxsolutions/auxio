import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Nightly 03:15 UTC. Aggregates yesterday's transactions into metrics_daily.
// Keyed on (user_id, product_id, date) where product_id = transactions.sku
// (fallback 'unknown' when sku is null/empty). Revenue uses gross_revenue,
// falling back to sale_price. Idempotent via ON CONFLICT DO UPDATE.

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdmin()
  const started = Date.now()

  // yesterday (UTC) as YYYY-MM-DD
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const target = `${yyyy}-${mm}-${dd}`

  const { data, error } = await supabase.rpc('aggregate_metrics_daily', { p_date: target })

  if (error) {
    console.error('[cron:aggregations-metrics-daily] rpc error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const upserted = Array.isArray(data) ? (data[0] as { upserted_count?: number })?.upserted_count ?? 0 : 0
  const ms = Date.now() - started
  console.log(`[cron:aggregations-metrics-daily] date=${target} upserted=${upserted} ms=${ms}`)

  return NextResponse.json({ ok: true, date: target, upserted, ms })
}

export async function GET(request: Request) {
  return POST(request)
}
