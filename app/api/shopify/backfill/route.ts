import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { requireActiveOrg } from '@/app/lib/org/context'

// Lazy module-level clients (per repo rule)
const getAdminSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

const SHOPIFY_FEE_PCT = 0.029
const SHOPIFY_FEE_FLAT = 0.3
const BACKFILL_DAYS = 60
const MAX_PAGES = 25 // safety cap — ~250 * 25 = 6250 orders
const PAGE_SIZE = 250

function num(v: unknown): number {
  if (v === null || v === undefined) return 0
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}

type ShopifyOrder = {
  id: number | string
  total_price?: string | number
  total_tax?: string | number
  currency?: string
  financial_status?: string
  cancelled_at?: string | null
  created_at?: string
  processed_at?: string
  refunds?: Array<{ transactions?: Array<{ amount?: string; kind?: string }> }>
  line_items?: Array<{ sku?: string; title?: string }>
  shipping_address?: { country_code?: string | null } | null
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

// Parses Shopify's Link header for the next page URL
function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null
  const parts = linkHeader.split(',')
  for (const p of parts) {
    const m = p.match(/<([^>]+)>;\s*rel="next"/)
    if (m) return m[1]
  }
  return null
}

export async function POST(request: Request) {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = getAdminSupabase()
  // service-role — must filter explicitly
  const { data: channel, error: chErr } = await admin
    .from('channels')
    .select('shop_domain, access_token')
    .eq('organization_id', ctx.id)
    .eq('type', 'shopify')
    .eq('active', true)
    .maybeSingle()

  if (chErr || !channel?.shop_domain || !channel.access_token) {
    return NextResponse.json({ error: 'no_shopify_channel' }, { status: 400 })
  }

  const minDate = new Date(Date.now() - BACKFILL_DAYS * 86400_000).toISOString()
  let url: string | null = `https://${channel.shop_domain}/admin/api/2024-01/orders.json?status=any&limit=${PAGE_SIZE}&created_at_min=${encodeURIComponent(minDate)}`

  let imported = 0
  let pages = 0

  while (url && pages < MAX_PAGES) {
    const res: Response = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': channel.access_token, 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('Shopify backfill fetch failed:', res.status, text.slice(0, 200))
      return NextResponse.json({ error: 'shopify_fetch_failed', status: res.status }, { status: 502 })
    }
    const { orders } = (await res.json()) as { orders: ShopifyOrder[] }

    const rows = (orders || []).map((order) => {
      const gross = num(order.total_price)
      const tax = num(order.total_tax)
      const refunded = sumRefunds(order)
      const fee = gross > 0 ? gross * SHOPIFY_FEE_PCT + SHOPIFY_FEE_FLAT : 0
      const trueProfit = gross - tax - refunded - fee
      const trueMargin = gross > 0 ? trueProfit / gross : 0
      const first = order.line_items?.[0]
      const state = order.cancelled_at
        ? 'cancelled'
        : refunded > 0
          ? order.financial_status === 'refunded'
            ? 'refunded'
            : 'partially_refunded'
          : order.financial_status || 'pending'
      return {
        organization_id: ctx.id,
        user_id: ctx.user.id,
        channel: 'shopify',
        external_id: String(order.id),
        shop_domain: channel.shop_domain,
        sku: first?.sku ?? null,
        title: first?.title ?? null,
        sale_price: gross,
        supplier_cost: 0,
        channel_fee: fee,
        advertising_cost: 0,
        shipping_cost: 0,
        return_cost: 0,
        refunded_amount: refunded,
        gross_revenue: gross,
        true_profit: trueProfit,
        true_margin: trueMargin,
        currency: order.currency ?? null,
        order_state: state,
        order_date: order.processed_at || order.created_at || new Date().toISOString(),
        buyer_location: order.shipping_address?.country_code ?? null,
        updated_at: new Date().toISOString(),
      }
    })

    if (rows.length) {
      const { error: upErr } = await admin
        .from('transactions')
        .upsert(rows, { onConflict: 'user_id,external_id,channel' })
      if (upErr) {
        console.error('backfill upsert error:', upErr)
        return NextResponse.json({ error: 'upsert_failed' }, { status: 500 })
      }
      imported += rows.length
    }

    url = parseNextLink(res.headers.get('link'))
    pages++
  }

  return NextResponse.json({ ok: true, imported, pages, capped: pages >= MAX_PAGES && !!url })
}
