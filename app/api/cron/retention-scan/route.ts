/**
 * Daily retention scan (Phase 4).
 *
 * Iterates per-org and writes `notifications` rows for:
 *   1. stockout_risk   — listings with days_of_cover <= 7 (per v2 plan)
 *   2. feed_rejection  — listings with health.errors_count > 0
 *
 * days_of_cover is materialised nightly by aggregate_listings_v2() from
 * sold_30d ÷ 30 days. NULL means no recent sales, so no stockout risk.
 *
 * Idempotent via dedupe_key — re-running the cron within the same day is a
 * no-op (unique partial index on notifications).
 *
 * Cron auth — Vercel sends Authorization: Bearer $CRON_SECRET.
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

function isAuthorized(req: Request): boolean {
  const header = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`
  return header === expected && expected !== 'Bearer '
}

type ScanStats = { stockout: number; rejection: number; org_id: string }

async function scanOrg(admin: ReturnType<typeof getAdmin>, orgId: string): Promise<ScanStats> {
  const today = new Date().toISOString().slice(0, 10) // dedupe by day

  // ── 1. Stockout risk ────────────────────────────────────────────────────────
  // days_of_cover <= 7 means this SKU runs out within a week at current sales rate.
  // Plan reference: v2-phased-plan.md → Phase 4 → "Stock-out risk (7 days of cover remaining)".
  const { data: atRisk } = await admin
    .from('channel_listings')
    .select('id, title, sku, quantity, days_of_cover')
    .eq('organization_id', orgId)
    .not('days_of_cover', 'is', null)
    .lte('days_of_cover', 7)
    .order('days_of_cover', { ascending: true })
    .limit(100)

  let stockout = 0
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

  // ── 2. Feed rejection ──────────────────────────────────────────────────────
  const { data: rejected } = await admin
    .from('listing_health')
    .select('listing_id, channel, errors_count')
    .eq('organization_id', orgId)
    .gt('errors_count', 0)
    .limit(200)

  let rejection = 0
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

  return { org_id: orgId, stockout, rejection }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdmin()
  const started = Date.now()

  const { data: orgs, error } = await admin.from('organizations').select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results: ScanStats[] = []
  for (const o of orgs ?? []) {
    try {
      const stats = await scanOrg(admin, o.id as string)
      results.push(stats)
    } catch (err: any) {
      console.error('[retention-scan] org scan failed:', o.id, err.message)
    }
  }

  const total = results.reduce((a, r) => ({ stockout: a.stockout + r.stockout, rejection: a.rejection + r.rejection }), { stockout: 0, rejection: 0 })

  return NextResponse.json({
    scan_completed_at: new Date().toISOString(),
    duration_ms: Date.now() - started,
    orgs_scanned: results.length,
    notifications_written: total.stockout + total.rejection,
    by_kind: total,
  })
}
