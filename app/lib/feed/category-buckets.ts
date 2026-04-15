// Coarse category buckets used by the feed-benchmarking rollups.
// We aggressively collapse per-channel taxonomies into ~20 stable buckets so
// that rollups remain comparable across eBay, Etsy, Shopify, etc. and so that
// the k-anonymity privacy floor (>= 10 distinct users) is reachable inside a
// reasonable time window.
//
// Input can be:
//   - an eBay numeric category id (string of digits)
//   - a free-text category path ("Clothing, Shoes & Accessories > Men > Shirts")
//   - Shopify-style single-token category ("Apparel > Shirts")
//   - null / undefined / garbage
// Output is always one of CATEGORY_BUCKETS (with 'unknown' as fallback).

export const CATEGORY_BUCKETS = [
  'apparel-mens',
  'apparel-womens',
  'apparel-kids',
  'home-kitchen',
  'home-decor',
  'home-bed',
  'electronics-mobile',
  'electronics-computing',
  'beauty-skincare',
  'beauty-makeup',
  'sports',
  'toys',
  'books',
  'pet',
  'baby',
  'jewelry',
  'automotive',
  'crafts',
  'office',
  'unknown',
] as const

export type CategoryBucket = (typeof CATEGORY_BUCKETS)[number]

// Keyword rules — order matters (first match wins). We keep this deliberately
// boring: the rollup is only as good as the bucketing, but a 60-70% hit rate
// with a real 'unknown' escape is far better than a fake 95% with silent
// misclassifications.
const KEYWORD_RULES: Array<{ bucket: CategoryBucket; patterns: RegExp[] }> = [
  { bucket: 'apparel-kids',     patterns: [/\b(kids|children|infant|boys|girls|toddler)\b.*\b(cloth|apparel|shirt|dress|shoe)/i, /\bbaby\s+cloth/i] },
  { bucket: 'apparel-womens',   patterns: [/\b(women|womens|ladies|female)\b.*\b(cloth|apparel|shirt|dress|shoe|top|skirt)/i, /\bdress(es)?\b/i] },
  { bucket: 'apparel-mens',     patterns: [/\b(men|mens|male)\b.*\b(cloth|apparel|shirt|trouser|shoe|suit)/i] },
  { bucket: 'jewelry',          patterns: [/\bjewel(le)?ry\b/i, /\b(ring|necklace|bracelet|earring)s?\b/i, /\bwatch(es)?\b/i] },
  { bucket: 'home-kitchen',     patterns: [/\bkitchen\b/i, /\bcookware\b/i, /\btableware\b/i, /\bdining\b/i] },
  { bucket: 'home-bed',         patterns: [/\b(bed|bedroom|bedding|mattress|pillow|duvet|linen)\b/i] },
  { bucket: 'home-decor',       patterns: [/\b(home|living|decor|furniture|rug|curtain|lamp|lighting)\b/i] },
  { bucket: 'electronics-mobile', patterns: [/\b(mobile|phone|smartphone|tablet|smartwatch)\b/i, /\b(iphone|android|ipad)\b/i] },
  { bucket: 'electronics-computing', patterns: [/\b(computer|laptop|desktop|monitor|keyboard|mouse|pc|mac|gaming)\b/i, /\belectronic/i] },
  { bucket: 'beauty-skincare',  patterns: [/\b(skin\s*care|skincare|moisturi[sz]er|serum|cleanser|sunscreen)\b/i] },
  { bucket: 'beauty-makeup',    patterns: [/\b(makeup|make\s*up|cosmetic|lipstick|mascara|foundation)\b/i, /\bbeauty\b/i] },
  { bucket: 'sports',           patterns: [/\b(sport|fitness|outdoor|cycling|running|gym|yoga|camping|fishing)\b/i] },
  { bucket: 'toys',             patterns: [/\b(toy|toys|game|puzzle|lego|action\s+figure|doll)\b/i] },
  { bucket: 'books',            patterns: [/\b(book|books|novel|textbook|magazine|comic)\b/i] },
  { bucket: 'pet',              patterns: [/\b(pet|dog|cat|puppy|kitten|aquarium)\b/i] },
  { bucket: 'baby',             patterns: [/\b(baby|infant|nursery|diaper|stroller|pram)\b/i] },
  { bucket: 'automotive',       patterns: [/\b(auto|automotive|car|vehicle|motor|motorcycle|tire|tyre)\b/i] },
  { bucket: 'crafts',           patterns: [/\b(craft|crafts|handmade|scrapbook|sewing|knitting|yarn|bead)\b/i] },
  { bucket: 'office',           patterns: [/\b(office|stationer|pen|pencil|notebook|desk\s+organi[sz]er)\b/i] },
]

// A tiny lookup for eBay's top-level category ids we see most often.
// Anything outside this map falls through to keyword matching on the
// accompanying name/path. Keeping it small on purpose; it's a hint, not a
// canonical taxonomy.
const EBAY_TOP_LEVEL_HINTS: Record<string, CategoryBucket> = {
  '11450': 'apparel-mens',        // Clothing, Shoes & Accessories (too broad — refined by keywords)
  '281':   'jewelry',             // Jewelry & Watches
  '11700': 'home-decor',          // Home & Garden
  '58058': 'electronics-computing', // Cell Phones & Accessories / Computers
  '888':   'sports',              // Sporting Goods
  '220':   'toys',                // Toys & Hobbies
  '267':   'books',               // Books & Magazines
  '1281':  'pet',                 // Pet Supplies
  '2984':  'baby',                // Baby
  '6000':  'automotive',          // eBay Motors
  '14339': 'crafts',              // Crafts
  '26395': 'beauty-skincare',     // Health & Beauty (refined by keywords)
}

export interface CategoryBucketInput {
  externalCategoryId?: string | null
  categoryName?: string | null
  channel?: string | null
}

export function deriveCategoryBucket(input: CategoryBucketInput | null | undefined): CategoryBucket {
  if (!input || typeof input !== 'object') return 'unknown'
  const { externalCategoryId, categoryName, channel } = input

  // Keyword match wins when we have a name — it's nearly always more specific
  // than a top-level id hint.
  const name = typeof categoryName === 'string' ? categoryName : ''
  if (name.trim()) {
    for (const rule of KEYWORD_RULES) {
      if (rule.patterns.some((re) => re.test(name))) return rule.bucket
    }
  }

  // Fall back to eBay id hint when we have nothing else.
  if (channel === 'ebay' && typeof externalCategoryId === 'string') {
    const hint = EBAY_TOP_LEVEL_HINTS[externalCategoryId]
    if (hint) return hint
  }

  return 'unknown'
}

export function gmvBand(grossRevenue: number | null | undefined): 'under_10k' | '10k_100k' | '100k_500k' | '500k_plus' {
  const n = typeof grossRevenue === 'number' && Number.isFinite(grossRevenue) ? grossRevenue : 0
  if (n < 10_000) return 'under_10k'
  if (n < 100_000) return '10k_100k'
  if (n < 500_000) return '100k_500k'
  return '500k_plus'
}

// Privacy floor — never publish a rollup below this many distinct merchants.
export const PRIVACY_FLOOR_K = 10
