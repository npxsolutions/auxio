'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Auxio — Partners
// Production page. v8 palette + Instrument Serif display + Geist body.
// SVG craft: 1.5px strokes, ring nodes, ink + cobalt only, two colors max.
// Copy cadence: Stripe / Linear / Notion. Period-terminated sentences.
// ─────────────────────────────────────────────────────────────────────────────

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
  cobaltDk:  '#1647a8',
  cobaltSft: 'rgba(29,95,219,0.10)',
}

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Partners',     href: '/partners' },
  { label: 'Developers',   href: '/developers' },
]

type Tier = {
  name: string
  tagline: string
  rev: string
  perks: string[]
  needs: string[]
  highlight?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Registered',
    tagline: 'You know one client who could use Auxio.',
    rev: '20% recurring · 12 months',
    perks: [
      'Co-branded landing page.',
      'Self-serve referral link.',
      'Quarterly partner digest.',
    ],
    needs: [
      'One referred opportunity per quarter.',
      'Auxio overview certification (45 min, online).',
    ],
  },
  {
    name: 'Silver',
    tagline: 'You manage operations for two or more brands.',
    rev: '25% recurring · 24 months',
    perks: [
      'Listed in the partner directory.',
      'Shared Slack channel with the team.',
      'Co-marketing — one piece per quarter.',
      'Sandbox accounts for client demos.',
    ],
    needs: [
      'Three active accounts on Auxio.',
      'Two certified consultants on staff.',
    ],
  },
  {
    name: 'Gold',
    tagline: 'You operate the back office for an agency book.',
    rev: '30% recurring · lifetime',
    perks: [
      'Featured directory placement.',
      'Joint case studies and webinars.',
      'Early access — 30 days before GA.',
      'Named partner manager.',
      'Priority engineering escalations.',
    ],
    needs: [
      'Ten active accounts on Auxio.',
      'Four certified consultants.',
      'One published joint case study annually.',
    ],
    highlight: true,
  },
  {
    name: 'Platinum',
    tagline: 'You build the operating system for a portfolio.',
    rev: 'Custom · implementation + lifetime rev share',
    perks: [
      'Co-sell with our enterprise team.',
      'Roadmap input on integrations.',
      'White-labelled reporting templates.',
      'Annual partner advisory board seat.',
      'Dedicated solutions architect.',
    ],
    needs: [
      'Twenty-five active accounts on Auxio.',
      'Six certified consultants and a delivery lead.',
      'Joint quarterly business review.',
    ],
  },
]

const PROFILE = [
  { kind: 'Agencies',       desc: 'Brand and growth shops who manage marketplace presence and merchandising for DTC clients.' },
  { kind: 'Consultancies',  desc: 'Operations and finance consultancies running multichannel diagnostics, repricing strategy, or fractional COO work.' },
  { kind: '3PLs',           desc: 'Logistics partners whose clients sell across Amazon, eBay, Shopify, TikTok Shop, and Walmart from a single warehouse footprint.' },
  { kind: 'SIs',            desc: 'System integrators wiring ERPs, WMSs, and accounting tools into a single source of operational truth.' },
]

const COSELL = [
  { title: 'Co-marketing',      desc: 'Joint case studies, co-hosted webinars, and reciprocal directory listings once your first client is live.' },
  { title: 'Co-selling',        desc: 'Warm intros into our pipeline. Our AEs partner on discovery, demos, and procurement for accounts you source.' },
  { title: 'Enablement',        desc: 'Certification, sandbox accounts, sales decks, technical battlecards, and a shared Slack channel that responds in hours, not days.' },
  { title: 'Revenue dashboard', desc: 'Track referrals, MRR attributed, payouts, churn, and account health in one view. Export anything to CSV.' },
]

const TIMELINE = [
  { week: 'Week 0', title: 'Apply',         desc: 'Submit the form. We review weekly and reply within seven days.' },
  { week: 'Week 1', title: 'Discovery',     desc: 'A 30-minute call to understand your client base and how Auxio fits.' },
  { week: 'Week 2', title: 'Certification', desc: 'Two consultants complete the Auxio certification. Async, ~3 hours.' },
  { week: 'Week 3', title: 'Launch',        desc: 'Sandbox accounts provisioned. Co-branded landing page goes live.' },
  { week: 'Week 4', title: 'First deal',    desc: 'We co-pitch your first prospect. From there, you have the relationship.' },
]

const FAQ = [
  { q: 'How is commission paid?',         a: 'Monthly via Stripe Connect or wire, in USD, GBP, or EUR. Minimum payout £50. Statements arrive on the 5th, payments clear by the 15th.' },
  { q: 'Do I have to be exclusive?',      a: 'No. Most of our partners also resell competing products. We compete on the work, not on contract clauses.' },
  { q: 'Who owns the client?',            a: 'You do. We do not contact, cross-sell, or upsell your clients without your involvement.' },
  { q: 'Can I white-label Auxio?',        a: 'Not yet. The Auxio brand stays on the product. Your brand sits on implementation, support, and reporting.' },
  { q: 'What happens if a client churns?', a: 'Commission stops with the subscription. No clawbacks for cancellations after month two.' },
  { q: 'Is there a partner directory?',   a: 'Yes — Silver tier and above. Listed by region, specialism, and certified headcount. We pass inbound leads geographically.' },
]

export default function PartnersPage() {
  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Nav active="Partners" />

      <Hero />

      <section style={section}>
        <SectionHead kicker="Partner profile" title="Who we partner with." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 40 }}>
          {PROFILE.map(p => (
            <div key={p.kind} style={card}>
              <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>{p.kind}</div>
              <p style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.6, marginTop: 12 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={section}>
        <SectionHead kicker="Tiers" title="Four tiers. Real economics." />
        <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.6, marginTop: 16, maxWidth: 620 }}>
          Tier up by activity, not by negotiation. Every tier earns recurring revenue from day one — not one-time bounties that disappear after onboarding.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginTop: 40 }}>
          {TIERS.map(t => (
            <article key={t.name} style={{ ...card, background: t.highlight ? C.ink : C.surface, color: t.highlight ? C.bg : C.ink, borderColor: t.highlight ? C.ink : C.ruleSoft, position: 'relative' }}>
              {t.highlight && (
                <span style={{ position: 'absolute', top: -10, left: 24, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.bg, background: C.cobalt, padding: '4px 10px', borderRadius: 999 }}>Most chosen</span>
              )}
              <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.highlight ? 'rgba(243,240,234,0.6)' : C.cobalt }}>{t.name}</div>
              <div className={display.className} style={{ fontSize: 28, marginTop: 10, lineHeight: 1.1, letterSpacing: '-0.01em' }}>{t.rev}</div>
              <p style={{ fontSize: 13, color: t.highlight ? 'rgba(243,240,234,0.7)' : C.muted, lineHeight: 1.55, marginTop: 12 }}>{t.tagline}</p>

              <div style={{ marginTop: 20, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.highlight ? 'rgba(243,240,234,0.55)' : C.muted }}>You get</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
                {t.perks.map(p => (
                  <li key={p} style={{ fontSize: 13, lineHeight: 1.55, padding: '4px 0', display: 'flex', gap: 8 }}>
                    <span style={{ color: t.highlight ? C.cobalt : C.cobalt }}>—</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 16, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.highlight ? 'rgba(243,240,234,0.55)' : C.muted }}>To qualify</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
                {t.needs.map(n => (
                  <li key={n} style={{ fontSize: 13, lineHeight: 1.55, padding: '4px 0', opacity: 0.85 }}>· {n}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section style={section}>
        <SectionHead kicker="Co-sell · co-market" title="Real enablement, not a PDF kit." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginTop: 40 }}>
          {COSELL.map(b => (
            <div key={b.title} style={{ ...card, background: C.raised }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{b.title}</div>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 8 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={section}>
        <SectionHead kicker="Onboarding" title="Live in four weeks." />
        <div style={{ marginTop: 40, position: 'relative' }}>
          <Timeline />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 32 }}>
            {TIMELINE.map(t => (
              <div key={t.week} style={{ ...card, background: C.surface }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.cobalt }}>{t.week}</div>
                <div className={display.className} style={{ fontSize: 22, marginTop: 8, letterSpacing: '-0.01em' }}>{t.title}</div>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginTop: 8 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={section} id="apply">
        <SectionHead kicker="Apply" title="Tell us about your practice." />
        <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.6, marginTop: 16, maxWidth: 580 }}>
          Two minutes. We review every application and reply within seven days — even if the answer is &ldquo;not yet.&rdquo;
        </p>
        <ApplicationForm />
      </section>

      <section style={section}>
        <SectionHead kicker="FAQ" title="Before you apply." />
        <div style={{ marginTop: 32, borderTop: `1px solid ${C.ruleSoft}` }}>
          {FAQ.map(f => (
            <details key={f.q} style={{ borderBottom: `1px solid ${C.ruleSoft}`, padding: '20px 0' }}>
              <summary style={{ cursor: 'pointer', fontSize: 16, fontWeight: 500, listStyle: 'none' }}>{f.q}</summary>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, marginTop: 10, maxWidth: 720 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section style={{ ...section, marginBottom: 80 }}>
        <div style={{ background: C.ink, color: C.bg, borderRadius: 18, padding: '64px 48px', display: 'grid', gap: 20 }}>
          <div className={display.className} style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            Build a book on Auxio.
          </div>
          <p style={{ fontSize: 16, color: 'rgba(243,240,234,0.7)', maxWidth: 560, lineHeight: 1.6 }}>
            The agencies and 3PLs already partnered with us are quietly compounding recurring revenue while their clients consolidate channels.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#apply" style={{ ...btnPrimary, background: C.bg, color: C.ink }}>Apply now</a>
            <Link href="/contact" style={{ ...btnGhost, color: C.bg, borderColor: 'rgba(243,240,234,0.25)' }}>Talk to the team</Link>
          </div>
        </div>
      </section>

      <ResourcesFooter />
    </div>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <header style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '120px 32px 64px', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt, marginBottom: 20 }}>Partner program</div>
        <h1 className={display.className} style={{ fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 1.02, letterSpacing: '-0.02em', fontWeight: 400, margin: 0 }}>
          Build with the <em style={{ fontStyle: 'italic', color: C.cobalt }}>operators</em><br />
          who run global commerce.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: C.muted, maxWidth: 620, marginTop: 24 }}>
          Agencies, consultancies, and 3PLs already run their clients&rsquo; back offices on Auxio. Refer one. Resell at scale. Co-build the operating layer for multichannel commerce.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <a href="#apply" style={btnPrimary}>Apply to partner</a>
          <Link href="#tiers" style={btnGhost}>See the tiers</Link>
        </div>

        <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
          {[['20%', 'First-year revenue share'],
            ['12 mo', 'Default attribution window'],
            ['7 days', 'Application turnaround'],
            ['£50', 'Minimum payout']].map(([big, small]) => (
            <div key={small as string}>
              <div className={display.className} style={{ fontSize: 44, letterSpacing: '-0.02em' }}>{big}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{small}</div>
            </div>
          ))}
        </div>
      </div>
      <HeroOrbits />
    </header>
  )
}

// SVG craft: 1.5px strokes; ink + cobalt only; ring nodes; one rotation.
function HeroOrbits() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 600"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55, pointerEvents: 'none' }}
    >
      <defs>
        <radialGradient id="p-fade" cx="80%" cy="20%" r="60%">
          <stop offset="0%" stopColor={C.cobalt} stopOpacity="0.18" />
          <stop offset="100%" stopColor={C.cobalt} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="600" fill="url(#p-fade)" />
      <g transform="translate(960 160)" stroke={C.ink} strokeWidth="1.5" fill="none" opacity="0.55">
        <circle r="60" />
        <circle r="120" />
        <circle r="180" />
        <circle r="240" />
        <circle cx="60" cy="0" r="4" fill={C.bg} />
        <circle cx="0" cy="-120" r="4" fill={C.bg} stroke={C.cobalt} />
        <circle cx="-180" cy="0" r="4" fill={C.bg} />
        <circle cx="170" cy="170" r="4" fill={C.bg} stroke={C.cobalt} />
      </g>
    </svg>
  )
}

// ── Timeline (SVG craft: 1.5px stroke, ring nodes) ──
function Timeline() {
  return (
    <svg viewBox="0 0 1000 30" style={{ width: '100%', height: 30 }} aria-hidden>
      <line x1="20" y1="15" x2="980" y2="15" stroke={C.ink} strokeWidth="1.5" opacity="0.25" strokeDasharray="3 5" />
      {[20, 260, 500, 740, 980].map(x => (
        <g key={x}>
          <circle cx={x} cy="15" r="6" fill={C.bg} stroke={C.ink} strokeWidth="1.5" />
          <circle cx={x} cy="15" r="2" fill={C.cobalt} />
        </g>
      ))}
    </svg>
  )
}

// ── Application form ─────────────────────────────────────────────────────────
function ApplicationForm() {
  const [state, setState] = useState<'idle' | 'submitting' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('submitting')
    setMessage('')
    const form = new FormData(e.currentTarget)
    const payload = {
      name: form.get('name'),
      email: form.get('email'),
      company: form.get('company'),
      tier: form.get('tier'),
      website: form.get('website'),
      clients: form.get('clients'),
      about: form.get('about'),
    }
    try {
      const res = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setState('error')
        setMessage(data?.error ?? 'Something went wrong. Please try again.')
        return
      }
      setState('ok')
      setMessage(data?.message ?? 'Application received.')
      ;(e.target as HTMLFormElement).reset()
    } catch {
      setState('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: 32, display: 'grid', gap: 16, background: C.surface, border: `1px solid ${C.ruleSoft}`, borderRadius: 18, padding: 32, maxWidth: 720 }}>
      <Field name="name" label="Your name" required />
      <Field name="email" label="Work email" type="email" required />
      <Field name="company" label="Company" required />
      <Field name="website" label="Website" placeholder="https://" />
      <div>
        <label style={fieldLabel} htmlFor="tier">Tier you&rsquo;re applying for</label>
        <select id="tier" name="tier" defaultValue="Registered" style={fieldInput}>
          {TIERS.map(t => <option key={t.name}>{t.name}</option>)}
        </select>
      </div>
      <Field name="clients" label="How many active commerce clients do you support?" placeholder="e.g. 12" />
      <div>
        <label style={fieldLabel} htmlFor="about">Tell us about your practice</label>
        <textarea id="about" name="about" rows={4} style={{ ...fieldInput, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Specialism, channels you cover, why Auxio fits." />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        <button type="submit" disabled={state === 'submitting'} style={{ ...btnPrimary, opacity: state === 'submitting' ? 0.6 : 1, cursor: state === 'submitting' ? 'progress' : 'pointer', border: 'none' }}>
          {state === 'submitting' ? 'Sending…' : 'Submit application'}
        </button>
        {message && (
          <span style={{ fontSize: 13, color: state === 'ok' ? '#0e7c5a' : state === 'error' ? '#7d2a1a' : C.muted }}>
            {message}
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, margin: 0 }}>
        We&rsquo;ll only use this to evaluate your application. See our <Link href="/privacy" style={{ color: C.cobalt }}>privacy policy</Link>.
      </p>
    </form>
  )
}

function Field({ name, label, type = 'text', placeholder, required }: { name: string; label: string; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label style={fieldLabel} htmlFor={name}>{label}{required && <span style={{ color: C.cobalt }}> *</span>}</label>
      <input id={name} name={name} type={type} required={required} placeholder={placeholder} style={fieldInput} />
    </div>
  )
}

// ── Shared chrome ────────────────────────────────────────────────────────────
function Nav({ active }: { active: string }) {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(243,240,234,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ fontSize: 16, fontWeight: 600, color: C.ink, textDecoration: 'none', letterSpacing: '-0.01em' }}>Auxio</Link>
      <div style={{ display: 'flex', gap: 28 }}>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} style={{ fontSize: 14, color: n.label === active ? C.ink : C.inkSoft, textDecoration: 'none', fontWeight: n.label === active ? 500 : 400 }}>
            {n.label}
          </Link>
        ))}
      </div>
      <Link href="/signup" style={{ ...btnPrimary, padding: '8px 16px', fontSize: 13 }}>Start free</Link>
    </nav>
  )
}

export function ResourcesFooter() {
  const cols: { title: string; links: { label: string; href: string }[] }[] = [
    { title: 'Product', links: [
      { label: 'Features', href: '/features' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Changelog', href: '/changelog' },
    ]},
    { title: 'Build', links: [
      { label: 'Developers', href: '/developers' },
      { label: 'API reference', href: '/developers/reference' },
      { label: 'Status', href: '/status' },
      { label: 'System health', href: '/status' },
    ]},
    { title: 'Resources', links: [
      { label: 'Partners', href: '/partners' },
      { label: 'Affiliates', href: '/affiliates' },
      { label: 'Developers', href: '/developers' },
      { label: 'Status', href: '/status' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Directories', href: '/directories' },
      { label: 'Community', href: '/community' },
    ]},
    { title: 'Company', links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ]},
  ]
  return (
    <footer style={{ borderTop: `1px solid ${C.rule}`, background: C.bg }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32 }}>
        <div>
          <Link href="/" style={{ fontSize: 18, fontWeight: 600, color: C.ink, textDecoration: 'none', letterSpacing: '-0.01em' }}>Auxio</Link>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginTop: 12, maxWidth: 240 }}>
            The operating layer for multichannel commerce.
          </p>
        </div>
        {cols.map(col => (
          <div key={col.title}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 16 }}>{col.title}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
              {col.links.map(l => (
                <li key={l.label}>
                  <Link href={l.href} style={{ fontSize: 14, color: C.inkSoft, textDecoration: 'none' }}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${C.ruleSoft}`, padding: '20px 32px', maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 12, color: C.muted }}>© {new Date().getFullYear()} Auxio. All rights reserved.</div>
        <div style={{ fontSize: 12, color: C.muted }}>Built for operators.</div>
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
const card: React.CSSProperties = { background: C.surface, border: `1px solid ${C.ruleSoft}`, borderRadius: 14, padding: 24 }
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: C.ink, color: C.bg, fontSize: 14, fontWeight: 500, textDecoration: 'none' }
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: 'transparent', color: C.ink, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: `1px solid ${C.rule}` }
const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 13, color: C.inkSoft, marginBottom: 6, fontWeight: 500 }
const fieldInput: React.CSSProperties = { width: '100%', padding: '10px 14px', fontSize: 14, color: C.ink, background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 10, outline: 'none', fontFamily: 'inherit' }
