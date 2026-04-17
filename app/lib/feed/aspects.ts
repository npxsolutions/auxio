/**
 * Aspects enrichment engine — Shopify listing → eBay aspect map.
 *
 * For each aspect required (or recommended) by the target eBay category we try,
 * in order:
 *
 *   1. shopify_field  — direct field on the listing (vendor, brand, etc.)
 *   2. metafield      — structured metafields namespaced under `custom.*` or
 *                       `palvento.*`
 *   3. inferred       — deterministic inference from variant option values or
 *                       title regex (e.g. pull a colour out of "Red Dress")
 *   4. ai             — Anthropic fallback (lazy SDK, behind
 *                       ENABLE_AI_CATEGORY_SUGGEST + ANTHROPIC_API_KEY)
 *
 * Log prefix: [feed:aspects]
 */

import { aspectsForCategory } from './ebay-aspects-by-category'

export type AspectSource = 'shopify_field' | 'metafield' | 'inferred' | 'ai'

export interface AspectValue {
  value: string
  source: AspectSource
  confidence: number
}

export type AspectMap = Record<string, AspectValue>

export interface ShopifyMetafield {
  namespace?: string
  key: string
  value: string
}

export interface VariantOption {
  name: string
  value: string
}

export interface AspectsListingInput {
  title?: string
  description?: string
  brand?: string
  vendor?: string
  condition?: string
  metafields?: ShopifyMetafield[]
  options?: VariantOption[]
  // any extra loose fields that upstream mapping may surface
  [key: string]: any
}

function metaGet(metafields: ShopifyMetafield[] | undefined, keys: string[]): string | null {
  if (!metafields) return null
  for (const k of keys) {
    const [ns, key] = k.includes('.') ? k.split('.') : ['custom', k]
    const hit = metafields.find(m => (m.namespace ?? 'custom') === ns && m.key === key)
    if (hit && hit.value) return hit.value
  }
  return null
}

function optionGet(options: VariantOption[] | undefined, names: string[]): string | null {
  if (!options) return null
  const lower = names.map(n => n.toLowerCase())
  const hit = options.find(o => lower.includes(String(o.name ?? '').toLowerCase()))
  return hit?.value ?? null
}

const COLOUR_KEYWORDS = [
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange',
  'grey', 'gray', 'brown', 'beige', 'cream', 'ivory', 'navy', 'khaki', 'silver',
  'gold', 'rose', 'teal', 'burgundy', 'olive', 'mustard', 'coral', 'turquoise',
]
function inferColour(title?: string): string | null {
  if (!title) return null
  const lower = title.toLowerCase()
  for (const c of COLOUR_KEYWORDS) {
    if (new RegExp(`\\b${c}\\b`).test(lower)) return c[0].toUpperCase() + c.slice(1)
  }
  return null
}

const MATERIAL_KEYWORDS = ['cotton', 'polyester', 'leather', 'wool', 'silk', 'linen', 'denim', 'suede', 'nylon', 'cashmere', 'viscose']
function inferMaterial(title?: string, description?: string): string | null {
  const hay = `${title ?? ''} ${description ?? ''}`.toLowerCase()
  for (const m of MATERIAL_KEYWORDS) {
    if (new RegExp(`\\b${m}\\b`).test(hay)) return m[0].toUpperCase() + m.slice(1)
  }
  return null
}

// ── Deterministic mappers per aspect name ──
type Mapper = (l: AspectsListingInput) => AspectValue | null

const DETERMINISTIC: Record<string, Mapper> = {
  Brand: l => {
    const v = l.brand ?? l.vendor
    return v ? { value: String(v), source: 'shopify_field', confidence: 0.95 } : null
  },
  Condition: l => {
    const meta = metaGet(l.metafields, ['custom.condition', 'palvento.condition'])
    if (meta) return { value: meta, source: 'metafield', confidence: 0.95 }
    if (l.condition) return { value: String(l.condition), source: 'shopify_field', confidence: 0.9 }
    return { value: 'New', source: 'inferred', confidence: 0.6 }
  },
  Colour: l => {
    const opt = optionGet(l.options, ['Colour', 'Color'])
    if (opt) return { value: opt, source: 'shopify_field', confidence: 0.92 }
    const meta = metaGet(l.metafields, ['custom.color', 'custom.colour'])
    if (meta) return { value: meta, source: 'metafield', confidence: 0.9 }
    const inf = inferColour(l.title)
    return inf ? { value: inf, source: 'inferred', confidence: 0.55 } : null
  },
  Color: l => DETERMINISTIC.Colour(l),
  Size: l => {
    const opt = optionGet(l.options, ['Size', 'UK Size'])
    if (opt) return { value: opt, source: 'shopify_field', confidence: 0.92 }
    const meta = metaGet(l.metafields, ['custom.size'])
    return meta ? { value: meta, source: 'metafield', confidence: 0.9 } : null
  },
  'UK Shoe Size': l => {
    const opt = optionGet(l.options, ['Size', 'UK Shoe Size', 'Shoe Size'])
    return opt ? { value: opt, source: 'shopify_field', confidence: 0.9 } : null
  },
  Material: l => {
    const meta = metaGet(l.metafields, ['custom.material'])
    if (meta) return { value: meta, source: 'metafield', confidence: 0.92 }
    const inf = inferMaterial(l.title, l.description)
    return inf ? { value: inf, source: 'inferred', confidence: 0.55 } : null
  },
  Department: l => {
    const meta = metaGet(l.metafields, ['custom.department'])
    if (meta) return { value: meta, source: 'metafield', confidence: 0.9 }
    const t = `${l.title ?? ''} ${l.product_type ?? ''}`.toLowerCase()
    if (/\b(women|womens|ladies)\b/.test(t)) return { value: 'Women', source: 'inferred', confidence: 0.75 }
    if (/\b(men|mens)\b/.test(t)) return { value: 'Men', source: 'inferred', confidence: 0.75 }
    if (/\b(kid|kids|child|children|girl|boy)\b/.test(t)) return { value: 'Kids', source: 'inferred', confidence: 0.7 }
    return null
  },
  Style: l => {
    const meta = metaGet(l.metafields, ['custom.style'])
    return meta ? { value: meta, source: 'metafield', confidence: 0.9 } : null
  },
  Pattern: l => {
    const meta = metaGet(l.metafields, ['custom.pattern'])
    return meta ? { value: meta, source: 'metafield', confidence: 0.9 } : null
  },
  Model: l => {
    const meta = metaGet(l.metafields, ['custom.model'])
    return meta ? { value: meta, source: 'metafield', confidence: 0.9 } : null
  },
}

// ── AI fallback ──
let cachedAnthropic: any | null = null
async function getAnthropic(): Promise<any | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (cachedAnthropic) return cachedAnthropic
  try {
    const mod: any = await import('@anthropic-ai/sdk')
    const Ctor = mod.default ?? mod.Anthropic
    cachedAnthropic = new Ctor({ apiKey: process.env.ANTHROPIC_API_KEY })
    return cachedAnthropic
  } catch (err) {
    console.warn('[feed:aspects] anthropic SDK load failed:', err)
    return null
  }
}

async function aiExtract(
  listing: AspectsListingInput,
  missing: string[],
): Promise<Record<string, string>> {
  if (process.env.ENABLE_AI_CATEGORY_SUGGEST !== '1') return {}
  if (!missing.length) return {}
  const anthropic = await getAnthropic()
  if (!anthropic) return {}

  const prompt = `You are extracting eBay listing aspects from a Shopify product.

Title: ${listing.title ?? ''}
Description: ${(listing.description ?? '').slice(0, 800)}
Brand: ${listing.brand ?? listing.vendor ?? ''}

Extract these aspects (return null for any you cannot confidently infer):
${missing.map(m => `  - ${m}`).join('\n')}

Reply with a compact JSON object keyed by aspect name only, no prose:
{"Brand":"...","Size":"M",...}`

  try {
    const res = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = res?.content?.[0]?.type === 'text' ? res.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return {}
    const parsed = JSON.parse(match[0]) as Record<string, string | null>
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string' && v.trim()) out[k] = v.trim()
    }
    return out
  } catch (err) {
    console.warn('[feed:aspects] AI call failed:', err)
    return {}
  }
}

// ── Public API ──
export async function extractAspects(
  listing: AspectsListingInput,
  ebayCategoryId: string,
): Promise<AspectMap> {
  const { required, recommended } = aspectsForCategory(ebayCategoryId)
  const targets = Array.from(new Set([...required, ...recommended]))
  const out: AspectMap = {}

  for (const name of targets) {
    const mapper = DETERMINISTIC[name]
    const hit = mapper ? mapper(listing) : null
    if (hit) out[name] = hit
  }

  // AI fallback only for still-missing REQUIRED aspects
  const stillMissing = required.filter(n => !out[n] || !out[n].value)
  if (stillMissing.length) {
    const ai = await aiExtract(listing, stillMissing)
    for (const [name, value] of Object.entries(ai)) {
      if (!out[name]) out[name] = { value, source: 'ai', confidence: 0.6 }
    }
  }

  return out
}

export function aspectMapToPayload(map: AspectMap): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(map)) {
    if (v && v.value) out[k] = v.value
  }
  return out
}
