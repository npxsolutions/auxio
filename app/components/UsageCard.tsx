'use client'

// "This period" usage card shown on /billing. Turns red at >90% of included
// usage; shows projected overage charges for the month.

import { useEffect, useState } from 'react'

type UsageMetric = { used: number; included: number | null; overage: number; overage_cents: number }
type UsageResponse = {
  plan: string
  billing_interval: string
  period_start: string
  period_end: string
  orders: UsageMetric
  listings: UsageMetric
  projected_overage_cents: number
}

export function UsageCard() {
  const [data, setData] = useState<UsageResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/billing/usage')
        if (!res.ok) return
        const json = await res.json()
        setData(json)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading || !data) return null
  if (data.plan === 'free' || data.plan === 'enterprise') return null

  const row = (label: string, m: UsageMetric) => {
    const pct = m.included === null || m.included === 0 ? 0 : Math.min(100, Math.round((m.used / m.included) * 100))
    const hot = m.included !== null && pct > 90
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: '#0b0f1a' }}>
          <span style={{ fontWeight: 500 }}>{label}</span>
          <span style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', color: hot ? '#b4321f' : 'rgba(11,15,26,0.62)' }}>
            {m.used.toLocaleString()} {m.included === null ? '/ ∞' : `of ${m.included.toLocaleString()}`}
          </span>
        </div>
        {m.included !== null && (
          <div style={{ height: 6, background: 'rgba(11,15,26,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: hot ? '#b4321f' : '#1d5fdb', transition: 'width 200ms' }} />
          </div>
        )}
        {m.overage > 0 && (
          <div style={{ fontSize: 11, color: '#b4321f', marginTop: 4 }}>
            +{m.overage.toLocaleString()} over — ${(m.overage_cents / 100).toFixed(2)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e8e5df',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 20,
      fontFamily: 'inherit',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0b0f1a' }}>This period</div>
        <div style={{ fontSize: 12, color: 'rgba(11,15,26,0.62)', fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>
          resets {new Date(data.period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </div>
      </div>

      {row('Orders', data.orders)}
      {row('Listings', data.listings)}

      {data.projected_overage_cents > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e8e5df', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'rgba(11,15,26,0.62)' }}>Projected overage</span>
          <span style={{ fontWeight: 600, color: '#b4321f', fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>
            ${(data.projected_overage_cents / 100).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}
