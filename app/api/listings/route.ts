import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { requireActiveOrg } from '@/app/lib/org/context'

const getSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

export async function GET() {
  try {
    // ORG CONTEXT — RLS handles row scoping; no explicit user_id/org_id filter needed on read
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('channel_listings')
      .select(`*, listing_channels(*)`)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ listings: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()

    const body = await request.json()
    const { title, description, price, compare_price, sku, barcode, brand, category, condition, quantity, weight_grams, images, attributes } = body

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('channel_listings')
      .insert({
        organization_id: ctx.id,
        user_id: ctx.user.id, // creator attribution within the org
        title,
        description,
        price: price ?? 0,
        compare_price,
        sku,
        barcode,
        brand,
        category,
        condition: condition ?? 'new',
        quantity: quantity ?? 0,
        weight_grams,
        images: images ?? [],
        attributes: attributes ?? {},
        status: 'draft',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ listing: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
