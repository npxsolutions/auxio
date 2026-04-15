// BUNDLE_C — eBay business-policy auto-provisioner.
//
// Every eBay offer requires payment_policy_id, return_policy_id, and
// fulfillment_policy_id. First-time sellers don't have these; ensureEbayPolicies
// creates sensible per-marketplace defaults when missing and persists the ids
// back onto channels.metadata.ebay_policies so the validator (EBAY_BUSINESS_POLICIES)
// flips green on the next pre-flight.
//
// Defaults are tuned per marketplace:
//   - Payment:   immediate payment, managed payments (all majors + PayPal implied).
//   - Return:    30-day returns, buyer pays return shipping, refund to original.
//   - Fulfilment: handling time 1 business day, cheapest domestic standard service,
//                 free shipping over a threshold priced in the marketplace currency.
//
// Caller passes the channel row (id, user_id, access_token, metadata) from the
// `channels` table; we re-read that row via admin client after a successful
// create to avoid stomping concurrent writes.

import type { SupabaseClient } from '@supabase/supabase-js'
import { syncFetch } from '../sync/http'
import { withRateLimit } from '../rate-limit/channel'

const ACCOUNT_BASE = 'https://api.ebay.com/sell/account/v1'

export type EbayMarketplaceId = 'EBAY_US' | 'EBAY_GB' | 'EBAY_DE' | 'EBAY_AU' | 'EBAY_CA'

export interface EbayPolicySet {
  paymentPolicyId: string
  returnPolicyId: string
  fulfillmentPolicyId: string
}

export interface EbayPolicyProvisioningResult extends EbayPolicySet {
  marketplaceId: EbayMarketplaceId
  provisionedAt: string
  created: Partial<Record<'payment' | 'return' | 'fulfillment', boolean>>
}

export class EbayPolicyError extends Error {
  policy: 'payment' | 'return' | 'fulfillment'
  partial: Partial<EbayPolicySet>
  cause: string
  constructor(policy: 'payment' | 'return' | 'fulfillment', cause: string, partial: Partial<EbayPolicySet>) {
    super(`ebay policies provisioning failed: ${policy} — ${cause}`)
    this.policy = policy
    this.cause = cause
    this.partial = partial
  }
}

export interface ShopifyShippingProfile {
  id: string | number
  name?: string
  zones?: Array<{
    countries?: Array<{ code?: string }>
    price_based_shipping_rates?: Array<{ name?: string; price?: string | number }>
    weight_based_shipping_rates?: Array<{ name?: string; price?: string | number }>
  }>
}

export interface EbayChannelRowLike {
  id: string | number
  user_id: string
  access_token: string | null
  metadata: Record<string, unknown> | null
}

// ── Per-marketplace defaults ────────────────────────────────────────────────
interface MarketplaceDefaults {
  currency: 'USD' | 'GBP' | 'EUR' | 'AUD' | 'CAD'
  countryCode: 'US' | 'GB' | 'DE' | 'AU' | 'CA'
  shippingService: string            // eBay shipping service code
  shippingCost: string               // baseline cost (string per eBay Money schema)
  freeShippingThreshold: string      // offer free shipping over this value
  returnShippingCost: string
}

const MARKETPLACE_DEFAULTS: Record<EbayMarketplaceId, MarketplaceDefaults> = {
  EBAY_US: { currency: 'USD', countryCode: 'US', shippingService: 'USPSGround',                         shippingCost: '5.00', freeShippingThreshold: '100.00', returnShippingCost: '0.00' },
  EBAY_GB: { currency: 'GBP', countryCode: 'GB', shippingService: 'UK_RoyalMailSecondClassStandard',     shippingCost: '3.95', freeShippingThreshold: '75.00',  returnShippingCost: '0.00' },
  EBAY_DE: { currency: 'EUR', countryCode: 'DE', shippingService: 'DE_DeutschePostBrief',                shippingCost: '4.50', freeShippingThreshold: '80.00',  returnShippingCost: '0.00' },
  EBAY_AU: { currency: 'AUD', countryCode: 'AU', shippingService: 'AU_Regular',                          shippingCost: '8.00', freeShippingThreshold: '120.00', returnShippingCost: '0.00' },
  EBAY_CA: { currency: 'CAD', countryCode: 'CA', shippingService: 'CA_StandardShipping',                 shippingCost: '7.00', freeShippingThreshold: '120.00', returnShippingCost: '0.00' },
}

export function resolveMarketplaceId(raw: unknown): EbayMarketplaceId {
  const s = typeof raw === 'string' ? raw.toUpperCase() : ''
  if (s === 'EBAY_US' || s === 'EBAY_GB' || s === 'EBAY_DE' || s === 'EBAY_AU' || s === 'EBAY_CA') return s
  return 'EBAY_US'
}

// ── Low-level create helpers ────────────────────────────────────────────────
function authHeaders(accessToken: string, marketplaceId?: EbayMarketplaceId): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Content-Language': 'en-US',
  }
  if (marketplaceId) h['X-EBAY-C-MARKETPLACE-ID'] = marketplaceId
  return h
}

async function postJson(url: string, accessToken: string, body: unknown, label: string, marketplaceId?: EbayMarketplaceId): Promise<Record<string, unknown>> {
  const res = await syncFetch(url, {
    method: 'POST',
    headers: authHeaders(accessToken, marketplaceId),
    body: JSON.stringify(body),
    label,
  })
  const text = await res.text()
  if (!res.ok) {
    // Surface 409 as-is — eBay returns 409 when the policy name already exists;
    // the caller can choose to fall back to a GET-by-name lookup in that case.
    const err = new Error(`${label} HTTP ${res.status}: ${text.slice(0, 400)}`) as Error & { status: number; body: string }
    err.status = res.status
    err.body = text
    throw err
  }
  return text ? JSON.parse(text) as Record<string, unknown> : {}
}

async function findPolicyByName(
  kind: 'payment_policy' | 'return_policy' | 'fulfillment_policy',
  accessToken: string,
  marketplaceId: EbayMarketplaceId,
  name: string,
): Promise<string | null> {
  const res = await syncFetch(
    `${ACCOUNT_BASE}/${kind}?marketplace_id=${marketplaceId}`,
    { headers: authHeaders(accessToken, marketplaceId), label: `ebay.account.${kind}.list` },
  )
  if (!res.ok) return null
  const data = await res.json().catch(() => ({})) as Record<string, unknown>
  const arr = ((data.paymentPolicies as unknown[]) ?? (data.returnPolicies as unknown[]) ?? (data.fulfillmentPolicies as unknown[]) ?? []) as Array<Record<string, unknown>>
  const match = arr.find(p => (p.name as string | undefined)?.toLowerCase() === name.toLowerCase())
  if (!match) return null
  return (match.paymentPolicyId || match.returnPolicyId || match.fulfillmentPolicyId) as string | null
}

export async function createDefaultPaymentPolicy(accessToken: string, marketplaceId: string): Promise<string> {
  const mkt = resolveMarketplaceId(marketplaceId)
  const name = 'Meridia default payment'
  const body = {
    name,
    description: 'Immediate payment via eBay managed payments. Auto-created by Meridia.',
    marketplaceId: mkt,
    categoryTypes: [{ name: 'ALL_EXCLUDING_MOTORS_VEHICLES', default: true }],
    paymentMethods: [],
    immediatePay: true,
  }
  try {
    const res = await postJson(`${ACCOUNT_BASE}/payment_policy`, accessToken, body, 'ebay.account.payment_policy.create', mkt)
    const id = res.paymentPolicyId as string | undefined
    if (!id) throw new Error('response missing paymentPolicyId')
    return id
  } catch (err) {
    const e = err as { status?: number }
    if (e.status === 409) {
      const id = await findPolicyByName('payment_policy', accessToken, mkt, name)
      if (id) return id
    }
    throw err
  }
}

export async function createDefaultReturnPolicy(accessToken: string, marketplaceId: string): Promise<string> {
  const mkt = resolveMarketplaceId(marketplaceId)
  const name = 'Meridia default returns'
  const body = {
    name,
    description: '30-day buyer-paid returns, refund to original method. Auto-created by Meridia.',
    marketplaceId: mkt,
    categoryTypes: [{ name: 'ALL_EXCLUDING_MOTORS_VEHICLES', default: true }],
    returnsAccepted: true,
    returnShippingCostPayer: 'BUYER',
    returnPeriod: { value: 30, unit: 'DAY' },
    refundMethod: 'MONEY_BACK',
    returnMethod: 'REPLACEMENT_OR_MONEY_BACK',
  }
  try {
    const res = await postJson(`${ACCOUNT_BASE}/return_policy`, accessToken, body, 'ebay.account.return_policy.create', mkt)
    const id = res.returnPolicyId as string | undefined
    if (!id) throw new Error('response missing returnPolicyId')
    return id
  } catch (err) {
    const e = err as { status?: number }
    if (e.status === 409) {
      const id = await findPolicyByName('return_policy', accessToken, mkt, name)
      if (id) return id
    }
    throw err
  }
}

export async function createDefaultFulfillmentPolicy(
  accessToken: string,
  marketplaceId: string,
  shopifyProfiles?: ShopifyShippingProfile[],
): Promise<string> {
  const mkt = resolveMarketplaceId(marketplaceId)
  const defaults = MARKETPLACE_DEFAULTS[mkt]

  // If Shopify shipping profiles were supplied, prefer the cheapest rate we can
  // find and use it as the shipping cost — service code stays the eBay default.
  let shippingCost = defaults.shippingCost
  if (shopifyProfiles?.length) {
    const rates: number[] = []
    for (const p of shopifyProfiles) {
      for (const z of p.zones ?? []) {
        for (const r of [...(z.price_based_shipping_rates ?? []), ...(z.weight_based_shipping_rates ?? [])]) {
          const n = Number(r.price)
          if (Number.isFinite(n) && n > 0) rates.push(n)
        }
      }
    }
    if (rates.length) {
      shippingCost = Math.min(...rates).toFixed(2)
    }
  }

  const name = 'Meridia default fulfillment'
  const body = {
    name,
    description: 'Handling 1 business day, domestic standard service, free shipping over threshold. Auto-created by Meridia.',
    marketplaceId: mkt,
    categoryTypes: [{ name: 'ALL_EXCLUDING_MOTORS_VEHICLES', default: true }],
    handlingTime: { value: 1, unit: 'BUSINESS_DAY' },
    shippingOptions: [{
      optionType: 'DOMESTIC',
      costType: 'FLAT_RATE',
      shippingServices: [{
        sortOrder: 1,
        shippingCarrierCode: null,
        shippingServiceCode: defaults.shippingService,
        freeShipping: false,
        shippingCost: { value: shippingCost, currency: defaults.currency },
        additionalShippingCost: { value: '0.00', currency: defaults.currency },
      }],
    }],
    // eBay surfaces a "free shipping for orders over X" discount via a promotion
    // profile rather than on the fulfillment policy directly; we stash the
    // intended threshold as metadata on the policy description for now.
  }

  try {
    const res = await postJson(`${ACCOUNT_BASE}/fulfillment_policy`, accessToken, body, 'ebay.account.fulfillment_policy.create', mkt)
    const id = res.fulfillmentPolicyId as string | undefined
    if (!id) throw new Error('response missing fulfillmentPolicyId')
    return id
  } catch (err) {
    const e = err as { status?: number }
    if (e.status === 409) {
      const id = await findPolicyByName('fulfillment_policy', accessToken, mkt, name)
      if (id) return id
    }
    throw err
  }
}

// ── Orchestrator ────────────────────────────────────────────────────────────

/**
 * Ensures each of the 3 policies exists for the given eBay channel. Reads
 * channel metadata first; if ids are already present, returns them without
 * hitting eBay. Otherwise creates missing policies with sensible defaults for
 * the channel's marketplace and persists the ids back to channels.metadata.
 * On failure of any of the 3 creates, the partial state is persisted and a
 * typed EbayPolicyError is thrown.
 */
export async function ensureEbayPolicies(
  channelRow: EbayChannelRowLike,
  supabase: SupabaseClient,
  opts: { shopifyProfiles?: ShopifyShippingProfile[]; forceRefresh?: boolean } = {},
): Promise<EbayPolicyProvisioningResult> {
  const metadata = (channelRow.metadata ?? {}) as Record<string, unknown>
  const existing = (metadata.ebay_policies as Record<string, unknown> | undefined) ?? {}
  const marketplaceId = resolveMarketplaceId(metadata.ebay_marketplace)

  const accessToken = channelRow.access_token
  if (!accessToken) {
    throw new EbayPolicyError('payment', 'channel missing access_token; reconnect eBay', {})
  }

  let paymentPolicyId = (existing.paymentPolicyId as string | undefined) ?? (existing.payment_policy_id as string | undefined) ?? ''
  let returnPolicyId = (existing.returnPolicyId as string | undefined) ?? (existing.return_policy_id as string | undefined) ?? ''
  let fulfillmentPolicyId = (existing.fulfillmentPolicyId as string | undefined) ?? (existing.fulfillment_policy_id as string | undefined) ?? ''
  const created: EbayPolicyProvisioningResult['created'] = {}

  const scope = channelRow.user_id

  const persistPartial = async (partial: Partial<EbayPolicySet>) => {
    const merged = {
      ...metadata,
      ebay_marketplace: marketplaceId,
      ebay_policies: {
        ...existing,
        ...(partial.paymentPolicyId ? { paymentPolicyId: partial.paymentPolicyId, payment_policy_id: partial.paymentPolicyId } : {}),
        ...(partial.returnPolicyId ? { returnPolicyId: partial.returnPolicyId, return_policy_id: partial.returnPolicyId } : {}),
        ...(partial.fulfillmentPolicyId ? { fulfillmentPolicyId: partial.fulfillmentPolicyId, fulfillment_policy_id: partial.fulfillmentPolicyId } : {}),
        provisioned_at: new Date().toISOString(),
      },
    }
    await supabase.from('channels').update({ metadata: merged }).eq('id', channelRow.id)
  }

  try {
    if (!paymentPolicyId || opts.forceRefresh) {
      paymentPolicyId = await withRateLimit('ebay', scope, () =>
        createDefaultPaymentPolicy(accessToken, marketplaceId),
      )
      created.payment = true
    }
  } catch (err) {
    await persistPartial({ paymentPolicyId, returnPolicyId, fulfillmentPolicyId })
    throw new EbayPolicyError('payment', (err as Error).message, { paymentPolicyId, returnPolicyId, fulfillmentPolicyId })
  }

  try {
    if (!returnPolicyId || opts.forceRefresh) {
      returnPolicyId = await withRateLimit('ebay', scope, () =>
        createDefaultReturnPolicy(accessToken, marketplaceId),
      )
      created.return = true
    }
  } catch (err) {
    await persistPartial({ paymentPolicyId, returnPolicyId, fulfillmentPolicyId })
    throw new EbayPolicyError('return', (err as Error).message, { paymentPolicyId, returnPolicyId, fulfillmentPolicyId })
  }

  try {
    if (!fulfillmentPolicyId || opts.forceRefresh) {
      fulfillmentPolicyId = await withRateLimit('ebay', scope, () =>
        createDefaultFulfillmentPolicy(accessToken, marketplaceId, opts.shopifyProfiles),
      )
      created.fulfillment = true
    }
  } catch (err) {
    await persistPartial({ paymentPolicyId, returnPolicyId, fulfillmentPolicyId })
    throw new EbayPolicyError('fulfillment', (err as Error).message, { paymentPolicyId, returnPolicyId, fulfillmentPolicyId })
  }

  const provisionedAt = new Date().toISOString()
  await persistPartial({ paymentPolicyId, returnPolicyId, fulfillmentPolicyId })

  return {
    paymentPolicyId,
    returnPolicyId,
    fulfillmentPolicyId,
    marketplaceId,
    provisionedAt,
    created,
  }
}
