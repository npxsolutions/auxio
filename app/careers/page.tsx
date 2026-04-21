// [careers] — hiring page. Matches v8 editorial craft.
import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'
import { ROLES } from './roles'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display-v8',
})

const C = {
  bg:      '#f8f4ec',
  ink:     '#0b0f1a',
  mutedDk: '#2c3142',
  muted:   '#5a6171',
  rule:    'rgba(11,15,26,0.10)',
  cobalt:  '#e8863f',
  surface: '#ffffff',
}

export const metadata = {
  title: 'Careers — Palvento',
  description: 'Build the operating system for global commerce. Open roles at Palvento.',
}

export default function CareersPage() {
  return (
    <main className={display.variable} style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: 'var(--font-geist), -apple-system, sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      <header style={{ padding: '24px 32px', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.ink }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.ink} />
            </svg>
            <span style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 22, letterSpacing: '-0.015em' }}>Palvento</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: C.mutedDk, textDecoration: 'none' }}>← Home</Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '96px 32px 48px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <span style={{ width: 24, height: 1, background: C.cobalt }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, letterSpacing: '0.02em', color: C.cobalt, fontWeight: 500 }}>Careers — 3 roles open</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 'clamp(48px, 8vw, 108px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 0.98, margin: 0 }}>
            Build the operating system for <em style={{ fontStyle: 'italic', color: C.cobalt }}>global commerce.</em>
          </h1>
          <p style={{ marginTop: 28, fontSize: 20, lineHeight: 1.5, color: C.mutedDk, fontFamily: 'var(--font-display-v8), Georgia, serif', fontStyle: 'italic', maxWidth: 700 }}>
            Palvento unifies inventory, orders, forecasting, and margin across every channel a modern commerce operator runs. We're small, remote, and early. If you want equity in the outcome and autonomy over your area, keep reading.
          </p>
        </div>
      </section>

      {/* Why join */}
      <section style={{ padding: '48px 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>Why join</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { t: 'Founding equity', d: 'Real ownership in a company whose TAM is the entire SMB commerce stack. We default to more equity, less cash.' },
              { t: 'Own your area', d: 'You will not manage, be managed, or be micromanaged. You own an outcome and ship against it.' },
              { t: 'Global-first remote', d: 'No office, no commute, no timezone politics. Async writing, deep-work defaults, quarterly offsites.' },
            ].map(card => (
              <div key={card.t} style={{ padding: 28, background: C.surface, border: `1px solid ${C.rule}` }}>
                <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{card.t}</div>
                <div style={{ marginTop: 10, fontSize: 14, color: C.mutedDk, lineHeight: 1.55 }}>{card.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '48px 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>Values</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 14, fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 26, letterSpacing: '-0.015em', lineHeight: 1.2 }}>
            <li>Ship the real thing. No demo-ware.</li>
            <li>Write it down. Decisions live in documents.</li>
            <li>Taste is a form of rigour.</li>
            <li>Honest numbers, on a shared dashboard.</li>
            <li>Act like an owner, because you are one.</li>
          </ul>
        </div>
      </section>

      {/* Open roles */}
      <section style={{ padding: '48px 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>Open roles</div>
          <div style={{ borderTop: `1px solid ${C.rule}` }}>
            {ROLES.map(r => (
              <Link key={r.slug} href={`/careers/${r.slug}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center', padding: '24px 0', borderBottom: `1px solid ${C.rule}`, textDecoration: 'none', color: C.ink }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 30, letterSpacing: '-0.02em' }}>{r.title}</div>
                  <div style={{ marginTop: 6, fontSize: 14, color: C.mutedDk }}>{r.summary}</div>
                  <div style={{ marginTop: 8, fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{r.team} · {r.location}</div>
                </div>
                <div style={{ fontSize: 13, color: C.cobalt, fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.04em' }}>Read →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Open application */}
      <section style={{ padding: '48px 32px 96px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 32, background: C.surface, border: `1px solid ${C.rule}` }}>
          <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 32, letterSpacing: '-0.02em' }}>Don&apos;t see your fit?</div>
          <p style={{ marginTop: 10, fontSize: 15, color: C.mutedDk, lineHeight: 1.55, maxWidth: 640 }}>
            If you think you&apos;d be a missing piece, tell us. Send a short note about what you&apos;ve built and what you want to build next.
          </p>
          <a href="mailto:careers@palvento-placeholder.com" style={{ display: 'inline-block', marginTop: 16, fontFamily: 'var(--font-mono), monospace', fontSize: 13, color: C.cobalt, textDecoration: 'none', letterSpacing: '0.04em' }}>careers@palvento-placeholder.com →</a>
        </div>
      </section>
    </main>
  )
}
