import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'
import { logAdmin } from '../../../admin/_lib/audit'
import { requireAdmin } from './guard'

type Patch = Record<string, unknown>

// Shared PATCH handler factory used by partners / affiliates / demos /
// api-keys. Enforces the owner guard, validates allowed fields, writes an
// audit_log entry with before/after state, and returns the updated row.
export async function handlePatch(args: {
  logLabel: string                      // e.g. '[admin:partners]'
  resource: string                      // e.g. 'partner_applications'
  id: string
  body: Patch
  allowedFields: readonly string[]
  allowedStatuses?: readonly string[]   // if field includes 'status'
}) {
  const gate = await requireAdmin()
  if ('response' in gate) return gate.response
  const actor = gate.user

  // Build a clean patch of only allowed fields.
  const patch: Patch = {}
  for (const k of args.allowedFields) {
    if (k in args.body) patch[k] = args.body[k]
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }
  if (args.allowedStatuses && typeof patch.status === 'string' && !args.allowedStatuses.includes(patch.status)) {
    return NextResponse.json({ error: `Invalid status: ${patch.status}` }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: before, error: beforeErr } = await admin.from(args.resource).select('*').eq('id', args.id).maybeSingle()
  if (beforeErr) {
    console.error(args.logLabel, 'fetch before failed', beforeErr.message)
    return NextResponse.json({ error: beforeErr.message }, { status: 500 })
  }
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: after, error: updErr } = await admin
    .from(args.resource)
    .update(patch)
    .eq('id', args.id)
    .select('*')
    .maybeSingle()

  if (updErr) {
    console.error(args.logLabel, 'update failed', updErr.message)
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  // Only log the keys we changed, to keep audit metadata small.
  const beforeSlice: Patch = {}
  const afterSlice: Patch = {}
  for (const k of Object.keys(patch)) {
    beforeSlice[k] = (before as Patch)[k]
    afterSlice[k]  = (after  as Patch | null)?.[k]
  }

  await logAdmin(admin, {
    actorId: actor.id,
    actorEmail: actor.email,
    action: `admin.${args.resource}.update`,
    resource: args.resource,
    resourceId: args.id,
    before: beforeSlice,
    after: afterSlice,
  })

  console.log(args.logLabel, 'updated', args.id, 'by', actor.email)
  return NextResponse.json({ ok: true, row: after })
}
