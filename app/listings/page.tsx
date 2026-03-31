'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  created_at: string
  listing_channels: ChannelStatus[]
}

const CHANNEL_ICONS: Record<string, string> = { shopify: '🛍️', amazon: '📦', ebay: '🛒' }
const STATUS_COLOUR: Record<string, string> = {
  published:  '#0f7b6c',
  failed:     '#c9372c',
  pending:    '#9b9b98',
  draft:      '#9b9b98',
}

export default function ListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(d => setListings(d.listings || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', minHeight: '100vh', background: '#f7f7f5', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#191919', margin: 0, letterSpacing: '-0.02em' }}>Listings</h1>
            <p style={{ fontSize: '13px', color: '#787774', margin: '4px 0 0' }}>Create once, publish everywhere</p>
          </div>
          <button
            onClick={() => router.push('/listings/new')}
            style={{ padding: '10px 18px', background: '#191919', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            + New listing
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9b9b98', fontSize: '14px' }}>Loading...</div>
        ) : listings.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e8e5', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📋</div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#191919', margin: '0 0 8px' }}>No listings yet</h2>
            <p style={{ fontSize: '13px', color: '#787774', margin: '0 0 24px' }}>Create your first listing and publish it to Shopify, eBay, and Amazon in one go.</p>
            <button
              onClick={() => router.push('/listings/new')}
              style={{ padding: '10px 20px', background: '#191919', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              Create listing
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {listings.map(listing => (
              <div
                key={listing.id}
                onClick={() => router.push(`/listings/${listing.id}`)}
                style={{ background: 'white', borderRadius: '10px', border: '1px solid #e8e8e5', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
              >
                {/* Thumbnail */}
                <div style={{ width: '48px', height: '48px', borderRadius: '7px', background: '#f1f1ef', flexShrink: 0, overflow: 'hidden' }}>
                  {listing.images?.[0] && <img src={listing.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#191919', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.title}</div>
                  <div style={{ fontSize: '12px', color: '#787774' }}>
                    £{Number(listing.price).toFixed(2)} · {listing.condition} · {listing.quantity} in stock
                    {listing.sku && ` · SKU: ${listing.sku}`}
                  </div>
                </div>

                {/* Channel status badges */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {['shopify', 'amazon', 'ebay'].map(ch => {
                    const chStatus = listing.listing_channels?.find(lc => lc.channel_type === ch)
                    const colour = chStatus ? STATUS_COLOUR[chStatus.status] : '#e8e8e5'
                    return (
                      <div
                        key={ch}
                        title={chStatus ? `${ch}: ${chStatus.status}${chStatus.error_message ? ` — ${chStatus.error_message}` : ''}` : `${ch}: not published`}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', background: colour + '20', border: `1px solid ${colour}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
                      >
                        {CHANNEL_ICONS[ch]}
                      </div>
                    )
                  })}
                </div>

                {/* Overall status */}
                <div style={{ fontSize: '11px', fontWeight: 600, color: STATUS_COLOUR[listing.status] || '#9b9b98', background: (STATUS_COLOUR[listing.status] || '#9b9b98') + '15', padding: '3px 8px', borderRadius: '4px', flexShrink: 0 }}>
                  {listing.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
