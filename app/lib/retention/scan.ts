/**
 * Per-org retention scan logic — extracted from the cron route so both the
 * legacy /api/cron/retention-scan endpoint and the Inngest event handler
 * can share one implementation.
 *
 * Idempotent: writes are deduped by `dedupe_key` (unique partial index on
 * notifications). Re-running within the same day is a no-op.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type ScanStats = { org_id: string; stockout: number; rejection: number; account_health: number }

export const getAdmin = (): SupabaseClient =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

export async function scanOrgRetention(admin: SupabaseClient, orgId: string): Promise<ScanStats> {
  const today = new Date().toISOString().slice(0, 10)
  let stockout = 0
  let rejection = 0
  let account_health = 0

  // ── 1. Stockout risk — days_of_cover <= 7 ────────────────────────────────
  const { data: atRisk } = await admin
    .from('channel_listings')
    .select('id, title, sku, quantity, days_of_cover')
    .eq('organization_id', orgId)
    .not('days_of_cover', 'is', null)
    .lte('days_of_cover', 7)
    .order('days_of_cover', { ascending: true })
    .limit(100)

  for (const l of atRisk ?? []) {
    const cover = l.days_of_cover as number
    const { error } = await admin.from('notifications').insert({
      organization_id: orgId,
      kind:            'stockout_risk',
      severity:        cover <= 2 ? 'error' : 'warn',
      title:           `Low stock: ${l.title ?? l.sku ?? 'untitled'}`,
      body:            `${l.quantity ?? 0} units left — ${cover} day${cover === 1 ? '' : 's'} of cover at current sell-through. Raise a PO or pause ads.`,
      action_url:      `/listings/${l.id}`,
      data:            { listing_id: l.id, sku: l.sku, quantity: l.quantity, days_of_cover: cover },
      dedupe_key:      `stockout:${l.id}:${today}`,
    })
    if (!error) stockout++
    else if ((error as any).code !== '23505') {
      console.error('[retention-scan] stockout insert failed:', error.message)
    }
  }

  // ── 2. Feed rejection — listing_health.errors_count > 0 ──────────────────
  const { data: rejected } = await admin
    .from('listing_health')
    .select('listing_id, channel, errors_count')
    .eq('organization_id', orgId)
    .gt('errors_count', 0)
    .limit(200)

  for (const h of rejected ?? []) {
    const { error } = await admin.from('notifications').insert({
      organization_id: orgId,
      kind:            'feed_rejection',
      severity:        'error',
      title:           `Feed errors on ${h.channel}`,
      body:            `${h.errors_count} error${h.errors_count === 1 ? '' : 's'} blocking publish. Check the listing health panel.`,
      action_url:      `/listings/${h.listing_id}?channel=${h.channel}`,
      data:            { listing_id: h.listing_id, channel: h.channel, errors_count: h.errors_count },
      dedupe_key:      `feed_rejection:${h.listing_id}:${h.channel}:${today}`,
    })
    if (!error) rejection++
    else if ((error as any).code !== '23505') {
      console.error('[retention-scan] feed_rejection insert failed:', error.message)
    }
  }

  // ── 3. Account-health drops — current vs. previous status differs ────────
  // Scans rows where the current status is worse than the previously notified
  // one. Written via account-health/status.changed events for cross-channel
  // visibility, but a fallback inline scan keeps the daily report complete
  // even if event delivery lagged.
  const { data: ahRows } = await admin
    .from('marketplace_account_health')
    .select('channel, status, score, previous_status, previous_score, last_changed_at')
    .eq('organization_id', orgId)
    .not('previous_status', 'is', null)
    .neq('status', 'previous_status')

  for (const ah of ahRows ?? []) {
    if (statusRank(ah.status) >= statusRank(ah.previous_status)) continue
    const { error } = await admin.from('notifications').insert({
      organization_id: orgId,
      kind:            'account_health_drop',
      severity:        ah.status === 'at_risk' || ah.status === 'restricted' ? 'error' : 'warn',
      title:           `${ah.channel} account-health dropped`,
      body:            `Status moved from ${ah.previous_status} to ${ah.status}. Open the channel dashboard before policy actions escalate.`,
      action_url:      `/integrations/${ah.channel}`,
      data:            { channel: ah.channel, previous_status: ah.previous_status, current_status: ah.status, score: ah.score },
      dedupe_key:      `account_health:${ah.channel}:${today}`,
    })
    if (!error) account_health++
    else if ((error as any).code !== '23505') {
      console.error('[retention-scan] account_health insert failed:', error.message)
    }
  }

  return { org_id: orgId, stockout, rejection, account_health }
}

/**
 * Lower rank = worse. Used to detect status downgrades regardless of channel.
 * Unknown statuses score in the middle so they don't trigger spurious alerts.
 */
function statusRank(status: string | null | undefined): number {
  switch (status) {
    case 'top_rated':       return 4
    case 'above_standard':  return 3
    case 'good':            return 3
    case 'standard':        return 2
    case 'below_standard':  return 1
    case 'at_risk':         return 0
    case 'restricted':      return 0
    default:                return 2
  }
}
