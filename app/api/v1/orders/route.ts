import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '../lib/auth'
import { checkApiRateLimit } from '../../../lib/rate-limit/api-public'

export async function GET(request: NextRequest) {
  try {
    const { user, error, supabase } = await requireApiAuth(request)
    if (error) return error

    const rl = await checkApiRateLimit(request)
    if (!rl.ok) return rl.response!

    const sp      = request.nextUrl.searchParams
    const channel = sp.get('channel')
    const status  = sp.get('status')
    const limit   = Math.min(parseInt(sp.get('limit') ?? '50'), 200)
    const offset  = parseInt(sp.get('offset') ?? '0')

    let query = supabase!
      .from('orders')
      .select('id, channel, status, total, currency, customer_name, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (channel) query = query.eq('channel', channel)
    if (status)  query = query.eq('status', status)

    const { data, error: dbError } = await query
    if (dbError) {
      console.error('[api/v1/orders] db error', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ data, meta: { count: data?.length ?? 0, offset, limit } })
  } catch (err) {
    console.error('[api/v1/orders] error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
