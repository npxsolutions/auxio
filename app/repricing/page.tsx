'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'
import { createClient } from '../lib/supabase-client'
import TourTrigger from '../components/TourTrigger'
import { useTour } from '../lib/tours'

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


// ─── DB ↔ UI mapping ─────────────────────────────────────────────────────────

const CH_TO_LABEL: Record<string, Channel> = {
  all:     'All Channels',
  ebay:    'eBay',
  amazon:  'Amazon',
  shopify: 'Shopify',
}
const LABEL_TO_CH: Record<Channel, string> = {
  'All Channels': 'all',
  'eBay':         'ebay',
  'Amazon':       'amazon',
  'Shopify':      'shopify',
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m} min${m > 1 ? 's' : ''} ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d > 1 ? 's' : ''} ago`
}

function fromDB(row: any): RepricingRule {
  return {
    id:               row.id,
    name:             row.name,
    channel:          CH_TO_LABEL[row.channel] ?? 'All Channels',
    strategy:         row.strategy as Strategy,
    strategyParam:    row.strategy_param ?? 0,
    floorPrice:       row.floor_price ?? 0,
    ceilingPrice:     row.ceiling_price ?? 9999,
    status:           row.active ? 'active' : 'paused',
    lastRun:          relativeTime(row.last_run_at),
    listingsAffected: row.listings_affected ?? 0,
  }
}

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

  const [rules, setRules]             = useState<RepricingRule[]>([])
  const [loading, setLoading]         = useState(true)
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [running, setRunning]         = useState(false)
  const [toast, setToast]             = useState<string | null>(null)

  // New rule form state
  const [newRuleName, setNewRuleName]         = useState('')
  const [newChannel, setNewChannel]           = useState<Channel>('All Channels')
  const [newStrategy, setNewStrategy]         = useState<Strategy>('beat_lowest')
  const [newStrategyParam, setNewStrategyParam] = useState('2')
  const [newFloor, setNewFloor]               = useState('')
  const [newCeiling, setNewCeiling]           = useState('')
  const [newActive, setNewActive]             = useState(true)
  const [tourUserId, setTourUserId] = useState<string | null>(null)
  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => {
      if (data.user?.id) setTourUserId(data.user.id)
    }).catch(err => console.error('[tour:repricing] user fetch failed', err))
  }, [])
  useTour('repricing', tourUserId)

  async function loadRules() {
    setLoading(true)
    try {
      const res = await fetch('/api/repricing')
      const { rules: data } = await res.json()
      setRules((data || []).map(fromDB))
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  // Auth guard + initial load
  useEffect(() => {
    fetch('/api/repricing')
      .then(r => r.json())
      .then(({ rules: data, error }) => {
        if (error && error === 'Unauthorized') { router.push('/login'); return }
        setRules((data || []).map(fromDB))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
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
    setToast('Repricing run triggered — results will appear in the log')
  }, [])

  const toggleRule = useCallback(async (id: string) => {
    const rule = rules.find(r => r.id === id)
    if (!rule) return
    const newActive = rule.status !== 'active'
    // Optimistic update
    setRules(prev => prev.map(r => r.id === id ? { ...r, status: newActive ? 'active' : 'paused' } : r))
    const res = await fetch('/api/repricing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: newActive }),
    })
    if (!res.ok) {
      // Revert on failure
      setRules(prev => prev.map(r => r.id === id ? rule : r))
      setToast('Failed to update rule')
    }
  }, [rules])

  const deleteRule = useCallback(async (id: string, name: string) => {
    if (!confirm(`Delete rule "${name}"?`)) return
    setRules(prev => prev.filter(r => r.id !== id))
    const res = await fetch('/api/repricing', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      setToast('Failed to delete rule')
      loadRules()
    } else {
      setToast(`Rule "${name}" deleted`)
    }
  }, [])

  const handleCreateRule = useCallback(async () => {
    if (!newRuleName.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/repricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           newRuleName.trim(),
          channel:        LABEL_TO_CH[newChannel],
          strategy:       newStrategy,
          strategy_param: parseFloat(newStrategyParam) || 0,
          floor_price:    parseFloat(newFloor) || 0,
          ceiling_price:  parseFloat(newCeiling) || 9999,
          active:         newActive,
        }),
      })
      const { rule, error } = await res.json()
      if (error) { setToast(`Error: ${error}`); return }
      setRules(prev => [fromDB(rule), ...prev])
      setShowCreatePanel(false)
      setNewRuleName('')
      setNewFloor('')
      setNewCeiling('')
      setToast(`Rule "${rule.name}" created`)
    } finally {
      setSaving(false)
    }
  }, [newRuleName, newChannel, newStrategy, newStrategyParam, newFloor, newCeiling, newActive, saving])

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
  const totalAffected = rules.reduce((s, r) => s + r.listingsAffected, 0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <AppSidebar />
      <TourTrigger tourId="repricing" userId={tourUserId} />

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
              data-tour="repricing-form"
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
            { label: 'Active Rules',     value: String(activeRules),     sub: `${rules.length} rule${rules.length !== 1 ? 's' : ''} total`, icon: '⚡' },
            { label: 'Listings Covered', value: String(totalAffected),   sub: 'across active rules', icon: '🔄' },
            { label: 'Strategies',       value: String(new Set(rules.map(r => r.strategy)).size), sub: 'rule types active', icon: '📐' },
            { label: 'Paused Rules',     value: String(rules.length - activeRules), sub: 'not running', icon: '⏸️' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'white', border: '1px solid #e8e5df', borderRadius: 12,
              padding: '16px 18px',
            }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', letterSpacing: '-0.02em' }}>
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
            <div data-tour="repricing-rules" style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e5df', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22' }}>Repricing Rules</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {rules.length} rules
                </span>
              </div>

              <div>
                {loading && (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9496b0', fontSize: 13 }}>
                    Loading rules…
                  </div>
                )}
                {!loading && rules.length === 0 && (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🏷️</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1b22', marginBottom: 4 }}>No repricing rules yet</div>
                    <div style={{ fontSize: 13, color: '#6b6e87' }}>Create your first rule to start protecting margins and winning buy boxes automatically.</div>
                  </div>
                )}
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
                        <button
                          onClick={() => setToast(`Running rule "${rule.name}"…`)}
                          style={{
                            background: 'transparent', border: '1px solid #e8e5df',
                            borderRadius: 6, padding: '4px 10px', fontSize: 12,
                            color: '#5b52f5', cursor: 'pointer', fontWeight: 500,
                          }}>
                          Run now
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id, rule.name)}
                          style={{
                            background: 'transparent', border: '1px solid #fecaca',
                            borderRadius: 6, padding: '4px 10px', fontSize: 12,
                            color: '#dc2626', cursor: 'pointer', fontWeight: 500,
                          }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Log table ── */}
            <div data-tour="repricing-log" style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e5df' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22' }}>Repricing Log</span>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b6e87' }}>Recent price adjustments made by your rules</p>
              </div>
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22', marginBottom: 4 }}>No repricing history yet</div>
                <div style={{ fontSize: 12, color: '#9496b0' }}>
                  Price changes will appear here once your rules run. Active rules run hourly.
                </div>
              </div>
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
                disabled={!newRuleName.trim() || saving}
                style={{
                  width: '100%',
                  background: newRuleName.trim() && !saving ? '#5b52f5' : '#c7c3fb',
                  color: 'white', border: 'none', borderRadius: 8,
                  padding: '10px', fontSize: 13, fontWeight: 600,
                  cursor: newRuleName.trim() && !saving ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s',
                }}
              >
                {saving ? 'Creating…' : 'Create Rule'}
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
