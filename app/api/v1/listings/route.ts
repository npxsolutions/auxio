import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuthWithOrg } from '../lib/auth'
import { checkApiRateLimit } from '../../../lib/rate-limit/api-public'

export async function GET(request: NextRequest) {
  try {
    const { userId, organizationId, error, supabase } = await requireApiAuthWithOrg(request)
    if (error) return error

    const rl = await checkApiRateLimit(request)
    if (!rl.ok) return rl.response!

    const sp      = request.nextUrl.searchParams
    const channel = sp.get('channel')
    const status  = sp.get('status')
    const limit   = Math.min(parseInt(sp.get('limit') ?? '50'), 200)
    const offset  = parseInt(sp.get('offset') ?? '0')

    // listings is org-scoped (Stage A). Service-role client — must filter explicitly.
    let query = supabase!
      .from('listings')
      .select('id, title, status, category, price, quantity, sku, created_at, updated_at')
      .eq('organization_id', organizationId!)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status)  query = query.eq('status', status)

    // Filter by channel via listing_channels join
    if (channel) {
      const { data: ids, error: idErr } = await supabase!
        .from('listing_channels')
        .select('listing_id')
        .eq('organization_id', organizationId!)
        .eq('channel_type', channel)
      if (idErr) {
        console.error('[api/v1/listings] listing_channels lookup error', idErr)
        return NextResponse.json({ error: idErr.message }, { status: 500 })
      }
      const allowed = (ids ?? []).map((r: { listing_id: string }) => r.listing_id)
      if (allowed.length === 0) {
        return NextResponse.json({ data: [], meta: { count: 0, offset, limit } })
      }
      query = query.in('id', allowed)
    }

    const { data, error: dbError } = await query

    if (dbError) {
      console.error('[api/v1/listings] db error', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    const transformed = (data ?? []).map((r) => ({
      id:             r.id,
      title:          r.title,
      status:         r.status,
      category:       r.category,
      price:          r.price,
      quantity:       r.quantity,
      stock_quantity: r.quantity, // back-compat alias
      sku:            r.sku,
      created_at:     r.created_at,
      updated_at:     r.updated_at,
    }))

    return NextResponse.json({
      data: transformed,
      meta: { count: transformed.length, offset, limit, organization_id: organizationId },
    })
  } catch (err) {
    console.error('[api/v1/listings] error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
