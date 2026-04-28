/**
 * Inngest client — single instance shared by every event producer + function.
 *
 * Required env vars:
 *   INNGEST_EVENT_KEY    — production event key, set in Vercel env. Local dev
 *                          uses the dev server (no key needed) when started
 *                          via `npx inngest-cli@latest dev`.
 *   INNGEST_SIGNING_KEY  — used by the serve route to verify Inngest webhooks.
 *                          Required in production.
 *
 * Inngest v4 doesn't accept a typed schemas option on the client, so event
 * shapes are codified by the EventName / EventDataMap types below. Producers
 * import them when calling inngest.send(); handlers cast event.data inside
 * the function. It's a thin discipline rather than enforced types — keep
 * EventDataMap in sync with what's actually emitted.
 */

import { Inngest } from 'inngest'

export type EventDataMap = {
  /** Emitted by the legacy /api/cron/retention-scan shim (and the Inngest cron). */
  'retention/scan.requested': {
    organization_id?: string
    trigger: 'cron' | 'manual' | 'backfill'
  }
  /** Per-org fan-out from retention/scan.requested. */
  'retention/org.scan': {
    organization_id: string
    trigger: 'cron' | 'manual' | 'backfill'
  }
  /** Triggers a marketplace_account_health refresh for one (org, channel). */
  'account-health/refresh.requested': {
    organization_id: string
    channel: string
  }
  /** Fired by the refresh function when the status changed since last check. */
  'account-health/status.changed': {
    organization_id: string
    channel: string
    previous_status: string | null
    current_status: string
    previous_score: number | null
    current_score: number
  }
  /** Triggers a per-channel finances/payout reconciliation for one org. */
  'finances/reconcile.requested': {
    organization_id: string
    channel: string
    /** How many days back to scan. Defaults to 30 in the handler. */
    window_days?: number
  }
}

export type EventName = keyof EventDataMap

export const inngest = new Inngest({ id: 'palvento' })
