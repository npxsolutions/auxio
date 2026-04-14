'use client'

import { useEffect, useState } from 'react'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem('cookie_consent', 'declined')
    setVisible(false)
    // Opt out of PostHog if loaded
    try {
      const ph = (window as any).__ph_opt_out_capturing_called
      if (!ph) {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.opt_out_capturing()
        }).catch(() => {})
      }
    } catch {}
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        right: 24,
        maxWidth: 480,
        zIndex: 9999,
        background: '#0f172a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 6 }}>
          We use cookies
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>
          We use analytics cookies (PostHog) to understand how you use Fulcra and improve the product. No advertising cookies. No selling your data.{' '}
          <a href="/privacy" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'underline' }}>
            Privacy policy
          </a>
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={decline}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Decline
        </button>
        <button
          onClick={accept}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#5b52f5',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Accept all
        </button>
      </div>
    </div>
  )
}
