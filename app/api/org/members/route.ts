/**
 * GET    /api/org/members             → list members of the active org
 * DELETE /api/org/members { userId }  → remove a member (owner/admin only; cannot remove owner)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireActiveOrg } from '@/app/lib/org/context'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

export async function GET() {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdmin()
    const { data: members, error } = await admin
      .from('organization_members')
      .select('user_id, role, accepted_at, created_at')
      .eq('organization_id', ctx.id)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Resolve emails via auth.admin.listUsers — one page fetch; fine for teams up to ~200.
    const authSb = admin
    const { data: authList } = await authSb.auth.admin.listUsers({ perPage: 1000 })
    const emailByUserId = new Map<string, string | null>(
      (authList?.users ?? []).map((u) => [u.id, u.email ?? null]),
    )

    const enriched = (members ?? []).map((m) => ({
      ...m,
      email: emailByUserId.get(m.user_id) ?? null,
    }))

    return NextResponse.json({ members: enriched })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (ctx.role !== 'owner' && ctx.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — owner/admin only' }, { status: 403 })
    }

    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const admin = getAdmin()

    // Refuse to remove the org owner.
    const { data: target } = await admin
      .from('organization_members')
      .select('role')
      .eq('organization_id', ctx.id)
      .eq('user_id', userId)
      .maybeSingle()
    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (target.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 400 })
    }

    const { error } = await admin
      .from('organization_members')
      .delete()
      .eq('organization_id', ctx.id)
      .eq('user_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
