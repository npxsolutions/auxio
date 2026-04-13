'use client'

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const C = {
  bg:       '#f3f0ea',
  surface:  '#ffffff',
  raised:   '#ebe6dc',
  ink:      '#0b0f1a',
  inkSoft:  '#1c2233',
  rule:     'rgba(11,15,26,0.10)',
  ruleSoft: 'rgba(11,15,26,0.06)',
  muted:    '#5a6171',
  cobalt:   '#1d5fdb',
  cobaltDk: '#1647a8',
  cobaltSft:'rgba(29,95,219,0.10)',
}

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Partners',     href: '/partners' },
  { label: 'Developers',   href: '/developers' },
]

const TIERS = [
  {
    name: 'Referral',
    who:  'Consultants, freelancers, communities.',
    rev:  '20% recurring, 12 months.',
    need: 'A client who could use Auxio.',
  },
  {
    name: 'Reseller',
    who:  '3PLs, agencies, fractional COOs.',
    rev:  '25–30% recurring, lifetime.',
    need: 'Manage the account end-to-end.',
  },
  {
    name: 'Solution',
    who:  'Ops consultancies, SIs, VARs.',
    rev:  'Custom — implementation + rev share.',
    need: 'Certified team, 3+ active deployments.',
  },
]

const BENEFITS = [
  { title: 'Co-marketing',       desc: 'Joint case studies, webinars, and a listing in the partner directory once you close your first client.' },
  { title: 'Partner dashboard',  desc: 'Track referrals, MRR attributed, payouts, and client health in one place.' },
  { title: 'Priority support',   desc: 'Shared Slack channel with our team. We respond inside 4 business hours.' },
  { title: 'Early access',       desc: 'New integrations, new dashboards, and pricing changes 30 days before GA.' },
]

const FAQ = [
  { q: 'How is commission paid?',    a: 'Monthly via Stripe or wire, in USD, GBP or EUR. Minimum payout £50.' },
  { q: 'Is there a minimum commit?', a: 'No. Referral tier has no minimums. Reseller and Solution tiers require one active deployment per quarter after month three.' },
  { q: 'Can I resell white-label?',  a: 'Not yet. We keep the Auxio brand attached to the product; your brand sits on implementation and success.' },
  { q: 'Who owns the client?',       a: 'You do. We do not poach, cross-sell, or contact your clients without your involvement.' },
]

export default function PartnersPage() {
  return (
    <div className={display.className} style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Nav />

      <header style={{ maxWidth: 1040, margin: '0 auto', padding: '120px 32px 64px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt, marginBottom: 20 }}>Partner program</div>
        <h1 className={display.className} style={{ fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 1.02, letterSpacing: '-0.02em', fontWeight: 400, margin: 0 }}>
          Grow with the <em style={{ fontStyle: 'italic', color: C.cobalt }}>operators</em><br />
          who already trust Auxio.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: C.muted, maxWidth: 620, marginTop: 24 }}>
          Agencies, 3PLs, and commerce consultants already run their clients&rsquo; back-office on Auxio. If you bring them, we share revenue — cleanly, recurringly, and without the usual partner-portal theatre.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <a href="mailto:partners@auxio.io?subject=Partner%20application" style={btnPrimary}>Apply to partner</a>
          <Link href="/contact" style={btnGhost}>Talk to the team</Link>
        </div>
      </header>

      <section style={section}>
        <SectionHead kicker="Tiers" title="Three ways to partner." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 40 }}>
          {TIERS.map(t => (
            <article key={t.name} style={card}>
              <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted }}>{t.name}</div>
              <div className={display.className} style={{ fontSize: 28, marginTop: 12, letterSpacing: '-0.01em' }}>{t.rev}</div>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.55, marginTop: 16 }}>{t.who}</p>
              <div style={{ borderTop: `1px solid ${C.ruleSoft}`, marginTop: 20, paddingTop: 16, fontSize: 13, color: C.inkSoft }}>
                <strong style={{ fontWeight: 500 }}>What we need.</strong> {t.need}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={section}>
        <SectionHead kicker="What you get" title="Real enablement, not a PDF kit." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 40 }}>
          {BENEFITS.map(b => (
            <div key={b.title} style={{ ...card, background: C.surface }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{b.title}</div>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.55, marginTop: 8 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={section}>
        <SectionHead kicker="FAQ" title="Before you apply." />
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
        <div style={{ background: C.ink, color: C.bg, borderRadius: 18, padding: '56px 48px', display: 'grid', gap: 20 }}>
          <div className={display.className} style={{ fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            Ready when you are.
          </div>
          <p style={{ fontSize: 16, color: 'rgba(243,240,234,0.7)', maxWidth: 520 }}>
            Applications reviewed weekly. If your client roster fits, you&rsquo;ll hear back inside seven days.
          </p>
          <div>
            <a href="mailto:partners@auxio.io?subject=Partner%20application" style={{ ...btnPrimary, background: C.bg, color: C.ink }}>Apply now</a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// ── shared atoms ──
function Nav() {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(243,240,234,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ fontSize: 16, fontWeight: 600, color: C.ink, textDecoration: 'none', letterSpacing: '-0.01em' }}>Auxio</Link>
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
const card: React.CSSProperties  = { background: C.raised, border: `1px solid ${C.ruleSoft}`, borderRadius: 14, padding: 24 }
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: C.ink, color: C.bg, fontSize: 14, fontWeight: 500, textDecoration: 'none' }
const btnGhost:   React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: 'transparent', color: C.ink, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: `1px solid ${C.rule}` }
