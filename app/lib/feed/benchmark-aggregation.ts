/**
 * Pure benchmark aggregation helpers.
 *
 * All functions here are side-effect free so they can be unit tested without
 * touching Supabase. The API routes compose these with DB calls.
 */

// ── Types ──

export interface RollupRow {
  channel: string
  category_bucket: string
  gmv_band: string
  avg_health_score: number | null
  avg_errors_per_listing: number | null
  avg_warnings_per_listing: number | null
  pct_with_images: number | null
  pct_with_gtin: number | null
  pct_with_brand: number | null
  listings_total: number
  sample_size: number
}

export interface HealthRow {
  health_score: number
  channel: string
  errors_count: number
  warnings_count: number
  issues: Array<{ rule: { id: string; message: string; severity: string } }> | null
}

export interface PatternRow {
  channel: string
  category_bucket: string
  pattern_kind: string
  pattern_value: string
  sample_size: number
  outcome_metric: string
  outcome_value: number | null
}

export interface PercentileScores {
  p25: number
  p50: number
  p75: number
  p90: number
}

export interface BenchmarkResult {
  channel: string
  categoryBucket: string
  percentiles: PercentileScores
  avgHealthScore: number
  avgErrorsPerListing: number
  totalListings: number
  sampleMerchants: number
  topErrorPatterns: Array<{ ruleId: string; message: string; count: number; pctAffected: number }>
}

export interface UserComparison {
  channel: string
  categoryBucket: string
  yourScore: number
  categoryAvg: number
  delta: number
  percentileRank: string
}

export interface BestPractice {
  channel: string
  categoryBucket: string
  patternKind: string
  recommendation: string
  evidence: string
  sampleSize: number
  outcomeValue: number | null
}

// ── Pure functions ──

/** Compute percentile from a sorted array of numbers. */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  return Math.round(sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower))
}

/** Compute p25/p50/p75/p90 from an unsorted array of scores. */
export function computePercentiles(scores: number[]): PercentileScores {
  const sorted = [...scores].sort((a, b) => a - b)
  return {
    p25: percentile(sorted, 25),
    p50: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p90: percentile(sorted, 90),
  }
}

/** Aggregate rollup rows (same channel+category across GMV bands) into a benchmark. */
export function aggregateRollups(
  rows: RollupRow[],
  channel: string,
  categoryBucket: string,
): Omit<BenchmarkResult, 'topErrorPatterns'> | null {
  const filtered = rows.filter(
    (r) => r.channel === channel && r.category_bucket === categoryBucket,
  )
  if (filtered.length === 0) return null

  let totalListings = 0
  let totalSample = 0
  let healthWeightedSum = 0
  let errWeightedSum = 0
  let healthWeightedCount = 0

  for (const r of filtered) {
    totalListings += r.listings_total
    totalSample += r.sample_size
    if (r.avg_health_score != null) {
      healthWeightedSum += r.avg_health_score * r.listings_total
      healthWeightedCount += r.listings_total
    }
    if (r.avg_errors_per_listing != null) {
      errWeightedSum += r.avg_errors_per_listing * r.listings_total
    }
  }

  const avgHealth = healthWeightedCount > 0
    ? Math.round((healthWeightedSum / healthWeightedCount) * 100) / 100
    : 0
  const avgErr = healthWeightedCount > 0
    ? Math.round((errWeightedSum / healthWeightedCount) * 100) / 100
    : 0

  // Build synthetic score distribution from the averages per gmv_band.
  // Each rollup row's avg_health_score stands in for "the score of that band".
  const bandScores = filtered
    .filter((r) => r.avg_health_score != null)
    .map((r) => Math.round(r.avg_health_score!))

  return {
    channel,
    categoryBucket,
    percentiles: computePercentiles(bandScores),
    avgHealthScore: avgHealth,
    avgErrorsPerListing: avgErr,
    totalListings,
    sampleMerchants: totalSample,
  }
}

/** Count error rule frequencies from health rows. */
export function countErrorPatterns(
  rows: HealthRow[],
): Array<{ ruleId: string; message: string; count: number; pctAffected: number }> {
  const freq = new Map<string, { message: string; count: number }>()
  const total = rows.length

  for (const r of rows) {
    if (!r.issues) continue
    for (const issue of r.issues) {
      if (issue.rule.severity !== 'error') continue
      const existing = freq.get(issue.rule.id)
      if (existing) {
        existing.count++
      } else {
        freq.set(issue.rule.id, { message: issue.rule.message, count: 1 })
      }
    }
  }

  return Array.from(freq.entries())
    .map(([ruleId, { message, count }]) => ({
      ruleId,
      message,
      count,
      pctAffected: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

/** Determine which percentile band a user's score falls into. */
export function percentileRank(score: number, percentiles: PercentileScores): string {
  if (score >= percentiles.p90) return 'top 10%'
  if (score >= percentiles.p75) return 'top 25%'
  if (score >= percentiles.p50) return 'above median'
  if (score >= percentiles.p25) return 'below median'
  return 'bottom 25%'
}

/** Compute user comparison for a channel/category. */
export function computeUserComparison(
  userAvgScore: number,
  benchmark: Omit<BenchmarkResult, 'topErrorPatterns'>,
): UserComparison {
  return {
    channel: benchmark.channel,
    categoryBucket: benchmark.categoryBucket,
    yourScore: userAvgScore,
    categoryAvg: benchmark.avgHealthScore,
    delta: Math.round((userAvgScore - benchmark.avgHealthScore) * 100) / 100,
    percentileRank: percentileRank(userAvgScore, benchmark.percentiles),
  }
}

// ── Pattern library helpers ──

const PATTERN_LABELS: Record<string, string> = {
  title_length: 'title length',
  image_count: 'image count',
  bullet_count: 'bullet points',
  aspect_completeness: 'aspect completeness',
  gtin_presence: 'GTIN fill rate',
  brand_presence: 'brand fill rate',
  price_position: 'price position',
}

const CHANNEL_LABELS: Record<string, string> = {
  ebay: 'eBay',
  amazon: 'Amazon',
  etsy: 'Etsy',
  tiktok: 'TikTok Shop',
  walmart: 'Walmart',
  shopify: 'Shopify',
}

/** Turn raw pattern observations into best-practice recommendations. */
export function buildBestPractices(patterns: PatternRow[]): BestPractice[] {
  // Group by (channel, category_bucket, pattern_kind) and pick the bin with the best outcome.
  const groups = new Map<string, PatternRow[]>()
  for (const p of patterns) {
    const key = `${p.channel}|${p.category_bucket}|${p.pattern_kind}`
    const arr = groups.get(key) ?? []
    arr.push(p)
    groups.set(key, arr)
  }

  const practices: BestPractice[] = []
  for (const [, group] of groups) {
    // Sort by outcome_value descending; the top bin is the "best practice".
    const sorted = [...group]
      .filter((r) => r.outcome_value != null)
      .sort((a, b) => (b.outcome_value ?? 0) - (a.outcome_value ?? 0))
    if (sorted.length === 0) continue

    const best = sorted[0]
    const channelLabel = CHANNEL_LABELS[best.channel] ?? best.channel
    const kindLabel = PATTERN_LABELS[best.pattern_kind] ?? best.pattern_kind
    const valuePart = best.pattern_value.split(':')[1] ?? best.pattern_value

    practices.push({
      channel: best.channel,
      categoryBucket: best.category_bucket,
      patternKind: best.pattern_kind,
      recommendation: `Top ${channelLabel} sellers in ${best.category_bucket.replace(/-/g, ' ')} use ${kindLabel} of ${valuePart}`,
      evidence: `${best.outcome_metric} = ${best.outcome_value}% (n=${best.sample_size} merchants)`,
      sampleSize: best.sample_size,
      outcomeValue: best.outcome_value,
    })
  }

  return practices.sort((a, b) => (b.outcomeValue ?? 0) - (a.outcomeValue ?? 0))
}
