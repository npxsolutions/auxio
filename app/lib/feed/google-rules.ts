/**
 * Google Merchant Center (Content API for Shopping v2.1) pre-flight validator.
 *
 * Rules mirror the structure of amazon-rules.ts. Each rule is pure and
 * idempotent; they register into the shared validator registry on module load
 * so `validateForChannel(listingId, 'google')` picks them up.
 *
 * Product data spec: https://support.google.com/merchants/answer/7052112
 *
 * Log prefix: [feed:google-rules]
 */
import { registerChannelValidator, type RegisteredRule } from './validator'

const VALID_AVAILABILITY = new Set(['in_stock', 'out_of_stock', 'preorder', 'backorder'])
const VALID_CONDITION = new Set(['new', 'refurbished', 'used'])

export const GOOGLE_RULES: RegisteredRule[] = [
  {
    id: 'GOOGLE_IMAGE_REQUIRED',
    severity: 'error',
    channel: 'google',
    message: 'Google Shopping requires a primary image (image_link).',
    remediation: 'Add a product image in Shopify. Minimum 100×100 px (250×250 for apparel).',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const imgs: unknown[] = Array.isArray(listing.images) ? listing.images : []
      return { pass: imgs.length >= 1, detail: imgs.length === 0 ? 'no images on listing' : undefined }
    },
  },
  {
    id: 'GOOGLE_TITLE_LENGTH',
    severity: 'error',
    channel: 'google',
    message: 'Google titles must be 1–150 characters (70 recommended for apparel).',
    remediation: 'Shorten the title to ≤150 characters; aim for the first 70 to contain the key terms.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const len = String(listing.title ?? '').length
      return { pass: len > 0 && len <= 150, detail: `title is ${len} chars` }
    },
  },
  {
    id: 'GOOGLE_DESCRIPTION_REQUIRED',
    severity: 'error',
    channel: 'google',
    message: 'Google requires a product description (1–5000 chars).',
    remediation: 'Add a description in Shopify. Plain text; HTML tags are stripped.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const desc = String(listing.description ?? '').trim()
      return { pass: desc.length >= 1 && desc.length <= 5000, detail: `description is ${desc.length} chars` }
    },
  },
  {
    id: 'GOOGLE_PRICE_VALID',
    severity: 'error',
    channel: 'google',
    message: 'Google requires a price greater than 0.',
    remediation: 'Set a positive price on the Shopify variant.',
    autoFixable: false,
    evaluate: ({ listing }) => ({
      pass: typeof listing.price === 'number' && listing.price > 0,
    }),
  },
  {
    id: 'GOOGLE_AVAILABILITY_VALID',
    severity: 'error',
    channel: 'google',
    message: 'Availability must be one of: in_stock, out_of_stock, preorder, backorder.',
    remediation: 'Google infers from Shopify inventory; check your inventory policy is set.',
    autoFixable: true,
    evaluate: ({ listing }) => {
      // listing.availability may be unset; we derive from quantity at publish time,
      // so absence is acceptable here. Only fail on an explicitly invalid value.
      const val = listing.availability
      if (val == null) return { pass: true }
      return { pass: VALID_AVAILABILITY.has(String(val)), detail: `availability="${val}"` }
    },
  },
  {
    id: 'GOOGLE_CONDITION_VALID',
    severity: 'warning',
    channel: 'google',
    message: 'Condition must be one of: new, refurbished, used. Defaults to "new" if absent.',
    remediation: 'Set a condition on the listing; Google rejects unknown values.',
    autoFixable: true,
    evaluate: ({ listing }) => {
      const val = listing.condition
      if (val == null || val === '') return { pass: true }
      return { pass: VALID_CONDITION.has(String(val)), detail: `condition="${val}"` }
    },
  },
  {
    id: 'GOOGLE_GTIN_OR_IDENTIFIER',
    severity: 'error',
    channel: 'google',
    message: 'Google requires GTIN (UPC/EAN/ISBN) OR brand + MPN to identify the product.',
    remediation: 'Set Shopify variant barcode, or set both a brand and MPN on the listing.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const gtin = listing.barcode ?? listing.gtin
      if (gtin && String(gtin).trim().length >= 8) return { pass: true }
      const brand = String(listing.brand ?? '').trim()
      const mpn   = String(listing.mpn ?? listing.sku ?? '').trim()
      const ok = brand.length > 0 && mpn.length > 0
      return { pass: ok, detail: ok ? undefined : `gtin="${gtin ?? ''}", brand="${brand}", mpn="${mpn}"` }
    },
  },
  {
    id: 'GOOGLE_BRAND_REQUIRED',
    severity: 'warning',
    channel: 'google',
    message: 'Google strongly recommends a brand for all products except media/custom-made.',
    remediation: 'Set a brand on the listing or the Shopify vendor.',
    autoFixable: false,
    evaluate: ({ listing }) => ({
      pass: typeof listing.brand === 'string' && listing.brand.trim().length > 0,
    }),
  },
  {
    id: 'GOOGLE_CATEGORY_MAPPED',
    severity: 'error',
    channel: 'google',
    message: 'No google_product_category is mapped for this listing.',
    remediation: 'Pick a Google product category (or let auto-mapping run against Shopify product_type).',
    autoFixable: true,
    evaluate: ({ listing, listingChannel }) => {
      const cat =
        listingChannel?.metadata?.google_product_category ??
        listingChannel?.external_category_id ??
        listingChannel?.category_id ??
        listing.google_product_category
      return { pass: !!cat }
    },
  },
  {
    id: 'GOOGLE_LANDING_PAGE_REQUIRED',
    severity: 'error',
    channel: 'google',
    message: 'Google requires a link to a publicly accessible product page.',
    remediation: 'Shopify will provide the canonical URL at publish time — ensure the product is not hidden from online store.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const url = listing.product_url ?? listing.handle ?? listing.shopify_handle
      return { pass: !!url && String(url).trim().length > 0 }
    },
  },
]

registerChannelValidator('google', { channel: 'google', rules: GOOGLE_RULES })
