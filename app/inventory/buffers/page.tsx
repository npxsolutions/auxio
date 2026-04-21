'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase-client'
import AppSidebar from '../../components/AppSidebar'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BufferRule {
  id: string
  sku?: string
  product_title?: string
  channel: 'all' | 'ebay' | 'amazon' | 'shopify'
  buffer_type: 'fixed' | 'percentage'
  buffer_value: number        // units if fixed, % if percentage
  safety_stock: number        // absolute floor — never sell below this
  total_stock: number         // mock physical stock
  enabled: boolean
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_BUFFERS: BufferRule[] = [
  { id: 'b1', sku: 'TEE-BLK-M', product_title: 'Cotton T-Shirt — Black / M', channel: 'all',    buffer_type: 'fixed',      buffer_value: 5,  safety_stock: 2,  total_stock: 18, enabled: true },
  { id: 'b2', sku: 'HP-BLK',    product_title: 'Wireless Headphones — Black',  channel: 'ebay',   buffer_type: 'fixed',      buffer_value: 2,  safety_stock: 1,  total_stock: 14, enabled: true },
  { id: 'b3', sku: 'TR-BLK-8',  product_title: 'Running Trainers — Black / 8', channel: 'amazon', buffer_type: 'percentage',  buffer_value: 20, safety_stock: 3,  total_stock: 12, enabled: true },
  { id: 'b4', sku: 'TEE-WHT-S', product_title: 'Cotton T-Shirt — White / S',   channel: 'all',    buffer_type: 'fixed',      buffer_value: 3,  safety_stock: 1,  total_stock: 15, enabled: false },
  { id: 'b5', sku: 'HP-WHT',    product_title: 'Wireless Headphones — White',  channel: 'shopify',buffer_type: 'percentage',  buffer_value: 15, safety_stock: 0,  total_stock: 8,  enabled: true },
]

const CHANNEL_META: Record<string, { label: string; color: string; bg: string }> = {
  all:     { label: 'All Channels', color: '#e8863f', bg: '#ede9fe' },
  ebay:    { label: 'eBay',         color: '#b91c1c', bg: '#fee2e2' },
  amazon:  { label: 'Amazon',       color: '#b45309', bg: '#fef3c7' },
  shopify: { label: 'Shopify',      color: '#166534', bg: '#dcfce7' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function availableToSell(rule: BufferRule): number {
  const reserved = rule.buffer_type === 'fixed'
    ? rule.buffer_value
    : Math.ceil(rule.total_stock * rule.buffer_value / 100)
  return Math.max(0, rule.total_stock - reserved - rule.safety_stock)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InventoryBuffersPage() {
  const router = useRouter()
  const [buffers, setBuffers]   = useState<BufferRule[]>(MOCK_BUFFERS)
  const [showAdd, setShowAdd]   = useState(false)
  const [toast, setToast]       = useState('')
  const [toastType, setToastType] = useState<'success'|'error'>('success')
  const [editingId, setEditingId] = useState<string|null>(null)
  const supabase = createClient()

  // New rule form
  const [newSku, setNewSku]         = useState('')
  const [newTitle, setNewTitle]     = useState('')
  const [newChannel, setNewChannel] = useState<BufferRule['channel']>('all')
  const [newBufType, setNewBufType] = useState<'fixed'|'percentage'>('fixed')
  const [newBufVal, setNewBufVal]   = useState('5')
  const [newSafety, setNewSafety]   = useState('2')

  useEffect(() => {
    async function guard() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
    }
    guard()
  }, [])

  function showToast(msg: string, type: 'success'|'error' = 'success') {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(''), 3000)
  }

  function toggleEnabled(id: string) {
    setBuffers(prev => prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b))
    const rule = buffers.find(b => b.id === id)
    showToast(`Buffer for ${rule?.sku || 'rule'} ${rule?.enabled ? 'paused' : 'activated'}`)
  }

  function deleteRule(id: string) {
    const rule = buffers.find(b => b.id === id)
    setBuffers(prev => prev.filter(b => b.id !== id))
    showToast(`Buffer rule removed`, 'success')
  }

  function addRule() {
    if (!newSku.trim()) return
    const rule: BufferRule = {
      id: Date.now().toString(),
      sku: newSku,
      product_title: newTitle || newSku,
      channel: newChannel,
      buffer_type: newBufType,
      buffer_value: parseFloat(newBufVal) || 0,
      safety_stock: parseFloat(newSafety) || 0,
      total_stock: 0,
      enabled: true,
    }
    setBuffers(prev => [rule, ...prev])
    setNewSku(''); setNewTitle(''); setNewChannel('all'); setNewBufType('fixed'); setNewBufVal('5'); setNewSafety('2')
    setShowAdd(false)
    showToast(`Buffer rule for ${rule.sku} created`)
  }

  const totalReserved = buffers.filter(b => b.enabled).reduce((s, b) => {
    const res = b.buffer_type === 'fixed' ? b.buffer_value : Math.ceil(b.total_stock * b.buffer_value / 100)
    return s + res + b.safety_stock
  }, 0)
  const totalAts = buffers.reduce((s, b) => s + availableToSell(b), 0)
  const activeRules = buffers.filter(b => b.enabled).length

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid #e8e5df',
    borderRadius: 7, fontSize: 13, fontFamily: 'inherit', color: '#1a1b22',
    outline: 'none', boxSizing: 'border-box', background: 'white',
  }

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', minHeight: '100vh', background: '#f8f4ec', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 200,
          background: 'white', color: '#1a1b22', border: '1px solid #e8e5df',
          borderLeft: `3px solid ${toastType === 'success' ? '#059669' : '#dc2626'}`,
          borderRadius: 10, padding: '14px 18px', fontSize: 13, fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ color: toastType === 'success' ? '#059669' : '#dc2626' }}>{toastType === 'success' ? '✓' : '✕'}</span>
          {toast}
        </div>
      )}

      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: 900 }}>

          {/* Breadcrumb */}
          <div style={{ fontSize: 12, color: '#9496b0', marginBottom: 16 }}>
            <button onClick={() => router.push('/inventory')} style={{ background: 'none', border: 'none', color: '#9496b0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 0 }}>
              Inventory
            </button>
            {' / '}
            <span style={{ color: '#1a1b22' }}>Buffers & Safety Stock</span>
          </div>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1b22', margin: 0, letterSpacing: '-0.03em' }}>Inventory Buffers</h1>
              <p style={{ fontSize: 14, color: '#6b6e87', margin: '4px 0 0' }}>
                Reserve stock per channel and set safety floors to prevent overselling.
              </p>
            </div>
            <button
              onClick={() => setShowAdd(v => !v)}
              style={{ background: '#e8863f', color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              + Add Buffer Rule
            </button>
          </div>

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Active Rules',       value: activeRules,                   sub: 'protecting stock',     color: '#e8863f' },
              { label: 'Units Reserved',     value: totalReserved,                 sub: 'across all channels',  color: '#d97706' },
              { label: 'Available to Sell',  value: totalAts,                      sub: 'net of all buffers',   color: '#059669' },
              { label: 'Oversell Risk',      value: buffers.filter(b => !b.enabled && b.total_stock > 0).length, sub: 'rules paused', color: '#dc2626' },
            ].map(k => (
              <div key={k.label} style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: k.color, letterSpacing: '-0.03em', fontFamily: 'monospace' }}>{k.value}</div>
                <div style={{ fontSize: 11, color: '#9496b0', marginTop: 2 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Explainer */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderLeft: '3px solid #2563eb', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e40af', marginBottom: 3 }}>How buffers work</div>
            <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.6 }}>
              A <strong>channel buffer</strong> reserves stock that's not shown as available on that channel (e.g. keep 5 units off eBay for walk-in customers). A <strong>safety stock floor</strong> is an absolute minimum — when stock hits that level, listings are paused automatically to prevent overselling.
            </div>
          </div>

          {/* Add rule form */}
          {showAdd && (
            <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1b22', marginBottom: 16 }}>New Buffer Rule</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1b22', display: 'block', marginBottom: 5 }}>SKU *</label>
                  <input value={newSku} onChange={e => setNewSku(e.target.value)} placeholder="e.g. TEE-BLK-M" style={inputBase} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1b22', display: 'block', marginBottom: 5 }}>Product name</label>
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Optional display name" style={inputBase} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1b22', display: 'block', marginBottom: 5 }}>Channel</label>
                  <select value={newChannel} onChange={e => setNewChannel(e.target.value as BufferRule['channel'])} style={{ ...inputBase }}>
                    <option value="all">All Channels</option>
                    <option value="ebay">eBay</option>
                    <option value="amazon">Amazon</option>
                    <option value="shopify">Shopify</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1b22', display: 'block', marginBottom: 5 }}>Buffer type</label>
                  <select value={newBufType} onChange={e => setNewBufType(e.target.value as 'fixed'|'percentage')} style={{ ...inputBase }}>
                    <option value="fixed">Fixed (units)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1b22', display: 'block', marginBottom: 5 }}>Buffer amount</label>
                  <input type="number" value={newBufVal} onChange={e => setNewBufVal(e.target.value)} placeholder={newBufType === 'fixed' ? 'Units' : 'Percent'} style={inputBase} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1b22', display: 'block', marginBottom: 5 }}>Safety stock (floor)</label>
                  <input type="number" value={newSafety} onChange={e => setNewSafety(e.target.value)} placeholder="Min units" style={inputBase} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addRule} style={{ background: '#e8863f', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save rule</button>
                <button onClick={() => setShowAdd(false)} style={{ background: 'white', color: '#6b6e87', border: '1px solid #e8e5df', borderRadius: 8, padding: '9px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Rules list */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Buffer Rules ({buffers.length})
          </div>

          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px 90px 90px 90px 80px 60px', gap: 12, padding: '10px 20px', background: '#fafafa', borderBottom: '1px solid #e8e5df' }}>
              {['SKU / Product', 'Channel', 'Buffer', 'Safety Stock', 'Total Stock', 'Avail. to Sell', 'Status', ''].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
              ))}
            </div>

            {buffers.map((rule, i) => {
              const ch  = CHANNEL_META[rule.channel]
              const ats = availableToSell(rule)
              const reservedUnits = rule.buffer_type === 'fixed'
                ? rule.buffer_value
                : Math.ceil(rule.total_stock * rule.buffer_value / 100)

              return (
                <div
                  key={rule.id}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px 90px 90px 90px 80px 60px', gap: 12, padding: '14px 20px', borderBottom: i < buffers.length - 1 ? '1px solid #f7f6f3' : 'none', alignItems: 'center', opacity: rule.enabled ? 1 : 0.55 }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22' }}>{rule.sku}</div>
                    {rule.product_title && <div style={{ fontSize: 11, color: '#6b6e87', marginTop: 1 }}>{rule.product_title}</div>}
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: ch.color, background: ch.bg, padding: '2px 8px', borderRadius: 100 }}>{ch.label}</span>
                  </div>

                  <div style={{ fontSize: 12, color: '#1a1b22' }}>
                    {rule.buffer_type === 'fixed'
                      ? <span><strong>{rule.buffer_value}</strong> units reserved</span>
                      : <span><strong>{rule.buffer_value}%</strong> reserved ({reservedUnits} units)</span>
                    }
                  </div>

                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: rule.safety_stock > 0 ? '#d97706' : '#9496b0' }}>
                    {rule.safety_stock > 0 ? `${rule.safety_stock} units` : '—'}
                  </div>

                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#1a1b22' }}>{rule.total_stock}</div>

                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: ats <= 0 ? '#dc2626' : ats <= 3 ? '#d97706' : '#059669' }}>
                    {ats}
                  </div>

                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                      background: rule.enabled ? '#ecfdf5' : '#f8f4ec',
                      color: rule.enabled ? '#059669' : '#9496b0',
                      border: `1px solid ${rule.enabled ? '#a7f3d0' : '#e8e5df'}`,
                      textTransform: 'uppercase' as const, letterSpacing: '0.05em',
                    }}>
                      {rule.enabled ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => toggleEnabled(rule.id)}
                      title={rule.enabled ? 'Pause' : 'Activate'}
                      style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e8e5df', borderRadius: 5, background: 'white', cursor: 'pointer', fontSize: 13 }}
                    >
                      {rule.enabled ? '⏸' : '▶'}
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      title="Remove"
                      style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fecaca', borderRadius: 5, background: '#fef2f2', cursor: 'pointer', fontSize: 13 }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}

            {buffers.length === 0 && (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#6b6e87' }}>No buffer rules yet. Add one to protect your stock from overselling.</div>
              </div>
            )}
          </div>

          {/* Channel stock overview */}
          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Channel Stock Allocation
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { ch: 'eBay',     total: 94, reserved: 12, ats: 82, color: '#b91c1c', bg: '#fee2e2' },
                { ch: 'Amazon',   total: 94, reserved: 8,  ats: 86, color: '#b45309', bg: '#fef3c7' },
                { ch: 'Shopify',  total: 94, reserved: 5,  ats: 89, color: '#166534', bg: '#dcfce7' },
              ].map(c => (
                <div key={c.ch} style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1b22' }}>{c.ch}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: c.color, background: c.bg, padding: '2px 8px', borderRadius: 100 }}>Active</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b6e87', marginBottom: 8 }}>
                    <span>Total stock</span><span style={{ fontFamily: 'monospace', color: '#1a1b22', fontWeight: 600 }}>{c.total}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b6e87', marginBottom: 8 }}>
                    <span>Reserved (buffer)</span><span style={{ fontFamily: 'monospace', color: '#d97706', fontWeight: 600 }}>{c.reserved}</span>
                  </div>
                  <div style={{ height: 4, background: '#f0ede8', borderRadius: 2, marginBottom: 8 }}>
                    <div style={{ height: '100%', width: `${(c.ats / c.total) * 100}%`, background: '#e8863f', borderRadius: 2 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b6e87' }}>
                    <span>Available to sell</span><span style={{ fontFamily: 'monospace', color: '#059669', fontWeight: 700 }}>{c.ats}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
