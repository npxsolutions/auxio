import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyWooHmac } from '../_verify'

// Lazy service-role client per repo rule.
const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

type WooOrder = {
  id: number | string
  status?: string
  currency?: string
  total?: string
  total_tax?: string
  date_created_gmt?: string
  date_paid_gmt?: string | null
  billing?: { country?: string }
  line_items?: Array<{ sku?: string; name?: string; price?: string; quantity?: number }>
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

  // Resolve webhook secret — first try per-channel metadata, fall back to env.
  const siteUrl = source.replace(/\/$/, '')
  let secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || ''
  let channelUserId: string | null = null
  let channelOrgId: string | null = null
  if (siteUrl) {
    const { data: ch } = await supabase
      .from('channels')
      .select('user_id, organization_id, metadata')
      .eq('type', 'woocommerce')
      .eq('shop_domain', siteUrl)
      .maybeSingle()
    if (ch) {
      channelUserId = ch.user_id as string
      channelOrgId = ch.organization_id as string
      const meta = (ch.metadata ?? {}) as { webhook_secret?: string }
      if (meta.webhook_secret) secret = meta.webhook_secret
    }
  }

  if (!verifyWooHmac(rawBody, signature, secret)) {
    console.error('[webhook:woocommerce:orders] hmac mismatch for', source)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let order: WooOrder
  try {
    order = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const receivedId = deliveryId || `${order.id}:${topic}`
  const { error: dedupeErr } = await supabase.from('webhook_events_woocommerce').insert({
    received_id: receivedId,
    topic,
    shop_domain: siteUrl,
    raw_body: order as unknown as object,
  })
  if (dedupeErr && (dedupeErr as { code?: string }).code === '23505') {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  if (!channelUserId) {
    console.error('[webhook:woocommerce:orders] unknown site:', source)
    return NextResponse.json({ ok: true, skipped: 'unknown_site' })
  }

  const gross = Number(order.total ?? 0)
  const firstItem = order.line_items?.[0]
  const row = {
    organization_id: channelOrgId,
    user_id: channelUserId,
    channel: 'woocommerce',
    external_id: String(order.id),
    shop_domain: siteUrl,
    sku: firstItem?.sku ?? null,
    title: firstItem?.name ?? null,
    sale_price: gross,
    gross_revenue: gross,
    currency: order.currency ?? null,
    order_state: order.status ?? 'pending',
    order_date: order.date_paid_gmt || order.date_created_gmt || new Date().toISOString(),
    buyer_location: order.billing?.country ?? null,
    updated_at: new Date().toISOString(),
  }

  const { error: upsertErr } = await supabase
    .from('transactions')
    .upsert(row, { onConflict: 'user_id,external_id,channel' })
  if (upsertErr) {
    console.error('[webhook:woocommerce:orders] upsert:', upsertErr)
    return NextResponse.json({ error: 'upsert_failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
