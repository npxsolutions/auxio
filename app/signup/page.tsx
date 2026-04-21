'use client'

/**
 * Palvento signup — minimal email + password only. The rest of the data
 * capture (business, store, GMV, channels, attribution) lives in the
 * post-email-verify /onboarding wizard. Keeping the signup form to 2
 * fields is deliberate: every extra field on this page drops conversion
 * ~7% (see Stripe / Linear benchmarks). The ICP-qualification data we
 * need for sales triage and product gating is strictly better captured
 * after the user has committed to creating an account.
 *
 * Brand rules applied: cream (#f8f4ec) background, Instrument Serif
 * italic for display, Geist for UI, cobalt (#e8863f) accent, Palvento
 * chevron mark. Matches the homepage / vs-pages / pricing typography
 * unification pass (commit d6a2d48).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../lib/supabase-client'

const C = {
  bg:      '#f8f4ec',
  surface: '#ffffff',
  ink:     '#0b0f1a',
  mutedDk: '#2c3142',
  muted:   '#5a6171',
  rule:    'rgba(11,15,26,0.10)',
  cobalt:  '#e8863f',
  cobaltDk:'#c46f2a',
  cobaltSft: 'rgba(232,134,63,$1)',
  emerald: '#0e7c5a',
}

const display = 'var(--font-display), Georgia, serif'
const sans    = 'var(--font-geist), -apple-system, system-ui, sans-serif'
const mono    = 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace'

// Three honest product anchors. No repricing claim (killed from roadmap per
// Post 20). No customer testimonial (no paying customers as of 2026-04-21).
const PRODUCT_ANCHORS = [
  { title: 'Install in under ten minutes.', body: 'Shopify App Store OAuth, two-way sync from the first click. No sales call, no 30-day onboarding.' },
  { title: 'Feed errors caught at ingest.',  body: "Missing GTINs, oversized images, banned words, category gaps — before the marketplace suppresses the listing." },
  { title: 'Per-channel P&L in one screen.',  body: 'Line-item fee attribution reconciled into contribution margin per SKU per channel.' },
]

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailFocus, setEmailFocus] = useState(false)
  const [passwordFocus, setPasswordFocus] = useState(false)
  const [btnHover, setBtnHover] = useState(false)

  // Capture UTM params + referrer at signup and stash in localStorage for
  // the onboarding wizard to attach to the profile. localStorage survives
  // the email-verify round trip without needing a DB table.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const utm = {
      utm_source:   url.searchParams.get('utm_source'),
      utm_medium:   url.searchParams.get('utm_medium'),
      utm_campaign: url.searchParams.get('utm_campaign'),
      referrer:     document.referrer || null,
    }
    if (utm.utm_source || utm.utm_medium || utm.utm_campaign || utm.referrer) {
      try { localStorage.setItem('palvento_signup_attribution', JSON.stringify(utm)) } catch {}
    }
  }, [])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/welcome` },
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  const input = (focused: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '12px 14px',
    border: `1px solid ${focused ? C.cobalt : C.rule}`,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: sans,
    color: C.ink,
    outline: 'none',
    boxSizing: 'border-box',
    background: C.surface,
    boxShadow: focused ? `0 0 0 3px ${C.cobaltSft}` : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  })

  // ── Success state — email verification sent ───────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ width: 56, height: 56, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.ink}/>
              <rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt}/>
            </svg>
          </div>
          <h2 style={{ fontFamily: display, fontStyle: 'italic', fontSize: 40, fontWeight: 400, color: C.ink, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '0 0 16px' }}>
            Check your email.
          </h2>
          <p style={{ fontSize: 15, color: C.mutedDk, lineHeight: 1.6, marginBottom: 24 }}>
            We sent a confirmation link to <strong style={{ color: C.ink }}>{email}</strong>. Click it and we'll pick up with a quick onboarding.
          </p>
          <Link href="/login" style={{ fontFamily: mono, fontSize: 12, color: C.cobalt, textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  // ── Main signup layout — split: brand panel left, form right ──────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: sans, WebkitFontSmoothing: 'antialiased' as any, background: C.bg }}>

      {/* LEFT PANEL — brand + product anchors */}
      <div style={{ width: '42%', padding: 56, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0, borderRight: `1px solid ${C.rule}` }}>
        <div>
          {/* Wordmark */}
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.ink, marginBottom: 56 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.ink}/>
              <rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt}/>
            </svg>
            <span style={{ fontFamily: display, fontSize: 26, letterSpacing: '-0.015em' }}>Palvento</span>
          </Link>

          {/* Editorial headline */}
          <h1 style={{ fontFamily: display, fontStyle: 'italic', fontSize: 'clamp(40px, 4vw, 56px)', fontWeight: 400, color: C.ink, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '0 0 20px' }}>
            Every channel. <em style={{ color: C.cobalt, fontStyle: 'italic' }}>One clean feed.</em>
          </h1>
          <p style={{ fontSize: 16, color: C.mutedDk, lineHeight: 1.5, maxWidth: 420, marginBottom: 48 }}>
            Self-serve multichannel feed management for Shopify-led sellers. 14 days free, no card required.
          </p>

          {/* Product anchors — not testimonials */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {PRODUCT_ANCHORS.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 14 }}>
                <div style={{ flexShrink: 0, paddingTop: 3 }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: C.cobalt, letterSpacing: '0.1em', fontWeight: 600 }}>§ 0{i+1}</span>
                </div>
                <div>
                  <div style={{ fontFamily: display, fontStyle: 'italic', fontSize: 20, color: C.ink, letterSpacing: '-0.015em', lineHeight: 1.2, marginBottom: 4 }}>{a.title}</div>
                  <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.55 }}>{a.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Founding-partner strip */}
        <div style={{ borderTop: `1px solid ${C.rule}`, paddingTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: C.cobalt }} />
          <span style={{ fontFamily: mono, fontSize: 11, color: C.mutedDk, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            10 founding-partner spots · 40% off for life
          </span>
        </div>
      </div>

      {/* RIGHT PANEL — the actual form */}
      <div style={{ flex: 1, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <h2 style={{ fontFamily: display, fontStyle: 'italic', fontSize: 'clamp(32px, 3.2vw, 44px)', fontWeight: 400, color: C.ink, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '0 0 10px' }}>
            Start your free trial.
          </h2>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 32 }}>
            14 days free · No card required · Cancel any time.
          </p>

          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="email" style={{ display: 'block', fontFamily: mono, fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Work email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@yourstore.com"
                style={input(emailFocus)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label htmlFor="password" style={{ display: 'block', fontFamily: mono, fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
                placeholder="8+ characters"
                style={input(passwordFocus)}
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
              />
            </div>

            {error && (
              <div role="alert" style={{ fontSize: 13, color: '#b32718', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 18 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                width: '100%',
                background: btnHover && !loading ? C.cobaltDk : C.ink,
                color: C.bg,
                border: 'none',
                borderRadius: 8,
                padding: '14px 16px',
                fontSize: 14.5,
                fontWeight: 500,
                letterSpacing: '0.01em',
                cursor: loading ? 'wait' : 'pointer',
                fontFamily: sans,
                opacity: loading ? 0.7 : 1,
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: C.muted, marginTop: 24 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: C.cobalt, textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: 11.5, color: C.muted, marginTop: 20, lineHeight: 1.5, letterSpacing: '0.02em' }}>
            By creating an account you agree to our{' '}
            <Link href="/terms" style={{ color: C.muted, textDecoration: 'underline' }}>Terms</Link>{' '}and{' '}
            <Link href="/privacy" style={{ color: C.muted, textDecoration: 'underline' }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
