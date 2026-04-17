/**
 * [api/patterns] — Pattern library API.
 *
 * Analyzes top-performing listings (via feed_pattern_observations) to surface
 * best practices per category + channel. Returns evidence-backed recommendations
 * like "Top eBay Electronics sellers average 78-char titles (p75)".
 *
 * All data is pre-aggregated by /api/cron/feed-patterns (daily) and
 * anonymized at the source — no user IDs, listing IDs, or SKUs in response.
 *
 * Query params:
 *   ?channel=ebay                — filter to a single channel
 *   ?category=electronics        — filter to buckets containing this substring
 *   ?kind=title_length           — filter to a specific pattern kind
 */
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import {
  buildBestPractices,
  type PatternRow,
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
    // Auth — pattern library requires a logged-in user.
    const supabase = await getUserSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channelFilter = request.nextUrl.searchParams.get('channel')
    const categoryFilter = request.nextUrl.searchParams.get('category')
    const kindFilter = request.nextUrl.searchParams.get('kind')

    const admin = getAdmin()

    // Fetch recent pattern observations (trailing 30 days).
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    let query = admin
      .from('feed_pattern_observations')
      .select('channel, category_bucket, pattern_kind, pattern_value, sample_size, outcome_metric, outcome_value, computed_at')
      .gte('computed_at', thirtyDaysAgo)
      .order('computed_at', { ascending: false })

    if (channelFilter) query = query.eq('channel', channelFilter)
    if (categoryFilter) query = query.ilike('category_bucket', `%${categoryFilter}%`)
    if (kindFilter) query = query.eq('pattern_kind', kindFilter)

    const { data: patterns, error: patErr } = await query
    if (patErr) throw patErr

    const rows = (patterns ?? []) as PatternRow[]

    // Deduplicate by taking the most recent observation per (channel, bucket, kind, value).
    const seen = new Map<string, PatternRow>()
    for (const r of rows) {
      const key = `${r.channel}|${r.category_bucket}|${r.pattern_kind}|${r.pattern_value}`
      if (!seen.has(key)) seen.set(key, r) // Already ordered by computed_at desc
    }

    const bestPractices = buildBestPractices(Array.from(seen.values()))

    // Also return the raw (deduplicated) pattern data for UI drill-down.
    const rawPatterns = Array.from(seen.values()).map((r) => ({
      channel: r.channel,
      categoryBucket: r.category_bucket,
      patternKind: r.pattern_kind,
      patternValue: r.pattern_value,
      sampleSize: r.sample_size,
      outcomeMetric: r.outcome_metric,
      outcomeValue: r.outcome_value,
    }))

    return Response.json({
      bestPractices,
      patterns: rawPatterns,
      totalObservations: rows.length,
      uniquePatterns: seen.size,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/patterns]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
