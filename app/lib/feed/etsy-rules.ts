/**
 * Etsy (Open API v3) pre-flight validator rule set.
 *
 * Mirrors the structure of the eBay rule set in `validator.ts`.
 * Log prefix: [feed:etsy-rules]
 */
import { registerChannelValidator, type RegisteredRule } from './validator'

const ETSY_WHO_MADE = new Set(['i_did', 'someone_else', 'collective'])
const ETSY_WHEN_MADE_PATTERNS = [
  'made_to_order',
  '2020_2025', '2020_2024',
  '2010_2019',
  '2006_2009',
  'before_2006',
  'vintage',
]

export const ETSY_RULES: RegisteredRule[] = [
  {
    id: 'ETSY_IMAGES_REQUIRED',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy requires at least 1 image (max 10 allowed).',
    remediation: 'Add product images in Shopify.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const imgs: unknown[] = Array.isArray(listing.images) ? listing.images : []
      return { pass: imgs.length >= 1 && imgs.length <= 10, detail: `${imgs.length} image(s)` }
    },
  },
  {
    id: 'ETSY_TITLE_LENGTH',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy titles must be 140 characters or fewer.',
    remediation: 'Shorten the title to ≤140 characters.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const len = String(listing.title ?? '').length
      return { pass: len > 0 && len <= 140, detail: `title is ${len} chars` }
    },
  },
  {
    id: 'ETSY_TAGS_COUNT',
    severity: 'warning',
    channel: 'etsy',
    message: 'Etsy allows up to 13 tags — using all 13 improves discoverability.',
    remediation: 'Add up to 13 relevant tags to the listing.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const tags: unknown[] = Array.isArray(listing.tags) ? listing.tags : []
      return { pass: tags.length === 13, detail: `${tags.length}/13 tags` }
    },
  },
  {
    id: 'ETSY_DESCRIPTION_LENGTH',
    severity: 'warning',
    channel: 'etsy',
    message: 'Etsy descriptions: the first 160 characters are shown in search snippets.',
    remediation: 'Write a compelling first 160 characters that summarise the product.',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const len = String(listing.description ?? '').length
      return { pass: len >= 160, detail: `description is ${len} chars` }
    },
  },
  {
    id: 'ETSY_CATEGORY_MAPPED',
    severity: 'error',
    channel: 'etsy',
    message: 'No Etsy taxonomy_id is mapped for this listing.',
    remediation: 'Pick an Etsy taxonomy (category) in channel settings.',
    autoFixable: true,
    evaluate: ({ listingChannel }) => {
      const t = listingChannel?.metadata?.taxonomy_id
        ?? listingChannel?.external_category_id
        ?? listingChannel?.category_id
      return { pass: !!t }
    },
  },
  {
    id: 'ETSY_MATERIALS',
    severity: 'warning',
    channel: 'etsy',
    message: 'Etsy recommends listing materials for handmade items.',
    remediation: 'Add a materials list to the listing (e.g. cotton, wood, brass).',
    autoFixable: false,
    evaluate: ({ listing }) => {
      const m: unknown[] = Array.isArray(listing.materials) ? listing.materials : []
      return { pass: m.length >= 1, detail: `${m.length} material(s)` }
    },
  },
  {
    id: 'ETSY_PRICE_POSITIVE',
    severity: 'error',
    channel: 'etsy',
    message: 'Price must be greater than 0.',
    remediation: 'Set a positive price on the Shopify variant.',
    autoFixable: false,
    evaluate: ({ listing }) => ({ pass: typeof listing.price === 'number' && listing.price > 0 }),
  },
  {
    id: 'ETSY_SHOP_SECTION',
    severity: 'warning',
    channel: 'etsy',
    message: 'Assign the listing to an Etsy shop section for better in-shop navigation.',
    remediation: 'Pick a shop section in Etsy or set shop_section_id in channel metadata.',
    autoFixable: false,
    evaluate: ({ listingChannel }) => ({
      pass: !!listingChannel?.metadata?.shop_section_id,
    }),
  },
  {
    id: 'ETSY_WHO_MADE',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy requires who_made (i_did / someone_else / collective).',
    remediation: 'Set who_made on the listing.',
    autoFixable: false,
    evaluate: ({ listing, listingChannel }) => {
      const v = listing.who_made ?? listingChannel?.metadata?.who_made
      return { pass: typeof v === 'string' && ETSY_WHO_MADE.has(v) }
    },
  },
  {
    id: 'ETSY_WHEN_MADE',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy requires when_made (e.g. made_to_order, 2020_2025, vintage).',
    remediation: 'Set when_made on the listing.',
    autoFixable: false,
    evaluate: ({ listing, listingChannel }) => {
      const v = String(listing.when_made ?? listingChannel?.metadata?.when_made ?? '')
      return { pass: ETSY_WHEN_MADE_PATTERNS.some(p => v === p) || /^\d{4}_\d{4}$/.test(v) }
    },
  },
  {
    id: 'ETSY_IS_SUPPLY',
    severity: 'error',
    channel: 'etsy',
    message: 'Etsy requires is_supply (boolean): whether the item is a craft supply.',
    remediation: 'Set is_supply (true/false) on the listing.',
    autoFixable: false,
    evaluate: ({ listing, listingChannel }) => {
      const v = listing.is_supply ?? listingChannel?.metadata?.is_supply
      return { pass: typeof v === 'boolean' }
    },
  },
]

registerChannelValidator('etsy', { channel: 'etsy', rules: ETSY_RULES })
