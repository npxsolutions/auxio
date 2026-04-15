/**
 * Amazon (SP-API) pre-flight validator rule set.
 *
 * Mirrors the structure of the eBay rule set in `validator.ts`. Each rule is
 * pure and idempotent; rules are registered into the shared validator registry
 * on module load so `validateForChannel(listingId, 'amazon')` picks them up.
 *
 * Log prefix: [feed:amazon-rules]
 */
import { registerChannelValidator, type RegisteredRule } from './validator'

export const AMAZON_RULES: RegisteredRule[] = [
  {
    id: 'AMAZON_IMAGES_REQUIRED',
    severity: 'error',
    channel: 'amazon',
    message: 'Amazon requires at least one main image on a pure-white background.',
    remediation: 'Add a main product image (RGB, ≥1000px, pure-white background) in Shopify.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const imgs: unknown[] = Array.isArray(listing.images) ? listing.images : []
      return { pass: imgs.length >= 1, detail: imgs.length === 0 ? 'no images on listing' : undefined }
    },
  },
  {
    id: 'AMAZON_TITLE_LENGTH',
    severity: 'error',
    channel: 'amazon',
    message: 'Amazon titles must be 200 characters or fewer (varies by category; 200 is the safe ceiling).',
    remediation: 'Shorten the title to ≤200 characters.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const len = String(listing.title ?? '').length
      return { pass: len > 0 && len <= 200, detail: `title is ${len} chars` }
    },
  },
  {
    id: 'AMAZON_BULLET_POINTS',
    severity: 'warning',
    channel: 'amazon',
    message: 'Amazon recommends 5 bullet points per listing for best conversion.',
    remediation: 'Add 5 concise bullet points describing key features.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const bullets: unknown[] = Array.isArray(listing.bullet_points) ? listing.bullet_points : []
      return { pass: bullets.length >= 5, detail: `${bullets.length} bullet(s) set` }
    },
  },
  {
    id: 'AMAZON_GTIN_REQUIRED',
    severity: 'error',
    channel: 'amazon',
    message: 'Amazon requires a UPC/EAN (GTIN) unless the brand is GTIN-exempt.',
    remediation: 'Set the Shopify variant barcode, or apply for GTIN exemption in Seller Central.',
    autoFixable: true,
    evaluate: ({ listing, listingChannel }) => {
      if (listingChannel?.metadata?.gtin_exempt === true) return { pass: true }
      const gtin = listing.barcode ?? listing.gtin
      return { pass: !!gtin && String(gtin).trim().length >= 8 }
    },
  },
  {
    id: 'AMAZON_BRAND_REGISTRY',
    severity: 'warning',
    channel: 'amazon',
    message: 'Brand Registry enrolment unlocks A+ content and improves search ranking.',
    remediation: 'Enrol the brand in Amazon Brand Registry, then mark it on the channel.',
    autoFixable: false,
    evaluate: ({ channelRow }) => ({
      pass: !!channelRow?.metadata?.brand_registry_enrolled,
    }),
  },
  {
    id: 'AMAZON_CATEGORY_MAPPED',
    severity: 'error',
    channel: 'amazon',
    message: 'No Amazon browse node is mapped for this listing.',
    remediation: 'Pick an Amazon browse node (category) in channel settings.',
    autoFixable: true,
    evaluate: ({ listingChannel }) => {
      const n = listingChannel?.metadata?.browse_node_id
        ?? listingChannel?.external_category_id
        ?? listingChannel?.category_id
      return { pass: !!n }
    },
  },
  {
    id: 'AMAZON_FULFILLMENT_CHANNEL',
    severity: 'error',
    channel: 'amazon',
    message: 'Amazon requires a fulfillment channel (FBA or FBM).',
    remediation: 'Set fulfillment_channel to FBA or FBM on the listing.',
    autoFixable: false,
    evaluate: ({ listing, listingChannel }) => {
      const fc = listing.fulfillment_channel ?? listingChannel?.metadata?.fulfillment_channel
      return { pass: fc === 'FBA' || fc === 'FBM' }
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
    id: 'AMAZON_CONDITION_SET',
    severity: 'error',
    channel: 'amazon',
    message: 'Amazon requires a condition (new, used_like_new, used_good, etc.).',
    remediation: 'Set a condition on the listing.',
    autoFixable: true,
    evaluate: ({ listing }) => ({
      pass: !!listing.condition && String(listing.condition).trim().length > 0,
    }),
  },
  {
    id: 'AMAZON_MAIN_IMAGE_RATIO',
    severity: 'warning',
    channel: 'amazon',
    message: 'Amazon prefers a 1:1 square main image (or 85:100); landscape images may be rejected.',
    remediation: 'Re-upload the main image at 1:1 aspect ratio, ≥1000px.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const imgs: any[] = Array.isArray(listing.images) ? listing.images : []
      const first = imgs[0]
      if (!first || typeof first !== 'object') return { pass: true }
      const w = Number(first.width), h = Number(first.height)
      if (!w || !h) return { pass: true }
      const ratio = w / h
      return { pass: ratio >= 0.85 && ratio <= 1.0, detail: `ratio ${ratio.toFixed(2)}` }
    },
  },
]

registerChannelValidator('amazon', { channel: 'amazon', rules: AMAZON_RULES })
