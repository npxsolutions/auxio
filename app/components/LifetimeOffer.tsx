'use client'

// One-time lifetime offer shown on /billing to users with 6+ distinct monthly
// invoices (approximated by distinct month-keys on public.transactions).
// Opens a Stripe Checkout session at /api/billing/lifetime-checkout.

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase-client'

export function LifetimeOffer() {
  const [visible, setVisible] = useState(false)
  const [pending, setPending] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: row } = await supabase
        .from('users')
        .select('plan, billing_interval')
        .eq('id', user.id)
        .maybeSingle()
      if (!row) return
      if (row.billing_interval === 'lifetime' || row.plan === 'lifetime_scale') return

      // Count distinct YYYY-MM buckets on user's transactions — 6+ unlocks the offer.
      const { data: tx } = await supabase
        .from('transactions')
        .select('order_date')
        .eq('user_id', user.id)
        .limit(2000)

      const months = new Set<string>()
      for (const t of tx || []) {
        if (!t.order_date) continue
        months.add(String(t.order_date).slice(0, 7))
        if (months.size >= 6) break
      }
      if (months.size >= 6) setVisible(true)
    })()
  }, [])

  async function buy() {
    setPending(true); setErr(null)
    try {
      const res = await fetch('/api/billing/lifetime-checkout', { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.url) { setErr(json.error || 'Failed to start checkout'); return }
      window.location.href = json.url
    } catch (e: any) {
      setErr(e?.message || 'Failed to start checkout')
    } finally {
      setPending(false)
    }
  }

  if (!visible) return null

  return (
    <div style={{
      background: '#f3f0ea',
      border: '1px solid rgba(11,15,26,0.14)',
      borderLeft: '3px solid #1d5fdb',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      fontFamily: 'inherit',
    }}>
      <div>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, letterSpacing: '-0.02em', color: '#0b0f1a', marginBottom: 4 }}>
          Lock in lifetime access — $3,999 one-time.
        </div>
        <div style={{ fontSize: 13, color: 'rgba(11,15,26,0.62)', lineHeight: 1.5 }}>
          You’ve been with us six months. Pay once, use Palvento at the Scale tier forever, no renewals.
        </div>
        {err && <div style={{ fontSize: 12, color: '#b4321f', marginTop: 6 }}>{err}</div>}
      </div>
      <button
        onClick={buy}
        disabled={pending}
        style={{
          background: '#0b0f1a',
          color: '#f3f0ea',
          border: 'none',
          borderRadius: 8,
          padding: '12px 20px',
          fontSize: 13,
          fontWeight: 600,
          cursor: pending ? 'wait' : 'pointer',
          opacity: pending ? 0.7 : 1,
          whiteSpace: 'nowrap',
          fontFamily: 'inherit',
        }}
      >
        {pending ? 'Opening…' : 'Get lifetime access →'}
      </button>
    </div>
  )
}
