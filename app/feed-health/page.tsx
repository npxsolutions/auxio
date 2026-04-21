'use client'

/**
 * Feed Health Dashboard — aggregate feed quality scores across channels.
 *
 * Shows overall health score, per-channel breakdowns, error distribution,
 * top fixable issues, and channel-specific optimization suggestions.
 *
 * Additive page — no existing routes are modified.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppSidebar from '../components/AppSidebar'
import { createClient } from '../lib/supabase-client'

// ── Types ──

type ChannelSummary = {
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

type DistributionBand = {
  band: string
  count: number
  pct: number
  color: string
}

type FixableIssue = {
  message: string
  remediation: string
  count: number
}

type FeedHealthData = {
  overallScore: number
  totalValidated: number
  uniqueListingsValidated: number
  totalListings: number
  coveragePct: number
  totalErrors: number
  totalWarnings: number
  staleCount: number
  channelSummaries: ChannelSummary[]
  distribution: DistributionBand[]
  fixableIssues: FixableIssue[]
}

type AggregatedSuggestion = {
  category: string
  severity: 'high' | 'medium' | 'low'
  channel: string
  suggestion: string
  benchmark: string
  affectedCount: number
  affectedPct: number
  estimatedImpact: string
  sampleListings: Array<{ id: string; title: string; current: string }>
}

type OptimizationData = {
  totalListingsAnalysed: number
  totalSuggestions: number
  aggregated: AggregatedSuggestion[]
  categoryCounts: Record<string, { high: number; medium: number; low: number }>
}

type BenchmarkEntry = {
  channel: string
  categoryBucket: string
  percentiles: { p25: number; p50: number; p75: number; p90: number }
  avgHealthScore: number
  avgErrorsPerListing: number
  totalListings: number
  sampleMerchants: number
  topErrorPatterns: Array<{ ruleId: string; message: string; count: number; pctAffected: number }>
}

type UserComparison = {
  channel: string
  categoryBucket: string
  yourScore: number
  categoryAvg: number
  delta: number
  percentileRank: string
}

type BestPractice = {
  channel: string
  categoryBucket: string
  patternKind: string
  recommendation: string
  evidence: string
  sampleSize: number
  outcomeValue: number | null
}

type BenchmarkData = {
  benchmarks: BenchmarkEntry[]
  comparisons: UserComparison[]
  topErrorPatterns: Array<{ ruleId: string; message: string; count: number; pctAffected: number }>
}

type PatternData = {
  bestPractices: BestPractice[]
  totalObservations: number
  uniquePatterns: number
}

// ── Styles ──

const CREAM = '#f8f4ec'
const INK = '#0b0f1a'
const COBALT = '#e8863f'
const EMERALD = '#059669'
const AMBER = '#d97706'
const OXBLOOD = '#dc2626'

const CARD: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e8e5df',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
}

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono), ui-monospace, monospace',
}

const CHANNEL_META: Record<string, { icon: string; name: string; color: string }> = {
  ebay:        { icon: '\uD83D\uDED2', name: 'eBay', color: '#fff0e6' },
  amazon:      { icon: '\uD83D\uDCE6', name: 'Amazon', color: '#fff3e6' },
  shopify:     { icon: '\uD83D\uDECD\uFE0F', name: 'Shopify', color: '#e8f1fb' },
  tiktok:      { icon: '\uD83D\uDCF1', name: 'TikTok Shop', color: '#e8f5f3' },
  tiktok_shop: { icon: '\uD83D\uDCF1', name: 'TikTok Shop', color: '#e8f5f3' },
  etsy:        { icon: '\uD83C\uDFA8', name: 'Etsy', color: '#fdf3e8' },
  walmart:     { icon: '\uD83C\uDFEA', name: 'Walmart', color: '#e8f1fb' },
  onbuy:       { icon: '\uD83D\uDED2', name: 'OnBuy', color: '#f0e8fb' },
}

const SEVERITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  high:   { bg: '#fef2f2', color: '#dc2626', label: 'High Impact' },
  medium: { bg: '#fffbeb', color: '#d97706', label: 'Medium Impact' },
  low:    { bg: '#f0fdf4', color: '#059669', label: 'Low Impact' },
}

// ── Helper components ──

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? EMERALD : score >= 50 ? AMBER : OXBLOOD

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e8e5df" strokeWidth="8" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 800, color: INK, ...MONO, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, color: '#9496b0', marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>/ 100</span>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ ...CARD, padding: '16px 18px' }}>
      <div style={{ fontSize: 10, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? INK, ...MONO, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9496b0', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function DistributionBar({ bands }: { bands: DistributionBand[] }) {
  const total = bands.reduce((s, b) => s + b.count, 0)
  if (total === 0) return <div style={{ fontSize: 13, color: '#9496b0' }}>No validation data yet</div>
  return (
    <div>
      <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 28, marginBottom: 8 }}>
        {bands.filter(b => b.count > 0).map(b => (
          <div
            key={b.band}
            title={`${b.band}: ${b.count} listings (${b.pct}%)`}
            style={{
              width: `${b.pct}%`,
              background: b.color,
              minWidth: b.count > 0 ? 4 : 0,
              transition: 'width 0.4s ease',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {bands.filter(b => b.count > 0).map(b => (
          <div key={b.band} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b6f80' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: b.color, display: 'inline-block' }} />
            {b.band}: {b.count} ({b.pct}%)
          </div>
        ))}
      </div>
    </div>
  )
}

function ChannelHealthCard({ ch }: { ch: ChannelSummary }) {
  const [expanded, setExpanded] = useState(false)
  const meta = CHANNEL_META[ch.channel] ?? { icon: '\uD83C\uDFEA', name: ch.channel, color: '#f1f1ef' }
  const scoreColor = ch.avgHealthScore >= 80 ? EMERALD : ch.avgHealthScore >= 50 ? AMBER : OXBLOOD

  return (
    <div style={{ ...CARD, padding: '18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: meta.color, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>
            {meta.icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{meta.name}</div>
            <div style={{ fontSize: 11, color: '#9496b0' }}>{ch.totalListings} listing{ch.totalListings !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: scoreColor, ...MONO, lineHeight: 1 }}>{ch.avgHealthScore}</div>
          <div style={{ fontSize: 10, color: '#9496b0', letterSpacing: '0.06em' }}>AVG SCORE</div>
        </div>
      </div>

      {/* Health breakdown bar */}
      <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 6 }}>
        <div style={{ width: `${ch.healthyPct}%`, background: EMERALD, minWidth: ch.healthyCount > 0 ? 2 : 0 }} />
        <div style={{ width: `${ch.warningPct}%`, background: AMBER, minWidth: ch.warningCount > 0 ? 2 : 0 }} />
        <div style={{ width: `${ch.errorPct}%`, background: OXBLOOD, minWidth: ch.errorCount > 0 ? 2 : 0 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
        <span style={{ color: EMERALD }}>{ch.healthyCount} healthy</span>
        <span style={{ color: AMBER }}>{ch.warningCount} warnings</span>
        <span style={{ color: OXBLOOD }}>{ch.errorCount} errors</span>
      </div>

      {/* Top errors toggle */}
      {ch.topErrors.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: COBALT, fontWeight: 500, textAlign: 'left',
              padding: 0,
            }}
          >
            {expanded ? 'Hide' : 'Show'} top issues ({ch.topErrors.length})
          </button>
          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ch.topErrors.map(e => (
                <div key={e.ruleId} style={{
                  padding: '10px 12px', background: '#fafaf8', borderRadius: 8,
                  border: '1px solid #f0ede8',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: INK, flex: 1 }}>{e.message}</div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: OXBLOOD,
                      background: '#fef2f2', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap',
                    }}>
                      {e.count} ({e.pctAffected}%)
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#6b6f80', marginTop: 4 }}>{e.remediation}</div>
                  {e.autoFixable && (
                    <span style={{
                      display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 600,
                      color: COBALT, background: '#eef4ff', padding: '2px 6px', borderRadius: 4,
                    }}>
                      Auto-fixable
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ComparisonCard({ c }: { c: UserComparison }) {
  const meta = CHANNEL_META[c.channel] ?? { icon: '\uD83C\uDFEA', name: c.channel, color: '#f1f1ef' }
  const deltaColor = c.delta >= 0 ? EMERALD : OXBLOOD
  const deltaSign = c.delta >= 0 ? '+' : ''
  const rankColor = c.percentileRank.includes('top 10') ? EMERALD
    : c.percentileRank.includes('top 25') ? '#0f8a5b'
    : c.percentileRank.includes('above') ? AMBER
    : OXBLOOD

  return (
    <div style={{ ...CARD, padding: '18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, background: meta.color, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>
            {meta.icon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{meta.name}</div>
            <div style={{ fontSize: 11, color: '#9496b0', textTransform: 'capitalize' }}>
              {c.categoryBucket.replace(/-/g, ' ')}
            </div>
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: rankColor, background: `${rankColor}12`,
          padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {c.percentileRank}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 10, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Score</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: INK, ...MONO, lineHeight: 1, marginTop: 2 }}>{c.yourScore}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category Avg</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#6b6f80', ...MONO, lineHeight: 1, marginTop: 2 }}>{c.categoryAvg}</div>
        </div>
        <div style={{
          fontSize: 16, fontWeight: 800, color: deltaColor, ...MONO,
          padding: '4px 10px', background: `${deltaColor}10`, borderRadius: 6,
        }}>
          {deltaSign}{c.delta}
        </div>
      </div>
    </div>
  )
}

function BenchmarkCard({ b }: { b: BenchmarkEntry }) {
  const meta = CHANNEL_META[b.channel] ?? { icon: '\uD83C\uDFEA', name: b.channel, color: '#f1f1ef' }
  const scoreColor = b.avgHealthScore >= 80 ? EMERALD : b.avgHealthScore >= 50 ? AMBER : OXBLOOD

  return (
    <div style={{ ...CARD, padding: '18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{meta.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{meta.name}</span>
          <span style={{
            fontSize: 10, color: '#6b6f80', background: '#f4f4f2',
            padding: '2px 6px', borderRadius: 4, textTransform: 'capitalize',
          }}>
            {b.categoryBucket.replace(/-/g, ' ')}
          </span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: scoreColor, ...MONO }}>{b.avgHealthScore}</div>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#6b6f80' }}>
        <span>p25={b.percentiles.p25}</span>
        <span>p50={b.percentiles.p50}</span>
        <span>p75={b.percentiles.p75}</span>
        <span>p90={b.percentiles.p90}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#6b6f80' }}>
        <span>{b.totalListings.toLocaleString()} listings</span>
        <span>{b.sampleMerchants} merchants</span>
        <span>{b.avgErrorsPerListing} avg errors/listing</span>
      </div>
    </div>
  )
}

function BestPracticeCard({ bp }: { bp: BestPractice }) {
  const meta = CHANNEL_META[bp.channel] ?? { icon: '\uD83C\uDFEA', name: bp.channel, color: '#f1f1ef' }
  return (
    <div style={{ ...CARD, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14 }}>{meta.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>{bp.recommendation}</span>
      </div>
      <div style={{ fontSize: 11, color: '#6b6f80' }}>{bp.evidence}</div>
    </div>
  )
}

function SuggestionCard({ s }: { s: AggregatedSuggestion }) {
  const [expanded, setExpanded] = useState(false)
  const sev = SEVERITY_STYLE[s.severity] ?? SEVERITY_STYLE.low
  const meta = CHANNEL_META[s.channel] ?? { icon: '\uD83C\uDFEA', name: s.channel, color: '#f1f1ef' }

  return (
    <div style={{ ...CARD, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: sev.color, background: sev.bg,
            padding: '3px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {sev.label}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, color: '#6b6f80', background: meta.color,
            padding: '3px 7px', borderRadius: 4,
          }}>
            {meta.icon} {meta.name}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, color: '#6b6f80', background: '#f4f4f2',
            padding: '3px 7px', borderRadius: 4, textTransform: 'capitalize',
          }}>
            {s.category}
          </span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: INK, ...MONO }}>
          {s.affectedCount} listing{s.affectedCount !== 1 ? 's' : ''} ({s.affectedPct}%)
        </span>
      </div>
      <div style={{ fontSize: 13, color: INK, lineHeight: 1.5 }}>{s.suggestion}</div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#6b6f80' }}>
        <span>Benchmark: {s.benchmark}</span>
        <span style={{ color: COBALT, fontWeight: 600 }}>Impact: {s.estimatedImpact}</span>
      </div>
      {s.sampleListings.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: COBALT, fontWeight: 500, textAlign: 'left', padding: 0,
            }}
          >
            {expanded ? 'Hide' : 'View'} affected listings
          </button>
          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {s.sampleListings.map(l => (
                <Link
                  key={l.id}
                  href={`/listings/${l.id}`}
                  style={{
                    fontSize: 11, color: COBALT, textDecoration: 'none',
                    padding: '4px 8px', background: '#fafaf8', borderRadius: 4,
                    display: 'flex', justifyContent: 'space-between',
                  }}
                >
                  <span>{l.title}</span>
                  <span style={{ color: '#9496b0' }}>{l.current}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Shimmer loading skeleton ──

const SHIMMER_KEYFRAMES = `
  @keyframes shimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
`

const SHIMMER: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f0ede8 25%, #e8e5df 50%, #f0ede8 75%)',
  backgroundSize: '800px 100%',
  animation: 'shimmer 1.4s ease-in-out infinite',
  borderRadius: '6px',
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: CREAM, fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <style>{SHIMMER_KEYFRAMES}</style>
      <AppSidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '24px' }}>
        <div style={{ ...SHIMMER, width: 200, height: 24, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div style={{ ...SHIMMER, height: 140, borderRadius: 12 }} />
          <div style={{ ...SHIMMER, height: 140, borderRadius: 12 }} />
          <div style={{ ...SHIMMER, height: 140, borderRadius: 12 }} />
          <div style={{ ...SHIMMER, height: 140, borderRadius: 12 }} />
          <div style={{ ...SHIMMER, height: 140, borderRadius: 12 }} />
        </div>
        <div style={{ ...SHIMMER, height: 200, borderRadius: 12, marginBottom: 24 }} />
      </main>
    </div>
  )
}

// ── Main page ──

export default function FeedHealthPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [healthData, setHealthData] = useState<FeedHealthData | null>(null)
  const [optData, setOptData] = useState<OptimizationData | null>(null)
  const [benchData, setBenchData] = useState<BenchmarkData | null>(null)
  const [patternData, setPatternData] = useState<PatternData | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'benchmarks' | 'suggestions'>('overview')
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [healthRes, optRes, benchRes, patRes] = await Promise.all([
        fetch('/api/feed-health').then(r => r.json()),
        fetch('/api/optimization-suggestions').then(r => r.json()),
        fetch('/api/benchmarks').then(r => r.json()).catch(() => null),
        fetch('/api/patterns').then(r => r.json()).catch(() => null),
      ])

      if (!healthRes.error) setHealthData(healthRes)
      if (!optRes.error) setOptData(optRes)
      if (benchRes && !benchRes.error) setBenchData(benchRes)
      if (patRes && !patRes.error) setPatternData(patRes)
    } catch (error) {
      console.error('[feed-health] load error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Skeleton />

  const h = healthData
  const o = optData
  const bench = benchData
  const pat = patternData

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: CREAM, fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <style>{SHIMMER_KEYFRAMES}</style>
      <AppSidebar />
      <main style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{
          height: 52, background: 'white', borderBottom: '1px solid #e8e5df',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>Feed Health</span>
          <div style={{ flex: 1 }} />
          <Link
            href="/listings"
            style={{
              fontSize: 12, color: COBALT, textDecoration: 'none', fontWeight: 500,
              padding: '6px 12px', borderRadius: 6, border: `1px solid ${COBALT}30`,
            }}
          >
            View Listings
          </Link>
        </div>

        <div style={{ padding: '24px', maxWidth: 1200 }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {(['overview', 'benchmarks', 'suggestions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: activeTab === tab ? INK : 'transparent',
                  color: activeTab === tab ? 'white' : '#6b6f80',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
                  transition: 'all 0.15s',
                }}
              >
                {tab === 'overview' ? 'Health Overview' : tab === 'benchmarks' ? 'How You Compare' : `Optimization Suggestions${o ? ` (${o.totalSuggestions})` : ''}`}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && h && (
            <>
              {/* Hero stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                {/* Score ring */}
                <div style={{ ...CARD, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScoreRing score={h.overallScore} size={120} />
                </div>
                <StatCard
                  label="Total Errors"
                  value={h.totalErrors}
                  sub={`across ${h.totalValidated} validations`}
                  color={h.totalErrors > 0 ? OXBLOOD : EMERALD}
                />
                <StatCard
                  label="Total Warnings"
                  value={h.totalWarnings}
                  color={h.totalWarnings > 0 ? AMBER : EMERALD}
                />
                <StatCard
                  label="Validation Coverage"
                  value={`${h.coveragePct}%`}
                  sub={`${h.uniqueListingsValidated} of ${h.totalListings} listings`}
                />
                <StatCard
                  label="Stale Validations"
                  value={h.staleCount}
                  sub="older than 24h"
                  color={h.staleCount > 0 ? AMBER : EMERALD}
                />
              </div>

              {/* Health distribution */}
              <div style={{ ...CARD, padding: '20px', marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 12 }}>Health Score Distribution</div>
                <DistributionBar bands={h.distribution} />
              </div>

              {/* Per-channel cards */}
              {h.channelSummaries.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 12 }}>Channel Breakdown</div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: 12,
                  }}>
                    {h.channelSummaries.map(ch => (
                      <ChannelHealthCard key={ch.channel} ch={ch} />
                    ))}
                  </div>
                </div>
              )}

              {/* Auto-fixable issues */}
              {h.fixableIssues.length > 0 && (
                <div style={{ ...CARD, padding: '20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 12 }}>
                    Quick Wins — Auto-Fixable Issues
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {h.fixableIssues.map((f, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', background: '#fafaf8', borderRadius: 8,
                        border: '1px solid #f0ede8',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: INK }}>{f.message}</div>
                          <div style={{ fontSize: 11, color: '#6b6f80', marginTop: 2 }}>{f.remediation}</div>
                        </div>
                        <span style={{
                          fontSize: 13, fontWeight: 700, color: COBALT, ...MONO,
                          marginLeft: 12, whiteSpace: 'nowrap',
                        }}>
                          {f.count} listing{f.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {h.totalValidated === 0 && (
                <div style={{
                  ...CARD, padding: '48px 24px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>&#x1F50D;</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 4 }}>No validation data yet</div>
                  <div style={{ fontSize: 13, color: '#6b6f80', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
                    Connect a channel and sync your listings to see feed health scores.
                    Palvento validates your feed automatically every 24 hours.
                  </div>
                  <Link
                    href="/channels"
                    style={{
                      display: 'inline-block', marginTop: 16,
                      padding: '10px 20px', background: INK, color: 'white',
                      borderRadius: 8, fontSize: 13, fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Connect a Channel
                  </Link>
                </div>
              )}
            </>
          )}

          {activeTab === 'benchmarks' && (
            <>
              {/* User comparisons */}
              {bench && bench.comparisons.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 12 }}>Your Score vs. Category Average</div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 12,
                  }}>
                    {bench.comparisons.map((c, i) => (
                      <ComparisonCard key={i} c={c} />
                    ))}
                  </div>
                </div>
              )}

              {/* Category benchmarks */}
              {bench && bench.benchmarks.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 12 }}>Category Benchmarks</div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: 12,
                  }}>
                    {bench.benchmarks.map((b, i) => (
                      <BenchmarkCard key={i} b={b} />
                    ))}
                  </div>
                </div>
              )}

              {/* Best practices from pattern library */}
              {pat && pat.bestPractices.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 12 }}>
                    Best Practices (Pattern Library)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pat.bestPractices.map((bp, i) => (
                      <BestPracticeCard key={i} bp={bp} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {(!bench || (bench.benchmarks.length === 0 && bench.comparisons.length === 0)) && (
                <div style={{
                  ...CARD, padding: '48px 24px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>&#x1F4CA;</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 4 }}>Benchmarks building</div>
                  <div style={{ fontSize: 13, color: '#6b6f80', maxWidth: 440, margin: '0 auto', lineHeight: 1.5 }}>
                    We need data from at least 10 merchants per category to generate benchmarks.
                    As the Palvento community grows, you will see how your feed quality compares
                    to similar sellers in your categories.
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'suggestions' && o && (
            <>
              {/* Summary strip */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <StatCard
                  label="Listings Analysed"
                  value={o.totalListingsAnalysed}
                />
                <StatCard
                  label="Total Suggestions"
                  value={o.totalSuggestions}
                  color={o.totalSuggestions > 0 ? AMBER : EMERALD}
                />
                {Object.entries(o.categoryCounts).map(([cat, counts]) => (
                  <StatCard
                    key={cat}
                    label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                    value={counts.high + counts.medium + counts.low}
                    sub={counts.high > 0 ? `${counts.high} high priority` : undefined}
                  />
                ))}
              </div>

              {/* Suggestion cards */}
              {o.aggregated.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {o.aggregated.map((s, i) => (
                    <SuggestionCard key={i} s={s} />
                  ))}
                </div>
              ) : (
                <div style={{
                  ...CARD, padding: '48px 24px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>&#x2728;</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 4 }}>All optimised!</div>
                  <div style={{ fontSize: 13, color: '#6b6f80', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
                    Your listings meet channel best practices. Keep up the great work.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
