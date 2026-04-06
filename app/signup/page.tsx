'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../lib/supabase-client'

export default function SignupPage() {
  const router  = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)

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

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, -apple-system, sans-serif', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: '56px', height: '56px', background: '#e8f5f3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px' }}>📧</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#191919', marginBottom: '10px', letterSpacing: '-0.02em' }}>Check your email</h2>
          <p style={{ fontSize: '15px', color: '#787774', lineHeight: 1.6, marginBottom: '24px' }}>
            We sent a confirmation link to <strong style={{ color: '#191919' }}>{email}</strong>
          </p>
          <Link href="/login" style={{ fontSize: '14px', color: '#2383e2', textDecoration: 'none', fontWeight: 500 }}>
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', display: 'flex', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* LEFT PANEL — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '40px' }}>
            <div style={{ width: '28px', height: '28px', background: '#191919', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 700 }}>A</div>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#191919' }}>Auxio</span>
          </Link>

          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#191919', marginBottom: '6px', letterSpacing: '-0.02em' }}>Create your account</h1>
          <p style={{ fontSize: '14px', color: '#787774', marginBottom: '32px' }}>
            Start your 7-day free trial. No credit card required.
          </p>

          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '7px' }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{ width: '100%', background: 'white', border: '1px solid #e8e8e5', borderRadius: '8px', padding: '11px 14px', fontSize: '14px', fontFamily: 'inherit', color: '#191919', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '7px' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min 8 characters"
                style={{ width: '100%', background: 'white', border: '1px solid #e8e8e5', borderRadius: '8px', padding: '11px 14px', fontSize: '14px', fontFamily: 'inherit', color: '#191919', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {error && (
              <div style={{ background: '#fce8e6', border: '1px solid #f5c2bb', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#c9372c', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#191919', color: 'white', border: 'none', borderRadius: '8px', padding: '13px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating account...' : 'Create free account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#787774', marginTop: '24px' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#2383e2', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9b9b98', marginTop: '20px', lineHeight: 1.5 }}>
            By creating an account, you agree to our{' '}
            <Link href="/privacy" style={{ color: '#9b9b98', textDecoration: 'underline' }}>Terms & Privacy Policy</Link>
          </p>
        </div>
      </div>

      {/* RIGHT PANEL — social proof */}
      <div style={{ width: '440px', background: '#191919', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 48px', flexShrink: 0 }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: '16px' }}>
            "I relisted my entire back catalogue in a weekend."
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2383e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 700 }}>ST</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>Sarah T.</div>
              <div style={{ fontSize: '12px', color: '#555' }}>Clothing reseller · Growth plan</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
          {[
            { icon: '✓', text: '7-day free trial, no credit card needed' },
            { icon: '✓', text: 'Setup in under 2 minutes' },
            { icon: '✓', text: 'Shopify, eBay and Amazon from one place' },
            { icon: '✓', text: 'Cancel any time, listings stay live' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#888' }}>
              <span style={{ color: '#0f7b6c', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #222', paddingTop: '28px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Works with</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { icon: '🛍️', label: 'Shopify' },
              { icon: '🛒', label: 'eBay' },
              { icon: '📦', label: 'Amazon' },
            ].map(ch => (
              <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', background: '#222', border: '1px solid #333', borderRadius: '7px', fontSize: '12px', color: '#888', fontWeight: 500 }}>
                <span>{ch.icon}</span>{ch.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
