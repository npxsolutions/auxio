'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'
import { createClient } from '../lib/supabase-client'

interface Supplier {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  payment_terms: string
  lead_time_days: number
  currency: string
  notes: string | null
  active: boolean
  totalSpend: number
  openPos: number
}

const EMPTY: Omit<Supplier, 'id' | 'totalSpend' | 'openPos'> = {
  name: '', contact_name: '', email: '', phone: '', website: '',
  payment_terms: 'Net 30', lead_time_days: 7, currency: 'GBP', notes: '', active: true,
}

function fmtGBP(n: number) {
  return `£${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
}

export default function SuppliersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState<'create' | 'edit' | null>(null)
  const [form, setForm]           = useState<any>(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState('')
  const [search, setSearch]       = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else load()
    })
  }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/suppliers')
    const json = await res.json()
    setSuppliers(json.suppliers || [])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function openCreate() { setForm(EMPTY); setModal('create') }
  function openEdit(s: Supplier) { setForm(s); setModal('edit') }

  async function save() {
    setSaving(true)
    try {
      const method = modal === 'create' ? 'POST' : 'PATCH'
      const res = await fetch('/api/suppliers', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      showToast(modal === 'create' ? 'Supplier added' : 'Supplier updated')
      setModal(null)
      load()
    } catch (e: any) {
      showToast(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function del(id: string) {
    if (!confirm('Delete this supplier? Any purchase orders linked to them will be unlinked.')) return
    await fetch('/api/suppliers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    showToast('Supplier deleted')
    load()
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(search.toLowerCase())
  )

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid #e8e8e5',
    borderRadius: 7, fontSize: 13, color: '#191919',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#6b6e87',
    textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <AppSidebar />

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#191919', color: 'white', padding: '12px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 300 }}>
          {toast}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1b22', marginBottom: 24 }}>
              {modal === 'create' ? 'Add supplier' : 'Edit supplier'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { key: 'name',          label: 'Company name *',  full: true },
                { key: 'contact_name',  label: 'Contact name' },
                { key: 'email',         label: 'Email',          type: 'email' },
                { key: 'phone',         label: 'Phone' },
                { key: 'website',       label: 'Website',        type: 'url' },
                { key: 'payment_terms', label: 'Payment terms' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : undefined }}>
                  <label style={labelStyle}>{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    value={form[f.key] || ''}
                    onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Lead time (days)</label>
                <input type="number" min={1} value={form.lead_time_days || 7}
                  onChange={e => setForm((p: any) => ({ ...p, lead_time_days: Number(e.target.value) }))}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Currency</label>
                <select value={form.currency || 'GBP'}
                  onChange={e => setForm((p: any) => ({ ...p, currency: e.target.value }))}
                  style={inputStyle}>
                  {['GBP', 'USD', 'EUR', 'CNY', 'JPY'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Notes</label>
                <textarea rows={3} value={form.notes || ''}
                  onChange={e => setForm((p: any) => ({ ...p, notes: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e8e8e5', background: 'white', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={save} disabled={!form.name || saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#5b52f5', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !form.name || saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : modal === 'create' ? 'Add supplier' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main style={{ marginLeft: 220, flex: 1, padding: 32 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', margin: 0, letterSpacing: '-0.02em' }}>Suppliers</h1>
            <p style={{ fontSize: 13, color: '#6b6e87', margin: '4px 0 0' }}>{suppliers.length} suppliers · manage contacts, lead times and spend</p>
          </div>
          <button onClick={openCreate} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#5b52f5', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add supplier
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total suppliers', value: suppliers.length },
            { label: 'Active',          value: suppliers.filter(s => s.active).length },
            { label: 'Total PO spend',  value: fmtGBP(suppliers.reduce((s, x) => s + x.totalSpend, 0)) },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1b22', letterSpacing: '-0.02em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Search suppliers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '9px 14px', border: '1px solid #e8e5df', borderRadius: 9, fontSize: 13, width: 280, fontFamily: 'inherit', background: 'white', outline: 'none' }}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#9496b0', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#6b6e87', marginBottom: 12 }}>No suppliers yet</div>
            <button onClick={openCreate} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#5b52f5', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Add your first supplier
            </button>
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#faf9f7', borderBottom: '1px solid #e8e5df' }}>
                  {['Supplier', 'Contact', 'Lead time', 'Payment terms', 'Open POs', 'Total spend', ''].map(col => (
                    <th key={col} style={{ padding: '10px 16px', textAlign: col === '' ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={s.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1a1b22' }}>{s.name}</div>
                      {s.website && <div style={{ fontSize: 11, color: '#9496b0', marginTop: 1 }}>{s.website}</div>}
                      {!s.active && <span style={{ fontSize: 10, background: '#fef2f2', color: '#dc2626', borderRadius: 4, padding: '1px 6px', marginTop: 2, display: 'inline-block' }}>Inactive</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: '#1a1b22' }}>{s.contact_name || '—'}</div>
                      <div style={{ fontSize: 11, color: '#9496b0' }}>{s.email || ''}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b6e87' }}>{s.lead_time_days}d</td>
                    <td style={{ padding: '12px 16px', color: '#6b6e87' }}>{s.payment_terms}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {s.openPos > 0
                        ? <span style={{ background: '#fffbeb', color: '#d97706', borderRadius: 100, fontSize: 11, fontWeight: 600, padding: '2px 8px' }}>{s.openPos} open</span>
                        : <span style={{ color: '#9496b0' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: s.totalSpend > 0 ? '#1a1b22' : '#9496b0' }}>{s.totalSpend > 0 ? fmtGBP(s.totalSpend) : '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button onClick={() => openEdit(s)} style={{ background: 'none', border: '1px solid #e8e5df', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer', color: '#6b6e87', marginRight: 6, fontFamily: 'inherit' }}>Edit</button>
                      <button onClick={() => del(s.id)} style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
