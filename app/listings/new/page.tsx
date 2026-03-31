'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CONDITIONS = ['new', 'used', 'refurbished'] as const

export default function NewListingPage() {
  const router = useRouter()
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({
    title:        '',
    description:  '',
    price:        '',
    compare_price: '',
    sku:          '',
    barcode:      '',
    brand:        '',
    category:     '',
    condition:    'new' as typeof CONDITIONS[number],
    quantity:     '',
    weight_grams: '',
    images:       '' as string, // comma-separated URLs for now
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price:        parseFloat(form.price) || 0,
          compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
          quantity:     parseInt(form.quantity) || 0,
          weight_grams: form.weight_grams ? parseInt(form.weight_grams) : null,
          images:       form.images.split(',').map(s => s.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create listing'); return }

      router.push(`/listings/${data.listing.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e8e8e5', borderRadius: '7px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#191919', outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: '12px', fontWeight: 600, color: '#191919', display: 'block', marginBottom: '5px' } as const

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', minHeight: '100vh', background: '#f7f7f5', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}>

        <button onClick={() => router.push('/listings')} style={{ background: 'none', border: 'none', color: '#787774', fontSize: '13px', cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif', marginBottom: '24px' }}>
          ← Back to listings
        </button>

        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#191919', margin: '0 0 24px', letterSpacing: '-0.02em' }}>New listing</h1>

        {error && (
          <div style={{ background: '#fce8e6', color: '#c9372c', padding: '10px 14px', borderRadius: '7px', fontSize: '13px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Core details */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '16px' }}>Product details</div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Title *</label>
              <input value={form.title} onChange={set('title')} placeholder="e.g. Chanel No.5 Eau de Parfum 100ml" style={inputStyle} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={set('description')} placeholder="Describe the product — this appears on all channels" rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Brand</label>
                <input value={form.brand} onChange={set('brand')} placeholder="Chanel" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <input value={form.category} onChange={set('category')} placeholder="Fragrances" style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Condition</label>
              <select value={form.condition} onChange={set('condition')} style={inputStyle}>
                {CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Pricing & inventory */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '16px' }}>Pricing & inventory</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Price (£) *</label>
                <input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} placeholder="29.99" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Compare at price (£)</label>
                <input type="number" step="0.01" min="0" value={form.compare_price} onChange={set('compare_price')} placeholder="39.99" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Stock quantity</label>
                <input type="number" min="0" value={form.quantity} onChange={set('quantity')} placeholder="50" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>SKU</label>
                <input value={form.sku} onChange={set('sku')} placeholder="CN5-100ML" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Barcode / EAN</label>
                <input value={form.barcode} onChange={set('barcode')} placeholder="3145891254589" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '16px' }}>Shipping</div>
            <div>
              <label style={labelStyle}>Weight (grams)</label>
              <input type="number" min="0" value={form.weight_grams} onChange={set('weight_grams')} placeholder="320" style={inputStyle} />
            </div>
          </div>

          {/* Images */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', padding: '24px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '4px' }}>Images</div>
            <p style={{ fontSize: '12px', color: '#787774', margin: '0 0 12px' }}>Paste image URLs separated by commas</p>
            <textarea
              value={form.images}
              onChange={set('images')}
              placeholder="https://cdn.example.com/image1.jpg, https://cdn.example.com/image2.jpg"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{ width: '100%', padding: '13px', background: saving ? '#e8e8e5' : '#191919', color: saving ? '#9b9b98' : 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            {saving ? 'Saving...' : 'Save listing →'}
          </button>
        </form>
      </div>
    </div>
  )
}
