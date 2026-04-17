import { describe, it, expect } from 'vitest'
import {
  computePercentiles,
  percentile,
  aggregateRollups,
  countErrorPatterns,
  percentileRank,
  computeUserComparison,
  buildBestPractices,
  type RollupRow,
  type HealthRow,
  type PatternRow,
} from '../benchmark-aggregation'

describe('percentile', () => {
  it('returns 0 for empty array', () => {
    expect(percentile([], 50)).toBe(0)
  })

  it('returns the single value for a one-element array', () => {
    expect(percentile([42], 50)).toBe(42)
    expect(percentile([42], 0)).toBe(42)
    expect(percentile([42], 100)).toBe(42)
  })

  it('interpolates correctly for even arrays', () => {
    const sorted = [10, 20, 30, 40]
    expect(percentile(sorted, 50)).toBe(25)
    expect(percentile(sorted, 0)).toBe(10)
    expect(percentile(sorted, 100)).toBe(40)
  })

  it('returns exact values at boundaries', () => {
    const sorted = [10, 20, 30, 40, 50]
    expect(percentile(sorted, 0)).toBe(10)
    expect(percentile(sorted, 100)).toBe(50)
    expect(percentile(sorted, 50)).toBe(30)
  })
})

describe('computePercentiles', () => {
  it('computes p25/p50/p75/p90 from unsorted scores', () => {
    const scores = [90, 50, 70, 80, 60, 40, 85, 95, 75, 65]
    const p = computePercentiles(scores)
    expect(p.p25).toBeGreaterThanOrEqual(50)
    expect(p.p50).toBeGreaterThanOrEqual(p.p25)
    expect(p.p75).toBeGreaterThanOrEqual(p.p50)
    expect(p.p90).toBeGreaterThanOrEqual(p.p75)
  })

  it('handles all-same values', () => {
    const p = computePercentiles([80, 80, 80])
    expect(p.p25).toBe(80)
    expect(p.p50).toBe(80)
    expect(p.p75).toBe(80)
    expect(p.p90).toBe(80)
  })

  it('handles empty array', () => {
    const p = computePercentiles([])
    expect(p.p25).toBe(0)
    expect(p.p50).toBe(0)
    expect(p.p75).toBe(0)
    expect(p.p90).toBe(0)
  })
})

describe('aggregateRollups', () => {
  const baseRow: RollupRow = {
    channel: 'ebay',
    category_bucket: 'apparel-womens',
    gmv_band: 'under_10k',
    avg_health_score: 82,
    avg_errors_per_listing: 1.2,
    avg_warnings_per_listing: 2.0,
    pct_with_images: 95,
    pct_with_gtin: 60,
    pct_with_brand: 80,
    listings_total: 500,
    sample_size: 20,
  }

  it('aggregates matching rows into a benchmark', () => {
    const rows: RollupRow[] = [
      { ...baseRow, gmv_band: 'under_10k', avg_health_score: 75, listings_total: 200 },
      { ...baseRow, gmv_band: '10k_100k', avg_health_score: 85, listings_total: 300 },
    ]
    const result = aggregateRollups(rows, 'ebay', 'apparel-womens')
    expect(result).not.toBeNull()
    expect(result!.channel).toBe('ebay')
    expect(result!.categoryBucket).toBe('apparel-womens')
    expect(result!.totalListings).toBe(500)
    expect(result!.sampleMerchants).toBe(40)
    // Weighted avg: (75*200 + 85*300) / 500 = 81
    expect(result!.avgHealthScore).toBe(81)
  })

  it('returns null for non-matching filter', () => {
    expect(aggregateRollups([baseRow], 'amazon', 'apparel-womens')).toBeNull()
    expect(aggregateRollups([baseRow], 'ebay', 'electronics-mobile')).toBeNull()
  })

  it('returns null for empty rows', () => {
    expect(aggregateRollups([], 'ebay', 'apparel-womens')).toBeNull()
  })
})

describe('countErrorPatterns', () => {
  it('counts error frequencies and sorts by count', () => {
    const rows: HealthRow[] = [
      {
        health_score: 50, channel: 'ebay', errors_count: 2, warnings_count: 0,
        issues: [
          { rule: { id: 'A', message: 'Missing GTIN', severity: 'error' } },
          { rule: { id: 'B', message: 'No images', severity: 'error' } },
        ],
      },
      {
        health_score: 70, channel: 'ebay', errors_count: 1, warnings_count: 1,
        issues: [
          { rule: { id: 'A', message: 'Missing GTIN', severity: 'error' } },
          { rule: { id: 'C', message: 'Short title', severity: 'warning' } },
        ],
      },
    ]
    const result = countErrorPatterns(rows)
    expect(result[0].ruleId).toBe('A')
    expect(result[0].count).toBe(2)
    expect(result[0].pctAffected).toBe(100) // 2 out of 2 rows
    expect(result[1].ruleId).toBe('B')
    expect(result[1].count).toBe(1)
    // Warnings are excluded
    expect(result.find(r => r.ruleId === 'C')).toBeUndefined()
  })

  it('returns empty for no issues', () => {
    const rows: HealthRow[] = [
      { health_score: 100, channel: 'ebay', errors_count: 0, warnings_count: 0, issues: null },
    ]
    expect(countErrorPatterns(rows)).toEqual([])
  })

  it('caps at 10 entries', () => {
    const issues = Array.from({ length: 15 }, (_, i) => ({
      rule: { id: `RULE_${i}`, message: `Rule ${i}`, severity: 'error' as const },
    }))
    const rows: HealthRow[] = [{ health_score: 10, channel: 'ebay', errors_count: 15, warnings_count: 0, issues }]
    expect(countErrorPatterns(rows).length).toBe(10)
  })
})

describe('percentileRank', () => {
  const p = { p25: 60, p50: 75, p75: 85, p90: 92 }

  it('classifies top 10%', () => {
    expect(percentileRank(95, p)).toBe('top 10%')
    expect(percentileRank(92, p)).toBe('top 10%')
  })

  it('classifies top 25%', () => {
    expect(percentileRank(88, p)).toBe('top 25%')
    expect(percentileRank(85, p)).toBe('top 25%')
  })

  it('classifies above median', () => {
    expect(percentileRank(80, p)).toBe('above median')
    expect(percentileRank(75, p)).toBe('above median')
  })

  it('classifies below median', () => {
    expect(percentileRank(65, p)).toBe('below median')
    expect(percentileRank(60, p)).toBe('below median')
  })

  it('classifies bottom 25%', () => {
    expect(percentileRank(40, p)).toBe('bottom 25%')
  })
})

describe('computeUserComparison', () => {
  it('computes delta and rank', () => {
    const benchmark = {
      channel: 'ebay',
      categoryBucket: 'apparel-womens',
      percentiles: { p25: 60, p50: 75, p75: 85, p90: 92 },
      avgHealthScore: 78,
      avgErrorsPerListing: 1.5,
      totalListings: 1000,
      sampleMerchants: 50,
    }
    const result = computeUserComparison(90, benchmark)
    expect(result.yourScore).toBe(90)
    expect(result.categoryAvg).toBe(78)
    expect(result.delta).toBe(12)
    expect(result.percentileRank).toBe('top 25%')
  })

  it('handles user below average', () => {
    const benchmark = {
      channel: 'amazon',
      categoryBucket: 'electronics-mobile',
      percentiles: { p25: 70, p50: 80, p75: 88, p90: 95 },
      avgHealthScore: 82,
      avgErrorsPerListing: 0.8,
      totalListings: 500,
      sampleMerchants: 30,
    }
    const result = computeUserComparison(55, benchmark)
    expect(result.delta).toBe(-27)
    expect(result.percentileRank).toBe('bottom 25%')
  })
})

describe('buildBestPractices', () => {
  it('picks the bin with highest outcome value per group', () => {
    const patterns: PatternRow[] = [
      { channel: 'ebay', category_bucket: 'apparel-womens', pattern_kind: 'title_length', pattern_value: 'title_length:60-79', sample_size: 15, outcome_metric: 'publish_success_rate', outcome_value: 94 },
      { channel: 'ebay', category_bucket: 'apparel-womens', pattern_kind: 'title_length', pattern_value: 'title_length:140+', sample_size: 12, outcome_metric: 'publish_success_rate', outcome_value: 71 },
      { channel: 'ebay', category_bucket: 'apparel-womens', pattern_kind: 'image_count', pattern_value: 'image_count:4-6', sample_size: 20, outcome_metric: 'publish_success_rate', outcome_value: 88 },
    ]
    const result = buildBestPractices(patterns)
    expect(result.length).toBe(2)
    // Title length: 60-79 wins with 94%
    const titlePractice = result.find(r => r.patternKind === 'title_length')
    expect(titlePractice).toBeDefined()
    expect(titlePractice!.recommendation).toContain('60-79')
    expect(titlePractice!.outcomeValue).toBe(94)
  })

  it('returns empty for no patterns', () => {
    expect(buildBestPractices([])).toEqual([])
  })

  it('skips patterns with null outcome', () => {
    const patterns: PatternRow[] = [
      { channel: 'ebay', category_bucket: 'toys', pattern_kind: 'title_length', pattern_value: 'title_length:40-59', sample_size: 10, outcome_metric: 'publish_success_rate', outcome_value: null },
    ]
    expect(buildBestPractices(patterns)).toEqual([])
  })
})
