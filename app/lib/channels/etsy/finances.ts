/**
 * Etsy finances adapter — payout-reconciled fee fetcher.
 *
 * Etsy reports per-shop fees via the payment-account ledger:
 *   GET /v3/application/shops/{shop_id}/payment-account/ledger-entries
 *
 * Each entry has an entry_type (Sale, Refund, Marketing, BillFee,
 * RegulatoryOperatingFee, ProcessingFee, etc.) and a reference_id that
 * — for sale-related fees — points back to the receipt id we already
 * persist as transactions.external_id.
 *
 * Caveats:
 *   - Sale entries themselves don't carry the fees; fees come as
 *     separate ledger rows referencing the same receipt. We sum them.
 *   - Some fees (subscription, ad campaigns, regulatory) aren't
 *     attributable to a single receipt — those land in fees_breakdown
 *     under their entry_type but aren't deducted from any specific
 *     transaction row.
 *
 * Required scope: transactions_r (already granted by /api/etsy/connect).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { etsyHeaders, getEtsyAccessToken } from '../../etsy/auth'
import { syncFetch } from '../../sync/http'

const ETSY_BASE = 'https://openapi.etsy.com/v3/application'
const PAGE_LIMIT = 100

type LedgerEntry = {
  entry_id?: number
  entry_type?: string
  reference_id?: string | null
  amount?: number
  divisor?: number
  currency?: string
  reason?: string | null
  description?: string | null
  date?: number
}

type FetchResult =
  | { ok: true; entries: LedgerEntry[] }
  | { ok: false; reason: 'not_connected' | 'needs_reauth' | 'unknown'; raw?: Record<string, unknown> }

export async function fetchEtsyFinances(
  admin: SupabaseClient,
  organizationId: string,
  windowDays = 30,
): Promise<FetchResult> {
  const { data: channel } = await admin
    .from('channels')
    .select('user_id, access_token, refresh_token, metadata, shop_domain')
    .eq('organization_id', organizationId)
    .eq('type', 'etsy')
    .eq('active', true)
    .maybeSingle()

  if (!channel?.user_id) {
    return { ok: false, reason: 'not_connected' }
  }

  const meta = (channel.metadata as Record<string, unknown> | null) ?? {}
  const shopId = (meta.etsy_shop_id as string | undefined) ?? (channel.shop_domain as string | null) ?? null
  const etsyUserId = meta.etsy_user_id as string | number | undefined
  if (!shopId || !etsyUserId) {
    return { ok: false, reason: 'not_connected', raw: { stage: 'missing_shop_or_user' } }
  }

  const token = await getEtsyAccessToken(
    {
      user_id:       channel.user_id as string,
      access_token:  (channel.access_token as string | null) ?? null,
      refresh_token: (channel.refresh_token as string | null) ?? null,
      metadata:      meta,
    },
    admin,
  )
  if (!token) return { ok: false, reason: 'needs_reauth', raw: { stage: 'token_refresh' } }

  // Window is in epoch seconds for Etsy.
  const minCreated = Math.floor((Date.now() - windowDays * 86_400_000) / 1000)

  const entries: LedgerEntry[] = []
  let offset = 0

  for (let page = 0; page < 20; page++) {
    const url = new URL(`${ETSY_BASE}/shops/${encodeURIComponent(shopId)}/payment-account/ledger-entries`)
    url.searchParams.set('min_created', String(minCreated))
    url.searchParams.set('limit',  String(PAGE_LIMIT))
    url.searchParams.set('offset', String(offset))

    const res = await syncFetch(url.toString(), {
      headers: etsyHeaders({ userId: etsyUserId, accessToken: token.accessToken }),
      label: 'etsy.finances.ledger',
    }).catch((err) => ({ ok: false, status: 0, text: () => Promise.resolve(String(err)) } as Response))

    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: 'needs_reauth', raw: { http: res.status } }
    }
    if (!res.ok) {
      return { ok: false, reason: 'unknown', raw: { http: res.status } }
    }

    const json = await res.json() as { results?: LedgerEntry[]; count?: number }
    const batch = json.results ?? []
    entries.push(...batch)
    if (batch.length < PAGE_LIMIT) break
    offset += PAGE_LIMIT
  }

  return { ok: true, entries }
}

/**
 * Reconcile Etsy ledger entries against the local `transactions` table.
 * Groups fee-type entries by reference_id (the receipt id) and writes
 * fees_breakdown + channel_fee for each matched transaction.
 *
 * Entries without a reference_id (subscription, regulatory) are aggregated
 * but not applied to specific orders — they roll up to org-level expense
 * reporting rather than per-SKU contribution margin.
 */
export async function reconcileEtsyFees(
  admin: SupabaseClient,
  organizationId: string,
  entries: LedgerEntry[],
): Promise<{ reconciled: number; missing_local: number; org_level_fees: number }> {
  let reconciled = 0
  let missingLocal = 0
  let orgLevelFees = 0

  // Group by reference_id; only consider negative-amount (DEBIT) entries
  // — these are the fees deducted, vs. positive Sale entries.
  const byReceipt = new Map<string, LedgerEntry[]>()
  for (const e of entries) {
    const amt = Number(e.amount ?? 0) / Number(e.divisor ?? 100)
    if (!Number.isFinite(amt) || amt >= 0) continue
    if (!e.reference_id) {
      orgLevelFees++
      continue
    }
    const list = byReceipt.get(e.reference_id) ?? []
    list.push(e)
    byReceipt.set(e.reference_id, list)
  }

  for (const [receiptId, group] of byReceipt) {
    const breakdown: Record<string, number> = {}
    let totalFees = 0
    for (const e of group) {
      const amt = Math.abs(Number(e.amount ?? 0)) / Number(e.divisor ?? 100)
      const key = (e.entry_type ?? 'other').toLowerCase()
      breakdown[key] = (breakdown[key] ?? 0) + amt
      totalFees += amt
    }

    const { data: row, error } = await admin
      .from('transactions')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('channel', 'etsy')
      .eq('external_id', receiptId)
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

  return { reconciled, missing_local: missingLocal, org_level_fees: orgLevelFees }
}
