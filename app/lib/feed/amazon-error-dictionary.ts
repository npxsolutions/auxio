/**
 * Maps raw Amazon SP-API errors (Listings Items / Feeds) to plain-English
 * messages + remediation. Searches by code first (SP-API returns a string
 * `code` per error), then by substring match on `message`.
 *
 * Coverage: ~20 of the most commonly surfaced SP-API publish errors. Unmapped
 * errors return as `unknown_amazon_error` so observability still captures them.
 */
export interface MappedAmazonError {
  code: string
  amazonCode?: string
  match?: RegExp
  plainMessage: string
  remediation: string
}

export const AMAZON_ERROR_MAP: MappedAmazonError[] = [
  { code: 'INVALID_IMAGE', amazonCode: 'InvalidImageURL', plainMessage: 'Amazon could not fetch one of the image URLs.', remediation: 'Ensure images are HTTPS, ≥1000px, and publicly reachable.' },
  { code: 'MISSING_IMAGE', amazonCode: 'MissingMainImage', plainMessage: 'The main product image is missing.', remediation: 'Upload a pure-white-background main image in Shopify.' },
  { code: 'TITLE_TOO_LONG', amazonCode: 'ItemNameTooLong', match: /item_name.*(200|exceeds|too long)/i, plainMessage: 'Title exceeds the 200-character limit (or category-specific cap).', remediation: 'Shorten the title to ≤200 characters.' },
  { code: 'TITLE_REQUIRED', amazonCode: 'MissingItemName', plainMessage: 'item_name is required.', remediation: 'Set a non-empty title.' },
  { code: 'BRAND_REQUIRED', amazonCode: 'MissingBrand', plainMessage: 'Amazon requires a brand_name.', remediation: 'Set Vendor in Shopify to the brand name.' },
  { code: 'GTIN_REQUIRED', amazonCode: 'MissingExternalProductId', match: /(gtin|upc|ean).*required/i, plainMessage: 'Amazon requires a UPC/EAN (GTIN) unless GTIN-exempt.', remediation: 'Set the Shopify variant barcode, or apply for GTIN exemption.' },
  { code: 'GTIN_INVALID', amazonCode: 'InvalidExternalProductId', plainMessage: 'GTIN is invalid (bad check-digit or not registered).', remediation: 'Verify the barcode against the GS1 database.' },
  { code: 'GTIN_NOT_UNIQUE', amazonCode: 'GtinAlreadyInUse', plainMessage: 'This GTIN already maps to a different ASIN.', remediation: 'Match to the existing ASIN, or contact the brand owner.' },
  { code: 'CATEGORY_INVALID', amazonCode: 'InvalidBrowseNode', plainMessage: 'The browse_node_id is invalid for the marketplace.', remediation: 'Pick a valid Amazon browse node.' },
  { code: 'CATEGORY_REQUIRED', amazonCode: 'MissingBrowseNode', plainMessage: 'A browse_node_id is required.', remediation: 'Set a category in channel settings.' },
  { code: 'PRICE_INVALID', amazonCode: 'InvalidPrice', plainMessage: 'Price is invalid (zero, negative, or wrong currency).', remediation: 'Set price > 0 in the marketplace currency.' },
  { code: 'QUANTITY_INVALID', amazonCode: 'InvalidQuantity', plainMessage: 'Quantity must be ≥0.', remediation: 'Set a non-negative quantity.' },
  { code: 'CONDITION_REQUIRED', amazonCode: 'MissingCondition', plainMessage: 'Amazon requires a condition.', remediation: 'Set condition (new_new, used_like_new, etc.).' },
  { code: 'FULFILLMENT_CHANNEL_INVALID', amazonCode: 'InvalidFulfillmentChannel', match: /fulfillment.*channel/i, plainMessage: 'fulfillment_channel must be FBA or FBM.', remediation: 'Set fulfillment_channel to FBA or FBM.' },
  { code: 'VARIATION_THEME_INVALID', amazonCode: 'InvalidVariationTheme', plainMessage: 'Variation theme does not match the category.', remediation: 'Use a variation theme allowed in the product type schema.' },
  { code: 'PARENT_SKU_REQUIRED', amazonCode: 'MissingParentSku', plainMessage: 'Child SKUs require a parent SKU.', remediation: 'Create the parent product first.' },
  { code: 'BULLET_POINT_TOO_LONG', amazonCode: 'BulletPointTooLong', match: /bullet_point.*(exceeds|too long|500)/i, plainMessage: 'A bullet point exceeds 500 characters.', remediation: 'Shorten each bullet to ≤500 chars.' },
  { code: 'DESCRIPTION_TOO_LONG', amazonCode: 'DescriptionTooLong', plainMessage: 'Description exceeds 2000 characters.', remediation: 'Shorten description to ≤2000 chars.' },
  { code: 'AUTH_TOKEN_INVALID', amazonCode: 'AccessDenied', match: /(token|access).*(invalid|expired|denied)/i, plainMessage: 'Your Amazon SP-API connection has expired or is unauthorized.', remediation: 'Reconnect Amazon in Palvento → Channels.' },
  { code: 'RATE_LIMITED', amazonCode: 'QuotaExceeded', match: /(quota|rate limit|429)/i, plainMessage: 'Amazon temporarily throttled this request.', remediation: 'Palvento will retry automatically; no action needed.' },
  { code: 'ASIN_MISMATCH', amazonCode: 'AsinMismatch', plainMessage: 'The supplied ASIN does not match the product identifiers.', remediation: 'Remove the ASIN, or ensure GTIN/brand match the catalog entry.' },
  { code: 'RESTRICTED_CATEGORY', amazonCode: 'CategoryApprovalRequired', plainMessage: 'This category requires seller approval on Amazon.', remediation: 'Apply for approval in Seller Central → Add a Product.' },
  { code: 'COMPLIANCE_DOC_REQUIRED', amazonCode: 'MissingComplianceDoc', plainMessage: 'Amazon requires a compliance document (safety / CE) for this product.', remediation: 'Upload the required document in Seller Central.' },
]

export interface ParsedAmazonError {
  mapped: MappedAmazonError | null
  raw: string
  amazonCode?: string
}

export function mapAmazonError(raw: string): ParsedAmazonError {
  let parsed: any = null
  try { parsed = JSON.parse(raw) } catch { /* not JSON */ }
  const errs: any[] = parsed?.errors ?? (parsed?.error ? [parsed.error] : [])
  const first = errs[0] ?? {}
  const code: string | undefined = typeof first.code === 'string' ? first.code : undefined
  const text: string = first.message ?? first.details ?? raw

  if (code) {
    const byCode = AMAZON_ERROR_MAP.find(m => m.amazonCode === code)
    if (byCode) return { mapped: byCode, raw, amazonCode: code }
  }
  const byMatch = AMAZON_ERROR_MAP.find(m => m.match && m.match.test(text))
  if (byMatch) return { mapped: byMatch, raw, amazonCode: code }
  return { mapped: null, raw, amazonCode: code }
}

export const AMAZON_ERROR_MAP_SIZE = AMAZON_ERROR_MAP.length
