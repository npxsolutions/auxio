'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'

interface Listing {
  id: string
  title: string
  sku: string | null
  price: number
  cost_price: number | null
  category: string | null
  status: string
}

interface EditState {
  [id: string]: string
}

function margin(price: number, cost: number | null): number | null {
  if (!cost || cost <= 0 || !price || price <= 0) return null
  return ((price - cost) / price) * 100
}

function marginColor(m: number | null) {
  if (m === null) return '#9496b0'
  if (m < 0)  return '#dc2626'
  if (m < 10) return '#d97706'
  if (m < 20) return '#059669'
  return '#16a34a'
}

function marginLabel(m: number | null) {
  if (m === null) return '—'
  return `${m.toFixed(1)}%`
}

export default function CostsPage() {
  const router = useRouter()
  const [listings, setListings]   = useState<Listing[]>([])
  const [loading, setLoading]     = useState(true)
  const [edits, setEdits]         = useState<EditState>({})
  const [saving, setSaving]       = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState<'all' | 'missing' | 'low'>('all')
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  const [applyingDefault, setApplyingDefault] = useState(false)
  const [defaultPct, setDefaultPct] = useState('50')
  const [showDefaultPanel, setShowDefaultPanel] = useState(false)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string, ok = true) {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToast({ msg, ok })
    toastRef.current = setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    fetch('/api/costs')
      .then(r => r.json())
      .then(({ listings: data, error }) => {
        if (error === 'Unauthorized') { router.push('/login'); return }
        setListings(data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function saveCost(id: string) {
    const raw = edits[id]
    if (raw === undefined) return
    const cost = parseFloat(raw)
    if (isNaN(cost) || cost < 0) { showToast('Enter a valid cost (e.g. 12.50)', false); return }

    setSaving(id)
    try {
      const res = await fetch('/api/costs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, cost_price: cost }),
      })
      const { error } = await res.json()
      if (error) { showToast(error, false); return }

      setListings(prev => prev.map(l => l.id === id ? { ...l, cost_price: cost } : l))
      setEdits(prev => { const n = { ...prev }; delete n[id]; return n })
      showToast('Cost saved')
    } finally {
      setSaving(null)
    }
  }

  async function applyDefault() {
    const pct = parseFloat(defaultPct)
    if (isNaN(pct) || pct <= 0 || pct >= 100) { showToast('Enter a valid percentage (1–99)', false); return }
    setApplyingDefault(true)
    try {
      const res = await fetch('/api/costs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apply_default_pct: pct }),
      })
      const { applied, error } = await res.json()
      if (error) { showToast(error, false); return }
      // Reload
      const r2 = await fetch('/api/costs')
      const { listings: data } = await r2.json()
      setListings(data || [])
      setShowDefaultPanel(false)
      showToast(`Applied ${pct}% COGS to ${applied} listing${applied !== 1 ? 's' : ''}`)
    } finally {
      setApplyingDefault(false)
    }
  }

  const filtered = listings.filter(l => {
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || (l.sku || '').toLowerCase().includes(search.toLowerCase())
    const m = margin(l.price, l.cost_price)
    const matchFilter =
      filter === 'all'     ? true :
      filter === 'missing' ? l.cost_price === null :
      filter === 'low'     ? (m !== null && m < 15) : true
    return matchSearch && matchFilter
  })

  const missingCount = listings.filter(l => l.cost_price === null).length
  const lowMarginCount = listings.filter(l => {
    const m = margin(l.price, l.cost_price)
    return m !== null && m < 15
  }).length
  const avgMargin = (() => {
    const withCost = listings.filter(l => l.cost_price !== null && l.price > 0)
    if (!withCost.length) return null
    return withCost.reduce((s, l) => s + (margin(l.price, l.cost_price) || 0), 0) / withCost.length
  })()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f4ec', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', WebkitFontSmoothing: 'antialiased' as any }}>
      <AppSidebar />

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: 'white', color: '#1a1b22',
          border: `1px solid ${toast.ok ? '#a7f3d0' : '#fecaca'}`,
          borderLeft: `3px solid ${toast.ok ? '#059669' : '#dc2626'}`,
          borderRadius: 10, padding: '12px 16px',
          fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: toast.ok ? '#059669' : '#dc2626' }}>{toast.ok ? '✓' : '✕'}</span>
          {toast.msg}
        </div>
      )}

      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', minWidth: 0 }}>
        <div style={{ maxWidth: 1100 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', margin: 0, letterSpacing: '-0.02em' }}>Costs & Margins</h1>
              <p style={{ fontSize: 13, color: '#6b6e87', margin: '4px 0 0' }}>
                Enter cost prices per product to unlock true profit tracking.
              </p>
            </div>
            <button
              onClick={() => setShowDefaultPanel(p => !p)}
              style={{
                background: '#0f172a', color: 'white', border: 'none',
                borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Apply default COGS %
            </button>
          </div>

          {/* Default COGS panel */}
          {showDefaultPanel && (
            <div style={{
              background: 'white', border: '1px solid #e8e5df', borderRadius: 12,
              padding: '20px 24px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22', marginBottom: 4 }}>Apply default COGS to products without a cost price</div>
                <div style={{ fontSize: 12, color: '#6b6e87' }}>This will fill in cost prices for all listings that don't have one yet.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <input
                  type="number"
                  value={defaultPct}
                  onChange={e => setDefaultPct(e.target.value)}
                  min="1" max="99" step="1"
                  style={{
                    width: 80, padding: '8px 10px', border: '1px solid #e8e5df',
                    borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <span style={{ fontSize: 13, color: '#6b6e87' }}>% of selling price</span>
                <button
                  onClick={applyDefault}
                  disabled={applyingDefault}
                  style={{
                    background: '#e8863f', color: 'white', border: 'none',
                    borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                    cursor: applyingDefault ? 'wait' : 'pointer', opacity: applyingDefault ? 0.7 : 1,
                  }}
                >
                  {applyingDefault ? 'Applying…' : `Apply to ${missingCount} listings`}
                </button>
                <button
                  onClick={() => setShowDefaultPanel(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9496b0', fontSize: 20, lineHeight: 1 }}
                >×</button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              {
                label: 'Products',
                value: String(listings.length),
                sub: 'total listings',
                icon: '📦',
              },
              {
                label: 'Missing Cost',
                value: String(missingCount),
                sub: 'need a cost price',
                icon: '⚠️',
                valueColor: missingCount > 0 ? '#d97706' : '#059669',
              },
              {
                label: 'Low Margin (<15%)',
                value: String(lowMarginCount),
                sub: 'below target margin',
                icon: '📉',
                valueColor: lowMarginCount > 0 ? '#dc2626' : '#059669',
              },
              {
                label: 'Avg Margin',
                value: avgMargin !== null ? `${avgMargin.toFixed(1)}%` : '—',
                sub: 'across all products',
                icon: '💰',
                valueColor: avgMargin !== null ? marginColor(avgMargin) : '#9496b0',
              },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.valueColor || '#1a1b22', letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: '#6b6e87', marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Filters + search */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or SKU…"
              style={{
                flex: 1, maxWidth: 320, padding: '8px 12px',
                border: '1px solid #e8e5df', borderRadius: 8,
                fontSize: 13, outline: 'none', background: 'white', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', background: 'white', border: '1px solid #e8e5df', borderRadius: 8, overflow: 'hidden' }}>
              {([
                { id: 'all',     label: 'All' },
                { id: 'missing', label: `Missing (${missingCount})` },
                { id: 'low',     label: `Low margin (${lowMarginCount})` },
              ] as const).map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: '8px 14px', border: 'none', borderRight: f.id !== 'low' ? '1px solid #e8e5df' : 'none',
                    background: filter === f.id ? '#f0effd' : 'transparent',
                    color: filter === f.id ? '#e8863f' : '#6b6e87',
                    fontSize: 12, fontWeight: filter === f.id ? 600 : 400,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#faf9f7', borderBottom: '1px solid #e8e5df' }}>
                  {['Product', 'SKU', 'Selling Price', 'Cost Price', 'Margin', ''].map(col => (
                    <th key={col} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: '#9496b0',
                      textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                      whiteSpace: 'nowrap' as const,
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#9496b0' }}>
                      Loading products…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#9496b0' }}>
                      {search || filter !== 'all' ? 'No products match your filter.' : 'No products yet. Import or create listings first.'}
                    </td>
                  </tr>
                )}
                {filtered.map((listing, idx) => {
                  const m = margin(listing.price, listing.cost_price)
                  const mColor = marginColor(m)
                  const hasEdit = edits[listing.id] !== undefined
                  const editVal = edits[listing.id] ?? ''
                  const isSaving = saving === listing.id

                  return (
                    <tr key={listing.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f0ede8' : 'none', background: hasEdit ? 'rgba(232,134,63,$1)' : 'white' }}>

                      {/* Title */}
                      <td style={{ padding: '12px 16px', maxWidth: 280 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1b22', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {listing.title}
                        </div>
                        {listing.category && (
                          <div style={{ fontSize: 11, color: '#9496b0', marginTop: 2 }}>{listing.category}</div>
                        )}
                      </td>

                      {/* SKU */}
                      <td style={{ padding: '12px 16px', color: '#9496b0', fontSize: 12, fontFamily: 'var(--font-mono, monospace)' }}>
                        {listing.sku || '—'}
                      </td>

                      {/* Selling price */}
                      <td style={{ padding: '12px 16px', color: '#1a1b22', fontWeight: 500 }}>
                        £{listing.price?.toFixed(2) ?? '—'}
                      </td>

                      {/* Cost price — inline edit */}
                      <td style={{ padding: '8px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#9496b0', fontSize: 13 }}>£</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={hasEdit ? editVal : (listing.cost_price?.toFixed(2) ?? '')}
                            placeholder={listing.cost_price === null ? 'Enter cost…' : ''}
                            onChange={e => setEdits(prev => ({ ...prev, [listing.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && saveCost(listing.id)}
                            onBlur={() => hasEdit && saveCost(listing.id)}
                            style={{
                              width: 90, padding: '5px 8px',
                              border: `1px solid ${hasEdit ? '#e8863f' : listing.cost_price === null ? '#fde68a' : '#e8e5df'}`,
                              borderRadius: 6, fontSize: 13, outline: 'none',
                              fontFamily: 'inherit', background: 'white',
                              boxShadow: hasEdit ? '0 0 0 2px rgba(232,134,63,$1)' : 'none',
                            }}
                          />
                        </div>
                      </td>

                      {/* Margin */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 13, fontWeight: 600, color: mColor,
                          background: m === null ? '#f8f4ec' : m < 0 ? '#fef2f2' : m < 10 ? '#fffbeb' : '#ecfdf5',
                          padding: '3px 8px', borderRadius: 6,
                        }}>
                          {marginLabel(m)}
                        </span>
                      </td>

                      {/* Save button (only when edited) */}
                      <td style={{ padding: '8px 16px' }}>
                        {hasEdit && (
                          <button
                            onClick={() => saveCost(listing.id)}
                            disabled={isSaving}
                            style={{
                              background: '#e8863f', color: 'white', border: 'none',
                              borderRadius: 6, padding: '5px 12px', fontSize: 12,
                              fontWeight: 600, cursor: isSaving ? 'wait' : 'pointer',
                              opacity: isSaving ? 0.7 : 1, fontFamily: 'inherit',
                            }}
                          >
                            {isSaving ? 'Saving…' : 'Save'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: 12, color: '#9496b0', marginTop: 16, lineHeight: 1.6 }}>
            Cost price = what you paid for the stock. Margin = (selling price − cost) ÷ selling price.
            Channel fees and shipping are applied from your <a href="/settings" style={{ color: '#e8863f' }}>Settings</a>.
          </p>
        </div>
      </main>
    </div>
  )
}
