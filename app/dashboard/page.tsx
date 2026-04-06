'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../lib/supabase-client'
import AppSidebar from '../components/AppSidebar'

interface ChannelStat {
  id: string
  icon: string
  name: string
  color: string
  revenue: number
  profit: number
  spend: number
  roas: number
  orders: number
  status: 'performing' | 'monitoring' | 'needs_attention'
}

interface DashboardData {
  profitToday: number
  revenueToday: number
  ordersToday: number
  profitThisMonth: number
  revenueThisMonth: number
  avgMargin: number
  blendedRoas: number
  pendingActions: number
  activeAlerts: number
  topProducts: any[]
  insights: any[]
  leverageRatio: number
  channelStats: ChannelStat[]
}

const CHANNEL_META: Record<string, { icon: string; color: string; name: string }> = {
  ebay:       { icon: '🛒', color: '#fff0e6', name: 'eBay' },
  amazon:     { icon: '📦', color: '#fff3e6', name: 'Amazon' },
  shopify:    { icon: '🛍️', color: '#e8f1fb', name: 'Shopify' },
  tiktok_shop:{ icon: '📱', color: '#e8f5f3', name: 'TikTok Shop' },
  etsy:       { icon: '🎨', color: '#fdf3e8', name: 'Etsy' },
}

function buildChannelStats(txns: any[]): ChannelStat[] {
  const map: Record<string, { revenue: number; profit: number; adSpend: number; orders: number }> = {}
  for (const t of txns) {
    const ch = t.channel || 'other'
    if (!map[ch]) map[ch] = { revenue: 0, profit: 0, adSpend: 0, orders: 0 }
    map[ch].revenue  += Number(t.sale_price)        || 0
    map[ch].profit   += Number(t.true_profit)       || 0
    map[ch].adSpend  += Number(t.advertising_cost)  || 0
    map[ch].orders++
  }
  return Object.entries(map)
    .map(([channel, s]): ChannelStat => {
      const margin = s.revenue > 0 ? s.profit / s.revenue : 0
      const meta = CHANNEL_META[channel] || { icon: '🏪', color: '#f1f1ef', name: channel }
      const status: ChannelStat['status'] = margin > 0.2 ? 'performing' : margin > 0.1 ? 'monitoring' : 'needs_attention'
      return {
        id: channel,
        icon: meta.icon,
        name: meta.name,
        color: meta.color,
        revenue: Math.round(s.revenue * 100) / 100,
        profit:  Math.round(s.profit  * 100) / 100,
        spend:   Math.round(s.adSpend * 100) / 100,
        roas:    s.adSpend > 0 ? Math.round(s.revenue / s.adSpend * 10) / 10 : 0,
        orders:  s.orders,
        status,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
}

function buildChannelStatsFromBreakdown(breakdown: Record<string, { revenue: number; profit: number; orders: number }>): ChannelStat[] {
  return Object.entries(breakdown)
    .map(([channel, s]): ChannelStat => {
      const margin = s.revenue > 0 ? s.profit / s.revenue : 0
      const meta   = CHANNEL_META[channel] || { icon: '🏪', color: '#f1f1ef', name: channel }
      const status: ChannelStat['status'] = margin > 0.2 ? 'performing' : margin > 0.1 ? 'monitoring' : 'needs_attention'
      return {
        id: channel, icon: meta.icon, name: meta.name, color: meta.color,
        revenue: Math.round(s.revenue * 100) / 100,
        profit:  Math.round(s.profit  * 100) / 100,
        spend: 0, roas: 0,
        orders: s.orders,
        status,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
}

const STATUS_COLOR = { performing: '#0f7b6c', needs_attention: '#c9372c', monitoring: '#d9730d' }
const STATUS_BG    = { performing: '#e8f5f3', needs_attention: '#fce8e6', monitoring: '#fdf3e8' }
const STATUS_LABEL = { performing: '● Performing', needs_attention: '● Needs fix', monitoring: '● Monitor' }

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [agentRunning, setAgentRunning] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const [statsRes, insightsRes] = await Promise.all([
        fetch('/api/dashboard/stats').then(r => r.json()),
        supabase.from('ai_insights').select('*').eq('user_id', user.id).eq('actioned', false)
          .order('created_at', { ascending: false }).limit(4),
      ])

      const s = statsRes
      setData({
        profitToday:      s.profitToday      || 0,
        revenueToday:     s.revenueToday     || 0,
        ordersToday:      s.ordersToday      || 0,
        profitThisMonth:  s.profitMonth      || 0,
        revenueThisMonth: s.revenueMonth     || 0,
        avgMargin:        s.avgMargin        || 0,
        blendedRoas:      s.blendedRoas      || 0,
        pendingActions:   s.pendingActions   || 0,
        activeAlerts:     s.activeAlerts     || 0,
        topProducts:      s.topProducts      || [],
        insights:         insightsRes.data   || [],
        leverageRatio:    0,
        channelStats:     buildChannelStatsFromBreakdown(s.channelBreakdown || {}),
      })
    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function askClaude() {
    if (!chatInput.trim()) return
    setChatLoading(true)
    setChatResponse('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: chatInput }),
      })
      const json = await res.json()
      setChatResponse(json.answer || 'Unable to generate response')
    } catch {
      setChatResponse('Error connecting to AI. Please try again.')
    } finally {
      setChatLoading(false)
    }
  }

  async function runAgent() {
    setAgentRunning(true)
    try {
      await fetch('/api/agent', { method: 'POST' })
      await loadDashboard()
    } catch (error) {
      console.error('Agent error:', error)
    } finally {
      setAgentRunning(false)
    }
  }

  const f  = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fp = (n: number) => `${n.toFixed(1)}%`

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', background: '#f7f7f5' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#191919' }}>Auxio</div>
        <div style={{ fontSize: '14px', color: '#787774' }}>Loading your intelligence engine...</div>
      </div>
    </div>
  )

  const channels = data?.channelStats || []

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f7f7f5', fontSize: '14px', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      <main style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* TOPBAR */}
        <div style={{ height: '48px', background: 'white', borderBottom: '1px solid #e8e8e5', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px', position: 'sticky', top: 0, zIndex: 50 }}>
          <span style={{ fontSize: '14px', fontWeight: 600, flex: 1, color: '#191919' }}>Command Centre</span>
          {(data?.leverageRatio ?? 0) > 0 && (
            <span style={{ fontSize: '12px', color: '#0f7b6c', fontWeight: 600, background: '#e8f5f3', padding: '4px 10px', borderRadius: '100px' }}>
              {data!.leverageRatio.toFixed(1)}× leverage ratio
            </span>
          )}
          <button
            onClick={runAgent}
            disabled={agentRunning}
            style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '5px', padding: '7px 14px', fontSize: '12px', fontWeight: 500, cursor: agentRunning ? 'wait' : 'pointer', opacity: agentRunning ? 0.7 : 1 }}
          >
            {agentRunning ? '⚡ Running...' : '⚡ Run Agent'}
          </button>
        </div>

        <div style={{ padding: '24px' }}>

          {/* GREETING */}
          <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px', letterSpacing: '-0.02em', color: '#191919' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.email?.split('@')[0] || 'there'} 👋
          </div>
          <div style={{ fontSize: '13px', color: '#787774', marginBottom: '20px' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {/* HERO STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'True Profit Today',  value: f(data?.profitToday  || 0), sub: '↑ updated live' },
              { label: 'Revenue Today',      value: f(data?.revenueToday || 0), sub: 'Across all channels' },
              { label: 'Orders Today',       value: String(data?.ordersToday || 0), sub: 'Across all channels' },
              { label: 'Avg Margin 30d',     value: fp(data?.avgMargin   || 0), sub: 'After all costs' },
              { label: 'Active Alerts',      value: String(data?.activeAlerts || 0), sub: `${data?.pendingActions || 0} pending actions` },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '16px 18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>{stat.label}</div>
                <div style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '6px', color: '#191919' }}>{stat.value}</div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: '#9b9b98' }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* AI AGENT BANNER */}
          {(data?.pendingActions ?? 0) > 0 && (
            <Link href="/agent" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#191919', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', cursor: 'pointer' }}>
                <div style={{ fontSize: '20px' }}>🤖</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '3px' }}>
                    AI Agent has {data!.pendingActions} action{data!.pendingActions !== 1 ? 's' : ''} waiting for approval
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    Review and approve recommended changes to your campaigns and listings
                  </div>
                </div>
                <div style={{ background: 'white', color: '#191919', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>
                  Review actions →
                </div>
              </div>
            </Link>
          )}

          {/* MAIN GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '12px', marginBottom: '12px' }}>

            {/* CHANNEL TABLE */}
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8e8e5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>Channel Performance — Last 30 days</span>
                <Link href="/channels" style={{ fontSize: '12px', color: '#2383e2', cursor: 'pointer', textDecoration: 'none' }}>Manage channels →</Link>
              </div>
              {channels.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Channel', 'Orders', 'Ad Spend', 'Revenue', 'ROAS', 'True Profit', 'Status'].map((h, i) => (
                        <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '9px 16px', fontSize: '10px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e8e8e5', background: '#f7f7f5' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {channels.map(ch => (
                      <tr key={ch.id}>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e5' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '30px', height: '30px', background: ch.color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>{ch.icon}</div>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#191919' }}>{ch.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e5', textAlign: 'right', fontSize: '13px', color: '#787774' }}>{ch.orders}</td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e5', textAlign: 'right', fontSize: '13px', color: '#787774' }}>{f(ch.spend)}</td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e5', textAlign: 'right', fontSize: '13px', color: '#191919' }}>{f(ch.revenue)}</td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e5', textAlign: 'right', fontSize: '13px', color: '#191919' }}>{ch.roas > 0 ? `${ch.roas}×` : '—'}</td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e5', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#0f7b6c' }}>{f(ch.profit)}</td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e5', textAlign: 'right' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: STATUS_BG[ch.status], color: STATUS_COLOR[ch.status] }}>
                            {STATUS_LABEL[ch.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>🔗</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#191919', marginBottom: '6px' }}>No channels connected yet</div>
                  <div style={{ fontSize: '13px', color: '#787774', marginBottom: '16px' }}>Connect eBay, Amazon, or Shopify to start seeing real data</div>
                  <Link href="/channels" style={{ background: '#191919', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}>
                    Connect a channel →
                  </Link>
                </div>
              )}
            </div>

            {/* RIGHT PANEL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* LEVERAGE RATIO */}
              <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Your Leverage Ratio</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '44px', fontWeight: 700, letterSpacing: '-0.04em', color: '#0f7b6c', lineHeight: 1 }}>
                    {(data?.leverageRatio ?? 0) > 0 ? `${data!.leverageRatio.toFixed(1)}×` : '—'}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#787774', marginBottom: '12px' }}>Value returned per £1 paid to Auxio</div>
                <div style={{ fontSize: '12px', color: '#9b9b98', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "Your bank lends your £1 deposit out 9 times. Auxio returns {(data?.leverageRatio ?? 0) > 0 ? data!.leverageRatio.toFixed(1) : '9.4'}× for every £1 you pay."
                </div>
              </div>

              {/* AI INSIGHTS */}
              <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', overflow: 'hidden', flex: 1 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8e8e5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>AI Insights</span>
                  <span style={{ background: '#fce8e6', color: '#c9372c', fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px' }}>{data?.insights?.length || 0} active</span>
                </div>
                <div style={{ padding: '8px' }}>
                  {data?.insights?.length ? data.insights.map((insight: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px', borderRadius: '7px', marginBottom: '2px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: insight.priority === 'high' ? '#c9372c' : insight.priority === 'medium' ? '#d9730d' : '#2383e2', flexShrink: 0, marginTop: '4px' }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#191919', marginBottom: '3px' }}>{insight.title}</div>
                        <div style={{ fontSize: '12px', color: '#787774', lineHeight: 1.4 }}>{insight.body?.substring(0, 80)}...</div>
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9b9b98', fontSize: '13px' }}>
                      Connect a channel to generate AI insights
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>

            {/* TOP PRODUCTS */}
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e8e8e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>Top Products</span>
                <Link href="/inventory" style={{ fontSize: '12px', color: '#2383e2', textDecoration: 'none' }}>View all →</Link>
              </div>
              {data?.topProducts?.length ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Product', 'Margin', 'Signal'].map((h, i) => (
                        <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '8px 14px', fontSize: '10px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e8e8e5', background: '#f7f7f5' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p: any) => (
                      <tr key={p.sku || p.title}>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid #e8e8e5', fontSize: '12px', fontWeight: 500, color: '#191919', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title || p.sku}</td>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid #e8e8e5', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: (p.margin || p.avg_margin_90d || 0) > 20 ? '#0f7b6c' : (p.margin || p.avg_margin_90d || 0) > 15 ? '#d9730d' : '#c9372c' }}>
                          {fp(p.margin || p.avg_margin_90d || 0)}
                        </td>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid #e8e8e5', textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', background: (p.margin||0) > 20 ? '#e8f5f3' : (p.margin||0) > 10 ? '#e8f1fb' : '#fdf3e8', color: (p.margin||0) > 20 ? '#0f7b6c' : (p.margin||0) > 10 ? '#2383e2' : '#d9730d' }}>
                            {(p.margin||0) > 20 ? 'scale' : (p.margin||0) > 10 ? 'hold' : 'review'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9b9b98', fontSize: '13px' }}>
                  Connect eBay or Amazon to see product intelligence
                </div>
              )}
            </div>

            {/* MONTHLY SUMMARY */}
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px', color: '#191919' }}>This Month</div>
              {[
                { label: 'Revenue',      value: f(data?.revenueThisMonth || 0) },
                { label: 'True Profit',  value: f(data?.profitThisMonth  || 0), green: true },
                { label: 'Avg Margin',   value: fp(data?.avgMargin       || 0) },
                { label: 'Blended ROAS', value: `${(data?.blendedRoas    || 0).toFixed(1)}×` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f7f7f5' }}>
                  <span style={{ fontSize: '13px', color: '#787774' }}>{row.label}</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: row.green ? '#0f7b6c' : '#191919' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* ASK CLAUDE */}
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e8e8e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>Ask Claude</span>
                <span style={{ fontSize: '11px', color: '#9b9b98' }}>Knows your full store</span>
              </div>
              <div style={{ padding: '14px' }}>
                {chatResponse && (
                  <div style={{ background: '#f7f7f5', borderRadius: '6px', padding: '10px', fontSize: '12px', color: '#191919', lineHeight: 1.6, marginBottom: '10px', maxHeight: '120px', overflowY: 'auto' }}>
                    {chatResponse}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                  {['Why did my ACOS spike?', 'Which products to restock?', 'Show my worst margin products'].map(q => (
                    <div key={q} onClick={() => setChatInput(q)} style={{ background: '#f7f7f5', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: '#787774', cursor: 'pointer' }}>{q}</div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && askClaude()}
                    placeholder="Ask anything..."
                    style={{ flex: 1, background: '#f7f7f5', border: '1px solid #e8e8e5', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#191919', outline: 'none' }}
                  />
                  <button
                    onClick={askClaude}
                    disabled={chatLoading}
                    style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', cursor: chatLoading ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif' }}
                  >
                    {chatLoading ? '...' : '→'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
