/**
 * [api/enrichment] — AI-powered data enrichment for listings.
 *
 * POST: Takes a listing ID, fields to enrich, and optional channel target.
 * Fetches the listing, uses Claude to generate optimized content, and returns
 * enriched fields for user review (never overwrites automatically).
 *
 * Tracks usage per user against plan quotas.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Plan } from '@/app/lib/billing/usage'

export const runtime = 'nodejs'

const ENRICHMENT_QUOTAS: Record<Plan, number> = {
  free:           0,
  starter:        50,
  growth:         500,
  scale:          Infinity,
  enterprise:     Infinity,
  lifetime_scale: Infinity,
}

const VALID_FIELDS = [
  'title', 'description', 'bulletPoints', 'attributes',
  'searchTerms', 'category', 'gtinHint', 'tags',
] as const

type EnrichField = typeof VALID_FIELDS[number]

const getSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
}

const getAnthropic = () => new Anthropic({
  apiKey: process.env.NEXT_ANTHROPIC_API_KEY!,
})

function buildEnrichmentPrompt(
  productData: Record<string, unknown>,
  channel: string,
  fields: string[],
): string {
  return `You are a product data specialist for ecommerce marketplace listings.

Given this product data:
${JSON.stringify(productData, null, 2)}

Target channel: ${channel}

Generate optimized content for these fields: ${fields.join(', ')}

Channel requirements:
- Amazon: Title max 200 chars, include key attributes. 5 bullet points max 500 chars each. Backend search terms max 250 bytes. Description in plain text (no HTML).
- eBay: Title max 80 chars, keyword-rich for search. Item specifics required. HTML description with clean formatting.
- Etsy: Title max 140 chars, storytelling style with keywords. 13 tags max 20 chars each. Description is storytelling/artisan style.
- Shopify: SEO title max 70 chars, meta description max 320 chars. Clean, brand-forward copy.
- TikTok: Title max 255 chars, trend-aware. Short punchy description.

Return valid JSON only with no markdown formatting. The shape is:
{
  "title": "optimized title string",
  "description": "full description string",
  "bulletPoints": ["point 1", "point 2", ...],
  "attributes": { "color": "...", "material": "...", "size": "...", "brand": "...", "weight": "..." },
  "searchTerms": "keyword1 keyword2 keyword3",
  "category": "Suggested Category > Subcategory",
  "gtinHint": "explanation of where to find or how to obtain a GTIN for this product type",
  "tags": ["tag1", "tag2", ...]
}
Only include fields that were requested. Do not include any extra commentary.`
}

export function computeEnrichmentScore(listing: Record<string, unknown>): number {
  let total = 0
  let filled = 0

  // Title length (> 20 chars is good)
  total++
  const title = String(listing.title ?? '')
  if (title.length >= 20) filled++

  // Description present and meaningful (> 50 chars)
  total++
  const desc = String(listing.description ?? '').replace(/<[^>]*>/g, '').trim()
  if (desc.length >= 50) filled++

  // Image count (at least 1)
  total++
  const imgs = Array.isArray(listing.images) ? listing.images.length : 0
  if (imgs >= 1) filled++

  // Image count bonus (3+ images)
  total++
  if (imgs >= 3) filled++

  // Image count quality bonus (5+ images)
  total++
  if (imgs >= 5) filled++

  // Attributes: brand
  total++
  if (listing.brand && String(listing.brand).trim().length > 0) filled++

  // Attributes: condition
  total++
  if (listing.condition && String(listing.condition).trim().length > 0) filled++

  // GTIN/barcode present
  total++
  const gtin = listing.barcode ?? listing.gtin
  if (gtin && String(gtin).trim().length >= 8) filled++

  // Category mapped
  total++
  if (listing.category && String(listing.category).trim().length > 0) filled++

  // Weight set
  total++
  if (typeof listing.weight_grams === 'number' && listing.weight_grams > 0) filled++

  // Price set
  total++
  if (typeof listing.price === 'number' && listing.price > 0) filled++

  return Math.round((filled / total) * 100)
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { listingId, fields, channel = 'amazon' } = body as {
      listingId: string
      fields: string[]
      channel?: string
    }

    if (!listingId) return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: 'fields array is required' }, { status: 400 })
    }

    const invalidFields = fields.filter(f => !VALID_FIELDS.includes(f as EnrichField))
    if (invalidFields.length > 0) {
      return NextResponse.json({ error: `Invalid fields: ${invalidFields.join(', ')}` }, { status: 400 })
    }

    // Check plan quota
    const { data: userRow } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle()

    const plan = (userRow?.plan ?? 'free') as Plan
    const quota = ENRICHMENT_QUOTAS[plan] ?? 0

    if (quota === 0) {
      return NextResponse.json({
        error: 'Enrichment is not available on the free plan. Upgrade to Starter or above.',
      }, { status: 403 })
    }

    // Check current month usage
    const now = new Date()
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString()

    const { count: usedCount } = await supabase
      .from('enrichment_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', periodStart)
      .lt('created_at', periodEnd)

    const used = usedCount ?? 0
    if (quota !== Infinity && used >= quota) {
      return NextResponse.json({
        error: `Monthly enrichment quota reached (${used}/${quota}). Upgrade your plan for more.`,
        used,
        quota,
      }, { status: 429 })
    }

    // Fetch listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Fetch channel context if available
    const { data: listingChannel } = await supabase
      .from('listing_channels')
      .select('*')
      .eq('listing_id', listingId)
      .eq('channel_type', channel)
      .maybeSingle()

    // Build product data for the prompt
    const productData: Record<string, unknown> = {
      title: listing.title,
      description: listing.description,
      price: listing.price,
      brand: listing.brand || listing.vendor,
      condition: listing.condition,
      category: listing.category,
      sku: listing.sku,
      barcode: listing.barcode,
      weight_grams: listing.weight_grams,
      images: Array.isArray(listing.images) ? listing.images.length : 0,
      quantity: listing.quantity,
      tags: listing.tags,
      bullet_points: listing.bullet_points,
      attributes: listing.attributes || listing.item_specifics,
    }

    if (listingChannel) {
      productData.channelCategory = listingChannel.external_category_id || listingChannel.category_id
      productData.channelStatus = listingChannel.status
    }

    // Call Claude
    const prompt = buildEnrichmentPrompt(productData, channel, fields)
    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    let enrichedData: Record<string, unknown> = {}
    try {
      // Strip any markdown fences if present
      const cleaned = rawText.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim()
      enrichedData = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({
        error: 'Failed to parse AI response',
        raw: rawText,
      }, { status: 502 })
    }

    // Compute enrichment score
    const enrichmentScore = computeEnrichmentScore(listing)

    // Track usage
    await supabase.from('enrichment_usage').insert({
      user_id: user.id,
      listing_id: listingId,
      channel,
      fields_requested: fields,
      created_at: new Date().toISOString(),
    })

    // Build before/after comparison
    const comparison: Record<string, { before: unknown; after: unknown }> = {}
    for (const field of fields) {
      if (field in enrichedData) {
        let before: unknown = null
        switch (field) {
          case 'title':       before = listing.title; break
          case 'description': before = listing.description; break
          case 'bulletPoints': before = listing.bullet_points; break
          case 'attributes':  before = listing.attributes || listing.item_specifics; break
          case 'searchTerms': before = listing.search_terms || listing.generic_keyword; break
          case 'category':    before = listing.category; break
          case 'tags':        before = listing.tags; break
          case 'gtinHint':    before = null; break
        }
        comparison[field] = { before, after: enrichedData[field] }
      }
    }

    return NextResponse.json({
      listingId,
      channel,
      enrichedData,
      comparison,
      enrichmentScore,
      usage: {
        used: used + 1,
        quota: quota === Infinity ? 'unlimited' : quota,
        remaining: quota === Infinity ? 'unlimited' : quota - used - 1,
      },
    })
  } catch (error: any) {
    console.error('[enrichment] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET: Return enrichment score + quota info for a listing
export async function GET(request: Request) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const listingId = url.searchParams.get('listingId')

    // Get plan + quota
    const { data: userRow } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle()

    const plan = (userRow?.plan ?? 'free') as Plan
    const quota = ENRICHMENT_QUOTAS[plan] ?? 0

    const now = new Date()
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString()

    const { count: usedCount } = await supabase
      .from('enrichment_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', periodStart)
      .lt('created_at', periodEnd)

    const used = usedCount ?? 0

    const result: Record<string, unknown> = {
      plan,
      usage: {
        used,
        quota: quota === Infinity ? 'unlimited' : quota,
        remaining: quota === Infinity ? 'unlimited' : Math.max(0, quota - used),
      },
    }

    // If listing specified, compute its enrichment score
    if (listingId) {
      const { data: listing } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .eq('user_id', user.id)
        .single()

      if (listing) {
        result.enrichmentScore = computeEnrichmentScore(listing)
        result.listingId = listingId
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[enrichment] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
