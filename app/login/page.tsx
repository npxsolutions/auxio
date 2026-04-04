'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../lib/supabase-client'

export default function LoginPage() {
  const router  = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

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

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, -apple-system, sans-serif', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', background: '#191919', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '15px', fontWeight: 700 }}>A</div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#191919' }}>Auxio</span>
          </Link>
          <p style={{ fontSize: '14px', color: '#787774', marginTop: '8px' }}>Sign in to your account</p>
        </div>

        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e8e5', padding: '32px' }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '7px' }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{ width: '100%', background: '#f7f7f5', border: '1px solid #e8e8e5', borderRadius: '8px', padding: '11px 14px', fontSize: '14px', fontFamily: 'inherit', color: '#191919', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '7px' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: '100%', background: '#f7f7f5', border: '1px solid #e8e8e5', borderRadius: '8px', padding: '11px 14px', fontSize: '14px', fontFamily: 'inherit', color: '#191919', outline: 'none', boxSizing: 'border-box' }}
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
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#787774', marginTop: '20px' }}>
            No account?{' '}
            <Link href="/signup" style={{ color: '#2383e2', textDecoration: 'none', fontWeight: 500 }}>Start free trial →</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9b9b98', marginTop: '20px' }}>
          <Link href="/" style={{ color: '#9b9b98', textDecoration: 'none' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
