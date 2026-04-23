'use client'

// Banner shown on /billing to monthly subscribers who've paid at least one
// invoice. Offers a one-click switch to annual ("save 2 months / 20% off").
// Backend: POST /api/billing/switch-annual which is idempotent.

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase-client'

export function AnnualUpsell() {
  const [visible, setVisible]   = useState(false)
  const [plan, setPlan]         = useState<string>('')
  const [pending, setPending]   = useState(false)
  const [err, setErr]           = useState<string | null>(null)
  const [done, setDone]         = useState(false)
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/org/list')
      if (!res.ok) return
      const json = await res.json()
      const billing = json.billing as null | { plan: string | null; billing_interval: string | null }
      if (!billing) return
      const eligiblePlan = ['starter', 'growth', 'scale'].includes(billing.plan ?? '')
      if (!eligiblePlan) return
      if ((billing.billing_interval || 'month') !== 'month') return

      // Require ≥1 paid invoice before upselling, so we don't pester brand-new signups.
      // RLS scopes transactions to the active org.
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
      if ((count ?? 0) < 1) return

      setPlan(billing.plan ?? '')
      setVisible(true)
    })()
  }, [])

  async function switchNow() {
    setPending(true); setErr(null)
    try {
      const res = await fetch('/api/billing/switch-annual', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setErr(json.error || 'Switch failed'); return }
      setDone(true)
    } catch (e: any) {
      setErr(e?.message || 'Switch failed')
    } finally {
      setPending(false)
    }
  }

  if (!visible) return null

  return (
    <div style={{
      background: '#0b0f1a',
      color: '#f8f4ec',
      borderRadius: 12,
      padding: '18px 22px',
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      fontFamily: 'inherit',
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.02em', marginBottom: 4 }}>
          {done ? 'You’re on annual. Thanks.' : 'Switch to annual and save 2 months (20% off).'}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(243,240,234,0.7)' }}>
          {done
            ? 'Your next renewal will be yearly. Credit from unused monthly time is applied automatically.'
            : `Stay on ${plan.charAt(0).toUpperCase() + plan.slice(1)}, pay once a year, keep every feature.`}
        </div>
        {err && <div style={{ fontSize: 12, color: '#ff9f9f', marginTop: 6 }}>{err}</div>}
      </div>
      {!done && (
        <button
          onClick={switchNow}
          disabled={pending}
          style={{
            background: '#e8863f',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: pending ? 'wait' : 'pointer',
            opacity: pending ? 0.7 : 1,
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}
        >
          {pending ? 'Switching…' : 'Switch to annual'}
        </button>
      )}
    </div>
  )
}
