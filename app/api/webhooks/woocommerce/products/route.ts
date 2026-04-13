import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyWooHmac } from '../_verify'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

type WooProduct = {
  id: number | string
  name?: string
  description?: string
  status?: string
  sku?: string
  price?: string
  regular_price?: string
  stock_quantity?: number | null
  images?: Array<{ src?: string }>
  categories?: Array<{ name?: string }>
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-wc-webhook-signature')
  const topic = request.headers.get('x-wc-webhook-topic') || ''
  const source = request.headers.get('x-wc-webhook-source') || ''
  const deliveryId =
    request.headers.get('x-wc-webhook-delivery-id') ||
    request.headers.get('x-wc-webhook-id') ||
    ''

  const supabase = getSupabase()
  const siteUrl = source.replace(/\/$/, '')

  let secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || ''
  let channelUserId: string | null = null
  if (siteUrl) {
    const { data: ch } = await supabase
      .from('channels')
      .select('user_id, metadata')
      .eq('type', 'woocommerce')
      .eq('shop_domain', siteUrl)
      .maybeSingle()
    if (ch) {
      channelUserId = ch.user_id as string
      const meta = (ch.metadata ?? {}) as { webhook_secret?: string }
      if (meta.webhook_secret) secret = meta.webhook_secret
    }
  }

  if (!verifyWooHmac(rawBody, signature, secret)) {
    console.error('[webhook:woocommerce:products] hmac mismatch for', source)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let product: WooProduct
  try {
    product = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const receivedId = deliveryId || `${product.id}:${topic}`
  const { error: dedupeErr } = await supabase.from('webhook_events_woocommerce').insert({
    received_id: receivedId,
    topic,
    shop_domain: siteUrl,
    raw_body: product as unknown as object,
  })
  if (dedupeErr && (dedupeErr as { code?: string }).code === '23505') {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  if (!channelUserId) {
    return NextResponse.json({ ok: true, skipped: 'unknown_site' })
  }

  const externalId = String(product.id)

  if (topic === 'product.deleted' || topic === 'products.deleted') {
    await supabase
      .from('listing_channels')
      .update({ status: 'unpublished', updated_at: new Date().toISOString() })
      .eq('user_id', channelUserId)
      .eq('channel_type', 'woocommerce')
      .eq('channel_listing_id', externalId)
    return NextResponse.json({ ok: true, deleted: true })
  }

  const price = Number(product.price ?? product.regular_price ?? 0)
  const qty = product.stock_quantity ?? 0
  const images = (product.images ?? []).map(i => i.src).filter(Boolean) as string[]
  const status = product.status === 'publish' ? 'published' : 'draft'

  const { data: existingLc } = await supabase
    .from('listing_channels')
    .select('listing_id')
    .eq('user_id', channelUserId)
    .eq('channel_type', 'woocommerce')
    .eq('channel_listing_id', externalId)
    .maybeSingle()

  let listingId = existingLc?.listing_id as string | undefined
  const listingPayload = {
    user_id: channelUserId,
    title: product.name ?? 'Untitled',
    description: product.description ?? '',
    price,
    sku: product.sku ?? null,
    quantity: qty,
    images,
    category: product.categories?.[0]?.name ?? '',
    status,
    updated_at: new Date().toISOString(),
  }

  if (listingId) {
    await supabase.from('listings').update(listingPayload).eq('id', listingId)
  } else {
    const { data: created, error } = await supabase
      .from('listings')
      .insert(listingPayload)
      .select('id')
      .single()
    if (error || !created) {
      console.error('[webhook:woocommerce:products] listing insert:', error)
      return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
    }
    listingId = created.id as string
  }

  await supabase.from('listing_channels').upsert(
    {
      listing_id: listingId,
      user_id: channelUserId,
      channel_type: 'woocommerce',
      channel_listing_id: externalId,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,channel_type,channel_listing_id' },
  )
  return NextResponse.json({ ok: true })
}
