'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'
import { P, CARD, MONO, LABEL, HEADING, BTN_PRIMARY, SECTION_HEADER } from '../lib/design-system'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const MARKETPLACES = ['eBay', 'Google Shopping', 'Amazon (coming soon)', 'Etsy (coming soon)', 'TikTok Shop (coming soon)', 'Walmart (coming soon)', 'Other'] as const
const GMV_RANGES = ['< $10k', '$10k – $50k', '$50k – $100k', '$100k – $500k', '$500k+'] as const

type FormState = {
  name: string
  email: string
  shopifyUrl: string
  marketplaces: string[]
  gmvRange: string
}

export default function BetaPage() {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    shopifyUrl: '',
    marketplaces: [],
    gmvRange: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleMarketplace(mp: string) {
    setForm(prev => ({
      ...prev,
      marketplaces: prev.marketplaces.includes(mp)
        ? prev.marketplaces.filter(m => m !== mp)
        : [...prev.marketplaces, mp],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name || !form.email || !form.shopifyUrl || form.marketplaces.length === 0 || !form.gmvRange) {
      setError('Please fill in every field.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/beta/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: P.ink,
    background: P.bg,
    border: `1px solid ${P.rule}`,
    borderRadius: '2px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    ...LABEL,
    display: 'block',
    marginBottom: '6px',
  }

  if (submitted) {
    return (
      <div style={{ background: P.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <h1 className={display.className} style={{ ...HEADING, fontSize: '36px', letterSpacing: '-0.02em', lineHeight: 1.15, color: P.ink, margin: '0 0 20px' }}>
            Application received.
          </h1>
          <p style={{ fontSize: '15px', lineHeight: 1.65, color: P.muted, margin: '0 0 32px' }}>
            We will review your application and get back to you within 48 hours.
            Check your inbox for a confirmation email.
          </p>
          <Link href="/" style={{ ...BTN_PRIMARY, textDecoration: 'none', display: 'inline-block', padding: '10px 20px' }}>
            Back to palvento.com
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: P.bg, minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', maxWidth: 1080, margin: '0 auto' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2L18.66 18H1.34L10 2z" fill={P.ink} /></svg>
          <span style={{ fontSize: '14px', fontWeight: 600, color: P.ink, letterSpacing: '-0.01em' }}>Palvento</span>
        </Link>
        <Link href="/login" style={{ ...MONO, fontSize: '12px', color: P.muted, textDecoration: 'none', fontWeight: 500 }}>
          Sign in
        </Link>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 32px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start' }}>

        {/* Left: copy */}
        <div style={{ paddingTop: '24px' }}>
          <div style={{ ...SECTION_HEADER, marginBottom: '16px' }}>Beta program</div>
          <h1 className={display.className} style={{ ...HEADING, fontSize: '44px', letterSpacing: '-0.025em', lineHeight: 1.1, color: P.ink, margin: '0 0 20px' }}>
            Join the Palvento beta.
          </h1>
          <p style={{ fontSize: '16px', lineHeight: 1.65, color: P.mutedDk, margin: '0 0 40px', maxWidth: 460 }}>
            Free Scale plan for life. 10 spots. Help us build the feed management platform that replaces $2,500/mo incumbents.
          </p>

          {/* What you get */}
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ ...MONO, fontSize: '11px', fontWeight: 600, color: P.ink, textTransform: 'uppercase', letterSpacing: '0.10em', margin: '0 0 16px' }}>
              What you get
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                ['Free Scale plan ($799/mo value)', 'Locked in for life. No credit card, no catch.'],
                ['Direct Slack access', 'A shared channel with the founding team. Real-time.'],
                ['Your feedback shapes the roadmap', 'You tell us what to build next. We listen.'],
              ].map(([title, desc]) => (
                <li key={title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: P.emerald, flexShrink: 0, marginTop: '8px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: P.ink, lineHeight: 1.4 }}>{title}</div>
                    <div style={{ fontSize: '13px', color: P.muted, lineHeight: 1.5, marginTop: '2px' }}>{desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* What we need */}
          <div>
            <h2 style={{ ...MONO, fontSize: '11px', fontWeight: 600, color: P.ink, textTransform: 'uppercase', letterSpacing: '0.10em', margin: '0 0 16px' }}>
              What we need from you
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'You run a Shopify store selling on 2+ marketplaces',
                'You will connect at least one channel in the first week',
                'You will share honest feedback — good and bad',
              ].map(item => (
                <li key={item} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: P.cobalt, flexShrink: 0, marginTop: '8px' }} />
                  <div style={{ fontSize: '14px', color: P.inkSoft, lineHeight: 1.5 }}>{item}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: form */}
        <div style={{ ...CARD, padding: '36px 32px' }}>
          <h2 className={display.className} style={{ ...HEADING, fontSize: '24px', letterSpacing: '-0.02em', color: P.ink, margin: '0 0 28px' }}>
            Apply for early access
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name */}
            <div>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Jane Smith"
                style={inputStyle}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="jane@example.com"
                style={inputStyle}
              />
            </div>

            {/* Shopify store URL */}
            <div>
              <label style={labelStyle}>Shopify store URL</label>
              <input
                type="url"
                value={form.shopifyUrl}
                onChange={e => setForm(prev => ({ ...prev, shopifyUrl: e.target.value }))}
                placeholder="https://your-store.myshopify.com"
                style={inputStyle}
              />
            </div>

            {/* Marketplaces */}
            <div>
              <label style={labelStyle}>Which marketplaces do you sell on?</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {MARKETPLACES.map(mp => {
                  const active = form.marketplaces.includes(mp)
                  return (
                    <button
                      key={mp}
                      type="button"
                      onClick={() => toggleMarketplace(mp)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        fontWeight: 500,
                        borderRadius: '2px',
                        border: `1px solid ${active ? P.cobalt : P.rule}`,
                        background: active ? P.cobaltSft : 'transparent',
                        color: active ? P.cobalt : P.ink,
                        cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}
                    >
                      {mp}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* GMV Range */}
            <div>
              <label style={labelStyle}>Monthly GMV range</label>
              <select
                value={form.gmvRange}
                onChange={e => setForm(prev => ({ ...prev, gmvRange: e.target.value }))}
                style={{
                  ...inputStyle,
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235a6171' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '36px',
                }}
              >
                <option value="" disabled>Select a range</option>
                {GMV_RANGES.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: P.oxblood, margin: 0, lineHeight: 1.5 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...BTN_PRIMARY,
                padding: '12px 20px',
                fontSize: '14px',
                opacity: submitting ? 0.6 : 1,
                marginTop: '4px',
              }}
            >
              {submitting ? 'Submitting...' : 'Apply for beta'}
            </button>

            <p style={{ fontSize: '12px', color: P.muted, margin: 0, lineHeight: 1.6 }}>
              We review every application by hand. You will hear back within 48 hours.
            </p>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${P.rule}`, padding: '24px 32px', maxWidth: 1080, margin: '0 auto' }}>
        <p style={{ ...MONO, fontSize: '11px', color: P.muted, margin: 0 }}>
          &copy; 2026 NPX Solutions Ltd &middot;{' '}
          <Link href="/privacy" style={{ color: P.muted, textDecoration: 'none' }}>Privacy</Link>
          {' '}&middot;{' '}
          <Link href="/terms" style={{ color: P.muted, textDecoration: 'none' }}>Terms</Link>
        </p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          main {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            padding: 24px 20px 60px !important;
          }
        }
      `}</style>
    </div>
  )
}
