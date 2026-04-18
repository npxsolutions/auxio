/**
 * Feed Transformation Rules Engine
 *
 * The core of Palvento's multichannel feed management. Takes a raw listing from
 * a source (e.g. Shopify) and transforms it to meet channel-specific requirements.
 *
 * Architecture:
 *   1. Rules are sorted by priority (lower = first) within phase groups (pre → business → post).
 *   2. Conditions are evaluated against the listing's current state (after prior rules).
 *   3. Actions mutate the listing in-place when conditions match.
 *   4. The engine is pure — same inputs always yield same outputs.
 *
 * Log prefix: [feed:rules-engine]
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type ConditionOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'gt' | 'lt' | 'gte' | 'lte'
  | 'in' | 'not_in'
  | 'exists' | 'not_exists'
  | 'matches'
  | 'starts_with' | 'ends_with'
  | 'is_empty' | 'is_not_empty'
  | 'greater_than' | 'less_than'
  | 'matches_regex'

export interface RuleCondition {
  field: string
  operator: ConditionOperator
  value: string | number | string[]
}

export type ActionType =
  | 'set' | 'prepend' | 'append'
  | 'replace' | 'map' | 'calculate' | 'template' | 'copy' | 'remove'
  | 'uppercase' | 'lowercase' | 'truncate'
  | 'strip_html' | 'trim'
  | 'extract_keywords' | 'split_bullets'
  | 'set_field' | 'map_value'

export interface RuleAction {
  type: ActionType
  field: string
  value?: string | number
  template?: string
  sourceField?: string
  find?: string
  replaceWith?: string
  from?: string
  to?: string
  operator?: string
  maxLength?: number
  expression?: string
  mapping?: Record<string, string>
}

export type RulePhase = 'pre' | 'business' | 'post'

export interface FeedRule {
  id: string
  name: string
  description?: string
  priority: number
  enabled: boolean
  conditions: RuleCondition[]
  conditionLogic: 'AND' | 'OR'
  actions: RuleAction[]
  channel?: string | null
  rulePhase?: RulePhase
  isDefault?: boolean
  createdAt: string
  updatedAt: string
}

export type Listing = Record<string, any>
export type TransformedListing = Record<string, any>

// ── Condition evaluation ────────────────────────────────────────────────────

function getNestedValue(obj: Record<string, any>, path: string): any {
  // Handle array notation e.g. "images[0]"
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  let current: any = obj
  for (const part of parts) {
    if (current == null) return undefined
    current = current[part]
  }
  return current
}

function evaluateSingleCondition(listing: Listing, cond: RuleCondition): boolean {
  const fieldVal = getNestedValue(listing, cond.field)
  const condVal = cond.value

  switch (cond.operator) {
    case 'equals':
      return String(fieldVal ?? '').toLowerCase() === String(condVal).toLowerCase()

    case 'not_equals':
      return String(fieldVal ?? '').toLowerCase() !== String(condVal).toLowerCase()

    case 'contains':
      return String(fieldVal ?? '').toLowerCase().includes(String(condVal).toLowerCase())

    case 'not_contains':
      return !String(fieldVal ?? '').toLowerCase().includes(String(condVal).toLowerCase())

    case 'starts_with':
      return String(fieldVal ?? '').toLowerCase().startsWith(String(condVal).toLowerCase())

    case 'ends_with':
      return String(fieldVal ?? '').toLowerCase().endsWith(String(condVal).toLowerCase())

    case 'gt':
    case 'greater_than':
      return parseFloat(String(fieldVal ?? '0')) > parseFloat(String(condVal))

    case 'lt':
    case 'less_than':
      return parseFloat(String(fieldVal ?? '0')) < parseFloat(String(condVal))

    case 'gte':
      return parseFloat(String(fieldVal ?? '0')) >= parseFloat(String(condVal))

    case 'lte':
      return parseFloat(String(fieldVal ?? '0')) <= parseFloat(String(condVal))

    case 'in':
      if (Array.isArray(condVal)) {
        return condVal.map(v => String(v).toLowerCase()).includes(String(fieldVal ?? '').toLowerCase())
      }
      return String(condVal).toLowerCase().split(',').map(s => s.trim()).includes(String(fieldVal ?? '').toLowerCase())

    case 'not_in':
      if (Array.isArray(condVal)) {
        return !condVal.map(v => String(v).toLowerCase()).includes(String(fieldVal ?? '').toLowerCase())
      }
      return !String(condVal).toLowerCase().split(',').map(s => s.trim()).includes(String(fieldVal ?? '').toLowerCase())

    case 'exists':
    case 'is_not_empty':
      return fieldVal != null && String(fieldVal).trim() !== ''

    case 'not_exists':
    case 'is_empty':
      return fieldVal == null || String(fieldVal).trim() === ''

    case 'matches':
    case 'matches_regex':
      try {
        return new RegExp(String(condVal), 'i').test(String(fieldVal ?? ''))
      } catch {
        return false
      }

    default:
      return true
  }
}

export function evaluateConditions(
  listing: Listing,
  conditions: RuleCondition[],
  logic: 'AND' | 'OR'
): boolean {
  if (conditions.length === 0) return true

  const results = conditions.map(c => evaluateSingleCondition(listing, c))

  return logic === 'AND'
    ? results.every(Boolean)
    : results.some(Boolean)
}

// ── Template resolution ─────────────────────────────────────────────────────

export function resolveTemplate(template: string, listing: Listing): string {
  return template.replace(/\{([^}]+)\}/g, (_, path: string) => {
    const val = getNestedValue(listing, path.trim())
    if (val == null || val === '') return ''
    return String(val)
  })
}

// ── Action execution ────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractKeywords(text: string, maxCount: number = 20, maxLen: number = 20): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'shall', 'this', 'that',
    'these', 'those', 'it', 'its', 'not', 'no', 'nor', 'so', 'if', 'then',
    'than', 'too', 'very', 'just', 'about', 'also', 'each', 'which', 'who',
  ])

  const clean = stripHtml(text).toLowerCase()
  const words = clean.split(/[\s,;.!?|/\\()\[\]{}"']+/).filter(Boolean)
  const seen = new Set<string>()
  const keywords: string[] = []

  for (const word of words) {
    if (word.length < 2 || word.length > maxLen || stopWords.has(word) || seen.has(word)) continue
    seen.add(word)
    keywords.push(word)
    if (keywords.length >= maxCount) break
  }
  return keywords
}

function splitIntoBullets(text: string, maxBullets: number = 5): string[] {
  const clean = stripHtml(text)
  // Split on sentence boundaries or line breaks
  const sentences = clean
    .split(/[.\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .slice(0, maxBullets)
  return sentences
}

export function executeAction(listing: TransformedListing, action: RuleAction): void {
  const current = String(listing[action.field] ?? '')

  switch (action.type) {
    case 'set':
    case 'set_field': {
      const val = action.template
        ? resolveTemplate(action.template, listing)
        : action.value != null
          ? resolveTemplate(String(action.value), listing)
          : ''
      listing[action.field] = val
      break
    }

    case 'template': {
      const tmpl = action.template ?? String(action.value ?? '')
      listing[action.field] = resolveTemplate(tmpl, listing)
      break
    }

    case 'prepend': {
      const prefix = resolveTemplate(String(action.value ?? ''), listing)
      listing[action.field] = prefix + current
      break
    }

    case 'append': {
      const suffix = resolveTemplate(String(action.value ?? ''), listing)
      listing[action.field] = current + suffix
      break
    }

    case 'replace': {
      const find = action.find ?? action.from ?? ''
      const replaceWith = action.replaceWith ?? action.to ?? ''
      if (find) {
        listing[action.field] = current.split(find).join(replaceWith)
      }
      break
    }

    case 'map':
    case 'map_value': {
      if (action.mapping) {
        const key = Object.keys(action.mapping).find(
          k => k.toLowerCase() === current.toLowerCase()
        )
        if (key) {
          listing[action.field] = action.mapping[key]
        }
      } else if (action.from != null && action.to != null) {
        if (current.toLowerCase() === String(action.from).toLowerCase()) {
          listing[action.field] = action.to
        }
      }
      break
    }

    case 'calculate': {
      const num = parseFloat(current)
      if (isNaN(num)) break

      if (action.expression) {
        // Parse simple expressions like "shopify_price * 1.15"
        const expr = action.expression.trim()
        const match = expr.match(/^(\w+)\s*([+\-*/])\s*(.+)$/)
        if (match) {
          const sourceVal = parseFloat(String(listing[match[1]] ?? current))
          const op = match[2]
          const operand = parseFloat(match[3])
          if (!isNaN(sourceVal) && !isNaN(operand)) {
            let result: number
            switch (op) {
              case '+': result = sourceVal + operand; break
              case '-': result = sourceVal - operand; break
              case '*': result = sourceVal * operand; break
              case '/': result = operand !== 0 ? sourceVal / operand : sourceVal; break
              default:  result = sourceVal
            }
            listing[action.field] = String(Math.round(result * 100) / 100)
          }
        }
      } else if (action.operator && action.value != null) {
        const val = parseFloat(String(action.value))
        if (!isNaN(val)) {
          let result: number
          switch (action.operator) {
            case '+':  result = num + val; break
            case '-':  result = num - val; break
            case '*':  result = num * val; break
            case '/':  result = val !== 0 ? num / val : num; break
            case '-%': result = num * (1 - val / 100); break
            case '+%': result = num * (1 + val / 100); break
            default:   result = num
          }
          listing[action.field] = String(Math.round(result * 100) / 100)
        }
      }
      break
    }

    case 'copy': {
      const source = action.sourceField ?? String(action.value ?? '')
      if (source) {
        listing[action.field] = getNestedValue(listing, source) ?? ''
      }
      break
    }

    case 'remove': {
      delete listing[action.field]
      break
    }

    case 'uppercase': {
      listing[action.field] = current.toUpperCase()
      break
    }

    case 'lowercase': {
      listing[action.field] = current.toLowerCase()
      break
    }

    case 'truncate': {
      const max = action.maxLength ?? (typeof action.value === 'number' ? action.value : parseInt(String(action.value ?? '0')))
      if (max > 0 && current.length > max) {
        listing[action.field] = current.slice(0, max)
      }
      break
    }

    case 'strip_html': {
      listing[action.field] = stripHtml(current)
      break
    }

    case 'trim': {
      listing[action.field] = current.trim()
      break
    }

    case 'extract_keywords': {
      const maxCount = typeof action.value === 'number' ? action.value : 20
      const source = action.sourceField ? String(listing[action.sourceField] ?? '') : current
      const keywords = extractKeywords(source, maxCount)
      listing[action.field] = keywords.join(', ')
      break
    }

    case 'split_bullets': {
      const maxBullets = typeof action.value === 'number' ? action.value : 5
      const source = action.sourceField ? String(listing[action.sourceField] ?? '') : current
      const bullets = splitIntoBullets(source, maxBullets)
      bullets.forEach((b, i) => {
        listing[`bullet_${i + 1}`] = b
      })
      break
    }
  }
}

// ── Main engine ─────────────────────────────────────────────────────────────

/**
 * Apply a sorted list of rules to a listing, producing a transformed copy.
 * Rules run in phase order (pre → business → post), then by priority within phase.
 */
export function applyRules(
  listing: Listing,
  channel: string,
  rules: FeedRule[]
): TransformedListing {
  // Deep-clone so we never mutate the source
  const out: TransformedListing = JSON.parse(JSON.stringify(listing))

  // Tag the channel for condition matching
  out.__channel = channel

  // Filter to enabled rules that apply to this channel (or all channels)
  const applicable = rules.filter(r =>
    r.enabled &&
    (!r.channel || r.channel === 'all' || r.channel === channel)
  )

  // Group and sort by phase, then priority
  const phaseOrder: RulePhase[] = ['pre', 'business', 'post']
  const grouped: Record<RulePhase, FeedRule[]> = { pre: [], business: [], post: [] }

  for (const rule of applicable) {
    const phase = rule.rulePhase ?? 'business'
    grouped[phase].push(rule)
  }

  for (const phase of phaseOrder) {
    const phaseRules = grouped[phase].sort((a, b) => a.priority - b.priority)

    for (const rule of phaseRules) {
      // Map condition formats — DB stores { field, op, value } but engine expects { field, operator, value }
      const conditions: RuleCondition[] = rule.conditions.map((c: any) => ({
        field: c.field,
        operator: c.operator ?? c.op ?? 'equals',
        value: c.value,
      }))

      const matches = evaluateConditions(out, conditions, rule.conditionLogic)
      if (!matches) continue

      for (const action of rule.actions) {
        executeAction(out, action)
      }
    }
  }

  // Clean up internal tag
  delete out.__channel

  return out
}

// ── Default rule sets ───────────────────────────────────────────────────────

const now = new Date().toISOString()

export const AMAZON_DEFAULT_RULES: FeedRule[] = [
  {
    id: 'default-amazon-title',
    name: 'Amazon: Format title',
    description: 'Format title as Brand + Title + Size + Color (max 200 chars)',
    priority: 10,
    enabled: true,
    conditions: [],
    conditionLogic: 'AND',
    actions: [
      { type: 'template', field: 'title', template: '{brand} {title}, {size}, {color}' },
      { type: 'truncate', field: 'title', maxLength: 200 },
    ],
    channel: 'amazon',
    rulePhase: 'business',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'default-amazon-description',
    name: 'Amazon: Clean description',
    description: 'Strip HTML and truncate to 2000 characters',
    priority: 20,
    enabled: true,
    conditions: [],
    conditionLogic: 'AND',
    actions: [
      { type: 'strip_html', field: 'description' },
      { type: 'truncate', field: 'description', maxLength: 2000 },
    ],
    channel: 'amazon',
    rulePhase: 'pre',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'default-amazon-bullets',
    name: 'Amazon: Generate bullet points',
    description: 'Extract up to 5 bullet points from description',
    priority: 30,
    enabled: true,
    conditions: [
      { field: 'bullet_1', operator: 'is_empty', value: '' },
    ],
    conditionLogic: 'AND',
    actions: [
      { type: 'split_bullets', field: 'description', sourceField: 'description', value: 5 },
    ],
    channel: 'amazon',
    rulePhase: 'business',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'default-amazon-search-terms',
    name: 'Amazon: Generate search terms',
    description: 'Extract keywords from title and description for backend search terms',
    priority: 40,
    enabled: true,
    conditions: [
      { field: 'search_terms', operator: 'is_empty', value: '' },
    ],
    conditionLogic: 'AND',
    actions: [
      { type: 'extract_keywords', field: 'search_terms', sourceField: 'title', value: 20 },
    ],
    channel: 'amazon',
    rulePhase: 'post',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'default-amazon-price',
    name: 'Amazon: Copy price from source',
    description: 'Use source price as-is (no markup by default)',
    priority: 50,
    enabled: true,
    conditions: [
      { field: 'amazon_price', operator: 'is_empty', value: '' },
    ],
    conditionLogic: 'AND',
    actions: [
      { type: 'copy', field: 'amazon_price', sourceField: 'price' },
    ],
    channel: 'amazon',
    rulePhase: 'business',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'default-amazon-category',
    name: 'Amazon: Map common categories',
    description: 'Map Shopify product types to Amazon browse nodes',
    priority: 15,
    enabled: true,
    conditions: [],
    conditionLogic: 'AND',
    actions: [
      {
        type: 'map',
        field: 'amazon_browse_node',
        sourceField: 'product_type',
        mapping: {
          'Shirts': '2476517011',
          'T-Shirts': '2476517011',
          'Pants': '2476520011',
          'Jeans': '2476521011',
          'Dresses': '2476504011',
          'Shoes': '679255011',
          'Sneakers': '679255011',
          'Jackets': '2476498011',
          'Coats': '2476498011',
          'Accessories': '2474936011',
          'Jewelry': '3880591',
          'Watches': '6358539011',
          'Electronics': '172282',
          'Phones': '2811119011',
          'Tablets': '1232597011',
          'Laptops': '13896615011',
          'Home': '1055398',
          'Kitchen': '284507',
          'Garden': '2972638011',
          'Toys': '165793011',
          'Books': '283155',
          'Beauty': '3760911',
          'Health': '3760901',
          'Sports': '3375251',
          'Pet Supplies': '2619533011',
        },
      },
    ],
    channel: 'amazon',
    rulePhase: 'business',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
]

export const EBAY_DEFAULT_RULES: FeedRule[] = [
  {
    id: 'default-ebay-title',
    name: 'eBay: Format title',
    description: 'Format title as Title + Brand + Color + Size (max 80 chars)',
    priority: 10,
    enabled: true,
    conditions: [],
    conditionLogic: 'AND',
    actions: [
      { type: 'template', field: 'title', template: '{title} {brand} {color} {size}' },
      { type: 'truncate', field: 'title', maxLength: 80 },
    ],
    channel: 'ebay',
    rulePhase: 'business',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'default-ebay-description',
    name: 'eBay: HTML description wrapper',
    description: 'Wrap description in clean eBay-compatible HTML',
    priority: 20,
    enabled: true,
    conditions: [],
    conditionLogic: 'AND',
    actions: [
      {
        type: 'template',
        field: 'description',
        template: '<div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;"><h2>{title}</h2><p>{description}</p><ul><li>Brand: {brand}</li><li>Color: {color}</li><li>Size: {size}</li><li>Material: {material}</li></ul></div>',
      },
    ],
    channel: 'ebay',
    rulePhase: 'business',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'default-ebay-condition',
    name: 'eBay: Default condition to New',
    description: 'Set condition to New if not specified',
    priority: 30,
    enabled: true,
    conditions: [
      { field: 'condition', operator: 'is_empty', value: '' },
    ],
    conditionLogic: 'AND',
    actions: [
      { type: 'set', field: 'condition', value: 'New' },
    ],
    channel: 'ebay',
    rulePhase: 'business',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'default-ebay-category',
    name: 'eBay: Map common categories',
    description: 'Map Shopify product types to eBay category IDs',
    priority: 15,
    enabled: true,
    conditions: [],
    conditionLogic: 'AND',
    actions: [
      {
        type: 'map',
        field: 'ebay_category_id',
        sourceField: 'product_type',
        mapping: {
          'Shirts': '185101',
          'T-Shirts': '15687',
          'Pants': '185100',
          'Jeans': '11483',
          'Dresses': '63861',
          'Shoes': '93427',
          'Sneakers': '15709',
          'Jackets': '57988',
          'Coats': '57988',
          'Accessories': '4250',
          'Jewelry': '10968',
          'Watches': '31387',
          'Electronics': '293',
          'Phones': '9355',
          'Tablets': '171485',
          'Laptops': '177',
          'Home': '11700',
          'Kitchen': '20710',
          'Toys': '220',
          'Books': '267',
          'Beauty': '26395',
          'Health': '67726',
          'Sports': '888',
          'Pet Supplies': '1281',
        },
      },
    ],
    channel: 'ebay',
    rulePhase: 'business',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'default-ebay-item-specifics',
    name: 'eBay: Set item specifics from attributes',
    description: 'Copy brand, color, size, material to item specifics fields',
    priority: 40,
    enabled: true,
    conditions: [],
    conditionLogic: 'AND',
    actions: [
      { type: 'copy', field: 'item_specific_brand', sourceField: 'brand' },
      { type: 'copy', field: 'item_specific_color', sourceField: 'color' },
      { type: 'copy', field: 'item_specific_size', sourceField: 'size' },
      { type: 'copy', field: 'item_specific_material', sourceField: 'material' },
    ],
    channel: 'ebay',
    rulePhase: 'post',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
]

export const ETSY_DEFAULT_RULES: FeedRule[] = [
  {
    id: 'default-etsy-title',
    name: 'Etsy: Format title',
    description: 'Format title as Title | Material | Occasion (max 140 chars)',
    priority: 10,
    enabled: true,
    conditions: [],
    conditionLogic: 'AND',
    actions: [
      { type: 'template', field: 'title', template: '{title} | {material} | {occasion}' },
      { type: 'truncate', field: 'title', maxLength: 140 },
    ],
    channel: 'etsy',
    rulePhase: 'business',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'default-etsy-tags',
    name: 'Etsy: Generate tags',
    description: 'Extract up to 13 tags from title + description (max 20 chars each)',
    priority: 20,
    enabled: true,
    conditions: [
      { field: 'tags', operator: 'is_empty', value: '' },
    ],
    conditionLogic: 'AND',
    actions: [
      { type: 'extract_keywords', field: 'tags', sourceField: 'title', value: 13 },
    ],
    channel: 'etsy',
    rulePhase: 'business',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'default-etsy-description',
    name: 'Etsy: Storytelling description',
    description: 'Format description in Etsy storytelling style',
    priority: 30,
    enabled: true,
    conditions: [],
    conditionLogic: 'AND',
    actions: [
      {
        type: 'template',
        field: 'description',
        template: '{title}\n\n{description}\n\nDetails:\n- Material: {material}\n- Color: {color}\n- Size: {size}\n\nThank you for shopping with us!',
      },
    ],
    channel: 'etsy',
    rulePhase: 'business',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'default-etsy-who-made',
    name: 'Etsy: Set who_made default',
    description: 'Default who_made to "i_did"',
    priority: 40,
    enabled: true,
    conditions: [
      { field: 'who_made', operator: 'is_empty', value: '' },
    ],
    conditionLogic: 'AND',
    actions: [
      { type: 'set', field: 'who_made', value: 'i_did' },
    ],
    channel: 'etsy',
    rulePhase: 'business',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'default-etsy-when-made',
    name: 'Etsy: Set when_made default',
    description: 'Default when_made to "2020_2026"',
    priority: 41,
    enabled: true,
    conditions: [
      { field: 'when_made', operator: 'is_empty', value: '' },
    ],
    conditionLogic: 'AND',
    actions: [
      { type: 'set', field: 'when_made', value: '2020_2026' },
    ],
    channel: 'etsy',
    rulePhase: 'business',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
]

/**
 * Get all default rules for a given channel, or all channels if none specified.
 */
export function getDefaultRules(channel?: string): FeedRule[] {
  const all = [
    ...AMAZON_DEFAULT_RULES,
    ...EBAY_DEFAULT_RULES,
    ...ETSY_DEFAULT_RULES,
  ]

  if (!channel || channel === 'all') return all
  return all.filter(r => r.channel === channel)
}

/**
 * Merge user rules with defaults. User rules with matching names override defaults.
 * Rules are sorted by phase then priority.
 */
export function mergeRulesWithDefaults(
  userRules: FeedRule[],
  channel: string
): FeedRule[] {
  const defaults = getDefaultRules(channel)
  const userRuleNames = new Set(userRules.map(r => r.name.toLowerCase()))

  // Keep defaults that the user hasn't overridden
  const activeDefaults = defaults.filter(d => !userRuleNames.has(d.name.toLowerCase()))

  const merged = [...activeDefaults, ...userRules]

  // Sort by phase order then priority
  const phaseWeight: Record<string, number> = { pre: 0, business: 1, post: 2 }
  return merged.sort((a, b) => {
    const pa = phaseWeight[a.rulePhase ?? 'business'] ?? 1
    const pb = phaseWeight[b.rulePhase ?? 'business'] ?? 1
    if (pa !== pb) return pa - pb
    return a.priority - b.priority
  })
}
