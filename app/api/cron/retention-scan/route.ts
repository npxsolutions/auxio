/**
 * Legacy retention-scan cron endpoint.
 *
 * As of Phase 4 orchestrator adoption this is a thin shim — it emits a
 * `retention/scan.requested` Inngest event and returns immediately. The
 * actual fan-out + per-org work happens in app/lib/inngest/fn-retention-scan.ts.
 *
 * Kept around so:
 *   - the Vercel cron schedule can keep firing this URL without changes
 *   - manual smoke-tests of the daily scan still work via curl + CRON_SECRET
 *   - any external trigger that pings this URL still works
 *
 * Once Inngest's own cron schedule is the single source of truth, this
 * endpoint can be deleted and the Vercel cron entry removed.
 */

import { NextResponse } from 'next/server'
import { inngest } from '@/app/lib/inngest/client'

export const runtime = 'nodejs'
export const maxDuration = 30

function isAuthorized(req: Request): boolean {
  const header = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`
  return header === expected && expected !== 'Bearer '
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { ids } = await inngest.send({
    name: 'retention/scan.requested',
    data: { trigger: 'cron' },
  })

  return NextResponse.json({
    dispatched_at: new Date().toISOString(),
    inngest_event_ids: ids,
    note: 'Per-org work runs asynchronously via Inngest; check the Inngest dashboard for results.',
  })
}
