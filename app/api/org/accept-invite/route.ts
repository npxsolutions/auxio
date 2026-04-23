/**
 * POST /api/org/accept-invite { token }
 *
 * Authenticated endpoint — adds the caller to the invitation's org as the
 * specified role, then marks the invitation accepted.
 *
 * Guards:
 *   - Caller must be signed in (we need a user id to write the membership row).
 *   - Invitation must exist, not be expired, not already accepted.
 *   - Caller's email must match the invitation's email (case-insensitive) —
 *     the admin flagged this email; accepting from a different account would
 *     break intent.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/app/lib/supabase-server'
import { setActiveOrgCookie } from '@/app/lib/org/context'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

export async function POST(request: NextRequest) {
  try {
    const sb = await createServerClient()
    const {
      data: { user },
    } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Must sign in to accept invite' }, { status: 401 })

    const { token } = await request.json()
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'token required' }, { status: 400 })
    }

    const admin = getAdmin()
    const { data: invite, error: inviteErr } = await admin
      .from('organization_invitations')
      .select('id, organization_id, email, role, expires_at, accepted_at')
      .eq('token', token)
      .maybeSingle()

    if (inviteErr) return NextResponse.json({ error: inviteErr.message }, { status: 500 })
    if (!invite)   return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    if (invite.accepted_at) return NextResponse.json({ error: 'Invitation already accepted' }, { status: 409 })
    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 410 })
    }

    const userEmail = (user.email ?? '').toLowerCase().trim()
    const inviteEmail = (invite.email ?? '').toLowerCase().trim()
    if (userEmail !== inviteEmail) {
      return NextResponse.json(
        { error: 'Sign in with the invited email address' },
        { status: 403 },
      )
    }

    // Insert the membership (ON CONFLICT = no-op if already a member).
    const { error: memberErr } = await admin
      .from('organization_members')
      .upsert(
        {
          organization_id: invite.organization_id,
          user_id: user.id,
          role: invite.role,
          invited_by: null,
          invited_at: null,
          accepted_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,user_id' },
      )

    if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 })

    // Mark invitation accepted.
    await admin
      .from('organization_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    // Flip the user over to the new org right away.
    await setActiveOrgCookie(invite.organization_id as string)

    return NextResponse.json({ ok: true, organization_id: invite.organization_id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
