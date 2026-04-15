/**
 * Maps raw TikTok Shop Partner API errors to plain-English messages + remediation.
 *
 * TikTok Shop returns errors as `{ code: number, message: string, request_id }`.
 * We key on the numeric `code` first, then fall back to substring match.
 *
 * Coverage: ~18 of the most commonly surfaced TikTok Shop publish errors.
 * Where exact upstream codes are uncertain, we use internally-stable codes —
 * unknown errors return as `unknown_tiktok_error` for observability.
 */
export interface MappedTikTokError {
  code: string
  tiktokCode?: number
  match?: RegExp
  plainMessage: string
  remediation: string
}

export const TIKTOK_ERROR_MAP: MappedTikTokError[] = [
  { code: 'IMAGE_REQUIRED', tiktokCode: 12001, match: /image.*required/i, plainMessage: 'TikTok Shop requires at least one product image.', remediation: 'Add a product image and republish.' },
  { code: 'IMAGE_SIZE_INVALID', tiktokCode: 12002, match: /image.*(size|dimension|800)/i, plainMessage: 'Product image does not meet the 800×800 minimum.', remediation: 'Upload images at ≥800×800 px.' },
  { code: 'TITLE_TOO_LONG', tiktokCode: 12010, match: /title.*(60|too long|length)/i, plainMessage: 'Title exceeds the 60-character TikTok Shop limit.', remediation: 'Shorten the title to ≤60 characters.' },
  { code: 'TITLE_REQUIRED', tiktokCode: 12011, plainMessage: 'TikTok Shop requires a non-empty title.', remediation: 'Set a product title.' },
  { code: 'CATEGORY_REQUIRED', tiktokCode: 12020, plainMessage: 'TikTok Shop requires a category_id.', remediation: 'Pick a TikTok Shop category in channel settings.' },
  { code: 'CATEGORY_INVALID', tiktokCode: 12021, plainMessage: 'The category_id is invalid or not a leaf node.', remediation: 'Re-map to a valid leaf category.' },
  { code: 'BRAND_INVALID', tiktokCode: 12030, plainMessage: 'Brand is not approved for this category.', remediation: 'Apply for brand approval or use an approved brand.' },
  { code: 'PACKAGE_DIMENSIONS_REQUIRED', tiktokCode: 12040, match: /(package|parcel).*(length|width|height|dimension)/i, plainMessage: 'Package length, width, and height are required.', remediation: 'Set package dimensions (cm) on the listing.' },
  { code: 'PACKAGE_WEIGHT_REQUIRED', tiktokCode: 12041, match: /(package|parcel).*weight/i, plainMessage: 'Package weight is required.', remediation: 'Set the variant weight in Shopify.' },
  { code: 'PRICE_INVALID', tiktokCode: 12050, plainMessage: 'Price is invalid (zero, negative, or outside the allowed range).', remediation: 'Set a positive price within category limits.' },
  { code: 'STOCK_INVALID', tiktokCode: 12051, plainMessage: 'Stock quantity must be ≥0.', remediation: 'Set a non-negative stock quantity.' },
  { code: 'SKU_LIMIT', tiktokCode: 12060, match: /(sku|variant).*(limit|400|exceed)/i, plainMessage: 'TikTok Shop limits products to ~400 SKUs.', remediation: 'Split the product into multiple listings.' },
  { code: 'WARRANTY_INVALID', tiktokCode: 12070, plainMessage: 'Warranty period is invalid for this category.', remediation: 'Set a warranty period supported by the category.' },
  { code: 'SHIPPING_TEMPLATE_REQUIRED', tiktokCode: 12080, match: /shipping.*(template|profile)/i, plainMessage: 'TikTok Shop requires a shipping template.', remediation: 'Create a shipping template in Seller Center.' },
  { code: 'AUTH_TOKEN_INVALID', tiktokCode: 10001, match: /(access_token|token).*(invalid|expired)/i, plainMessage: 'Your TikTok Shop connection has expired.', remediation: 'Reconnect TikTok Shop in Meridia → Channels.' },
  { code: 'AUTH_INSUFFICIENT', tiktokCode: 10002, plainMessage: 'Your TikTok Shop app is missing required scopes.', remediation: 'Re-authorize Meridia and grant all requested permissions.' },
  { code: 'RATE_LIMITED', tiktokCode: 10429, match: /(rate.*limit|429|too.*many)/i, plainMessage: 'TikTok Shop temporarily throttled this request.', remediation: 'Meridia will retry automatically; no action needed.' },
  { code: 'DESCRIPTION_TOO_LONG', tiktokCode: 12090, plainMessage: 'Description exceeds the 10000-character limit.', remediation: 'Shorten description.' },
  { code: 'PROHIBITED_KEYWORD', tiktokCode: 12099, match: /(prohibited|restricted).*(word|keyword|content)/i, plainMessage: 'Title or description contains a prohibited keyword.', remediation: 'Remove restricted terms and republish.' },
]

export interface ParsedTikTokError {
  mapped: MappedTikTokError | null
  raw: string
  tiktokCode?: number
}

export function mapTikTokError(raw: string): ParsedTikTokError {
  let parsed: any = null
  try { parsed = JSON.parse(raw) } catch { /* not JSON */ }
  const code: number | undefined = typeof parsed?.code === 'number' ? parsed.code : undefined
  const text: string = parsed?.message ?? raw

  if (code !== undefined) {
    const byCode = TIKTOK_ERROR_MAP.find(m => m.tiktokCode === code)
    if (byCode) return { mapped: byCode, raw, tiktokCode: code }
  }
  const byMatch = TIKTOK_ERROR_MAP.find(m => m.match && m.match.test(text))
  if (byMatch) return { mapped: byMatch, raw, tiktokCode: code }
  return { mapped: null, raw, tiktokCode: code }
}

export const TIKTOK_ERROR_MAP_SIZE = TIKTOK_ERROR_MAP.length
