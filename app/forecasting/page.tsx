'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'
import { createClient } from '../lib/supabase-client'

interface Forecast {
  sku: string
  title: string
  unitsSold90d: number
  dailyRate: number
  weeklyRate: number
  monthlyRate: number
  stock: number
  daysStock: number | null
  reorderPoint: number
  reorderQty: number
  risk: 'critical' | 'low' | 'ok'
  suggestedPoQty: number
  avgRevPerUnit: number
}

interface Summary { total: number; critical: number; low: number; ok: number }

const RISK = {
  critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: '⚠ Critical',  dot: '#dc2626' },
  low:      { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: '↓ Low stock', dot: '#d97706' },
  ok:       { bg: '#f0fdf4', color: '#15803d', border: '#a7f3d0', label: '✓ OK',        dot: '#059669' },
}

function fmtGBP(n: number) {
  return `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ForecastingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [summary, setSummary]     = useState<Summary | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'low' | 'ok'>('all')
  const [search, setSearch]       = useState('')
  const [creatingPO, setCreatingPO] = useState<string | null>(null)
  const [toast, setToast]         = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else load()
    })
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/forecasting')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setForecasts(json.forecasts || [])
      setSummary(json.summary || null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function createQuickPO(forecast: Forecast) {
    setCreatingPO(forecast.sku)
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_date: new Date().toISOString().slice(0, 10),
          items: [{
            sku: forecast.sku,
            description: forecast.title,
            quantity_ordered: forecast.suggestedPoQty,
            unit_cost: forecast.avgRevPerUnit * 0.5,
          }],
        }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      showToast(`${json.po.po_number} created for ${forecast.sku}`)
    } catch (e: any) {
      showToast(`Failed: ${e.message}`)
    } finally {
      setCreatingPO(null)
    }
  }

  const filtered = forecasts
    .filter(f => riskFilter === 'all' || f.risk === riskFilter)
    .filter(f => !search || f.sku.toLowerCase().includes(search.toLowerCase()) || f.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <AppSidebar />

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#191919', color: 'white', padding: '12px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 300 }}>{toast}</div>
      )}

      <main style={{ marginLeft: 220, flex: 1, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', margin: 0, letterSpacing: '-0.02em' }}>Demand Forecasting</h1>
            <p style={{ fontSize: 13, color: '#6b6e87', margin: '4px 0 0' }}>
              AI-computed reorder recommendations from 90 days of sales velocity
            </p>
          </div>
          <button onClick={load} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e8e5df', background: 'white', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#6b6e87' }}>
            ↻ Refresh
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#dc2626' }}>
            {error}
          </div>
        )}

        {/* Summary cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'SKUs tracked',   value: summary.total,    color: '#1a1b22', bg: 'white' },
              { label: 'Critical — reorder now', value: summary.critical, color: '#dc2626', bg: '#fef2f2' },
              { label: 'Low — reorder soon',     value: summary.low,      color: '#d97706', bg: '#fffbeb' },
              { label: 'Well stocked',   value: summary.ok,       color: '#059669', bg: '#f0fdf4' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, border: '1px solid #e8e5df', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'critical', 'low', 'ok'] as const).map(r => (
              <button key={r} onClick={() => setRiskFilter(r)} style={{
                padding: '6px 12px', borderRadius: 8, border: '1px solid',
                borderColor: riskFilter === r ? '#5b52f5' : '#e8e5df',
                background: riskFilter === r ? '#5b52f5' : 'white',
                color: riskFilter === r ? 'white' : '#6b6e87',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: riskFilter === r ? 600 : 400,
              }}>
                {r === 'all' ? 'All' : RISK[r].label}
              </button>
            ))}
          </div>
          <input
            placeholder="Search SKU or title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #e8e5df', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', background: 'white', outline: 'none', marginLeft: 8 }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#9496b0', fontSize: 13 }}>Computing demand forecast…</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#6b6e87' }}>
              {forecasts.length === 0 ? 'No transaction history yet — forecasts appear once orders are synced.' : 'No SKUs match this filter.'}
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#faf9f7', borderBottom: '1px solid #e8e5df' }}>
                  {['SKU / Product', 'Risk', 'Stock', 'Days left', 'Daily rate', 'Weekly', 'Monthly', 'Reorder qty', ''].map(col => (
                    <th key={col} style={{ padding: '10px 14px', textAlign: col === '' ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, idx) => {
                  const r = RISK[f.risk]
                  return (
                    <tr key={f.sku} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f0ede8' : 'none', background: f.risk === 'critical' ? '#fffafa' : 'white' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#1a1b22', fontSize: 12 }}>{f.sku}</div>
                        <div style={{ fontSize: 11, color: '#9496b0', marginTop: 1, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}`, borderRadius: 100, fontSize: 10, fontWeight: 700, padding: '2px 8px', whiteSpace: 'nowrap' }}>{r.label}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: f.stock === 0 ? '#dc2626' : '#1a1b22' }}>{f.stock}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {f.daysStock === null
                          ? <span style={{ color: '#9496b0' }}>N/A</span>
                          : <span style={{ color: f.daysStock <= 7 ? '#dc2626' : f.daysStock <= 21 ? '#d97706' : '#059669', fontWeight: 600 }}>{f.daysStock}d</span>
                        }
                      </td>
                      <td style={{ padding: '12px 14px', color: '#6b6e87' }}>{f.dailyRate}</td>
                      <td style={{ padding: '12px 14px', color: '#6b6e87' }}>{f.weeklyRate}</td>
                      <td style={{ padding: '12px 14px', color: '#6b6e87' }}>{f.monthlyRate}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1a1b22' }}>{f.reorderQty}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        {f.risk !== 'ok' && (
                          <button
                            onClick={() => createQuickPO(f)}
                            disabled={creatingPO === f.sku}
                            style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#5b52f5', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: creatingPO === f.sku ? 0.6 : 1, whiteSpace: 'nowrap' }}
                          >
                            {creatingPO === f.sku ? '…' : '+ Quick PO'}
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

        <p style={{ fontSize: 11, color: '#9496b0', marginTop: 16 }}>
          Forecast based on last 90 days of transaction data. Daily rate = units sold ÷ active selling days. Reorder point = 14-day cover at current velocity.
        </p>
      </main>
    </div>
  )
}
