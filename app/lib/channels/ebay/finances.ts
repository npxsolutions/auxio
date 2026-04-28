/**
 * eBay Finances API — payout-reconciled fee fetcher.
 *
 * Replaces the rate-based estimate (gross × user-set fee %) with the actual
 * per-fee-type breakdown eBay charged. This is the wedge claim: "we don't
 * estimate, we reconcile."
 *
 * Endpoints used:
 *   GET /sell/finances/v1/transaction         — list transactions (sales,
 *                                                refunds, credits, dispute,
 *                                                shipping_label, etc.)
 *   GET /sell/finances/v1/payout              — list payouts (the deposit
 *                                                aggregations we surface in
 *                                                the payouts table)
 *
 * Required scope: sell.finances. Existing pre-2026-04 OAuth grants don't
 * include it. Returns status='needs_reauth' on 401/403 so the UI can prompt
 * a reconnect.
 *
 * Docs: https://developer.ebay.com/api-docs/sell/finances/resources/transaction/methods/getTransactions
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { ebayHeaders, getEbayAccessToken } from '../../ebay/auth'
import { syncFetch } from '../../sync/http'

const BASE = 'https://apiz.ebay.com/sell/finances/v1'

type EbayFee = {
  feeType?: string
  feeMemo?: string
  amount?: { value?: string; currency?: string }
}

type EbayTxn = {
  transactionId?: string
  transactionType?: string
  transactionStatus?: string
  transactionDate?: string
  orderId?: string
  totalFeeAmount?: { value?: string; currency?: string }
  totalFeeBasisAmount?: { value?: string; currency?: string }
  amount?: { value?: string; currency?: string }
  bookingEntry?: 'CREDIT' | 'DEBIT'
  feeType?: string
  references?: Array<{ referenceId?: string; referenceType?: string }>
  orderLineItems?: Array<{
    lineItemId?: string
    marketplaceFees?: EbayFee[]
  }>
}

type EbayPayout = {
  payoutId?: string
  payoutStatus?: 'INITIATED' | 'SUCCEEDED' | 'RETRYABLE_FAILED' | 'TERMINAL_FAILED' | 'REVERSED' | 'FAILED'
  amount?: { value?: string; currency?: string }
  payoutDate?: string
  lastAttemptedPayoutDate?: string
  totalAmount?: { value?: string; currency?: string }
  transactionCount?: number
}

type FetchResult =
  | { ok: true; transactions: EbayTxn[]; payouts: EbayPayout[] }
  | { ok: false; reason: 'not_connected' | 'needs_reauth' | 'unknown'; raw?: Record<string, unknown> }

/**
 * Fetch eBay finances data for an org over a sliding window. Returns
 * transactions (per-order fees) and payouts (deposit-level aggregation).
 */
export async function fetchEbayFinances(
  admin: SupabaseClient,
  organizationId: string,
  windowDays = 30,
): Promise<FetchResult> {
  const { data: channel } = await admin
    .from('channels')
    .select('user_id, access_token, refresh_token, metadata')
    .eq('organization_id', organizationId)
    .eq('type', 'ebay')
    .eq('active', true)
    .maybeSingle()

  if (!channel?.user_id) {
    return { ok: false, reason: 'not_connected' }
  }

  const token = await getEbayAccessToken(
    {
      user_id:       channel.user_id as string,
      access_token:  (channel.access_token as string | null) ?? null,
      refresh_token: (channel.refresh_token as string | null) ?? null,
      metadata:      (channel.metadata as Record<string, unknown> | null) ?? {},
    },
    admin,
  )
  if (!token) return { ok: false, reason: 'needs_reauth', raw: { stage: 'token_refresh' } }

  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString()
  const filter = `transactionDate:[${since}..]`

  const transactions: EbayTxn[] = []
  const payouts: EbayPayout[] = []

  // ── Transactions (paginated; eBay limits to 1000/page, we cap at 5 pages) ──
  let offset = 0
  for (let page = 0; page < 5; page++) {
    const url = new URL(`${BASE}/transaction`)
    url.searchParams.set('filter', filter)
    url.searchParams.set('limit', '1000')
    url.searchParams.set('offset', String(offset))

    const res = await syncFetch(url.toString(), {
      headers: ebayHeaders({ accessToken: token.accessToken }),
      label: 'ebay.finances.transactions',
    }).catch((err) => ({ ok: false, status: 0, text: () => Promise.resolve(String(err)) } as Response))

    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: 'needs_reauth', raw: { http: res.status, stage: 'transactions' } }
    }
    if (!res.ok) {
      return { ok: false, reason: 'unknown', raw: { http: res.status, stage: 'transactions' } }
    }

    const json = await res.json() as { transactions?: EbayTxn[]; total?: number }
    const batch = json.transactions ?? []
    transactions.push(...batch)
    if (batch.length < 1000) break
    offset += 1000
  }

  // ── Payouts (one page is enough for 30 days for almost every seller) ────
  {
    const url = new URL(`${BASE}/payout`)
    url.searchParams.set('filter', `payoutDate:[${since}..]`)
    url.searchParams.set('limit', '200')

    const res = await syncFetch(url.toString(), {
      headers: ebayHeaders({ accessToken: token.accessToken }),
      label: 'ebay.finances.payouts',
    }).catch((err) => ({ ok: false, status: 0, text: () => Promise.resolve(String(err)) } as Response))

    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: 'needs_reauth', raw: { http: res.status, stage: 'payouts' } }
    }
    if (res.ok) {
      const json = await res.json() as { payouts?: EbayPayout[] }
      payouts.push(...(json.payouts ?? []))
    }
    // If payouts fail but transactions succeeded, continue — transactions are
    // the wedge data; payouts are the receivables sugar.
  }

  return { ok: true, transactions, payouts }
}

/**
 * Reconcile eBay transactions against the local `transactions` table —
 * replaces the estimated channel_fee with the actual per-order fee, and
 * stores the per-fee-type breakdown in fees_breakdown for surfacing.
 *
 * Returns the count of transactions reconciled.
 */
export async function reconcileEbayFees(
  admin: SupabaseClient,
  organizationId: string,
  txns: EbayTxn[],
): Promise<{ reconciled: number; missing_local: number }> {
  let reconciled = 0
  let missingLocal = 0

  // Group by order id — eBay finances returns multiple line items per order.
  const byOrder = new Map<string, EbayTxn[]>()
  for (const t of txns) {
    const orderId = t.orderId ?? t.references?.find((r) => r.referenceType === 'ORDER')?.referenceId
    if (!orderId) continue
    const list = byOrder.get(orderId) ?? []
    list.push(t)
    byOrder.set(orderId, list)
  }

  for (const [orderId, group] of byOrder) {
    const totalFees = group.reduce((sum, g) => sum + Number(g.totalFeeAmount?.value ?? 0), 0)
    const breakdown: Record<string, number> = {}
    for (const t of group) {
      for (const li of t.orderLineItems ?? []) {
        for (const f of li.marketplaceFees ?? []) {
          const k = (f.feeType ?? 'other').toLowerCase()
          breakdown[k] = (breakdown[k] ?? 0) + Number(f.amount?.value ?? 0)
        }
      }
    }

    // Local rows for this eBay order — external_id format from sync route is
    // `ebay-{orderId}-{lineItemId}`. Update all line items in one shot.
    const { data: rows, error } = await admin
      .from('transactions')
      .select('id, external_id, sale_price')
      .eq('organization_id', organizationId)
      .eq('channel', 'ebay')
      .like('external_id', `ebay-${orderId}-%`)

    if (error || !rows?.length) {
      missingLocal++
      continue
    }

    // Distribute total fees across line items proportional to sale price.
    const totalSale = rows.reduce((s, r) => s + Number(r.sale_price ?? 0), 0)
    for (const r of rows) {
      const share = totalSale > 0 ? Number(r.sale_price) / totalSale : 1 / rows.length
      const channelFee = totalFees * share

      const { error: upErr } = await admin
        .from('transactions')
        .update({
          channel_fee:        channelFee,
          fees_breakdown:     breakdown,
          fees_reconciled_at: new Date().toISOString(),
        })
        .eq('id', r.id)
      if (!upErr) reconciled++
    }
  }

  return { reconciled, missing_local: missingLocal }
}

/**
 * Upsert eBay payouts into the local `payouts` table for receivables
 * visibility. Uses (organization_id, channel, external_id) as the conflict
 * key — same payout from a re-fetch is idempotent.
 */
export async function upsertEbayPayouts(
  admin: SupabaseClient,
  organizationId: string,
  payouts: EbayPayout[],
): Promise<number> {
  if (payouts.length === 0) return 0

  const rows = payouts
    .filter((p) => p.payoutId)
    .map((p) => {
      const status = mapPayoutStatus(p.payoutStatus)
      const totalGross = Number(p.totalAmount?.value ?? p.amount?.value ?? 0)
      const net = Number(p.amount?.value ?? 0)
      const fees = Math.max(0, totalGross - net)
      return {
        organization_id: organizationId,
        channel:         'ebay',
        external_id:     p.payoutId!,
        status,
        gross_amount:    totalGross,
        fee_amount:      fees,
        refund_amount:   0,
        net_amount:      net,
        currency:        p.amount?.currency ?? 'USD',
        payout_eta:      p.payoutDate ?? null,
        paid_at:         status === 'paid' ? (p.lastAttemptedPayoutDate ?? p.payoutDate ?? null) : null,
        raw:             p as Record<string, unknown>,
      }
    })

  const { error } = await admin.from('payouts').upsert(rows, {
    onConflict: 'organization_id,channel,external_id',
  })
  if (error) {
    console.error('[ebay:finances] payout upsert failed:', error.message)
    return 0
  }
  return rows.length
}

function mapPayoutStatus(s: EbayPayout['payoutStatus']): 'pending' | 'in_transit' | 'paid' | 'failed' {
  switch (s) {
    case 'SUCCEEDED':         return 'paid'
    case 'INITIATED':         return 'in_transit'
    case 'RETRYABLE_FAILED':
    case 'TERMINAL_FAILED':
    case 'REVERSED':
    case 'FAILED':            return 'failed'
    default:                  return 'pending'
  }
}
