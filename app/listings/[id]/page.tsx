'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppSidebar from '../../components/AppSidebar'

type ChannelStatus = {
  channel_type: string
  status: string
  channel_url?: string
  error_message?: string
  published_at?: string
}

type HealthScore = {
  score: number
  missing_required: string[]
  missing_optional: string[]
  warnings: string[]
}

type Listing = {
  id: string
  title: string
  description?: string
  price: number
  compare_price?: number
  sku?: string
  barcode?: string
  brand?: string
  category?: string
  condition: string
  quantity: number
  weight_grams?: number
  images: string[]
  attributes: Record<string, any>
  status: string
  listing_channels: ChannelStatus[]
}

const CHANNELS = [
  { id: 'shopify', icon: '🛍️', name: 'Shopify', colour: '#96BF48' },
  { id: 'ebay',   icon: '🛒', name: 'eBay',    colour: '#E53238' },
  { id: 'amazon', icon: '📦', name: 'Amazon',  colour: '#FF9900', stub: true },
]

const STATUS_COLOUR: Record<string, string> = {
  published: '#0f7b6c',
  failed:    '#c9372c',
  pending:   '#9b9b98',
}

const CHANNEL_ICONS: Record<string, string> = { shopify: '🛍️', amazon: '📦', ebay: '🛒' }

// Maps field name → human label + which top-level key or attribute key it writes to
const FIELD_META: Record<string, { label: string; type?: string; isAttribute?: boolean }> = {
  title:        { label: 'Title' },
  description:  { label: 'Description', type: 'textarea' },
  brand:        { label: 'Brand' },
  category:     { label: 'Category' },
  barcode:      { label: 'Barcode / EAN' },
  sku:          { label: 'SKU' },
  price:        { label: 'Price (£)', type: 'number' },
  quantity:     { label: 'Stock quantity', type: 'number' },
  weight_grams: { label: 'Weight (grams)', type: 'number' },
  images:       { label: 'Image URLs (comma-separated)' },
  condition:    { label: 'Condition' },
}

function scoreColour(score: number) {
  return score >= 80 ? '#0f7b6c' : score >= 50 ? '#b45309' : '#c9372c'
}

function ScoreRing({ score }: { score: number }) {
  const colour = scoreColour(score)
  const r = 22, circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r={r} fill="none" stroke="#f1f1ef" strokeWidth="5" />
      <circle cx="30" cy="30" r={r} fill="none" stroke={colour} strokeWidth="5"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 30 30)" />
      <text x="30" y="35" textAnchor="middle" fontSize="13" fontWeight="700" fill={colour} fontFamily="Inter, sans-serif">{score}</text>
    </svg>
  )
}

// Inline field editor — renders a small "Fill in" button that expands to an input
function InlineField({
  fieldKey, currentValue, isAttribute, listingId, onSaved,
}: {
  fieldKey: string
  currentValue: any
  isAttribute: boolean
  listingId: string
  onSaved: (updated: Listing) => void
}) {
  const [open, setOpen]     = useState(false)
  const [value, setValue]   = useState(String(currentValue ?? ''))
  const [saving, setSaving] = useState(false)

  const meta = FIELD_META[fieldKey] || { label: fieldKey, isAttribute: true }

  async function save() {
    setSaving(true)
    try {
      // Build the patch body — attribute fields nest under `attributes`
      const body = isAttribute
        ? { attributes: { [fieldKey]: value } }
        : { [fieldKey]: meta.type === 'number' ? parseFloat(value) || 0 : value }

      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        onSaved(data.listing)
        setOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ fontSize: '12px', color: '#0f7b6c', background: '#e8f5f3', border: 'none', borderRadius: '5px', padding: '3px 9px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
      >
        Fill in →
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginTop: '4px' }}>
      {meta.type === 'textarea' ? (
        <textarea
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          rows={3}
          style={{ flex: 1, fontSize: '12px', padding: '6px 8px', border: '1px solid #191919', borderRadius: '6px', fontFamily: 'Inter, sans-serif', resize: 'vertical', outline: 'none' }}
        />
      ) : (
        <input
          autoFocus
          type={meta.type || 'text'}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false) }}
          placeholder={meta.label}
          style={{ flex: 1, fontSize: '12px', padding: '6px 8px', border: '1px solid #191919', borderRadius: '6px', fontFamily: 'Inter, sans-serif', outline: 'none' }}
        />
      )}
      <button onClick={save} disabled={saving} style={{ fontSize: '12px', padding: '6px 10px', background: '#191919', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {saving ? '...' : 'Save'}
      </button>
      <button onClick={() => setOpen(false)} style={{ fontSize: '12px', padding: '6px 8px', background: 'none', color: '#787774', border: '1px solid #e8e8e5', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
        ×
      </button>
    </div>
  )
}

// Editable text field in the details panel
function EditableField({
  label, value, fieldKey, listingId, type, onSaved,
}: {
  label: string
  value: any
  fieldKey: string
  listingId: string
  type?: string
  onSaved: (l: Listing) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(String(value ?? ''))
  const [saving, setSaving]   = useState(false)

  async function save() {
    setSaving(true)
    try {
      const parsed = type === 'number' ? (parseFloat(draft) || 0) : draft
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldKey]: parsed }),
      })
      const data = await res.json()
      if (res.ok) { onSaved(data.listing); setEditing(false) }
    } finally {
      setSaving(false)
    }
  }

  const display = value !== null && value !== undefined && value !== '' ? String(value) : '—'

  return (
    <div style={{ borderBottom: '1px solid #f1f1ef', padding: '10px 0' }}>
      <div style={{ fontSize: '11px', color: '#9b9b98', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{label}</div>
      {editing ? (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
          {type === 'textarea' ? (
            <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} rows={4}
              style={{ flex: 1, fontSize: '13px', padding: '6px 8px', border: '1px solid #191919', borderRadius: '6px', fontFamily: 'Inter, sans-serif', resize: 'vertical', outline: 'none' }} />
          ) : (
            <input autoFocus type={type || 'text'} value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
              style={{ flex: 1, fontSize: '13px', padding: '6px 8px', border: '1px solid #191919', borderRadius: '6px', fontFamily: 'Inter, sans-serif', outline: 'none' }} />
          )}
          <button onClick={save} disabled={saving} style={{ fontSize: '12px', padding: '6px 10px', background: '#191919', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
            {saving ? '...' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} style={{ fontSize: '12px', padding: '6px 8px', background: 'none', color: '#787774', border: '1px solid #e8e8e5', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>×</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }} onClick={() => { setDraft(String(value ?? '')); setEditing(true) }}>
          <span style={{ fontSize: '13px', color: display === '—' ? '#d0d0cc' : '#191919', fontWeight: display === '—' ? 400 : 600, flex: 1 }}>{display}</span>
          <span style={{ fontSize: '11px', color: '#c8c8c4', flexShrink: 0 }}>edit</span>
        </div>
      )}
    </div>
  )
}

export default function ListingDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [listing, setListing]             = useState<Listing | null>(null)
  const [loading, setLoading]             = useState(true)
  const [selected, setSelected]           = useState<string[]>([])
  const [publishing, setPublishing]       = useState(false)
  const [publishResult, setPublishResult] = useState<Record<string, any> | null>(null)
  const [publishError, setPublishError]   = useState('')
  const [health, setHealth]               = useState<Record<string, HealthScore> | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [optimising, setOptimising]       = useState(false)
  const [optimised, setOptimised]         = useState<Record<string, { title: string; description: string }> | null>(null)
  const [activeTab, setActiveTab]         = useState<'details' | 'health' | 'optimise'>('details')

  const refreshListing = useCallback(() =>
    fetch(`/api/listings/${id}`).then(r => r.json()).then(d => { if (d.listing) setListing(d.listing) }), [id])

  useEffect(() => {
    fetch(`/api/listings/${id}`).then(r => r.json()).then(d => { setListing(d.listing); setLoading(false) })
  }, [id])

  async function loadHealth() {
    setHealthLoading(true)
    try {
      const res = await fetch(`/api/listings/${id}/health`)
      const data = await res.json()
      if (res.ok) setHealth(data.health)
    } finally {
      setHealthLoading(false)
    }
  }

  // When user saves a field from the health tab, refresh scores automatically
  async function onFieldSaved(updated: Listing) {
    setListing(updated)
    // Merge new attribute values into listing state then re-score
    setHealthLoading(true)
    try {
      const res = await fetch(`/api/listings/${id}/health`)
      const data = await res.json()
      if (res.ok) setHealth(data.health)
    } finally {
      setHealthLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'health' && !health) loadHealth()
  }, [activeTab])

  function toggleChannel(ch: string) {
    setSelected(s => s.includes(ch) ? s.filter(c => c !== ch) : [...s, ch])
  }

  async function publish() {
    if (!selected.length) return
    setPublishing(true)
    setPublishError('')
    setPublishResult(null)
    try {
      const res = await fetch(`/api/listings/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: selected }),
      })
      const data = await res.json()
      if (!res.ok) { setPublishError(data.error); return }
      setPublishResult(data.results)
      refreshListing()
    } catch (err: any) {
      setPublishError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  async function optimise() {
    setOptimising(true)
    try {
      const res = await fetch(`/api/listings/${id}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: ['shopify', 'ebay', 'amazon'] }),
      })
      const data = await res.json()
      if (res.ok) setOptimised(data.optimised)
    } finally {
      setOptimising(false)
    }
  }

  if (loading) return (
    <div style={{ fontFamily: 'Inter, sans-serif', display: 'flex', minHeight: '100vh' }}>
      <AppSidebar />
      <div style={{ marginLeft: '220px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9b9b98' }}>Loading...</div>
    </div>
  )
  if (!listing) return (
    <div style={{ fontFamily: 'Inter, sans-serif', display: 'flex', minHeight: '100vh' }}>
      <AppSidebar />
      <div style={{ marginLeft: '220px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9372c' }}>Listing not found</div>
    </div>
  )

  const tabStyle = (t: typeof activeTab) => ({
    padding: '8px 16px', border: 'none',
    background: activeTab === t ? 'white' : 'transparent',
    borderRadius: '7px', fontSize: '13px', fontWeight: 600,
    color: activeTab === t ? '#191919' : '#787774',
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    boxShadow: activeTab === t ? '0 1px 4px #0001' : 'none',
  })

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f7f7f5', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px', minWidth: 0 }}>
      <div style={{ maxWidth: '960px' }}>

        <button onClick={() => router.push('/listings')} style={{ background: 'none', border: 'none', color: '#787774', fontSize: '13px', cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif', marginBottom: '24px' }}>
          ← Back to listings
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#191919', margin: 0, letterSpacing: '-0.02em', flex: 1 }}>{listing.title}</h1>
          <span style={{ fontSize: '11px', background: listing.status === 'published' ? '#e8f5f3' : '#f1f1ef', color: listing.status === 'published' ? '#0f7b6c' : '#787774', padding: '4px 10px', borderRadius: '5px', fontWeight: 600, marginLeft: '12px' }}>
            {listing.status.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'inline-flex', gap: '4px', background: '#f1f1ef', padding: '4px', borderRadius: '10px', marginBottom: '20px' }}>
          <button style={tabStyle('details')}  onClick={() => setActiveTab('details')}>Details</button>
          <button style={tabStyle('health')}   onClick={() => setActiveTab('health')}>Feed health</button>
          <button style={tabStyle('optimise')} onClick={() => setActiveTab('optimise')}>AI optimise</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>

          {/* ── LEFT ── */}
          <div>

            {/* DETAILS TAB — all fields editable inline */}
            {activeTab === 'details' && <>
              {listing.images?.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {listing.images.map((img, i) => (
                    <img key={i} src={img} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e8e8e5' }} />
                  ))}
                </div>
              )}

              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>Product details</div>
                <EditableField label="Title"       value={listing.title}       fieldKey="title"       listingId={id} onSaved={setListing} />
                <EditableField label="Description" value={listing.description} fieldKey="description" listingId={id} type="textarea" onSaved={setListing} />
                <EditableField label="Brand"       value={listing.brand}       fieldKey="brand"       listingId={id} onSaved={setListing} />
                <EditableField label="Category"    value={listing.category}    fieldKey="category"    listingId={id} onSaved={setListing} />
                <EditableField label="Condition"   value={listing.condition}   fieldKey="condition"   listingId={id} onSaved={setListing} />
              </div>

              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>Pricing & inventory</div>
                <EditableField label="Price (£)"          value={listing.price}         fieldKey="price"         listingId={id} type="number" onSaved={setListing} />
                <EditableField label="Compare at price (£)" value={listing.compare_price} fieldKey="compare_price" listingId={id} type="number" onSaved={setListing} />
                <EditableField label="Stock quantity"     value={listing.quantity}      fieldKey="quantity"      listingId={id} type="number" onSaved={setListing} />
                <EditableField label="SKU"                value={listing.sku}           fieldKey="sku"           listingId={id} onSaved={setListing} />
                <EditableField label="Barcode / EAN"      value={listing.barcode}       fieldKey="barcode"       listingId={id} onSaved={setListing} />
                <EditableField label="Weight (grams)"     value={listing.weight_grams}  fieldKey="weight_grams"  listingId={id} type="number" onSaved={setListing} />
              </div>

              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>Images</div>
                <EditableField label="Image URLs (comma-separated)" value={Array.isArray(listing.images) ? listing.images.join(', ') : ''} fieldKey="images" listingId={id} onSaved={setListing} />
              </div>

              {Object.keys(listing.attributes || {}).length > 0 && (
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>Attributes</div>
                  {Object.entries(listing.attributes).map(([k, v]) => (
                    <EditableField key={k} label={k} value={v} fieldKey={k} listingId={id} onSaved={setListing} />
                  ))}
                </div>
              )}

              {/* Channel status */}
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginTop: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '16px' }}>Channel status</div>
                {CHANNELS.map(ch => {
                  const cs = listing.listing_channels?.find(lc => lc.channel_type === ch.id)
                  return (
                    <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f1ef' }}>
                      <span style={{ fontSize: '20px' }}>{ch.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>
                          {ch.name}
                          {ch.stub && <span style={{ fontSize: '10px', color: '#9b9b98', background: '#f1f1ef', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 600 }}>COMING SOON</span>}
                        </div>
                        {cs?.error_message && <div style={{ fontSize: '11px', color: '#c9372c', marginTop: '2px' }}>{cs.error_message}</div>}
                        {cs?.channel_url && <a href={cs.channel_url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#0f7b6c' }}>View listing →</a>}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: cs ? STATUS_COLOUR[cs.status] : '#9b9b98', background: (cs ? STATUS_COLOUR[cs.status] : '#9b9b98') + '15', padding: '3px 8px', borderRadius: '4px' }}>
                        {cs ? cs.status.toUpperCase() : 'NOT PUBLISHED'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>}

            {/* HEALTH TAB — missing fields with inline fill-in */}
            {activeTab === 'health' && (
              <div>
                {healthLoading ? (
                  <div style={{ color: '#9b9b98', fontSize: '13px', padding: '24px 0' }}>Scoring listing...</div>
                ) : health ? (
                  <>
                    {/* Summary row */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      {CHANNELS.map(ch => {
                        const h = health[ch.id]
                        if (!h) return null
                        return (
                          <div key={ch.id} style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '13px', marginBottom: '8px' }}>{ch.icon} {ch.name}</div>
                            <ScoreRing score={h.score} />
                          </div>
                        )
                      })}
                    </div>

                    {/* Per-channel detail */}
                    {CHANNELS.map(ch => {
                      const h = health[ch.id]
                      if (!h) return null
                      const allClear = h.missing_required.length === 0 && h.missing_optional.length === 0 && h.warnings.length === 0
                      return (
                        <div key={ch.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: allClear ? 0 : '16px' }}>
                            <span style={{ fontSize: '20px' }}>{ch.icon}</span>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#191919', flex: 1 }}>{ch.name}</span>
                            <ScoreRing score={h.score} />
                          </div>

                          {allClear && (
                            <div style={{ fontSize: '13px', color: '#0f7b6c' }}>All fields complete — ready to publish</div>
                          )}

                          {h.missing_required.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#c9372c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Required — listing won't perform without these</div>
                              {h.missing_required.map(f => {
                                const isAttr = f.startsWith('attributes.')
                                const key = isAttr ? f.replace('attributes.', '') : f
                                const current = isAttr ? listing.attributes?.[key] : (listing as any)[key]
                                return (
                                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fce8e6', gap: '12px' }}>
                                    <div>
                                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>{FIELD_META[key]?.label || key}</div>
                                      {isAttr && <div style={{ fontSize: '11px', color: '#9b9b98' }}>Channel attribute</div>}
                                    </div>
                                    <InlineField
                                      fieldKey={key}
                                      currentValue={current}
                                      isAttribute={isAttr}
                                      listingId={id}
                                      onSaved={onFieldSaved}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {h.missing_optional.length > 0 && (
                            <div style={{ marginBottom: h.warnings.length ? '16px' : 0 }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Recommended — improves ranking & conversions</div>
                              {h.missing_optional.map(f => {
                                const isAttr = f.startsWith('attributes.')
                                const key = isAttr ? f.replace('attributes.', '') : f
                                const current = isAttr ? listing.attributes?.[key] : (listing as any)[key]
                                return (
                                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fef3e2', gap: '12px' }}>
                                    <div>
                                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>{FIELD_META[key]?.label || key}</div>
                                      {isAttr && <div style={{ fontSize: '11px', color: '#9b9b98' }}>Channel attribute</div>}
                                    </div>
                                    <InlineField
                                      fieldKey={key}
                                      currentValue={current}
                                      isAttribute={isAttr}
                                      listingId={id}
                                      onSaved={onFieldSaved}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {h.warnings.length > 0 && (
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#787774', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Warnings</div>
                              {h.warnings.map((w, i) => (
                                <div key={i} style={{ fontSize: '12px', color: '#787774', padding: '3px 0' }}>· {w}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    <button onClick={loadHealth} style={{ fontSize: '12px', color: '#787774', background: 'none', border: '1px solid #e8e8e5', borderRadius: '7px', padding: '8px 14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      Refresh scores
                    </button>
                  </>
                ) : null}
              </div>
            )}

            {/* OPTIMISE TAB */}
            {activeTab === 'optimise' && (
              <div>
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '4px' }}>AI-optimised titles & descriptions</div>
                  <p style={{ fontSize: '12px', color: '#787774', margin: '0 0 16px', lineHeight: 1.6 }}>
                    Claude rewrites your listing for each channel — keyword-rich for eBay Cassini, benefit-led for Amazon A9, and brand-forward for Shopify.
                  </p>
                  <button onClick={optimise} disabled={optimising}
                    style={{ padding: '10px 18px', background: optimising ? '#e8e8e5' : '#191919', color: optimising ? '#9b9b98' : 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: optimising ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    {optimising ? 'Optimising with Claude...' : 'Optimise for all channels'}
                  </button>
                </div>

                {optimised && CHANNELS.map(ch => {
                  const o = optimised[ch.id]
                  if (!o) return null
                  return (
                    <div key={ch.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '18px' }}>{ch.icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#191919', flex: 1 }}>{ch.name}</span>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Title</div>
                        <div style={{ fontSize: '13px', color: '#191919', fontWeight: 600 }}>{o.title}</div>
                        <div style={{ fontSize: '11px', color: '#9b9b98', marginTop: '2px' }}>{o.title.length} chars</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Description</div>
                        <div style={{ fontSize: '12px', color: '#3d3d3a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{o.description}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT — publish panel ── */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', position: 'sticky', top: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '4px' }}>Publish to channels</div>
            <p style={{ fontSize: '12px', color: '#787774', margin: '0 0 16px' }}>Select where to publish this listing</p>

            {publishError && (
              <div style={{ background: '#fce8e6', color: '#c9372c', padding: '10px 12px', borderRadius: '7px', fontSize: '12px', marginBottom: '12px' }}>{publishError}</div>
            )}
            {publishResult && (
              <div style={{ background: '#e8f5f3', color: '#0f7b6c', padding: '10px 12px', borderRadius: '7px', fontSize: '12px', marginBottom: '12px' }}>
                {Object.entries(publishResult).map(([ch, r]: any) => (
                  <div key={ch}>{CHANNEL_ICONS[ch]} {ch}: {r.status}{r.error ? ` — ${r.error}` : ''}</div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {CHANNELS.map(ch => {
                const cs = listing.listing_channels?.find(lc => lc.channel_type === ch.id)
                const isPublished = cs?.status === 'published'
                const isChecked   = selected.includes(ch.id)
                return (
                  <label key={ch.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${isChecked ? '#191919' : '#e8e8e5'}`, cursor: ch.stub ? 'default' : 'pointer', opacity: ch.stub ? 0.5 : 1 }}>
                    <input type="checkbox" checked={isChecked} disabled={!!ch.stub}
                      onChange={() => !ch.stub && toggleChannel(ch.id)} style={{ accentColor: '#191919' }} />
                    <span style={{ fontSize: '16px' }}>{ch.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#191919', flex: 1 }}>{ch.name}</span>
                    {isPublished && <span style={{ fontSize: '10px', color: '#0f7b6c', fontWeight: 700 }}>✓ LIVE</span>}
                    {ch.stub && <span style={{ fontSize: '10px', color: '#9b9b98', fontWeight: 600 }}>SOON</span>}
                  </label>
                )
              })}
            </div>

            <button onClick={publish} disabled={publishing || selected.length === 0}
              style={{ width: '100%', padding: '12px', background: selected.length && !publishing ? '#191919' : '#e8e8e5', color: selected.length && !publishing ? 'white' : '#9b9b98', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: selected.length && !publishing ? 'pointer' : 'default', fontFamily: 'Inter, sans-serif' }}>
              {publishing ? 'Publishing...' : `Publish to ${selected.length || 0} channel${selected.length !== 1 ? 's' : ''}`}
            </button>

            {/* Quick health summary in sidebar */}
            {health && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f1ef' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Feed health</div>
                {CHANNELS.map(ch => {
                  const h = health[ch.id]
                  if (!h) return null
                  const c = scoreColour(h.score)
                  return (
                    <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px' }}>{ch.icon}</span>
                      <div style={{ flex: 1, height: '4px', background: '#f1f1ef', borderRadius: '2px' }}>
                        <div style={{ width: `${h.score}%`, height: '4px', background: c, borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: c, minWidth: '26px', textAlign: 'right' }}>{h.score}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      </main>
    </div>
  )
}
