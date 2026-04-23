/**
 * POST /api/org/invite  { email, role }
 *   Admins create pending invitation tokens. Emails are NOT sent in Phase 1 —
 *   the caller copies the token from the team settings page and shares it.
 *
 * DELETE /api/org/invite  { id }
 *   Admins revoke a pending invitation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { requireActiveOrg } from '@/app/lib/org/context'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

const VALID_ROLES = new Set(['owner', 'admin', 'member', 'viewer'])

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (ctx.role !== 'owner' && ctx.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — owner/admin only' }, { status: 403 })
    }

    const { email, role = 'member' } = await request.json()
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    if (!VALID_ROLES.has(role) || role === 'owner') {
      return NextResponse.json({ error: 'Invalid role (cannot invite owner)' }, { status: 400 })
    }

    const token = crypto.randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days

    const admin = getAdmin()
    const { data, error } = await admin
      .from('organization_invitations')
      .insert({
        organization_id: ctx.id,
        email: email.toLowerCase().trim(),
        role,
        token,
        invited_by: ctx.user.id,
        expires_at: expiresAt,
      })
      .select('id, email, role, token, expires_at, created_at')
      .single()

    if (error) {
      if ((error as any).code === '23505') {
        return NextResponse.json({ error: 'Already invited' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ invitation: data })
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

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const admin = getAdmin()
    const { error } = await admin
      .from('organization_invitations')
      .delete()
      .eq('id', id)
      .eq('organization_id', ctx.id) // scope to the admin's active org — cannot delete other orgs' invites

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
