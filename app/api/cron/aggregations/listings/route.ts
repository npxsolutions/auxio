import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Nightly 03:00 UTC. Recomputes listings v2 metrics:
//   margin_pct, sold_30d, sell_through_30d, days_of_cover, last_sold_at
//
// Join logic: transactions.sku <-> listings.sku scoped by user_id.
// (transactions has no direct listing_id FK; sku is populated on ~99.9% of
// listings and ~83% of transactions, so SKU-within-user is the strongest
// signal available. If SKU matching proves unreliable we can layer a
// listing_channels.channel_listing_id <-> transactions.external_id fallback.)
//
// Heavy lifting runs in a single SECURITY DEFINER SQL function so the whole
// update happens in one round-trip and is idempotent.

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

  const { data, error } = await supabase.rpc('aggregate_listings_v2')

  if (error) {
    console.error('[cron:aggregations-listings] rpc error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const updated = Array.isArray(data) ? (data[0] as { updated_count?: number })?.updated_count ?? 0 : 0
  const ms = Date.now() - started
  console.log(`[cron:aggregations-listings] updated=${updated} ms=${ms}`)

  return NextResponse.json({ ok: true, updated, ms })
}

export async function GET(request: Request) {
  return POST(request)
}
