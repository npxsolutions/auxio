/**
 * Inngest functions — retention scan (Phase 4 orchestrator migration).
 *
 *   retentionScanCronFn: scheduled daily at 09:00 UTC. Fans out one
 *     'retention/org.scan' event per org so each org runs in parallel
 *     with its own retry budget.
 *
 *   retentionScanOrgFn: handles a single org. Calls scanOrgRetention()
 *     from app/lib/retention/scan — same logic the legacy cron route used,
 *     so behaviour is identical during the cutover.
 */

import { inngest } from './client'
import type { EventDataMap } from './client'
import { getAdmin, scanOrgRetention } from '../retention/scan'

export const retentionScanCronFn = inngest.createFunction(
  {
    id: 'retention-scan-cron',
    triggers: [
      { cron: '0 9 * * *' },
      { event: 'retention/scan.requested' },
    ],
  },
  async ({ event, step }) => {
    const admin = getAdmin()
    const data = (event?.data ?? {}) as Partial<EventDataMap['retention/scan.requested']>

    const orgs = await step.run('list-orgs', async () => {
      const q = admin.from('organizations').select('id')
      const { data: rows, error } = data.organization_id
        ? await q.eq('id', data.organization_id)
        : await q
      if (error) throw new Error(`list-orgs failed: ${error.message}`)
      return (rows ?? []).map((o: { id: string }) => o.id)
    })

    await step.sendEvent(
      'fan-out-org-scans',
      orgs.map((organization_id) => ({
        name: 'retention/org.scan',
        data: { organization_id, trigger: data.trigger ?? 'cron' },
      })),
    )

    return { orgs_dispatched: orgs.length }
  },
)

export const retentionScanOrgFn = inngest.createFunction(
  {
    id: 'retention-scan-org',
    triggers: [{ event: 'retention/org.scan' }],
    // Cap concurrent per-org scans so a fan-out doesn't melt Supabase.
    // 5 matches Inngest free-tier plan limit. Bump when upgrading plan.
    concurrency: { limit: 5 },
    // One scan per org per day is enough — retries within the same hour
    // dedupe at the notification level via dedupe_key, but skip duplicate
    // events early to save the round-trips.
    idempotency: 'event.data.organization_id',
  },
  async ({ event, step }) => {
    const data = event.data as EventDataMap['retention/org.scan']
    const admin = getAdmin()
    return await step.run('scan-org', () => scanOrgRetention(admin, data.organization_id))
  },
)
