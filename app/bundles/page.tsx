'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'
import { createClient } from '../lib/supabase-client'

interface BundleItem { id?: string; component_sku: string; title: string; quantity: number; unit_cost: number }
interface Bundle {
  id: string; sku: string; title: string; description: string | null
  price: number | null; active: boolean; items: BundleItem[]; total_cost: number
}

const EMPTY_FORM = { sku: '', title: '', description: '', price: '', active: true }

function fmtGBP(n: number) {
  return `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function BundlesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [bundles, setBundles]   = useState<Bundle[]>([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState<'create' | 'edit' | null>(null)
  const [form, setForm]         = useState<any>(EMPTY_FORM)
  const [items, setItems]       = useState<BundleItem[]>([{ component_sku: '', title: '', quantity: 1, unit_cost: 0 }])
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login'); else load()
    })
  }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/bundles')
    const json = await res.json()
    setBundles(json.bundles || [])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function openCreate() {
    setForm(EMPTY_FORM)
    setItems([{ component_sku: '', title: '', quantity: 1, unit_cost: 0 }])
    setModal('create')
  }

  function openEdit(b: Bundle) {
    setForm({ id: b.id, sku: b.sku, title: b.title, description: b.description || '', price: b.price || '', active: b.active })
    setItems(b.items.length ? b.items.map(i => ({ component_sku: i.component_sku, title: i.title || '', quantity: i.quantity, unit_cost: i.unit_cost })) : [{ component_sku: '', title: '', quantity: 1, unit_cost: 0 }])
    setModal('edit')
  }

  function updateItem(idx: number, field: keyof BundleItem, val: string | number) {
    setItems(p => p.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  const totalCost = items.reduce((s, i) => s + Number(i.quantity || 1) * Number(i.unit_cost || 0), 0)
  const price     = Number(form.price || 0)
  const margin    = price > 0 && totalCost > 0 ? ((price - totalCost) / price) * 100 : null

  async function save() {
    if (!form.sku || !form.title) { showToast('SKU and title are required'); return }
    setSaving(true)
    try {
      const method = modal === 'create' ? 'POST' : 'PATCH'
      const res = await fetch('/api/bundles', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: form.price ? Number(form.price) : null, items }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      showToast(modal === 'create' ? 'Bundle created' : 'Bundle updated')
      setModal(null); load()
    } catch (e: any) { showToast(e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this bundle?')) return
    await fetch('/api/bundles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    showToast('Bundle deleted'); load()
  }

  async function toggleActive(b: Bundle) {
    await fetch('/api/bundles', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: b.id, active: !b.active }),
    })
    load()
  }

  const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #e8e8e5', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', outline: 'none', color: '#1a1b22' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <AppSidebar />

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#191919', color: 'white', padding: '12px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 300 }}>{toast}</div>}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 28, width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1b22', marginBottom: 22 }}>{modal === 'create' ? 'Create bundle' : 'Edit bundle'}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              {[
                { key: 'sku',   label: 'Bundle SKU *' },
                { key: 'title', label: 'Bundle title *', full: true },
                { key: 'price', label: 'Sell price (£)', type: 'number' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : undefined }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6e87', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{f.label}</div>
                  <input type={f.type || 'text'} value={form[f.key] ?? ''} step={f.type === 'number' ? '0.01' : undefined}
                    onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6e87', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Description</div>
                <textarea rows={2} value={form.description || ''} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))}
                  style={{ ...inputStyle, width: '100%', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22', marginBottom: 10 }}>Component items</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 8 }}>
              <thead>
                <tr style={{ background: '#f5f3ef' }}>
                  {['SKU', 'Description', 'Qty', 'Unit cost', ''].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '4px 4px 4px 0' }}><input value={item.component_sku} onChange={e => updateItem(idx, 'component_sku', e.target.value)} style={{ ...inputStyle, width: 90 }} placeholder="SKU" /></td>
                    <td style={{ padding: '4px 4px' }}><input value={item.title} onChange={e => updateItem(idx, 'title', e.target.value)} style={{ ...inputStyle, width: '100%', minWidth: 140 }} placeholder="Component name" /></td>
                    <td style={{ padding: '4px 4px' }}><input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} style={{ ...inputStyle, width: 55, textAlign: 'right' }} /></td>
                    <td style={{ padding: '4px 4px' }}><input type="number" min={0} step={0.01} value={item.unit_cost} onChange={e => updateItem(idx, 'unit_cost', Number(e.target.value))} style={{ ...inputStyle, width: 75, textAlign: 'right' }} /></td>
                    <td>{items.length > 1 && <button onClick={() => setItems(p => p.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0 6px' }}>✕</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setItems(p => [...p, { component_sku: '', title: '', quantity: 1, unit_cost: 0 }])} style={{ fontSize: 12, color: '#5b52f5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, marginBottom: 16 }}>+ Add component</button>

            {/* Margin preview */}
            <div style={{ background: '#f5f3ef', borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: 12, display: 'flex', gap: 20 }}>
              <span style={{ color: '#6b6e87' }}>Total COGS: <strong style={{ color: '#1a1b22' }}>{fmtGBP(totalCost)}</strong></span>
              {price > 0 && <span style={{ color: '#6b6e87' }}>Sell price: <strong style={{ color: '#1a1b22' }}>{fmtGBP(price)}</strong></span>}
              {margin !== null && <span style={{ color: '#6b6e87' }}>Margin: <strong style={{ color: margin >= 20 ? '#059669' : margin >= 10 ? '#d97706' : '#dc2626' }}>{margin.toFixed(1)}%</strong></span>}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e8e8e5', background: 'white', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={save} disabled={saving || !form.sku || !form.title} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#5b52f5', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !form.sku || !form.title || saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : modal === 'create' ? 'Create bundle' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main style={{ marginLeft: 220, flex: 1, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', margin: 0, letterSpacing: '-0.02em' }}>Bundles & Kitting</h1>
            <p style={{ fontSize: 13, color: '#6b6e87', margin: '4px 0 0' }}>Group component SKUs into sellable bundles with margin calculations</p>
          </div>
          <button onClick={openCreate} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#5b52f5', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Create bundle</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total bundles', value: bundles.length },
            { label: 'Active',        value: bundles.filter(b => b.active).length },
            { label: 'Total components', value: bundles.reduce((s, b) => s + b.items.length, 0) },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1b22', letterSpacing: '-0.02em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#9496b0', fontSize: 13 }}>Loading…</div>
        ) : bundles.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#6b6e87', marginBottom: 12 }}>No bundles yet — create your first kit or bundle set</div>
            <button onClick={openCreate} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#5b52f5', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Create bundle</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bundles.map(b => {
              const p = Number(b.price || 0)
              const margin = p > 0 && b.total_cost > 0 ? ((p - b.total_cost) / p) * 100 : null
              const isExpanded = expanded === b.id
              return (
                <div key={b.id} style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => setExpanded(isExpanded ? null : b.id)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 700, color: '#1a1b22', fontSize: 14 }}>{b.title}</span>
                        <span style={{ fontSize: 11, color: '#9496b0', fontFamily: 'monospace' }}>{b.sku}</span>
                        {!b.active && <span style={{ fontSize: 10, background: '#fef2f2', color: '#dc2626', borderRadius: 4, padding: '1px 6px' }}>Inactive</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b6e87', marginTop: 2 }}>{b.items.length} components · COGS {fmtGBP(b.total_cost)}{p > 0 ? ` · Price ${fmtGBP(p)}` : ''}</div>
                    </div>
                    {margin !== null && (
                      <span style={{ background: margin >= 20 ? '#ecfdf5' : margin >= 10 ? '#fffbeb' : '#fef2f2', color: margin >= 20 ? '#059669' : margin >= 10 ? '#d97706' : '#dc2626', border: `1px solid ${margin >= 20 ? '#a7f3d0' : margin >= 10 ? '#fde68a' : '#fecaca'}`, borderRadius: 100, fontSize: 11, fontWeight: 700, padding: '3px 10px' }}>
                        {margin.toFixed(1)}% margin
                      </span>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={e => { e.stopPropagation(); toggleActive(b) }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e8e5df', background: 'white', fontSize: 11, cursor: 'pointer', color: '#6b6e87', fontFamily: 'inherit' }}>
                        {b.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={e => { e.stopPropagation(); openEdit(b) }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e8e5df', background: 'white', fontSize: 11, cursor: 'pointer', color: '#6b6e87', fontFamily: 'inherit' }}>Edit</button>
                      <button onClick={e => { e.stopPropagation(); del(b.id) }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: 'white', fontSize: 11, cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>Delete</button>
                    </div>
                    <span style={{ color: '#9496b0', fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  {isExpanded && b.items.length > 0 && (
                    <div style={{ borderTop: '1px solid #f0ede8', padding: '12px 20px 16px', background: '#faf9f7' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr>
                            {['Component SKU', 'Title', 'Qty', 'Unit cost', 'Line total'].map(h => (
                              <th key={h} style={{ padding: '4px 8px 8px 0', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {b.items.map((item, idx) => (
                            <tr key={idx} style={{ borderTop: '1px solid #f0ede8' }}>
                              <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace', fontSize: 11, color: '#1a1b22' }}>{item.component_sku}</td>
                              <td style={{ padding: '8px 8px', color: '#6b6e87' }}>{item.title || '—'}</td>
                              <td style={{ padding: '8px 8px', color: '#1a1b22', fontWeight: 600 }}>{item.quantity}</td>
                              <td style={{ padding: '8px 8px', color: '#6b6e87' }}>{fmtGBP(item.unit_cost)}</td>
                              <td style={{ padding: '8px 0', fontWeight: 600, color: '#1a1b22' }}>{fmtGBP(item.quantity * item.unit_cost)}</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: '2px solid #e8e5df' }}>
                            <td colSpan={4} style={{ padding: '8px 8px 4px 0', fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase' }}>Total COGS</td>
                            <td style={{ padding: '8px 0 4px', fontWeight: 700, color: '#1a1b22' }}>{fmtGBP(b.total_cost)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
