'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase-client'
import AppSidebar from '../components/AppSidebar'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Variant {
  id: string
  sku: string
  title: string
  price: number
  quantity: number
  condition: string
  images: string[]
  attributes: Record<string, string>   // e.g. { Size: 'M', Colour: 'Black' }
  status: string
  barcode?: string
}

interface ProductGroup {
  id: string
  title: string
  brand?: string
  category?: string
  description?: string
  images: string[]
  variant_attributes: string[]          // e.g. ['Size', 'Colour']
  variants: Variant[]
  created_at: string
}

// ── Mock data (realistic) ─────────────────────────────────────────────────────

const MOCK_GROUPS: ProductGroup[] = [
  {
    id: 'pg1',
    title: 'Premium Cotton Crew-Neck T-Shirt',
    brand: 'Unbranded',
    category: 'Clothing',
    description: 'Heavyweight 220gsm 100% cotton crew-neck tee, pre-shrunk, available in 4 sizes and 3 colours.',
    images: [],
    variant_attributes: ['Size', 'Colour'],
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    variants: [
      { id: 'v1', sku: 'TEE-BLK-S',  title: 'Black / S',  price: 14.99, quantity: 24, condition: 'new', images: [], attributes: { Size: 'S',  Colour: 'Black' }, status: 'published' },
      { id: 'v2', sku: 'TEE-BLK-M',  title: 'Black / M',  price: 14.99, quantity: 18, condition: 'new', images: [], attributes: { Size: 'M',  Colour: 'Black' }, status: 'published' },
      { id: 'v3', sku: 'TEE-BLK-L',  title: 'Black / L',  price: 14.99, quantity: 31, condition: 'new', images: [], attributes: { Size: 'L',  Colour: 'Black' }, status: 'published' },
      { id: 'v4', sku: 'TEE-BLK-XL', title: 'Black / XL', price: 14.99, quantity: 9,  condition: 'new', images: [], attributes: { Size: 'XL', Colour: 'Black' }, status: 'draft' },
      { id: 'v5', sku: 'TEE-WHT-S',  title: 'White / S',  price: 14.99, quantity: 15, condition: 'new', images: [], attributes: { Size: 'S',  Colour: 'White' }, status: 'published' },
      { id: 'v6', sku: 'TEE-WHT-M',  title: 'White / M',  price: 14.99, quantity: 22, condition: 'new', images: [], attributes: { Size: 'M',  Colour: 'White' }, status: 'published' },
      { id: 'v7', sku: 'TEE-NVY-M',  title: 'Navy / M',   price: 14.99, quantity: 11, condition: 'new', images: [], attributes: { Size: 'M',  Colour: 'Navy'  }, status: 'published' },
      { id: 'v8', sku: 'TEE-NVY-L',  title: 'Navy / L',   price: 14.99, quantity: 0,  condition: 'new', images: [], attributes: { Size: 'L',  Colour: 'Navy'  }, status: 'published' },
    ],
  },
  {
    id: 'pg2',
    title: 'Wireless Noise-Cancelling Headphones',
    brand: 'SoundMax',
    category: 'Electronics',
    description: 'Bluetooth 5.3 over-ear headphones with active noise cancellation, 30hr battery life.',
    images: [],
    variant_attributes: ['Colour'],
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    variants: [
      { id: 'v9',  sku: 'HP-BLK', title: 'Black',      price: 49.99, quantity: 14, condition: 'new', images: [], attributes: { Colour: 'Black'      }, status: 'published' },
      { id: 'v10', sku: 'HP-WHT', title: 'White',      price: 49.99, quantity: 8,  condition: 'new', images: [], attributes: { Colour: 'White'      }, status: 'published' },
      { id: 'v11', sku: 'HP-SLV', title: 'Silver',     price: 54.99, quantity: 5,  condition: 'new', images: [], attributes: { Colour: 'Silver'     }, status: 'draft'     },
    ],
  },
  {
    id: 'pg3',
    title: 'Leather Running Trainers',
    brand: 'StridePro',
    category: 'Footwear',
    description: 'Breathable mesh upper with leather overlays, cushioned midsole for all-day comfort.',
    images: [],
    variant_attributes: ['Size', 'Colour'],
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    variants: [
      { id: 'v12', sku: 'TR-BLK-6',  title: 'Black /  6',  price: 64.99, quantity: 4,  condition: 'new', images: [], attributes: { Size: 'UK 6',  Colour: 'Black' }, status: 'published' },
      { id: 'v13', sku: 'TR-BLK-7',  title: 'Black /  7',  price: 64.99, quantity: 7,  condition: 'new', images: [], attributes: { Size: 'UK 7',  Colour: 'Black' }, status: 'published' },
      { id: 'v14', sku: 'TR-BLK-8',  title: 'Black /  8',  price: 64.99, quantity: 12, condition: 'new', images: [], attributes: { Size: 'UK 8',  Colour: 'Black' }, status: 'published' },
      { id: 'v15', sku: 'TR-WHT-7',  title: 'White /  7',  price: 64.99, quantity: 3,  condition: 'new', images: [], attributes: { Size: 'UK 7',  Colour: 'White' }, status: 'published' },
      { id: 'v16', sku: 'TR-WHT-8',  title: 'White /  8',  price: 64.99, quantity: 0,  condition: 'new', images: [], attributes: { Size: 'UK 8',  Colour: 'White' }, status: 'published' },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusPill(status: string) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    published: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    draft:     { bg: '#f8f4ec', color: '#9496b0', border: '#e8e5df' },
    failed:    { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  }
  const m = map[status] || map.draft
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
      {status}
    </span>
  )
}

function stockBadge(qty: number) {
  if (qty <= 0)  return <span style={{ fontSize: 11, fontWeight: 600, color: '#dc2626' }}>Out of stock</span>
  if (qty <= 5)  return <span style={{ fontSize: 11, fontWeight: 600, color: '#d97706' }}>{qty} left</span>
  return              <span style={{ fontSize: 11, color: '#1a1b22', fontFamily: 'monospace' }}>{qty}</span>
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const router = useRouter()
  const [groups, setGroups]       = useState<ProductGroup[]>(MOCK_GROUPS)
  const [expanded, setExpanded]   = useState<Set<string>>(new Set(['pg1']))
  const [search, setSearch]       = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast]         = useState('')
  const [focusedInput, setFocusedInput] = useState<string | null>(null)

  // New group form state
  const [newTitle, setNewTitle]           = useState('')
  const [newBrand, setNewBrand]           = useState('')
  const [newCategory, setNewCategory]     = useState('')
  const [newAttributes, setNewAttributes] = useState('Size, Colour')

  const supabase = createClient()
  useEffect(() => {
    async function guard() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
    }
    guard()
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function createGroup() {
    if (!newTitle.trim()) return
    const attrs = newAttributes.split(',').map(s => s.trim()).filter(Boolean)
    const g: ProductGroup = {
      id: Date.now().toString(),
      title: newTitle,
      brand: newBrand,
      category: newCategory,
      images: [],
      variant_attributes: attrs,
      variants: [],
      created_at: new Date().toISOString(),
    }
    setGroups(prev => [g, ...prev])
    setExpanded(prev => new Set([...prev, g.id]))
    setNewTitle(''); setNewBrand(''); setNewCategory(''); setNewAttributes('Size, Colour')
    setShowCreate(false)
    showToast(`Product group "${g.title}" created`)
  }

  const filtered = groups.filter(g =>
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    g.brand?.toLowerCase().includes(search.toLowerCase()) ||
    g.variants.some(v => v.sku.toLowerCase().includes(search.toLowerCase()))
  )

  const totalVariants  = groups.reduce((s, g) => s + g.variants.length, 0)
  const totalPublished = groups.reduce((s, g) => s + g.variants.filter(v => v.status === 'published').length, 0)
  const outOfStock     = groups.reduce((s, g) => s + g.variants.filter(v => v.quantity === 0).length, 0)

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid #e8e5df',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
    color: '#1a1b22', outline: 'none', boxSizing: 'border-box', background: 'white',
  }

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', minHeight: '100vh', background: '#f8f4ec', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 200,
          background: 'white', color: '#1a1b22', border: '1px solid #e8e5df',
          borderLeft: '3px solid #059669', borderRadius: 10, padding: '14px 18px',
          fontSize: 13, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ color: '#059669' }}>✓</span> {toast}
        </div>
      )}

      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: 1000 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1b22', margin: 0, letterSpacing: '-0.03em' }}>Products</h1>
              <p style={{ fontSize: 14, color: '#6b6e87', margin: '4px 0 0' }}>
                Group listings into parent products with size, colour and other variant dimensions.
              </p>
            </div>
            <button
              onClick={() => setShowCreate(v => !v)}
              style={{ background: '#e8863f', color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              + New Product Group
            </button>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Product Groups',    value: groups.length,    color: '#e8863f' },
              { label: 'Total Variants',    value: totalVariants,    color: '#2563eb' },
              { label: 'Published Variants',value: totalPublished,   color: '#059669' },
              { label: 'Out of Stock',      value: outOfStock,       color: outOfStock > 0 ? '#dc2626' : '#059669' },
            ].map(k => (
              <div key={k.label} style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: k.color, letterSpacing: '-0.03em', fontFamily: 'monospace' }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Create form */}
          {showCreate && (
            <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1b22', marginBottom: 16 }}>New Product Group</div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1b22', display: 'block', marginBottom: 5 }}>Product title *</label>
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Premium Cotton T-Shirt" style={inputBase} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1b22', display: 'block', marginBottom: 5 }}>Brand</label>
                  <input value={newBrand} onChange={e => setNewBrand(e.target.value)} placeholder="e.g. Nike" style={inputBase} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1b22', display: 'block', marginBottom: 5 }}>Category</label>
                  <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="e.g. Clothing" style={inputBase} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1b22', display: 'block', marginBottom: 5 }}>
                  Variant dimensions <span style={{ fontWeight: 400, color: '#6b6e87' }}>(comma-separated — e.g. Size, Colour)</span>
                </label>
                <input value={newAttributes} onChange={e => setNewAttributes(e.target.value)} placeholder="Size, Colour" style={{ ...inputBase, maxWidth: 320 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={createGroup} style={{ background: '#e8863f', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Create product group
                </button>
                <button onClick={() => setShowCreate(false)} style={{ background: 'white', color: '#6b6e87', border: '1px solid #e8e5df', borderRadius: 8, padding: '9px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 320, marginBottom: 16 }}>
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9496b0' }}>
              <path d="M10 6.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0zm-.8 3.3l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products, SKUs…"
              style={{ ...inputBase, paddingLeft: 32, maxWidth: 320 }}
            />
          </div>

          {/* Product groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(group => {
              const isOpen       = expanded.has(group.id)
              const totalQty     = group.variants.reduce((s, v) => s + v.quantity, 0)
              const pubCount     = group.variants.filter(v => v.status === 'published').length
              const oos          = group.variants.filter(v => v.quantity === 0).length
              const priceRange   = group.variants.length > 0
                ? group.variants[0].price === group.variants[group.variants.length - 1].price
                  ? `£${group.variants[0].price.toFixed(2)}`
                  : `£${Math.min(...group.variants.map(v => v.price)).toFixed(2)} – £${Math.max(...group.variants.map(v => v.price)).toFixed(2)}`
                : '—'

              return (
                <div key={group.id} style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

                  {/* Group header */}
                  <div
                    onClick={() => toggleExpand(group.id)}
                    style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                  >
                    {/* Thumbnail placeholder */}
                    <div style={{ width: 44, height: 44, background: '#f8f4ec', border: '1px solid #e8e5df', borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="#9496b0" strokeWidth="1.2">
                        <path d="M7.5 1.5L13 4.5v6L7.5 13.5 2 10.5v-6L7.5 1.5Z"/><path d="M7.5 13.5V7.5"/><path d="M13 4.5L7.5 7.5 2 4.5"/>
                      </svg>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1b22' }}>{group.title}</span>
                        {group.brand && <span style={{ fontSize: 11, color: '#9496b0' }}>{group.brand}</span>}
                        <span style={{ fontSize: 11, color: '#9496b0', background: '#f8f4ec', border: '1px solid #e8e5df', padding: '1px 7px', borderRadius: 4 }}>{group.category}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b6e87', marginTop: 3, display: 'flex', gap: 14 }}>
                        <span>{group.variants.length} variants</span>
                        <span>{priceRange}</span>
                        <span>Attributes: {group.variant_attributes.join(', ')}</span>
                        <span style={{ color: pubCount === group.variants.length ? '#059669' : '#d97706' }}>{pubCount}/{group.variants.length} published</span>
                        {oos > 0 && <span style={{ color: '#dc2626' }}>{oos} out of stock</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: '#9496b0', fontFamily: 'monospace' }}>{totalQty} units</span>
                      <button
                        onClick={e => { e.stopPropagation(); router.push('/listings/new') }}
                        style={{ fontSize: 11, padding: '4px 10px', background: 'white', color: '#e8863f', border: '1px solid #c7c3fb', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                      >
                        + Add variant
                      </button>
                      <span style={{ color: '#9496b0', fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
                    </div>
                  </div>

                  {/* Variants table */}
                  {isOpen && group.variants.length > 0 && (
                    <div style={{ borderTop: '1px solid #f0ede8' }}>
                      {/* Table header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 80px 70px 90px 90px 80px', gap: 12, padding: '8px 20px', background: '#fafafa', borderBottom: '1px solid #f0ede8' }}>
                        {['Variant', 'SKU', 'Price', 'Stock', 'Condition', 'Status', ''].map(h => (
                          <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                        ))}
                      </div>
                      {group.variants.map((v, i) => (
                        <div
                          key={v.id}
                          style={{ display: 'grid', gridTemplateColumns: '1fr 130px 80px 70px 90px 90px 80px', gap: 12, padding: '10px 20px', borderBottom: i < group.variants.length - 1 ? '1px solid #f7f6f3' : 'none', alignItems: 'center' }}
                        >
                          {/* Variant name + attributes */}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22' }}>
                              {Object.values(v.attributes).join(' / ')}
                            </div>
                            <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                              {Object.entries(v.attributes).map(([k, val]) => (
                                <span key={k} style={{ fontSize: 10, color: '#6b6e87', background: '#f8f4ec', padding: '1px 6px', borderRadius: 3 }}>{k}: {val}</span>
                              ))}
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: '#6b6e87', fontFamily: 'monospace' }}>{v.sku}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22', fontFamily: 'monospace' }}>£{v.price.toFixed(2)}</div>
                          <div>{stockBadge(v.quantity)}</div>
                          <div style={{ fontSize: 11, color: '#6b6e87', textTransform: 'capitalize' }}>{v.condition}</div>
                          <div>{statusPill(v.status)}</div>
                          <div>
                            <button
                              onClick={() => router.push(`/listings`)}
                              style={{ fontSize: 11, color: '#e8863f', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, padding: 0 }}
                            >
                              Edit →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isOpen && group.variants.length === 0 && (
                    <div style={{ borderTop: '1px solid #f0ede8', padding: '24px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: '#6b6e87', marginBottom: 12 }}>No variants yet. Add the first variant for this product.</div>
                      <button
                        onClick={() => router.push('/listings/new')}
                        style={{ background: '#e8863f', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        + Add first variant
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1b22', marginBottom: 6 }}>No product groups found</div>
              <div style={{ fontSize: 13, color: '#6b6e87' }}>Create a product group to manage size and colour variants together.</div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
