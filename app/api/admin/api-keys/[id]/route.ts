import { NextResponse } from 'next/server'
import { handlePatch } from '../../_lib/update'

// API keys accept a flipped status string from the UI ("active"/"revoked")
// OR a raw boolean `active`. Normalise to `active: boolean` before PATCH.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const patch: Record<string, unknown> = {}
  if (typeof body.active === 'boolean') patch.active = body.active
  else if (body.status === 'active')   patch.active = true
  else if (body.status === 'revoked')  patch.active = false

  return handlePatch({
    logLabel: '[admin:api-keys]',
    resource: 'api_keys',
    id,
    body: patch,
    allowedFields: ['active'],
  })
}
