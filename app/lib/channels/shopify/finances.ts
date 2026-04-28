/**
 * Shopify finances adapter — payout-reconciled fee fetcher.
 *
 * Replaces the rate-based estimate (gross × 2.9% + 30¢) with the actual
 * gateway fees Shopify reports on each order's transactions[].fees[].
 *
 * Endpoints used:
 *   GET /admin/api/{version}/orders.json   — list orders in the window
 *   GET /admin/api/{version}/orders/{id}/transactions.json
 *                                           — per-order gateway fees
 *
 * Caveats:
 *   - Fees only populate for shops on Shopify Payments. Stripe/PayPal/
 *     third-party gateways don't report fees through this endpoint;
 *     those orders fall back to the estimate.
 *   - We don't pull /shopify_payments/payouts.json (also Shopify-Payments-
 *     only). Payouts are derived from the reconciled order ledger instead.
 *
 * Auth: existing channels.access_token + shop_domain (no extra scope
 * required vs. the existing order sync).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { syncFetch } from '../../sync/http'

const API_VERSION = '2024-10'

type ShopifyFee = {
  type?: string
  amount?: string
  rate?: string
  flat_fee?: string
}

type ShopifyTransaction = {
  id?: number
  status?: string
  kind?: string
  gateway?: string
  amount?: string
  fees?: ShopifyFee[]
  processed_at?: string | null
  created_at?: string | null
}

type ShopifyOrder = {
  id?: number
  name?: string
  created_at?: string
  total_price?: string
  currency?: string
}

type FetchResult =
  | { ok: true; orders: Array<{ order: ShopifyOrder; transactions: ShopifyTransaction[] }> }
  | { ok: false; reason: 'not_connected' | 'unauthorized' | 'unknown'; raw?: Record<string, unknown> }

export async function fetchShopifyFinances(
  admin: SupabaseClient,
  organizationId: string,
  windowDays = 30,
): Promise<FetchResult> {
  const { data: channel } = await admin
    .from('channels')
    .select('access_token, shop_domain')
    .eq('organization_id', organizationId)
    .eq('type', 'shopify')
    .eq('active', true)
    .maybeSingle()

  if (!channel?.access_token || !channel.shop_domain) {
    return { ok: false, reason: 'not_connected' }
  }

  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString()
  const headers: Record<string, string> = {
    'X-Shopify-Access-Token': channel.access_token as string,
    'Content-Type':           'application/json',
  }

  // ── 1. List orders in the window ───────────────────────────────────────
  const ordersUrl = `https://${channel.shop_domain}/admin/api/${API_VERSION}/orders.json`
    + `?status=any&created_at_min=${encodeURIComponent(since)}&limit=250`
    + `&fields=id,name,created_at,total_price,currency`

  const ordersRes = await syncFetch(ordersUrl, { headers, label: 'shopify.finances.orders' })
    .catch((err) => ({ ok: false, status: 0, text: () => Promise.resolve(String(err)) } as Response))

  if (ordersRes.status === 401 || ordersRes.status === 403) {
    return { ok: false, reason: 'unauthorized', raw: { http: ordersRes.status, stage: 'orders' } }
  }
  if (!ordersRes.ok) {
    return { ok: false, reason: 'unknown', raw: { http: ordersRes.status, stage: 'orders' } }
  }
  const ordersJson = await ordersRes.json() as { orders?: ShopifyOrder[] }
  const orders = ordersJson.orders ?? []

  // ── 2. Per-order transactions (where the fees live) ────────────────────
  // Throttled by syncFetch's existing rate-limit handling. For shops with
  // hundreds of orders/day this can take ~1-2 minutes — acceptable for a
  // nightly cron.
  const out: Array<{ order: ShopifyOrder; transactions: ShopifyTransaction[] }> = []
  for (const order of orders) {
    if (!order.id) continue
    const txnUrl = `https://${channel.shop_domain}/admin/api/${API_VERSION}/orders/${order.id}/transactions.json`
    const r = await syncFetch(txnUrl, { headers, label: 'shopify.finances.txn' })
      .catch(() => null)
    if (!r || !r.ok) {
      // skip the order — keep going, partial reconcile is better than none
      continue
    }
    const j = await r.json() as { transactions?: ShopifyTransaction[] }
    out.push({ order, transactions: j.transactions ?? [] })
  }

  return { ok: true, orders: out }
}

/**
 * Reconcile Shopify orders against the local `transactions` table —
 * replaces the rate-based channel_fee with the sum of actual gateway fees,
 * stores the per-fee-type breakdown in fees_breakdown.
 */
export async function reconcileShopifyFees(
  admin: SupabaseClient,
  organizationId: string,
  orders: Array<{ order: ShopifyOrder; transactions: ShopifyTransaction[] }>,
): Promise<{ reconciled: number; missing_local: number; missing_fees: number }> {
  let reconciled = 0
  let missingLocal = 0
  let missingFees = 0

  for (const { order, transactions } of orders) {
    if (!order.id) continue

    // Sum fees across SUCCESS / SUCCESSFUL transactions only. Refunds are
    // tracked separately on Shopify; fees on refund txns are negative.
    const breakdown: Record<string, number> = {}
    let totalFees = 0
    for (const t of transactions) {
      const status = (t.status ?? '').toLowerCase()
      if (status !== 'success') continue
      for (const f of t.fees ?? []) {
        const key = (f.type ?? 'gateway').toLowerCase()
        const amt = Number(f.amount ?? 0)
        if (!Number.isFinite(amt)) continue
        breakdown[key] = (breakdown[key] ?? 0) + amt
        totalFees += amt
      }
    }

    if (totalFees === 0) {
      // Either non-Shopify-Payments shop or fees not reported yet.
      // Leave the existing rate-based estimate alone.
      missingFees++
      continue
    }

    // Local row external_id format from sync route: String(order.id)
    const { data: row, error } = await admin
      .from('transactions')
      .select('id, sale_price')
      .eq('organization_id', organizationId)
      .eq('channel', 'shopify')
      .eq('external_id', String(order.id))
      .maybeSingle()

    if (error || !row) {
      missingLocal++
      continue
    }

    const { error: upErr } = await admin
      .from('transactions')
      .update({
        channel_fee:        totalFees,
        fees_breakdown:     breakdown,
        fees_reconciled_at: new Date().toISOString(),
      })
      .eq('id', row.id)
    if (!upErr) reconciled++
  }

  return { reconciled, missing_local: missingLocal, missing_fees: missingFees }
}
