// DSAR — Account deletion request (GDPR Art. 17).
// POST /api/data/delete  { confirm: true }
// We never hard-delete inline. A row is queued in public.deletion_requests
// and processed out-of-band behind an admin gate within the 30-day SLA.

import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase-server'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  let body: { confirm?: boolean } = {}
  try { body = await req.json() } catch { /* no-op */ }
  if (body?.confirm !== true) {
    return NextResponse.json(
      { error: 'Confirmation required. Send { "confirm": true } to proceed.' },
      { status: 400 }
    )
  }

  const admin = getSupabaseAdmin()

  // Is there already a pending request? Idempotent.
  const { data: existing } = await admin
    .from('deletion_requests')
    .select('id, status, requested_at')
    .eq('user_id', user.id)
    .in('status', ['pending', 'processing'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      ok: true,
      status: existing.status,
      requested_at: existing.requested_at,
      message:
        'A deletion request is already in flight. We will process it within 30 days and email you at completion.',
    })
  }

  const { data, error } = await admin
    .from('deletion_requests')
    .insert({ user_id: user.id, status: 'pending' })
    .select('id, requested_at, status')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Audit trail — best-effort.
  await admin.from('audit_log').insert({
    user_id: user.id,
    action: 'dsar.deletion_requested',
    metadata: { request_id: data.id },
  }).then(() => {}, () => {})

  return NextResponse.json({
    ok: true,
    request_id: data.id,
    status: data.status,
    requested_at: data.requested_at,
    message:
      'Your deletion request has been received. We will process it within 30 days (GDPR SLA) and email confirmation at security@palvento.com when complete. You can continue using your account until then, or sign out now.',
  })
}
