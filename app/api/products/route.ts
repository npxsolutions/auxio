/**
 * Products API — master-SKU surface (Phase 2).
 *
 * GET    /api/products               → list products with on-hand from inventory_state
 * POST   /api/products               → create a new product
 * PATCH  /api/products  { id, ... }  → update a product
 * DELETE /api/products  { id }       → delete a product (listings FK null out)
 *
 * Org-scoped via RLS; cookie session via requireActiveOrg.
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

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const search = request.nextUrl.searchParams.get('q')?.trim()

    let query = supabase
      .from('products')
      .select('id, master_sku, title, brand, category, cost_price, barcode, images, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(500)

    if (search) {
      query = query.or(`master_sku.ilike.%${search}%,title.ilike.%${search}%`)
    }

    const { data: products, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Join inventory_state for on-hand totals
    const { data: stateRows } = await supabase
      .from('inventory_state')
      .select('product_id, on_hand')

    const onHandByProduct = new Map<string, number>(
      (stateRows ?? []).map((r) => [r.product_id as string, Number(r.on_hand) || 0])
    )

    // Count channel listings per product
    const { data: channelCounts } = await supabase
      .from('listings')
      .select('product_id')

    const listingsByProduct = new Map<string, number>()
    for (const row of channelCounts ?? []) {
      const pid = row.product_id as string | null
      if (pid) listingsByProduct.set(pid, (listingsByProduct.get(pid) ?? 0) + 1)
    }

    const enriched = (products ?? []).map((p) => ({
      ...p,
      on_hand: onHandByProduct.get(p.id) ?? 0,
      channel_listing_count: listingsByProduct.get(p.id) ?? 0,
    }))

    return NextResponse.json({ products: enriched, count: enriched.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { master_sku, title, description, brand, category, cost_price, weight_grams, barcode, images } = body
    if (!master_sku?.trim() || !title?.trim()) {
      return NextResponse.json({ error: 'master_sku and title required' }, { status: 400 })
    }

    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('products')
      .insert({
        organization_id: ctx.id,
        user_id: ctx.user.id,
        master_sku: master_sku.trim(),
        title: title.trim(),
        description, brand, category, cost_price, weight_grams, barcode,
        images: images ?? [],
      })
      .select()
      .single()

    if (error) {
      if ((error as any).code === '23505') {
        return NextResponse.json({ error: 'A product with that SKU already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ product: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ product: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
