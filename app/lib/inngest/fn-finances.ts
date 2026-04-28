/**
 * Inngest functions — payout-reconciled fee ingestion (the wedge).
 *
 *   financesScheduleFn:  daily 04:30 UTC. Fans out one
 *     finances/reconcile.requested event per (org, channel-with-adapter)
 *     so each org reconciles in parallel with its own retry budget.
 *
 *   financesReconcileFn: handles a single (org, channel). Calls the
 *     channel-specific fetcher, replaces channel_fee estimates with real
 *     reconciled fees on transactions, upserts payouts.
 *
 * Currently only eBay has a finances adapter. Other marketplaces follow
 * the same shape — add to ADAPTERS to enable.
 */

import { inngest } from './client'
import type { EventDataMap } from './client'
import { getAdmin } from '../retention/scan'
import { fetchEbayFinances, reconcileEbayFees, upsertEbayPayouts } from '../channels/ebay/finances'
import type { SupabaseClient } from '@supabase/supabase-js'

type FinancesAdapter = (
  admin: SupabaseClient,
  organizationId: string,
) => Promise<{ reconciled: number; payouts: number; status: 'ok' | 'needs_reauth' | 'not_connected' | 'unknown' }>

const adaptEbay: FinancesAdapter = async (admin, organizationId) => {
  const result = await fetchEbayFinances(admin, organizationId, 30)
  if (!result.ok) {
    return { reconciled: 0, payouts: 0, status: result.reason }
  }
  const { reconciled } = await reconcileEbayFees(admin, organizationId, result.transactions)
  const payouts = await upsertEbayPayouts(admin, organizationId, result.payouts)
  return { reconciled, payouts, status: 'ok' }
}

const ADAPTERS: Record<string, FinancesAdapter> = {
  ebay: adaptEbay,
}

const SUPPORTED_CHANNELS = Object.keys(ADAPTERS)

/**
 * Daily 04:30 UTC: enumerate every (org, channel) with an active connection
 * and a finances adapter. Runs ahead of the 06:00 account-health and 09:00
 * retention scan so reconciled data is fresh by the time those run.
 */
export const financesScheduleFn = inngest.createFunction(
  {
    id: 'finances-schedule',
    triggers: [{ cron: '30 4 * * *' }],
  },
  async ({ step }) => {
    const admin = getAdmin()

    const pairs = await step.run('list-active-finances-channels', async () => {
      const { data, error } = await admin
        .from('channels')
        .select('organization_id, type')
        .eq('active', true)
        .in('type', SUPPORTED_CHANNELS)
        .not('organization_id', 'is', null)
      if (error) throw new Error(`list-finances failed: ${error.message}`)
      return (data ?? []).map((r: { organization_id: string; type: string }) => ({
        organization_id: r.organization_id,
        channel:         r.type,
      }))
    })

    if (pairs.length === 0) return { dispatched: 0 }

    await step.sendEvent(
      'fan-out-finances-reconcile',
      pairs.map((p) => ({
        name: 'finances/reconcile.requested',
        data: p,
      })),
    )
    return { dispatched: pairs.length }
  },
)

export const financesReconcileFn = inngest.createFunction(
  {
    id: 'finances-reconcile',
    triggers: [{ event: 'finances/reconcile.requested' }],
    concurrency: { limit: 10 },
    retries: 3,
    // Skip duplicate events for the same (org, channel) within a 6-hour
    // window — the daily cron + any manual triggers shouldn't double-pull.
    idempotency: 'event.data.organization_id + "-" + event.data.channel',
  },
  async ({ event, step }) => {
    const data = event.data as EventDataMap['finances/reconcile.requested']
    const adapter = ADAPTERS[data.channel]
    if (!adapter) {
      return { skipped: true, reason: `no finances adapter for "${data.channel}"` }
    }

    const admin = getAdmin()
    return await step.run('reconcile', () => adapter(admin, data.organization_id))
  },
)
