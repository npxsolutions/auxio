'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'
import { createClient } from '../lib/supabase-client'

interface Campaign {
  id: string
  channel: string
  campaign_name: string
  campaign_id: string | null
  status: string
  budget_daily: number | null
  target_acos: number
  spend: number
  impressions: number
  clicks: number
  ad_orders: number
  revenue: number
  acos: number | null
  roas: number
  ctr: number
  cvr: number
  over_acos: boolean
  period_start: string | null
  period_end: string | null
}

interface Summary {
  totalSpend: number; totalRevenue: number; totalOrders: number
  blendedAcos: number; blendedRoas: number
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active: { bg: '#f0fdf4', color: '#15803d' },
  paused: { bg: '#fffbeb', color: '#d97706' },
  ended:  { bg: '#f8f4ec', color: '#6b6e87' },
}

const CHANNEL_PILL: Record<string, { bg: string; color: string; border: string }> = {
  amazon:  { bg: '#fffbf0', color: '#b45309', border: '#fde68a' },
  ebay:    { bg: '#fff3f3', color: '#c0392b', border: '#fecaca' },
  shopify: { bg: '#f0fdf4', color: '#15803d', border: '#a7f3d0' },
  google:  { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  meta:    { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
}

function fmtGBP(n: number) {
  return `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const EMPTY_FORM = {
  channel: 'amazon', campaign_name: '', campaign_id: '',
  status: 'active', budget_daily: '', target_acos: 30,
  spend: 0, impressions: 0, clicks: 0, ad_orders: 0, revenue: 0,
  period_start: new Date().toISOString().slice(0, 10),
  period_end: new Date().toISOString().slice(0, 10),
}

export default function AdvertisingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [summary, setSummary]     = useState<Summary | null>(null)
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState<'create' | 'edit' | null>(null)
  const [form, setForm]           = useState<any>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login'); else load()
    })
  }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/advertising')
    const json = await res.json()
    setCampaigns(json.campaigns || [])
    setSummary(json.summary || null)
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function save() {
    setSaving(true)
    try {
      const method = modal === 'create' ? 'POST' : 'PATCH'
      const res = await fetch('/api/advertising', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      showToast(modal === 'create' ? 'Campaign added' : 'Campaign updated')
      setModal(null); load()
    } catch (e: any) { showToast(e.message) }
    finally { setSaving(false) }
  }

  async function toggleStatus(c: Campaign) {
    const next = c.status === 'active' ? 'paused' : 'active'
    await fetch('/api/advertising', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, status: next }),
    })
    load()
  }

  async function del(id: string) {
    if (!confirm('Delete this campaign?')) return
    await fetch('/api/advertising', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const filtered = campaigns.filter(c => statusFilter === 'all' || c.status === statusFilter)

  const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #e8e8e5', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', outline: 'none', color: '#1a1b22' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f4ec', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <AppSidebar />

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#191919', color: 'white', padding: '12px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 300 }}>{toast}</div>}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1b22', marginBottom: 22 }}>{modal === 'create' ? 'Add campaign' : 'Edit campaign'}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { key: 'campaign_name', label: 'Campaign name *', full: true },
                { key: 'channel', label: 'Channel', type: 'select', options: ['amazon','ebay','google','meta','shopify'] },
                { key: 'status', label: 'Status', type: 'select', options: ['active','paused','ended'] },
                { key: 'campaign_id', label: 'Platform campaign ID' },
                { key: 'target_acos', label: 'Target ACOS %', type: 'number' },
                { key: 'budget_daily', label: 'Daily budget (£)', type: 'number' },
                { key: 'spend', label: 'Total spend (£)', type: 'number' },
                { key: 'revenue', label: 'Ad revenue (£)', type: 'number' },
                { key: 'ad_orders', label: 'Orders', type: 'number' },
                { key: 'clicks', label: 'Clicks', type: 'number' },
                { key: 'impressions', label: 'Impressions', type: 'number' },
                { key: 'period_start', label: 'Period start', type: 'date' },
                { key: 'period_end', label: 'Period end', type: 'date' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : undefined }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6e87', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{f.label}</div>
                  {f.type === 'select' ? (
                    <select value={form[f.key] || ''} onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} style={{ ...inputStyle, width: '100%' }}>
                      {(f.options || []).map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type || 'text'} value={form[f.key] ?? ''} step={f.type === 'number' ? '0.01' : undefined}
                      onChange={e => setForm((p: any) => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                      style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                  )}
                </div>
              ))}
            </div>

            {form.spend > 0 && form.revenue > 0 && (
              <div style={{ background: '#f8f4ec', borderRadius: 8, padding: '10px 14px', marginTop: 16, fontSize: 12, color: '#6b6e87' }}>
                Computed ACOS: <strong style={{ color: '#1a1b22' }}>{((form.spend / form.revenue) * 100).toFixed(1)}%</strong>
                &nbsp;·&nbsp; ROAS: <strong style={{ color: '#1a1b22' }}>{(form.revenue / form.spend).toFixed(2)}x</strong>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 22, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e8e8e5', background: 'white', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={save} disabled={!form.campaign_name || saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#e8863f', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !form.campaign_name || saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Save campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main style={{ marginLeft: 220, flex: 1, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', margin: 0, letterSpacing: '-0.02em' }}>Advertising & PPC</h1>
            <p style={{ fontSize: 13, color: '#6b6e87', margin: '4px 0 0' }}>Track spend, ACOS, and ROAS across all ad channels</p>
          </div>
          <button onClick={() => { setForm(EMPTY_FORM); setModal('create') }} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#e8863f', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add campaign
          </button>
        </div>

        {/* Summary KPIs */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total spend',    value: fmtGBP(summary.totalSpend) },
              { label: 'Ad revenue',     value: fmtGBP(summary.totalRevenue) },
              { label: 'Ad orders',      value: String(summary.totalOrders) },
              { label: 'Blended ACOS',   value: `${summary.blendedAcos.toFixed(1)}%`, alert: summary.blendedAcos > 30 },
              { label: 'Blended ROAS',   value: `${summary.blendedRoas.toFixed(2)}x` },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', border: `1px solid ${(s as any).alert ? '#fecaca' : '#e8e5df'}`, borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: (s as any).alert ? '#dc2626' : '#1a1b22', letterSpacing: '-0.02em' }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {['all', 'active', 'paused', 'ended'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '6px 12px', borderRadius: 8, border: '1px solid',
              borderColor: statusFilter === s ? '#e8863f' : '#e8e5df',
              background: statusFilter === s ? '#e8863f' : 'white',
              color: statusFilter === s ? 'white' : '#6b6e87',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: statusFilter === s ? 600 : 400,
            }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#9496b0', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#6b6e87', marginBottom: 12 }}>No campaigns yet — add your first to start tracking ad spend and ACOS.</div>
            <button onClick={() => { setForm(EMPTY_FORM); setModal('create') }} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#e8863f', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Add campaign</button>
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#faf9f7', borderBottom: '1px solid #e8e5df' }}>
                  {['Campaign', 'Channel', 'Status', 'Spend', 'Revenue', 'Orders', 'ACOS', 'ROAS', 'CTR', ''].map(col => (
                    <th key={col} style={{ padding: '10px 14px', textAlign: col === '' ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => {
                  const st = STATUS_STYLE[c.status] || STATUS_STYLE.ended
                  const pill = CHANNEL_PILL[c.channel.toLowerCase()] || { bg: '#f8f4ec', color: '#6b6e87', border: '#e8e5df' }
                  return (
                    <tr key={c.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f0ede8' : 'none', background: c.over_acos ? '#fffafa' : 'white' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#1a1b22', fontSize: 13 }}>{c.campaign_name}</div>
                        {c.over_acos && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>⚠ ACOS exceeds target</div>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: pill.bg, color: pill.color, border: `1px solid ${pill.border}`, borderRadius: 100, fontSize: 10, fontWeight: 600, padding: '2px 8px' }}>{c.channel}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: st.bg, color: st.color, borderRadius: 100, fontSize: 10, fontWeight: 600, padding: '2px 8px' }}>{c.status}</span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#1a1b22', fontWeight: 500 }}>{fmtGBP(c.spend)}</td>
                      <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 500 }}>{fmtGBP(c.revenue)}</td>
                      <td style={{ padding: '12px 14px', color: '#6b6e87' }}>{c.ad_orders}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontWeight: 700, color: c.over_acos ? '#dc2626' : '#059669' }}>
                          {c.acos !== null ? `${c.acos.toFixed(1)}%` : '—'}
                        </span>
                        {c.acos !== null && <span style={{ fontSize: 10, color: '#9496b0', display: 'block' }}>target {c.target_acos}%</span>}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1a1b22' }}>{c.roas > 0 ? `${c.roas.toFixed(2)}x` : '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#6b6e87' }}>{c.ctr > 0 ? `${c.ctr}%` : '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button onClick={() => toggleStatus(c)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e8e5df', background: 'white', fontSize: 11, cursor: 'pointer', color: '#6b6e87', marginRight: 6, fontFamily: 'inherit' }}>
                          {c.status === 'active' ? 'Pause' : 'Resume'}
                        </button>
                        <button onClick={() => { setForm({ ...c, id: c.id }); setModal('edit') }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e8e5df', background: 'white', fontSize: 11, cursor: 'pointer', color: '#6b6e87', marginRight: 6, fontFamily: 'inherit' }}>Edit</button>
                        <button onClick={() => del(c.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: 'white', fontSize: 11, cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>✕</button>
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
