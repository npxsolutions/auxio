/**
 * Notifications API (Phase 4).
 *
 * GET    /api/notifications                            → unread + recent list
 * PATCH  /api/notifications  { id, read? , dismissed? } → mark read / dismissed
 * DELETE /api/notifications  { id }                    → hard delete
 *
 * Org-scoped via RLS. Users see all notifications in their active org;
 * `target_user_id` filters to "mine" when set, otherwise org-wide.
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

    const unreadOnly = request.nextUrl.searchParams.get('unread') === '1'
    const supabase = await getSupabase()

    let query = supabase
      .from('notifications')
      .select('id, kind, severity, title, body, action_url, data, read_at, dismissed_at, created_at')
      // target_user_id IS NULL means org-wide; if set, must match caller.
      .or(`target_user_id.is.null,target_user_id.eq.${ctx.user.id}`)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (unreadOnly) query = query.is('read_at', null)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const unreadCount = (data ?? []).filter((n) => !n.read_at).length
    return NextResponse.json({ notifications: data ?? [], unread_count: unreadCount })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, read, dismissed, all } = await request.json()

    const supabase = await getSupabase()
    const now = new Date().toISOString()
    const updates: Record<string, string | null> = {}
    if (read === true) updates.read_at = now
    if (read === false) updates.read_at = null
    if (dismissed === true) updates.dismissed_at = now
    if (dismissed === false) updates.dismissed_at = null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No update fields' }, { status: 400 })
    }

    let query = supabase.from('notifications').update(updates)
    if (all === true) {
      query = query.or(`target_user_id.is.null,target_user_id.eq.${ctx.user.id}`)
    } else if (id) {
      query = query.eq('id', id)
    } else {
      return NextResponse.json({ error: 'id or all=true required' }, { status: 400 })
    }

    const { error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const supabase = await getSupabase()
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
