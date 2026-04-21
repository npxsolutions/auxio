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
  cost_price?: number
  images: string[]
  attributes: Record<string, any>
  status: string
  listing_channels: ChannelStatus[]
}

type TemplateField = {
  key: string
  label: string
  required?: boolean
  recommended?: boolean
  attribute?: boolean
  max_length?: number
  hint?: string
  values?: string[]
  type?: string
}

const CHANNELS = [
  { id: 'shopify', icon: '🛍️', name: 'Shopify',         colour: '#96BF48' },
  { id: 'ebay',    icon: '🛒', name: 'eBay',            colour: '#E53238' },
  { id: 'google',  icon: '🔍', name: 'Google Shopping', colour: '#4285F4' },
  { id: 'amazon',  icon: '📦', name: 'Amazon',          colour: '#FF9900', stub: true },
]

const CHANNEL_ICONS: Record<string, string> = { shopify: '🛍️', amazon: '📦', ebay: '🛒', google: '🔍' }

const STATUS_COLOUR: Record<string, string> = {
  published: '#0f7b6c',
  failed:    '#c9372c',
  pending:   '#9b9b98',
}

const FIELD_META: Record<string, { label: string; type?: string }> = {
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

// ── INLINE FIELD (used on health tab) ──
function InlineField({ fieldKey, currentValue, isAttribute, listingId, onSaved }: {
  fieldKey: string; currentValue: any; isAttribute: boolean; listingId: string; onSaved: (l: Listing) => void
}) {
  const [open, setOpen]     = useState(false)
  const [value, setValue]   = useState(String(currentValue ?? ''))
  const [saving, setSaving] = useState(false)
  const meta = FIELD_META[fieldKey] || { label: fieldKey }

  async function save() {
    setSaving(true)
    try {
      const body = isAttribute
        ? { attributes: { [fieldKey]: value } }
        : { [fieldKey]: meta.type === 'number' ? parseFloat(value) || 0 : value }
      const res  = await fetch(`/api/listings/${listingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (res.ok) { onSaved(data.listing); setOpen(false) }
    } finally { setSaving(false) }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ fontSize: '12px', color: '#0f7b6c', background: '#e8f5f3', border: 'none', borderRadius: '5px', padding: '3px 9px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
      Fill in →
    </button>
  )

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginTop: '4px' }}>
      {meta.type === 'textarea' ? (
        <textarea autoFocus value={value} onChange={e => setValue(e.target.value)} rows={3}
          style={{ flex: 1, fontSize: '12px', padding: '6px 8px', border: '1px solid #191919', borderRadius: '6px', fontFamily: 'Inter, sans-serif', resize: 'vertical', outline: 'none' }} />
      ) : (
        <input autoFocus type={meta.type || 'text'} value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false) }}
          placeholder={meta.label}
          style={{ flex: 1, fontSize: '12px', padding: '6px 8px', border: '1px solid #191919', borderRadius: '6px', fontFamily: 'Inter, sans-serif', outline: 'none' }} />
      )}
      <button onClick={save} disabled={saving} style={{ fontSize: '12px', padding: '6px 10px', background: '#191919', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {saving ? '...' : 'Save'}
      </button>
      <button onClick={() => setOpen(false)} style={{ fontSize: '12px', padding: '6px 8px', background: 'none', color: '#787774', border: '1px solid #e8e8e5', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>×</button>
    </div>
  )
}

// ── EBAY CATEGORY PICKER ──
function EbayCategoryPicker({ value, onChange }: {
  value: { id: string; name: string } | null
  onChange: (v: { id: string; name: string } | null) => void
}) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<{ id: string; name: string; path: string }[]>([])
  const [open, setOpen]         = useState(false)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res  = await fetch(`/api/ebay/categories?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.categories || [])
      } finally { setSearching(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  if (value) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '11px', color: '#0f7b6c', background: '#e8f5f3', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, flex: 1 }}>{value.name}</span>
      <button onClick={() => onChange(null)} style={{ fontSize: '11px', color: '#787774', background: 'none', border: '1px solid #e8e8e5', borderRadius: '4px', padding: '3px 7px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>×</button>
    </div>
  )

  return (
    <div style={{ position: 'relative' }}>
      <input
        placeholder="Search eBay categories..."
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #e8e8e5', borderRadius: '6px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
      />
      {open && (searching || results.length > 0) && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e8e8e5', borderRadius: '6px', boxShadow: '0 4px 16px #0002', zIndex: 100, maxHeight: '200px', overflowY: 'auto', marginTop: '2px' }}>
          {searching && <div style={{ fontSize: '11px', color: '#9b9b98', padding: '8px 12px' }}>Searching...</div>}
          {results.map(r => (
            <button key={r.id} onMouseDown={() => { onChange({ id: r.id, name: r.name }); setQuery(''); setOpen(false) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', borderBottom: '1px solid #f1f1ef', background: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#191919' }}>{r.name}</div>
              <div style={{ fontSize: '10px', color: '#9b9b98', marginTop: '1px' }}>{r.path}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── EDITABLE FIELD (used on details tab) ──
function EditableField({ label, value, fieldKey, listingId, type, isAttribute, hint, onSaved }: {
  label: string; value: any; fieldKey: string; listingId: string;
  type?: string; isAttribute?: boolean; hint?: string; onSaved: (l: Listing) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(String(value ?? ''))
  const [saving, setSaving]   = useState(false)

  // Keep draft in sync when value changes externally
  useEffect(() => { if (!editing) setDraft(String(value ?? '')) }, [value, editing])

  async function save() {
    setSaving(true)
    try {
      const parsed = type === 'number' ? (parseFloat(draft) || 0) : draft
      const body   = isAttribute ? { attributes: { [fieldKey]: parsed } } : { [fieldKey]: parsed }
      const res    = await fetch(`/api/listings/${listingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data   = await res.json()
      if (res.ok) { onSaved(data.listing); setEditing(false) }
    } finally { setSaving(false) }
  }

  const display = value !== null && value !== undefined && value !== '' ? String(value) : '—'

  return (
    <div style={{ borderBottom: '1px solid #f1f1ef', padding: '10px 0' }}>
      <div style={{ fontSize: '11px', color: '#9b9b98', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
        {label}
        {hint && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: '6px', color: '#b0b0ac' }}>{hint}</span>}
      </div>
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
          <span style={{ fontSize: '13px', color: display === '—' ? '#d0d0cc' : '#191919', fontWeight: display === '—' ? 400 : 600, flex: 1, whiteSpace: 'pre-wrap' }}>{display}</span>
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
  const [applyingOpt, setApplyingOpt]     = useState<string | null>(null)
  const [appliedOpt, setAppliedOpt]       = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab]         = useState<'details' | 'health' | 'optimise'>('details')
  const [templates, setTemplates]         = useState<Record<string, TemplateField[]>>({})
  const [categorySelections, setCategorySelections] = useState<Record<string, { id: string; name: string } | null>>({})
  const [ebayAspects, setEbayAspects]               = useState<Array<{ name: string; required: boolean; usage: 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL'; mode: 'FREE_TEXT' | 'SELECTION_ONLY' | 'FREE_TEXT_AND_SELECTION'; cardinality: 'SINGLE' | 'MULTI'; values: string[]; description: string | null }>>([])
  const [aspectFreeText, setAspectFreeText]         = useState<Set<string>>(new Set())
  const [ebayAspectsLoading, setEbayAspectsLoading] = useState(false)
  const [aspectValues, setAspectValues]             = useState<Record<string, string>>({})
  const [catalogAspects, setCatalogAspects]         = useState<Record<string, string>>({})
  const [catalogLooking, setCatalogLooking]         = useState(false)
  const [catalogMsg, setCatalogMsg]                 = useState('')

  const refreshListing = useCallback(() =>
    fetch(`/api/listings/${id}`).then(r => r.json()).then(d => { if (d.listing) setListing(d.listing) }), [id])

  // Load listing and immediately score health
  useEffect(() => {
    fetch(`/api/listings/${id}`).then(r => r.json()).then(d => {
      setListing(d.listing)
      setLoading(false)
    })
  }, [id])

  // Load channel templates whenever category changes
  useEffect(() => {
    if (!listing?.category && listing !== null) return
    const category = listing?.category || 'general'
    Promise.all(
      ['ebay', 'amazon', 'shopify', 'google'].map(ch =>
        fetch(`/api/templates?channel_type=${ch}&category=${encodeURIComponent(category)}`)
          .then(r => r.json())
          .then(d => ({ ch, fields: (d.template?.fields as TemplateField[] ?? []).filter(f => f.attribute) }))
          .catch(() => ({ ch, fields: [] as TemplateField[] }))
      )
    ).then(results => {
      const t: Record<string, TemplateField[]> = {}
      results.forEach(({ ch, fields }) => { if (fields.length) t[ch] = fields })
      setTemplates(t)
    })
  }, [listing?.category])

  // Load eBay item aspects when category is selected
  const ebayCategoryId = categorySelections['ebay']?.id
  useEffect(() => {
    if (!ebayCategoryId) { setEbayAspects([]); setAspectValues({}); setAspectFreeText(new Set()); return }
    setEbayAspectsLoading(true)
    // Seed with any values already populated by the barcode lookup, then let user edits layer on top
    setAspectValues(catalogAspects)
    setAspectFreeText(new Set())
    fetch(`/api/ebay/aspects?categoryId=${ebayCategoryId}`)
      .then(r => r.json())
      .then(d => setEbayAspects(d.aspects || []))
      .catch(() => setEbayAspects([]))
      .finally(() => setEbayAspectsLoading(false))
  }, [ebayCategoryId])

  // Auto-fill listing + item specifics from barcode (eBay catalog + UPCitemdb)
  async function lookupEbayCatalog() {
    if (!listing?.barcode) return
    setCatalogLooking(true)
    setCatalogMsg('')
    try {
      const res  = await fetch(`/api/ebay/catalog?barcode=${encodeURIComponent(listing.barcode)}`)
      const data = await res.json()
      if (!data.product) { setCatalogMsg('No product found for this barcode'); return }
      const { title, description, images, category, condition, brand, aspects } = data.product

      // ── Patch core listing fields (only fill blanks) ─────────────────────
      const patch: Record<string, any> = {}
      if (title       && !listing.title)       patch.title = title
      if (description && !listing.description) patch.description = description
      if (images?.length)                      patch.images = images
      if (condition   && !listing.condition)   patch.condition = condition
      if (brand       && !listing.brand)       patch.brand = brand

      const filledFields: string[] = Object.keys(patch)

      if (Object.keys(patch).length > 0) {
        const pRes  = await fetch(`/api/listings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
        const pData = await pRes.json()
        if (pRes.ok) setListing(pData.listing)
      }

      // ── Auto-set eBay category ────────────────────────────────────────────
      if (category?.id && !categorySelections['ebay']) {
        setCategorySelections(p => ({ ...p, ebay: category }))
      }

      // ── Auto-populate item specifics (only fill empty fields) ────────────
      if (aspects && typeof aspects === 'object' && Object.keys(aspects).length > 0) {
        const incomingAspects = aspects as Record<string, string>
        // Save so they survive category changes
        setCatalogAspects(incomingAspects)
        setAspectValues(prev => {
          const next = { ...prev }
          let filled = 0
          for (const [key, val] of Object.entries(incomingAspects)) {
            if (!next[key] && val) { next[key] = val; filled++ }
          }
          if (filled > 0) filledFields.push(`${filled} item specific${filled > 1 ? 's' : ''}`)
          return next
        })
      }

      if (filledFields.length > 0) {
        setCatalogMsg(`Auto-filled: ${filledFields.join(', ')}`)
      } else {
        setCatalogMsg('Match found — all fields already filled')
      }
    } finally { setCatalogLooking(false) }
  }

  // Load health scores when switching to health tab
  async function loadHealth() {
    setHealthLoading(true)
    try {
      const res  = await fetch(`/api/listings/${id}/health`)
      const data = await res.json()
      if (res.ok) setHealth(data.health)
    } finally { setHealthLoading(false) }
  }

  useEffect(() => {
    if (activeTab === 'health' && !health) loadHealth()
  }, [activeTab])

  async function onFieldSaved(updated: Listing) {
    setListing(updated)
    if (activeTab === 'health') {
      setHealthLoading(true)
      try {
        const res  = await fetch(`/api/listings/${id}/health`)
        const data = await res.json()
        if (res.ok) setHealth(data.health)
      } finally { setHealthLoading(false) }
    }
  }

  function toggleChannel(ch: string) {
    setSelected(s => s.includes(ch) ? s.filter(c => c !== ch) : [...s, ch])
  }

  async function publish() {
    if (!selected.length) return
    setPublishing(true)
    setPublishError('')
    setPublishResult(null)
    try {
      const res  = await fetch(`/api/listings/${id}/publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: selected, categorySelections, aspectValues }),
      })
      const data = await res.json()
      if (!res.ok) { setPublishError(data.error); return }
      setPublishResult(data.results)
      refreshListing()
    } catch (err: any) {
      setPublishError(err.message)
    } finally { setPublishing(false) }
  }

  async function optimise() {
    setOptimising(true)
    setOptimised(null)
    try {
      const res  = await fetch(`/api/listings/${id}/optimize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: ['shopify', 'ebay', 'google', 'amazon'] }),
      })
      const data = await res.json()
      if (res.ok) setOptimised(data.optimised)
    } finally { setOptimising(false) }
  }

  async function applyOptimisation(channelId: string) {
    if (!optimised?.[channelId]) return
    setApplyingOpt(channelId)
    try {
      const { title, description } = optimised[channelId]
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      const data = await res.json()
      if (res.ok) {
        setListing(data.listing)
        setAppliedOpt(prev => new Set([...prev, channelId]))
      }
    } finally { setApplyingOpt(null) }
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

  // Merge template attribute fields with existing attributes
  const allTemplateFields = Object.entries(templates)
  const existingAttributeKeys = new Set(Object.keys(listing.attributes || {}))

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f8f4ec', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px', minWidth: 0 }}>
        <div style={{ maxWidth: '960px' }}>

          <button onClick={() => router.push('/listings')} style={{ background: 'none', border: 'none', color: '#787774', fontSize: '13px', cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif', marginBottom: '24px' }}>
            ← Back to listings
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#191919', margin: 0, letterSpacing: '-0.02em', flex: 1 }}>{listing.title}</h1>
            <span style={{ fontSize: '11px', background: listing.status === 'published' ? '#e8f5f3' : listing.status === 'partially_published' ? '#fff3e6' : '#f1f1ef', color: listing.status === 'published' ? '#0f7b6c' : listing.status === 'partially_published' ? '#d9730d' : '#787774', padding: '4px 10px', borderRadius: '5px', fontWeight: 600, marginLeft: '12px' }}>
              {listing.status.replace('_', ' ').toUpperCase()}
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

              {/* ── DETAILS TAB ── */}
              {activeTab === 'details' && <>

                {/* Barcode auto-fill — works for all channels */}
                {listing.barcode ? (
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae0fd', borderLeft: '3px solid #0369a1', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1' }}>Auto-fill from barcode</div>
                      <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '2px', opacity: 0.8 }}>
                        Barcode <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{listing.barcode}</span> — auto-fills title, images, description, brand and all item specifics for every channel
                      </div>
                      {catalogMsg && (
                        <div style={{ fontSize: '11px', color: catalogMsg.startsWith('No') || catalogMsg.startsWith('Error') ? '#c9372c' : '#0f7b6c', marginTop: '5px', fontWeight: 600 }}>
                          {catalogMsg.startsWith('No') || catalogMsg.startsWith('Error') ? '✕ ' : '✓ '}{catalogMsg}
                        </div>
                      )}
                    </div>
                    <button onClick={lookupEbayCatalog} disabled={catalogLooking}
                      style={{ padding: '8px 14px', background: catalogLooking ? '#e8e8e5' : '#0369a1', color: catalogLooking ? '#9b9b98' : 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: catalogLooking ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                      {catalogLooking ? 'Looking up…' : '⚡ Auto-fill all'}
                    </button>
                  </div>
                ) : (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '3px solid #d97706', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#92400e' }}>
                      <span style={{ fontWeight: 700 }}>Add a barcode (EAN/UPC)</span> to enable auto-fill — we'll look up the product and populate all fields and item specifics across every channel automatically.
                    </div>
                  </div>
                )}

                {listing.images?.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {listing.images.map((img, i) => (
                      <img key={i} src={img} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e8e8e5' }} />
                    ))}
                  </div>
                )}

                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>Product details</div>
                  <EditableField label="Title"       value={listing.title}       fieldKey="title"       listingId={id} onSaved={onFieldSaved} />
                  <EditableField label="Description" value={listing.description} fieldKey="description" listingId={id} type="textarea" onSaved={onFieldSaved} />
                  <EditableField label="Brand"       value={listing.brand}       fieldKey="brand"       listingId={id} onSaved={onFieldSaved} />
                  <EditableField label="Category"    value={listing.category}    fieldKey="category"    listingId={id} onSaved={onFieldSaved} />
                  <EditableField label="Condition"   value={listing.condition}   fieldKey="condition"   listingId={id} onSaved={onFieldSaved} />
                </div>

                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>Pricing & inventory</div>
                  <EditableField label="Price (£)"              value={listing.price}         fieldKey="price"         listingId={id} type="number" onSaved={onFieldSaved} />
                  <EditableField label="Cost price (£)"         value={listing.cost_price}    fieldKey="cost_price"    listingId={id} type="number" onSaved={onFieldSaved} />
                  <EditableField label="Compare at price (£)"   value={listing.compare_price} fieldKey="compare_price" listingId={id} type="number" onSaved={onFieldSaved} />
                  <EditableField label="Stock quantity"         value={listing.quantity}      fieldKey="quantity"      listingId={id} type="number" onSaved={onFieldSaved} />
                  <EditableField label="SKU"                    value={listing.sku}           fieldKey="sku"           listingId={id} onSaved={onFieldSaved} />
                  <EditableField label="Barcode / EAN"          value={listing.barcode}       fieldKey="barcode"       listingId={id} onSaved={onFieldSaved} />
                  <EditableField label="Weight (grams)"         value={listing.weight_grams}  fieldKey="weight_grams"  listingId={id} type="number" onSaved={onFieldSaved} />
                </div>

                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>Images</div>
                  <EditableField label="Image URLs (comma-separated)" value={Array.isArray(listing.images) ? listing.images.join(', ') : ''} fieldKey="images" listingId={id} onSaved={onFieldSaved} />
                </div>

                {/* Channel-specific attributes from templates */}
                {allTemplateFields.length > 0 && (
                  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>Channel attributes</div>
                    {allTemplateFields.map(([channelType, fields]) => (
                      <div key={channelType} style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #f1f1ef' }}>
                          <span style={{ fontSize: '14px' }}>{CHANNEL_ICONS[channelType]}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#787774' }}>
                            {channelType.charAt(0).toUpperCase() + channelType.slice(1)}
                          </span>
                        </div>
                        {fields.map(f => (
                          <EditableField
                            key={f.key}
                            label={`${f.label}${f.required ? ' *' : ''}`}
                            value={listing.attributes?.[f.key] ?? ''}
                            fieldKey={f.key}
                            listingId={id}
                            isAttribute={true}
                            hint={f.hint}
                            onSaved={onFieldSaved}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Freeform attributes that aren't in templates */}
                {Object.entries(listing.attributes || {}).filter(([k]) =>
                  !allTemplateFields.some(([, fields]) => fields.some(f => f.key === k))
                ).length > 0 && (
                  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>Other attributes</div>
                    {Object.entries(listing.attributes).filter(([k]) =>
                      !allTemplateFields.some(([, fields]) => fields.some(f => f.key === k))
                    ).map(([k, v]) => (
                      <EditableField key={k} label={k} value={v} fieldKey={k} listingId={id} isAttribute={true} onSaved={onFieldSaved} />
                    ))}
                  </div>
                )}

                {/* Channel status */}
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '16px' }}>Channel status</div>
                  {CHANNELS.map(ch => {
                    const cs = listing.listing_channels?.find(lc => lc.channel_type === ch.id)
                    return (
                      <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f1ef' }}>
                        <span style={{ fontSize: '20px' }}>{ch.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>
                            {ch.name}
                            {ch.stub && <span style={{ fontSize: '10px', color: '#9b9b98', background: '#f1f1ef', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 600 }}>SOON</span>}
                          </div>
                          {cs?.error_message && <div style={{ fontSize: '11px', color: '#c9372c', marginTop: '2px' }}>{cs.error_message}</div>}
                          {cs?.channel_url && <a href={cs.channel_url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#0f7b6c' }}>View listing →</a>}
                          {cs?.published_at && <div style={{ fontSize: '11px', color: '#9b9b98', marginTop: '2px' }}>Published {new Date(cs.published_at).toLocaleDateString('en-GB')}</div>}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: cs ? STATUS_COLOUR[cs.status] : '#9b9b98', background: (cs ? STATUS_COLOUR[cs.status] : '#9b9b98') + '18', padding: '3px 8px', borderRadius: '4px' }}>
                          {cs ? cs.status.replace('_', ' ').toUpperCase() : 'NOT PUBLISHED'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>}

              {/* ── HEALTH TAB ── */}
              {activeTab === 'health' && (
                <div>
                  {healthLoading ? (
                    <div style={{ color: '#9b9b98', fontSize: '13px', padding: '24px 0' }}>Scoring listing...</div>
                  ) : health ? (
                    <>
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

                            {allClear && <div style={{ fontSize: '13px', color: '#0f7b6c' }}>✓ All fields complete — ready to publish</div>}

                            {h.missing_required.length > 0 && (
                              <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#c9372c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Required — listing will fail without these</div>
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
                                      <InlineField fieldKey={key} currentValue={current} isAttribute={isAttr} listingId={id} onSaved={onFieldSaved} />
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
                                      <InlineField fieldKey={key} currentValue={current} isAttribute={isAttr} listingId={id} onSaved={onFieldSaved} />
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {h.warnings.length > 0 && (
                              <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#787774', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Warnings</div>
                                {h.warnings.map((w, i) => <div key={i} style={{ fontSize: '12px', color: '#787774', padding: '3px 0' }}>· {w}</div>)}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      <button onClick={loadHealth} style={{ fontSize: '12px', color: '#787774', background: 'none', border: '1px solid #e8e8e5', borderRadius: '7px', padding: '8px 14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        ↻ Refresh scores
                      </button>
                    </>
                  ) : (
                    <button onClick={loadHealth} style={{ padding: '12px 20px', background: '#191919', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      Score this listing
                    </button>
                  )}
                </div>
              )}

              {/* ── OPTIMISE TAB ── */}
              {activeTab === 'optimise' && (
                <div>
                  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '4px' }}>AI-optimised titles & descriptions</div>
                    <p style={{ fontSize: '12px', color: '#787774', margin: '0 0 16px', lineHeight: 1.6 }}>
                      Claude rewrites your listing per channel — keyword-rich for eBay Cassini, benefit-led for Amazon A9, brand-forward for Shopify. Apply to save directly to this listing.
                    </p>
                    <button onClick={optimise} disabled={optimising}
                      style={{ padding: '10px 18px', background: optimising ? '#e8e8e5' : '#191919', color: optimising ? '#9b9b98' : 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: optimising ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      {optimising ? 'Optimising with Claude...' : 'Optimise for all channels →'}
                    </button>
                  </div>

                  {optimised && CHANNELS.map(ch => {
                    const o = optimised[ch.id]
                    if (!o) return null
                    const applied = appliedOpt.has(ch.id)
                    return (
                      <div key={ch.id} style={{ background: 'white', borderRadius: '12px', border: `1px solid ${applied ? '#b7e4d8' : '#e8e8e5'}`, padding: '24px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                          <span style={{ fontSize: '18px' }}>{ch.icon}</span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#191919', flex: 1 }}>{ch.name}</span>
                          {applied ? (
                            <span style={{ fontSize: '12px', color: '#0f7b6c', fontWeight: 600 }}>✓ Applied</span>
                          ) : (
                            <button
                              onClick={() => applyOptimisation(ch.id)}
                              disabled={applyingOpt === ch.id}
                              style={{ fontSize: '12px', padding: '6px 14px', background: '#191919', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                              {applyingOpt === ch.id ? 'Applying...' : 'Apply to listing'}
                            </button>
                          )}
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Title</div>
                          <div style={{ fontSize: '13px', color: '#191919', fontWeight: 600, lineHeight: 1.5 }}>{o.title}</div>
                          <div style={{ fontSize: '11px', color: o.title.length > 80 && ch.id === 'ebay' ? '#c9372c' : '#9b9b98', marginTop: '2px' }}>
                            {o.title.length} chars
                            {o.title.length > 80 && ch.id === 'ebay' && ' — over eBay 80 char limit'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Description</div>
                          <div style={{ fontSize: '12px', color: '#3d3d3a', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{o.description}</div>
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
                <div style={{ background: '#f8f4ec', border: '1px solid #e8e8e5', borderRadius: '7px', padding: '12px', marginBottom: '12px' }}>
                  {Object.entries(publishResult).map(([ch, r]: any) => (
                    <div key={ch} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: r.status === 'published' ? '#0f7b6c' : '#c9372c' }}>
                        <span>{CHANNEL_ICONS[ch]}</span>
                        <span>{ch}</span>
                        <span style={{ fontWeight: 400 }}>— {r.status}</span>
                      </div>
                      {r.validation_errors?.length > 0 && (
                        <ul style={{ margin: '4px 0 0 20px', padding: 0, listStyle: 'disc' }}>
                          {r.validation_errors.map((e: string, i: number) => (
                            <li key={i} style={{ fontSize: '11px', color: '#c9372c', marginBottom: '2px' }}>{e}</li>
                          ))}
                        </ul>
                      )}
                      {r.error && !r.validation_errors?.length && (
                        <div style={{ fontSize: '11px', color: '#c9372c', marginTop: '2px', marginLeft: '20px' }}>{r.error}</div>
                      )}
                      {r.url && <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#0f7b6c', marginLeft: '20px' }}>View listing →</a>}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {CHANNELS.map(ch => {
                  const cs        = listing.listing_channels?.find(lc => lc.channel_type === ch.id)
                  const isPublished = cs?.status === 'published'
                  const isChecked   = selected.includes(ch.id)
                  return (
                    <label key={ch.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${isChecked ? '#191919' : '#e8e8e5'}`, cursor: ch.stub ? 'default' : 'pointer', opacity: ch.stub ? 0.5 : 1 }}>
                      <input type="checkbox" checked={isChecked} disabled={!!ch.stub} onChange={() => !ch.stub && toggleChannel(ch.id)} style={{ accentColor: '#191919' }} />
                      <span style={{ fontSize: '16px' }}>{ch.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#191919', flex: 1 }}>{ch.name}</span>
                      {isPublished && <span style={{ fontSize: '10px', color: '#0f7b6c', fontWeight: 700 }}>✓ LIVE</span>}
                      {ch.stub && <span style={{ fontSize: '10px', color: '#9b9b98', fontWeight: 600 }}>SOON</span>}
                    </label>
                  )
                })}
              </div>

              {/* Per-channel category pickers */}
              {selected.length > 0 && (
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selected.includes('ebay') && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>🛒 eBay category</div>
                      <EbayCategoryPicker
                        value={categorySelections['ebay'] || null}
                        onChange={v => setCategorySelections(p => ({ ...p, ebay: v }))}
                      />

                      {/* Dynamic item specifics for selected category */}
                      {categorySelections['ebay'] && (
                        <div style={{ marginTop: '10px' }}>
                          {ebayAspectsLoading ? (
                            <div style={{ fontSize: '11px', color: '#9b9b98', padding: '4px 0' }}>Loading category fields...</div>
                          ) : ebayAspects.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#787774', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Item specifics</div>
                                {Object.keys(catalogAspects).length > 0 && (
                                  <div style={{ fontSize: '10px', color: '#0369a1', fontWeight: 600 }}>
                                    ⚡ {Object.keys(catalogAspects).length} auto-filled from barcode
                                  </div>
                                )}
                              </div>
                              {ebayAspects.map(a => {
                                const isFreeTextMode  = aspectFreeText.has(a.name)
                                const showDropdown    = a.values.length > 0 && (a.mode === 'SELECTION_ONLY' || (a.mode === 'FREE_TEXT_AND_SELECTION' && !isFreeTextMode))
                                const showInput       = a.mode === 'FREE_TEXT' || (a.mode === 'FREE_TEXT_AND_SELECTION' && isFreeTextMode) || a.values.length === 0
                                const isAutoFilled    = !!catalogAspects[a.name] && aspectValues[a.name] === catalogAspects[a.name]
                                return (
                                  <div key={a.name} style={{ background: isAutoFilled ? '#f0f9ff' : undefined, borderRadius: isAutoFilled ? '6px' : undefined, padding: isAutoFilled ? '6px 8px' : undefined, border: isAutoFilled ? '1px solid #bae0fd' : undefined }}>
                                    {/* Label row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#191919' }}>{a.name}</span>
                                      {a.usage === 'REQUIRED' && (
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#c9372c', background: '#fce8e6', padding: '1px 5px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Required</span>
                                      )}
                                      {a.usage === 'RECOMMENDED' && (
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#6e4f1c', background: '#fff3cd', padding: '1px 5px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recommended</span>
                                      )}
                                      {a.cardinality === 'MULTI' && (
                                        <span style={{ fontSize: '9px', color: '#787774', background: '#f1f1ef', padding: '1px 5px', borderRadius: '3px' }}>Multi-value</span>
                                      )}
                                      {isAutoFilled && (
                                        <span style={{ fontSize: '9px', color: '#0369a1', background: '#e0f2fe', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>⚡ Auto</span>
                                      )}
                                    </div>

                                    {/* Description */}
                                    {a.description && (
                                      <div style={{ fontSize: '11px', color: '#787774', marginBottom: '4px', lineHeight: 1.4 }}>{a.description}</div>
                                    )}

                                    {/* Input */}
                                    {showDropdown ? (
                                      <div>
                                        <select
                                          value={aspectValues[a.name] || ''}
                                          onChange={e => setAspectValues(p => ({ ...p, [a.name]: e.target.value }))}
                                          style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: `1px solid ${isAutoFilled ? '#bae0fd' : '#e8e8e5'}`, borderRadius: '5px', fontFamily: 'Inter, sans-serif', background: isAutoFilled ? '#f0f9ff' : 'white', color: aspectValues[a.name] ? '#191919' : '#9b9b98' }}>
                                          <option value="">Select {a.name}...</option>
                                          {a.values.map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                        {a.mode === 'FREE_TEXT_AND_SELECTION' && (
                                          <button
                                            onClick={() => setAspectFreeText(p => { const n = new Set(p); n.add(a.name); return n })}
                                            style={{ background: 'none', border: 'none', fontSize: '11px', color: '#787774', cursor: 'pointer', padding: '2px 0', fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}>
                                            Not listed? Type your own
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <div>
                                        <input
                                          value={aspectValues[a.name] || ''}
                                          onChange={e => setAspectValues(p => ({ ...p, [a.name]: e.target.value }))}
                                          placeholder={a.cardinality === 'MULTI' ? `Enter values, comma-separated...` : `Enter ${a.name}...`}
                                          style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: `1px solid ${isAutoFilled ? '#bae0fd' : '#e8e8e5'}`, borderRadius: '5px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#191919', background: isAutoFilled ? '#f0f9ff' : 'white' }}
                                        />
                                        {a.mode === 'FREE_TEXT_AND_SELECTION' && a.values.length > 0 && (
                                          <button
                                            onClick={() => setAspectFreeText(p => { const n = new Set(p); n.delete(a.name); return n })}
                                            style={{ background: 'none', border: 'none', fontSize: '11px', color: '#787774', cursor: 'pointer', padding: '2px 0', fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}>
                                            Pick from list instead
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                  {selected.includes('shopify') && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>🛍️ Shopify product type</div>
                      <input
                        placeholder="e.g. Electronics, Clothing..."
                        value={categorySelections['shopify']?.name || ''}
                        onChange={e => setCategorySelections(p => ({ ...p, shopify: e.target.value ? { id: e.target.value, name: e.target.value } : null }))}
                        style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #e8e8e5', borderRadius: '6px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}
                </div>
              )}

              <button onClick={publish} disabled={publishing || selected.length === 0}
                style={{ width: '100%', padding: '12px', background: selected.length && !publishing ? '#191919' : '#e8e8e5', color: selected.length && !publishing ? 'white' : '#9b9b98', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: selected.length && !publishing ? 'pointer' : 'default', fontFamily: 'Inter, sans-serif' }}>
                {publishing ? 'Publishing...' : `Publish to ${selected.length || 0} channel${selected.length !== 1 ? 's' : ''}`}
              </button>

              {/* Health summary */}
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
