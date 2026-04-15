/**
 * Category suggester — Shopify listing → top 3 eBay leaf categories.
 *
 * Three-layer strategy:
 *   1. Exact-map hit on normalised product_type (confidence as seeded).
 *   2. Token fuzzy match across title + product_type + tags + brand against
 *      every seed entry's matchable tokens, ranked by Jaccard-style overlap.
 *   3. AI fallback (Anthropic, lazy SDK) when the best score < 0.5 — only
 *      fires when `ENABLE_AI_CATEGORY_SUGGEST=1` and `ANTHROPIC_API_KEY` set.
 *
 * AI results are cached in `category_suggestions_cache` keyed by an
 * input-shape hash to cut cost on re-imports of the same catalog.
 *
 * Log prefix: [feed:cat-suggest]
 */

import { createHash } from 'node:crypto'
import { SEED_EBAY_CATEGORIES, type SeedCategoryEntry } from './seed-ebay-categories'

export type CategorySource = 'exact_map' | 'fuzzy_map' | 'ai'

export interface CategorySuggestion {
  ebayCategoryId: string
  ebayCategoryPath: string
  confidence: number
  source: CategorySource
  reason?: string
}

export interface SuggesterListingInput {
  title?: string
  product_type?: string
  tags?: string[]
  brand?: string
  description?: string
}

// ── Token helpers ──
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'for', 'with', 'to', 'in', 'on', 'by',
  'men', 'mens', 'women', 'womens', 'kids', 'new', 'used', 'pack', 'set',
])

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t && t.length > 1 && !STOPWORDS.has(t))
}

function norm(s: string | undefined | null): string {
  return String(s ?? '').trim().toLowerCase()
}

// ── Exact + fuzzy map ──
function scoreSeed(entry: SeedCategoryEntry, input: SuggesterListingInput): number {
  const haystack = new Set<string>([
    ...tokenize(input.title ?? ''),
    ...tokenize(input.product_type ?? ''),
    ...tokenize((input.tags ?? []).join(' ')),
    ...tokenize(input.brand ?? ''),
  ])
  if (haystack.size === 0) return 0

  const needles = new Set<string>([
    ...tokenize(entry.shopifyType),
    ...(entry.shopifyTitleKeywords ?? []).flatMap(k => tokenize(k)),
    ...(entry.shopifyTagsAll ?? []).flatMap(k => tokenize(k)),
  ])
  if (needles.size === 0) return 0

  let hits = 0
  for (const n of needles) if (haystack.has(n)) hits++
  // Require at least one token match; score = overlap ratio × seed confidence
  if (hits === 0) return 0
  const overlap = hits / needles.size
  return overlap * entry.confidence
}

function localSuggest(input: SuggesterListingInput): CategorySuggestion[] {
  const pt = norm(input.product_type)
  const out: CategorySuggestion[] = []

  // Layer 1: exact product_type match
  if (pt) {
    for (const entry of SEED_EBAY_CATEGORIES) {
      if (norm(entry.shopifyType) === pt) {
        out.push({
          ebayCategoryId: entry.ebayCategoryId,
          ebayCategoryPath: entry.ebayCategoryPath,
          confidence: entry.confidence,
          source: 'exact_map',
          reason: `Exact match on product_type "${pt}"`,
        })
      }
    }
  }

  // Layer 2: fuzzy score across all seeds
  const scored: { s: number; e: SeedCategoryEntry }[] = []
  for (const e of SEED_EBAY_CATEGORIES) {
    const s = scoreSeed(e, input)
    if (s > 0) scored.push({ s, e })
  }
  scored.sort((a, b) => b.s - a.s)
  for (const { s, e } of scored) {
    if (out.some(o => o.ebayCategoryId === e.ebayCategoryId)) continue
    out.push({
      ebayCategoryId: e.ebayCategoryId,
      ebayCategoryPath: e.ebayCategoryPath,
      confidence: Number(s.toFixed(3)),
      source: 'fuzzy_map',
      reason: `Token overlap with "${e.shopifyType}"`,
    })
    if (out.length >= 6) break
  }

  return out.slice(0, 3)
}

// ── AI fallback (lazy SDK) ──
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
    console.warn('[feed:cat-suggest] anthropic SDK load failed:', err)
    return null
  }
}

function hashInput(input: SuggesterListingInput): string {
  const payload = JSON.stringify({
    t: norm(input.title),
    p: norm(input.product_type),
    b: norm(input.brand),
    g: (input.tags ?? []).map(norm).sort(),
  })
  return createHash('sha256').update(payload).digest('hex').slice(0, 32)
}

async function getCachedAiSuggestions(hash: string): Promise<CategorySuggestion[] | null> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await admin
      .from('category_suggestions_cache')
      .select('suggestions, created_at')
      .eq('input_hash', hash)
      .maybeSingle()
    if (data && data.created_at && data.created_at >= weekAgo) {
      return data.suggestions as CategorySuggestion[]
    }
  } catch (err) {
    console.warn('[feed:cat-suggest] cache read failed:', err)
  }
  return null
}

async function writeCachedAiSuggestions(hash: string, suggestions: CategorySuggestion[]): Promise<void> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    await admin.from('category_suggestions_cache').upsert({
      input_hash: hash,
      suggestions: suggestions as unknown as object,
      created_at: new Date().toISOString(),
    }, { onConflict: 'input_hash' })
  } catch (err) {
    console.warn('[feed:cat-suggest] cache write failed:', err)
  }
}

async function aiSuggest(
  input: SuggesterListingInput,
  candidates: SeedCategoryEntry[],
): Promise<CategorySuggestion | null> {
  if (process.env.ENABLE_AI_CATEGORY_SUGGEST !== '1') return null
  const anthropic = await getAnthropic()
  if (!anthropic) return null

  const shortCandidates = candidates.slice(0, 10).map(c => ({
    id: c.ebayCategoryId, path: c.ebayCategoryPath,
  }))
  const prompt = `You are a cataloguer placing a Shopify product into the correct eBay UK leaf category.

Product:
  title: ${input.title ?? ''}
  product_type: ${input.product_type ?? ''}
  tags: ${(input.tags ?? []).join(', ')}
  brand: ${input.brand ?? ''}

Candidate leaf categories:
${shortCandidates.map(c => `  - ${c.id}: ${c.path}`).join('\n')}

Pick the single best category id from the list above. Reply with a compact JSON object only:
{"id":"<categoryId>","reason":"<one-sentence why>"}`

  try {
    const res = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = res?.content?.[0]?.type === 'text' ? res.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0]) as { id?: string; reason?: string }
    const pick = candidates.find(c => c.ebayCategoryId === parsed.id)
    if (!pick) return null
    return {
      ebayCategoryId: pick.ebayCategoryId,
      ebayCategoryPath: pick.ebayCategoryPath,
      confidence: 0.75,
      source: 'ai',
      reason: parsed.reason ?? 'Anthropic selection from candidate leaves',
    }
  } catch (err) {
    console.warn('[feed:cat-suggest] AI call failed:', err)
    return null
  }
}

// ── Public API ──
export async function suggestEbayCategory(
  listing: SuggesterListingInput,
): Promise<CategorySuggestion[]> {
  const local = localSuggest(listing)
  const topScore = local[0]?.confidence ?? 0

  if (topScore >= 0.5 || process.env.ENABLE_AI_CATEGORY_SUGGEST !== '1') {
    return local
  }

  // AI fallback
  const hash = hashInput(listing)
  const cached = await getCachedAiSuggestions(hash)
  if (cached && cached.length) return cached

  const candidates = local.length
    ? local.map(l => SEED_EBAY_CATEGORIES.find(s => s.ebayCategoryId === l.ebayCategoryId)).filter(Boolean) as SeedCategoryEntry[]
    : SEED_EBAY_CATEGORIES.slice(0, 10)

  const ai = await aiSuggest(listing, candidates.length ? candidates : SEED_EBAY_CATEGORIES.slice(0, 10))
  if (!ai) return local

  const merged = [ai, ...local.filter(l => l.ebayCategoryId !== ai.ebayCategoryId)].slice(0, 3)
  await writeCachedAiSuggestions(hash, merged)
  return merged
}

// Exported for tests
export const __internals = { localSuggest, tokenize, scoreSeed, hashInput }
