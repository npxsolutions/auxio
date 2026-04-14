'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../lib/supabase-client'

const INDIGO = '#5b52f5'
const INDIGO_HOVER = '#4a42e5'
const DARK = '#0f1117'

const features = [
  'True profit tracking across every channel',
  'AI that reprices and acts for you',
  'One listing → published everywhere',
  'Real-time error detection and fixes',
]

export default function SignupPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)

  const [nameFocus, setNameFocus]         = useState(false)
  const [emailFocus, setEmailFocus]       = useState(false)
  const [passwordFocus, setPasswordFocus] = useState(false)
  const [btnHover, setBtnHover]           = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${focused ? INDIGO : '#e8e5df'}`,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    color: '#1a1b22',
    outline: 'none',
    boxSizing: 'border-box',
    background: 'white',
    boxShadow: focused ? '0 0 0 3px rgba(91,82,245,0.1)' : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  })

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f3ef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, sans-serif',
        padding: 24,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{
            width: 56,
            height: 56,
            background: 'rgba(91,82,245,0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: 24,
          }}>📧</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1b22', marginBottom: 10, letterSpacing: '-0.02em' }}>
            Check your email
          </h2>
          <p style={{ fontSize: 15, color: '#6b6e87', lineHeight: 1.6, marginBottom: 24 }}>
            We sent a confirmation link to{' '}
            <strong style={{ color: '#1a1b22' }}>{email}</strong>
          </p>
          <Link href="/login" style={{ fontSize: 14, color: INDIGO, textDecoration: 'none', fontWeight: 500 }}>
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, sans-serif',
      WebkitFontSmoothing: 'antialiased' as any,
    }}>

      {/* LEFT PANEL */}
      <div style={{
        width: '40%',
        background: DARK,
        padding: 48,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Subtle radial glow */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 30% 70%, rgba(91,82,245,0.12) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{
              width: 34,
              height: 34,
              background: 'linear-gradient(135deg, #5b52f5 0%, #7c75f8 100%)',
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}>A</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>Meridia</span>
          </div>

          {/* Headline */}
          <h2 style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.25,
            letterSpacing: '-0.03em',
            marginBottom: 32,
          }}>
            Your eCommerce<br />command centre
          </h2>

          {/* Feature bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48 }}>
            {features.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'rgba(91,82,245,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke={INDIGO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Founding member badge */}
          <div style={{
            background: 'rgba(91,82,245,0.12)',
            border: '1px solid rgba(91,82,245,0.25)',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 28,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: INDIGO, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Founding member offer
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
              Lock in our lowest price — forever — by joining during beta.
            </div>
          </div>

          {/* Testimonial */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 28,
          }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 14 }}>
              "I relisted my entire back catalogue in a weekend."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #5b52f5 0%, #7c75f8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 11,
                fontWeight: 700,
              }}>ST</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Sarah T.</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Clothing reseller · Growth plan</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        flex: 1,
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1b22', marginBottom: 6, letterSpacing: '-0.02em' }}>
            Start your free trial
          </h1>
          <p style={{ fontSize: 14, color: '#6b6e87', marginBottom: 32 }}>
            14 days free. No credit card required.
          </p>

          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1a1b22', marginBottom: 6 }}>
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Jane Smith"
                style={inputStyle(nameFocus)}
                onFocus={() => setNameFocus(true)}
                onBlur={() => setNameFocus(false)}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1a1b22', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={inputStyle(emailFocus)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1a1b22', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min 8 characters"
                style={inputStyle(passwordFocus)}
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
              />
            </div>

            {error && (
              <div style={{
                fontSize: 13,
                color: '#dc2626',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
              }}>
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
                background: btnHover && !loading ? INDIGO_HOVER : INDIGO,
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: 13,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                opacity: loading ? 0.7 : 1,
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#6b6e87', marginTop: 24 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: INDIGO, textDecoration: 'none', fontWeight: 500 }}>
              Sign in
            </Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9b9ea8', marginTop: 20, lineHeight: 1.5 }}>
            By creating an account you agree to our{' '}
            <Link href="/terms" style={{ color: '#9b9ea8', textDecoration: 'underline' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" style={{ color: '#9b9ea8', textDecoration: 'underline' }}>Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
