'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase-client'
import AppSidebar from '../components/AppSidebar'

// ── Types ────────────────────────────────────────────────────────────────────

interface Job {
  id: string
  status: 'running' | 'processing' | 'done' | 'error'
  keyword: string
  platforms: string[]
  posts_ingested: number
  ads_ingested: number
  started_at: string
  completed_at?: string
  error?: string
}

interface Overview {
  keyword: string
  total_posts: number
  total_ads: number
  platform_breakdown: Record<string, number>
  avg_engagement_rate: number
  latest_job: Job | null
}

interface HookPattern {
  hook_category: string
  avg_engagement: number
  avg_share_rate: number
  avg_save_rate: number
  post_count: number
  example_hook: string | null
}

interface TopPost {
  id: string
  hook: string
  hook_category: string
  caption: string
  url: string
  platform: string
  engagement_rate: number
  views: number
}

interface FormatPerf {
  format: string
  avg_engagement: number
  avg_share_rate: number
  avg_save_rate: number
  count: number
}

interface TypePerf {
  type: string
  avg_engagement: number
  count: number
}

interface DurationPerf {
  range: string
  avg_engagement: number
  count: number
}

interface Insight {
  insight_type: string
  insight_text: string
  evidence_count: number
  example_comment: string | null
}

interface Recommendation {
  type: string
  recommendation: string
  rationale: string
  example?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  tiktok:    '#ff0050',
  instagram: '#e1306c',
  youtube:   '#ff0000',
  facebook:  '#1877f2',
}

const HOOK_COLORS: Record<string, string> = {
  curiosity:    '#a78bfa',
  problem:      '#f87171',
  benefit:      '#34d399',
  shock:        '#fbbf24',
  story:        '#60a5fa',
  social_proof: '#f472b6',
  other:        '#94a3b8',
}

const INSIGHT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  desire:     { bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)',  text: '#34d399' },
  pain_point: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', text: '#f87171' },
  question:   { bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  text: '#60a5fa' },
  objection:  { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  text: '#fbbf24' },
  trend:      { bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)', text: '#a78bfa' },
}

function fmt(n: number, decimals = 1) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return n.toFixed(decimals)
}

function pct(n: number) { return n.toFixed(2) + '%' }

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '10px',
      padding: '16px 20px',
    }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: '#f0f0f8', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
      {children}
    </div>
  )
}

function BarRow({ label, value, max, color, sub }: { label: string; value: number; max: number; color: string; sub?: string }) {
  const pctWidth = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{label}</span>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{sub || value}</span>
      </div>
      <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pctWidth}%`, background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

type Tab = 'overview' | 'hooks' | 'content' | 'audience' | 'recommendations'

export default function SocialIntelPage() {
  const router = useRouter()
  const supabase = createClient()

  const [keyword, setKeyword]         = useState('')
  const [activeKeyword, setActive]    = useState('')
  const [tab, setTab]                 = useState<Tab>('overview')
  const [loading, setLoading]         = useState(false)
  const [ingesting, setIngesting]     = useState(false)
  const [jobId, setJobId]             = useState<string | null>(null)
  const [jobStatus, setJobStatus]     = useState<string | null>(null)
  const [toast, setToast]             = useState('')
  const [toastType, setToastType]     = useState<'ok' | 'err'>('ok')

  // Per-tab data
  const [overview, setOverview]           = useState<Overview | null>(null)
  const [hookData, setHookData]           = useState<{ patterns: HookPattern[]; top_posts: TopPost[] } | null>(null)
  const [contentData, setContentData]     = useState<{ format_performance: FormatPerf[]; type_performance: TypePerf[]; duration_performance: DurationPerf[] } | null>(null)
  const [audienceData, setAudienceData]   = useState<{ insights: Insight[]; intent_breakdown: Record<string, number>; sentiment_breakdown: Record<string, number> } | null>(null)
  const [recsData, setRecsData]           = useState<Recommendation[] | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
    })
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  useEffect(() => {
    if (activeKeyword && tab) fetchTab(tab)
  }, [tab, activeKeyword])

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(''), 3500)
  }

  async function fetchTab(t: Tab) {
    if (!activeKeyword) return
    setLoading(true)
    try {
      const res = await fetch(`/api/social-intel/query?keyword=${encodeURIComponent(activeKeyword)}&view=${t}`)
      const data = await res.json()
      if (t === 'overview')         setOverview(data)
      else if (t === 'hooks')       setHookData(data)
      else if (t === 'content')     setContentData(data)
      else if (t === 'audience')    setAudienceData(data)
      else if (t === 'recommendations') setRecsData(data.recommendations || [])
    } catch { showToast('Failed to load data', 'err') }
    finally  { setLoading(false) }
  }

  async function startIngest() {
    if (!keyword.trim()) return
    setIngesting(true)
    try {
      const res  = await fetch('/api/social-intel/ingest', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ keyword: keyword.trim(), platforms: ['tiktok', 'instagram', 'youtube'], maxItems: 50 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setJobId(data.jobId)
      setJobStatus('running')
      setActive(keyword.trim())
      showToast(`Scraping ${keyword.trim()} across TikTok, Instagram & YouTube…`)

      // Poll job status
      pollRef.current = setInterval(async () => {
        const jr = await fetch(`/api/social-intel/ingest?jobId=${data.jobId}`)
        const j  = await jr.json()
        setJobStatus(j.status)
        if (j.status === 'done') {
          clearInterval(pollRef.current!)
          setIngesting(false)
          showToast(`Done — ${j.posts_ingested} posts ingested`)
          fetchTab('overview')
        } else if (j.status === 'error') {
          clearInterval(pollRef.current!)
          setIngesting(false)
          showToast(j.error || 'Ingestion failed', 'err')
        }
      }, 5000)
    } catch (e: any) {
      showToast(e.message, 'err')
      setIngesting(false)
    }
  }

  function search() {
    if (!keyword.trim()) return
    setActive(keyword.trim())
    setTab('overview')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview',         label: 'Overview' },
    { id: 'hooks',            label: 'Hook Analysis' },
    { id: 'content',          label: 'Content' },
    { id: 'audience',         label: 'Audience' },
    { id: 'recommendations',  label: 'Recommendations' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0c0d11', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <AppSidebar />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', maxWidth: '1200px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#f0f0f8', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Social Intelligence
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
            Scrape & analyse top-performing content across TikTok, Instagram, and YouTube
          </div>
        </div>

        {/* ── Keyword bar ── */}
        <div style={{
          display: 'flex', gap: '10px', marginBottom: '28px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '16px 20px',
        }}>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Enter a keyword, niche or topic…"
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '10px 14px',
              color: '#f0f0f8', fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={search}
            disabled={!keyword.trim()}
            style={{
              padding: '10px 20px', borderRadius: '8px',
              background: 'rgba(232,134,63,0.10)',
              border: '1px solid rgba(232,134,63,0.10)',
              color: '#a89ef8', fontSize: '13px', fontWeight: 500,
              cursor: keyword.trim() ? 'pointer' : 'not-allowed',
              opacity: keyword.trim() ? 1 : 0.4,
            }}
          >
            Search
          </button>
          <button
            onClick={startIngest}
            disabled={ingesting || !keyword.trim()}
            style={{
              padding: '10px 20px', borderRadius: '8px',
              background: ingesting ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #e8863f, #e8863f)',
              border: 'none',
              color: ingesting ? 'rgba(255,255,255,0.4)' : 'white',
              fontSize: '13px', fontWeight: 500,
              cursor: ingesting || !keyword.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {ingesting ? (
              <>
                <span style={{
                  display: 'inline-block', width: '12px', height: '12px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderTopColor: 'rgba(255,255,255,0.6)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}/>
                {jobStatus === 'running' ? 'Scraping…' : 'Processing…'}
              </>
            ) : 'Scrape & Analyse'}
          </button>
        </div>

        {/* ── No keyword selected ── */}
        {!activeKeyword && (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            color: 'rgba(255,255,255,0.2)',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '6px', color: 'rgba(255,255,255,0.35)' }}>
              Enter a keyword to get started
            </div>
            <div style={{ fontSize: '13px' }}>
              Try &quot;ecom ads&quot;, &quot;dropshipping&quot;, or your product niche
            </div>
          </div>
        )}

        {/* ── Main UI ── */}
        {activeKeyword && (
          <>
            {/* Tabs */}
            <div style={{
              display: 'flex', gap: '4px', marginBottom: '24px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              paddingBottom: '0',
            }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent', border: 'none',
                    color: tab === t.id ? '#f0f0f8' : 'rgba(255,255,255,0.4)',
                    fontSize: '13px', fontWeight: tab === t.id ? 500 : 400,
                    cursor: 'pointer',
                    borderBottom: tab === t.id ? '2px solid #e8863f' : '2px solid transparent',
                    marginBottom: '-1px',
                    transition: 'color 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                Loading…
              </div>
            )}

            {/* ── Overview ── */}
            {!loading && tab === 'overview' && overview && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                  <StatCard label="Total Posts" value={fmt(overview.total_posts, 0)} />
                  <StatCard label="Total Ads" value={fmt(overview.total_ads, 0)} />
                  <StatCard label="Avg Engagement" value={pct(overview.avg_engagement_rate)} />
                  <StatCard
                    label="Platforms"
                    value={String(Object.keys(overview.platform_breakdown).length)}
                    sub={Object.keys(overview.platform_breakdown).join(', ')}
                  />
                </div>

                {/* Platform breakdown */}
                {Object.keys(overview.platform_breakdown).length > 0 && (
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '10px',
                    padding: '20px',
                    marginBottom: '16px',
                  }}>
                    <SectionTitle>Platform breakdown</SectionTitle>
                    {Object.entries(overview.platform_breakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([p, count]) => (
                        <BarRow
                          key={p}
                          label={p.charAt(0).toUpperCase() + p.slice(1)}
                          value={count}
                          max={Math.max(...Object.values(overview.platform_breakdown))}
                          color={PLATFORM_COLORS[p] || '#e8863f'}
                          sub={`${count} posts`}
                        />
                      ))}
                  </div>
                )}

                {/* Latest job */}
                {overview.latest_job && (
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>Last ingestion job</div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>
                        {overview.latest_job.posts_ingested} posts · {overview.latest_job.platforms?.join(', ')}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '4px 10px', borderRadius: '6px',
                      background: overview.latest_job.status === 'done'
                        ? 'rgba(52,211,153,0.15)'
                        : overview.latest_job.status === 'error'
                        ? 'rgba(248,113,113,0.15)'
                        : 'rgba(251,191,36,0.15)',
                      color: overview.latest_job.status === 'done'
                        ? '#34d399'
                        : overview.latest_job.status === 'error'
                        ? '#f87171'
                        : '#fbbf24',
                    }}>
                      {overview.latest_job.status}
                    </div>
                  </div>
                )}

                {overview.total_posts === 0 && (
                  <div style={{
                    textAlign: 'center', padding: '60px',
                    color: 'rgba(255,255,255,0.25)', fontSize: '13px',
                  }}>
                    No data yet for &quot;{activeKeyword}&quot; — click <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Scrape & Analyse</strong> to ingest posts
                  </div>
                )}
              </div>
            )}

            {/* ── Hook Analysis ── */}
            {!loading && tab === 'hooks' && hookData && (
              <div>
                {hookData.patterns.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>
                    No hook patterns yet — ingest posts first
                  </div>
                )}

                {hookData.patterns.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      {hookData.patterns.map(p => (
                        <div key={p.hook_category} style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: '10px',
                          padding: '16px 20px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{
                              width: '10px', height: '10px', borderRadius: '50%',
                              background: HOOK_COLORS[p.hook_category] || '#94a3b8',
                              flexShrink: 0,
                            }}/>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f0f0f8', textTransform: 'capitalize' }}>
                              {p.hook_category.replace('_', ' ')}
                            </span>
                            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                              {p.post_count} posts
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                            {[
                              ['Engagement', pct(p.avg_engagement)],
                              ['Share rate', pct(p.avg_share_rate)],
                              ['Save rate',  pct(p.avg_save_rate)],
                            ].map(([l, v]) => (
                              <div key={l}>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>{l}</div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: HOOK_COLORS[p.hook_category] || '#94a3b8' }}>{v}</div>
                              </div>
                            ))}
                          </div>
                          {p.example_hook && (
                            <div style={{
                              fontSize: '12px', color: 'rgba(255,255,255,0.45)',
                              background: 'rgba(255,255,255,0.04)',
                              padding: '8px 12px', borderRadius: '6px',
                              fontStyle: 'italic',
                              borderLeft: `3px solid ${HOOK_COLORS[p.hook_category] || '#94a3b8'}`,
                            }}>
                              &quot;{p.example_hook.slice(0, 120)}&quot;
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hookData.top_posts.length > 0 && (
                  <div>
                    <SectionTitle>Top posts by engagement</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {hookData.top_posts.map((p, i) => (
                        <div key={p.id} style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: '8px',
                          padding: '14px 16px',
                          display: 'flex', gap: '16px', alignItems: 'flex-start',
                        }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.12)', width: '28px', flexShrink: 0, paddingTop: '1px' }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                                background: `${HOOK_COLORS[p.hook_category] || '#94a3b8'}20`,
                                color: HOOK_COLORS[p.hook_category] || '#94a3b8',
                                fontWeight: 500,
                              }}>
                                {p.hook_category?.replace('_', ' ')}
                              </span>
                              <span style={{
                                fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                                background: `${PLATFORM_COLORS[p.platform] || '#e8863f'}20`,
                                color: PLATFORM_COLORS[p.platform] || '#a89ef8',
                                fontWeight: 500,
                              }}>
                                {p.platform}
                              </span>
                            </div>
                            {p.hook && (
                              <div style={{ fontSize: '13px', color: '#f0f0f8', marginBottom: '4px', fontWeight: 500 }}>
                                {p.hook.slice(0, 150)}
                              </div>
                            )}
                            {p.caption && (
                              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.caption.slice(0, 200)}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399' }}>{pct(p.engagement_rate || 0)}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{fmt(p.views || 0, 0)} views</div>
                            {p.url && (
                              <a href={p.url} target="_blank" rel="noopener noreferrer" style={{
                                fontSize: '11px', color: '#e8863f', textDecoration: 'none',
                                marginTop: '4px', display: 'block',
                              }}>
                                View →
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Content Performance ── */}
            {!loading && tab === 'content' && contentData && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* Format performance */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '10px', padding: '20px',
                }}>
                  <SectionTitle>Format performance</SectionTitle>
                  {contentData.format_performance.length === 0
                    ? <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>No data</div>
                    : contentData.format_performance.map((f, i) => (
                      <BarRow
                        key={f.format}
                        label={f.format.replace(/_/g, ' ')}
                        value={f.avg_engagement}
                        max={contentData.format_performance[0].avg_engagement}
                        color={['#e8863f','#e8863f','#a78bfa','#60a5fa','#34d399'][i % 5]}
                        sub={`${pct(f.avg_engagement)} · ${f.count} posts`}
                      />
                    ))
                  }
                </div>

                {/* Content type */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '10px', padding: '20px',
                }}>
                  <SectionTitle>Content type</SectionTitle>
                  {contentData.type_performance.length === 0
                    ? <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>No data</div>
                    : contentData.type_performance.map((t, i) => (
                      <BarRow
                        key={t.type}
                        label={t.type.replace(/_/g, ' ')}
                        value={t.avg_engagement}
                        max={contentData.type_performance[0].avg_engagement}
                        color={['#f87171','#fbbf24','#34d399','#60a5fa','#a78bfa'][i % 5]}
                        sub={`${pct(t.avg_engagement)} · ${t.count} posts`}
                      />
                    ))
                  }
                </div>

                {/* Duration buckets — full width */}
                <div style={{
                  gridColumn: '1 / -1',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '10px', padding: '20px',
                }}>
                  <SectionTitle>Engagement by video duration</SectionTitle>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                    {contentData.duration_performance.map((d, i) => (
                      <div key={d.range} style={{
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px', padding: '14px 8px',
                      }}>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: ['#e8863f','#e8863f','#34d399','#fbbf24','#f87171'][i], marginBottom: '4px' }}>
                          {pct(d.avg_engagement)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginBottom: '2px' }}>{d.range}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{d.count} posts</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Audience Insights ── */}
            {!loading && tab === 'audience' && audienceData && (
              <div>
                {audienceData.insights.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>
                    No audience insights yet — comments are analysed after ingestion
                  </div>
                )}

                {audienceData.insights.length > 0 && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }}>
                      {audienceData.insights.map((ins, i) => {
                        const style = INSIGHT_COLORS[ins.insight_type] || INSIGHT_COLORS.desire
                        return (
                          <div key={i} style={{
                            background: style.bg,
                            border: `1px solid ${style.border}`,
                            borderRadius: '10px', padding: '16px',
                          }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <span style={{
                                fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                                color: style.text, flexShrink: 0, paddingTop: '2px',
                              }}>
                                {ins.insight_type.replace('_', ' ')}
                              </span>
                              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                                {ins.evidence_count} signals
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#f0f0f8', fontWeight: 500, marginBottom: '8px' }}>
                              {ins.insight_text}
                            </div>
                            {ins.example_comment && (
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                                &quot;{ins.example_comment.slice(0, 120)}&quot;
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Intent / sentiment */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {[
                        { title: 'Comment intent', data: audienceData.intent_breakdown },
                        { title: 'Sentiment',       data: audienceData.sentiment_breakdown },
                      ].map(({ title, data }) => (
                        <div key={title} style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: '10px', padding: '20px',
                        }}>
                          <SectionTitle>{title}</SectionTitle>
                          {Object.entries(data)
                            .sort((a, b) => b[1] - a[1])
                            .map(([k, v], i) => (
                              <BarRow
                                key={k}
                                label={k.replace('_', ' ')}
                                value={v}
                                max={Math.max(...Object.values(data))}
                                color={['#e8863f','#34d399','#fbbf24','#f87171','#60a5fa','#a78bfa'][i % 6]}
                                sub={`${v}`}
                              />
                            ))}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Recommendations ── */}
            {!loading && tab === 'recommendations' && (
              <div>
                {(recsData === null || recsData.length === 0) && (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>
                    {recsData === null ? 'Loading…' : 'No recommendations yet — ingest and process posts first'}
                  </div>
                )}
                {recsData && recsData.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {recsData.map((r, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '10px', padding: '20px',
                        display: 'flex', gap: '16px',
                      }}>
                        <div style={{
                          width: '32px', height: '32px', flexShrink: 0,
                          background: ['rgba(232,134,63,0.10)','rgba(52,211,153,0.2)','rgba(251,191,36,0.2)','rgba(248,113,113,0.2)','rgba(96,165,250,0.2)'][i % 5],
                          borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '14px',
                        }}>
                          {['🎯','📹','🔥','💬','📐'][i % 5]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{
                              fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                              padding: '2px 8px', borderRadius: '4px',
                              background: 'rgba(232,134,63,0.10)', color: '#a89ef8',
                            }}>
                              {r.type}
                            </span>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f8', marginBottom: '6px' }}>
                            {r.recommendation}
                          </div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: r.example ? '10px' : 0 }}>
                            {r.rationale}
                          </div>
                          {r.example && (
                            <div style={{
                              fontSize: '12px', color: 'rgba(255,255,255,0.55)',
                              background: 'rgba(255,255,255,0.04)',
                              padding: '8px 12px', borderRadius: '6px',
                              borderLeft: '3px solid #e8863f',
                              fontStyle: 'italic',
                            }}>
                              {r.example}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: toastType === 'ok' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
          border: `1px solid ${toastType === 'ok' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
          color: toastType === 'ok' ? '#34d399' : '#f87171',
          padding: '10px 16px', borderRadius: '8px',
          fontSize: '13px', fontWeight: 500,
          zIndex: 999,
        }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { border-color: rgba(232,134,63,0.10) !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
    </div>
  )
}
