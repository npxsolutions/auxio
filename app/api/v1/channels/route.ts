import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuthWithOrg } from '../lib/auth'
import { checkApiRateLimit } from '../../../lib/rate-limit/api-public'

export async function GET(request: NextRequest) {
  try {
    const { organizationId, error, supabase } = await requireApiAuthWithOrg(request)
    if (error) return error

    const rl = await checkApiRateLimit(request)
    if (!rl.ok) return rl.response!

    const { data, error: dbError } = await supabase!
      .from('channels')
      .select('id, type, shop_name, active, connected_at, last_synced_at')
      .eq('organization_id', organizationId!)
      .order('connected_at', { ascending: false })

    if (dbError) {
      console.error('[api/v1/channels] db error', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      meta: { count: data?.length ?? 0, organization_id: organizationId },
    })
  } catch (err) {
    console.error('[api/v1/channels] error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
