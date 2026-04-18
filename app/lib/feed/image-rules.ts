/**
 * Image compliance rules engine for marketplace channels.
 *
 * Deterministic, pure-function image validation. Each channel defines specific
 * rules for dimensions, format, file size, count, and content requirements.
 * Rules are fast and free — no API calls needed.
 *
 * Log prefix: [feed:image-rules]
 */
import type { ChannelKey } from '@/app/lib/rate-limit/channel'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ImageField = 'main_image' | 'additional_images' | 'swatch' | 'any'

export type ImageRule = {
  id: string
  channel: ChannelKey
  field: ImageField
  severity: 'error' | 'warning' | 'info'
  message: string
  check: (imageData: ImageMetadata, allImages?: ImageMetadata[]) => boolean
  fix?: string
}

export type ImageMetadata = {
  url: string
  width?: number
  height?: number
  format?: string
  fileSizeBytes?: number
  altText?: string
  position: number // 0 = main image
  isAccessible: boolean // URL returns 200
}

export type ImageValidationResult = {
  image: ImageMetadata
  issues: {
    rule: ImageRule
    passed: boolean
  }[]
  score: number
}

export type ImageRequirement = {
  label: string
  detail: string
  severity: 'error' | 'warning' | 'info'
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fieldMatches(ruleField: ImageField, position: number): boolean {
  if (ruleField === 'any') return true
  if (ruleField === 'main_image') return position === 0
  if (ruleField === 'additional_images') return position > 0
  if (ruleField === 'swatch') return false // swatch checked separately
  return true
}

function formatName(f?: string): string {
  return (f || '').toLowerCase().replace(/^\./, '')
}

// ── Amazon Rules ───────────────────────────────────────────────────────────────

const AMAZON_RULES: ImageRule[] = [
  {
    id: 'amazon-min-dim',
    channel: 'amazon',
    field: 'any',
    severity: 'error',
    message: 'Image must be at least 1000x1000px',
    check: (img) => (img.width ?? 0) >= 1000 && (img.height ?? 0) >= 1000,
    fix: 'Resize or replace with a higher-resolution image (minimum 1000x1000px).',
  },
  {
    id: 'amazon-max-dim',
    channel: 'amazon',
    field: 'any',
    severity: 'error',
    message: 'Image must not exceed 10000x10000px',
    check: (img) => (img.width ?? 0) <= 10000 && (img.height ?? 0) <= 10000,
    fix: 'Downscale the image to 10000x10000px or smaller.',
  },
  {
    id: 'amazon-format',
    channel: 'amazon',
    field: 'any',
    severity: 'error',
    message: 'Image must be JPEG, PNG, GIF, or TIFF',
    check: (img) => {
      const f = formatName(img.format)
      return ['jpeg', 'jpg', 'png', 'gif', 'tiff', 'tif',
              'image/jpeg', 'image/png', 'image/gif', 'image/tiff'].includes(f)
    },
    fix: 'Convert the image to JPEG or PNG format.',
  },
  {
    id: 'amazon-max-count',
    channel: 'amazon',
    field: 'any',
    severity: 'error',
    message: 'Amazon allows a maximum of 9 images per listing',
    check: (_img, all) => (all?.length ?? 0) <= 9,
    fix: 'Remove extra images to stay within the 9-image limit.',
  },
  {
    id: 'amazon-swatch-min',
    channel: 'amazon',
    field: 'swatch',
    severity: 'warning',
    message: 'Swatch images should be at least 110x110px',
    check: (img) => (img.width ?? 0) >= 110 && (img.height ?? 0) >= 110,
    fix: 'Resize swatch images to at least 110x110px.',
  },
  {
    id: 'amazon-alt-text',
    channel: 'amazon',
    field: 'any',
    severity: 'warning',
    message: 'Alt text recommended for accessibility',
    check: (img) => !!(img.altText && img.altText.trim().length > 0),
    fix: 'Add descriptive alt text to improve accessibility and SEO.',
  },
  {
    id: 'amazon-product-fill',
    channel: 'amazon',
    field: 'main_image',
    severity: 'warning',
    message: 'Product should fill at least 85% of the main image frame',
    check: () => true, // Deterministic check cannot verify — AI layer handles this
    fix: 'Crop or zoom so the product fills at least 85% of the frame.',
  },
  {
    id: 'amazon-accessible',
    channel: 'amazon',
    field: 'any',
    severity: 'error',
    message: 'Image URL must be accessible (return HTTP 200)',
    check: (img) => img.isAccessible,
    fix: 'Ensure the image URL is publicly accessible and returns a valid response.',
  },
  {
    id: 'amazon-no-watermarks',
    channel: 'amazon',
    field: 'any',
    severity: 'error',
    message: 'No watermarks, logos, or text overlays allowed',
    check: () => true, // AI layer handles visual check
    fix: 'Remove all watermarks, logos, and text overlays from the image.',
  },
  {
    id: 'amazon-no-borders',
    channel: 'amazon',
    field: 'any',
    severity: 'error',
    message: 'No borders or padding allowed',
    check: () => true, // AI layer handles visual check
    fix: 'Remove all borders and excessive padding from the image.',
  },
]

// ── eBay Rules ─────────────────────────────────────────────────────────────────

const EBAY_RULES: ImageRule[] = [
  {
    id: 'ebay-min-dim',
    channel: 'ebay',
    field: 'any',
    severity: 'error',
    message: 'Image must be at least 500x500px',
    check: (img) => (img.width ?? 0) >= 500 && (img.height ?? 0) >= 500,
    fix: 'Resize or replace with a higher-resolution image (minimum 500x500px).',
  },
  {
    id: 'ebay-recommended-dim',
    channel: 'ebay',
    field: 'any',
    severity: 'info',
    message: 'eBay recommends 1600x1600px for zoom functionality',
    check: (img) => (img.width ?? 0) >= 1600 && (img.height ?? 0) >= 1600,
    fix: 'Use images at least 1600x1600px for the best zoom experience.',
  },
  {
    id: 'ebay-format',
    channel: 'ebay',
    field: 'any',
    severity: 'error',
    message: 'Image must be JPEG or PNG',
    check: (img) => {
      const f = formatName(img.format)
      return ['jpeg', 'jpg', 'png', 'image/jpeg', 'image/png'].includes(f)
    },
    fix: 'Convert the image to JPEG or PNG format.',
  },
  {
    id: 'ebay-max-count',
    channel: 'ebay',
    field: 'any',
    severity: 'error',
    message: 'eBay allows a maximum of 24 images per listing',
    check: (_img, all) => (all?.length ?? 0) <= 24,
    fix: 'Remove extra images to stay within the 24-image limit.',
  },
  {
    id: 'ebay-max-filesize',
    channel: 'ebay',
    field: 'any',
    severity: 'error',
    message: 'Image file size must not exceed 12MB',
    check: (img) => !img.fileSizeBytes || img.fileSizeBytes <= 12 * 1024 * 1024,
    fix: 'Compress or resize the image to under 12MB.',
  },
  {
    id: 'ebay-no-watermarks',
    channel: 'ebay',
    field: 'any',
    severity: 'error',
    message: 'No watermarks allowed',
    check: () => true, // AI layer
    fix: 'Remove all watermarks from the image.',
  },
  {
    id: 'ebay-no-borders-text',
    channel: 'ebay',
    field: 'any',
    severity: 'warning',
    message: 'No borders, text, or artwork overlays',
    check: () => true, // AI layer
    fix: 'Remove borders, text, and artwork overlays from the image.',
  },
  {
    id: 'ebay-accessible',
    channel: 'ebay',
    field: 'any',
    severity: 'error',
    message: 'Image URL must be accessible',
    check: (img) => img.isAccessible,
    fix: 'Ensure the image URL is publicly accessible.',
  },
]

// ── Etsy Rules ─────────────────────────────────────────────────────────────────

const ETSY_RULES: ImageRule[] = [
  {
    id: 'etsy-min-longest-side',
    channel: 'etsy',
    field: 'any',
    severity: 'error',
    message: 'Longest side must be at least 2000px for zoom',
    check: (img) => Math.max(img.width ?? 0, img.height ?? 0) >= 2000,
    fix: 'Use images with the longest side at least 2000px.',
  },
  {
    id: 'etsy-max-count',
    channel: 'etsy',
    field: 'any',
    severity: 'error',
    message: 'Etsy allows a maximum of 10 images per listing',
    check: (_img, all) => (all?.length ?? 0) <= 10,
    fix: 'Remove extra images to stay within the 10-image limit.',
  },
  {
    id: 'etsy-format',
    channel: 'etsy',
    field: 'any',
    severity: 'error',
    message: 'Image must be JPEG or PNG',
    check: (img) => {
      const f = formatName(img.format)
      return ['jpeg', 'jpg', 'png', 'image/jpeg', 'image/png'].includes(f)
    },
    fix: 'Convert the image to JPEG or PNG format.',
  },
  {
    id: 'etsy-max-filesize',
    channel: 'etsy',
    field: 'any',
    severity: 'error',
    message: 'Image file size must not exceed 20MB',
    check: (img) => !img.fileSizeBytes || img.fileSizeBytes <= 20 * 1024 * 1024,
    fix: 'Compress or resize the image to under 20MB.',
  },
  {
    id: 'etsy-aspect-ratio',
    channel: 'etsy',
    field: 'any',
    severity: 'info',
    message: 'Recommended aspect ratio: 4:3 or 1:1',
    check: (img) => {
      if (!img.width || !img.height) return true
      const ratio = img.width / img.height
      // 4:3 = 1.333, 1:1 = 1.0, allow some tolerance
      return (Math.abs(ratio - 1.333) < 0.1) || (Math.abs(ratio - 1.0) < 0.1)
    },
    fix: 'Crop images to 4:3 or 1:1 aspect ratio for best results.',
  },
  {
    id: 'etsy-thumbnail-quality',
    channel: 'etsy',
    field: 'main_image',
    severity: 'warning',
    message: 'First image is the thumbnail — should be clean and clear',
    check: () => true, // AI layer
    fix: 'Ensure your first image is clean, well-lit, and clearly shows the product.',
  },
  {
    id: 'etsy-lifestyle-preferred',
    channel: 'etsy',
    field: 'additional_images',
    severity: 'info',
    message: 'Lifestyle/styled shots perform better on Etsy',
    check: () => true, // AI layer
    fix: 'Add lifestyle or styled product shots to improve engagement.',
  },
  {
    id: 'etsy-accessible',
    channel: 'etsy',
    field: 'any',
    severity: 'error',
    message: 'Image URL must be accessible',
    check: (img) => img.isAccessible,
    fix: 'Ensure the image URL is publicly accessible.',
  },
]

// ── Shopify Rules ──────────────────────────────────────────────────────────────

const SHOPIFY_RULES: ImageRule[] = [
  {
    id: 'shopify-max-dim',
    channel: 'shopify',
    field: 'any',
    severity: 'error',
    message: 'Image must not exceed 4472x4472px',
    check: (img) => (img.width ?? 0) <= 4472 && (img.height ?? 0) <= 4472,
    fix: 'Downscale the image to 4472x4472px or smaller.',
  },
  {
    id: 'shopify-max-filesize',
    channel: 'shopify',
    field: 'any',
    severity: 'error',
    message: 'Image file size must not exceed 20MB',
    check: (img) => !img.fileSizeBytes || img.fileSizeBytes <= 20 * 1024 * 1024,
    fix: 'Compress or resize the image to under 20MB.',
  },
  {
    id: 'shopify-format',
    channel: 'shopify',
    field: 'any',
    severity: 'error',
    message: 'Image must be JPEG, PNG, GIF, WebP, or HEIC',
    check: (img) => {
      const f = formatName(img.format)
      return ['jpeg', 'jpg', 'png', 'gif', 'webp', 'heic',
              'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'].includes(f)
    },
    fix: 'Convert the image to JPEG, PNG, GIF, WebP, or HEIC format.',
  },
  {
    id: 'shopify-max-count',
    channel: 'shopify',
    field: 'any',
    severity: 'error',
    message: 'Shopify allows up to 250 images per product',
    check: (_img, all) => (all?.length ?? 0) <= 250,
    fix: 'Remove extra images to stay within the 250-image limit.',
  },
  {
    id: 'shopify-alt-text',
    channel: 'shopify',
    field: 'any',
    severity: 'warning',
    message: 'Alt text strongly recommended for SEO',
    check: (img) => !!(img.altText && img.altText.trim().length > 0),
    fix: 'Add descriptive alt text to improve SEO and accessibility.',
  },
  {
    id: 'shopify-variant-images',
    channel: 'shopify',
    field: 'any',
    severity: 'info',
    message: 'Variants should have unique images',
    check: () => true, // Context-dependent, info only
    fix: 'Assign unique images to each product variant for clarity.',
  },
  {
    id: 'shopify-accessible',
    channel: 'shopify',
    field: 'any',
    severity: 'error',
    message: 'Image URL must be accessible',
    check: (img) => img.isAccessible,
    fix: 'Ensure the image URL is publicly accessible.',
  },
]

// ── TikTok Shop Rules ──────────────────────────────────────────────────────────

const TIKTOK_RULES: ImageRule[] = [
  {
    id: 'tiktok-min-dim',
    channel: 'tiktok',
    field: 'any',
    severity: 'error',
    message: 'Image must be at least 600x600px',
    check: (img) => (img.width ?? 0) >= 600 && (img.height ?? 0) >= 600,
    fix: 'Resize or replace with a higher-resolution image (minimum 600x600px).',
  },
  {
    id: 'tiktok-max-count',
    channel: 'tiktok',
    field: 'any',
    severity: 'error',
    message: 'TikTok Shop allows a maximum of 5 images',
    check: (_img, all) => (all?.length ?? 0) <= 5,
    fix: 'Remove extra images to stay within the 5-image limit.',
  },
  {
    id: 'tiktok-format',
    channel: 'tiktok',
    field: 'any',
    severity: 'error',
    message: 'Image must be JPEG or PNG',
    check: (img) => {
      const f = formatName(img.format)
      return ['jpeg', 'jpg', 'png', 'image/jpeg', 'image/png'].includes(f)
    },
    fix: 'Convert the image to JPEG or PNG format.',
  },
  {
    id: 'tiktok-white-bg',
    channel: 'tiktok',
    field: 'any',
    severity: 'warning',
    message: 'White or light background preferred',
    check: () => true, // AI layer
    fix: 'Use a white or light-colored background for product images.',
  },
  {
    id: 'tiktok-no-collage',
    channel: 'tiktok',
    field: 'any',
    severity: 'error',
    message: 'No collages or composite images allowed',
    check: () => true, // AI layer
    fix: 'Use a single product photo — no collages or composite images.',
  },
  {
    id: 'tiktok-product-visible',
    channel: 'tiktok',
    field: 'any',
    severity: 'error',
    message: 'Product must be clearly visible',
    check: () => true, // AI layer
    fix: 'Ensure the product is clearly visible and the focus of the image.',
  },
  {
    id: 'tiktok-accessible',
    channel: 'tiktok',
    field: 'any',
    severity: 'error',
    message: 'Image URL must be accessible',
    check: (img) => img.isAccessible,
    fix: 'Ensure the image URL is publicly accessible.',
  },
]

// ── Google Shopping Rules ──────────────────────────────────────────────────────

const GOOGLE_RULES: ImageRule[] = [
  {
    id: 'google-min-dim',
    channel: 'google',
    field: 'any',
    severity: 'error',
    message: 'Image must be at least 100x100px (250x250px for apparel)',
    check: (img) => (img.width ?? 0) >= 100 && (img.height ?? 0) >= 100,
    fix: 'Use images at least 100x100px (250x250px for apparel products).',
  },
  {
    id: 'google-apparel-min-dim',
    channel: 'google',
    field: 'any',
    severity: 'warning',
    message: 'Apparel images should be at least 250x250px',
    check: (img) => (img.width ?? 0) >= 250 && (img.height ?? 0) >= 250,
    fix: 'Use images at least 250x250px for apparel products.',
  },
  {
    id: 'google-max-filesize',
    channel: 'google',
    field: 'any',
    severity: 'error',
    message: 'Image file size must not exceed 16MB',
    check: (img) => !img.fileSizeBytes || img.fileSizeBytes <= 16 * 1024 * 1024,
    fix: 'Compress or resize the image to under 16MB.',
  },
  {
    id: 'google-format',
    channel: 'google',
    field: 'any',
    severity: 'error',
    message: 'Image must be JPEG, PNG, GIF, BMP, TIFF, or WebP',
    check: (img) => {
      const f = formatName(img.format)
      return ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp',
              'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp'].includes(f)
    },
    fix: 'Convert the image to an accepted format (JPEG, PNG, GIF, BMP, TIFF, or WebP).',
  },
  {
    id: 'google-no-promo-text',
    channel: 'google',
    field: 'any',
    severity: 'error',
    message: 'No promotional text, watermarks, or borders',
    check: () => true, // AI layer
    fix: 'Remove all promotional text, watermarks, and borders.',
  },
  {
    id: 'google-white-bg',
    channel: 'google',
    field: 'main_image',
    severity: 'warning',
    message: 'Non-apparel: product-only on white or light background',
    check: () => true, // AI layer
    fix: 'Use a white or light background for the main product image.',
  },
  {
    id: 'google-accessible',
    channel: 'google',
    field: 'any',
    severity: 'error',
    message: 'Image URL must be accessible',
    check: (img) => img.isAccessible,
    fix: 'Ensure the image URL is publicly accessible.',
  },
]

// ── Rule Registry ──────────────────────────────────────────────────────────────

const ALL_RULES: Record<string, ImageRule[]> = {
  amazon: AMAZON_RULES,
  ebay: EBAY_RULES,
  etsy: ETSY_RULES,
  shopify: SHOPIFY_RULES,
  tiktok: TIKTOK_RULES,
  google: GOOGLE_RULES,
}

function getRulesForChannel(channel: ChannelKey): ImageRule[] {
  return ALL_RULES[channel] ?? []
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Validate a set of images against a channel's rules.
 * Returns per-image validation results with issues and scores.
 */
export function validateImages(
  images: ImageMetadata[],
  channel: ChannelKey,
): ImageValidationResult[] {
  const rules = getRulesForChannel(channel)
  if (rules.length === 0) {
    return images.map(img => ({ image: img, issues: [], score: 100 }))
  }

  return images.map(img => {
    const applicableRules = rules.filter(r => fieldMatches(r.field, img.position))
    const issues = applicableRules.map(rule => ({
      rule,
      passed: rule.check(img, images),
    }))

    // Score: deduct based on severity. Errors = -15, warnings = -5, info = -2
    const errorCount = issues.filter(i => !i.passed && i.rule.severity === 'error').length
    const warnCount = issues.filter(i => !i.passed && i.rule.severity === 'warning').length
    const infoCount = issues.filter(i => !i.passed && i.rule.severity === 'info').length
    const deduction = (errorCount * 15) + (warnCount * 5) + (infoCount * 2)
    const score = Math.max(0, Math.min(100, 100 - deduction))

    return { image: img, issues, score }
  })
}

/**
 * Returns human-readable image requirements for a given channel.
 */
export function getChannelImageRequirements(channel: ChannelKey): ImageRequirement[] {
  const reqs: Record<string, ImageRequirement[]> = {
    amazon: [
      { label: 'Minimum dimensions', detail: '1000x1000px (max 10000x10000px)', severity: 'error' },
      { label: 'Formats', detail: 'JPEG, PNG, GIF, or TIFF', severity: 'error' },
      { label: 'Max images', detail: '9 per listing', severity: 'error' },
      { label: 'Main image', detail: 'Pure white background, product-only, fill 85%+ of frame', severity: 'error' },
      { label: 'No overlays', detail: 'No watermarks, logos, text, borders, or padding', severity: 'error' },
      { label: 'Swatch images', detail: 'Minimum 110x110px', severity: 'warning' },
      { label: 'Alt text', detail: 'Required for accessibility', severity: 'warning' },
    ],
    ebay: [
      { label: 'Minimum dimensions', detail: '500x500px (1600x1600 recommended for zoom)', severity: 'error' },
      { label: 'Formats', detail: 'JPEG or PNG', severity: 'error' },
      { label: 'Max images', detail: '24 per listing', severity: 'error' },
      { label: 'Max file size', detail: '12MB', severity: 'error' },
      { label: 'No overlays', detail: 'No borders, text, artwork, or watermarks', severity: 'warning' },
      { label: 'Photo quality', detail: 'Original photos preferred over stock', severity: 'info' },
    ],
    etsy: [
      { label: 'Minimum dimensions', detail: '2000px on longest side for zoom', severity: 'error' },
      { label: 'Formats', detail: 'JPEG or PNG', severity: 'error' },
      { label: 'Max images', detail: '10 per listing', severity: 'error' },
      { label: 'Max file size', detail: '20MB', severity: 'error' },
      { label: 'Thumbnail', detail: 'First image is thumbnail — clean and clear', severity: 'warning' },
      { label: 'Style', detail: 'Lifestyle/styled shots perform better on Etsy', severity: 'info' },
      { label: 'Aspect ratio', detail: 'Recommend 4:3 or 1:1', severity: 'info' },
    ],
    shopify: [
      { label: 'Maximum dimensions', detail: '4472x4472px', severity: 'error' },
      { label: 'Max file size', detail: '20MB', severity: 'error' },
      { label: 'Formats', detail: 'JPEG, PNG, GIF, WebP, HEIC', severity: 'error' },
      { label: 'Max images', detail: '250 per product', severity: 'error' },
      { label: 'Alt text', detail: 'Strongly recommended for SEO', severity: 'warning' },
      { label: 'Variants', detail: 'Should have unique images per variant', severity: 'info' },
    ],
    tiktok: [
      { label: 'Minimum dimensions', detail: '600x600px', severity: 'error' },
      { label: 'Formats', detail: 'JPEG or PNG', severity: 'error' },
      { label: 'Max images', detail: '5 per listing', severity: 'error' },
      { label: 'Background', detail: 'White or light background preferred', severity: 'warning' },
      { label: 'Content', detail: 'Product clearly visible, no collages or composites', severity: 'error' },
    ],
    google: [
      { label: 'Minimum dimensions', detail: '100x100px (250x250px for apparel)', severity: 'error' },
      { label: 'Formats', detail: 'JPEG, PNG, GIF, BMP, TIFF, or WebP', severity: 'error' },
      { label: 'Max file size', detail: '16MB', severity: 'error' },
      { label: 'No overlays', detail: 'No promotional text, watermarks, or borders', severity: 'error' },
      { label: 'Background', detail: 'Non-apparel: product-only on white/light background', severity: 'warning' },
    ],
  }

  return reqs[channel] ?? []
}

/**
 * Compute an aggregate image compliance score (0-100) for a set of images
 * against a channel's requirements.
 */
export function computeImageScore(
  images: ImageMetadata[],
  channel: ChannelKey,
): number {
  if (images.length === 0) return 0

  const results = validateImages(images, channel)
  const totalScore = results.reduce((sum, r) => sum + r.score, 0)
  return Math.round(totalScore / results.length)
}
