/**
 * [api/enrichment/image] — AI-powered image analysis for product listings.
 *
 * POST: Accepts { listingId } or { imageUrl } and returns combined
 * deterministic rules results + AI vision analysis per image.
 *
 * Rate limit: 10 image analyses per minute per user.
 * Tracks usage against enrichment quota.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireActiveOrg } from '@/app/lib/org/context'
import type { Plan } from '@/app/lib/billing/usage'
import {
  validateImages,
  computeImageScore,
  type ImageMetadata,
} from '@/app/lib/feed/image-rules'
import type { ChannelKey } from '@/app/lib/rate-limit/channel'

export const runtime = 'nodejs'

const ENRICHMENT_QUOTAS: Record<Plan, number> = {
  free:           0,
  starter:        10,
  growth:         200,
  scale:          99999,
  enterprise:     99999,
  lifetime_scale: 99999,
}

const IMAGE_ANALYSIS_QUOTAS: Record<Plan, number> = {
  free:           0,
  starter:        0,
  growth:         50,
  scale:          99999,
  enterprise:     99999,
  lifetime_scale: 99999,
}

// Simple in-memory rate limiter: 10 analyses per minute per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

const getSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
}

const getAnthropic = () =>
  new Anthropic({ apiKey: process.env.NEXT_ANTHROPIC_API_KEY! })

// ── AI Vision Analysis ─────────────────────────────────────────────────────────

async function analyzeImageWithAI(
  imageUrl: string,
): Promise<Record<string, unknown>> {
  const anthropic = getAnthropic()

  // Fetch image and convert to base64
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`)
  }

  const imageBuffer = await imageResponse.arrayBuffer()
  const base64 = Buffer.from(imageBuffer).toString('base64')
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
  // Normalize media type for Claude API
  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ] as const
  type MediaType = (typeof validTypes)[number]
  const mediaType: MediaType = (
    validTypes.includes(contentType as MediaType)
      ? contentType
      : 'image/jpeg'
  ) as MediaType

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `You are a product photography expert for ecommerce marketplaces.

Analyze this product image and return JSON:
{
  "overallScore": 1-10,
  "background": {
    "type": "white" | "lifestyle" | "studio" | "cluttered" | "transparent",
    "isClean": boolean,
    "amazonCompliant": boolean
  },
  "product": {
    "visible": boolean,
    "fillsFrame": boolean,
    "percentOfFrame": number,
    "inFocus": boolean
  },
  "issues": [
    { "type": "watermark" | "text_overlay" | "border" | "low_quality" | "wrong_background" | "out_of_focus" | "too_small" | "collage", "description": "..." }
  ],
  "altText": {
    "amazon": "...",
    "ebay": "...",
    "etsy": "...",
    "seo": "..."
  },
  "channelFit": {
    "amazon": { "score": 1-10, "issues": ["..."] },
    "ebay": { "score": 1-10, "issues": ["..."] },
    "etsy": { "score": 1-10, "issues": ["..."] },
    "google": { "score": 1-10, "issues": ["..."] }
  },
  "suggestions": [
    "Consider a white background version for Amazon",
    "Image would benefit from better lighting on the left side"
  ],
  "heroRecommendation": boolean,
  "bestChannel": "amazon" | "ebay" | "etsy" | "shopify"
}

Be specific and actionable. Score honestly — most product photos are 5-7.
Return valid JSON only, no markdown fences.`,
          },
        ],
      },
    ],
  })

  const rawText =
    response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const cleaned = rawText
      .replace(/^```(?:json)?\s*\n?/m, '')
      .replace(/\n?```\s*$/m, '')
      .trim()
    return JSON.parse(cleaned)
  } catch {
    return { error: 'Failed to parse AI response', raw: rawText }
  }
}

// ── POST Handler ───────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()

    // Rate limit
    if (!checkRateLimit(ctx.user.id)) {
      return NextResponse.json(
        {
          error:
            'Rate limit exceeded: maximum 10 image analyses per minute. Please wait.',
        },
        { status: 429 },
      )
    }

    // Check plan quota (reads from the active org)
    const { data: orgRow } = await supabase
      .from('organizations')
      .select('plan')
      .eq('id', ctx.id)
      .maybeSingle()

    const plan = (orgRow?.plan ?? 'free') as Plan
    const imageQuota = IMAGE_ANALYSIS_QUOTAS[plan] ?? 0

    if (plan === 'free') {
      return NextResponse.json(
        {
          error:
            'Image analysis is not available on the free plan. Upgrade to Growth or above.',
        },
        { status: 403 },
      )
    }

    if (plan === 'starter') {
      return NextResponse.json(
        {
          error:
            'AI image analysis is available on Growth and above. Upgrade to unlock.',
        },
        { status: 403 },
      )
    }

    // Check current month usage
    const now = new Date()
    const periodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    ).toISOString()
    const periodEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    ).toISOString()

    const { count: usedCount } = await supabase
      .from('enrichment_usage')
      .select('id', { count: 'exact', head: true })
      .eq('fields_requested', '{image_analysis}')
      .gte('created_at', periodStart)
      .lt('created_at', periodEnd)

    const used = usedCount ?? 0
    if (imageQuota !== 99999 && used >= imageQuota) {
      return NextResponse.json(
        {
          error: `Monthly image analysis quota reached (${used}/${imageQuota}). Upgrade your plan for more.`,
          used,
          quota: imageQuota,
        },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { listingId, imageUrl, channel = 'amazon' } = body as {
      listingId?: string
      imageUrl?: string
      channel?: string
    }

    if (!listingId && !imageUrl) {
      return NextResponse.json(
        { error: 'Either listingId or imageUrl is required' },
        { status: 400 },
      )
    }

    let imageUrls: string[] = []
    let listingData: Record<string, unknown> | null = null

    if (listingId) {
      // Fetch listing images (RLS scopes)
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single()

      if (listingError || !listing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 },
        )
      }

      listingData = listing
      imageUrls = Array.isArray(listing.images) ? listing.images : []

      if (imageUrls.length === 0) {
        return NextResponse.json(
          { error: 'Listing has no images to analyze' },
          { status: 400 },
        )
      }
    } else if (imageUrl) {
      imageUrls = [imageUrl]
    }

    // Build metadata for deterministic validation
    const imageMetadata: ImageMetadata[] = imageUrls.map((url, i) => ({
      url,
      position: i,
      isAccessible: true, // assume accessible for now; AI fetch will verify
    }))

    // Deterministic rules validation
    const rulesResults = validateImages(
      imageMetadata,
      channel as ChannelKey,
    )
    const deterministicScore = computeImageScore(
      imageMetadata,
      channel as ChannelKey,
    )

    // AI vision analysis for each image
    const aiResults: Record<string, unknown>[] = []
    for (const url of imageUrls) {
      try {
        const analysis = await analyzeImageWithAI(url)
        aiResults.push({ url, analysis })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        aiResults.push({ url, error: message })
      }
    }

    // Find hero recommendation
    let heroIndex = 0
    let bestHeroScore = 0
    for (let i = 0; i < aiResults.length; i++) {
      const analysis = (aiResults[i] as Record<string, unknown>)
        .analysis as Record<string, unknown> | undefined
      if (analysis && typeof analysis.overallScore === 'number') {
        if (analysis.overallScore > bestHeroScore) {
          bestHeroScore = analysis.overallScore
          heroIndex = i
        }
      }
    }

    await supabase.from('enrichment_usage').insert({
      organization_id: ctx.id,
      user_id: ctx.user.id,
      listing_id: listingId || null,
      channel,
      fields_requested: ['image_analysis'],
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      listingId: listingId || null,
      channel,
      imageCount: imageUrls.length,
      deterministicScore,
      rulesResults: rulesResults.map((r) => ({
        url: r.image.url,
        position: r.image.position,
        score: r.score,
        issues: r.issues
          .filter((i) => !i.passed)
          .map((i) => ({
            id: i.rule.id,
            severity: i.rule.severity,
            message: i.rule.message,
            fix: i.rule.fix,
          })),
      })),
      aiResults,
      heroRecommendation: {
        index: heroIndex,
        url: imageUrls[heroIndex],
        score: bestHeroScore,
      },
      usage: {
        used: used + 1,
        quota: imageQuota === 99999 ? 'unlimited' : imageQuota,
        remaining:
          imageQuota === 99999 ? 'unlimited' : imageQuota - used - 1,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[enrichment/image] error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
