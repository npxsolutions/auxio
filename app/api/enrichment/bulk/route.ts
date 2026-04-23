/**
 * [api/enrichment/bulk] — Bulk AI enrichment for multiple listings.
 *
 * POST: Takes an array of listing IDs and fields to enrich.
 * Processes sequentially to manage API costs.
 * Rate-limited per user and plan.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireActiveOrg } from '@/app/lib/org/context'
import { computeEnrichmentScore } from '../route'
import type { Plan } from '@/app/lib/billing/usage'

export const runtime = 'nodejs'

const ENRICHMENT_QUOTAS: Record<Plan, number> = {
  free:           0,
  starter:        10,
  growth:         200,
  scale:          99999,
  enterprise:     99999,
  lifetime_scale: 99999,
}

const BATCH_LIMITS: Record<Plan, number> = {
  free:           0,
  starter:        1,
  growth:         10,
  scale:          50,
  enterprise:     25,
  lifetime_scale: 50,
}

const MAX_BATCH_SIZE = 50

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
- Amazon: Title max 200 chars, include key attributes. 5 bullet points max 500 chars each. Backend search terms max 250 bytes.
- eBay: Title max 80 chars, keyword-rich. HTML description.
- Etsy: Title max 140 chars, storytelling style. 13 tags max 20 chars each.
- Shopify: SEO title max 70 chars, meta description max 320 chars.
- TikTok: Title max 255 chars. Short punchy description.

Return valid JSON only with no markdown formatting. Shape:
{
  "title": "...", "description": "...", "bulletPoints": [...],
  "attributes": {...}, "searchTerms": "...", "category": "...",
  "gtinHint": "...", "tags": [...]
}
Only include requested fields.`
}

type BulkResult = {
  listingId: string
  status: 'success' | 'error'
  enrichedData?: Record<string, unknown>
  comparison?: Record<string, { before: unknown; after: unknown }>
  enrichmentScore?: number
  error?: string
}

export async function POST(request: Request) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const body = await request.json()
    const { listingIds, fields, channel = 'amazon' } = body as {
      listingIds: string[]
      fields: string[]
      channel?: string
    }

    if (!listingIds || !Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json({ error: 'listingIds array is required' }, { status: 400 })
    }
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: 'fields array is required' }, { status: 400 })
    }
    // Check plan quota (reads from the active org)
    const { data: orgRow } = await supabase
      .from('organizations')
      .select('plan')
      .eq('id', ctx.id)
      .maybeSingle()

    const plan = (orgRow?.plan ?? 'free') as Plan
    const quota = ENRICHMENT_QUOTAS[plan] ?? 0

    if (quota === 0) {
      return NextResponse.json({
        error: 'Enrichment is not available on the free plan.',
      }, { status: 403 })
    }

    const batchLimit = BATCH_LIMITS[plan] ?? 1
    if (listingIds.length > batchLimit) {
      const upgradeHint = plan === 'starter'
        ? ' Upgrade to Growth for up to 10 at a time.'
        : plan === 'growth'
          ? ' Upgrade to Scale for up to 50 at a time.'
          : ''
      return NextResponse.json({
        error: `Your plan allows ${batchLimit} listing${batchLimit !== 1 ? 's' : ''} per bulk request. Got ${listingIds.length}.${upgradeHint}`,
        batchLimit,
      }, { status: 400 })
    }

    if (listingIds.length > MAX_BATCH_SIZE) {
      return NextResponse.json({
        error: `Maximum batch size is ${MAX_BATCH_SIZE}. Got ${listingIds.length}.`,
      }, { status: 400 })
    }

    // Check current month usage
    const now = new Date()
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString()

    const { count: usedCount } = await supabase
      .from('enrichment_usage')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', periodStart)
      .lt('created_at', periodEnd)

    const used = usedCount ?? 0
    const remaining = quota === Infinity ? Infinity : quota - used

    if (remaining <= 0) {
      return NextResponse.json({
        error: `Monthly enrichment quota reached (${used}/${quota}).`,
        used,
        quota,
      }, { status: 429 })
    }

    // Cap batch to remaining quota
    const batchSize = quota === Infinity ? listingIds.length : Math.min(listingIds.length, remaining)
    const idsToProcess = listingIds.slice(0, batchSize)

    // Fetch all listings in batch (RLS scopes)
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .in('id', idsToProcess)

    if (listingsError) {
      return NextResponse.json({ error: listingsError.message }, { status: 500 })
    }

    const listingsMap = new Map((listings ?? []).map(l => [l.id, l]))
    const anthropic = getAnthropic()
    const results: BulkResult[] = []

    // Process sequentially to manage API costs
    for (const listingId of idsToProcess) {
      const listing = listingsMap.get(listingId)
      if (!listing) {
        results.push({ listingId, status: 'error', error: 'Listing not found' })
        continue
      }

      try {
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
        }

        const prompt = buildEnrichmentPrompt(productData, channel, fields)
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        })

        const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
        const cleaned = rawText.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim()
        const enrichedData = JSON.parse(cleaned)

        // Build comparison
        const comparison: Record<string, { before: unknown; after: unknown }> = {}
        for (const field of fields) {
          if (field in enrichedData) {
            let before: unknown = null
            switch (field) {
              case 'title':       before = listing.title; break
              case 'description': before = listing.description; break
              case 'bulletPoints': before = listing.bullet_points; break
              case 'attributes':  before = listing.attributes; break
              case 'searchTerms': before = listing.search_terms; break
              case 'category':    before = listing.category; break
              case 'tags':        before = listing.tags; break
            }
            comparison[field] = { before, after: enrichedData[field] }
          }
        }

        await supabase.from('enrichment_usage').insert({
          organization_id: ctx.id,
          user_id: ctx.user.id,
          listing_id: listingId,
          channel,
          fields_requested: fields,
          created_at: new Date().toISOString(),
        })

        results.push({
          listingId,
          status: 'success',
          enrichedData,
          comparison,
          enrichmentScore: computeEnrichmentScore(listing),
        })
      } catch (err: any) {
        console.error(`[enrichment/bulk] failed for ${listingId}:`, err)
        results.push({ listingId, status: 'error', error: err.message })
      }
    }

    const succeeded = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'error').length

    return NextResponse.json({
      total: idsToProcess.length,
      succeeded,
      failed,
      skipped: listingIds.length - idsToProcess.length,
      results,
      usage: {
        used: used + succeeded,
        quota: quota === Infinity ? 'unlimited' : quota,
        remaining: quota === Infinity ? 'unlimited' : Math.max(0, quota - used - succeeded),
      },
    })
  } catch (error: any) {
    console.error('[enrichment/bulk] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
