import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyShopifyHmac } from '../../../shopify/webhooks/_verify'
import { validateForChannel } from '@/app/lib/feed/validator'
import { onShopifyProductChange } from '@/app/lib/sync/sync-engine'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

type ShopifyProduct = {
  id: number | string
  title?: string
  body_html?: string
  vendor?: string
  product_type?: string
  status?: string
  images?: Array<{ src?: string }>
  variants?: Array<{
    id?: number | string
    sku?: string
    price?: string
    compare_at_price?: string | null
    inventory_quantity?: number
    barcode?: string | null
    weight_grams?: number | null
    grams?: number | null
  }>
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

  let product: ShopifyProduct
  try {
    product = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Dedupe
  const receivedId = deliveryId || `${product.id}:${topic}`
  const { error: dedupeErr } = await supabase.from('webhook_events_shopify').insert({
    received_id: receivedId,
    topic,
    shop_domain: shopDomain,
    raw_body: product as unknown as object,
  })
  if (dedupeErr && (dedupeErr as { code?: string }).code === '23505') {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  const { data: channel } = await supabase
    .from('channels')
    .select('user_id')
    .eq('shop_domain', shopDomain)
    .eq('type', 'shopify')
    .maybeSingle()

  if (!channel) {
    console.error('[shopify:products-webhook] unknown shop:', shopDomain)
    return NextResponse.json({ ok: true, skipped: 'unknown_shop' })
  }

  const userId = channel.user_id as string
  const externalId = String(product.id)
  const firstVariant = product.variants?.[0]
  const price = firstVariant?.price ? parseFloat(firstVariant.price) : 0
  const compare = firstVariant?.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null
  const qty = firstVariant?.inventory_quantity ?? 0
  const sku = firstVariant?.sku ?? null
  const weight = firstVariant?.weight_grams ?? firstVariant?.grams ?? null
  const images = (product.images ?? []).map(i => i.src).filter(Boolean) as string[]

  if (topic === 'products/delete') {
    // Mark the listing_channels row as unpublished rather than deleting the listing.
    const { error } = await supabase
      .from('listing_channels')
      .update({ status: 'unpublished', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('channel_type', 'shopify')
      .eq('channel_listing_id', externalId)
    if (error) console.error('[shopify:products-webhook] delete update:', error)
    return NextResponse.json({ ok: true, deleted: true })
  }

  // Find existing listing_channels row by external id
  const { data: existingLc } = await supabase
    .from('listing_channels')
    .select('listing_id')
    .eq('user_id', userId)
    .eq('channel_type', 'shopify')
    .eq('channel_listing_id', externalId)
    .maybeSingle()

  let listingId = existingLc?.listing_id as string | undefined

  const listingPayload = {
    user_id: userId,
    title: product.title ?? 'Untitled',
    description: product.body_html ?? '',
    price,
    compare_price: compare,
    sku,
    brand: product.vendor ?? '',
    category: product.product_type ?? '',
    quantity: qty,
    weight_grams: weight,
    images,
    status: product.status === 'active' ? 'published' : 'draft',
    updated_at: new Date().toISOString(),
  }

  if (listingId) {
    const { error } = await supabase.from('listings').update(listingPayload).eq('id', listingId)
    if (error) console.error('[shopify:products-webhook] listing update:', error)
  } else {
    const { data: created, error } = await supabase
      .from('listings')
      .insert(listingPayload)
      .select('id')
      .single()
    if (error || !created) {
      console.error('[shopify:products-webhook] listing insert:', error)
      return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
    }
    listingId = created.id as string
  }

  await supabase.from('listing_channels').upsert(
    {
      listing_id: listingId,
      user_id: userId,
      channel_type: 'shopify',
      channel_listing_id: externalId,
      status: product.status === 'active' ? 'published' : 'draft',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,channel_type,channel_listing_id' },
  )

  await supabase.from('channel_sync_state').upsert(
    {
      listing_id: listingId,
      user_id: userId,
      channel_type: 'shopify',
      last_synced_at: new Date().toISOString(),
      last_synced_price: price,
      last_synced_quantity: qty,
      last_synced_title: product.title ?? '',
      last_synced_description: product.body_html ?? '',
      sync_attempts: 0,
      last_error: null,
    },
    { onConflict: 'listing_id,channel_type' },
  )

  // Revalidate listing health for any channel mappings on this listing.
  // Best-effort — never block the webhook ack on validation failures.
  if (listingId) {
    try {
      await validateForChannel(listingId, 'ebay')
    } catch (err) {
      console.error('[feed:validator] post-webhook revalidate failed:', err)
    }

    // Auto-push to eBay if the listing is already published there.
    // Fire-and-forget so we don't block the webhook 200 response to Shopify.
    onShopifyProductChange({ userId, listingId }).catch(err => {
      console.error('[sync:engine] post-webhook eBay re-push failed:', err)
    })
  }

  return NextResponse.json({ ok: true })
}
