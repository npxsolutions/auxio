'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase-client'
import { useRouter } from 'next/navigation'

interface DashboardData {
  profitToday: number
  revenueToday: number
  ordersToday: number
  profitThisMonth: number
  revenueThisMonth: number
  avgMargin: number
  blendedRoas: number
  adWasteSaved: number
  pendingActions: number
  activeAlerts: number
  topProducts: any[]
  insights: any[]
  leverageRatio: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // Load command centre data
      const { data: commandCentre } = await supabase
        .from('command_centre')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Load top products
      const { data: products } = await supabase
        .from('product_intelligence')
        .select('*')
        .eq('user_id', user.id)
        .order('avg_margin_90d', { ascending: false })
        .limit(5)

      // Load insights
      const { data: insights } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('actioned', false)
        .order('created_at', { ascending: false })
        .limit(4)

      // Load leverage ratio
      const { data: leverage } = await supabase
        .from('leverage_analysis')
        .select('leverage_ratio')
        .eq('user_id', user.id)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single()

      setData({
        profitToday: commandCentre?.profit_today || 0,
        revenueToday: commandCentre?.revenue_today || 0,
        ordersToday: commandCentre?.orders_today || 0,
        profitThisMonth: commandCentre?.profit_this_month || 0,
        revenueThisMonth: commandCentre?.revenue_this_month || 0,
        avgMargin: commandCentre?.avg_margin_30d || 0,
        blendedRoas: commandCentre?.blended_roas_30d || 0,
        adWasteSaved: 0,
        pendingActions: commandCentre?.pending_actions || 0,
        activeAlerts: commandCentre?.active_alerts || 0,
        topProducts: products || [],
        insights: insights || [],
        leverageRatio: leverage?.leverage_ratio || 0,
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
    try {
      await fetch('/api/agent', { method: 'POST' })
      await loadDashboard()
    } catch (error) {
      console.error('Agent error:', error)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const f = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fp = (n: number) => `${n.toFixed(1)}%`

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', background: '#f7f7f5' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Auxio</div>
        <div style={{ fontSize: '14px', color: '#787774' }}>Loading your intelligence engine...</div>
      </div>
    </div>
  )

  const channels = [
    { id: 'ebay', icon: '🛒', name: 'eBay', status: 'performing', roas: 3.8, spend: 34, revenue: 271, profit: 115, color: '#fff0e6' },
    { id: 'amazon', icon: '📦', name: 'Amazon', status: 'performing', roas: 4.2, spend: 124, revenue: 521, profit: 287, color: '#fff3e6' },
    { id: 'shopify', icon: '🛍️', name: 'Shopify', status: 'monitoring', roas: 2.8, spend: 45, revenue: 126, profit: 48, color: '#e8f1fb' },
  ]

  const statusColor = (s: string) => s === 'performing' ? '#0f7b6c' : s === 'needs_attention' ? '#c9372c' : '#d9730d'
  const statusBg = (s: string) => s === 'performing' ? '#e8f5f3' : s === 'needs_attention' ? '#fce8e6' : '#fdf3e8'
  const statusLabel = (s: string) => s === 'performing' ? '● Performing' : s === 'needs_attention' ? '● Needs fix' : '● Monitor'

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f7f7f5', fontSize: '14px', WebkitFontSmoothing: 'antialiased' }}>

      {/* SIDEBAR */}
      <aside style={{ width: '220px', background: 'white', borderRight: '1px solid #e8e8e5', position: 'fixed', top: 0, left: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #e8e8e5', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: '#191919', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 700 }}>A</div>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Auxio</span>
        </div>

        <nav style={{ padding: '8px', flex: 1 }}>
          {[
            { icon: '⚡', label: 'Command Centre', active: true },
            { icon: '📊', label: 'Channels' },
            { icon: '📦', label: 'Products' },
            { icon: '💰', label: 'True Profit' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px', borderRadius: '5px', cursor: 'pointer', color: item.active ? '#191919' : '#787774', background: item.active ? '#f1f1ef' : 'transparent', fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>
              <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}

          <div style={{ height: '1px', background: '#e8e8e5', margin: '6px 8px' }}></div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 8px 4px' }}>Advertising</div>

          {[
            { icon: '🎯', label: 'PPC Manager' },
            { icon: '🔍', label: 'Keywords' },
            { icon: '📈', label: 'Attribution' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px', borderRadius: '5px', cursor: 'pointer', color: '#787774', fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>
              <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}

          <div style={{ height: '1px', background: '#e8e8e5', margin: '6px 8px' }}></div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 8px 4px' }}>AI</div>

          {[
            { icon: '🤖', label: 'AI Agent', badge: data?.pendingActions || 0 },
            { icon: '💬', label: 'AI Chat' },
            { icon: '💡', label: 'Insights', badge: data?.activeAlerts || 0 },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px', borderRadius: '5px', cursor: 'pointer', color: '#787774', fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>
              <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {(item.badge ?? 0) > 0 && <span style={{ background: '#c9372c', color: 'white', fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '8px' }}>{item.badge}</span>}
            </div>
          ))}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid #e8e8e5' }}>
          <div onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '5px', cursor: 'pointer' }}>
            <div style={{ width: '26px', height: '26px', background: '#2383e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 600 }}>
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{user?.email?.split('@')[0] || 'User'}</div>
              <div style={{ fontSize: '11px', color: '#9b9b98' }}>Growth Plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* TOPBAR */}
        <div style={{ height: '48px', background: 'white', borderBottom: '1px solid #e8e8e5', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px', position: 'sticky', top: 0, zIndex: 50 }}>
          <span style={{ fontSize: '14px', fontWeight: 600, flex: 1 }}>Command Centre</span>
          {data?.leverageRatio > 0 && (
            <span style={{ fontSize: '12px', color: '#0f7b6c', fontWeight: 600, background: '#e8f5f3', padding: '4px 10px', borderRadius: '100px' }}>
              {data.leverageRatio.toFixed(1)}× leverage ratio
            </span>
          )}
          <button onClick={runAgent} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '5px', padding: '7px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
            ⚡ Run Agent
          </button>
        </div>

        <div style={{ padding: '24px' }}>

          {/* GREETING */}
          <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px', letterSpacing: '-0.02em' }}>
            Good morning, {user?.email?.split('@')[0] || 'there'} 👋
          </div>
          <div style={{ fontSize: '13px', color: '#787774', marginBottom: '20px' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {/* HERO STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'True Profit Today', value: f(data?.profitToday || 0), change: '↑ 12% vs yesterday', up: true },
              { label: 'Revenue Today', value: f(data?.revenueToday || 0), change: '↑ 8% vs yesterday', up: true },
              { label: 'Orders Today', value: String(data?.ordersToday || 0), change: 'Across all channels', up: null },
              { label: 'Avg Margin 30d', value: fp(data?.avgMargin || 0), change: 'After all costs', up: null },
              { label: 'Active Alerts', value: String(data?.activeAlerts || 0), change: `${data?.pendingActions || 0} pending actions`, up: null },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '16px 18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>{stat.label}</div>
                <div style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '6px' }}>{stat.value}</div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: stat.up === true ? '#0f7b6c' : stat.up === false ? '#c9372c' : '#9b9b98' }}>{stat.change}</div>
              </div>
            ))}
          </div>

          {/* AI BANNER */}
          {data && data.pendingActions > 0 && (
            <div style={{ background: '#191919', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', cursor: 'pointer' }}>
              <div style={{ fontSize: '20px' }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '3px' }}>
                  AI Agent has {data.pendingActions} actions waiting for approval
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  Review and approve recommended changes to your campaigns and listings
                </div>
              </div>
              <div style={{ background: 'white', color: '#191919', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                Review actions →
              </div>
            </div>
          )}

          {/* MAIN GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '12px', marginBottom: '12px' }}>

            {/* CHANNEL TABLE */}
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8e8e5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Channel Performance</span>
                <span style={{ fontSize: '12px', color: '#2383e2', cursor: 'pointer' }}>View all analytics →</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Channel', 'Spend', 'Revenue', 'ROAS', 'True Profit', 'Status'].map((h, i) => (
                      <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '9px 16px', fontSize: '10px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e8e8e5', background: '#f7f7f5' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {channels.map(ch => (
                    <tr key={ch.id} style={{ cursor: 'pointer' }} onClick={() => setActiveChannel(ch.id)}>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e5' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '30px', height: '30px', background: ch.color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>{ch.icon}</div>
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>{ch.name}</span>
                        </div>
                      </td>
                      {[`£${ch.spend}`, `£${ch.revenue}`, `${ch.roas}×`, `£${ch.profit}`].map((val, i) => (
                        <td key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e5', textAlign: 'right', fontSize: '13px', fontWeight: i === 3 ? 600 : 400, color: i === 3 ? '#0f7b6c' : '#191919' }}>{val}</td>
                      ))}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e5', textAlign: 'right' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: statusBg(ch.status), color: statusColor(ch.status) }}>
                          {statusLabel(ch.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* RIGHT PANEL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* LEVERAGE RATIO */}
              <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Your Leverage Ratio</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '44px', fontWeight: 700, letterSpacing: '-0.04em', color: '#0f7b6c', lineHeight: 1 }}>
                    {data?.leverageRatio ? `${data.leverageRatio.toFixed(1)}×` : '—'}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#787774', marginBottom: '12px' }}>
                  Value returned per £1 paid to Auxio
                </div>
                <div style={{ fontSize: '12px', color: '#9b9b98', fontStyle: 'italic' }}>
                  "Your bank lends your £1 deposit out 9 times. Auxio returns {data?.leverageRatio?.toFixed(1) || '9.4'}× for every £1 you pay."
                </div>
              </div>

              {/* ALERTS */}
              <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', overflow: 'hidden', flex: 1 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8e8e5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>AI Insights</span>
                  <span style={{ background: '#fce8e6', color: '#c9372c', fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px' }}>{data?.insights?.length || 0} active</span>
                </div>
                <div style={{ padding: '8px' }}>
                  {data?.insights?.length ? data.insights.map((insight: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px', borderRadius: '7px', cursor: 'pointer', marginBottom: '2px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: insight.priority === 'high' ? '#c9372c' : insight.priority === 'medium' ? '#d9730d' : '#2383e2', flexShrink: 0, marginTop: '4px' }}></div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '3px' }}>{insight.title}</div>
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
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Top Products</span>
                <span style={{ fontSize: '12px', color: '#2383e2', cursor: 'pointer' }}>View all →</span>
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
                      <tr key={p.sku}>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid #e8e8e5', fontSize: '12px', fontWeight: 500 }}>{p.sku}</td>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid #e8e8e5', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: p.avg_margin_90d > 20 ? '#0f7b6c' : p.avg_margin_90d > 15 ? '#d9730d' : '#c9372c' }}>
                          {fp(p.avg_margin_90d || 0)}
                        </td>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid #e8e8e5', textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', background: p.margin_signal === 'scale' ? '#e8f5f3' : p.margin_signal === 'hold' ? '#e8f1fb' : '#fdf3e8', color: p.margin_signal === 'scale' ? '#0f7b6c' : p.margin_signal === 'hold' ? '#2383e2' : '#d9730d' }}>
                            {p.margin_signal || 'hold'}
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
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>This Month</div>
              {[
                { label: 'Revenue', value: f(data?.revenueThisMonth || 0) },
                { label: 'True Profit', value: f(data?.profitThisMonth || 0), green: true },
                { label: 'Avg Margin', value: fp(data?.avgMargin || 0) },
                { label: 'Blended ROAS', value: `${(data?.blendedRoas || 0).toFixed(1)}×` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f7f7f5' }}>
                  <span style={{ fontSize: '13px', color: '#787774' }}>{row.label}</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: row.green ? '#0f7b6c' : '#191919' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* AI CHAT */}
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e8e8e5', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Ask Claude</span>
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
                  <button onClick={askClaude} disabled={chatLoading} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
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
