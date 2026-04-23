/**
 * GET /api/org/invitations
 *   - No token: list pending invitations for the active org (admin-only).
 *   - With ?token=...: look up the invitation by token (public — users visit
 *     via the accept link before they're authenticated).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireActiveOrg } from '@/app/lib/org/context'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const admin = getAdmin()

  // Token lookup — public, hard to guess (48-char hex).
  if (token) {
    const { data, error } = await admin
      .from('organization_invitations')
      .select('id, organization_id, email, role, expires_at, accepted_at, organizations:organization_id(name, slug)')
      .eq('token', token)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data)  return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })

    const expired = data.expires_at && new Date(data.expires_at).getTime() < Date.now()
    return NextResponse.json({
      invitation: {
        id: data.id,
        email: data.email,
        role: data.role,
        expires_at: data.expires_at,
        accepted: !!data.accepted_at,
        expired,
        organization_name: (data.organizations as any)?.name ?? null,
        organization_slug: (data.organizations as any)?.slug ?? null,
      },
    })
  }

  // List mode — requires admin/owner of the active org.
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.role !== 'owner' && ctx.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — owner/admin only' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('organization_invitations')
    .select('id, email, role, token, expires_at, accepted_at, created_at, invited_by')
    .eq('organization_id', ctx.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invitations: data ?? [] })
}
