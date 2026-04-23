/**
 * Daily RLS leak scanner.
 *
 * Calls `mt_scan_table_for_leaks` for every scoped table and returns the count
 * of open audit rows. Sentry alerts fire automatically on unhandled throw; we
 * additionally 500 the response when any leaks are detected so Vercel cron
 * shows the failure in its dashboard.
 *
 * Wired to: `/api/cron/rls-leak-scan`, scheduled at 04:30 UTC daily.
 *
 * Gate for Phase 1 Stage D: zero open rows for 7 consecutive days.
 */

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/app/lib/supabase-admin'

const SCOPED_TABLES = [
  // Stage A
  'public.user_profiles',
  'public.email_sends',
  'public.deletion_requests',
  'public.referral_codes',
  'public.referrals',
  'public.user_credits',
  'public.nps_responses',
  'public.cancel_surveys',
  'public.feedback_page',
  'public.listing_health',
  'public.listings',
  'public.listing_channel_groups',
  'public.listing_channel_aspects',
  'public.listing_channels',
  'public.channels',
  'public.transactions',
  'public.agent_pending_actions',
  'public.sync_failures',
  'public.sync_jobs',
  'public.feed_rules',
  'public.usage_reports',
  'public.supplier',
  'public.metrics_daily',
  'public.si_posts',
  'public.si_engagements',
  'public.si_ads',
  'public.si_comments',
  'public.si_hook_patterns',
  'public.si_insights',
  'public.si_jobs',
  'public.si_watchlist',
  // Stage A.1
  'public.inventory',
  'public.bundles',
  'public.bundle_items',
  'public.category_mappings',
  'public.channel_sync_state',
  'public.sync_log',
  'public.listing_versions',
  'public.feed_health',
  'public.field_mappings',
  'public.ad_campaigns',
  'public.repricing_rules',
  'public.purchase_orders',
  'public.purchase_order_items',
  'public.suppliers',
  'public.lookup_tables',
  'public.lookup_table_rows',
  'public.api_keys',
  'public.webhooks',
  'public.enrichment_usage',
  'public.agent_action_log',
  'public.ai_insights',
  'public.ai_conversations',
  'public.product_intelligence',
  'public.ppc_keyword_performance',
  'public.orders',
] as const

// Cron auth — Vercel sends Authorization: Bearer $CRON_SECRET.
function isAuthorized(req: Request): boolean {
  const header = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`
  return header === expected && expected !== 'Bearer '
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const started = Date.now()
  const results: Array<{ table: string; leaks_recorded: number; error?: string }> = []

  for (const tbl of SCOPED_TABLES) {
    try {
      const { data, error } = await admin.rpc('mt_scan_table_for_leaks', { tbl })
      if (error) {
        results.push({ table: tbl, leaks_recorded: 0, error: error.message })
      } else {
        results.push({ table: tbl, leaks_recorded: Number(data) ?? 0 })
      }
    } catch (err: unknown) {
      results.push({
        table: tbl,
        leaks_recorded: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // Total open audit rows (across all issue types), regardless of what this run
  // recorded. Stage D gate condition.
  const { count: openCount } = await admin
    .from('rls_migration_audit')
    .select('*', { count: 'exact', head: true })
    .is('resolved_at', null)

  const totalThisRun = results.reduce((n, r) => n + r.leaks_recorded, 0)
  const errors = results.filter((r) => r.error)
  const durationMs = Date.now() - started

  const body = {
    scan_completed_at: new Date().toISOString(),
    duration_ms: durationMs,
    tables_scanned: results.length,
    leaks_recorded_this_run: totalThisRun,
    open_leak_rows_total: openCount ?? 0,
    errors: errors.length ? errors : undefined,
  }

  // Alert — only when we have something to report.
  if ((openCount ?? 0) > 0 || errors.length > 0) {
    await fanOutAlert({ body, perTable: results }).catch((err) => {
      console.error('[cron:rls-leak-scan] alert dispatch failed:', err)
    })
  }

  // Return non-200 when any leaks are open so the cron dashboard surfaces it.
  const status = (openCount ?? 0) > 0 || errors.length > 0 ? 500 : 200
  return NextResponse.json(body, { status })
}

type ScanResult = Array<{ table: string; leaks_recorded: number; error?: string }>

/**
 * Fan out the alert to whichever channels are configured.
 *
 * - RLS_ALERT_SLACK_WEBHOOK_URL: Slack incoming webhook — a structured message.
 * - RLS_ALERT_EMAIL (with RESEND_API_KEY): plain-text email.
 *
 * Either or both can be configured. Missing config is a silent no-op so the
 * cron still returns normally in dev.
 */
async function fanOutAlert(opts: { body: Record<string, unknown>; perTable: ScanResult }) {
  const slackUrl = process.env.RLS_ALERT_SLACK_WEBHOOK_URL
  const alertEmail = process.env.RLS_ALERT_EMAIL
  const resendKey = process.env.RESEND_API_KEY

  const headline = `RLS leak scan — ${opts.body.open_leak_rows_total} open audit rows`
  const nonZeroTables = opts.perTable.filter((r) => r.leaks_recorded > 0)
  const erroredTables = opts.perTable.filter((r) => r.error)

  const plainText = [
    headline,
    '',
    `Leaks recorded this run: ${opts.body.leaks_recorded_this_run}`,
    `Open audit rows: ${opts.body.open_leak_rows_total}`,
    '',
    nonZeroTables.length
      ? 'Tables with new leaks:\n' + nonZeroTables.map((r) => `  - ${r.table}: ${r.leaks_recorded}`).join('\n')
      : 'No NEW leaks this run.',
    '',
    erroredTables.length
      ? 'Scan errors:\n' + erroredTables.map((r) => `  - ${r.table}: ${r.error}`).join('\n')
      : '',
    '',
    'Dashboard query:',
    "  SELECT table_name, count(*) FROM rls_migration_audit WHERE resolved_at IS NULL GROUP BY 1;",
  ]
    .filter(Boolean)
    .join('\n')

  await Promise.all([
    slackUrl
      ? fetch(slackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: headline,
            blocks: [
              { type: 'header', text: { type: 'plain_text', text: '🔒 RLS leak scan' } },
              { type: 'section', text: { type: 'mrkdwn', text: `*${headline}*` } },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*New this run:*\n${opts.body.leaks_recorded_this_run}` },
                  { type: 'mrkdwn', text: `*Open total:*\n${opts.body.open_leak_rows_total}` },
                ],
              },
              ...(nonZeroTables.length
                ? [{
                    type: 'section' as const,
                    text: {
                      type: 'mrkdwn' as const,
                      text: '*Tables with new leaks:*\n' +
                        nonZeroTables.map((r) => `• \`${r.table}\` — ${r.leaks_recorded}`).join('\n'),
                    },
                  }]
                : []),
              ...(erroredTables.length
                ? [{
                    type: 'section' as const,
                    text: {
                      type: 'mrkdwn' as const,
                      text: '*Scan errors:*\n' +
                        erroredTables.map((r) => `• \`${r.table}\` — ${r.error}`).join('\n'),
                    },
                  }]
                : []),
            ],
          }),
        }).then((r) => {
          if (!r.ok) console.error('[rls-leak-scan] slack alert non-200:', r.status)
        })
      : null,
    alertEmail && resendKey
      ? new Resend(resendKey).emails.send({
          from: 'Palvento Security <security@palvento.com>',
          to: alertEmail,
          subject: headline,
          text: plainText,
        }).then((r) => {
          if ((r as any)?.error) console.error('[rls-leak-scan] resend error:', (r as any).error)
        })
      : null,
  ])
}
