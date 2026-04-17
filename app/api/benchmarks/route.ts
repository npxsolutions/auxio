/**
 * [api/benchmarks] — Multi-tenant feed benchmarking API.
 *
 * Returns anonymized aggregate health scores (percentiles) per
 * category + channel, plus "your score vs. category average" for the
 * authenticated user. Top error patterns are included per category.
 *
 * All data comes from feed_health_rollups (pre-computed by the
 * /api/cron/feed-benchmarks weekly cron) — no expensive real-time
 * aggregation. User comparison uses listing_health (RLS-scoped).
 *
 * Query params:
 *   ?channel=ebay            — filter to a single channel
 *   ?category=electronics    — filter to buckets containing this substring
 */
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import {
  aggregateRollups,
  countErrorPatterns,
  computeUserComparison,
  type RollupRow,
  type HealthRow,
  type BenchmarkResult,
  type UserComparison,
} from '@/app/lib/feed/benchmark-aggregation'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function getUserSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
}

export async function GET(request: NextRequest) {
  try {
    // Auth — benchmarks require a logged-in user.
    const supabase = await getUserSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channelFilter = request.nextUrl.searchParams.get('channel')
    const categoryFilter = request.nextUrl.searchParams.get('category')

    const admin = getAdmin()

    // Fetch the most recent 4 weeks of rollups (service role bypasses RLS).
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    let rollupQuery = admin
      .from('feed_health_rollups')
      .select('*')
      .gte('period_start', fourWeeksAgo)
      .order('period_start', { ascending: false })
    if (channelFilter) rollupQuery = rollupQuery.eq('channel', channelFilter)
    if (categoryFilter) rollupQuery = rollupQuery.ilike('category_bucket', `%${categoryFilter}%`)

    const { data: rollups, error: rollupErr } = await rollupQuery
    if (rollupErr) throw rollupErr

    const rows = (rollups ?? []) as RollupRow[]

    // Derive unique (channel, category_bucket) pairs.
    const pairs = new Set<string>()
    for (const r of rows) pairs.add(`${r.channel}||${r.category_bucket}`)

    const benchmarks: BenchmarkResult[] = []
    for (const pair of pairs) {
      const [ch, cat] = pair.split('||')
      const agg = aggregateRollups(rows, ch, cat)
      if (!agg) continue
      benchmarks.push({ ...agg, topErrorPatterns: [] })
    }

    // Fetch the user's own listing_health for comparison (RLS-scoped).
    const { data: userHealth, error: uhErr } = await supabase
      .from('listing_health')
      .select('health_score, channel, errors_count, warnings_count, issues')
    if (uhErr) throw uhErr

    const userRows = (userHealth ?? []) as HealthRow[]

    // Per-channel average for the user.
    const userAvgByChannel = new Map<string, number>()
    const userCountByChannel = new Map<string, number>()
    for (const r of userRows) {
      userAvgByChannel.set(r.channel, (userAvgByChannel.get(r.channel) ?? 0) + r.health_score)
      userCountByChannel.set(r.channel, (userCountByChannel.get(r.channel) ?? 0) + 1)
    }

    const comparisons: UserComparison[] = []
    for (const b of benchmarks) {
      const sum = userAvgByChannel.get(b.channel)
      const count = userCountByChannel.get(b.channel)
      if (sum == null || count == null || count === 0) continue
      const avg = Math.round((sum / count) * 100) / 100
      comparisons.push(computeUserComparison(avg, b))
    }

    // Top error patterns across the user's own data (not cross-tenant).
    const errorPatterns = countErrorPatterns(userRows)

    // Attach top error patterns to benchmarks from user data (anonymized; only user's own issues shown).
    for (const b of benchmarks) {
      const channelRows = userRows.filter((r) => r.channel === b.channel)
      b.topErrorPatterns = countErrorPatterns(channelRows)
    }

    return Response.json({
      benchmarks: benchmarks.sort((a, b) => b.totalListings - a.totalListings),
      comparisons,
      topErrorPatterns: errorPatterns,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/benchmarks]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
