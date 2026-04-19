/**
 * Maps raw Google Content API (Shopping v2.1) errors to plain-English
 * messages + remediation. Google returns errors as `errors[].reason` strings;
 * we match on reason first, then substring on message.
 *
 * Coverage: ~25 of the most commonly surfaced Content API publish errors.
 *
 * Reference: https://developers.google.com/shopping-content/reference/rest/v2.1/products
 */
export interface MappedGoogleError {
  code: string
  googleReason?: string
  match?: RegExp
  plainMessage: string
  remediation: string
}

export const GOOGLE_ERROR_MAP: MappedGoogleError[] = [
  { code: 'INVALID_IMAGE', googleReason: 'invalid_image_link', plainMessage: 'Google could not fetch the image_link URL.', remediation: 'Ensure images are HTTPS, ≥100×100 px, and publicly reachable.' },
  { code: 'IMAGE_TOO_SMALL', googleReason: 'image_resolution_low', plainMessage: 'Image resolution is below the minimum (100×100, 250×250 for apparel).', remediation: 'Upload a higher-resolution image in Shopify.' },
  { code: 'MISSING_IMAGE', googleReason: 'missing_image_link', plainMessage: 'No image_link was supplied.', remediation: 'Add a product image in Shopify.' },

  { code: 'TITLE_REQUIRED', googleReason: 'missing_title', plainMessage: 'title is required.', remediation: 'Set a non-empty title.' },
  { code: 'TITLE_TOO_LONG', googleReason: 'title_too_long', match: /title.*(150|exceeds|too long)/i, plainMessage: 'Title exceeds the 150-character limit.', remediation: 'Shorten the title to ≤150 characters.' },

  { code: 'DESCRIPTION_REQUIRED', googleReason: 'missing_description', plainMessage: 'description is required.', remediation: 'Add a product description in Shopify.' },
  { code: 'DESCRIPTION_TOO_LONG', googleReason: 'description_too_long', plainMessage: 'Description exceeds the 5000-character limit.', remediation: 'Shorten description to ≤5000 chars.' },

  { code: 'PRICE_MISSING', googleReason: 'missing_price', plainMessage: 'price is required.', remediation: 'Set a positive price on the variant.' },
  { code: 'PRICE_INVALID', googleReason: 'invalid_price', plainMessage: 'Price is invalid (zero, negative, or currency mismatch).', remediation: 'Set price > 0 in the merchant-center currency.' },
  { code: 'PRICE_MISMATCH', googleReason: 'landing_page_price_mismatch', plainMessage: 'Price on your product feed does not match the landing page.', remediation: 'Ensure Shopify product price matches what Google crawls on the product URL.' },

  { code: 'AVAILABILITY_INVALID', googleReason: 'invalid_availability', plainMessage: 'availability must be in_stock, out_of_stock, preorder, or backorder.', remediation: 'Check inventory policy in Shopify.' },

  { code: 'GTIN_REQUIRED', googleReason: 'missing_gtin_or_brand', plainMessage: 'Google requires a GTIN (or brand + MPN) to identify the product.', remediation: 'Set Shopify variant barcode, or provide both brand and MPN.' },
  { code: 'GTIN_INVALID', googleReason: 'invalid_gtin', plainMessage: 'GTIN is invalid (bad check-digit).', remediation: 'Verify the barcode against the GS1 database.' },
  { code: 'MPN_REQUIRED', googleReason: 'missing_mpn', plainMessage: 'MPN is required when GTIN is unavailable.', remediation: 'Set an MPN (variant SKU is commonly used).' },
  { code: 'BRAND_REQUIRED', googleReason: 'missing_brand', plainMessage: 'Google requires a brand.', remediation: 'Set Shopify vendor to the brand name.' },

  { code: 'CATEGORY_INVALID', googleReason: 'invalid_google_product_category', plainMessage: 'google_product_category is invalid.', remediation: 'Pick a category from the Google Shopping taxonomy.' },
  { code: 'CATEGORY_REQUIRED', googleReason: 'missing_google_product_category', plainMessage: 'google_product_category is required.', remediation: 'Map a category in channel settings.' },

  { code: 'LANDING_PAGE_NOT_CRAWLABLE', googleReason: 'landing_page_not_crawlable', plainMessage: 'Google cannot reach the product landing page.', remediation: 'Check that the product is not hidden from online store and robots.txt allows Googlebot.' },
  { code: 'LANDING_PAGE_UNAVAILABLE', googleReason: 'landing_page_not_found', plainMessage: 'Landing page returned 404 or 5xx.', remediation: 'Ensure the Shopify product is published and the URL resolves.' },

  { code: 'POLICY_VIOLATION', googleReason: 'policy_violation', plainMessage: 'Product violates Google Shopping policies.', remediation: 'Review the policy page linked in Merchant Center > Diagnostics.' },
  { code: 'RESTRICTED_PRODUCT', googleReason: 'restricted_product', plainMessage: 'Product is in a restricted category (alcohol, supplements, etc.).', remediation: 'Apply for the restricted-category permission in Merchant Center.' },

  { code: 'AUTH_TOKEN_INVALID', googleReason: 'authError', match: /(token|access).*(invalid|expired|denied|401)/i, plainMessage: 'Your Google Merchant Center connection has expired or is unauthorized.', remediation: 'Reconnect Google in Palvento → Channels.' },
  { code: 'QUOTA_EXCEEDED', googleReason: 'quotaExceeded', match: /(quota|rate limit|429)/i, plainMessage: 'Google temporarily throttled this request.', remediation: 'Palvento will retry automatically; no action needed.' },
  { code: 'MERCHANT_NOT_FOUND', googleReason: 'merchantNotFound', plainMessage: 'Merchant account not found or not linked.', remediation: 'Reconnect Google Merchant Center, then pick the correct account.' },
  { code: 'MERCHANT_SUSPENDED', googleReason: 'accountSuspended', plainMessage: 'Your Merchant Center account is suspended.', remediation: 'Resolve the issue in Merchant Center > Diagnostics before re-enabling sync.' },
]

export interface ParsedGoogleError {
  mapped: MappedGoogleError | null
  raw: string
  googleReason?: string
}

export function mapGoogleError(raw: string): ParsedGoogleError {
  let parsed: unknown = null
  try { parsed = JSON.parse(raw) } catch { /* not JSON */ }
  const errorRoot = (parsed as { error?: { errors?: unknown[]; message?: string } } | null)?.error
  const errs: Array<{ reason?: string; message?: string }> = Array.isArray(errorRoot?.errors)
    ? (errorRoot!.errors as Array<{ reason?: string; message?: string }>)
    : []
  const first = errs[0] ?? {}
  const reason: string | undefined = typeof first.reason === 'string' ? first.reason : undefined
  const text: string = first.message ?? errorRoot?.message ?? raw

  if (reason) {
    const byReason = GOOGLE_ERROR_MAP.find(m => m.googleReason === reason)
    if (byReason) return { mapped: byReason, raw, googleReason: reason }
  }
  const byMatch = GOOGLE_ERROR_MAP.find(m => m.match && m.match.test(text))
  if (byMatch) return { mapped: byMatch, raw, googleReason: reason }
  return { mapped: null, raw, googleReason: reason }
}

export const GOOGLE_ERROR_MAP_SIZE = GOOGLE_ERROR_MAP.length
