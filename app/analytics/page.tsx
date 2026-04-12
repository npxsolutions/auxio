'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'
import { createClient } from '../lib/supabase-client'

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d' | '1y' | 'all'

interface AnalyticsData {
  period: string
  totals: { revenue: number; profit: number; orders: number; margin: number }
  comparison: { revenueChange: number | null; profitChange: number | null; ordersChange: number | null }
  byChannel: { channel: string; revenue: number; profit: number; orders: number; margin: number }[]
  timeSeries: { date: string; revenue: number; profit: number; orders: number }[]
  topSkus: { sku: string; title: string; revenue: number; profit: number; orders: number; margin: number }[]
  listingHealth: { total: number; published: number; partial: number; draft: number }
  platformStats: { channels: number; rules: number; totalRules: number }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtGBP(n: number, decimals = 0) {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function marginColor(pct: number): { color: string; bg: string; border: string } {
  if (pct >= 20) return { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' }
  if (pct >= 10) return { color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
  return { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
}

function changeBadge(val: number | null) {
  if (val === null) return null
  const pos = val >= 0
  return {
    label: `${pos ? '+' : ''}${val.toFixed(1)}%`,
    color: pos ? '#059669' : '#dc2626',
    bg:    pos ? '#ecfdf5' : '#fef2f2',
  }
}

const CHANNEL_PILL: Record<string, { bg: string; color: string; border: string }> = {
  ebay:    { bg: '#fff3f3', color: '#c0392b', border: '#fecaca' },
  amazon:  { bg: '#fffbf0', color: '#b45309', border: '#fde68a' },
  shopify: { bg: '#f0fdf4', color: '#15803d', border: '#a7f3d0' },
}

function channelPill(ch: string) {
  return CHANNEL_PILL[ch.toLowerCase()] || { bg: '#f5f3ef', color: '#6b6e87', border: '#e8e5df' }
}

// Simple sparkline SVG from time-series data
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const W = 80, H = 28
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * H
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [period, setPeriod]   = useState<Period>('30d')
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // Auth guard
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/analytics?period=${period}`)
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { load() }, [load])

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#9496b0',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  const sparkRevenue = (data?.timeSeries || []).map(d => d.revenue)
  const sparkProfit  = (data?.timeSeries || []).map(d => d.profit)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <AppSidebar />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', margin: 0, letterSpacing: '-0.02em' }}>
              Analytics
            </h1>
            <p style={{ fontSize: 13, color: '#6b6e87', margin: '4px 0 0', lineHeight: 1.5 }}>
              Revenue, profit, and channel performance from your transaction history.
            </p>
          </div>

          {/* Period tabs */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {loading && (
              <div style={{ fontSize: 12, color: '#9496b0', marginRight: 8 }}>Refreshing…</div>
            )}
            <div style={{
              display: 'flex', background: 'white',
              border: '1px solid #e8e5df', borderRadius: 10, padding: 3, gap: 2,
            }}>
              {(['7d', '30d', '90d', '1y', 'all'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: 'none',
                    fontSize: 13, fontWeight: period === p ? 600 : 400,
                    background: period === p ? '#5b52f5' : 'transparent',
                    color: period === p ? 'white' : '#6b6e87',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#dc2626' }}>
            {error} — <button onClick={load} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>Retry</button>
          </div>
        )}

        {!data && !loading && !error && (
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#6b6e87' }}>No transaction data yet — sales will appear here once orders are synced.</div>
          </div>
        )}

        {data && (
          <>
            {/* ── KPI cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Revenue',      value: fmtGBP(data.totals.revenue), change: data.comparison.revenueChange, spark: sparkRevenue, sparkColor: '#5b52f5' },
                { label: 'Net Profit',   value: fmtGBP(data.totals.profit),  change: data.comparison.profitChange,  spark: sparkProfit,  sparkColor: '#059669' },
                { label: 'Orders',       value: String(data.totals.orders),   change: data.comparison.ordersChange,  spark: null, sparkColor: '' },
                { label: 'Avg Margin',   value: `${data.totals.margin.toFixed(1)}%`, change: null, spark: null, sparkColor: '' },
              ].map(kpi => {
                const badge = changeBadge(kpi.change)
                return (
                  <div key={kpi.label} style={{
                    background: 'white', border: '1px solid #e8e5df', borderRadius: 12,
                    padding: '18px 20px',
                  }}>
                    <div style={{ ...labelStyle, marginBottom: 10 }}>{kpi.label}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1b22', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {kpi.value}
                      </div>
                      {kpi.spark && kpi.spark.length > 1 && (
                        <Sparkline data={kpi.spark} color={kpi.sparkColor} />
                      )}
                    </div>
                    {badge && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        marginTop: 10,
                        background: badge.bg, color: badge.color,
                        fontSize: 11, fontWeight: 600,
                        padding: '3px 8px', borderRadius: 100,
                      }}>
                        {(kpi.change ?? 0) >= 0
                          ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7L5 3l3 4"/></svg>
                          : <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3L5 7l3-4"/></svg>
                        }
                        {badge.label} vs prev period
                      </div>
                    )}
                    {!badge && (
                      <div style={{ fontSize: 11, color: '#9496b0', marginTop: 10 }}>
                        {kpi.label === 'Avg Margin' ? 'blended across all channels' : 'no previous period data'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── Channel breakdown ── */}
            {data.byChannel.length > 0 && (
              <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e5df' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22' }}>Revenue by Channel</div>
                  <div style={{ fontSize: 12, color: '#6b6e87', marginTop: 2 }}>Breakdown for the selected period</div>
                </div>

                {/* Channel bars */}
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.byChannel.map(ch => {
                    const maxRev = Math.max(...data.byChannel.map(c => c.revenue))
                    const widthPct = maxRev > 0 ? (ch.revenue / maxRev) * 100 : 0
                    const pill = channelPill(ch.channel)
                    const mc = marginColor(ch.margin)
                    return (
                      <div key={ch.channel}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              background: pill.bg, color: pill.color, border: `1px solid ${pill.border}`,
                              borderRadius: 100, fontSize: 11, fontWeight: 600, padding: '2px 9px',
                            }}>
                              {ch.channel}
                            </span>
                            <span style={{ fontSize: 12, color: '#6b6e87' }}>{ch.orders} orders</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{
                              background: mc.bg, color: mc.color, border: `1px solid ${mc.border}`,
                              borderRadius: 100, fontSize: 11, fontWeight: 700, padding: '2px 8px',
                            }}>
                              {ch.margin.toFixed(1)}% margin
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1b22' }}>{fmtGBP(ch.revenue)}</span>
                          </div>
                        </div>
                        <div style={{ background: '#f5f3ef', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                          <div style={{
                            width: `${widthPct}%`, height: '100%',
                            background: 'linear-gradient(90deg, #5b52f5, #7c6af7)',
                            borderRadius: 6, transition: 'width 0.4s ease',
                          }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

              {/* ── Top SKUs ── */}
              {data.topSkus.length > 0 && (
                <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e5df' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22' }}>Top SKUs by Profit</div>
                    <div style={{ fontSize: 12, color: '#6b6e87', marginTop: 2 }}>Best-performing products this period</div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#faf9f7' }}>
                        {['Product', 'Revenue', 'Margin', 'Orders'].map(col => (
                          <th key={col} style={{
                            padding: '8px 14px',
                            textAlign: col === 'Product' ? 'left' : 'right',
                            fontSize: 10, fontWeight: 700, color: '#9496b0',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            borderBottom: '1px solid #e8e5df',
                          }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.topSkus.slice(0, 8).map((sku, idx) => {
                        const mc = marginColor(sku.margin)
                        return (
                          <tr key={sku.sku} style={{ borderBottom: idx < data.topSkus.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1b22', lineHeight: 1.2, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {sku.title}
                              </div>
                              <div style={{ fontSize: 10, color: '#9496b0', marginTop: 1 }}>{sku.sku}</div>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#1a1b22' }}>{fmtGBP(sku.revenue)}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <span style={{
                                background: mc.bg, color: mc.color, border: `1px solid ${mc.border}`,
                                borderRadius: 100, fontSize: 10, fontWeight: 700, padding: '1px 6px',
                              }}>
                                {sku.margin.toFixed(1)}%
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#6b6e87' }}>{sku.orders}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Platform health ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Listing health */}
                <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22', marginBottom: 14 }}>Listing Health</div>
                  {[
                    { label: 'Published',    value: data.listingHealth.published, color: '#059669', bg: '#ecfdf5' },
                    { label: 'Partial',      value: data.listingHealth.partial,   color: '#d97706', bg: '#fffbeb' },
                    { label: 'Draft',        value: data.listingHealth.draft,     color: '#9496b0', bg: '#f5f3ef' },
                  ].map(item => {
                    const pct = data.listingHealth.total > 0 ? (item.value / data.listingHealth.total) * 100 : 0
                    return (
                      <div key={item.label} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: '#6b6e87' }}>{item.label}</span>
                          <span style={{ fontWeight: 600, color: '#1a1b22' }}>{item.value} <span style={{ fontWeight: 400, color: '#9496b0' }}>({pct.toFixed(0)}%)</span></span>
                        </div>
                        <div style={{ background: '#f5f3ef', borderRadius: 4, height: 6 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: 4 }}/>
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ fontSize: 11, color: '#9496b0', marginTop: 6, paddingTop: 10, borderTop: '1px solid #f0ede8' }}>
                    {data.listingHealth.total} total listings
                  </div>
                </div>

                {/* Platform stats */}
                <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22', marginBottom: 14 }}>Platform</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Active Channels', value: data.platformStats.channels },
                      { label: 'Active Rules',    value: `${data.platformStats.rules}/${data.platformStats.totalRules}` },
                    ].map(stat => (
                      <div key={stat.label} style={{ background: '#f5f3ef', borderRadius: 8, padding: '12px 14px' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1b22', letterSpacing: '-0.02em' }}>{stat.value}</div>
                        <div style={{ fontSize: 11, color: '#9496b0', marginTop: 2 }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Time series mini chart ── */}
            {data.timeSeries.length > 1 && (
              <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22', marginBottom: 4 }}>Daily Revenue Trend</div>
                <div style={{ fontSize: 12, color: '#6b6e87', marginBottom: 16 }}>
                  {data.timeSeries[0].date} → {data.timeSeries[data.timeSeries.length - 1].date}
                </div>

                {/* SVG bar chart */}
                {(() => {
                  const maxRev = Math.max(...data.timeSeries.map(d => d.revenue))
                  const H = 60, barW = Math.max(4, Math.floor(800 / data.timeSeries.length) - 2)
                  return (
                    <div style={{ overflowX: 'auto' }}>
                      <svg
                        width={Math.max(800, data.timeSeries.length * (barW + 2))}
                        height={H + 20}
                        viewBox={`0 0 ${Math.max(800, data.timeSeries.length * (barW + 2))} ${H + 20}`}
                      >
                        {data.timeSeries.map((d, i) => {
                          const barH = maxRev > 0 ? (d.revenue / maxRev) * H : 0
                          const x = i * (barW + 2)
                          return (
                            <g key={d.date}>
                              <rect
                                x={x} y={H - barH}
                                width={barW} height={barH}
                                fill="#5b52f5" opacity="0.7" rx="2"
                              />
                              <rect
                                x={x} y={H - (maxRev > 0 ? (d.profit / maxRev) * H : 0)}
                                width={barW} height={maxRev > 0 ? (d.profit / maxRev) * H : 0}
                                fill="#059669" opacity="0.85" rx="2"
                              />
                            </g>
                          )
                        })}
                      </svg>
                    </div>
                  )
                })()}

                <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b6e87' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: '#5b52f5', opacity: 0.7 }}/>
                    Revenue
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b6e87' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: '#059669', opacity: 0.85 }}/>
                    Profit
                  </div>
                </div>
              </div>
            )}

            {data.timeSeries.length === 0 && !loading && (
              <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '32px', textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 14, color: '#6b6e87' }}>No transactions in this period. Try a longer date range.</div>
              </div>
            )}
          </>
        )}

        {loading && !data && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 13, color: '#9496b0' }}>Loading analytics…</div>
          </div>
        )}

      </main>
    </div>
  )
}
