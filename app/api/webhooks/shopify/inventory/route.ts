import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyShopifyHmac } from '../../../shopify/webhooks/_verify'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

type InventoryLevel = {
  inventory_item_id?: number | string
  location_id?: number | string
  available?: number
  updated_at?: string
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const hmac = request.headers.get('x-shopify-hmac-sha256')
  const topic = request.headers.get('x-shopify-topic') || ''
  const shopDomain = request.headers.get('x-shopify-shop-domain') || ''
  const deliveryId =
    request.headers.get('x-shopify-webhook-id') || request.headers.get('x-shopify-event-id') || ''

  if (!verifyShopifyHmac(rawBody, hmac)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let level: InventoryLevel
  try {
    level = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Dedupe
  const receivedId = deliveryId || `inv:${level.inventory_item_id}:${level.location_id}:${level.updated_at}`
  const { error: dedupeErr } = await supabase.from('webhook_events_shopify').insert({
    received_id: receivedId,
    topic,
    shop_domain: shopDomain,
    raw_body: level as unknown as object,
  })
  if (dedupeErr && (dedupeErr as { code?: string }).code === '23505') {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  const { data: channel } = await supabase
    .from('channels')
    .select('user_id, access_token')
    .eq('shop_domain', shopDomain)
    .eq('type', 'shopify')
    .maybeSingle()

  if (!channel) {
    return NextResponse.json({ ok: true, skipped: 'unknown_shop' })
  }

  const userId = channel.user_id as string
  const newQty = level.available ?? 0

  // Resolve inventory_item_id -> variant -> product via Shopify REST.
  // We only need to find the listing by SKU or product external id. The cheapest
  // path: call /admin/api/2024-01/inventory_items/{id}.json to get sku, then match.
  let sku: string | null = null
  try {
    const res = await fetch(
      `https://${shopDomain}/admin/api/2024-01/inventory_items/${level.inventory_item_id}.json`,
      { headers: { 'X-Shopify-Access-Token': channel.access_token as string } },
    )
    if (res.ok) {
      const body = await res.json()
      sku = body?.inventory_item?.sku ?? null
    }
  } catch (err) {
    console.warn('[shopify:inventory-webhook] resolve sku failed:', err)
  }

  if (!sku) {
    return NextResponse.json({ ok: true, skipped: 'no_sku' })
  }

  // Find listing by sku for this user
  const { data: listing } = await supabase
    .from('listings')
    .select('id')
    .eq('user_id', userId)
    .eq('sku', sku)
    .maybeSingle()

  if (!listing) {
    return NextResponse.json({ ok: true, skipped: 'no_listing' })
  }

  const listingId = listing.id as string

  await supabase
    .from('listings')
    .update({ quantity: newQty, updated_at: new Date().toISOString() })
    .eq('id', listingId)

  await supabase.from('channel_sync_state').upsert(
    {
      listing_id: listingId,
      user_id: userId,
      channel_type: 'shopify',
      last_synced_at: new Date().toISOString(),
      last_synced_quantity: newQty,
    },
    { onConflict: 'listing_id,channel_type' },
  )

  return NextResponse.json({ ok: true })
}
