'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type ChannelStatus = {
  channel_type: string
  status: string
  channel_url?: string
  error_message?: string
  published_at?: string
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
  status: string
  listing_channels: ChannelStatus[]
}

const CHANNELS = [
  { id: 'shopify', icon: '🛍️', name: 'Shopify',       colour: '#96BF48' },
  { id: 'ebay',   icon: '🛒', name: 'eBay',           colour: '#E53238' },
  { id: 'amazon', icon: '📦', name: 'Amazon',         colour: '#FF9900', stub: true },
]

const STATUS_COLOUR: Record<string, string> = {
  published: '#0f7b6c',
  failed:    '#c9372c',
  pending:   '#9b9b98',
}

export default function ListingDetailPage() {
  const router   = useRouter()
  const { id }   = useParams<{ id: string }>()
  const [listing, setListing]         = useState<Listing | null>(null)
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<string[]>([])
  const [publishing, setPublishing]   = useState(false)
  const [publishResult, setPublishResult] = useState<Record<string, any> | null>(null)
  const [error, setError]             = useState('')

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(r => r.json())
      .then(d => { setListing(d.listing); setLoading(false) })
  }, [id])

  function toggleChannel(ch: string) {
    setSelected(s => s.includes(ch) ? s.filter(c => c !== ch) : [...s, ch])
  }

  async function publish() {
    if (!selected.length) return
    setPublishing(true)
    setError('')
    setPublishResult(null)
    try {
      const res = await fetch(`/api/listings/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: selected }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setPublishResult(data.results)
      // Refresh listing
      const updated = await fetch(`/api/listings/${id}`).then(r => r.json())
      setListing(updated.listing)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  if (loading) return (
    <div style={{ fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#9b9b98' }}>Loading...</div>
  )
  if (!listing) return (
    <div style={{ fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#c9372c' }}>Listing not found</div>
  )

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', minHeight: '100vh', background: '#f7f7f5', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

        <button onClick={() => router.push('/listings')} style={{ background: 'none', border: 'none', color: '#787774', fontSize: '13px', cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif', marginBottom: '24px' }}>
          ← Back to listings
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

          {/* Left — listing details */}
          <div>
            {/* Images */}
            {listing.images?.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {listing.images.map((img, i) => (
                  <img key={i} src={img} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e8e8e5' }} />
                ))}
              </div>
            )}

            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#191919', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{listing.title}</h1>
              <div style={{ fontSize: '13px', color: '#787774', marginBottom: '16px' }}>
                {listing.brand && <span>{listing.brand} · </span>}
                {listing.category && <span>{listing.category} · </span>}
                <span>{listing.condition}</span>
              </div>

              {listing.description && (
                <p style={{ fontSize: '13px', color: '#3d3d3a', lineHeight: 1.6, margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>{listing.description}</p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  ['Price', `£${Number(listing.price).toFixed(2)}`],
                  ['Stock', `${listing.quantity} units`],
                  ['SKU', listing.sku || '—'],
                  ['Barcode', listing.barcode || '—'],
                  ['Weight', listing.weight_grams ? `${listing.weight_grams}g` : '—'],
                  ['Compare at', listing.compare_price ? `£${Number(listing.compare_price).toFixed(2)}` : '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: '11px', color: '#9b9b98', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{k}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel status */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '16px' }}>Channel status</div>
              {CHANNELS.map(ch => {
                const cs = listing.listing_channels?.find(lc => lc.channel_type === ch.id)
                return (
                  <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f1ef' }}>
                    <span style={{ fontSize: '20px' }}>{ch.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>{ch.name}{ch.stub && <span style={{ fontSize: '10px', color: '#9b9b98', background: '#f1f1ef', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 600 }}>COMING SOON</span>}</div>
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
          </div>

          {/* Right — publish panel */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', position: 'sticky', top: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '4px' }}>Publish to channels</div>
            <p style={{ fontSize: '12px', color: '#787774', margin: '0 0 16px' }}>Select where to publish this listing</p>

            {error && (
              <div style={{ background: '#fce8e6', color: '#c9372c', padding: '10px 12px', borderRadius: '7px', fontSize: '12px', marginBottom: '12px' }}>{error}</div>
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
                  <label
                    key={ch.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${isChecked ? '#191919' : '#e8e8e5'}`, cursor: ch.stub ? 'default' : 'pointer', opacity: ch.stub ? 0.5 : 1 }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!!ch.stub}
                      onChange={() => !ch.stub && toggleChannel(ch.id)}
                      style={{ accentColor: '#191919' }}
                    />
                    <span style={{ fontSize: '16px' }}>{ch.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#191919', flex: 1 }}>{ch.name}</span>
                    {isPublished && <span style={{ fontSize: '10px', color: '#0f7b6c', fontWeight: 700 }}>✓ LIVE</span>}
                    {ch.stub && <span style={{ fontSize: '10px', color: '#9b9b98', fontWeight: 600 }}>SOON</span>}
                  </label>
                )
              })}
            </div>

            <button
              onClick={publish}
              disabled={publishing || selected.length === 0}
              style={{ width: '100%', padding: '12px', background: selected.length && !publishing ? '#191919' : '#e8e8e5', color: selected.length && !publishing ? 'white' : '#9b9b98', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: selected.length && !publishing ? 'pointer' : 'default', fontFamily: 'Inter, sans-serif' }}
            >
              {publishing ? 'Publishing...' : `Publish to ${selected.length || 0} channel${selected.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CHANNEL_ICONS: Record<string, string> = { shopify: '🛍️', amazon: '📦', ebay: '🛒' }
