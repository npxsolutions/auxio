'use client'

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'
import { useState } from 'react'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const C = {
  bg:        '#f3f0ea',
  surface:   '#ffffff',
  raised:    '#ebe6dc',
  ink:       '#0b0f1a',
  inkSoft:   '#1c2233',
  rule:      'rgba(11,15,26,0.10)',
  ruleSoft:  'rgba(11,15,26,0.06)',
  muted:     '#5a6171',
  cobalt:    '#1d5fdb',
}

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Partners',     href: '/partners' },
  { label: 'Developers',   href: '/developers' },
]

const CAL_URL = process.env.NEXT_PUBLIC_CAL_URL || 'https://cal.com/palvento/intro'
const CAL_ENABLED = process.env.NEXT_PUBLIC_CAL_ENABLED !== 'false'

const GMV_OPTIONS = [
  'Under £10k / month',
  '£10k – £50k / month',
  '£50k – £250k / month',
  '£250k – £1M / month',
  'Over £1M / month',
]

const CHANNEL_OPTIONS = [
  'Shopify', 'eBay', 'Amazon', 'Etsy', 'TikTok Shop',
  'WooCommerce', 'BigCommerce', 'Walmart', 'OnBuy', 'Other',
]

export default function DemoPage() {
  const [form, setForm] = useState({
    name: '', email: '', company: '', role: '', monthly_gmv: '', notes: '',
  })
  const [channels, setChannels] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleChannel(c: string) {
    setChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      const utm: Record<string, string> = {}
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
          const v = params.get(k)
          if (v) utm[k] = v
        }
      }
      const res = await fetch('/api/demo/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, channels, utm: Object.keys(utm).length ? utm : undefined }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'request failed')
      }
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ fontFamily: "'Geist', 'Inter', system-ui, sans-serif", background: C.bg, color: C.ink, minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: `${C.bg}cc`, backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.ruleSoft}`, padding: '0 32px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '26px', height: '26px', background: C.ink, borderRadius: '6px' }} />
          <span style={{ fontWeight: 600, fontSize: '15px', color: C.ink, letterSpacing: '-0.01em' }}>Palvento</span>
        </Link>
        <div style={{ display: 'flex', gap: '28px' }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{ fontSize: '14px', color: C.inkSoft, textDecoration: 'none' }}>{n.label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/login" style={{ padding: '8px 14px', borderRadius: '999px', border: `1px solid ${C.rule}`, fontSize: '13px', color: C.ink, textDecoration: 'none' }}>Log in</Link>
          <Link href="/signup" style={{ padding: '8px 16px', borderRadius: '999px', background: C.ink, fontSize: '13px', color: C.bg, textDecoration: 'none', fontWeight: 500 }}>Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '72px 32px 24px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>Book a demo</div>
        <h1 className={display.className} style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 1.04, letterSpacing: '-0.02em', fontWeight: 400, margin: '14px 0 20px', maxWidth: 880 }}>
          Book a 20-minute working demo.
        </h1>
        <p style={{ fontSize: 18, color: C.muted, lineHeight: 1.6, maxWidth: 640, margin: 0 }}>
          We share a screen, connect one of your channels, and show you true profit on your own data. No slides, no qualification call first.
        </p>
      </section>

      {/* Grid: Cal + Form */}
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 32px 80px', display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>

        {CAL_ENABLED && (
          <div style={{ background: C.surface, border: `1px solid ${C.ruleSoft}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.ruleSoft}` }}>
              <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>Pick a slot</div>
              <div style={{ fontSize: 16, color: C.ink, marginTop: 4, fontWeight: 500 }}>Grab a time on the calendar</div>
            </div>
            <iframe
              src={CAL_URL}
              title="Book a demo with Palvento"
              style={{ width: '100%', height: 680, border: 0, display: 'block', background: C.surface }}
              loading="lazy"
            />
          </div>
        )}

        {/* Form fallback / alternative */}
        <div style={{ background: C.surface, border: `1px solid ${C.ruleSoft}`, borderRadius: 14, padding: 32 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>Or send context</div>
          <h2 className={display.className} style={{ fontSize: 28, fontWeight: 400, letterSpacing: '-0.01em', margin: '8px 0 8px' }}>Tell us a bit about your setup.</h2>
          <p style={{ fontSize: 14, color: C.muted, margin: '0 0 24px', lineHeight: 1.6 }}>Prefer async or don't see a slot that works. Fill this in and we'll reply within one business day.</p>

          {sent ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 18, color: C.ink, fontWeight: 500, marginBottom: 8 }}>Got it.</div>
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>We've emailed you a confirmation. Expect a reply with calendar options within one business day.</div>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Your name" required value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
                <Field label="Work email" type="email" required value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Company" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} />
                <Field label="Role" value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} placeholder="Founder / Ops lead / …" />
              </div>
              <div>
                <label style={labelStyle}>Monthly GMV</label>
                <select
                  value={form.monthly_gmv}
                  onChange={e => setForm(f => ({ ...f, monthly_gmv: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">Select a range</option>
                  {GMV_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Channels you sell on</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {CHANNEL_OPTIONS.map(c => {
                    const active = channels.includes(c)
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleChannel(c)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 999,
                          border: `1px solid ${active ? C.ink : C.rule}`,
                          background: active ? C.ink : 'transparent',
                          color: active ? C.bg : C.ink,
                          fontSize: 13,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="What are you trying to fix, measure, or ship."
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
              {error && (
                <div style={{ fontSize: 13, color: '#b42318', background: 'rgba(180,35,24,0.06)', border: '1px solid rgba(180,35,24,0.2)', padding: '10px 12px', borderRadius: 10 }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={sending}
                style={{
                  justifySelf: 'start',
                  padding: '12px 22px',
                  borderRadius: 999,
                  background: C.ink,
                  color: C.bg,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: sending ? 'wait' : 'pointer',
                  opacity: sending ? 0.7 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {sending ? 'Sending…' : 'Request demo'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: C.ink, color: C.bg, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'rgba(243,240,234,0.45)' }}>© {new Date().getFullYear()} Palvento. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['Pricing', '/pricing'], ['Partners', '/partners'], ['Help', '/help'], ['Contact', '/contact']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 13, color: 'rgba(243,240,234,0.45)', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`
        input::placeholder, textarea::placeholder { color: #94a3b8; }
        input:focus, textarea:focus, select:focus { border-color: ${C.cobalt} !important; box-shadow: 0 0 0 3px rgba(29,95,219,0.12); }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: C.inkSoft, marginBottom: 6, letterSpacing: '0.01em' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', fontSize: 14, color: C.ink, background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 10, outline: 'none', fontFamily: 'inherit' }

function Field(props: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label style={labelStyle}>{props.label}{props.required ? '' : ''}</label>
      <input
        type={props.type || 'text'}
        required={props.required}
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={inputStyle}
      />
    </div>
  )
}
