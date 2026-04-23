import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { withRateLimit } from '../../../../lib/rate-limit/channel'
import { syncFetch } from '../../../../lib/sync/http'
import { verifyBigCommerceHmac } from '../_verify'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

// BigCommerce webhook payload is a notification envelope — it does NOT include
// the full resource. We extract the store + order id, then fetch the order.
type BcWebhookEnvelope = {
  scope?: string
  store_id?: string
  producer?: string // e.g. "stores/abc123"
  hash?: string
  created_at?: number
  data?: { type?: string; id?: number | string }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-bc-webhook-hmac-sha256')

  const secret = process.env.BIGCOMMERCE_CLIENT_SECRET || ''
  if (!verifyBigCommerceHmac(rawBody, signature, secret)) {
    console.error('[webhook:bigcommerce:orders] hmac mismatch')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let envelope: BcWebhookEnvelope
  try {
    envelope = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const storeHash = (envelope.producer || '').replace(/^stores\//, '')
  const orderId = envelope.data?.id ? String(envelope.data.id) : ''
  const topic = envelope.scope || ''
  if (!storeHash || !orderId) {
    return NextResponse.json({ ok: true, skipped: 'no_id' })
  }

  const supabase = getSupabase()

  // Dedupe
  const receivedId = `${envelope.hash || ''}:${storeHash}:${orderId}:${envelope.created_at || ''}`
  const { error: dedupeErr } = await supabase.from('webhook_events_bigcommerce').insert({
    received_id: receivedId,
    topic,
    shop_domain: storeHash,
    raw_body: envelope as unknown as object,
  })
  if (dedupeErr && (dedupeErr as { code?: string }).code === '23505') {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  // Resolve channel
  const { data: channel } = await supabase
    .from('channels')
    .select('user_id, organization_id, access_token')
    .eq('type', 'bigcommerce')
    .eq('shop_domain', storeHash)
    .maybeSingle()
  if (!channel) {
    return NextResponse.json({ ok: true, skipped: 'unknown_store' })
  }

  const userId = channel.user_id as string
  const orgId = channel.organization_id as string
  const token = channel.access_token as string
  const clientId = process.env.BIGCOMMERCE_CLIENT_ID!
  if (!token || !clientId) {
    return NextResponse.json({ ok: true, skipped: 'missing_creds' })
  }

  // Fetch the order
  const url = `https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}`
  const res = await withRateLimit('bigcommerce', storeHash, () =>
    syncFetch(url, {
      headers: {
        'X-Auth-Token': token,
        'X-Auth-Client': clientId,
        Accept: 'application/json',
      },
      label: `bigcommerce.order-fetch:${storeHash}`,
    }),
  )
  if (!res.ok) {
    console.error('[webhook:bigcommerce:orders] fetch failed:', res.status)
    return NextResponse.json({ ok: true, skipped: 'fetch_failed' })
  }
  const order = (await res.json()) as {
    id: number
    status?: string
    currency_code?: string
    total_inc_tax?: string | number
    refunded_amount?: string | number
    date_created?: string
    billing_address?: { country_iso2?: string }
  }

  const gross = Number(order.total_inc_tax ?? 0)
  const refunded = Number(order.refunded_amount ?? 0)
  const row = {
    organization_id: orgId,
    user_id: userId,
    channel: 'bigcommerce',
    external_id: String(order.id),
    shop_domain: storeHash,
    sale_price: gross,
    gross_revenue: gross,
    refunded_amount: refunded,
    currency: order.currency_code ?? null,
    order_state: order.status ?? 'pending',
    order_date: order.date_created || new Date().toISOString(),
    buyer_location: order.billing_address?.country_iso2 ?? null,
    updated_at: new Date().toISOString(),
  }
  const { error: upsertErr } = await supabase
    .from('transactions')
    .upsert(row, { onConflict: 'user_id,external_id,channel' })
  if (upsertErr) {
    console.error('[webhook:bigcommerce:orders] upsert:', upsertErr)
    return NextResponse.json({ error: 'upsert_failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
