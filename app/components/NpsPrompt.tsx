'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '../lib/supabase-client'

const TAG = '[component:NpsPrompt]'

const CREAM = '#f8f4ec'
const INK = '#0b0f1a'
const COBALT = '#e8863f'
const BORDER = '#e4dfd4'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/pricing', '/about', '/contact', '/privacy', '/terms']
const BLOCK_PREFIXES = ['/blog', '/landing', '/marketing-assets', '/brand-concepts', '/vs', '/admin']

export function NpsPrompt() {
  const pathname = usePathname() || ''
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (PUBLIC_PATHS.includes(pathname)) return
    if (BLOCK_PREFIXES.some(p => pathname.startsWith(p))) return

    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return

        // eligibility: account older than 30 days
        const { data: row } = await supabase
          .from('users')
          .select('created_at')
          .eq('id', user.id)
          .single()
        if (!row?.created_at) return
        const createdAt = new Date(row.created_at).getTime()
        if (Date.now() - createdAt < 30 * 24 * 60 * 60 * 1000) return

        // localstorage dismiss (90 day cooldown)
        const dismissKey = `palvento-nps-dismissed-${user.id}`
        const dismissedAt = Number(localStorage.getItem(dismissKey) || '0')
        if (dismissedAt && Date.now() - dismissedAt < 90 * 24 * 60 * 60 * 1000) return

        // no response in last 90 days
        const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        const { data: recent } = await supabase
          .from('nps_responses')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', cutoff)
          .limit(1)
        if (recent && recent.length > 0) return

        if (cancelled) return
        setUserId(user.id)
        setOpen(true)
      } catch (err) {
        console.error(TAG, 'eligibility check failed', err)
      }
    })()

    return () => { cancelled = true }
  }, [mounted, pathname])

  function dismiss() {
    if (userId) {
      localStorage.setItem(`palvento-nps-dismissed-${userId}`, String(Date.now()))
    }
    setOpen(false)
  }

  async function submit() {
    if (score === null) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback/nps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, reason }),
      })
      if (!res.ok) throw new Error(`status ${res.status}`)
      if (userId) localStorage.setItem(`palvento-nps-dismissed-${userId}`, String(Date.now()))
      setSubmitted(true)
      setTimeout(() => setOpen(false), 1500)
    } catch (err) {
      console.error(TAG, 'submit failed', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted || !open) return null

  return (
    <div
      role="dialog"
      aria-label="NPS feedback"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 84, // clear of HelpWidget
        zIndex: 9996,
        width: 340,
        background: CREAM,
        color: INK,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        boxShadow: '0 20px 40px rgba(11,15,26,0.12), 0 2px 6px rgba(11,15,26,0.04)',
        padding: '18px 18px 16px',
        fontFamily: 'var(--font-geist), -apple-system, sans-serif',
        animation: 'nps-slide-up 0.22s ease',
      }}
    >
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          position: 'absolute', top: 10, right: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, color: INK, opacity: 0.55,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/>
        </svg>
      </button>

      {submitted ? (
        <div style={{ fontSize: 14, padding: '8px 0', color: INK }}>Thank you.</div>
      ) : score === null ? (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6a6558', marginBottom: 8 }}>
            One quick question
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.45, marginBottom: 14, fontWeight: 500 }}>
            How likely are you to recommend Palvento to a colleague?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: 4 }}>
            {Array.from({ length: 11 }).map((_, n) => (
              <button
                key={n}
                onClick={() => setScore(n)}
                aria-label={`Score ${n}`}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  border: `1px solid ${BORDER}`,
                  background: 'white',
                  color: INK,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.12s, color 0.12s, border-color 0.12s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = COBALT
                  e.currentTarget.style.color = 'white'
                  e.currentTarget.style.borderColor = COBALT
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.color = INK
                  e.currentTarget.style.borderColor = BORDER
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#6a6558', marginTop: 6 }}>
            <span>Not likely</span><span>Very likely</span>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6a6558', marginBottom: 8 }}>
            You picked {score}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.45, marginBottom: 10, fontWeight: 500 }}>
            What&apos;s the main reason?
          </div>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Optional — helps us improve"
            rows={3}
            style={{
              width: '100%',
              background: 'white',
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 13,
              color: INK,
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              onClick={dismiss}
              style={{
                background: 'transparent', border: `1px solid ${BORDER}`,
                borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 500,
                color: INK, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Skip
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              style={{
                background: COBALT, border: 'none',
                borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600,
                color: 'white', cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes nps-slide-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
