'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '../lib/supabase-client'

const TAG = '[component:TrialBanner]'

const COBALT = '#e8863f'
const INK = '#0b0f1a'
const BORDER = '#e4dfd4'

type State =
  | { kind: 'hidden' }
  | { kind: 'trial_active'; daysLeft: number; endsOn: string }
  | { kind: 'trial_soon'; daysLeft: number; endsOn: string }
  | { kind: 'grace'; endedOn: string; graceDaysLeft: number }
  | { kind: 'no_payment' }

const PUBLIC_PATHS = ['/', '/login', '/signup', '/pricing', '/about', '/contact', '/privacy', '/terms']
const BLOCK_PREFIXES = ['/blog', '/landing', '/marketing-assets', '/brand-concepts', '/vs']

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function TrialBanner() {
  const pathname = usePathname() || ''
  const [state, setState] = useState<State>({ kind: 'hidden' })
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (PUBLIC_PATHS.includes(pathname)) return
    if (BLOCK_PREFIXES.some(p => pathname.startsWith(p))) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/org/list')
        if (!res.ok || cancelled) return
        const json = await res.json()
        const billing = json.billing as null | {
          subscription_status: string | null
          trial_ends_at: string | null
          stripe_customer_id: string | null
        }
        if (!billing || cancelled) return

        const status = (billing.subscription_status || 'trialing') as string
        const trialEnds = billing.trial_ends_at ? new Date(billing.trial_ends_at) : null
        const hasPayment = !!billing.stripe_customer_id

        // Active paid subscription: hide
        if (status === 'active') {
          if (!hasPayment) {
            setState({ kind: 'no_payment' })
          } else {
            setState({ kind: 'hidden' })
          }
          return
        }

        if (status === 'trialing' && trialEnds) {
          const msLeft = trialEnds.getTime() - Date.now()
          const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000))
          if (daysLeft > 0) {
            if (daysLeft <= 3) {
              setState({ kind: 'trial_soon', daysLeft, endsOn: fmtDate(trialEnds) })
            } else {
              setState({ kind: 'trial_active', daysLeft, endsOn: fmtDate(trialEnds) })
            }
            return
          }
          // Trial expired — 7-day grace
          const graceEnd = new Date(trialEnds.getTime() + 7 * 24 * 60 * 60 * 1000)
          const graceDaysLeft = Math.max(0, Math.ceil((graceEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
          if (graceDaysLeft > 0) {
            setState({ kind: 'grace', endedOn: fmtDate(trialEnds), graceDaysLeft })
            return
          }
        }

        setState({ kind: 'hidden' })
      } catch (err) {
        console.error(TAG, 'failed to load state', err)
      }
    })()

    return () => { cancelled = true }
  }, [mounted, pathname])

  if (state.kind === 'hidden') return null

  let text = ''
  let cta = 'Add card'
  let urgent = false

  if (state.kind === 'trial_active') {
    text = `Trial: ${state.daysLeft} day${state.daysLeft === 1 ? '' : 's'} left · Add card to keep your data after ${state.endsOn}`
  } else if (state.kind === 'trial_soon') {
    text = `Trial ends in ${state.daysLeft} day${state.daysLeft === 1 ? '' : 's'} (${state.endsOn}) · Add card now to avoid interruption`
    urgent = true
  } else if (state.kind === 'grace') {
    text = `Trial ended ${state.endedOn} · ${state.graceDaysLeft}-day read-only grace period`
    urgent = true
  } else if (state.kind === 'no_payment') {
    text = 'Add a backup card so billing never lapses'
  }

  const bg = urgent ? COBALT : '#fff8e6'
  const fg = urgent ? 'white' : INK
  const borderCol = urgent ? COBALT : '#e9d9a6'

  return (
    <div
      role="status"
      style={{
        width: '100%',
        background: bg,
        color: fg,
        borderBottom: `1px solid ${borderCol}`,
        fontFamily: 'var(--font-geist), -apple-system, sans-serif',
        fontSize: 13,
        padding: '9px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontWeight: 500 }}>{text}</span>
      <Link
        href="/billing"
        style={{
          background: urgent ? 'white' : COBALT,
          color: urgent ? COBALT : 'white',
          textDecoration: 'none',
          border: 'none',
          borderRadius: 7,
          padding: '5px 12px',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'inherit',
        }}
      >
        {cta}
      </Link>
    </div>
  )
}
