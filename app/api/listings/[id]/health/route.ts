import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { validateForChannel as preflightValidate } from '@/app/lib/feed/validator'
import type { ChannelKey } from '@/app/lib/rate-limit/channel'
import { requireActiveOrg } from '@/app/lib/org/context'

const CHANNELS = ['shopify', 'ebay', 'amazon'] as const

// Core fields required for all channels
const CORE_REQUIRED: Record<string, string[]> = {
  shopify: ['title', 'price', 'description'],
  ebay:    ['title', 'price', 'description', 'condition'],
  amazon:  ['title', 'price', 'description', 'brand', 'barcode'],
}

const CORE_RECOMMENDED: Record<string, string[]> = {
  shopify: ['images', 'sku', 'quantity', 'weight_grams'],
  ebay:    ['images', 'sku', 'quantity', 'weight_grams', 'barcode'],
  amazon:  ['images', 'sku', 'quantity', 'weight_grams'],
}

const TITLE_LIMITS: Record<string, number> = { shopify: 255, ebay: 80, amazon: 200 }

function scoreChannel(listing: any, template: any, channel: string): {
  score: number
  missing_required: string[]
  missing_optional: string[]
  warnings: string[]
} {
  const missing_required: string[] = []
  const missing_optional: string[] = []
  const warnings: string[] = []

  // Check core fields
  for (const f of CORE_REQUIRED[channel] || []) {
    const val = listing[f]
    const empty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)
    if (empty) missing_required.push(f)
  }
  for (const f of CORE_RECOMMENDED[channel] || []) {
    const val = listing[f]
    const empty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)
    if (empty) missing_optional.push(f)
  }

  // Check template attribute fields
  if (template?.fields) {
    for (const field of template.fields) {
      const val = listing.attributes?.[field.key]
      const empty = val === null || val === undefined || val === ''
      if (field.required && empty) missing_required.push(`attributes.${field.key}`)
      else if (!field.required && empty) missing_optional.push(`attributes.${field.key}`)
      if (field.max_length && val && String(val).length > field.max_length) {
        warnings.push(`${field.label} exceeds ${field.max_length} characters`)
      }
    }
  }

  // Channel-specific warnings
  const titleLimit = TITLE_LIMITS[channel]
  if (listing.title && listing.title.length > titleLimit) {
    warnings.push(`Title is ${listing.title.length - titleLimit} chars over the ${titleLimit}-char ${channel} limit`)
  }
  if (channel === 'ebay' && !listing.images?.length) warnings.push('No images — eBay listings without images get low visibility')
  if (channel === 'amazon' && !listing.barcode) warnings.push('No barcode/EAN — Amazon matching requires a GTIN')
  if (listing.price === 0 || listing.price === '0') warnings.push('Price is £0')

  // Score: start at 100, deduct for missing fields and warnings
  const totalFields = (CORE_REQUIRED[channel]?.length || 0) +
                      (CORE_RECOMMENDED[channel]?.length || 0) +
                      (template?.fields?.length || 0)

  const missingPenalty = totalFields > 0
    ? Math.round(((missing_required.length * 2 + missing_optional.length) / (totalFields * 2)) * 80)
    : 0
  const warningPenalty = Math.min(warnings.length * 5, 20)
  const score = Math.max(0, 100 - missingPenalty - warningPenalty)

  return { score, missing_required, missing_optional, warnings }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    // Get listing — RLS scopes by org
    const { data: listing } = await supabase
      .from('channel_listings').select('*').eq('id', id).single()
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Get templates for this listing's category (channel_templates is global config)
    const { data: templates } = await supabase
      .from('channel_templates')
      .select('*')
      .eq('category', listing.category || 'Other')

    const templateMap: Record<string, any> = {}
    for (const t of templates || []) templateMap[t.channel_type] = t

    // For categories with no exact match, fall back to 'Other'
    if (!templates?.length) {
      const { data: fallback } = await supabase
        .from('channel_templates').select('*').eq('category', 'Other')
      for (const t of fallback || []) templateMap[t.channel_type] = t
    }

    // Score each channel
    const results: Record<string, any> = {}
    const upserts: any[] = []

    for (const channel of CHANNELS) {
      const scored = scoreChannel(listing, templateMap[channel], channel)
      results[channel] = scored
      // feed_health does not yet have organization_id — Stage A.1 follow-up.
      upserts.push({ listing_id: id, user_id: ctx.user.id, channel_type: channel, ...scored, computed_at: new Date().toISOString() })
    }

    // Cache scores
    await supabase.from('feed_health').upsert(upserts, { onConflict: 'listing_id,channel_type' })

    return NextResponse.json({ health: results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: trigger pre-flight revalidation via the new validator framework.
// Body: { channel?: ChannelKey }  default 'ebay'
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
    )

    let channel: ChannelKey = 'ebay'
    try {
      const body = await req.json().catch(() => ({}))
      if (body?.channel) channel = body.channel as ChannelKey
    } catch { /* default */ }

    const { data: ownerCheck } = await supabase
      .from('channel_listings').select('id').eq('id', id).maybeSingle()
    if (!ownerCheck) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const validation = await preflightValidate(id, channel)
    return NextResponse.json({ ok: true, validation })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
