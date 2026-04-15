/**
 * Pre-flight listing validator framework.
 *
 * Channel adapters register a rule set. Each rule evaluates a listing (plus
 * optional channel context) and returns whether it passes plus an optional
 * detail string (e.g. "title is 92 chars"). Rules are pure functions so the
 * validator is fully idempotent — running it twice on the same input yields
 * the same health score.
 *
 * To add a new channel (Amazon, Etsy, TikTok, …):
 *   1. Build a `ChannelValidator` with an array of `ValidationRule`s.
 *   2. Call `registerChannelValidator('amazon', amazonValidator)`.
 *   3. `validateForChannel(listingId, 'amazon')` will dispatch automatically.
 *
 * Log prefix: [feed:validator]
 */
import { createClient } from '@supabase/supabase-js'
import type { ChannelKey } from '@/app/lib/rate-limit/channel'
import { EBAY_CATEGORIES_REQUIRING_GTIN } from './ebay-categories'

export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationRule {
  id: string
  severity: ValidationSeverity
  channel: ChannelKey
  message: string
  remediation: string
  autoFixable: boolean
}

export interface ValidationIssue {
  rule: ValidationRule
  detail?: string
}

export interface ValidationResult {
  listingId: string
  channel: ChannelKey
  passed: boolean
  healthScore: number
  issues: ValidationIssue[]
}

export interface ValidatorContext {
  listing: Record<string, any>
  channelRow: Record<string, any> | null
  listingChannel: Record<string, any> | null
}

export interface RuleEvaluation {
  pass: boolean
  detail?: string
}

export interface RegisteredRule extends ValidationRule {
  evaluate: (ctx: ValidatorContext) => RuleEvaluation | Promise<RuleEvaluation>
}

export interface ChannelValidator {
  channel: ChannelKey
  rules: RegisteredRule[]
}

const REGISTRY = new Map<ChannelKey, ChannelValidator>()

export function registerChannelValidator(channel: ChannelKey, validator: ChannelValidator): void {
  REGISTRY.set(channel, validator)
}

export function getChannelValidator(channel: ChannelKey): ChannelValidator | undefined {
  return REGISTRY.get(channel)
}

export function listRegisteredChannels(): ChannelKey[] {
  return Array.from(REGISTRY.keys())
}

// ── Pure scoring (exported for tests) ──
export function computeHealthScore(issues: ValidationIssue[]): number {
  let score = 100
  for (const i of issues) {
    if (i.rule.severity === 'error') score -= 15
    else if (i.rule.severity === 'warning') score -= 5
  }
  if (score < 0) score = 0
  if (score > 100) score = 100
  return score
}

// ── Pure evaluator (exported for tests) ──
export async function evaluateRules(
  ctx: ValidatorContext,
  rules: RegisteredRule[],
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = []
  for (const rule of rules) {
    try {
      const result = await rule.evaluate(ctx)
      if (!result.pass) {
        issues.push({
          rule: {
            id: rule.id,
            severity: rule.severity,
            channel: rule.channel,
            message: rule.message,
            remediation: rule.remediation,
            autoFixable: rule.autoFixable,
          },
          detail: result.detail,
        })
      }
    } catch (err) {
      console.error(`[feed:validator] rule ${rule.id} threw:`, err)
    }
  }
  return issues
}

// ── eBay rule set ──
export const EBAY_RULES: RegisteredRule[] = [
  {
    id: 'EBAY_IMAGES_REQUIRED',
    severity: 'error',
    channel: 'ebay',
    message: 'eBay requires at least one image on the listing.',
    remediation: 'Add a product image in Shopify or upload one in the listing editor.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const imgs: unknown[] = Array.isArray(listing.images) ? listing.images : []
      return { pass: imgs.length >= 1, detail: imgs.length === 0 ? 'no images on listing' : undefined }
    },
  },
  {
    id: 'EBAY_IMAGES_RECOMMENDED',
    severity: 'warning',
    channel: 'ebay',
    message: 'eBay listings with 4+ images convert significantly better.',
    remediation: 'Add additional product photos showing different angles.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const n = Array.isArray(listing.images) ? listing.images.length : 0
      return { pass: n >= 4, detail: `${n} image(s) on listing` }
    },
  },
  {
    id: 'EBAY_TITLE_LENGTH',
    severity: 'error',
    channel: 'ebay',
    message: 'eBay titles must be 80 characters or fewer.',
    remediation: 'Shorten the title to 80 characters or less.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const len = String(listing.title ?? '').length
      return { pass: len > 0 && len <= 80, detail: `title is ${len} chars` }
    },
  },
  {
    id: 'EBAY_GTIN_REQUIRED',
    severity: 'error',
    channel: 'ebay',
    message: 'This eBay category requires a GTIN (UPC, EAN, or ISBN).',
    remediation: 'Set the Shopify variant barcode to a valid GTIN — Meridia can map it automatically.',
    autoFixable: true,
    evaluate: ({ listing, listingChannel }) => {
      const cat = listingChannel?.external_category_id ?? listingChannel?.category_id
      if (!cat) return { pass: true } // category-mapped rule will catch missing category
      if (!EBAY_CATEGORIES_REQUIRING_GTIN.has(String(cat))) return { pass: true }
      const gtin = listing.barcode ?? listing.gtin
      return { pass: !!gtin && String(gtin).trim().length >= 8, detail: `category ${cat} requires GTIN` }
    },
  },
  {
    id: 'EBAY_CATEGORY_MAPPED',
    severity: 'error',
    channel: 'ebay',
    message: 'No eBay category is mapped for this listing.',
    remediation: 'Open the listing and pick an eBay category in the channel settings.',
    autoFixable: true,
    evaluate: ({ listingChannel }) => {
      const cat = listingChannel?.external_category_id ?? listingChannel?.category_id
      return { pass: !!cat }
    },
  },
  {
    id: 'EBAY_CONDITION_SET',
    severity: 'error',
    channel: 'ebay',
    message: 'eBay requires a condition (e.g. New, Used).',
    remediation: 'Set a condition on the listing or via Shopify metafield meridia.condition.',
    autoFixable: true,
    evaluate: ({ listing }) => ({ pass: !!listing.condition && String(listing.condition).trim().length > 0 }),
  },
  {
    id: 'EBAY_BUSINESS_POLICIES',
    severity: 'error',
    channel: 'ebay',
    message: 'Connect your eBay business policies (payment, return, fulfillment).',
    remediation: 'Go to eBay → Account → Business Policies, create them, then re-sync in Meridia.',
    autoFixable: false,
    evaluate: ({ channelRow }) => {
      const p = channelRow?.metadata?.ebay_policies
      return {
        pass: !!(p && p.payment_policy_id && p.return_policy_id && p.fulfillment_policy_id),
      }
    },
  },
  {
    id: 'EBAY_BRAND_ASPECT',
    severity: 'warning',
    channel: 'ebay',
    message: 'Listings with a Brand aspect rank better in eBay search.',
    remediation: 'Add a brand in Shopify (Vendor field) and re-sync.',
    autoFixable: false,
    evaluate: ({ listing }) => ({ pass: !!listing.brand && String(listing.brand).trim().length > 0 }),
  },
  {
    id: 'EBAY_PRICE_POSITIVE',
    severity: 'error',
    channel: 'ebay',
    message: 'Price must be greater than 0.',
    remediation: 'Set a price on the Shopify variant.',
    autoFixable: false,
    evaluate: ({ listing }) => ({ pass: typeof listing.price === 'number' && listing.price > 0 }),
  },
  {
    id: 'EBAY_QUANTITY_POSITIVE',
    severity: 'error',
    channel: 'ebay',
    message: 'Quantity must be at least 1 for fixed-price listings.',
    remediation: 'Increase available inventory in Shopify.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      if (listing.listing_type === 'auction') return { pass: true }
      return { pass: typeof listing.quantity === 'number' && listing.quantity >= 1 }
    },
  },
  {
    id: 'EBAY_DESCRIPTION_HTML_SAFE',
    severity: 'warning',
    channel: 'ebay',
    message: 'Description contains unsafe HTML (script/iframe/style tags) — eBay strips it.',
    remediation: 'Remove <script>, <iframe>, and <style> tags from the description.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const d = String(listing.description ?? '')
      const unsafe = /<\s*(script|iframe|style)\b/i.test(d)
      return { pass: !unsafe }
    },
  },
  {
    id: 'EBAY_SHIPPING_WEIGHT_SET',
    severity: 'warning',
    channel: 'ebay',
    message: 'Package weight is recommended — some categories require it.',
    remediation: 'Set the Shopify variant weight; Meridia will map it to eBay package dimensions.',
    autoFixable: false,
    evaluate: ({ listing }) => ({
      pass: typeof listing.weight_grams === 'number' && listing.weight_grams > 0,
    }),
  },
]

registerChannelValidator('ebay', { channel: 'ebay', rules: EBAY_RULES })

// ── Public API ──
function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function validateForChannel(
  listingId: string,
  channel: ChannelKey,
): Promise<ValidationResult> {
  const validator = REGISTRY.get(channel)
  if (!validator) {
    return { listingId, channel, passed: true, healthScore: 100, issues: [] }
  }

  const admin = getAdmin()
  const [{ data: listing }, { data: lc }] = await Promise.all([
    admin.from('listings').select('*').eq('id', listingId).single(),
    admin.from('listing_channels').select('*').eq('listing_id', listingId).eq('channel_type', channel).maybeSingle(),
  ])

  if (!listing) {
    return { listingId, channel, passed: false, healthScore: 0, issues: [] }
  }

  const { data: channelRow } = await admin
    .from('channels').select('*').eq('user_id', listing.user_id).eq('type', channel).maybeSingle()

  const ctx: ValidatorContext = { listing, channelRow, listingChannel: lc ?? null }
  const issues = await evaluateRules(ctx, validator.rules)
  const healthScore = computeHealthScore(issues)
  const passed = !issues.some(i => i.rule.severity === 'error')

  // Persist (idempotent — unique on user_id, listing_id, channel)
  await admin.from('listing_health').upsert(
    {
      user_id: listing.user_id,
      listing_id: listingId,
      channel,
      health_score: healthScore,
      errors_count: issues.filter(i => i.rule.severity === 'error').length,
      warnings_count: issues.filter(i => i.rule.severity === 'warning').length,
      issues: issues as unknown as object,
      last_validated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,listing_id,channel' },
  )

  return { listingId, channel, passed, healthScore, issues }
}

// Synchronous evaluator overload for callers that already have the listing
// loaded (pre-flight in publish, tests).
export async function validateContext(
  channel: ChannelKey,
  ctx: ValidatorContext,
): Promise<Omit<ValidationResult, 'listingId'>> {
  const validator = REGISTRY.get(channel)
  if (!validator) return { channel, passed: true, healthScore: 100, issues: [] }
  const issues = await evaluateRules(ctx, validator.rules)
  const healthScore = computeHealthScore(issues)
  const passed = !issues.some(i => i.rule.severity === 'error')
  return { channel, passed, healthScore, issues }
}
