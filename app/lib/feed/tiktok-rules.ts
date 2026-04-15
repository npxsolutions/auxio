/**
 * TikTok Shop (Partner API) pre-flight validator rule set.
 *
 * Mirrors the structure of the eBay rule set in `validator.ts`.
 * Log prefix: [feed:tiktok-rules]
 */
import { registerChannelValidator, type RegisteredRule } from './validator'

export const TIKTOK_RULES: RegisteredRule[] = [
  {
    id: 'TIKTOK_IMAGES_REQUIRED',
    severity: 'error',
    channel: 'tiktok',
    message: 'TikTok Shop requires at least one image per product.',
    remediation: 'Add a product image (≥800×800, white or lifestyle).',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const imgs: unknown[] = Array.isArray(listing.images) ? listing.images : []
      return { pass: imgs.length >= 1, detail: imgs.length === 0 ? 'no images on listing' : undefined }
    },
  },
  {
    id: 'TIKTOK_TITLE_LENGTH',
    severity: 'error',
    channel: 'tiktok',
    message: 'TikTok Shop titles must be 60 characters or fewer.',
    remediation: 'Shorten the title to ≤60 characters.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const len = String(listing.title ?? '').length
      return { pass: len > 0 && len <= 60, detail: `title is ${len} chars` }
    },
  },
  {
    id: 'TIKTOK_VIDEO_RECOMMENDED',
    severity: 'warning',
    channel: 'tiktok',
    message: 'TikTok Shop heavily favours listings with a product video in search and LIVE.',
    remediation: 'Upload a short product video (9:16, 5–60s) to the listing.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const v = listing.video_url ?? (Array.isArray(listing.videos) && listing.videos[0])
      return { pass: !!v }
    },
  },
  {
    id: 'TIKTOK_CATEGORY_MAPPED',
    severity: 'error',
    channel: 'tiktok',
    message: 'No TikTok Shop category_id is mapped for this listing.',
    remediation: 'Pick a TikTok Shop category in channel settings.',
    autoFixable: true,
    evaluate: ({ listingChannel }) => {
      const c = listingChannel?.metadata?.category_id
        ?? listingChannel?.external_category_id
        ?? listingChannel?.category_id
      return { pass: !!c }
    },
  },
  {
    id: 'TIKTOK_PACKAGE_DIMENSIONS',
    severity: 'error',
    channel: 'tiktok',
    message: 'TikTok Shop requires package length, width, and height.',
    remediation: 'Set package dimensions (cm) on the listing.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const l = Number(listing.package_length_cm)
      const w = Number(listing.package_width_cm)
      const h = Number(listing.package_height_cm)
      return { pass: l > 0 && w > 0 && h > 0 }
    },
  },
  {
    id: 'TIKTOK_PACKAGE_WEIGHT',
    severity: 'error',
    channel: 'tiktok',
    message: 'TikTok Shop requires package weight.',
    remediation: 'Set the variant weight in Shopify.',
    autoFixable: false,
    evaluate: ({ listing }) => ({
      pass: typeof listing.weight_grams === 'number' && listing.weight_grams > 0,
    }),
  },
  {
    id: 'TIKTOK_WARRANTY_POLICY',
    severity: 'warning',
    channel: 'tiktok',
    message: 'Listings with a warranty policy convert better on TikTok Shop.',
    remediation: 'Set a warranty period (months) and description on the listing.',
    autoFixable: false,
    evaluate: ({ listing, listingChannel }) => {
      const w = listing.warranty_period ?? listingChannel?.metadata?.warranty_period
      return { pass: !!w }
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
    id: 'TIKTOK_BRAND_SET',
    severity: 'warning',
    channel: 'tiktok',
    message: 'TikTok Shop recommends setting a brand for ranking.',
    remediation: 'Set Vendor (brand) in Shopify and re-sync.',
    autoFixable: false,
    evaluate: ({ listing }) => ({ pass: !!listing.brand && String(listing.brand).trim().length > 0 }),
  },
  {
    id: 'TIKTOK_SKU_LIMIT',
    severity: 'warning',
    channel: 'tiktok',
    message: 'TikTok Shop caps products at ~400 SKUs per product; very large variant sets fail to publish.',
    remediation: 'Split the product into multiple listings with ≤400 variants each.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const variants: unknown[] = Array.isArray(listing.variants) ? listing.variants : []
      return { pass: variants.length <= 400, detail: `${variants.length} variant(s)` }
    },
  },
]

registerChannelValidator('tiktok', { channel: 'tiktok', rules: TIKTOK_RULES })
