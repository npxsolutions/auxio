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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [emailFocus, setEmailFocus]     = useState(false)
  const [passwordFocus, setPasswordFocus] = useState(false)
  const [btnHover, setBtnHover] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const inputStyle = (focused: boolean, hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${hasError ? '#dc2626' : focused ? INDIGO : '#e8e5df'}`,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    color: '#1a1b22',
    outline: 'none',
    boxSizing: 'border-box',
    background: hasError ? '#fef2f2' : 'white',
    boxShadow: focused && !hasError ? '0 0 0 3px rgba(91,82,245,0.1)' : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif', WebkitFontSmoothing: 'antialiased' as any }}>

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
            <span style={{ fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>Palvento</span>
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
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: '#6b6e87', marginBottom: 32 }}>
            Sign in to your Palvento account
          </p>

          <form onSubmit={handleLogin}>
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
                style={inputStyle(emailFocus, false)}
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
                placeholder="••••••••"
                style={inputStyle(passwordFocus, false)}
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
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#6b6e87', marginTop: 24 }}>
            New to Palvento?{' '}
            <Link href="/signup" style={{ color: INDIGO, textDecoration: 'none', fontWeight: 500 }}>
              Start your free trial →
            </Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9b9ea8', marginTop: 32 }}>
            <Link href="/" style={{ color: '#9b9ea8', textDecoration: 'none' }}>
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
