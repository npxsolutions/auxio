/**
 * POST /api/listings/[id]/enrich-aspects?channel=ebay
 *
 * Runs deterministic + AI aspect extraction for the target channel, upserts
 * into `listing_channel_aspects`, re-runs the validator, and returns both.
 *
 * Log prefix: [api/listings/enrich-aspects]
 */
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { extractAspects } from '@/app/lib/feed/aspects'
import { validateForChannel } from '@/app/lib/feed/validator'
import { requireActiveOrg } from '@/app/lib/org/context'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const url = new URL(req.url)
    const channel = (url.searchParams.get('channel') ?? 'ebay') as 'ebay'

    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
    )

    const { data: listing } = await supabase
      .from('listings').select('*').eq('id', id).maybeSingle()
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: lc } = await supabase
      .from('listing_channels').select('*').eq('listing_id', id).eq('channel_type', channel).maybeSingle()

    const categoryId = lc?.external_category_id ?? lc?.category_id
    if (!categoryId) {
      return NextResponse.json({ error: 'No eBay category mapped — pick a category first.' }, { status: 400 })
    }

    const aspects = await extractAspects(
      {
        title: listing.title,
        description: listing.description,
        brand: listing.brand,
        vendor: listing.vendor ?? listing.brand,
        condition: listing.condition,
        metafields: listing.metafields ?? [],
        options: listing.options ?? [],
        product_type: listing.category ?? listing.product_type,
      },
      String(categoryId),
    )

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    await admin.from('listing_channel_aspects').upsert({
      organization_id: ctx.id,
      user_id: ctx.user.id,
      listing_id: id,
      channel,
      aspects: aspects as unknown as object,
      category_id: String(categoryId),
      category_path: lc?.category_name ?? null,
      last_enriched_at: new Date().toISOString(),
    }, { onConflict: 'user_id,listing_id,channel' })

    console.log(`[api/listings/enrich-aspects] listing=${id} channel=${channel} aspects=${Object.keys(aspects).length}`)
    const validation = await validateForChannel(id, channel)
    return NextResponse.json({ ok: true, aspects, validation })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
