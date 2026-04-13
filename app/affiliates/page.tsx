'use client'

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'

const display = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], display: 'swap' })

const C = {
  bg: '#f3f0ea', surface: '#ffffff', raised: '#ebe6dc',
  ink: '#0b0f1a', inkSoft: '#1c2233',
  rule: 'rgba(11,15,26,0.10)', ruleSoft: 'rgba(11,15,26,0.06)',
  muted: '#5a6171', cobalt: '#1d5fdb',
}

const NAV = [
  { label: 'Features', href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Affiliates', href: '/affiliates' },
  { label: 'Developers', href: '/developers' },
]

const STEPS = [
  { n: '01', t: 'Apply', d: 'Takes two minutes. We review inside 72 hours.' },
  { n: '02', t: 'Share', d: 'Unique tracking link + ready-made creative assets.' },
  { n: '03', t: 'Earn',  d: '30% recurring for 12 months on every paid account.' },
]

const ASSETS = [
  'Logo pack (SVG, PNG, dark + light)',
  'Social post templates (Twitter, LinkedIn, YouTube thumbnails)',
  'Demo videos (60s product tour, 3m walkthrough, integration teasers)',
  'Copy library — vetted hooks, headlines, and comparison frames',
  'Email swipe file — warm intros, reactivations, and newsletter drops',
]

const FAQ = [
  { q: 'What counts as a valid referral?', a: 'Any paid account that stays active past day 14 of trial. Self-referrals and sock-puppet signups are disqualified — we check.' },
  { q: 'How long is the cookie window?',   a: '60 days, last-click attribution.' },
  { q: 'Can I run paid ads on the Auxio brand?', a: 'No brand bidding on Google/Bing. Everything else — newsletters, YouTube pre-roll, programmatic, organic social — is fair game.' },
  { q: 'When do I get paid?',              a: 'Monthly, on the 15th, via Stripe or wire. Minimum £50 payout; balances roll forward.' },
  { q: 'Is there a cap?',                  a: 'No cap on referrals. Our biggest affiliate last quarter billed five figures in commission.' },
]

export default function AffiliatesPage() {
  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Nav />

      <header style={{ maxWidth: 1040, margin: '0 auto', padding: '120px 32px 64px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>Affiliate program</div>
        <h1 className={display.className} style={{ fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 1.02, letterSpacing: '-0.02em', fontWeight: 400, margin: '20px 0 0' }}>
          Earn <em style={{ fontStyle: 'italic', color: C.cobalt }}>30% recurring</em> for a year.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: C.muted, maxWidth: 620, marginTop: 24 }}>
          No caps. No ticking-clock cookies. No broken dashboards. Auxio&rsquo;s affiliate program pays cleanly and monthly, because we&rsquo;d rather have you recommending us for years than chasing payouts for months.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <a href="mailto:affiliates@auxio.io?subject=Affiliate%20application" style={btnPrimary}>Apply to the program</a>
          <Link href="#faq" style={btnGhost}>Read the FAQ</Link>
        </div>
        <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          {[['30%', 'Recurring commission'], ['12 mo', 'Commission window'], ['60 days', 'Cookie window'], ['Monthly', 'Payouts']].map(([big, small]) => (
            <div key={small}>
              <div className={display.className} style={{ fontSize: 44, letterSpacing: '-0.02em' }}>{big}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{small}</div>
            </div>
          ))}
        </div>
      </header>

      <section style={section}>
        <SectionHead kicker="How it works" title="Three steps, no ceremony." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginTop: 40 }}>
          {STEPS.map(s => (
            <div key={s.n} style={card}>
              <div style={{ fontSize: 12, letterSpacing: '0.1em', color: C.cobalt }}>{s.n}</div>
              <div className={display.className} style={{ fontSize: 28, marginTop: 10 }}>{s.t}</div>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.55, marginTop: 10 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={section}>
        <SectionHead kicker="Assets" title="What you get, day one." />
        <ul style={{ listStyle: 'none', padding: 0, margin: '32px 0 0', borderTop: `1px solid ${C.ruleSoft}` }}>
          {ASSETS.map(a => (
            <li key={a} style={{ borderBottom: `1px solid ${C.ruleSoft}`, padding: '16px 0', display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <span style={{ color: C.cobalt, fontSize: 14 }}>→</span>
              <span style={{ fontSize: 15, color: C.inkSoft }}>{a}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="faq" style={section}>
        <SectionHead kicker="FAQ" title="The fine print, plainly." />
        <div style={{ marginTop: 32, borderTop: `1px solid ${C.ruleSoft}` }}>
          {FAQ.map(f => (
            <details key={f.q} style={{ borderBottom: `1px solid ${C.ruleSoft}`, padding: '20px 0' }}>
              <summary style={{ cursor: 'pointer', fontSize: 16, fontWeight: 500, listStyle: 'none' }}>{f.q}</summary>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 10 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section style={{ ...section, marginBottom: 120 }}>
        <div style={{ background: C.ink, color: C.bg, borderRadius: 18, padding: '56px 48px' }}>
          <div className={display.className} style={{ fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.02em' }}>Pitch it once. Earn for a year.</div>
          <p style={{ fontSize: 16, color: 'rgba(243,240,234,0.7)', maxWidth: 520, marginTop: 16 }}>Apply below — we review every applicant personally.</p>
          <div style={{ marginTop: 24 }}>
            <a href="mailto:affiliates@auxio.io?subject=Affiliate%20application" style={{ ...btnPrimary, background: C.bg, color: C.ink }}>Apply now</a>
          </div>
        </div>
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

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>{kicker}</div>
      <h2 className={display.className} style={{ fontSize: 'clamp(34px, 4vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 400, margin: '12px 0 0' }}>{title}</h2>
    </>
  )
}

const section: React.CSSProperties = { maxWidth: 1040, margin: '0 auto', padding: '64px 32px' }
const card: React.CSSProperties = { background: C.raised, border: `1px solid ${C.ruleSoft}`, borderRadius: 14, padding: 24 }
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: C.ink, color: C.bg, fontSize: 14, fontWeight: 500, textDecoration: 'none' }
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: 'transparent', color: C.ink, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: `1px solid ${C.rule}` }
