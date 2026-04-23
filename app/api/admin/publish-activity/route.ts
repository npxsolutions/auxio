// [api/listings/publish] admin-only — last 100 publish attempts per user.
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

function isOwner(email: string | null | undefined, id: string | null | undefined): boolean {
  if (id && process.env.ADMIN_OWNER_ID && id === process.env.ADMIN_OWNER_ID) return true
  if (!email) return false
  const list = (process.env.ADMIN_OWNER_EMAILS ?? '').split(',').map(s => s.trim()).filter(Boolean)
  return list.includes(email)
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isOwner(user.email, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(request.url)
  const targetUserId = url.searchParams.get('user_id')
  const targetOrgId  = url.searchParams.get('organization_id')

  const admin = getAdmin()
  let q = admin
    .from('listing_channels')
    .select('user_id, organization_id, listing_id, channel_type, status, channel_url, error_message, published_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100)
  if (targetOrgId)  q = q.eq('organization_id', targetOrgId)
  if (targetUserId) q = q.eq('user_id', targetUserId)
  const { data: attempts, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Pull recent sync_log entries scoped to publish events for the same org/user.
  let logsQ = admin
    .from('sync_log')
    .select('user_id, organization_id, channel, listing_id, level, message, metadata, created_at')
    .in('level', ['blocked_preflight', 'unknown_ebay_error'])
    .order('created_at', { ascending: false })
    .limit(100)
  if (targetOrgId)  logsQ = logsQ.eq('organization_id', targetOrgId)
  if (targetUserId) logsQ = logsQ.eq('user_id', targetUserId)
  const { data: logs } = await logsQ

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    attempts: attempts ?? [],
    publish_logs: logs ?? [],
  })
}
