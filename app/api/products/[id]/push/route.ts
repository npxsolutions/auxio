/**
 * POST /api/products/[id]/push  { channels: string[] }
 *
 * Push a master product to N channels (Shopify/eBay/Amazon/Google etc).
 * The master product has the canonical fields (title, description, cost_price,
 * images, brand, category). A listing row already exists per channel (from
 * Phase 2 backfill + ongoing sync). This endpoint copies master fields down
 * onto each listing row for the specified channels, then re-runs the existing
 * publish pipeline which owns the actual marketplace API calls.
 *
 * Conflict resolution: master wins for fields on the master (title, description,
 * images, brand, category, cost_price, barcode, weight_grams). Channel-specific
 * fields on the listing (price overrides, quantity, status) are preserved.
 *
 * This is Phase 2.1's minimum viable "master → channels" flow without the
 * listings → channel_listings table rename (that breaks ~40 routes; deferred).
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { requireActiveOrg } from '@/app/lib/org/context'

const getSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

// Fields copied master → listing. Channel-specific overrides (price, quantity,
// status, category_mappings) are NOT in this list — they stay on the listing.
const MASTER_COPY_FIELDS = [
  'title',
  'description',
  'brand',
  'category',
  'cost_price',
  'weight_grams',
  'barcode',
  'images',
] as const

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: productId } = await params
    if (!productId) return NextResponse.json({ error: 'product id required' }, { status: 400 })

    const { channels } = await request.json() as { channels?: string[] }
    if (!Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json({ error: 'channels array required' }, { status: 400 })
    }

    const supabase = await getSupabase()

    // 1. Load master
    const { data: product, error: pErr } = await supabase
      .from('products')
      .select('id, master_sku, title, description, brand, category, cost_price, weight_grams, barcode, images')
      .eq('id', productId)
      .single()

    if (pErr || !product) {
      return NextResponse.json({ error: pErr?.message ?? 'Product not found' }, { status: 404 })
    }

    // 2. Find every listing already linked to this product
    const { data: linkedListings, error: lErr } = await supabase
      .from('listings')
      .select('id, sku')
      .eq('product_id', productId)

    if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 })

    // Build the per-master payload — only fields defined on product
    const masterPatch: Record<string, unknown> = {}
    for (const field of MASTER_COPY_FIELDS) {
      const v = (product as Record<string, unknown>)[field]
      if (v !== undefined) masterPatch[field] = v
    }
    masterPatch.updated_at = new Date().toISOString()

    // 3. Push master fields onto every linked listing
    let listingsUpdated = 0
    for (const listing of linkedListings ?? []) {
      const { error: upErr } = await supabase
        .from('listings')
        .update(masterPatch)
        .eq('id', listing.id)
      if (!upErr) listingsUpdated++
    }

    // 4. Trigger the existing publish pipeline for each (listing, channel) pair.
    //    We hit /api/listings/[id]/publish with { channels } — the pipeline
    //    owns marketplace API calls + listing_channels row writes.
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
    const publishResults: Array<{ listing_id: string; channel: string; ok: boolean; error?: string }> = []

    for (const listing of linkedListings ?? []) {
      for (const ch of channels) {
        try {
          const res = await fetch(`${origin}/api/listings/${listing.id}/publish`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              cookie: request.headers.get('cookie') ?? '',
            },
            body: JSON.stringify({ channels: [ch] }),
          })
          publishResults.push({
            listing_id: listing.id,
            channel: ch,
            ok: res.ok,
            error: res.ok ? undefined : `HTTP ${res.status}`,
          })
        } catch (err: any) {
          publishResults.push({ listing_id: listing.id, channel: ch, ok: false, error: err.message })
        }
      }
    }

    const succeeded = publishResults.filter((r) => r.ok).length
    const failed = publishResults.length - succeeded

    return NextResponse.json({
      product_id: productId,
      master_sku: product.master_sku,
      listings_updated: listingsUpdated,
      channels_requested: channels,
      publish_succeeded: succeeded,
      publish_failed: failed,
      results: publishResults,
    })
  } catch (err: any) {
    console.error('[products/[id]/push] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
