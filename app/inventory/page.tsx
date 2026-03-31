'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase-client'
import AppSidebar from '../components/AppSidebar'

interface InventoryItem {
  id: string
  sku: string
  title: string
  stock_qty: number
  lead_time_days: number
  safety_stock_days: number
  channel: string | null
  cost_price: number | null
  updated_at: string
}

function reorderPoint(item: InventoryItem): number {
  return Math.ceil((item.lead_time_days + item.safety_stock_days) * 1) // assumes 1 unit/day as floor
}

function stockStatus(item: InventoryItem): { label: string; bg: string; color: string } {
  if (item.stock_qty <= 0) return { label: 'Out of stock', bg: '#fce8e6', color: '#c9372c' }
  if (item.stock_qty <= item.safety_stock_days) return { label: 'Low stock', bg: '#fff3e6', color: '#c97a2c' }
  return { label: 'In stock', bg: '#e8f5f3', color: '#0f7b6c' }
}

export default function InventoryPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [edits, setEdits] = useState<Record<string, Partial<InventoryItem>>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const res = await fetch('/api/inventory')
    if (res.ok) {
      const json = await res.json()
      setItems(json.inventory || [])
    }
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  function setField(id: string, field: keyof InventoryItem, value: any) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  function getValue(item: InventoryItem, field: keyof InventoryItem) {
    return edits[item.id]?.[field] ?? item[field]
  }

  async function saveRow(item: InventoryItem) {
    const pending = edits[item.id]
    if (!pending || Object.keys(pending).length === 0) return
    setSaving(item.id)
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, ...pending }),
      })
      if (!res.ok) throw new Error('Save failed')
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...pending } : i))
      setEdits(prev => { const next = { ...prev }; delete next[item.id]; return next })
      showToast('Saved')
    } catch {
      showToast('Failed to save — please try again')
    } finally {
      setSaving(null)
    }
  }

  async function importCSV(file: File) {
    const text = await file.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

    const rows = lines.slice(1).map(line => {
      const cols = line.split(',')
      const row: any = {}
      headers.forEach((h, i) => { row[h] = cols[i]?.trim() })
      return {
        sku:               row['sku'] || row['product id'] || '',
        title:             row['title'] || row['name'] || '',
        stock_qty:         parseInt(row['stock'] || row['qty'] || row['quantity'] || '0') || 0,
        lead_time_days:    parseInt(row['lead_time'] || row['lead time'] || '14') || 14,
        safety_stock_days: parseInt(row['safety_stock'] || row['safety stock'] || '14') || 14,
        cost_price:        parseFloat(row['cost'] || row['cost_price'] || '0') || null,
        channel:           row['channel'] || null,
      }
    }).filter(r => r.sku)

    if (!rows.length) { showToast('No valid rows found in CSV'); return }

    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    })
    if (res.ok) {
      const json = await res.json()
      showToast(`Imported ${json.inserted} items`)
      load()
    } else {
      showToast('Import failed')
    }
  }

  const filtered = items.filter(i =>
    !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f7f5', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: '14px', color: '#787774' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f7f7f5', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#191919', color: 'white', padding: '12px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, zIndex: 200 }}>
          {toast}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px', minWidth: 0 }}>
        <div style={{ maxWidth: '1000px' }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#191919', letterSpacing: '-0.02em', marginBottom: '4px' }}>Inventory</h1>
              <p style={{ fontSize: '14px', color: '#787774' }}>Manage stock levels, lead times, and reorder points.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search SKU or title..."
                style={{ padding: '8px 12px', border: '1px solid #e8e8e5', borderRadius: '7px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#191919', outline: 'none', width: '200px' }}
              />
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) importCSV(e.target.files[0]) }} />
              <button
                onClick={() => fileRef.current?.click()}
                style={{ background: 'white', color: '#191919', border: '1px solid #e8e8e5', borderRadius: '7px', padding: '8px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                Import CSV
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#191919', marginBottom: '6px' }}>No inventory yet</div>
              <div style={{ fontSize: '13px', color: '#787774', marginBottom: '20px' }}>Import a CSV or sync a channel to populate your inventory.</div>
              <button onClick={() => fileRef.current?.click()} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '7px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Import CSV
              </button>
            </div>
          ) : (
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f1ef' }}>
                    {['SKU', 'Title', 'Stock', 'Lead time', 'Safety stock', 'Reorder at', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => {
                    const status = stockStatus(item)
                    const rp = reorderPoint(item)
                    const isDirty = !!edits[item.id] && Object.keys(edits[item.id]).length > 0
                    return (
                      <tr key={item.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f7f7f5' : undefined }}>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: '#787774', fontFamily: 'monospace' }}>{item.sku}</td>
                        <td style={{ padding: '10px 14px', fontSize: '13px', color: '#191919', maxWidth: '200px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="number"
                            min={0}
                            value={getValue(item, 'stock_qty') as number}
                            onChange={e => setField(item.id, 'stock_qty', parseInt(e.target.value) || 0)}
                            style={{ width: '64px', padding: '5px 8px', border: '1px solid #e8e8e5', borderRadius: '5px', fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#191919', outline: 'none' }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              min={1}
                              value={getValue(item, 'lead_time_days') as number}
                              onChange={e => setField(item.id, 'lead_time_days', parseInt(e.target.value) || 1)}
                              style={{ width: '52px', padding: '5px 8px', border: '1px solid #e8e8e5', borderRadius: '5px', fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#191919', outline: 'none' }}
                            />
                            <span style={{ fontSize: '11px', color: '#9b9b98' }}>d</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              min={1}
                              value={getValue(item, 'safety_stock_days') as number}
                              onChange={e => setField(item.id, 'safety_stock_days', parseInt(e.target.value) || 1)}
                              style={{ width: '52px', padding: '5px 8px', border: '1px solid #e8e8e5', borderRadius: '5px', fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#191919', outline: 'none' }}
                            />
                            <span style={{ fontSize: '11px', color: '#9b9b98' }}>d</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '13px', color: '#191919', fontWeight: 500 }}>{rp}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: status.bg, color: status.color, fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '100px' }}>{status.label}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {isDirty && (
                            <button
                              onClick={() => saveRow(item)}
                              disabled={saving === item.id}
                              style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 12px', fontSize: '11px', fontWeight: 600, cursor: saving === item.id ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif' }}
                            >
                              {saving === item.id ? '...' : 'Save'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
