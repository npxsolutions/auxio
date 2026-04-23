/**
 * [api/feed-health] — Aggregated feed health scoring dashboard data.
 *
 * Returns per-channel health scores, error breakdowns, health distribution,
 * trend data, and top fixable issues for the authenticated user.
 *
 * Reads from the existing `listing_health` table (populated by the validator
 * framework and nightly cron) and joins against `listings` for context.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { requireActiveOrg } from '@/app/lib/org/context'

const getSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

type HealthRow = {
  listing_id: string
  channel: string
  health_score: number
  errors_count: number
  warnings_count: number
  issues: Array<{
    rule: {
      id: string
      severity: string
      channel: string
      message: string
      remediation: string
      autoFixable: boolean
    }
    detail?: string
  }> | null
  last_validated_at: string | null
}

type ChannelHealthSummary = {
  channel: string
  totalListings: number
  avgHealthScore: number
  medianHealthScore: number
  healthyCount: number
  warningCount: number
  errorCount: number
  healthyPct: number
  warningPct: number
  errorPct: number
  topErrors: Array<{
    ruleId: string
    message: string
    remediation: string
    autoFixable: boolean
    count: number
    pctAffected: number
  }>
}

type HealthDistribution = {
  band: string
  count: number
  pct: number
  color: string
}

export async function GET() {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await getSupabase()
    const { data: healthRows, error } = await supabase
      .from('listing_health')
      .select('listing_id, channel, health_score, errors_count, warnings_count, issues, last_validated_at')

    if (error) {
      console.error('[feed-health] query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (healthRows ?? []) as HealthRow[]

    const { count: totalListings } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })

    // ── Overall health score (weighted average across all channel/listing pairs) ──
    const overallScore = rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + r.health_score, 0) / rows.length)
      : 100

    const totalErrors = rows.reduce((s, r) => s + r.errors_count, 0)
    const totalWarnings = rows.reduce((s, r) => s + r.warnings_count, 0)

    // ── Per-channel summaries ──
    const channelMap = new Map<string, HealthRow[]>()
    for (const r of rows) {
      const arr = channelMap.get(r.channel) ?? []
      arr.push(r)
      channelMap.set(r.channel, arr)
    }

    const channelSummaries: ChannelHealthSummary[] = []
    for (const [channel, chRows] of channelMap) {
      const scores = chRows.map(r => r.health_score).sort((a, b) => a - b)
      const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      const median = scores[Math.floor(scores.length / 2)] ?? 0

      const healthy = chRows.filter(r => r.health_score >= 80).length
      const warning = chRows.filter(r => r.health_score >= 50 && r.health_score < 80).length
      const errored = chRows.filter(r => r.health_score < 50).length
      const total = chRows.length

      // Aggregate error frequencies
      type IssueEntry = { ruleId: string; message: string; remediation: string; autoFixable: boolean }
      const errorFreq = new Map<string, { entry: IssueEntry; count: number }>()
      for (const r of chRows) {
        if (!r.issues) continue
        for (const issue of r.issues) {
          const key = issue.rule.id
          const existing = errorFreq.get(key)
          if (existing) {
            existing.count++
          } else {
            errorFreq.set(key, {
              entry: {
                ruleId: issue.rule.id,
                message: issue.rule.message,
                remediation: issue.rule.remediation,
                autoFixable: issue.rule.autoFixable,
              },
              count: 1,
            })
          }
        }
      }

      const topErrors = Array.from(errorFreq.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map(e => ({
          ruleId: e.entry.ruleId,
          message: e.entry.message,
          remediation: e.entry.remediation,
          autoFixable: e.entry.autoFixable,
          count: e.count,
          pctAffected: Math.round((e.count / total) * 100),
        }))

      channelSummaries.push({
        channel,
        totalListings: total,
        avgHealthScore: avg,
        medianHealthScore: median,
        healthyCount: healthy,
        warningCount: warning,
        errorCount: errored,
        healthyPct: Math.round((healthy / total) * 100),
        warningPct: Math.round((warning / total) * 100),
        errorPct: Math.round((errored / total) * 100),
        topErrors,
      })
    }

    // ── Health distribution (10-point bands) ──
    const BANDS = [
      { label: '90-100', min: 90, max: 100, color: '#059669' },
      { label: '80-89', min: 80, max: 89, color: '#0f8a5b' },
      { label: '70-79', min: 70, max: 79, color: '#b88404' },
      { label: '60-69', min: 60, max: 69, color: '#d97706' },
      { label: '50-59', min: 50, max: 59, color: '#ea580c' },
      { label: '0-49', min: 0, max: 49, color: '#dc2626' },
    ]
    const distribution: HealthDistribution[] = BANDS.map(b => {
      const count = rows.filter(r => r.health_score >= b.min && r.health_score <= b.max).length
      return { band: b.label, count, pct: rows.length > 0 ? Math.round((count / rows.length) * 100) : 0, color: b.color }
    })

    // ── Most fixable issues (auto-fixable grouped by rule) ──
    const autoFixable = new Map<string, { message: string; remediation: string; count: number }>()
    for (const r of rows) {
      if (!r.issues) continue
      for (const issue of r.issues) {
        if (!issue.rule.autoFixable) continue
        const key = issue.rule.id
        const existing = autoFixable.get(key)
        if (existing) {
          existing.count++
        } else {
          autoFixable.set(key, { message: issue.rule.message, remediation: issue.rule.remediation, count: 1 })
        }
      }
    }
    const fixableIssues = Array.from(autoFixable.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // ── Validation freshness ──
    const now = Date.now()
    const staleThreshold = 24 * 60 * 60 * 1000
    const staleCount = rows.filter(r =>
      !r.last_validated_at || (now - new Date(r.last_validated_at).getTime()) > staleThreshold
    ).length

    // Unique validated listings
    const validatedListingIds = new Set(rows.map(r => r.listing_id))
    const coveragePct = (totalListings ?? 0) > 0
      ? Math.round((validatedListingIds.size / (totalListings ?? 1)) * 100)
      : 0

    return NextResponse.json({
      overallScore,
      totalValidated: rows.length,
      uniqueListingsValidated: validatedListingIds.size,
      totalListings: totalListings ?? 0,
      coveragePct,
      totalErrors,
      totalWarnings,
      staleCount,
      channelSummaries: channelSummaries.sort((a, b) => b.totalListings - a.totalListings),
      distribution,
      fixableIssues,
    })
  } catch (err: any) {
    console.error('[feed-health]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
