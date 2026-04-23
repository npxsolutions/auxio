import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyShopifyHmac } from '../../../shopify/webhooks/_verify'

// Lazy module-level client (per repo rule — never instantiate at top level)
const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

const SHOPIFY_FEE_PCT = 0.029
const SHOPIFY_FEE_FLAT = 0.3

type ShopifyOrder = {
  id: number | string
  total_price?: string | number
  subtotal_price?: string | number
  total_tax?: string | number
  total_discounts?: string | number
  currency?: string
  financial_status?: string
  fulfillment_status?: string | null
  cancelled_at?: string | null
  created_at?: string
  processed_at?: string
  updated_at?: string
  refunds?: Array<{ transactions?: Array<{ amount?: string; kind?: string }> }>
  line_items?: Array<{ sku?: string; title?: string; price?: string; quantity?: number }>
  shipping_address?: { country_code?: string | null } | null
}

function num(v: unknown): number {
  if (v === null || v === undefined) return 0
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}

function sumRefunds(order: ShopifyOrder): number {
  let total = 0
  for (const r of order.refunds ?? []) {
    for (const t of r.transactions ?? []) {
      if (t.kind === 'refund' || t.kind === 'void') total += num(t.amount)
    }
  }
  return total
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

  let order: ShopifyOrder
  try {
    order = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Idempotency — dedupe on Shopify delivery id + topic
  const receivedId = deliveryId || `${order.id}:${topic}`
  const { error: dedupeErr } = await supabase.from('webhook_events_shopify').insert({
    received_id: receivedId,
    topic,
    shop_domain: shopDomain,
    raw_body: order as unknown as object,
  })
  if (dedupeErr) {
    // Unique violation -> already processed
    if ((dedupeErr as { code?: string }).code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true })
    }
    console.error('webhook_events_shopify insert error:', dedupeErr)
    // fall through — best effort
  }

  // Resolve channel -> user + org
  const { data: channel, error: chErr } = await supabase
    .from('channels')
    .select('user_id, organization_id')
    .eq('shop_domain', shopDomain)
    .eq('type', 'shopify')
    .maybeSingle()

  if (chErr || !channel) {
    console.error('No matching shopify channel for domain:', shopDomain, chErr)
    // 200 so Shopify does not retry forever on an unknown shop
    return NextResponse.json({ ok: true, skipped: 'unknown_shop' })
  }

  const userId = channel.user_id as string
  const orgId  = channel.organization_id as string
  const externalId = String(order.id)

  // Compute economics
  const gross = num(order.total_price)
  const tax = num(order.total_tax)
  const refunded = sumRefunds(order)
  const estimatedChannelFee = gross > 0 ? gross * SHOPIFY_FEE_PCT + SHOPIFY_FEE_FLAT : 0
  const trueProfit = gross - tax - refunded - estimatedChannelFee
  const trueMargin = gross > 0 ? trueProfit / gross : 0

  const firstItem = order.line_items?.[0]
  const orderState =
    topic === 'orders/cancelled' || order.cancelled_at
      ? 'cancelled'
      : topic === 'orders/refunded' || refunded > 0
        ? order.financial_status === 'refunded'
          ? 'refunded'
          : 'partially_refunded'
        : order.financial_status || 'pending'

  const row = {
    organization_id: orgId,
    user_id: userId,
    channel: 'shopify',
    external_id: externalId,
    shop_domain: shopDomain,
    sku: firstItem?.sku ?? null,
    title: firstItem?.title ?? null,
    sale_price: gross,
    supplier_cost: 0,
    channel_fee: estimatedChannelFee,
    advertising_cost: 0,
    shipping_cost: 0,
    return_cost: 0,
    refunded_amount: refunded,
    gross_revenue: gross,
    true_profit: trueProfit,
    true_margin: trueMargin,
    currency: order.currency ?? null,
    order_state: orderState,
    order_date: order.processed_at || order.created_at || new Date().toISOString(),
    buyer_location: order.shipping_address?.country_code ?? null,
    updated_at: new Date().toISOString(),
  }

  const { error: upsertErr } = await supabase
    .from('transactions')
    .upsert(row, { onConflict: 'user_id,external_id,channel' })

  if (upsertErr) {
    console.error('transactions upsert error:', upsertErr)
    return NextResponse.json({ error: 'upsert_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
