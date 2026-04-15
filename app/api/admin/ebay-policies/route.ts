// BUNDLE_C — admin: list eBay policy provisioning status + re-provision on demand.
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { isOwner } from '@/app/admin/_lib/owner'
import { ensureEbayPolicies, EbayPolicyError } from '@/app/lib/ebay/policies'
import { getEbayAccessToken } from '@/app/lib/ebay/auth'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

async function gate() {
  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!isOwner(user.email, user.id)) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user }
}

export async function GET() {
  const g = await gate()
  if ('error' in g) return g.error
  const admin = getAdmin()
  const { data, error } = await admin
    .from('channels')
    .select('id, user_id, access_token, metadata, created_at')
    .eq('type', 'ebay')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []).map(c => {
    const meta = (c.metadata ?? {}) as Record<string, unknown>
    const p = (meta.ebay_policies ?? {}) as Record<string, unknown>
    const pay = (p.paymentPolicyId ?? p.payment_policy_id) as string | undefined
    const ret = (p.returnPolicyId ?? p.return_policy_id) as string | undefined
    const ful = (p.fulfillmentPolicyId ?? p.fulfillment_policy_id) as string | undefined
    const haveCount = [pay, ret, ful].filter(Boolean).length
    const status = haveCount === 3 ? 'ok' : haveCount === 0 ? 'missing' : 'partial'
    return {
      channel_id: c.id,
      user_id: c.user_id,
      marketplace: (meta.ebay_marketplace as string) ?? 'EBAY_US',
      status,
      payment_policy_id: pay ?? null,
      return_policy_id: ret ?? null,
      fulfillment_policy_id: ful ?? null,
      provisioned_at: (p.provisioned_at as string) ?? null,
    }
  })

  return NextResponse.json({ generated_at: new Date().toISOString(), rows })
}

export async function POST(request: Request) {
  const g = await gate()
  if ('error' in g) return g.error
  const { channel_id } = await request.json().catch(() => ({})) as { channel_id?: string }
  if (!channel_id) return NextResponse.json({ error: 'channel_id required' }, { status: 400 })

  const admin = getAdmin()
  const { data: channel, error } = await admin
    .from('channels')
    .select('id, user_id, access_token, refresh_token, metadata')
    .eq('id', channel_id)
    .eq('type', 'ebay')
    .single()
  if (error || !channel) return NextResponse.json({ error: error?.message ?? 'not found' }, { status: 404 })

  // Refresh access token via shared auth helper if needed.
  const token = await getEbayAccessToken({
    user_id: channel.user_id,
    access_token: channel.access_token,
    refresh_token: channel.refresh_token,
    metadata: channel.metadata as Record<string, unknown> | null,
  }, admin)
  if (!token) return NextResponse.json({ error: 'eBay token refresh failed' }, { status: 502 })

  try {
    const res = await ensureEbayPolicies(
      { id: channel.id, user_id: channel.user_id, access_token: token.accessToken, metadata: channel.metadata as Record<string, unknown> | null },
      admin,
      { forceRefresh: true },
    )
    return NextResponse.json({ ok: true, result: res })
  } catch (err) {
    if (err instanceof EbayPolicyError) {
      return NextResponse.json({ error: err.message, policy: err.policy, partial: err.partial }, { status: 502 })
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
