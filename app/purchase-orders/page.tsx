'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'
import { createClient } from '../lib/supabase-client'

interface PurchaseOrder {
  id: string
  po_number: string
  status: string
  order_date: string
  expected_date: string | null
  received_date: string | null
  total_cost: number
  subtotal: number
  shipping_cost: number
  currency: string
  notes: string | null
  suppliers: { name: string } | null
}

interface POItem { sku: string; description: string; quantity_ordered: number; unit_cost: number }
interface Supplier { id: string; name: string; lead_time_days: number }

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  draft:               { bg: '#f5f3ef', color: '#6b6e87', label: 'Draft' },
  sent:                { bg: '#eff6ff', color: '#2563eb', label: 'Sent' },
  confirmed:           { bg: '#fffbeb', color: '#d97706', label: 'Confirmed' },
  partially_received:  { bg: '#f0fdf4', color: '#15803d', label: 'Part. received' },
  received:            { bg: '#ecfdf5', color: '#059669', label: 'Received' },
  cancelled:           { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' },
}

function fmtGBP(n: number) {
  return `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [orders, setOrders]       = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [form, setForm] = useState({
    supplier_id: '', order_date: new Date().toISOString().slice(0, 10),
    expected_date: '', shipping_cost: 0, notes: '',
  })
  const [items, setItems] = useState<POItem[]>([
    { sku: '', description: '', quantity_ordered: 1, unit_cost: 0 }
  ])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else { load(); loadSuppliers() }
    })
  }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/purchase-orders')
    const json = await res.json()
    setOrders(json.purchase_orders || [])
    setLoading(false)
  }

  async function loadSuppliers() {
    const res = await fetch('/api/suppliers')
    const json = await res.json()
    setSuppliers(json.suppliers || [])
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function addItem() {
    setItems(p => [...p, { sku: '', description: '', quantity_ordered: 1, unit_cost: 0 }])
  }

  function updateItem(idx: number, field: keyof POItem, val: string | number) {
    setItems(p => p.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  function removeItem(idx: number) {
    setItems(p => p.filter((_, i) => i !== idx))
  }

  const subtotal = items.reduce((s, i) => s + Number(i.quantity_ordered || 0) * Number(i.unit_cost || 0), 0)
  const total    = subtotal + Number(form.shipping_cost || 0)

  async function createPO() {
    if (!items.some(i => i.sku || i.description)) { showToast('Add at least one item'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      showToast(`${json.po.po_number} created`)
      setModal(false)
      setForm({ supplier_id: '', order_date: new Date().toISOString().slice(0, 10), expected_date: '', shipping_cost: 0, notes: '' })
      setItems([{ sku: '', description: '', quantity_ordered: 1, unit_cost: 0 }])
      load()
    } catch (e: any) {
      showToast(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/purchase-orders', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, ...(status === 'received' ? { received_date: new Date().toISOString().slice(0, 10) } : {}) }),
    })
    load()
  }

  async function del(id: string) {
    if (!confirm('Delete this purchase order?')) return
    await fetch('/api/purchase-orders', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    showToast('Purchase order deleted')
    load()
  }

  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)

  const openValue = orders.filter(o => !['received','cancelled'].includes(o.status)).reduce((s, o) => s + Number(o.total_cost || 0), 0)
  const receivedValue = orders.filter(o => o.status === 'received').reduce((s, o) => s + Number(o.total_cost || 0), 0)

  const inputStyle: React.CSSProperties = { padding: '7px 9px', border: '1px solid #e8e8e5', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', outline: 'none', color: '#1a1b22' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <AppSidebar />

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#191919', color: 'white', padding: '12px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 300 }}>{toast}</div>
      )}

      {/* Create modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 28, width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1b22', marginBottom: 22 }}>New Purchase Order</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6e87', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Supplier</div>
                <select value={form.supplier_id} onChange={e => setForm(p => ({ ...p, supplier_id: e.target.value }))} style={{ ...inputStyle, width: '100%' }}>
                  <option value="">— Select —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6e87', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Order date</div>
                <input type="date" value={form.order_date} onChange={e => setForm(p => ({ ...p, order_date: e.target.value }))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6e87', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Expected arrival</div>
                <input type="date" value={form.expected_date} onChange={e => setForm(p => ({ ...p, expected_date: e.target.value }))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Line items */}
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22', marginBottom: 10 }}>Line items</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 10 }}>
              <thead>
                <tr style={{ background: '#f5f3ef' }}>
                  {['SKU', 'Description', 'Qty', 'Unit cost', 'Line total', ''].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '4px 4px 4px 0' }}><input value={item.sku} onChange={e => updateItem(idx, 'sku', e.target.value)} style={{ ...inputStyle, width: 90 }} placeholder="SKU-001" /></td>
                    <td style={{ padding: '4px 4px' }}><input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} style={{ ...inputStyle, width: '100%', minWidth: 160 }} placeholder="Product name" /></td>
                    <td style={{ padding: '4px 4px' }}><input type="number" min={1} value={item.quantity_ordered} onChange={e => updateItem(idx, 'quantity_ordered', Number(e.target.value))} style={{ ...inputStyle, width: 60, textAlign: 'right' }} /></td>
                    <td style={{ padding: '4px 4px' }}><input type="number" min={0} step={0.01} value={item.unit_cost} onChange={e => updateItem(idx, 'unit_cost', Number(e.target.value))} style={{ ...inputStyle, width: 80, textAlign: 'right' }} /></td>
                    <td style={{ padding: '4px 8px', fontWeight: 600, color: '#1a1b22', whiteSpace: 'nowrap' }}>{fmtGBP(item.quantity_ordered * item.unit_cost)}</td>
                    <td style={{ padding: '4px 0' }}>
                      {items.length > 1 && (
                        <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 14, padding: '0 4px' }}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addItem} style={{ fontSize: 12, color: '#5b52f5', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600, marginBottom: 18 }}>+ Add line item</button>

            {/* Totals */}
            <div style={{ background: '#f5f3ef', borderRadius: 8, padding: '12px 16px', marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', fontSize: 13 }}>
              <div style={{ color: '#6b6e87' }}>Subtotal: <strong style={{ color: '#1a1b22' }}>{fmtGBP(subtotal)}</strong></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b6e87' }}>
                Shipping:
                <input type="number" min={0} step={0.01} value={form.shipping_cost}
                  onChange={e => setForm(p => ({ ...p, shipping_cost: Number(e.target.value) }))}
                  style={{ ...inputStyle, width: 80, textAlign: 'right', marginLeft: 6 }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1b22', borderTop: '1px solid #e8e5df', paddingTop: 8, marginTop: 4 }}>
                Total: {fmtGBP(total)}
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6e87', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Notes</div>
              <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                style={{ ...inputStyle, width: '100%', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e8e8e5', background: 'white', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={createPO} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#5b52f5', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Creating…' : 'Create PO'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main style={{ marginLeft: 220, flex: 1, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', margin: 0, letterSpacing: '-0.02em' }}>Purchase Orders</h1>
            <p style={{ fontSize: 13, color: '#6b6e87', margin: '4px 0 0' }}>Track supplier orders and stock replenishment</p>
          </div>
          <button onClick={() => setModal(true)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#5b52f5', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            + New PO
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total POs',      value: orders.length },
            { label: 'Open value',     value: fmtGBP(openValue) },
            { label: 'Received value', value: fmtGBP(receivedValue) },
            { label: 'Pending arrival', value: orders.filter(o => o.status === 'confirmed').length },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', letterSpacing: '-0.02em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {['all', 'draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '6px 12px', borderRadius: 8, border: '1px solid',
              borderColor: statusFilter === s ? '#5b52f5' : '#e8e5df',
              background: statusFilter === s ? '#5b52f5' : 'white',
              color: statusFilter === s ? 'white' : '#6b6e87',
              fontSize: 12, fontWeight: statusFilter === s ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {s === 'all' ? 'All' : STATUS_STYLE[s]?.label || s}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#9496b0', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#6b6e87', marginBottom: 12 }}>{orders.length === 0 ? 'No purchase orders yet' : 'No orders in this status'}</div>
            {orders.length === 0 && <button onClick={() => setModal(true)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#5b52f5', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Create first PO</button>}
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#faf9f7', borderBottom: '1px solid #e8e5df' }}>
                  {['PO Number', 'Supplier', 'Order date', 'Expected', 'Total', 'Status', 'Actions'].map(col => (
                    <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((po, idx) => {
                  const st = STATUS_STYLE[po.status] || STATUS_STYLE.draft
                  const nextStatuses: Record<string, string[]> = {
                    draft: ['sent', 'cancelled'],
                    sent: ['confirmed', 'cancelled'],
                    confirmed: ['partially_received', 'received', 'cancelled'],
                    partially_received: ['received', 'cancelled'],
                  }
                  const actions = nextStatuses[po.status] || []
                  return (
                    <tr key={po.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1a1b22', fontFamily: 'monospace', fontSize: 12 }}>{po.po_number}</td>
                      <td style={{ padding: '12px 16px', color: '#1a1b22' }}>{po.suppliers?.name || '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#6b6e87' }}>{fmtDate(po.order_date)}</td>
                      <td style={{ padding: '12px 16px', color: '#6b6e87' }}>{fmtDate(po.expected_date)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1a1b22' }}>{fmtGBP(po.total_cost)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: st.bg, color: st.color, borderRadius: 100, fontSize: 11, fontWeight: 600, padding: '3px 9px' }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {actions.map(a => (
                            <button key={a} onClick={() => updateStatus(po.id, a)}
                              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e8e5df', background: 'white', fontSize: 11, cursor: 'pointer', color: '#6b6e87', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                              → {STATUS_STYLE[a]?.label || a}
                            </button>
                          ))}
                          {['draft','cancelled','received'].includes(po.status) && (
                            <button onClick={() => del(po.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: 'white', fontSize: 11, cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
