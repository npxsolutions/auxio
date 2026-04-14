'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../components/AppSidebar'
import { createClient } from '../lib/supabase-client'

interface MonthRow {
  month: string
  revenue: number; cogs: number; fees: number
  gross_profit: number; net_profit: number; margin: number
  orders: number; cogs_purchased: number
}

interface Totals {
  revenue: number; cogs: number; fees: number
  gross_profit: number; net_profit: number; margin: number; orders: number
}

interface WorkingCapital {
  openPoCommitments: number; last30Revenue: number; platformFee: number
}

function fmtGBP(n: number, dec = 0) {
  return `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`
}

function fmtMonth(m: string) {
  const [y, mo] = m.split('-')
  return new Date(Number(y), Number(mo) - 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

export default function FinancialsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [monthly, setMonthly]       = useState<MonthRow[]>([])
  const [totals, setTotals]         = useState<Totals | null>(null)
  const [wc, setWc]                 = useState<WorkingCapital | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [view, setView]             = useState<'pnl' | 'cashflow'>('pnl')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login'); else load()
    })
  }, [])

  async function load() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/financials')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setMonthly(json.monthly || [])
      setTotals(json.totals || null)
      setWc(json.workingCapital || null)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const maxRev = Math.max(...monthly.map(m => m.revenue), 1)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <AppSidebar />

      <main style={{ marginLeft: 220, flex: 1, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', margin: 0, letterSpacing: '-0.02em' }}>Financials</h1>
            <p style={{ fontSize: 13, color: '#6b6e87', margin: '4px 0 0' }}>12-month P&L, working capital position and cash flow</p>
          </div>
          <div style={{ display: 'flex', background: 'white', border: '1px solid #e8e5df', borderRadius: 10, padding: 3, gap: 2 }}>
            {[{ id: 'pnl', label: 'P&L Statement' }, { id: 'cashflow', label: 'Cash Flow' }].map(tab => (
              <button key={tab.id} onClick={() => setView(tab.id as any)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: view === tab.id ? '#5b52f5' : 'transparent',
                color: view === tab.id ? 'white' : '#6b6e87',
                fontSize: 12, fontWeight: view === tab.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
              }}>{tab.label}</button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#dc2626' }}>{error}</div>
        )}

        {/* Summary KPIs */}
        {totals && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Revenue (12m)',    value: fmtGBP(totals.revenue),      color: '#1a1b22' },
              { label: 'Gross profit',    value: fmtGBP(totals.gross_profit),  color: '#059669' },
              { label: 'Net profit',      value: fmtGBP(totals.net_profit),    color: totals.net_profit >= 0 ? '#059669' : '#dc2626' },
              { label: 'Net margin',      value: `${totals.margin.toFixed(1)}%`, color: totals.margin >= 15 ? '#059669' : totals.margin >= 5 ? '#d97706' : '#dc2626' },
              { label: 'Total orders',    value: String(totals.orders),        color: '#1a1b22' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Working capital */}
        {wc && (
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1b22', marginBottom: 14 }}>Working Capital</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ background: '#f5f3ef', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Open PO commitments</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#d97706' }}>{fmtGBP(wc.openPoCommitments)}</div>
                <div style={{ fontSize: 11, color: '#9496b0', marginTop: 2 }}>Stock yet to be received</div>
              </div>
              <div style={{ background: '#f5f3ef', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Last 30d revenue</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>{fmtGBP(wc.last30Revenue)}</div>
                <div style={{ fontSize: 11, color: '#9496b0', marginTop: 2 }}>Trailing cash generation</div>
              </div>
              <div style={{ background: '#f5f3ef', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Monthly platform fee</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1b22' }}>{fmtGBP(wc.platformFee, 2)}</div>
                <div style={{ fontSize: 11, color: '#9496b0', marginTop: 2 }}>Fulcra subscription</div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#9496b0', fontSize: 13 }}>Loading financial data…</div>
        ) : monthly.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#6b6e87' }}>No financial data yet — P&L populates from your transaction history.</div>
          </div>
        ) : view === 'pnl' ? (
          <>
            {/* Revenue bar chart */}
            <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22', marginBottom: 16 }}>Monthly Revenue & Profit</div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 100 }}>
                {monthly.map(m => (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, position: 'relative' }}>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'stretch', gap: 1 }}>
                      <div style={{ background: '#5b52f5', opacity: 0.7, height: Math.round((m.revenue / maxRev) * 80), borderRadius: '3px 3px 0 0', minHeight: 2 }} title={`Revenue: ${fmtGBP(m.revenue)}`} />
                      <div style={{ background: '#059669', height: Math.round((m.net_profit / maxRev) * 80), borderRadius: '3px 3px 0 0', minHeight: m.net_profit > 0 ? 2 : 0 }} title={`Profit: ${fmtGBP(m.net_profit)}`} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                {monthly.map(m => (
                  <div key={m.month} style={{ flex: 1, fontSize: 9, color: '#9496b0', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtMonth(m.month).split(' ')[0]}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b6e87' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#5b52f5', opacity: 0.7 }}/>Revenue</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b6e87' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#059669' }}/>Net profit</div>
              </div>
            </div>

            {/* P&L table */}
            <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#faf9f7', borderBottom: '1px solid #e8e5df' }}>
                    {['Month', 'Revenue', 'COGS', 'Gross profit', 'Fees', 'Net profit', 'Margin', 'Orders'].map(col => (
                      <th key={col} style={{ padding: '10px 14px', textAlign: col === 'Month' ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...monthly].reverse().map((m, idx) => (
                    <tr key={m.month} style={{ borderBottom: idx < monthly.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: '#1a1b22' }}>{fmtMonth(m.month)}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', color: '#1a1b22' }}>{fmtGBP(m.revenue)}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', color: '#dc2626' }}>−{fmtGBP(m.cogs)}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 600, color: '#1a1b22' }}>{fmtGBP(m.gross_profit)}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', color: '#d97706' }}>−{fmtGBP(m.fees)}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: m.net_profit >= 0 ? '#059669' : '#dc2626' }}>{fmtGBP(m.net_profit)}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                        <span style={{ background: m.margin >= 20 ? '#ecfdf5' : m.margin >= 10 ? '#fffbeb' : '#fef2f2', color: m.margin >= 20 ? '#059669' : m.margin >= 10 ? '#d97706' : '#dc2626', borderRadius: 100, fontSize: 10, fontWeight: 700, padding: '2px 7px' }}>
                          {m.margin.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', color: '#6b6e87' }}>{m.orders}</td>
                    </tr>
                  ))}
                  {totals && (
                    <tr style={{ background: '#faf9f7', borderTop: '2px solid #e8e5df' }}>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: '#1a1b22', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>12m Total</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: '#1a1b22' }}>{fmtGBP(totals.revenue)}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>−{fmtGBP(totals.cogs)}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: '#1a1b22' }}>{fmtGBP(totals.gross_profit)}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>−{fmtGBP(totals.fees)}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: totals.net_profit >= 0 ? '#059669' : '#dc2626' }}>{fmtGBP(totals.net_profit)}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                        <span style={{ background: '#ecfdf5', color: '#059669', borderRadius: 100, fontSize: 10, fontWeight: 700, padding: '2px 7px' }}>{totals.margin.toFixed(1)}%</span>
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: '#1a1b22' }}>{totals.orders}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Cash flow view */
          <div style={{ background: 'white', border: '1px solid #e8e5df', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#faf9f7', borderBottom: '1px solid #e8e5df' }}>
                  {['Month', 'Cash in (revenue)', 'Stock purchased (POs)', 'Net cash flow', 'Cumulative'].map(col => (
                    <th key={col} style={{ padding: '10px 14px', textAlign: col === 'Month' ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let cumulative = 0
                  return [...monthly].reverse().map((m, idx) => {
                    const net = m.revenue - m.cogs_purchased
                    cumulative += net
                    return (
                      <tr key={m.month} style={{ borderBottom: idx < monthly.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                        <td style={{ padding: '11px 14px', fontWeight: 600, color: '#1a1b22' }}>{fmtMonth(m.month)}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', color: '#059669', fontWeight: 500 }}>{fmtGBP(m.revenue)}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', color: '#d97706' }}>{m.cogs_purchased > 0 ? `−${fmtGBP(m.cogs_purchased)}` : '—'}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: net >= 0 ? '#059669' : '#dc2626' }}>{net >= 0 ? '+' : ''}{fmtGBP(net)}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: cumulative >= 0 ? '#1a1b22' : '#dc2626' }}>{fmtGBP(cumulative)}</td>
                      </tr>
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
