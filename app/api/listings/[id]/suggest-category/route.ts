/**
 * GET /api/listings/[id]/suggest-category
 * Returns top 3 eBay category suggestions for the listing.
 *
 * Log prefix: [api/listings/suggest-category]
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { suggestEbayCategory } from '@/app/lib/feed/category-suggester'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: listing } = await supabase
      .from('listings').select('*').eq('id', id).eq('user_id', user.id).maybeSingle()
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const suggestions = await suggestEbayCategory({
      title: listing.title,
      product_type: listing.category ?? listing.product_type,
      tags: listing.tags ?? [],
      brand: listing.brand,
      description: listing.description,
    })
    return NextResponse.json({ suggestions })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
