/**
 * /catalog — master SKU view (Phase 2).
 *
 * Products are the master-SKU layer. Each product can be linked to N channel
 * listings (same SKU published to shopify + ebay + amazon → one product).
 * On-hand comes from inventory_movements summed by inventory_state view.
 */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { P, MONO } from '@/app/lib/design'

type Product = {
  id: string
  master_sku: string
  title: string
  brand: string | null
  category: string | null
  cost_price: number | null
  on_hand: number
  channel_listing_count: number
  updated_at: string
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load(q = '') {
    setLoading(true)
    setError(null)
    try {
      const url = q ? `/api/products?q=${encodeURIComponent(q)}` : '/api/products'
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load catalog')
      setProducts(json.products ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    load(search)
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: P.ink, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Catalog
          </h1>
          <div style={{ ...MONO, fontSize: 11, color: P.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Master SKUs · {products.length} product{products.length === 1 ? '' : 's'}
          </div>
        </div>
        <form onSubmit={onSearchSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            type="search"
            placeholder="Search SKU or title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${P.rule}`,
              background: '#fff',
              fontSize: 13,
              width: 260,
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              border: 'none',
              background: P.ink,
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      </div>

      {loading && <div style={{ color: P.muted, fontSize: 13 }}>Loading…</div>}
      {error && <div style={{ color: P.oxblood, fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {!loading && products.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', background: P.bg, border: `1px solid ${P.rule}`, color: P.muted, fontSize: 13 }}>
          No products. Catalog builds automatically from your listings via SKU rollup.
        </div>
      )}

      {!loading && products.length > 0 && (
        <div style={{ border: `1px solid ${P.rule}`, background: '#fff' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr 120px 100px 120px 120px',
            padding: '10px 16px',
            borderBottom: `1px solid ${P.rule}`,
            ...MONO,
            fontSize: 10,
            color: P.muted,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            <div>SKU</div>
            <div>Title</div>
            <div>Brand</div>
            <div style={{ textAlign: 'right' }}>On hand</div>
            <div style={{ textAlign: 'right' }}>Channels</div>
            <div style={{ textAlign: 'right' }}>Cost</div>
          </div>

          {products.map((p) => (
            <Link
              key={p.id}
              href={`/listings?product_id=${p.id}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr 120px 100px 120px 120px',
                padding: '12px 16px',
                borderBottom: `1px solid ${P.rule}`,
                textDecoration: 'none',
                color: P.ink,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = P.bg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ ...MONO, fontSize: 12, color: P.inkSoft }}>{p.master_sku}</div>
              <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
              <div style={{ fontSize: 13, color: P.muted }}>{p.brand ?? '—'}</div>
              <div style={{ fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {p.on_hand.toLocaleString()}
              </div>
              <div style={{ fontSize: 13, textAlign: 'right', color: p.channel_listing_count > 1 ? P.ink : P.muted }}>
                {p.channel_listing_count}
              </div>
              <div style={{ fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: P.muted }}>
                {p.cost_price != null ? `£${Number(p.cost_price).toFixed(2)}` : '—'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
