import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { withRateLimit } from '../../../../lib/rate-limit/channel'
import { syncFetch } from '../../../../lib/sync/http'
import { verifyBigCommerceHmac } from '../_verify'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

type BcWebhookEnvelope = {
  scope?: string
  producer?: string
  hash?: string
  created_at?: number
  data?: { type?: string; id?: number | string; inventory?: unknown }
}

type BcProductV3 = {
  id: number
  name?: string
  description?: string
  sku?: string
  price?: number
  inventory_level?: number
  is_visible?: boolean
  images?: Array<{ url_standard?: string; url_thumbnail?: string }>
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-bc-webhook-hmac-sha256')
  const secret = process.env.BIGCOMMERCE_CLIENT_SECRET || ''
  if (!verifyBigCommerceHmac(rawBody, signature, secret)) {
    console.error('[webhook:bigcommerce:products] hmac mismatch')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let envelope: BcWebhookEnvelope
  try {
    envelope = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const storeHash = (envelope.producer || '').replace(/^stores\//, '')
  const productId = envelope.data?.id ? String(envelope.data.id) : ''
  const topic = envelope.scope || ''
  if (!storeHash || !productId) return NextResponse.json({ ok: true, skipped: 'no_id' })

  const supabase = getSupabase()
  const receivedId = `${envelope.hash || ''}:${storeHash}:${productId}:${envelope.created_at || ''}`
  const { error: dedupeErr } = await supabase.from('webhook_events_bigcommerce').insert({
    received_id: receivedId,
    topic,
    shop_domain: storeHash,
    raw_body: envelope as unknown as object,
  })
  if (dedupeErr && (dedupeErr as { code?: string }).code === '23505') {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  const { data: channel } = await supabase
    .from('channels')
    .select('user_id, access_token')
    .eq('type', 'bigcommerce')
    .eq('shop_domain', storeHash)
    .maybeSingle()
  if (!channel) return NextResponse.json({ ok: true, skipped: 'unknown_store' })

  const userId = channel.user_id as string
  const token = channel.access_token as string
  const clientId = process.env.BIGCOMMERCE_CLIENT_ID!
  if (!token || !clientId) return NextResponse.json({ ok: true, skipped: 'missing_creds' })

  if (topic === 'store/product/deleted') {
    await supabase
      .from('listing_channels')
      .update({ status: 'unpublished', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('channel_type', 'bigcommerce')
      .eq('channel_listing_id', productId)
    return NextResponse.json({ ok: true, deleted: true })
  }

  // Fetch product (v3)
  const url = `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products/${productId}?include=images`
  const res = await withRateLimit('bigcommerce', storeHash, () =>
    syncFetch(url, {
      headers: {
        'X-Auth-Token': token,
        'X-Auth-Client': clientId,
        Accept: 'application/json',
      },
      label: `bigcommerce.product-fetch:${storeHash}`,
    }),
  )
  if (!res.ok) return NextResponse.json({ ok: true, skipped: 'fetch_failed' })
  const body = (await res.json()) as { data?: BcProductV3 }
  const p = body.data
  if (!p) return NextResponse.json({ ok: true, skipped: 'no_data' })

  const externalId = String(p.id)
  const price = Number(p.price ?? 0)
  const qty = p.inventory_level ?? 0
  const images = (p.images ?? [])
    .map(i => i.url_standard || i.url_thumbnail)
    .filter(Boolean) as string[]
  const status = p.is_visible ? 'published' : 'draft'

  const { data: existingLc } = await supabase
    .from('listing_channels')
    .select('listing_id')
    .eq('user_id', userId)
    .eq('channel_type', 'bigcommerce')
    .eq('channel_listing_id', externalId)
    .maybeSingle()

  let listingId = existingLc?.listing_id as string | undefined
  const listingPayload = {
    user_id: userId,
    title: p.name ?? 'Untitled',
    description: p.description ?? '',
    price,
    sku: p.sku ?? null,
    quantity: qty,
    images,
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
      console.error('[webhook:bigcommerce:products] listing insert:', error)
      return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
    }
    listingId = created.id as string
  }

  await supabase.from('listing_channels').upsert(
    {
      listing_id: listingId,
      user_id: userId,
      channel_type: 'bigcommerce',
      channel_listing_id: externalId,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,channel_type,channel_listing_id' },
  )
  return NextResponse.json({ ok: true })
}
