'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../lib/supabase-client'
import AppSidebar from '../components/AppSidebar'
import TourTrigger from '../components/TourTrigger'
import { useTour } from '../lib/tours'

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
  errors?: number
  lastSynced?: string
  syncing?: boolean
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

const STATUS_COLOR = { performing: '#059669', needs_attention: '#dc2626', monitoring: '#d97706' }
const STATUS_BG    = { performing: '#ecfdf5', needs_attention: '#fef2f2', monitoring: '#fffbeb' }
const STATUS_ICON  = { performing: '●', needs_attention: '⚠', monitoring: '↻' }
const STATUS_LABEL = { performing: 'Live', needs_attention: 'Errors', monitoring: 'Syncing' }

const CARD_STYLE: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e8e5df',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
}

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono), ui-monospace, monospace',
}

function ChannelCard({
  ch,
  onSyncNow,
  onErrorClick,
}: {
  ch: ChannelStat
  onSyncNow: (id: string) => void
  onErrorClick: (id: string) => void
}) {
  const f = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const [hovered, setHovered] = useState(false)
  const [syncHovered, setSyncHovered] = useState(false)

  return (
    <div
      style={{
        ...CARD_STYLE,
        padding: '20px',
        minWidth: '240px',
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'box-shadow 0.15s',
        boxShadow: hovered
          ? '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)'
          : '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: ch.color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            {ch.icon}
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1b22' }}>{ch.name}</span>
        </div>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '100px',
          fontSize: '11px',
          fontWeight: 600,
          background: STATUS_BG[ch.status],
          color: STATUS_COLOR[ch.status],
        }}>
          {STATUS_ICON[ch.status]} {STATUS_LABEL[ch.status]}
        </span>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {[
          { label: 'Revenue', value: f(ch.revenue) },
          { label: 'Orders',  value: String(ch.orders) },
          { label: 'ROAS',    value: ch.roas > 0 ? `${ch.roas}×` : '—' },
        ].map(m => (
          <div key={m.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1b22', lineHeight: 1, ...MONO }}>{m.value}</div>
            <div style={{ fontSize: '10px', color: '#9496b0', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {(ch.errors ?? 0) > 0 && (
            <button
              onClick={() => onErrorClick(ch.id)}
              style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
            >
              ⚠ {ch.errors} error{ch.errors !== 1 ? 's' : ''}
            </button>
          )}
          {ch.lastSynced && (
            <span style={{ fontSize: '11px', color: '#9496b0' }}>
              {ch.lastSynced}
            </span>
          )}
        </div>
        <button
          onClick={() => onSyncNow(ch.id)}
          disabled={ch.syncing}
          onMouseEnter={() => setSyncHovered(true)}
          onMouseLeave={() => setSyncHovered(false)}
          style={{
            background: syncHovered ? '#f9f8f6' : 'white',
            color: '#1a1b22',
            border: '1px solid #e8e5df',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: ch.syncing ? 'wait' : 'pointer',
            transition: 'background 0.15s',
            opacity: ch.syncing ? 0.6 : 1,
          }}
        >
          {ch.syncing ? '↻ Syncing…' : '↻ Sync now'}
        </button>
      </div>
    </div>
  )
}

const SHIMMER_KEYFRAMES = `
  @keyframes shimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
`

const SHIMMER_STYLE: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f0ede8 25%, #e8e5df 50%, #f0ede8 75%)',
  backgroundSize: '800px 100%',
  animation: 'shimmer 1.4s ease-in-out infinite',
  borderRadius: '6px',
}

function SkeletonLoader() {
  const shimmer = SHIMMER_STYLE

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3ef', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <style>{SHIMMER_KEYFRAMES}</style>
      <AppSidebar />
      <main style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar skeleton */}
        <div style={{ height: '52px', background: 'white', borderBottom: '1px solid #e8e5df', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px' }}>
          <div style={{ ...shimmer, width: '140px', height: '16px' }} />
          <div style={{ flex: 1 }} />
          <div style={{ ...shimmer, width: '90px', height: '30px', borderRadius: '8px' }} />
        </div>
        <div style={{ padding: '24px' }}>
          {/* Greeting skeleton */}
          <div style={{ ...shimmer, width: '220px', height: '20px', marginBottom: '8px' }} />
          <div style={{ ...shimmer, width: '160px', height: '14px', marginBottom: '20px' }} />
          {/* Quick actions skeleton */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {[80, 80, 90, 70].map((w, i) => (
              <div key={i} style={{ ...shimmer, width: `${w}px`, height: '32px', borderRadius: '8px' }} />
            ))}
          </div>
          {/* Stat cards skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ ...CARD_STYLE, padding: '18px' }}>
                <div style={{ ...shimmer, width: '80px', height: '10px', marginBottom: '12px' }} />
                <div style={{ ...shimmer, width: '100px', height: '28px', marginBottom: '8px' }} />
                <div style={{ ...shimmer, width: '70px', height: '10px' }} />
              </div>
            ))}
          </div>
          {/* Main grid skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '12px' }}>
            <div style={{ ...CARD_STYLE, height: '280px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ ...CARD_STYLE, height: '120px' }} />
              <div style={{ ...CARD_STYLE, height: '148px' }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [agentRunning, setAgentRunning] = useState(false)
  const [syncingChannels, setSyncingChannels] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => { loadDashboard() }, [])

  // First-session welcome: only auto-fire the dashboard tour when the user
  // account is fresh (created within the last 24h). Pre-existing users get
  // the tour only via the "?" menu, never as a surprise.
  const isFirstSession = (() => {
    if (!user?.created_at) return false
    const created = new Date(user.created_at).getTime()
    if (!created) return false
    return Date.now() - created < 24 * 60 * 60 * 1000
  })()
  useTour('dashboard', user?.id ?? null, { autoStart: isFirstSession })

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

  async function syncChannel(channelId: string) {
    setSyncingChannels(prev => new Set(prev).add(channelId))
    try {
      await fetch(`/api/channels/${channelId}/sync`, { method: 'POST' })
      await loadDashboard()
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setSyncingChannels(prev => {
        const next = new Set(prev)
        next.delete(channelId)
        return next
      })
    }
  }

  async function syncAll() {
    const channels = data?.channelStats || []
    await Promise.all(channels.map(ch => syncChannel(ch.id)))
  }

  const f  = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fp = (n: number) => `${n.toFixed(1)}%`

  if (loading) return <SkeletonLoader />

  const channels = (data?.channelStats || []).map(ch => ({
    ...ch,
    syncing: syncingChannels.has(ch.id),
  }))

  const statCards = [
    { label: 'True Profit Today',  value: f(data?.profitToday  || 0), sub: '↑ updated live',          href: '/orders',   accent: '#059669' },
    { label: 'Revenue Today',      value: f(data?.revenueToday || 0), sub: 'Across all channels',       href: '/orders',   accent: '#5b52f5' },
    { label: 'Orders Today',       value: String(data?.ordersToday || 0), sub: 'Across all channels',   href: '/orders',   accent: null },
    { label: 'Avg Margin 30d',     value: fp(data?.avgMargin   || 0), sub: 'After all costs',           href: '/listings', accent: null },
    { label: 'Active Alerts',      value: String(data?.activeAlerts || 0), sub: `${data?.pendingActions || 0} pending actions`, href: '/errors', accent: (data?.activeAlerts || 0) > 0 ? '#dc2626' : null },
  ]

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f5f3ef', fontSize: '14px', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />
      <TourTrigger tourId="dashboard" userId={user?.id} />

      <main style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* TOPBAR */}
        <div style={{
          height: '52px',
          background: 'white',
          borderBottom: '1px solid #e8e5df',
          boxShadow: '0 1px 0 #e8e5df',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <span style={{ fontSize: '15px', fontWeight: 600, flex: 1, color: '#1a1b22' }}>Command Centre</span>
          {(data?.leverageRatio ?? 0) > 0 && (
            <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600, background: '#ecfdf5', padding: '4px 10px', borderRadius: '100px' }}>
              {data!.leverageRatio.toFixed(1)}× leverage ratio
            </span>
          )}
          <button
            onClick={runAgent}
            disabled={agentRunning}
            style={{
              background: '#5b52f5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: agentRunning ? 'wait' : 'pointer',
              opacity: agentRunning ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {agentRunning ? '⚡ Running...' : '⚡ Run Agent'}
          </button>
        </div>

        <div style={{ padding: '24px' }}>

          {/* GREETING */}
          <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px', letterSpacing: '-0.02em', color: '#1a1b22' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.email?.split('@')[0] || 'there'} 👋
          </div>
          <div style={{ fontSize: '13px', color: '#6b6e87', marginBottom: '16px' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {/* QUICK ACTIONS BAR */}
          <QuickActionsBar
            onSyncAll={syncAll}
            onNewListing={() => router.push('/listings/new')}
            onViewErrors={() => router.push('/errors')}
            onExport={() => router.push('/orders?export=1')}
          />

          {/* HERO STATS */}
          <div data-tour="dashboard-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {statCards.map(stat => (
              <StatCard key={stat.label} {...stat} router={router} />
            ))}
          </div>

          {/* AI AGENT BANNER — also the margin/alerts anchor for product tour */}
          <div data-tour="dashboard-alerts">
          {(data?.pendingActions ?? 0) > 0 && (
            <Link href="/agent" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, #5b52f5 0%, #4338ca 100%)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(91,82,245,0.3)',
              }}>
                <div style={{ fontSize: '20px' }}>🤖</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '3px' }}>
                    AI Agent has {data!.pendingActions} action{data!.pendingActions !== 1 ? 's' : ''} waiting for approval
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                    Review and approve recommended changes to your campaigns and listings
                  </div>
                </div>
                <div style={{ background: 'white', color: '#5b52f5', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  Review actions →
                </div>
              </div>
            </Link>
          )}
          </div>

          {/* CHANNEL HEALTH CARDS — also the "connect another channel" anchor */}
          <div data-tour="dashboard-connect">
          {channels.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1b22' }}>Channel Health</span>
                <Link href="/channels" style={{ fontSize: '12px', color: '#5b52f5', textDecoration: 'none', fontWeight: 500 }}>Manage channels →</Link>
              </div>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                {channels.map(ch => (
                  <ChannelCard
                    key={ch.id}
                    ch={ch}
                    onSyncNow={syncChannel}
                    onErrorClick={(id) => router.push(`/errors?channel=${id}`)}
                  />
                ))}
              </div>
            </div>
          )}
          </div>

          {/* MAIN GRID */}
          <div data-tour="dashboard-orders" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '12px', marginBottom: '12px' }}>

            {/* CHANNEL TABLE (when no channels) */}
            {channels.length === 0 && (
              <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8e5df', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1b22' }}>Channel Performance — Last 30 days</span>
                  <Link href="/channels" style={{ fontSize: '12px', color: '#5b52f5', cursor: 'pointer', textDecoration: 'none', fontWeight: 500 }}>Manage channels →</Link>
                </div>
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>🔗</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1b22', marginBottom: '6px' }}>No channels connected yet</div>
                  <div style={{ fontSize: '13px', color: '#6b6e87', marginBottom: '16px' }}>Connect eBay, Amazon, or Shopify to start seeing real data</div>
                  <Link href="/channels" style={{ background: '#5b52f5', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
                    Connect a channel →
                  </Link>
                </div>
              </div>
            )}

            {/* TOP PRODUCTS (when channels exist) */}
            {channels.length > 0 && (
              <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #e8e5df', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1b22' }}>Top Products</span>
                  <Link href="/inventory" style={{ fontSize: '12px', color: '#5b52f5', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
                </div>
                {data?.topProducts?.length ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Product', 'Margin', 'Signal'].map((h, i) => (
                          <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '8px 16px', fontSize: '11px', fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8e5df', background: '#f9f8f6' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.topProducts.map((p: any) => (
                        <ProductRow key={p.sku || p.title} p={p} fp={fp} />
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9496b0', fontSize: '13px' }}>
                    Connect eBay or Amazon to see product intelligence
                  </div>
                )}
              </div>
            )}

            {/* RIGHT PANEL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* LEVERAGE RATIO */}
              <div style={{ ...CARD_STYLE, padding: '18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Your Leverage Ratio</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '44px', fontWeight: 700, letterSpacing: '-0.04em', color: '#059669', lineHeight: 1, ...MONO }}>
                    {(data?.leverageRatio ?? 0) > 0 ? `${data!.leverageRatio.toFixed(1)}×` : '—'}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#6b6e87', marginBottom: '12px' }}>Value returned per £1 paid to Meridia</div>
                <div style={{ fontSize: '12px', color: '#9496b0', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "Your bank lends your £1 deposit out 9 times. Meridia returns {(data?.leverageRatio ?? 0) > 0 ? data!.leverageRatio.toFixed(1) : '9.4'}× for every £1 you pay."
                </div>
              </div>

              {/* AI INSIGHTS */}
              <div style={{ ...CARD_STYLE, overflow: 'hidden', flex: 1 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8e5df', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1b22' }}>AI Insights</span>
                  <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px' }}>{data?.insights?.length || 0} active</span>
                </div>
                <div style={{ padding: '8px' }}>
                  {data?.insights?.length ? data.insights.map((insight: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px', borderRadius: '8px', marginBottom: '2px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: insight.priority === 'high' ? '#dc2626' : insight.priority === 'medium' ? '#d97706' : '#5b52f5', flexShrink: 0, marginTop: '4px' }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1b22', marginBottom: '3px' }}>{insight.title}</div>
                        <div style={{ fontSize: '12px', color: '#6b6e87', lineHeight: 1.4 }}>{insight.body?.substring(0, 80)}...</div>
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9496b0', fontSize: '13px' }}>
                      Connect a channel to generate AI insights
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW — also the sync/error health anchor for the tour */}
          <div data-tour="dashboard-health" style={{ display: 'grid', gridTemplateColumns: channels.length > 0 ? '1fr 1fr' : '1fr 1fr 1fr', gap: '12px' }}>

            {/* TOP PRODUCTS (only shown when no channels) */}
            {channels.length === 0 && (
              <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #e8e5df', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1b22' }}>Top Products</span>
                  <Link href="/inventory" style={{ fontSize: '12px', color: '#5b52f5', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
                </div>
                {data?.topProducts?.length ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Product', 'Margin', 'Signal'].map((h, i) => (
                          <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '8px 16px', fontSize: '11px', fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8e5df', background: '#f9f8f6' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.topProducts.map((p: any) => (
                        <ProductRow key={p.sku || p.title} p={p} fp={fp} />
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9496b0', fontSize: '13px' }}>
                    Connect eBay or Amazon to see product intelligence
                  </div>
                )}
              </div>
            )}

            {/* MONTHLY SUMMARY */}
            <div style={{ ...CARD_STYLE, padding: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px', color: '#1a1b22' }}>This Month</div>
              {[
                { label: 'Revenue',      value: f(data?.revenueThisMonth || 0), green: false },
                { label: 'True Profit',  value: f(data?.profitThisMonth  || 0), green: true },
                { label: 'Avg Margin',   value: fp(data?.avgMargin       || 0), green: false },
                { label: 'Blended ROAS', value: `${(data?.blendedRoas    || 0).toFixed(1)}×`, green: false },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f3ef' }}>
                  <span style={{ fontSize: '13px', color: '#6b6e87' }}>{row.label}</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: row.green ? '#059669' : '#1a1b22', ...MONO }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* ASK CLAUDE */}
            <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e8e5df', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1b22' }}>Ask Claude</span>
                <span style={{ fontSize: '11px', color: '#9496b0' }}>Knows your full store</span>
              </div>
              <div style={{ padding: '14px' }}>
                {chatResponse && (
                  <div style={{ background: '#f9f8f6', border: '1px solid #e8e5df', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#1a1b22', lineHeight: 1.6, marginBottom: '10px', maxHeight: '120px', overflowY: 'auto' }}>
                    {chatResponse}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                  {['Why did my ACOS spike?', 'Which products to restock?', 'Show my worst margin products'].map(q => (
                    <div
                      key={q}
                      onClick={() => setChatInput(q)}
                      style={{ background: '#f9f8f6', border: '1px solid #e8e5df', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: '#6b6e87', cursor: 'pointer' }}
                    >
                      {q}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && askClaude()}
                    placeholder="Ask anything..."
                    style={{
                      flex: 1,
                      background: 'white',
                      border: '1px solid #e8e5df',
                      borderRadius: '100px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontFamily: 'Inter, sans-serif',
                      color: '#1a1b22',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={askClaude}
                    disabled={chatLoading}
                    style={{
                      background: '#5b52f5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '100px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: chatLoading ? 'wait' : 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      opacity: chatLoading ? 0.7 : 1,
                    }}
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

/* ─── Sub-components ─── */

function ProductRow({ p, fp }: { p: any; fp: (n: number) => string }) {
  const [hovered, setHovered] = useState(false)
  const margin = p.margin || p.avg_margin_90d || 0
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? '#f9f8f6' : 'transparent', transition: 'background 0.1s' }}
    >
      <td style={{ padding: '10px 16px', borderBottom: '1px solid #e8e5df', fontSize: '12px', fontWeight: 500, color: '#1a1b22', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title || p.sku}</td>
      <td style={{ padding: '10px 16px', borderBottom: '1px solid #e8e5df', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: margin > 20 ? '#059669' : margin > 15 ? '#d97706' : '#dc2626', ...MONO }}>
        {fp(margin)}
      </td>
      <td style={{ padding: '10px 16px', borderBottom: '1px solid #e8e5df', textAlign: 'right' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: margin > 20 ? '#ecfdf5' : margin > 10 ? '#eff6ff' : '#fffbeb', color: margin > 20 ? '#059669' : margin > 10 ? '#5b52f5' : '#d97706' }}>
          {margin > 20 ? 'scale' : margin > 10 ? 'hold' : 'review'}
        </span>
      </td>
    </tr>
  )
}

function StatCard({ label, value, sub, href, accent, router }: {
  label: string
  value: string
  sub: string
  href: string
  accent: string | null
  router: ReturnType<typeof useRouter>
}) {
  const [hovered, setHovered] = useState(false)
  const isAlert = label === 'Active Alerts'
  const isProfit = label === 'True Profit Today'

  return (
    <div
      onClick={() => router.push(href)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white',
        border: '1px solid #e8e5df',
        borderRadius: '12px',
        borderLeft: accent ? `3px solid ${accent}` : '1px solid #e8e5df',
        padding: accent ? '16px 18px 16px 15px' : '16px 18px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
        boxShadow: hovered
          ? '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)'
          : '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
      <div style={{
        fontSize: '28px',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        lineHeight: 1,
        marginBottom: '6px',
        color: isAlert && Number(value) > 0 ? '#dc2626' : isProfit ? '#059669' : '#1a1b22',
        ...MONO,
      }}>{value}</div>
      <div style={{ fontSize: '11px', fontWeight: 500, color: '#9496b0' }}>{sub}</div>
    </div>
  )
}

function QuickActionsBar({ onSyncAll, onNewListing, onViewErrors, onExport }: {
  onSyncAll: () => void
  onNewListing: () => void
  onViewErrors: () => void
  onExport: () => void
}) {
  const [h1, setH1] = useState(false)
  const [h2, setH2] = useState(false)
  const [h3, setH3] = useState(false)
  const [h4, setH4] = useState(false)

  const btnBase = (hovered: boolean): React.CSSProperties => ({
    border: '1px solid #e8e5df',
    background: hovered ? '#f9f8f6' : 'white',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    color: '#1a1b22',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  })

  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
      <button
        onClick={onNewListing}
        onMouseEnter={() => setH1(true)} onMouseLeave={() => setH1(false)}
        style={btnBase(h1)}
      >
        <span>＋</span> New Listing
      </button>
      <button
        onClick={onSyncAll}
        onMouseEnter={() => setH2(true)} onMouseLeave={() => setH2(false)}
        style={btnBase(h2)}
      >
        <span>↻</span> Sync All
      </button>
      <button
        onClick={onViewErrors}
        onMouseEnter={() => setH3(true)} onMouseLeave={() => setH3(false)}
        style={{ ...btnBase(h3), color: '#dc2626', borderColor: '#fecaca' }}
      >
        <span>⚠</span> View Errors
      </button>
      <button
        onClick={onExport}
        onMouseEnter={() => setH4(true)} onMouseLeave={() => setH4(false)}
        style={btnBase(h4)}
      >
        <span>📊</span> Export
      </button>
    </div>
  )
}
