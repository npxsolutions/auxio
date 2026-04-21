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
  return Math.ceil((item.lead_time_days + item.safety_stock_days) * 1)
}

function stockStatus(item: InventoryItem): { label: string; bg: string; color: string; border: string } {
  if (item.stock_qty <= 0)                      return { label: 'Out of stock', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
  if (item.stock_qty <= item.safety_stock_days) return { label: 'Low stock',    bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
  return                                               { label: 'In stock',     bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' }
}

const inputStyle = {
  padding: '6px 10px',
  border: '1px solid #e8e5df',
  borderRadius: 6,
  fontSize: 12,
  fontFamily: 'inherit',
  color: '#1a1b22',
  outline: 'none',
  background: 'white',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

export default function InventoryPage() {
  const router = useRouter()
  const [items, setItems]   = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [toast, setToast]     = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [edits, setEdits]     = useState<Record<string, Partial<InventoryItem>>>({})
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
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

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast(msg)
    setToastType(type)
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
      showToast('Saved', 'success')
    } catch {
      showToast('Failed to save — please try again', 'error')
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

    if (!rows.length) { showToast('No valid rows found in CSV', 'error'); return }

    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    })
    if (res.ok) {
      const json = await res.json()
      showToast(`Imported ${json.inserted} items`, 'success')
      load()
    } else {
      showToast('Import failed', 'error')
    }
  }

  const filtered = items.filter(i =>
    !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8f4ec', fontFamily: 'inherit' }}>
      <div style={{ fontSize: 14, color: '#6b6e87' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', minHeight: '100vh', background: '#f8f4ec', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: 'white', color: '#1a1b22',
          border: '1px solid #e8e5df',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
          borderRadius: 10, padding: '14px 18px',
          fontSize: 13, fontWeight: 500, zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 10,
          borderLeft: `3px solid ${toastType === 'success' ? '#059669' : '#dc2626'}`,
          fontFamily: 'inherit',
        }}>
          <span style={{ color: toastType === 'success' ? '#059669' : '#dc2626' }}>{toastType === 'success' ? '✓' : '✕'}</span>
          {toast}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px', minWidth: 0 }}>
        <div style={{ maxWidth: '1000px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1b22', letterSpacing: '-0.03em', margin: 0 }}>Inventory</h1>
              <p style={{ fontSize: 14, color: '#6b6e87', margin: '4px 0 0' }}>Manage stock levels, lead times, and reorder points.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search SKU or title…"
                style={{
                  padding: '9px 12px',
                  border: `1px solid ${focusedInput === 'search' ? '#e8863f' : '#e8e5df'}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  color: '#1a1b22',
                  outline: 'none',
                  width: 200,
                  boxShadow: focusedInput === 'search' ? '0 0 0 3px rgba(232,134,63,$1)' : 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={() => setFocusedInput('search')}
                onBlur={() => setFocusedInput(null)}
              />
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) importCSV(e.target.files[0]) }} />
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  background: 'white', color: '#1a1b22',
                  border: '1px solid #e8e5df',
                  borderRadius: 8, padding: '9px 14px',
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Import CSV
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '56px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ width: 56, height: 56, background: '#f8f4ec', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>📦</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1b22', marginBottom: 6 }}>No inventory yet</div>
              <div style={{ fontSize: 13, color: '#6b6e87', marginBottom: 24 }}>Import a CSV or sync a channel to populate your inventory.</div>
              <button onClick={() => fileRef.current?.click()} style={{
                background: '#e8863f', color: 'white', border: 'none',
                borderRadius: 8, padding: '10px 20px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Import CSV
              </button>
            </div>
          ) : (
            <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0ede8', background: '#fafaf9' }}>
                    {['SKU', 'Title', 'Stock', 'Lead time', 'Safety stock', 'Reorder at', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => {
                    const status = stockStatus(item)
                    const rp = reorderPoint(item)
                    const isDirty = !!edits[item.id] && Object.keys(edits[item.id]).length > 0
                    return (
                      <tr key={item.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f0ede8' : undefined }}>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b6e87', fontFamily: 'var(--font-mono), ui-monospace, monospace', whiteSpace: 'nowrap' }}>{item.sku}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: '#1a1b22', maxWidth: 200 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <input
                            type="number"
                            min={0}
                            value={getValue(item, 'stock_qty') as number}
                            onChange={e => setField(item.id, 'stock_qty', parseInt(e.target.value) || 0)}
                            onFocus={() => setFocusedInput(`${item.id}-stock`)}
                            onBlur={() => setFocusedInput(null)}
                            style={{
                              ...inputStyle,
                              width: 64,
                              border: `1px solid ${focusedInput === `${item.id}-stock` ? '#e8863f' : '#e8e5df'}`,
                              boxShadow: focusedInput === `${item.id}-stock` ? '0 0 0 3px rgba(232,134,63,$1)' : 'none',
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="number"
                              min={1}
                              value={getValue(item, 'lead_time_days') as number}
                              onChange={e => setField(item.id, 'lead_time_days', parseInt(e.target.value) || 1)}
                              onFocus={() => setFocusedInput(`${item.id}-lead`)}
                              onBlur={() => setFocusedInput(null)}
                              style={{
                                ...inputStyle,
                                width: 52,
                                border: `1px solid ${focusedInput === `${item.id}-lead` ? '#e8863f' : '#e8e5df'}`,
                                boxShadow: focusedInput === `${item.id}-lead` ? '0 0 0 3px rgba(232,134,63,$1)' : 'none',
                              }}
                            />
                            <span style={{ fontSize: 11, color: '#9496b0' }}>d</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="number"
                              min={1}
                              value={getValue(item, 'safety_stock_days') as number}
                              onChange={e => setField(item.id, 'safety_stock_days', parseInt(e.target.value) || 1)}
                              onFocus={() => setFocusedInput(`${item.id}-safety`)}
                              onBlur={() => setFocusedInput(null)}
                              style={{
                                ...inputStyle,
                                width: 52,
                                border: `1px solid ${focusedInput === `${item.id}-safety` ? '#e8863f' : '#e8e5df'}`,
                                boxShadow: focusedInput === `${item.id}-safety` ? '0 0 0 3px rgba(232,134,63,$1)' : 'none',
                              }}
                            />
                            <span style={{ fontSize: 11, color: '#9496b0' }}>d</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: '#1a1b22', fontWeight: 500, fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>{rp}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{
                            background: status.bg,
                            color: status.color,
                            border: `1px solid ${status.border}`,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 9px',
                            borderRadius: 100,
                            whiteSpace: 'nowrap',
                          }}>
                            {status.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {isDirty && (
                            <button
                              onClick={() => saveRow(item)}
                              disabled={saving === item.id}
                              style={{
                                background: '#e8863f', color: 'white',
                                border: 'none', borderRadius: 6,
                                padding: '5px 12px',
                                fontSize: 11, fontWeight: 600,
                                cursor: saving === item.id ? 'wait' : 'pointer',
                                fontFamily: 'inherit',
                                opacity: saving === item.id ? 0.7 : 1,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {saving === item.id ? '…' : 'Save'}
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
