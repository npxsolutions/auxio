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
    remediation: 'Set the Shopify variant barcode to a valid GTIN — Palvento can map it automatically.',
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
    remediation: 'Set a condition on the listing or via Shopify metafield palvento.condition.',
    autoFixable: true,
    evaluate: ({ listing }) => ({ pass: !!listing.condition && String(listing.condition).trim().length > 0 }),
  },
  {
    id: 'EBAY_BUSINESS_POLICIES',
    severity: 'error',
    channel: 'ebay',
    message: 'Connect your eBay business policies (payment, return, fulfillment).',
    remediation: 'Go to eBay → Account → Business Policies, create them, then re-sync in Palvento.',
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
    remediation: 'Set the Shopify variant weight; Palvento will map it to eBay package dimensions.',
    autoFixable: false,
    evaluate: ({ listing }) => ({
      pass: typeof listing.weight_grams === 'number' && listing.weight_grams > 0,
    }),
  },
]

registerChannelValidator('ebay', { channel: 'ebay', rules: EBAY_RULES })

// ── Amazon rule set ──
export const AMAZON_RULES: RegisteredRule[] = [
  {
    id: 'AMAZON_ASIN_FORMAT',
    severity: 'warning',
    channel: 'amazon',
    message: 'ASIN format is invalid (must be 10 alphanumeric characters starting with B0).',
    remediation: 'Correct the ASIN or remove it — Amazon will assign one from GTIN.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const asin = listing.asin ?? listing.external_id
      if (!asin) return { pass: true } // ASIN is optional when creating
      return { pass: /^B0[A-Z0-9]{8}$/i.test(String(asin)), detail: `asin="${asin}"` }
    },
  },
  {
    id: 'AMAZON_TITLE_LENGTH',
    severity: 'error',
    channel: 'amazon',
    message: 'Amazon titles must be 200 characters or fewer.',
    remediation: 'Shorten the title to 200 characters or less.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const t = String(listing.title ?? '')
      return { pass: t.length > 0 && t.length <= 200, detail: `title is ${t.length} chars` }
    },
  },
  {
    id: 'AMAZON_TITLE_NO_ALL_CAPS',
    severity: 'warning',
    channel: 'amazon',
    message: 'Amazon discourages ALL CAPS titles — they may be suppressed.',
    remediation: 'Use title case instead of all-uppercase letters.',
    autoFixable: true,
    evaluate: ({ listing }) => {
      const t = String(listing.title ?? '')
      if (t.length === 0) return { pass: true } // caught by length rule
      const alpha = t.replace(/[^a-zA-Z]/g, '')
      return { pass: alpha.length === 0 || alpha !== alpha.toUpperCase() }
    },
  },
  {
    id: 'AMAZON_BULLET_POINTS',
    severity: 'warning',
    channel: 'amazon',
    message: 'Amazon recommends 5 bullet points for best conversion.',
    remediation: 'Add bullet points in Shopify metafield or listing editor.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const bullets: unknown[] = Array.isArray(listing.bullet_points) ? listing.bullet_points : []
      return { pass: bullets.length >= 5, detail: `${bullets.length} bullet point(s)` }
    },
  },
  {
    id: 'AMAZON_BULLET_POINT_LENGTH',
    severity: 'error',
    channel: 'amazon',
    message: 'Each Amazon bullet point must be 500 characters or fewer.',
    remediation: 'Shorten any bullet point exceeding 500 characters.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const bullets: string[] = Array.isArray(listing.bullet_points) ? listing.bullet_points : []
      const tooLong = bullets.filter(b => String(b).length > 500)
      return { pass: tooLong.length === 0, detail: tooLong.length > 0 ? `${tooLong.length} bullet(s) over 500 chars` : undefined }
    },
  },
  {
    id: 'AMAZON_MAIN_IMAGE',
    severity: 'error',
    channel: 'amazon',
    message: 'Amazon requires a main image (pure white background, min 1000x1000px recommended).',
    remediation: 'Upload a product image on a white background at ≥1000×1000px.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const imgs: unknown[] = Array.isArray(listing.images) ? listing.images : []
      return { pass: imgs.length >= 1, detail: imgs.length === 0 ? 'no images on listing' : undefined }
    },
  },
  {
    id: 'AMAZON_PRICE_POSITIVE',
    severity: 'error',
    channel: 'amazon',
    message: 'Price must be greater than 0.',
    remediation: 'Set a positive price on the Shopify variant.',
    autoFixable: false,
    evaluate: ({ listing }) => ({ pass: typeof listing.price === 'number' && listing.price > 0 }),
  },
  {
    id: 'AMAZON_BRAND_REQUIRED',
    severity: 'error',
    channel: 'amazon',
    message: 'Amazon requires a brand_name.',
    remediation: 'Set Vendor in Shopify to the brand name.',
    autoFixable: false,
    evaluate: ({ listing }) => ({ pass: !!listing.brand && String(listing.brand).trim().length > 0 }),
  },
  {
    id: 'AMAZON_CATEGORY_REQUIRED',
    severity: 'error',
    channel: 'amazon',
    message: 'A browse node (category) is required for Amazon.',
    remediation: 'Pick an Amazon category / browse node in channel settings.',
    autoFixable: true,
    evaluate: ({ listingChannel }) => {
      const cat = listingChannel?.external_category_id ?? listingChannel?.category_id ?? listingChannel?.browse_node_id
      return { pass: !!cat }
    },
  },
  {
    id: 'AMAZON_GTIN_REQUIRED',
    severity: 'error',
    channel: 'amazon',
    message: 'Amazon requires a UPC/EAN (GTIN) unless GTIN-exempt.',
    remediation: 'Set the Shopify variant barcode to a valid GTIN, or apply for GTIN exemption.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      if (listing.gtin_exempt) return { pass: true }
      const gtin = listing.barcode ?? listing.gtin
      return { pass: !!gtin && String(gtin).trim().length >= 8 }
    },
  },
  {
    id: 'AMAZON_QUANTITY_VALID',
    severity: 'error',
    channel: 'amazon',
    message: 'Inventory quantity must be 0 or greater.',
    remediation: 'Set a non-negative inventory quantity in Shopify.',
    autoFixable: false,
    evaluate: ({ listing }) => ({ pass: typeof listing.quantity === 'number' && listing.quantity >= 0 }),
  },
  {
    id: 'AMAZON_DESCRIPTION_NO_HTML',
    severity: 'error',
    channel: 'amazon',
    message: 'Amazon descriptions must not contain HTML tags.',
    remediation: 'Remove all HTML tags from the description — use plain text only.',
    autoFixable: true,
    evaluate: ({ listing }) => {
      const d = String(listing.description ?? '')
      return { pass: !/<[a-z][\s\S]*>/i.test(d) }
    },
  },
  {
    id: 'AMAZON_SEARCH_TERMS_LENGTH',
    severity: 'warning',
    channel: 'amazon',
    message: 'Amazon search terms (generic_keyword) must be 250 bytes or fewer.',
    remediation: 'Shorten search terms to fit within the 250-byte limit.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const terms = listing.search_terms ?? listing.generic_keyword ?? ''
      const byteLen = new TextEncoder().encode(String(terms)).length
      return { pass: byteLen <= 250, detail: byteLen > 250 ? `search terms are ${byteLen} bytes` : undefined }
    },
  },
  {
    id: 'AMAZON_VARIATION_THEME',
    severity: 'error',
    channel: 'amazon',
    message: 'Child variations must share a consistent variation theme with the parent.',
    remediation: 'Ensure all child SKUs use the same variation_theme as the parent.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      if (!listing.parent_sku) return { pass: true } // not a child variation
      return { pass: !!listing.variation_theme && String(listing.variation_theme).trim().length > 0 }
    },
  },
]

registerChannelValidator('amazon', { channel: 'amazon', rules: AMAZON_RULES })

// ── Etsy rule set ──
export const ETSY_RULES: RegisteredRule[] = [
  {
    id: 'ETSY_TITLE_LENGTH',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy titles must be 140 characters or fewer.',
    remediation: 'Shorten the title to 140 characters or less.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const len = String(listing.title ?? '').length
      return { pass: len > 0 && len <= 140, detail: `title is ${len} chars` }
    },
  },
  {
    id: 'ETSY_DESCRIPTION_REQUIRED',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy requires a non-empty description.',
    remediation: 'Add a description in Shopify or the Palvento listing editor.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const d = String(listing.description ?? '').trim()
      return { pass: d.length > 0 }
    },
  },
  {
    id: 'ETSY_DESCRIPTION_MAX_LENGTH',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy descriptions must be 10,000 characters or fewer.',
    remediation: 'Shorten the description to fit within the 10,000-character limit.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const d = String(listing.description ?? '')
      return { pass: d.length <= 10000, detail: d.length > 10000 ? `description is ${d.length} chars` : undefined }
    },
  },
  {
    id: 'ETSY_TAGS_MAX_COUNT',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy allows at most 13 tags per listing.',
    remediation: 'Remove tags until you have 13 or fewer.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const tags: unknown[] = Array.isArray(listing.tags) ? listing.tags : []
      return { pass: tags.length <= 13, detail: tags.length > 13 ? `${tags.length} tags` : undefined }
    },
  },
  {
    id: 'ETSY_TAG_LENGTH',
    severity: 'error',
    channel: 'etsy',
    message: 'Each Etsy tag must be 20 characters or fewer.',
    remediation: 'Shorten any tag exceeding 20 characters.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const tags: string[] = Array.isArray(listing.tags) ? listing.tags : []
      const tooLong = tags.filter(t => String(t).length > 20)
      return { pass: tooLong.length === 0, detail: tooLong.length > 0 ? `${tooLong.length} tag(s) over 20 chars` : undefined }
    },
  },
  {
    id: 'ETSY_PRICE_MINIMUM',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy requires a price of at least $0.20 USD.',
    remediation: 'Set the price to $0.20 or higher.',
    autoFixable: false,
    evaluate: ({ listing }) => ({ pass: typeof listing.price === 'number' && listing.price >= 0.20 }),
  },
  {
    id: 'ETSY_QUANTITY_REQUIRED',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy requires a quantity of at least 1 for active listings.',
    remediation: 'Increase inventory to at least 1.',
    autoFixable: false,
    evaluate: ({ listing }) => ({ pass: typeof listing.quantity === 'number' && listing.quantity >= 1 }),
  },
  {
    id: 'ETSY_IMAGES_REQUIRED',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy requires at least 1 image (max 10).',
    remediation: 'Add at least one product image.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const n = Array.isArray(listing.images) ? listing.images.length : 0
      return { pass: n >= 1 && n <= 10, detail: n === 0 ? 'no images' : n > 10 ? `${n} images (max 10)` : undefined }
    },
  },
  {
    id: 'ETSY_TAXONOMY_REQUIRED',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy requires a taxonomy_id (category).',
    remediation: 'Pick an Etsy taxonomy in channel settings.',
    autoFixable: true,
    evaluate: ({ listingChannel }) => {
      const tax = listingChannel?.external_category_id ?? listingChannel?.taxonomy_id ?? listingChannel?.category_id
      return { pass: !!tax }
    },
  },
  {
    id: 'ETSY_SHIPPING_PROFILE',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy requires a shipping profile.',
    remediation: 'Create a shipping profile in Etsy and assign it in channel settings.',
    autoFixable: false,
    evaluate: ({ listingChannel, channelRow }) => {
      const profile = listingChannel?.shipping_profile_id ?? channelRow?.metadata?.etsy_shipping_profile_id
      return { pass: !!profile }
    },
  },
  {
    id: 'ETSY_WHO_MADE_REQUIRED',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy requires who_made (i_did, someone_else, or collective).',
    remediation: 'Set who_made on the listing or via Shopify metafield.',
    autoFixable: true,
    evaluate: ({ listing }) => {
      const val = listing.who_made ?? listing.metadata?.who_made
      const valid = ['i_did', 'someone_else', 'collective']
      return { pass: !!val && valid.includes(String(val)) }
    },
  },
  {
    id: 'ETSY_WHEN_MADE_REQUIRED',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy requires when_made (e.g. made_to_order, 2020_2024).',
    remediation: 'Set when_made on the listing or via Shopify metafield.',
    autoFixable: true,
    evaluate: ({ listing }) => {
      const val = listing.when_made ?? listing.metadata?.when_made
      return { pass: !!val && String(val).trim().length > 0 }
    },
  },
  {
    id: 'ETSY_IS_SUPPLY_REQUIRED',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy requires is_supply (true/false).',
    remediation: 'Set is_supply on the listing.',
    autoFixable: true,
    evaluate: ({ listing }) => {
      const val = listing.is_supply ?? listing.metadata?.is_supply
      return { pass: val === true || val === false || val === 'true' || val === 'false' }
    },
  },
  {
    id: 'ETSY_MATERIALS_RECOMMENDED',
    severity: 'info',
    channel: 'etsy',
    message: 'Adding materials helps Etsy search rank your listing higher.',
    remediation: 'Add materials to the listing (e.g. cotton, silver, wood).',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const mats: unknown[] = Array.isArray(listing.materials) ? listing.materials : []
      return { pass: mats.length > 0 }
    },
  },
]

registerChannelValidator('etsy', { channel: 'etsy', rules: ETSY_RULES })

// ── TikTok Shop rule set ──
export const TIKTOK_RULES: RegisteredRule[] = [
  {
    id: 'TIKTOK_TITLE_LENGTH',
    severity: 'error',
    channel: 'tiktok',
    message: 'TikTok Shop titles must be between 1 and 255 characters.',
    remediation: 'Set a title between 1 and 255 characters.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const len = String(listing.title ?? '').length
      return { pass: len >= 1 && len <= 255, detail: `title is ${len} chars` }
    },
  },
  {
    id: 'TIKTOK_DESCRIPTION_REQUIRED',
    severity: 'error',
    channel: 'tiktok',
    message: 'TikTok Shop requires a product description.',
    remediation: 'Add a description in Shopify or the Palvento listing editor.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const d = String(listing.description ?? '').trim()
      return { pass: d.length > 0 }
    },
  },
  {
    id: 'TIKTOK_MAIN_IMAGE',
    severity: 'error',
    channel: 'tiktok',
    message: 'TikTok Shop requires at least one product image (min 600x600px).',
    remediation: 'Upload a product image at ≥600×600px.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const imgs: unknown[] = Array.isArray(listing.images) ? listing.images : []
      return { pass: imgs.length >= 1, detail: imgs.length === 0 ? 'no images on listing' : undefined }
    },
  },
  {
    id: 'TIKTOK_IMAGES_RECOMMENDED',
    severity: 'warning',
    channel: 'tiktok',
    message: 'TikTok Shop listings with 3+ images perform significantly better.',
    remediation: 'Add additional product photos showing different angles.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const n = Array.isArray(listing.images) ? listing.images.length : 0
      return { pass: n >= 3, detail: `${n} image(s) on listing` }
    },
  },
  {
    id: 'TIKTOK_PRICE_POSITIVE',
    severity: 'error',
    channel: 'tiktok',
    message: 'Price must be greater than 0.',
    remediation: 'Set a positive price on the Shopify variant.',
    autoFixable: false,
    evaluate: ({ listing }) => ({ pass: typeof listing.price === 'number' && listing.price > 0 }),
  },
  {
    id: 'TIKTOK_INVENTORY_POSITIVE',
    severity: 'error',
    channel: 'tiktok',
    message: 'Inventory must be at least 1 for active listings.',
    remediation: 'Increase inventory to at least 1 in Shopify.',
    autoFixable: false,
    evaluate: ({ listing }) => ({ pass: typeof listing.quantity === 'number' && listing.quantity >= 1 }),
  },
  {
    id: 'TIKTOK_CATEGORY_REQUIRED',
    severity: 'error',
    channel: 'tiktok',
    message: 'TikTok Shop requires a category_id.',
    remediation: 'Pick a TikTok Shop category in channel settings.',
    autoFixable: true,
    evaluate: ({ listingChannel }) => {
      const cat = listingChannel?.external_category_id ?? listingChannel?.category_id
      return { pass: !!cat }
    },
  },
  {
    id: 'TIKTOK_BRAND_REQUIRED',
    severity: 'error',
    channel: 'tiktok',
    message: 'TikTok Shop requires a brand name.',
    remediation: 'Set Vendor in Shopify to the brand name.',
    autoFixable: false,
    evaluate: ({ listing }) => ({ pass: !!listing.brand && String(listing.brand).trim().length > 0 }),
  },
  {
    id: 'TIKTOK_PACKAGE_WEIGHT',
    severity: 'error',
    channel: 'tiktok',
    message: 'TikTok Shop requires package weight.',
    remediation: 'Set the variant weight in Shopify; Palvento will map it.',
    autoFixable: false,
    evaluate: ({ listing }) => ({
      pass: typeof listing.weight_grams === 'number' && listing.weight_grams > 0,
    }),
  },
  {
    id: 'TIKTOK_PACKAGE_DIMENSIONS',
    severity: 'error',
    channel: 'tiktok',
    message: 'TikTok Shop requires package dimensions (length, width, height).',
    remediation: 'Set package dimensions on the listing or Shopify variant.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const dims = listing.package_dimensions ?? listing.dimensions
      if (!dims) return { pass: false, detail: 'no package dimensions set' }
      const l = dims.length ?? dims.package_length
      const w = dims.width ?? dims.package_width
      const h = dims.height ?? dims.package_height
      return {
        pass: typeof l === 'number' && l > 0 && typeof w === 'number' && w > 0 && typeof h === 'number' && h > 0,
        detail: (!l || !w || !h) ? 'incomplete dimensions' : undefined,
      }
    },
  },
  {
    id: 'TIKTOK_DESCRIPTION_LENGTH',
    severity: 'warning',
    channel: 'tiktok',
    message: 'TikTok Shop descriptions should be under 10,000 characters.',
    remediation: 'Shorten the description to fit within 10,000 characters.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const d = String(listing.description ?? '')
      return { pass: d.length <= 10000, detail: d.length > 10000 ? `description is ${d.length} chars` : undefined }
    },
  },
]

registerChannelValidator('tiktok', { channel: 'tiktok', rules: TIKTOK_RULES })

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
    admin.from('channel_listings').select('*').eq('id', listingId).single(),
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
