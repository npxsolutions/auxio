import { NextResponse } from 'next/server'
import { handlePatch } from '../../_lib/update'
import { STATUSES } from '../../../../admin/_lib/theme'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  return handlePatch({
    logLabel: '[admin:enterprise]',
    resource: 'enterprise_quotes',
    id,
    body,
    allowedFields: ['status', 'admin_notes'],
    allowedStatuses: STATUSES.enterprise,
  })
}
