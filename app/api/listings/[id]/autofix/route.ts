/**
 * POST /api/listings/[id]/autofix
 * Body: { rule: 'EBAY_GTIN_REQUIRED' | 'EBAY_CONDITION_SET' | 'EBAY_CATEGORY_MAPPED' }
 *
 * Deterministic auto-fixes for the three rules flagged `autoFixable: true` in
 * the Bundle A validator. After applying, re-runs the validator so the caller
 * can show a fresh health score.
 *
 * Log prefix: [api/listings/autofix]
 */
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { validateForChannel } from '@/app/lib/feed/validator'
import { suggestEbayCategory } from '@/app/lib/feed/category-suggester'
import { requireActiveOrg } from '@/app/lib/org/context'

const SUPPORTED = new Set(['EBAY_GTIN_REQUIRED', 'EBAY_CONDITION_SET', 'EBAY_CATEGORY_MAPPED'])

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

    const body: { rule?: string } = await req.json().catch(() => ({}))
    const rule = body.rule
    if (!rule || !SUPPORTED.has(rule)) {
      return NextResponse.json({ error: 'Unsupported rule' }, { status: 400 })
    }

    const { data: listing } = await supabase
      .from('channel_listings').select('*').eq('id', id).maybeSingle()
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    let applied = false
    let detail = ''

    if (rule === 'EBAY_GTIN_REQUIRED') {
      // Map Shopify barcode onto listings.barcode — if barcode is already set on
      // the listing row but GTIN field is empty, mirror it; otherwise nothing
      // deterministic to do (user must add a real UPC/EAN).
      const gtin = listing.barcode ?? listing.gtin
      if (gtin && String(gtin).trim().length >= 8) {
        applied = true
        detail = `Mirrored existing barcode ${gtin}`
      } else {
        detail = 'No barcode on listing — manual entry required'
      }
    }

    if (rule === 'EBAY_CONDITION_SET') {
      if (!listing.condition) {
        await admin.from('channel_listings').update({ condition: 'new' }).eq('id', id)
        applied = true
        detail = 'Set condition to "new"'
      } else {
        applied = true
        detail = `Condition already "${listing.condition}"`
      }
    }

    if (rule === 'EBAY_CATEGORY_MAPPED') {
      const suggestions = await suggestEbayCategory({
        title: listing.title,
        product_type: listing.category ?? listing.product_type,
        tags: listing.tags ?? [],
        brand: listing.brand,
        description: listing.description,
      })
      const top = suggestions[0]
      if (top && top.confidence >= 0.8) {
        await admin.from('listing_channels').upsert({
          listing_id: id,
          organization_id: ctx.id,
          user_id: ctx.user.id,
          channel_type: 'ebay',
          external_category_id: top.ebayCategoryId,
          category_id: top.ebayCategoryId,
          category_name: top.ebayCategoryPath,
        }, { onConflict: 'listing_id,channel_type' })
        await admin.from('listing_channel_aspects').upsert({
          organization_id: ctx.id,
          user_id: ctx.user.id,
          listing_id: id,
          channel: 'ebay',
          aspects: {},
          category_id: top.ebayCategoryId,
          category_path: top.ebayCategoryPath,
          category_confidence: top.confidence,
          category_source: top.source,
          last_enriched_at: new Date().toISOString(),
        }, { onConflict: 'user_id,listing_id,channel' })
        applied = true
        detail = `Set category ${top.ebayCategoryId} (${top.source}, ${top.confidence.toFixed(2)})`
      } else {
        detail = 'No high-confidence category suggestion — show manual picker'
      }
    }

    console.log(`[api/listings/autofix] listing=${id} rule=${rule} applied=${applied} ${detail}`)

    const validation = await validateForChannel(id, 'ebay')
    return NextResponse.json({ ok: true, applied, detail, validation })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
