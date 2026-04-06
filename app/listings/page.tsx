'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'

type ChannelStatus = { channel_type: string; status: string; channel_url?: string; error_message?: string }
type Listing = {
  id: string
  title: string
  price: number
  condition: string
  quantity: number
  status: string
  images: string[]
  sku?: string
  category?: string
  brand?: string
  created_at: string
  listing_channels: ChannelStatus[]
}

const CHANNEL_ICONS: Record<string, string> = { shopify: '🛍️', amazon: '📦', ebay: '🛒' }
const STATUS_COLOUR: Record<string, string> = {
  published: '#0f7b6c',
  failed:    '#c9372c',
  pending:   '#9b9b98',
  draft:     '#9b9b98',
}

type StatusFilter = 'all' | 'draft' | 'published' | 'failed'
type HealthFilter = 'all' | 'incomplete'  // incomplete = has any channel with no listing_channels record

export default function ListingsPage() {
  const router = useRouter()
  const [listings, setListings]         = useState<Listing[]>([])
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all')
  const [search, setSearch]             = useState('')
  const [bulkPublishing, setBulkPublishing]         = useState(false)
  const [bulkDeleting, setBulkDeleting]             = useState(false)
  const [toast, setToast]                           = useState('')
  const [connectedChannels, setConnectedChannels]   = useState<string[]>([])
  const [bulkChannels, setBulkChannels]             = useState<Set<string>>(new Set(['shopify', 'ebay']))

  useEffect(() => {
    fetch('/api/channels/health')
      .then(r => r.json())
      .then(d => {
        const valid = Object.entries(d.health || {})
          .filter(([, v]: any) => v.valid)
          .map(([k]) => k)
        setConnectedChannels(valid)
        setBulkChannels(new Set(valid))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(d => setListings(d.listings || []))
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // Derived filtered list
  const filtered = useMemo(() => {
    let out = listings

    if (statusFilter !== 'all') {
      out = out.filter(l => l.status === statusFilter)
    }
    if (healthFilter === 'incomplete') {
      // "incomplete" = not published on any channel yet
      out = out.filter(l => !l.listing_channels?.some(lc => lc.status === 'published'))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      out = out.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.sku?.toLowerCase().includes(q) ||
        l.brand?.toLowerCase().includes(q) ||
        l.category?.toLowerCase().includes(q)
      )
    }
    return out
  }, [listings, statusFilter, healthFilter, search])

  const allSelected   = filtered.length > 0 && filtered.every(l => selected.has(l.id))
  const someSelected  = selected.size > 0

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(l => l.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function bulkPublish() {
    if (!selected.size || !bulkChannels.size) return
    setBulkPublishing(true)
    let succeeded = 0
    for (const id of selected) {
      try {
        await fetch(`/api/listings/${id}/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channels: Array.from(bulkChannels) }),
        })
        succeeded++
      } catch {}
    }
    // Refresh
    const data = await fetch('/api/listings').then(r => r.json())
    setListings(data.listings || [])
    setSelected(new Set())
    setBulkPublishing(false)
    showToast(`Published ${succeeded} listing${succeeded !== 1 ? 's' : ''}`)
  }

  async function bulkDelete() {
    if (!selected.size) return
    if (!confirm(`Delete ${selected.size} listing${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setBulkDeleting(true)
    for (const id of selected) {
      await fetch(`/api/listings/${id}`, { method: 'DELETE' })
    }
    setListings(prev => prev.filter(l => !selected.has(l.id)))
    setSelected(new Set())
    setBulkDeleting(false)
    showToast(`Deleted ${selected.size} listing${selected.size !== 1 ? 's' : ''}`)
  }

  const counts = useMemo(() => ({
    all:       listings.length,
    draft:     listings.filter(l => l.status === 'draft').length,
    published: listings.filter(l => l.status === 'published').length,
    failed:    listings.filter(l => l.status === 'failed').length,
  }), [listings])

  const filterBtnStyle = (active: boolean) => ({
    padding: '6px 14px',
    border: `1px solid ${active ? '#191919' : '#e8e8e5'}`,
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: active ? '#191919' : '#787774',
    background: active ? '#f7f7f5' : 'white',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  })

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f7f7f5', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#191919', color: 'white', padding: '12px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, zIndex: 200 }}>
          {toast}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px', minWidth: 0 }}>
      <div style={{ maxWidth: '1100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#191919', margin: 0, letterSpacing: '-0.02em' }}>Listings</h1>
            <p style={{ fontSize: '13px', color: '#787774', margin: '4px 0 0' }}>
              {listings.length} listing{listings.length !== 1 ? 's' : ''} · create once, publish everywhere
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => router.push('/listings/import')}
              style={{ padding: '10px 16px', background: 'white', color: '#191919', border: '1px solid #e8e8e5', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Import CSV
            </button>
            <button onClick={() => router.push('/listings/new')}
              style={{ padding: '10px 18px', background: '#191919', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              + New listing
            </button>
          </div>
        </div>

        {/* Filters + search */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          {/* Status filters */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'draft', 'published', 'failed'] as StatusFilter[]).map(s => (
              <button key={s} style={filterBtnStyle(statusFilter === s)} onClick={() => setStatusFilter(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <span style={{ marginLeft: '5px', fontSize: '11px', color: '#9b9b98', fontWeight: 400 }}>
                  {counts[s]}
                </span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '22px', background: '#e8e8e5' }} />

          {/* Health filter */}
          <button
            style={filterBtnStyle(healthFilter === 'incomplete')}
            onClick={() => setHealthFilter(healthFilter === 'incomplete' ? 'all' : 'incomplete')}
          >
            Not published
          </button>

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title, SKU, brand..."
            style={{ marginLeft: 'auto', padding: '7px 12px', border: '1px solid #e8e8e5', borderRadius: '7px', fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#191919', outline: 'none', width: '220px', background: 'white' }}
          />
        </div>

        {/* Bulk action bar */}
        {someSelected && (
          <div style={{ background: '#191919', color: 'white', borderRadius: '9px', padding: '12px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{selected.size} selected</span>
            {/* Channel toggles */}
            {connectedChannels.length > 0 && (
              <div style={{ display: 'flex', gap: '6px' }}>
                {connectedChannels.map(ch => {
                  const icons: Record<string, string> = { shopify: '🛍️', ebay: '🛒', amazon: '📦' }
                  const on = bulkChannels.has(ch)
                  return (
                    <button key={ch} onClick={() => setBulkChannels(prev => { const n = new Set(prev); on ? n.delete(ch) : n.add(ch); return n })}
                      style={{ padding: '4px 10px', background: on ? 'rgba(255,255,255,0.15)' : 'transparent', color: on ? 'white' : '#888', border: `1px solid ${on ? 'rgba(255,255,255,0.3)' : '#444'}`, borderRadius: '5px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                      {icons[ch] || ch} {ch}
                    </button>
                  )
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <button
                onClick={bulkPublish}
                disabled={bulkPublishing || bulkChannels.size === 0}
                style={{ padding: '7px 14px', background: '#0f7b6c', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: (bulkPublishing || bulkChannels.size === 0) ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: bulkChannels.size === 0 ? 0.5 : 1 }}
              >
                {bulkPublishing ? 'Publishing...' : `Publish to ${bulkChannels.size ? Array.from(bulkChannels).join(' + ') : '…'}`}
              </button>
              <button
                onClick={bulkDelete}
                disabled={bulkDeleting}
                style={{ padding: '7px 14px', background: '#c9372c', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: bulkDeleting ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                {bulkDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                style={{ padding: '7px 12px', background: 'none', color: '#9b9b98', border: '1px solid #444', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9b9b98', fontSize: '14px' }}>Loading...</div>
        ) : filtered.length === 0 && listings.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e8e5', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📋</div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#191919', margin: '0 0 8px' }}>No listings yet</h2>
            <p style={{ fontSize: '13px', color: '#787774', margin: '0 0 24px' }}>Create your first listing and publish it to Shopify, eBay, and Amazon in one go.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => router.push('/listings/import')}
                style={{ padding: '10px 18px', background: 'white', color: '#191919', border: '1px solid #e8e8e5', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Import CSV
              </button>
              <button onClick={() => router.push('/listings/new')}
                style={{ padding: '10px 20px', background: '#191919', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Create listing
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e8e8e5', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#9b9b98' }}>No listings match this filter</div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e8e8e5', overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '36px 48px 1fr 80px 80px 120px 110px', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid #f1f1ef', background: '#fafafa' }}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ accentColor: '#191919', cursor: 'pointer' }} />
              <div />
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Product</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Price</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stock</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Channels</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</div>
            </div>

            {/* Rows */}
            {filtered.map((listing, i) => {
              const isSelected = selected.has(listing.id)
              return (
                <div
                  key={listing.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 48px 1fr 80px 80px 120px 110px',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: i < filtered.length - 1 ? '1px solid #f7f7f5' : 'none',
                    background: isSelected ? '#f7f9ff' : 'white',
                    transition: 'background 0.1s',
                  }}
                >
                  {/* Checkbox — stop propagation so clicking it doesn't navigate */}
                  <div onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleOne(listing.id)} style={{ accentColor: '#191919', cursor: 'pointer' }} />
                  </div>

                  {/* Thumbnail */}
                  <div
                    onClick={() => router.push(`/listings/${listing.id}`)}
                    style={{ width: '44px', height: '44px', borderRadius: '7px', background: '#f1f1ef', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}
                  >
                    {listing.images?.[0] && <img src={listing.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>

                  {/* Title + meta */}
                  <div onClick={() => router.push(`/listings/${listing.id}`)} style={{ cursor: 'pointer', minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.title}</div>
                    <div style={{ fontSize: '11px', color: '#9b9b98', marginTop: '1px' }}>
                      {listing.condition}{listing.sku ? ` · ${listing.sku}` : ''}{listing.brand ? ` · ${listing.brand}` : ''}
                    </div>
                  </div>

                  {/* Price */}
                  <div onClick={() => router.push(`/listings/${listing.id}`)} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>£{Number(listing.price).toFixed(2)}</div>
                  </div>

                  {/* Stock */}
                  <div onClick={() => router.push(`/listings/${listing.id}`)} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '13px', color: listing.quantity === 0 ? '#c9372c' : '#191919', fontWeight: listing.quantity === 0 ? 700 : 400 }}>
                      {listing.quantity === 0 ? 'Out' : listing.quantity}
                    </div>
                  </div>

                  {/* Channel status dots */}
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {['shopify', 'amazon', 'ebay'].map(ch => {
                      const cs = listing.listing_channels?.find(lc => lc.channel_type === ch)
                      const colour = cs ? (STATUS_COLOUR[cs.status] || '#9b9b98') : '#e0e0dc'
                      return (
                        <div key={ch} title={cs ? `${ch}: ${cs.status}` : `${ch}: not published`}
                          style={{ width: '26px', height: '26px', borderRadius: '6px', background: colour + '18', border: `1px solid ${colour}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                          {CHANNEL_ICONS[ch]}
                        </div>
                      )
                    })}
                  </div>

                  {/* Status badge */}
                  <div style={{ fontSize: '11px', fontWeight: 600, color: STATUS_COLOUR[listing.status] || '#9b9b98', background: (STATUS_COLOUR[listing.status] || '#9b9b98') + '15', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap', display: 'inline-block' }}>
                    {listing.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      </main>
    </div>
  )
}
