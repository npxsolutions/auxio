'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'
import { createClient } from '../lib/supabase-client'

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = 'All Channels' | 'eBay' | 'Amazon' | 'Shopify'
type Strategy = 'beat_lowest' | 'match_buybox' | 'margin_floor' | 'timed_reduction'
type RuleStatus = 'active' | 'paused'

interface RepricingRule {
  id: string
  name: string
  channel: Channel
  strategy: Strategy
  strategyParam: number
  floorPrice: number
  ceilingPrice: number
  status: RuleStatus
  lastRun: string
  listingsAffected: number
}

interface LogEntry {
  id: string
  title: string
  sku: string
  oldPrice: number
  newPrice: number
  channel: Channel
  reason: string
  time: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_RULES: RepricingRule[] = [
  {
    id: 'r1',
    name: 'Beat Lowest – Electronics',
    channel: 'eBay',
    strategy: 'beat_lowest',
    strategyParam: 2,
    floorPrice: 15,
    ceilingPrice: 200,
    status: 'active',
    lastRun: '2 hours ago',
    listingsAffected: 34,
  },
  {
    id: 'r2',
    name: 'Amazon Buy Box Winner',
    channel: 'Amazon',
    strategy: 'match_buybox',
    strategyParam: 0,
    floorPrice: 10,
    ceilingPrice: 500,
    status: 'active',
    lastRun: '30 mins ago',
    listingsAffected: 58,
  },
  {
    id: 'r3',
    name: 'Clearance Stock',
    channel: 'All Channels',
    strategy: 'timed_reduction',
    strategyParam: 5,
    floorPrice: 5,
    ceilingPrice: 50,
    status: 'paused',
    lastRun: '3 days ago',
    listingsAffected: 12,
  },
]

const LOG_ENTRIES: LogEntry[] = [
  { id: 'l1', title: 'Sony WH-1000XM5 Headphones', sku: 'SKU-8821', oldPrice: 189.99, newPrice: 185.99, channel: 'eBay', reason: 'Beat lowest by 2%', time: '14 mins ago' },
  { id: 'l2', title: 'Apple AirPods Pro (2nd Gen)', sku: 'SKU-3340', oldPrice: 229.00, newPrice: 224.99, channel: 'Amazon', reason: 'Match Buy Box', time: '31 mins ago' },
  { id: 'l3', title: 'Logitech MX Master 3S Mouse', sku: 'SKU-5512', oldPrice: 89.99, newPrice: 87.99, channel: 'eBay', reason: 'Beat lowest by 2%', time: '1 hour ago' },
  { id: 'l4', title: 'Samsung Galaxy Buds2 Pro', sku: 'SKU-7703', oldPrice: 149.99, newPrice: 142.49, channel: 'Amazon', reason: 'Match Buy Box', time: '2 hours ago' },
  { id: 'l5', title: 'Anker PowerCore 26800mAh', sku: 'SKU-2291', oldPrice: 44.99, newPrice: 42.74, channel: 'All Channels', reason: 'Timed reduction 5%', time: '3 hours ago' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STRATEGY_LABELS: Record<Strategy, string> = {
  beat_lowest:     'Beat lowest price by X%',
  match_buybox:    'Match Buy Box price',
  margin_floor:    'Fixed margin floor £X',
  timed_reduction: 'Reduce by X% every 7 days',
}

const STRATEGY_DESCRIPTIONS: Record<Strategy, string> = {
  beat_lowest:     'Automatically undercut the current cheapest listing by a set percentage.',
  match_buybox:    'Match the Amazon Buy Box price in real time to maximise visibility.',
  margin_floor:    'Set a minimum margin floor — never sell below cost.',
  timed_reduction: 'Periodically reduce price on slow-moving stock until floor is reached.',
}

const CHANNEL_COLORS: Record<Channel, { bg: string; color: string; border: string }> = {
  'All Channels': { bg: '#f0effd', color: '#5b52f5', border: '#c7c3fb' },
  'eBay':         { bg: '#fff3f3', color: '#c0392b', border: '#fecaca' },
  'Amazon':       { bg: '#fffbf0', color: '#b45309', border: '#fde68a' },
  'Shopify':      { bg: '#f0fdf4', color: '#15803d', border: '#a7f3d0' },
}

function fmt(n: number) {
  return `£${n.toFixed(2)}`
}

function priceDiff(oldP: number, newP: number) {
  const diff = newP - oldP
  const pct = ((diff / oldP) * 100).toFixed(1)
  const isNeg = diff < 0
  return {
    label: `${isNeg ? '' : '+'}£${Math.abs(diff).toFixed(2)} (${isNeg ? '' : '+'}${pct}%)`,
    color: isNeg ? '#059669' : '#dc2626',
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: Channel }) {
  const s = CHANNEL_COLORS[channel]
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 100,
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 8px',
      whiteSpace: 'nowrap',
    }}>
      {channel}
    </span>
  )
}

function StatusBadge({ status }: { status: RuleStatus }) {
  const active = status === 'active'
  return (
    <span style={{
      background: active ? '#ecfdf5' : '#f9fafb',
      color: active ? '#059669' : '#6b7280',
      border: `1px solid ${active ? '#a7f3d0' : '#e5e7eb'}`,
      borderRadius: 100,
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 8px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: active ? '#059669' : '#9ca3af',
        display: 'inline-block',
      }} />
      {active ? 'Active' : 'Paused'}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RepricingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [rules, setRules] = useState<RepricingRule[]>(INITIAL_RULES)
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [running, setRunning] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // New rule form state
  const [newRuleName, setNewRuleName] = useState('')
  const [newChannel, setNewChannel] = useState<Channel>('All Channels')
  const [newStrategy, setNewStrategy] = useState<Strategy>('beat_lowest')
  const [newStrategyParam, setNewStrategyParam] = useState('2')
  const [newFloor, setNewFloor] = useState('')
  const [newCeiling, setNewCeiling] = useState('')
  const [newActive, setNewActive] = useState(true)

  // Auth guard
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
    })
  }, [])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleRunNow = useCallback(async () => {
    setRunning(true)
    await new Promise(r => setTimeout(r, 2200))
    setRunning(false)
    setToast('Repricing complete — 12 listings updated')
  }, [])

  const toggleRule = useCallback((id: string) => {
    setRules(prev => prev.map(r =>
      r.id === id ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r
    ))
  }, [])

  const handleCreateRule = useCallback(() => {
    if (!newRuleName.trim()) return
    const rule: RepricingRule = {
      id: `r${Date.now()}`,
      name: newRuleName.trim(),
      channel: newChannel,
      strategy: newStrategy,
      strategyParam: parseFloat(newStrategyParam) || 0,
      floorPrice: parseFloat(newFloor) || 0,
      ceilingPrice: parseFloat(newCeiling) || 9999,
      status: newActive ? 'active' : 'paused',
      lastRun: 'Never',
      listingsAffected: 0,
    }
    setRules(prev => [rule, ...prev])
    setShowCreatePanel(false)
    setNewRuleName('')
    setNewFloor('')
    setNewCeiling('')
    setToast(`Rule "${rule.name}" created`)
  }, [newRuleName, newChannel, newStrategy, newStrategyParam, newFloor, newCeiling, newActive])

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#9496b0',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 8, display: 'block',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px',
    border: '1px solid #e8e5df', borderRadius: 8,
    fontSize: 13, color: '#1a1b22', background: 'white',
    outline: 'none', boxSizing: 'border-box',
  }

  const activeRules = rules.filter(r => r.status === 'active').length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <AppSidebar />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>

        {/* ── Toast ── */}
        {toast && (
          <div style={{
            position: 'fixed', top: 20, right: 24, zIndex: 9999,
            background: '#1a1b22', color: 'white',
            padding: '12px 18px', borderRadius: 10,
            fontSize: 13, fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center', gap: 8,
            animation: 'none',
          }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 7.5L6 11l6.5-7"/>
            </svg>
            {toast}
          </div>
        )}

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', margin: 0, letterSpacing: '-0.02em' }}>
              Repricing
            </h1>
            <p style={{ fontSize: 13, color: '#6b6e87', margin: '4px 0 0', lineHeight: 1.5 }}>
              Automatically adjust prices to stay competitive while protecting your margins.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowCreatePanel(p => !p)}
              style={{
                background: 'white', color: '#1a1b22', border: '1px solid #e8e5df',
                borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6.5 1v11M1 6.5h11"/>
              </svg>
              New Rule
            </button>
            <button
              onClick={handleRunNow}
              disabled={running}
              style={{
                background: running ? '#8a84f8' : '#5b52f5', color: 'white',
                border: 'none', borderRadius: 8, padding: '8px 16px',
                fontSize: 13, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.15s',
              }}
            >
              {running ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="7" cy="7" r="5" strokeDasharray="20 10" />
                  </svg>
                  Running…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3,1.5 11.5,6.5 3,11.5" fill="white" stroke="none"/>
                  </svg>
                  Run Repricing Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Active Rules', value: String(activeRules), sub: `${rules.length} total rules`, icon: '⚡' },
            { label: 'Repriced Today', value: '12', sub: 'listings updated', icon: '🔄' },
            { label: 'Avg Price Change', value: '-2.3%', sub: 'vs yesterday', icon: '📉', valueColor: '#059669' },
            { label: 'Margin Protected', value: '£4,821', sub: 'this month', icon: '🛡️', valueColor: '#5b52f5' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'white', border: '1px solid #e8e5df', borderRadius: 12,
              padding: '16px 18px',
            }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: stat.valueColor || '#1a1b22', letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 12, color: '#6b6e87', marginTop: 2 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: showCreatePanel ? '1fr 360px' : '1fr', gap: 20 }}>
          <div>
            {/* ── Rules section ── */}
            <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e5df', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22' }}>Repricing Rules</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {rules.length} rules
                </span>
              </div>

              <div>
                {rules.map((rule, idx) => (
                  <div key={rule.id} style={{
                    padding: '16px 20px',
                    borderBottom: idx < rules.length - 1 ? '1px solid #f0ede8' : 'none',
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                  }}>
                    {/* Toggle */}
                    <button
                      onClick={() => toggleRule(rule.id)}
                      title={rule.status === 'active' ? 'Pause rule' : 'Activate rule'}
                      style={{
                        width: 36, height: 20, borderRadius: 10,
                        background: rule.status === 'active' ? '#5b52f5' : '#e5e7eb',
                        border: 'none', cursor: 'pointer', padding: 0,
                        position: 'relative', flexShrink: 0, marginTop: 2,
                        transition: 'background 0.2s',
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: 2, left: rule.status === 'active' ? 18 : 2,
                        width: 16, height: 16, borderRadius: '50%',
                        background: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'left 0.2s',
                        display: 'block',
                      }} />
                    </button>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1b22' }}>{rule.name}</span>
                        <ChannelBadge channel={rule.channel} />
                        <StatusBadge status={rule.status} />
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#6b6e87', marginBottom: 8 }}>
                        <span>
                          <span style={{ color: '#9496b0', fontWeight: 600 }}>Strategy: </span>
                          {STRATEGY_LABELS[rule.strategy]}
                          {(rule.strategy === 'beat_lowest' || rule.strategy === 'timed_reduction') && ` (${rule.strategyParam}%)`}
                        </span>
                        <span>
                          <span style={{ color: '#9496b0', fontWeight: 600 }}>Floor: </span>
                          {fmt(rule.floorPrice)}
                        </span>
                        <span>
                          <span style={{ color: '#9496b0', fontWeight: 600 }}>Ceiling: </span>
                          {fmt(rule.ceilingPrice)}
                        </span>
                        <span>
                          <span style={{ color: '#9496b0', fontWeight: 600 }}>Listings: </span>
                          {rule.listingsAffected}
                        </span>
                        <span>
                          <span style={{ color: '#9496b0', fontWeight: 600 }}>Last run: </span>
                          {rule.lastRun}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{
                          background: 'transparent', border: '1px solid #e8e5df',
                          borderRadius: 6, padding: '4px 10px', fontSize: 12,
                          color: '#1a1b22', cursor: 'pointer', fontWeight: 500,
                        }}>
                          Edit
                        </button>
                        <button
                          onClick={() => setToast(`Running rule "${rule.name}"…`)}
                          style={{
                            background: 'transparent', border: '1px solid #e8e5df',
                            borderRadius: 6, padding: '4px 10px', fontSize: 12,
                            color: '#5b52f5', cursor: 'pointer', fontWeight: 500,
                          }}>
                          Run now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Log table ── */}
            <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e5df' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22' }}>Repricing Log</span>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b6e87' }}>Recent price adjustments made by your rules</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#faf9f7' }}>
                    {['Listing', 'Old Price', 'New Price', 'Change', 'Channel', 'Reason', 'Time'].map(col => (
                      <th key={col} style={{
                        padding: '10px 16px', textAlign: 'left',
                        fontSize: 11, fontWeight: 700, color: '#9496b0',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        borderBottom: '1px solid #e8e5df',
                        whiteSpace: 'nowrap',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LOG_ENTRIES.map((entry, idx) => {
                    const diff = priceDiff(entry.oldPrice, entry.newPrice)
                    return (
                      <tr key={entry.id} style={{ background: idx % 2 === 0 ? 'white' : '#faf9f7' }}>
                        <td style={{ padding: '11px 16px', color: '#1a1b22', fontWeight: 500 }}>
                          <div style={{ fontSize: 13 }}>{entry.title}</div>
                          <div style={{ fontSize: 11, color: '#9496b0', marginTop: 1 }}>{entry.sku}</div>
                        </td>
                        <td style={{ padding: '11px 16px', color: '#6b6e87' }}>{fmt(entry.oldPrice)}</td>
                        <td style={{ padding: '11px 16px', color: '#1a1b22', fontWeight: 600 }}>{fmt(entry.newPrice)}</td>
                        <td style={{ padding: '11px 16px', color: diff.color, fontWeight: 600 }}>{diff.label}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <ChannelBadge channel={entry.channel} />
                        </td>
                        <td style={{ padding: '11px 16px', color: '#6b6e87' }}>{entry.reason}</td>
                        <td style={{ padding: '11px 16px', color: '#9496b0', fontSize: 12 }}>{entry.time}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Create Rule panel ── */}
          {showCreatePanel && (
            <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: 20, alignSelf: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1b22' }}>New Repricing Rule</span>
                <button
                  onClick={() => setShowCreatePanel(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9496b0', padding: 4 }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M2 2l10 10M12 2L2 12"/>
                  </svg>
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Rule Name</label>
                <input
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                  placeholder="e.g. Beat Lowest – Home & Garden"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Channel</label>
                <select
                  value={newChannel}
                  onChange={e => setNewChannel(e.target.value as Channel)}
                  style={{ ...inputStyle, appearance: 'none' }}
                >
                  {(['All Channels', 'eBay', 'Amazon', 'Shopify'] as Channel[]).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Strategy</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(Object.keys(STRATEGY_LABELS) as Strategy[]).map(s => (
                    <label key={s} style={{
                      display: 'flex', gap: 10, cursor: 'pointer',
                      padding: '10px 12px', borderRadius: 8,
                      border: `1px solid ${newStrategy === s ? '#5b52f5' : '#e8e5df'}`,
                      background: newStrategy === s ? '#f0effd' : 'white',
                    }}>
                      <input
                        type="radio"
                        name="strategy"
                        value={s}
                        checked={newStrategy === s}
                        onChange={() => setNewStrategy(s)}
                        style={{ marginTop: 1, accentColor: '#5b52f5' }}
                      />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1b22' }}>{STRATEGY_LABELS[s]}</div>
                        <div style={{ fontSize: 11, color: '#9496b0', marginTop: 2, lineHeight: 1.4 }}>{STRATEGY_DESCRIPTIONS[s]}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {(newStrategy === 'beat_lowest' || newStrategy === 'timed_reduction') && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>
                    {newStrategy === 'beat_lowest' ? 'Beat by (%)' : 'Reduction per 7 days (%)'}
                  </label>
                  <input
                    type="number"
                    value={newStrategyParam}
                    onChange={e => setNewStrategyParam(e.target.value)}
                    placeholder="2"
                    min="0.1" max="50" step="0.1"
                    style={inputStyle}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Floor Price (£)</label>
                  <input
                    type="number"
                    value={newFloor}
                    onChange={e => setNewFloor(e.target.value)}
                    placeholder="5.00"
                    min="0" step="0.01"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Ceiling Price (£)</label>
                  <input
                    type="number"
                    value={newCeiling}
                    onChange={e => setNewCeiling(e.target.value)}
                    placeholder="500.00"
                    min="0" step="0.01"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '10px 12px', background: '#faf9f7', borderRadius: 8, border: '1px solid #e8e5df' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1b22' }}>Activate immediately</div>
                  <div style={{ fontSize: 11, color: '#9496b0', marginTop: 1 }}>Rule will run on next scheduled cycle</div>
                </div>
                <button
                  onClick={() => setNewActive(p => !p)}
                  style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: newActive ? '#5b52f5' : '#e5e7eb',
                    border: 'none', cursor: 'pointer', padding: 0,
                    position: 'relative', flexShrink: 0,
                    transition: 'background 0.2s',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 3,
                    left: newActive ? 21 : 3,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s', display: 'block',
                  }} />
                </button>
              </div>

              <button
                onClick={handleCreateRule}
                disabled={!newRuleName.trim()}
                style={{
                  width: '100%',
                  background: newRuleName.trim() ? '#5b52f5' : '#c7c3fb',
                  color: 'white', border: 'none', borderRadius: 8,
                  padding: '10px', fontSize: 13, fontWeight: 600,
                  cursor: newRuleName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s',
                }}
              >
                Create Rule
              </button>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
