/**
 * Maps raw eBay Sell-API errors to plain-English messages + remediation.
 * When a publish call returns an error body, `mapEbayError` searches by
 * eBay errorId (numeric) first, then by substring of the message text.
 *
 * Coverage: ~30 of the most frequently surfaced eBay publish errors observed
 * across our sync_log. Unmapped errors are returned as `unknown_ebay_error`
 * for observability.
 */
export interface MappedEbayError {
  code: string
  errorId?: number
  match?: RegExp
  plainMessage: string
  remediation: string
}

export const EBAY_ERROR_MAP: MappedEbayError[] = [
  { code: 'IMAGE_REQUIRED', errorId: 25002, plainMessage: 'eBay rejected the listing because no image URL was supplied.', remediation: 'Add at least one product image and republish.' },
  { code: 'IMAGE_INVALID_URL', errorId: 25003, plainMessage: 'One of your image URLs is invalid or unreachable.', remediation: 'Check that all images are HTTPS and publicly accessible.' },
  { code: 'TITLE_TOO_LONG', errorId: 25007, match: /title.*(80|exceeds)/i, plainMessage: 'Your title is over the 80-character eBay limit.', remediation: 'Shorten the title to ≤80 characters.' },
  { code: 'TITLE_REQUIRED', errorId: 25006, plainMessage: 'eBay requires a non-empty title.', remediation: 'Set a title on the listing.' },
  { code: 'CATEGORY_REQUIRED', errorId: 25008, plainMessage: 'No eBay category was provided.', remediation: 'Pick an eBay category for the listing.' },
  { code: 'CATEGORY_INVALID', errorId: 25009, plainMessage: 'The chosen eBay category is invalid or no longer accepts listings.', remediation: 'Re-map the listing to a valid leaf category.' },
  { code: 'CONDITION_REQUIRED', errorId: 25011, plainMessage: 'eBay requires a condition (New / Used / etc.).', remediation: 'Set a condition on the listing.' },
  { code: 'CONDITION_INVALID', errorId: 25012, plainMessage: 'The condition value is not valid for this category.', remediation: 'Use a condition supported by this eBay category.' },
  { code: 'GTIN_REQUIRED', errorId: 25018, match: /gtin.*required/i, plainMessage: 'This eBay category requires a UPC, EAN, or ISBN.', remediation: 'Set the Shopify variant barcode to a valid GTIN.' },
  { code: 'GTIN_INVALID', errorId: 25019, plainMessage: 'The GTIN supplied is not valid.', remediation: 'Verify the barcode is a real UPC/EAN with correct check-digit.' },
  { code: 'BRAND_REQUIRED', errorId: 25020, plainMessage: 'eBay requires a Brand aspect for this category.', remediation: 'Set Vendor in Shopify to the brand name.' },
  { code: 'MPN_REQUIRED', errorId: 25021, plainMessage: 'Manufacturer Part Number (MPN) is required.', remediation: 'Add an MPN aspect or use Does Not Apply.' },
  { code: 'ASPECT_REQUIRED', errorId: 25022, match: /aspect.*required/i, plainMessage: 'A required item-specific (aspect) is missing.', remediation: 'Fill in the highlighted item specifics for this category.' },
  { code: 'ASPECT_INVALID', errorId: 25023, plainMessage: 'One of the item specifics has an invalid value.', remediation: 'Check the aspect against eBay’s allowed values.' },
  { code: 'PRICE_REQUIRED', errorId: 25030, plainMessage: 'Price is required.', remediation: 'Set a positive price on the Shopify variant.' },
  { code: 'PRICE_INVALID', errorId: 25031, plainMessage: 'Price is invalid (zero or negative).', remediation: 'Set price > 0.' },
  { code: 'QUANTITY_INVALID', errorId: 25032, plainMessage: 'Quantity must be at least 1 for fixed-price listings.', remediation: 'Increase Shopify inventory to ≥1.' },
  { code: 'PAYMENT_POLICY_REQUIRED', errorId: 25040, match: /payment.*policy/i, plainMessage: 'Payment business policy is missing.', remediation: 'Create a Payment policy in eBay → Account → Business Policies.' },
  { code: 'RETURN_POLICY_REQUIRED', errorId: 25041, match: /return.*policy/i, plainMessage: 'Return business policy is missing.', remediation: 'Create a Return policy in eBay → Account → Business Policies.' },
  { code: 'FULFILLMENT_POLICY_REQUIRED', errorId: 25042, match: /fulfillment.*policy|shipping.*policy/i, plainMessage: 'Fulfillment (shipping) business policy is missing.', remediation: 'Create a Postage policy in eBay → Account → Business Policies.' },
  { code: 'LOCATION_REQUIRED', errorId: 25043, plainMessage: 'A merchant location must exist before publishing.', remediation: 'Meridia normally creates one automatically — try republishing.' },
  { code: 'INVENTORY_LOCATION_DISABLED', errorId: 25044, plainMessage: 'The merchant location is disabled.', remediation: 'Enable the inventory location in eBay seller hub.' },
  { code: 'CURRENCY_INVALID', errorId: 25050, plainMessage: 'Currency does not match the marketplace.', remediation: 'Use GBP for EBAY_GB, USD for EBAY_US, etc.' },
  { code: 'DESCRIPTION_REQUIRED', errorId: 25060, plainMessage: 'A description is required.', remediation: 'Add a description in Shopify or in the Meridia editor.' },
  { code: 'DESCRIPTION_HTML_UNSAFE', errorId: 25061, plainMessage: 'Description contains disallowed HTML (script/iframe).', remediation: 'Remove script, iframe, and style tags.' },
  { code: 'WEIGHT_REQUIRED', errorId: 25070, match: /weight/i, plainMessage: 'Package weight is required for this category.', remediation: 'Set the variant weight in Shopify.' },
  { code: 'DIMENSION_REQUIRED', errorId: 25071, plainMessage: 'Package dimensions are required.', remediation: 'Set dimensions in the listing settings.' },
  { code: 'SKU_DUPLICATE', errorId: 25080, match: /duplicate sku/i, plainMessage: 'Another active eBay listing already uses this SKU.', remediation: 'End the conflicting listing or choose a unique SKU.' },
  { code: 'AUTH_TOKEN_INVALID', errorId: 1001, match: /token.*(invalid|expired)/i, plainMessage: 'Your eBay connection has expired.', remediation: 'Reconnect eBay in Meridia → Channels.' },
  { code: 'INSUFFICIENT_PERMISSIONS', errorId: 1002, plainMessage: 'Your eBay account is missing required permissions.', remediation: 'Re-authorize Meridia and grant all requested scopes.' },
  { code: 'RATE_LIMITED', errorId: 2001, match: /rate limit|429/i, plainMessage: 'eBay temporarily throttled this request.', remediation: 'Meridia will retry automatically; no action needed.' },
  { code: 'CATEGORY_LEAF_REQUIRED', errorId: 25090, match: /leaf category/i, plainMessage: 'eBay requires a leaf-level category, not a parent.', remediation: 'Pick a more specific sub-category.' },
]

export interface ParsedEbayError {
  mapped: MappedEbayError | null
  raw: string
  errorId?: number
}

export function mapEbayError(raw: string): ParsedEbayError {
  let parsed: any = null
  try { parsed = JSON.parse(raw) } catch { /* not JSON */ }
  const errs: any[] = parsed?.errors ?? (parsed?.error ? [parsed.error] : [])
  const first = errs[0] ?? {}
  const errorId: number | undefined = typeof first.errorId === 'number' ? first.errorId : undefined
  const text: string = first.message ?? first.longMessage ?? raw

  if (errorId !== undefined) {
    const byId = EBAY_ERROR_MAP.find(m => m.errorId === errorId)
    if (byId) return { mapped: byId, raw, errorId }
  }
  const byMatch = EBAY_ERROR_MAP.find(m => m.match && m.match.test(text))
  if (byMatch) return { mapped: byMatch, raw, errorId }
  return { mapped: null, raw, errorId }
}

export const EBAY_ERROR_MAP_SIZE = EBAY_ERROR_MAP.length
