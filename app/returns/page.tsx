'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'

/* ── Types ── */
type ReturnStatus = 'Pending' | 'Received' | 'Refunded' | 'Restocked'
type ReturnChannel = 'eBay' | 'Amazon' | 'Shopify'

interface ReturnRecord {
  id: string
  product: string
  channel: ReturnChannel
  reason: string
  condition: string
  action: string
  refund: number
  plImpact: number
  status: ReturnStatus
  date: string
}

/* ── Mock Data ── */
const MOCK_RETURNS: ReturnRecord[] = [
  {
    id: 'RTN-0091',
    product: 'Sony WH-1000XM5 Headphones',
    channel: 'Amazon',
    reason: 'Not as described',
    condition: 'Resaleable',
    action: 'Restock',
    refund: 279.99,
    plImpact: 12.00,
    status: 'Restocked',
    date: '2026-04-06',
  },
  {
    id: 'RTN-0090',
    product: 'Levi\'s 501 Original Jeans (W32 L32)',
    channel: 'eBay',
    reason: 'Changed mind',
    condition: 'Resaleable',
    action: 'Restock',
    refund: 49.99,
    plImpact: -4.50,
    status: 'Pending',
    date: '2026-04-05',
  },
  {
    id: 'RTN-0089',
    product: 'Philips Hue Starter Kit',
    channel: 'Shopify',
    reason: 'Faulty/Defective',
    condition: 'Damaged',
    action: 'Write off',
    refund: 119.99,
    plImpact: -119.99,
    status: 'Refunded',
    date: '2026-04-04',
  },
  {
    id: 'RTN-0088',
    product: 'Atomic Habits — James Clear',
    channel: 'Amazon',
    reason: 'Wrong item',
    condition: 'Resaleable',
    action: 'Restock',
    refund: 10.99,
    plImpact: 8.20,
    status: 'Restocked',
    date: '2026-04-03',
  },
  {
    id: 'RTN-0087',
    product: 'Apple AirPods Pro (2nd Gen)',
    channel: 'eBay',
    reason: 'Damaged in transit',
    condition: 'Damaged',
    action: 'Write off',
    refund: 229.00,
    plImpact: -229.00,
    status: 'Refunded',
    date: '2026-04-02',
  },
  {
    id: 'RTN-0086',
    product: 'Nike Air Max 270 (UK 9)',
    channel: 'Shopify',
    reason: 'Not as described',
    condition: 'Missing parts',
    action: 'Refurbish',
    refund: 89.99,
    plImpact: -24.99,
    status: 'Received',
    date: '2026-04-01',
  },
  {
    id: 'RTN-0085',
    product: 'Instant Pot Duo 7-in-1',
    channel: 'Amazon',
    reason: 'Faulty/Defective',
    condition: 'Damaged',
    action: 'Write off',
    refund: 74.99,
    plImpact: -74.99,
    status: 'Refunded',
    date: '2026-03-31',
  },
  {
    id: 'RTN-0084',
    product: 'Kindle Paperwhite 11th Gen',
    channel: 'eBay',
    reason: 'Changed mind',
    condition: 'Resaleable',
    action: 'Restock',
    refund: 99.99,
    plImpact: 18.00,
    status: 'Restocked',
    date: '2026-03-30',
  },
]

const REASONS_CHART = [
  { label: 'Not as described', pct: 35 },
  { label: 'Faulty/Defective', pct: 28 },
  { label: 'Changed mind',     pct: 20 },
  { label: 'Wrong item',       pct: 10 },
  { label: 'Damaged in transit', pct: 7 },
]

const CHANNEL_RATES = [
  { channel: 'eBay',    rate: '4.1%', color: '#E53238', bg: '#fff3f3', border: '#fecaca' },
  { channel: 'Amazon',  rate: '2.8%', color: '#FF9900', bg: '#fffbf0', border: '#fde68a' },
  { channel: 'Shopify', rate: '1.9%', color: '#96BF48', bg: '#f3f9ec', border: '#a7f3d0' },
]

/* ── Status pill config ── */
const STATUS_STYLES: Record<ReturnStatus, { bg: string; color: string; border: string }> = {
  Pending:   { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  Received:  { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  Refunded:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  Restocked: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
}

const TABS: Array<ReturnStatus | 'All Returns'> = ['All Returns', 'Pending', 'Received', 'Refunded', 'Restocked']

/* ── Helpers ── */
function fmt(n: number) { return `£${Math.abs(n).toFixed(2)}` }

function StatusPill({ status }: { status: ReturnStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 100,
      fontSize: 11,
      fontWeight: 700,
      padding: '3px 9px',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

/* ── Form initial state ── */
const EMPTY_FORM = {
  orderId: '',
  sku: '',
  channel: 'eBay',
  reason: 'Not as described',
  condition: 'Resaleable',
  action: 'Restock',
  refundAmount: '',
}

/* ── Page component ── */
export default function ReturnsPage() {
  useRouter()
  const [activeTab, setActiveTab] = useState<ReturnStatus | 'All Returns'>('All Returns')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setShowForm(false)
    setForm({ ...EMPTY_FORM })
    showToast('Return logged successfully')
  }

  const filtered = activeTab === 'All Returns'
    ? MOCK_RETURNS
    : MOCK_RETURNS.filter(r => r.status === activeTab)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 11px',
    border: '1px solid #e8e5df',
    borderRadius: 7,
    fontSize: 13,
    color: '#1a1b22',
    background: 'white',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#9496b0',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 4,
    display: 'block',
  }

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', minHeight: '100vh', background: '#f5f3ef', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 300,
          background: 'white', border: '1px solid #e8e5df',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderRadius: 10,
          padding: '14px 18px', fontSize: 13, fontWeight: 500, color: '#1a1b22',
          display: 'flex', alignItems: 'center', gap: 10,
          borderLeft: '3px solid #059669',
        }}>
          <span style={{ color: '#059669' }}>✓</span> {toast}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: 1100 }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1b22', letterSpacing: '-0.03em', margin: 0 }}>Returns</h1>
              <p style={{ fontSize: 14, color: '#6b6e87', margin: '4px 0 0' }}>
                Track returns, update stock and log the profit impact.
              </p>
            </div>
            <button
              onClick={() => setShowForm(v => !v)}
              style={{
                background: '#5b52f5', color: 'white', border: 'none', borderRadius: 8,
                padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Log Return
            </button>
          </div>

          {/* ── KPI Strip ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Returns this month', value: '14',       sub: 'April 2026',       accent: '#5b52f5' },
              { label: 'Return rate',         value: '3.2%',    sub: 'vs 2.9% last month', accent: '#d97706' },
              { label: 'Revenue lost',        value: '£1,840',  sub: 'from refunds',     accent: '#dc2626', valueColor: '#dc2626' },
              { label: 'Restocked & resold',  value: '8 items', sub: 'back in stock',    accent: '#059669', valueColor: '#059669' },
            ].map(kpi => (
              <div key={kpi.label} style={{
                background: 'white', border: '1px solid #e8e5df', borderRadius: 12,
                padding: '20px 24px', borderLeft: `3px solid ${kpi.accent}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: kpi.valueColor || '#1a1b22', letterSpacing: '-0.03em', fontFamily: 'ui-monospace, monospace' }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: 12, color: '#9496b0', marginTop: 2 }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Log Return Form Panel ── */}
          {showForm && (
            <div style={{
              background: 'white', border: '1px solid #e8e5df', borderRadius: 12,
              padding: '24px', marginBottom: 24,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1b22', margin: 0 }}>Log a return</h2>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9496b0', fontSize: 20, lineHeight: 1, padding: 4 }}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Order ID</label>
                    <input
                      style={inputStyle} placeholder="e.g. ORD-1042"
                      value={form.orderId}
                      onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>SKU / Product</label>
                    <input
                      style={inputStyle} placeholder="e.g. WH-1000XM5"
                      value={form.sku}
                      onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Channel</label>
                    <select
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      value={form.channel}
                      onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                    >
                      {['eBay', 'Amazon', 'Shopify'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Return reason</label>
                    <select
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      value={form.reason}
                      onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    >
                      {['Not as described', 'Faulty/Defective', 'Changed mind', 'Wrong item', 'Damaged in transit'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Condition on return</label>
                    <select
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      value={form.condition}
                      onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                    >
                      {['Resaleable', 'Damaged', 'Missing parts'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Action</label>
                    <select
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      value={form.action}
                      onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
                    >
                      {['Restock', 'Write off', 'Refurbish'].map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Refund amount (£)</label>
                    <input
                      style={inputStyle} placeholder="0.00" type="number" min="0" step="0.01"
                      value={form.refundAmount}
                      onChange={e => setForm(f => ({ ...f, refundAmount: e.target.value }))}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="submit"
                    style={{
                      background: '#5b52f5', color: 'white', border: 'none', borderRadius: 8,
                      padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Log return
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }) }}
                    style={{
                      background: 'white', color: '#6b6e87', border: '1px solid #e8e5df', borderRadius: 8,
                      padding: '10px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Tabs + Table ── */}
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 24 }}>

            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e8e5df', padding: '0 20px', overflowX: 'auto' }}>
              {TABS.map(tab => {
                const active = activeTab === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '14px 16px', fontSize: 13, fontWeight: active ? 700 : 500,
                      color: active ? '#5b52f5' : '#6b6e87',
                      borderBottom: active ? '2px solid #5b52f5' : '2px solid transparent',
                      marginBottom: -1, whiteSpace: 'nowrap', fontFamily: 'inherit',
                      transition: 'color 0.15s',
                    }}
                  >
                    {tab}
                    {tab !== 'All Returns' && (
                      <span style={{
                        marginLeft: 7, fontSize: 10, fontWeight: 700,
                        background: active ? '#ede9fe' : '#f5f3ef',
                        color: active ? '#5b52f5' : '#9496b0',
                        borderRadius: 10, padding: '2px 6px',
                      }}>
                        {MOCK_RETURNS.filter(r => r.status === tab).length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '90px 1.8fr 85px 1fr 1fr 90px 80px 100px 95px 85px',
              padding: '10px 20px',
              borderBottom: '1px solid #f0ede8',
              background: '#fafaf9',
            }}>
              {['Return ID', 'Product', 'Channel', 'Reason', 'Condition', 'Action', 'Refund', 'P&L Impact', 'Status', 'Date'].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Table rows */}
            {filtered.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#6b6e87', fontSize: 14 }}>
                No returns in this category.
              </div>
            ) : (
              filtered.map((r, i) => {
                const isHovered = hoveredRow === r.id
                const loss = r.plImpact < 0
                return (
                  <div
                    key={r.id}
                    onMouseEnter={() => setHoveredRow(r.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 1.8fr 85px 1fr 1fr 90px 80px 100px 95px 85px',
                      padding: '13px 20px',
                      borderBottom: i < filtered.length - 1 ? '1px solid #f0ede8' : 'none',
                      alignItems: 'center',
                      background: isHovered ? '#f9f8f6' : 'white',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#5b52f5', fontFamily: 'ui-monospace, monospace' }}>
                      {r.id}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1b22', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
                      {r.product}
                    </div>
                    <div>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        padding: '3px 8px', borderRadius: 100,
                        background: r.channel === 'eBay' ? '#fff3f3' : r.channel === 'Amazon' ? '#fffbf0' : '#f3f9ec',
                        color: r.channel === 'eBay' ? '#E53238' : r.channel === 'Amazon' ? '#CC7700' : '#5a8a1f',
                        border: `1px solid ${r.channel === 'eBay' ? '#fecaca' : r.channel === 'Amazon' ? '#fde68a' : '#a7f3d0'}`,
                      }}>
                        {r.channel}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b6e87', paddingRight: 8 }}>{r.reason}</div>
                    <div style={{ fontSize: 12, color: '#6b6e87' }}>{r.condition}</div>
                    <div style={{ fontSize: 12, color: '#1a1b22', fontWeight: 500 }}>{r.action}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22', fontFamily: 'ui-monospace, monospace' }}>
                      {fmt(r.refund)}
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: loss ? '#dc2626' : '#059669',
                      fontFamily: 'ui-monospace, monospace',
                    }}>
                      {loss ? '−' : '+'}{fmt(r.plImpact)}
                    </div>
                    <div><StatusPill status={r.status} /></div>
                    <div style={{ fontSize: 12, color: '#9496b0' }}>
                      {new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* ── Bottom row: chart + channel rates ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

            {/* Returns by reason chart */}
            <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                Returns by reason
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {REASONS_CHART.map(item => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#1a1b22', fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#6b6e87', fontFamily: 'ui-monospace, monospace' }}>{item.pct}%</span>
                    </div>
                    <div style={{ height: 8, background: '#f0ede8', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${item.pct}%`,
                        background: item.pct >= 30 ? '#5b52f5' : item.pct >= 20 ? '#7c6af7' : item.pct >= 15 ? '#a89ef8' : '#c4bffb',
                        borderRadius: 4,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Return rate by channel */}
            <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                Return rate by channel
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {CHANNEL_RATES.map(ch => (
                  <div key={ch.channel} style={{
                    background: ch.bg,
                    border: `1px solid ${ch.border}`,
                    borderRadius: 10,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22' }}>{ch.channel}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: ch.color, fontFamily: 'ui-monospace, monospace', letterSpacing: '-0.02em' }}>
                      {ch.rate}
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: '#9496b0', marginTop: 4 }}>
                  Industry benchmark: ~3.5% average return rate
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
