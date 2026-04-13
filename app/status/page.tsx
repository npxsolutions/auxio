'use client'

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'

const display = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], display: 'swap' })

const C = {
  bg: '#f3f0ea', surface: '#ffffff', raised: '#ebe6dc',
  ink: '#0b0f1a', inkSoft: '#1c2233',
  rule: 'rgba(11,15,26,0.10)', ruleSoft: 'rgba(11,15,26,0.06)',
  muted: '#5a6171', cobalt: '#1d5fdb',
  emerald: '#0e7c5a', amber: '#a56a0b', oxblood: '#7d2a1a',
}

const NAV = [
  { label: 'Features', href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Status', href: '/status' },
  { label: 'Changelog', href: '/changelog' },
]

type SystemState = 'operational' | 'degraded' | 'outage'
const SYSTEMS: { name: string; state: SystemState; note?: string }[] = [
  { name: 'API (api.auxio.io)',         state: 'operational' },
  { name: 'Dashboard (app.auxio.io)',   state: 'operational' },
  { name: 'Marketing site (auxio.io)',  state: 'operational' },
  { name: 'Amazon SP-API integration',  state: 'operational' },
  { name: 'eBay integration',           state: 'operational' },
  { name: 'Shopify integration',        state: 'operational' },
  { name: 'Etsy integration',           state: 'operational' },
  { name: 'TikTok Shop integration',    state: 'operational' },
  { name: 'Walmart integration',        state: 'operational' },
  { name: 'OnBuy integration',          state: 'operational' },
  { name: 'Webhooks',                   state: 'operational' },
  { name: 'Background sync (crons)',    state: 'operational' },
  { name: 'Stripe billing',             state: 'operational' },
]

const STATE_COPY: Record<SystemState, { label: string; color: string; dot: string }> = {
  operational: { label: 'Operational',      color: C.emerald, dot: C.emerald },
  degraded:    { label: 'Degraded',         color: C.amber,   dot: C.amber },
  outage:      { label: 'Outage',           color: C.oxblood, dot: C.oxblood },
}

const INCIDENTS: { date: string; title: string; summary: string; status: 'resolved' | 'monitoring' }[] = [
  // Intentionally empty for stub.
]

export default function StatusPage() {
  const allOk = SYSTEMS.every(s => s.state === 'operational')

  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Nav />

      <header style={{ maxWidth: 960, margin: '0 auto', padding: '120px 32px 48px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>System status</div>
        <h1 className={display.className} style={{ fontSize: 'clamp(44px, 6vw, 72px)', lineHeight: 1.03, letterSpacing: '-0.02em', fontWeight: 400, margin: '20px 0 0' }}>
          {allOk ? (
            <>All systems <em style={{ fontStyle: 'italic', color: C.emerald }}>operational</em>.</>
          ) : (
            <>Some systems are <em style={{ fontStyle: 'italic', color: C.amber }}>degraded</em>.</>
          )}
        </h1>
        <p style={{ fontSize: 16, color: C.muted, marginTop: 16 }}>
          Last checked {new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}. Subscribe for incident notifications by email.
        </p>
        <div style={{ marginTop: 24 }}>
          <a href="mailto:status@auxio.io?subject=Subscribe%20to%20status%20updates" style={btnPrimary}>Subscribe to updates</a>
        </div>
      </header>

      <section style={section}>
        <h2 className={display.className} style={{ fontSize: 28, letterSpacing: '-0.01em', fontWeight: 400, margin: 0 }}>Systems</h2>
        <div style={{ marginTop: 20, border: `1px solid ${C.ruleSoft}`, borderRadius: 14, overflow: 'hidden', background: C.surface }}>
          {SYSTEMS.map((s, i) => {
            const copy = STATE_COPY[s.state]
            return (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: i === 0 ? 'none' : `1px solid ${C.ruleSoft}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: copy.dot, display: 'inline-block' }} />
                  <span style={{ fontSize: 15 }}>{s.name}</span>
                </div>
                <span style={{ fontSize: 13, color: copy.color, fontWeight: 500 }}>{copy.label}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section style={section}>
        <h2 className={display.className} style={{ fontSize: 28, letterSpacing: '-0.01em', fontWeight: 400, margin: 0 }}>Recent incidents</h2>
        {INCIDENTS.length === 0 ? (
          <div style={{ marginTop: 20, padding: 24, border: `1px dashed ${C.rule}`, borderRadius: 14, fontSize: 14, color: C.muted }}>
            No incidents reported in the last 90 days.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 20 }}>
            {INCIDENTS.map(i => (
              <li key={i.title} style={{ borderTop: `1px solid ${C.ruleSoft}`, padding: '20px 0' }}>
                <div style={{ fontSize: 12, color: C.muted }}>{i.date}</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>{i.title}</div>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 6 }}>{i.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ ...section, marginBottom: 120 }}>
        <p style={{ fontSize: 13, color: C.muted }}>
          Upstream outages (Amazon SP-API, eBay, Shopify, Stripe) are reported here when they impact Auxio&rsquo;s core functions. For provider-side issues, check each platform&rsquo;s own status page.
        </p>
      </section>

      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(243,240,234,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ fontSize: 16, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>Auxio</Link>
      <div style={{ display: 'flex', gap: 28 }}>
        {NAV.map(n => <Link key={n.href} href={n.href} style={{ fontSize: 14, color: C.inkSoft, textDecoration: 'none' }}>{n.label}</Link>)}
      </div>
      <Link href="/signup" style={{ ...btnPrimary, padding: '8px 16px', fontSize: 13 }}>Start free</Link>
    </nav>
  )
}

function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.rule}`, padding: '40px 32px', fontSize: 13, color: C.muted, display: 'flex', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap', gap: 16 }}>
      <div>© {new Date().getFullYear()} Auxio</div>
      <div style={{ display: 'flex', gap: 20 }}>
        <Link href="/privacy" style={{ color: C.muted, textDecoration: 'none' }}>Privacy</Link>
        <Link href="/terms" style={{ color: C.muted, textDecoration: 'none' }}>Terms</Link>
        <Link href="/status" style={{ color: C.muted, textDecoration: 'none' }}>Status</Link>
        <Link href="/changelog" style={{ color: C.muted, textDecoration: 'none' }}>Changelog</Link>
      </div>
    </footer>
  )
}

const section: React.CSSProperties = { maxWidth: 960, margin: '0 auto', padding: '40px 32px' }
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: C.ink, color: C.bg, fontSize: 14, fontWeight: 500, textDecoration: 'none' }
