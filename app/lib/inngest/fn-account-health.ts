/**
 * Inngest functions — marketplace account health.
 *
 *   accountHealthRefreshFn: pulls fresh account-health data for an
 *     (org, channel) and upserts it into marketplace_account_health.
 *     If the status downgraded, emits 'account-health/status.changed'
 *     so the notification path is decoupled from the ingestion path.
 *
 *   accountHealthStatusChangedFn: writes the notification when the
 *     status downgrade event fires. Idempotent via dedupe_key.
 */

import { inngest } from './client'
import type { EventDataMap } from './client'
import { getAdmin } from '../retention/scan'
import { fetchEbayAccountHealth } from '../channels/ebay/account-health'

type ChannelAdapter = (
  admin: ReturnType<typeof getAdmin>,
  organizationId: string,
) => Promise<{
  status: string
  score: number | null
  defects_count: number | null
  raw: Record<string, unknown>
}>

const ADAPTERS: Record<string, ChannelAdapter> = {
  ebay: fetchEbayAccountHealth,
}

export const accountHealthRefreshFn = inngest.createFunction(
  {
    id: 'account-health-refresh',
    triggers: [{ event: 'account-health/refresh.requested' }],
    concurrency: { limit: 10 },
    retries: 3,
  },
  async ({ event, step }) => {
    const data = event.data as EventDataMap['account-health/refresh.requested']
    const adapter = ADAPTERS[data.channel]
    if (!adapter) {
      return { skipped: true, reason: `no adapter for channel "${data.channel}"` }
    }

    const admin = getAdmin()

    const fresh = await step.run('fetch-channel', () => adapter(admin, data.organization_id))

    const upserted = await step.run('upsert-and-detect-change', async () => {
      const { data: prev } = await admin
        .from('marketplace_account_health')
        .select('status, score')
        .eq('organization_id', data.organization_id)
        .eq('channel', data.channel)
        .maybeSingle()

      const previous_status = (prev?.status as string | null) ?? null
      const previous_score  = (prev?.score  as number | null) ?? null
      const statusChanged   = previous_status !== null && previous_status !== fresh.status

      const { error } = await admin.from('marketplace_account_health').upsert(
        {
          organization_id: data.organization_id,
          channel:          data.channel,
          status:           fresh.status,
          score:            fresh.score,
          defects_count:    fresh.defects_count,
          raw:              fresh.raw,
          previous_status:  statusChanged ? previous_status : (prev?.status ?? null),
          previous_score:   statusChanged ? previous_score  : (prev?.score  ?? null),
          last_changed_at:  statusChanged ? new Date().toISOString() : null,
          last_checked_at:  new Date().toISOString(),
        },
        { onConflict: 'organization_id,channel' },
      )
      if (error) throw new Error(`upsert failed: ${error.message}`)

      return { previous_status, current_status: fresh.status, previous_score, current_score: fresh.score, statusChanged }
    })

    if (upserted.statusChanged) {
      await step.sendEvent('emit-status-changed', {
        name: 'account-health/status.changed',
        data: {
          organization_id: data.organization_id,
          channel:         data.channel,
          previous_status: upserted.previous_status,
          current_status:  upserted.current_status,
          previous_score:  upserted.previous_score,
          current_score:   upserted.current_score ?? 0,
        },
      })
    }

    return upserted
  },
)

export const accountHealthStatusChangedFn = inngest.createFunction(
  {
    id: 'account-health-status-changed',
    triggers: [{ event: 'account-health/status.changed' }],
  },
  async ({ event, step }) => {
    const data = event.data as EventDataMap['account-health/status.changed']
    const today = new Date().toISOString().slice(0, 10)

    return await step.run('write-notification', async () => {
      const admin = getAdmin()
      const isCritical = data.current_status === 'at_risk' || data.current_status === 'restricted'
      const { error } = await admin.from('notifications').insert({
        organization_id: data.organization_id,
        kind:        'account_health_drop',
        severity:    isCritical ? 'error' : 'warn',
        title:       `${data.channel} account-health dropped`,
        body:        `Status moved from ${data.previous_status ?? 'unknown'} to ${data.current_status}. Score ${data.current_score}. Review the channel dashboard before policy actions escalate.`,
        action_url:  `/integrations/${data.channel}`,
        data:        { channel: data.channel, previous_status: data.previous_status, current_status: data.current_status, score: data.current_score },
        dedupe_key:  `account_health:${data.channel}:${today}`,
      })
      if (error && (error as { code?: string }).code !== '23505') {
        throw new Error(`notification insert failed: ${error.message}`)
      }
      return { written: !error }
    })
  },
)
