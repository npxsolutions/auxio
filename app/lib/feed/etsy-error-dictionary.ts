/**
 * Maps raw Etsy Open API v3 errors to plain-English messages + remediation.
 * Etsy returns errors as HTTP status + JSON body with `error` / `error_description`
 * or a `message` string. We match by code label first, then by substring.
 *
 * Coverage: ~18 of the most commonly surfaced Etsy publish errors.
 */
export interface MappedEtsyError {
  code: string
  etsyCode?: string
  match?: RegExp
  plainMessage: string
  remediation: string
}

export const ETSY_ERROR_MAP: MappedEtsyError[] = [
  { code: 'IMAGE_REQUIRED', etsyCode: 'listing_image_required', plainMessage: 'Etsy requires at least one listing image.', remediation: 'Add a product image and republish.' },
  { code: 'IMAGE_TOO_MANY', etsyCode: 'listing_image_limit', match: /image.*(10|limit|exceed)/i, plainMessage: 'Etsy allows at most 10 images per listing.', remediation: 'Remove some images to get under 10.' },
  { code: 'TITLE_TOO_LONG', etsyCode: 'title_too_long', match: /title.*(140|too long)/i, plainMessage: 'Title exceeds the 140-character Etsy limit.', remediation: 'Shorten the title to ≤140 characters.' },
  { code: 'TITLE_INVALID_CHARS', etsyCode: 'invalid_title_characters', match: /title.*(characters|special)/i, plainMessage: 'Title contains characters Etsy does not allow.', remediation: 'Remove special characters and emoji from the title.' },
  { code: 'TAG_LIMIT', etsyCode: 'tag_limit_exceeded', match: /tags?.*13/i, plainMessage: 'Etsy allows at most 13 tags per listing.', remediation: 'Reduce the tag list to 13 entries.' },
  { code: 'TAG_INVALID', etsyCode: 'invalid_tag', plainMessage: 'A tag is invalid (too long or prohibited).', remediation: 'Each tag must be ≤20 characters, letters/numbers only.' },
  { code: 'TAXONOMY_REQUIRED', etsyCode: 'missing_taxonomy_id', plainMessage: 'Etsy requires a taxonomy_id (category).', remediation: 'Pick an Etsy taxonomy in channel settings.' },
  { code: 'TAXONOMY_INVALID', etsyCode: 'invalid_taxonomy_id', plainMessage: 'The taxonomy_id is invalid or not a leaf node.', remediation: 'Re-map to a valid leaf taxonomy.' },
  { code: 'WHO_MADE_REQUIRED', etsyCode: 'missing_who_made', plainMessage: 'who_made is required (i_did / someone_else / collective).', remediation: 'Set who_made on the listing.' },
  { code: 'WHEN_MADE_REQUIRED', etsyCode: 'missing_when_made', plainMessage: 'when_made is required (e.g. made_to_order).', remediation: 'Set when_made on the listing.' },
  { code: 'IS_SUPPLY_REQUIRED', etsyCode: 'missing_is_supply', plainMessage: 'is_supply (boolean) is required.', remediation: 'Set is_supply on the listing.' },
  { code: 'PRICE_INVALID', etsyCode: 'invalid_price', plainMessage: 'Price is invalid (zero, negative, or wrong currency).', remediation: 'Set price > 0 in the shop currency.' },
  { code: 'QUANTITY_INVALID', etsyCode: 'invalid_quantity', plainMessage: 'Quantity must be ≥1 for active listings.', remediation: 'Increase inventory to ≥1.' },
  { code: 'SHIPPING_TEMPLATE_REQUIRED', etsyCode: 'missing_shipping_template', match: /shipping.*(template|profile)/i, plainMessage: 'Etsy requires a shipping profile / template.', remediation: 'Create a shipping profile in Etsy and assign it.' },
  { code: 'SHOP_NOT_READY', etsyCode: 'shop_not_open', plainMessage: 'Your Etsy shop is not open or is in vacation mode.', remediation: 'Re-open the shop in Etsy shop settings.' },
  { code: 'AUTH_TOKEN_INVALID', etsyCode: 'invalid_token', match: /(token|oauth).*(invalid|expired)/i, plainMessage: 'Your Etsy connection has expired.', remediation: 'Reconnect Etsy in Meridia → Channels.' },
  { code: 'RATE_LIMITED', etsyCode: 'rate_limit', match: /(rate.*limit|429|too.*many)/i, plainMessage: 'Etsy temporarily throttled this request.', remediation: 'Meridia will retry automatically; no action needed.' },
  { code: 'DESCRIPTION_REQUIRED', etsyCode: 'missing_description', plainMessage: 'Etsy requires a non-empty description.', remediation: 'Add a description in Shopify or Meridia.' },
  { code: 'VARIATION_INVALID', etsyCode: 'invalid_variation', plainMessage: 'A variation property/value pair is invalid for this taxonomy.', remediation: 'Use only variations supported by the taxonomy.' },
  { code: 'MATERIALS_INVALID', etsyCode: 'invalid_materials', plainMessage: 'Materials list contains invalid entries.', remediation: 'Each material must be ≤45 chars, letters/numbers/spaces.' },
]

export interface ParsedEtsyError {
  mapped: MappedEtsyError | null
  raw: string
  etsyCode?: string
}

export function mapEtsyError(raw: string): ParsedEtsyError {
  let parsed: any = null
  try { parsed = JSON.parse(raw) } catch { /* not JSON */ }
  const code: string | undefined = parsed?.error ?? parsed?.code
  const text: string = parsed?.error_description ?? parsed?.message ?? raw

  if (code) {
    const byCode = ETSY_ERROR_MAP.find(m => m.etsyCode === code)
    if (byCode) return { mapped: byCode, raw, etsyCode: code }
  }
  const byMatch = ETSY_ERROR_MAP.find(m => m.match && m.match.test(text))
  if (byMatch) return { mapped: byMatch, raw, etsyCode: code }
  return { mapped: null, raw, etsyCode: code }
}

export const ETSY_ERROR_MAP_SIZE = ETSY_ERROR_MAP.length
