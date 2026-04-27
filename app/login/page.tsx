'use client'

/**
 * Palvento sign-in — pairs with /signup. Same layout, same auth method
 * stack (Google → magic link → password toggle).
 *
 * Magic link doubles as the "forgot password" path: clicking the link
 * signs the user in without a password, and they can rotate it from
 * /settings if they want.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../lib/supabase-client'

const C = {
  bg:        '#f8f4ec',
  surface:   '#ffffff',
  ink:       '#0b0f1a',
  mutedDk:   '#2c3142',
  muted:     '#5a6171',
  rule:      'rgba(11,15,26,0.10)',
  ruleStrong:'rgba(11,15,26,0.18)',
  cobalt:    '#e8863f',
  cobaltDk:  '#c46f2a',
  cobaltSft: 'rgba(232,134,63,0.18)',
}

const display = 'var(--font-display), Georgia, serif'
const sans    = 'var(--font-geist), -apple-system, system-ui, sans-serif'
const mono    = 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace'

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === '1'

type Mode = 'magic' | 'password'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<'magic' | null>(null)
  const [loading, setLoading] = useState<'google' | 'submit' | null>(null)
  const [emailFocus, setEmailFocus] = useState(false)
  const [passwordFocus, setPasswordFocus] = useState(false)
  const [btnHover, setBtnHover] = useState(false)

  async function handleGoogle() {
    setError(null)
    setLoading('google')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
    if (err) {
      setError(err.message)
      setLoading(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading('submit')
    const supabase = createClient()

    if (mode === 'magic') {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          shouldCreateUser: false,
        },
      })
      if (err) { setError(err.message); setLoading(null); return }
      setSuccess('magic')
      setLoading(null)
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError(err.message); setLoading(null); return }
      router.push('/dashboard')
      router.refresh()
    }
  }

  // ── Success state — magic link sent ─────────────────────────────────────
  if (success === 'magic') {
    return (
      <div style={{
        minHeight: '100vh',
        background: C.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: sans, padding: 24,
        backgroundImage: `radial-gradient(${C.cobaltSft} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}>
        <div style={{
          maxWidth: 460, width: '100%', textAlign: 'center',
          background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 16,
          padding: '48px 32px',
          boxShadow: '0 1px 2px rgba(11,15,26,0.04), 0 8px 24px rgba(11,15,26,0.06)',
        }}>
          <div style={{ width: 56, height: 56, margin: '0 auto 20px' }}>
            <Mark size={56} />
          </div>
          <h2 style={{ fontFamily: display, fontStyle: 'italic', fontSize: 36, fontWeight: 400, color: C.ink, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '0 0 14px' }}>
            Check your email.
          </h2>
          <p style={{ fontSize: 15, color: C.mutedDk, lineHeight: 1.6, margin: 0 }}>
            We sent a sign-in link to <strong style={{ color: C.ink }}>{email}</strong>.
          </p>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 24, lineHeight: 1.6 }}>
            Didn't get it? Check spam, or{' '}
            <button
              onClick={() => { setSuccess(null) }}
              style={{ background: 'none', border: 'none', padding: 0, color: C.cobalt, cursor: 'pointer', fontFamily: sans, fontSize: 13, textDecoration: 'underline' }}
            >
              try a different email
            </button>.
          </p>
          <Link href="/signup" style={{ display: 'inline-block', marginTop: 28, fontFamily: mono, fontSize: 12, color: C.muted, textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            ← Need an account? Sign up
          </Link>
        </div>
      </div>
    )
  }

  // ── Main sign-in ────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: sans, WebkitFontSmoothing: 'antialiased' as any,
      padding: '32px 16px',
      backgroundImage: `radial-gradient(${C.cobaltSft} 1px, transparent 1px)`,
      backgroundSize: '28px 28px',
      backgroundPosition: '14px 14px',
    }}>
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.ink, marginBottom: 40, marginTop: 24 }}>
        <Mark size={28} />
        <span style={{ fontFamily: display, fontSize: 24, letterSpacing: '-0.015em' }}>Palvento</span>
      </Link>

      <div style={{
        width: '100%', maxWidth: 440,
        background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 16,
        padding: '40px 32px',
        boxShadow: '0 1px 2px rgba(11,15,26,0.04), 0 8px 24px rgba(11,15,26,0.06)',
      }}>
        <h1 style={{
          fontFamily: display, fontStyle: 'italic',
          fontSize: 'clamp(30px, 3.4vw, 40px)', fontWeight: 400,
          color: C.ink, letterSpacing: '-0.025em', lineHeight: 1.05,
          margin: '0 0 8px', textAlign: 'center',
        }}>
          Welcome back.
        </h1>
        <p style={{ fontSize: 14, color: C.muted, textAlign: 'center', margin: '0 0 28px' }}>
          Sign in to your Palvento account
        </p>

        {GOOGLE_ENABLED && (
          <>
            <button
              onClick={handleGoogle}
              disabled={loading !== null}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '12px 14px',
                background: C.surface, color: C.ink,
                border: `1px solid ${C.ruleStrong}`, borderRadius: 10,
                fontSize: 14.5, fontWeight: 500, fontFamily: sans,
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading && loading !== 'google' ? 0.6 : 1,
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#fafaf6' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.surface }}
            >
              <GoogleGlyph />
              {loading === 'google' ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
              <div style={{ flex: 1, height: 1, background: C.rule }} />
              <span style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: 1, background: C.rule }} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: mode === 'password' ? 14 : 16 }}>
            <label htmlFor="email" style={{ display: 'block', fontFamily: mono, fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              placeholder="you@yourstore.com"
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              style={{
                width: '100%', padding: '12px 14px',
                border: `1px solid ${emailFocus ? C.cobalt : C.ruleStrong}`,
                borderRadius: 10, fontSize: 14, fontFamily: sans, color: C.ink,
                outline: 'none', boxSizing: 'border-box', background: C.surface,
                boxShadow: emailFocus ? `0 0 0 3px ${C.cobaltSft}` : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            />
          </div>

          {mode === 'password' && (
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="password" style={{ display: 'block', fontFamily: mono, fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: `1px solid ${passwordFocus ? C.cobalt : C.ruleStrong}`,
                  borderRadius: 10, fontSize: 14, fontFamily: sans, color: C.ink,
                  outline: 'none', boxSizing: 'border-box', background: C.surface,
                  boxShadow: passwordFocus ? `0 0 0 3px ${C.cobaltSft}` : 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
              />
            </div>
          )}

          {error && (
            <div role="alert" style={{ fontSize: 13, color: '#b32718', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading !== null}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              width: '100%',
              background: btnHover && !loading ? C.cobaltDk : C.ink,
              color: C.bg, border: 'none', borderRadius: 10,
              padding: '14px 16px', fontSize: 14.5, fontWeight: 500,
              letterSpacing: '0.01em', fontFamily: sans,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading && loading !== 'submit' ? 0.6 : 1,
              transition: 'background 0.15s',
            }}
          >
            {loading === 'submit'
              ? (mode === 'magic' ? 'Sending link…' : 'Signing in…')
              : (mode === 'magic' ? 'Send sign-in link' : 'Sign in')}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setMode((m) => (m === 'magic' ? 'password' : 'magic')); setError(null) }}
          style={{
            display: 'block', width: '100%', marginTop: 14,
            background: 'none', border: 'none', padding: 0,
            fontFamily: sans, fontSize: 12.5, color: C.muted,
            cursor: 'pointer', textAlign: 'center',
          }}
        >
          {mode === 'magic' ? 'Use a password instead' : 'Use a magic link instead'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: C.muted, marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.rule}` }}>
          New to Palvento?{' '}
          <Link href="/signup" style={{ color: C.cobalt, textDecoration: 'none', fontWeight: 500 }}>Start your free trial</Link>
        </p>
      </div>

      <p style={{ textAlign: 'center', fontSize: 11.5, color: C.muted, marginTop: 28, marginBottom: 24 }}>
        <Link href="/" style={{ color: C.muted, textDecoration: 'none' }}>← Back to home</Link>
      </p>
    </div>
  )
}

function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.ink} />
      <rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt} />
    </svg>
  )
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
