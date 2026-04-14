'use client'

// Developers · Reference — stub. The real OpenAPI spec ships with v1.5.

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'

const display = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], display: 'swap' })

const C = {
  bg: '#f3f0ea', surface: '#ffffff', raised: '#ebe6dc',
  ink: '#0b0f1a', inkSoft: '#1c2233',
  rule: 'rgba(11,15,26,0.10)', ruleSoft: 'rgba(11,15,26,0.06)',
  muted: '#5a6171', cobalt: '#1d5fdb',
}

export default function ReferencePage() {
  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(243,240,234,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: 16, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>Meridia</Link>
        <Link href="/developers" style={{ fontSize: 14, color: C.inkSoft, textDecoration: 'none' }}>Developers</Link>
      </nav>

      <header style={{ maxWidth: 880, margin: '0 auto', padding: '120px 32px 48px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>API reference</div>
        <h1 className={display.className} style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 400, margin: '20px 0 0' }}>
          OpenAPI spec <em style={{ fontStyle: 'italic', color: C.cobalt }}>coming soon</em>.
        </h1>
        <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.6, marginTop: 16, maxWidth: 580 }}>
          The full OpenAPI 3.1 spec — with request/response schemas, examples, and a Try-It console — ships with v1.5 next quarter.
        </p>
      </header>

      <section style={{ maxWidth: 880, margin: '0 auto', padding: '0 32px 120px' }}>
        <div style={{ background: C.surface, border: `1px solid ${C.ruleSoft}`, borderRadius: 14, padding: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.cobalt }}>While you wait</div>
          <p style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.65, marginTop: 12 }}>
            Hit <code style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", background: C.raised, padding: '2px 8px', borderRadius: 6, fontSize: 13 }}>GET /api/v1</code> for a live index of every current endpoint, with descriptions, scopes, and rate limits.
          </p>
          <pre style={{ marginTop: 16, background: C.ink, color: '#e4e9f2', padding: '16px 20px', fontSize: 13, lineHeight: 1.6, fontFamily: "'Geist Mono', ui-monospace, monospace", borderRadius: 10, overflowX: 'auto' }}>{`curl https://api.auxio.io/v1 \\
  -H "Accept: application/json"`}</pre>
        </div>

        <div style={{ marginTop: 24, padding: 24, border: `1px dashed ${C.rule}`, borderRadius: 14, fontSize: 13, color: C.muted, lineHeight: 1.65 }}>
          Want early access to the spec, the Postman collection, or a typed SDK? Email <a href="mailto:developers@auxio.io" style={{ color: C.cobalt }}>developers@auxio.io</a>.
        </div>

        <div style={{ marginTop: 32 }}>
          <Link href="/developers" style={{ fontSize: 14, color: C.cobalt, textDecoration: 'none' }}>← Back to developer overview</Link>
        </div>
      </section>
    </div>
  )
}
