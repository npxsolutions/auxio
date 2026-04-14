'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Fulcra — Affiliates
// Production page. v8 palette + Instrument Serif display + Geist body.
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'
import { useState } from 'react'

const display = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], display: 'swap' })

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
  cobaltSft: 'rgba(29,95,219,0.10)',
  emerald:   '#0e7c5a',
  oxblood:   '#7d2a1a',
}

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Affiliates',   href: '/affiliates' },
  { label: 'Developers',   href: '/developers' },
]

const STRUCTURE = [
  { big: '25%', label: 'Recurring commission', sub: 'On every paid subscription, months 1–12.' },
  { big: '10%', label: 'Recurring commission', sub: 'Months 13 onward, for the lifetime of the account.' },
  { big: '90 days', label: 'Cookie window', sub: 'Last-click attribution, server-verified.' },
  { big: 'Monthly', label: 'Payouts via Stripe Connect', sub: 'On the 15th, USD/GBP/EUR. £50 minimum.' },
]

const STEPS = [
  { n: '01', t: 'Apply',   d: 'Two-minute form. Reviewed by a human inside 72 hours.' },
  { n: '02', t: 'Connect', d: 'Stripe Connect onboarding. Pull your unique tracking link from the partner dashboard.' },
  { n: '03', t: 'Share',   d: 'Drop the link into a video, an email, or a comparison post. We track the rest.' },
  { n: '04', t: 'Earn',    d: 'Monthly statements. Monthly payouts. No clawbacks after month two.' },
]

const PROFILE = [
  { kind: 'Ecommerce content creators', desc: 'YouTubers and TikTokers who break down operator stacks for DTC and marketplace sellers.' },
  { kind: 'Newsletter authors',         desc: 'Writers covering ecommerce ops, repricing, supply chain, or marketplace strategy.' },
  { kind: 'Consultants and agencies',   desc: 'Operators who recommend tools to their book but don\u2019t want the management overhead of the partner program.' },
  { kind: 'Course creators',            desc: 'Bootcamps and accelerators teaching multichannel selling.' },
]

const ASSETS = [
  'Logo pack — SVG and PNG, on cream and on ink.',
  'Banner set — square, vertical, leaderboard, in three palettes.',
  'Demo videos — 60-second tour, 3-minute walkthrough, integration teasers.',
  'Email swipe file — warm intros, cold outreach, newsletter drops.',
  'Comparison decks — Fulcra versus the four most-asked competitors.',
  'Brand guidelines — voice, do-not-use claims, trademark policy.',
]

const FAQ = [
  { q: 'What counts as a valid referral?',          a: 'Any paid account that stays active past day 14 of trial. Self-referrals, sock-puppets, and incentivised signups (e.g. cashback sites) are disqualified.' },
  { q: 'How long is the cookie window?',            a: 'Ninety days, last-click attribution. The cookie is HTTP-only and server-verified at signup.' },
  { q: 'Can I run paid ads on the Fulcra brand?',    a: 'No brand bidding on Google or Bing. Newsletters, YouTube pre-roll, programmatic display, and organic social are all fair game.' },
  { q: 'When do I get paid?',                       a: 'Monthly, on the 15th, via Stripe Connect or wire. Minimum £50 payout — balances roll forward.' },
  { q: 'Is there a cap on commissions?',            a: 'No cap. Our highest-earning affiliate last quarter billed five figures.' },
  { q: 'Can I be both an affiliate and a partner?', a: 'No — pick one. The partner program pays more for active management; affiliates earn more on volume without the operational lift.' },
  { q: 'Do you allow review sites?',                a: 'Yes, with disclosure. Editorial review must follow the FTC and ASA guidelines for affiliate disclosure.' },
]

export default function AffiliatesPage() {
  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Nav active="Affiliates" />

      <header style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '120px 32px 64px', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>Affiliate program</div>
          <h1 className={display.className} style={{ fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 1.02, letterSpacing: '-0.02em', fontWeight: 400, margin: '20px 0 0' }}>
            Earn <em style={{ fontStyle: 'italic', color: C.cobalt }}>25% recurring</em><br />
            for the first year.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: C.muted, maxWidth: 620, marginTop: 24 }}>
            Then 10% for as long as the account stays paid. No caps. No ticking-clock cookies. Monthly payouts via Stripe Connect, because affiliate dashboards that hide your money are a tell.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
            <a href="#apply" style={btnPrimary}>Apply to the program</a>
            <Link href="/affiliates/assets" style={btnGhost}>Brand assets</Link>
          </div>

          <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
            {STRUCTURE.map(s => (
              <div key={s.label + s.sub}>
                <div className={display.className} style={{ fontSize: 44, letterSpacing: '-0.02em' }}>{s.big}</div>
                <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
        <BackdropOrbit />
      </header>

      <section style={section}>
        <SectionHead kicker="How it works" title="Four steps. No ceremony." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginTop: 40 }}>
          {STEPS.map(s => (
            <div key={s.n} style={card}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: C.cobalt }}>{s.n}</div>
              <div className={display.className} style={{ fontSize: 26, marginTop: 10, letterSpacing: '-0.01em' }}>{s.t}</div>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 10 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={section}>
        <SectionHead kicker="Commission" title="What you actually take home." />
        <div style={{ marginTop: 40, background: C.ink, color: C.bg, borderRadius: 18, padding: 36 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            <Stat big="$2,997" small="Annual contract value, average paid customer." dark />
            <Stat big="$749" small="Year-one commission @ 25% recurring." dark />
            <Stat big="$300" small="Year-two commission @ 10% recurring." dark />
            <Stat big="$1,049" small="Two-year payout per referred account." dark />
          </div>
          <p style={{ fontSize: 13, color: 'rgba(243,240,234,0.6)', marginTop: 24, maxWidth: 620, lineHeight: 1.6 }}>
            Worked on the median Pro account. Enterprise referrals pay more. ACVs and commission rates are gross of refunds — refunded subscriptions don&rsquo;t count.
          </p>
        </div>
      </section>

      <section style={section}>
        <SectionHead kicker="Profile" title="Who tends to do well." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginTop: 40 }}>
          {PROFILE.map(p => (
            <div key={p.kind} style={{ ...card, background: C.raised }}>
              <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>{p.kind}</div>
              <p style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.6, marginTop: 12 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={section}>
        <SectionHead kicker="Assets" title="Everything you need, day one." />
        <ul style={{ listStyle: 'none', padding: 0, margin: '32px 0 0', borderTop: `1px solid ${C.ruleSoft}` }}>
          {ASSETS.map(a => (
            <li key={a} style={{ borderBottom: `1px solid ${C.ruleSoft}`, padding: '16px 0', display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <span style={{ color: C.cobalt, fontSize: 14 }}>→</span>
              <span style={{ fontSize: 15, color: C.inkSoft }}>{a}</span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 24 }}>
          <Link href="/affiliates/assets" style={btnGhost}>Browse the asset library →</Link>
        </div>
      </section>

      <section id="apply" style={section}>
        <SectionHead kicker="Apply" title="Tell us where your audience lives." />
        <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.6, marginTop: 16, maxWidth: 580 }}>
          We approve based on relevance, not size. A 2,000-person ops newsletter beats a 200,000-person general business one.
        </p>
        <ApplicationForm />
      </section>

      <section id="faq" style={section}>
        <SectionHead kicker="FAQ" title="The fine print, plainly." />
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
        <div style={{ background: C.ink, color: C.bg, borderRadius: 18, padding: '64px 48px' }}>
          <div className={display.className} style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>Pitch it once. Earn for years.</div>
          <p style={{ fontSize: 16, color: 'rgba(243,240,234,0.7)', maxWidth: 520, marginTop: 16, lineHeight: 1.6 }}>The best affiliates write one piece, link it from one place, and watch it compound while they sleep.</p>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#apply" style={{ ...btnPrimary, background: C.bg, color: C.ink }}>Apply now</a>
            <Link href="/affiliates/assets" style={{ ...btnGhost, color: C.bg, borderColor: 'rgba(243,240,234,0.25)' }}>Brand assets</Link>
          </div>
        </div>
      </section>

      <ResourcesFooter />
    </div>
  )
}

function Stat({ big, small, dark }: { big: string; small: string; dark?: boolean }) {
  return (
    <div>
      <div className={display.className} style={{ fontSize: 40, letterSpacing: '-0.02em', lineHeight: 1 }}>{big}</div>
      <div style={{ fontSize: 13, color: dark ? 'rgba(243,240,234,0.65)' : C.muted, marginTop: 8, lineHeight: 1.55, maxWidth: 220 }}>{small}</div>
    </div>
  )
}

function BackdropOrbit() {
  return (
    <svg aria-hidden viewBox="0 0 1200 600" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5, pointerEvents: 'none' }}>
      <g transform="translate(1040 200)" stroke={C.ink} strokeWidth="1.5" fill="none" opacity="0.4">
        <circle r="80" />
        <circle r="160" />
        <circle r="240" />
        <circle cx="0" cy="-80" r="4" fill={C.bg} stroke={C.cobalt} />
        <circle cx="160" cy="0" r="4" fill={C.bg} />
        <circle cx="-150" cy="120" r="4" fill={C.bg} stroke={C.cobalt} />
      </g>
    </svg>
  )
}

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
      audience: form.get('audience'),
      channels: form.get('channels'),
      url: form.get('url'),
      about: form.get('about'),
    }
    try {
      const res = await fetch('/api/affiliates/apply', {
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
      <Field name="email" label="Email" type="email" required />
      <Field name="url" label="Where you publish" placeholder="https://" required />
      <div>
        <label style={fieldLabel} htmlFor="audience">Audience size</label>
        <select id="audience" name="audience" defaultValue="1k–10k" style={fieldInput}>
          <option>Under 1k</option>
          <option>1k–10k</option>
          <option>10k–100k</option>
          <option>Over 100k</option>
        </select>
      </div>
      <Field name="channels" label="Primary channels" placeholder="e.g. YouTube + newsletter" />
      <div>
        <label style={fieldLabel} htmlFor="about">Tell us about your audience</label>
        <textarea id="about" name="about" rows={4} style={{ ...fieldInput, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Who reads or watches you? Why does Fulcra fit?" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        <button type="submit" disabled={state === 'submitting'} style={{ ...btnPrimary, opacity: state === 'submitting' ? 0.6 : 1, cursor: state === 'submitting' ? 'progress' : 'pointer', border: 'none' }}>
          {state === 'submitting' ? 'Sending…' : 'Submit application'}
        </button>
        {message && (
          <span style={{ fontSize: 13, color: state === 'ok' ? C.emerald : state === 'error' ? C.oxblood : C.muted }}>{message}</span>
        )}
      </div>
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

function Nav({ active }: { active: string }) {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(243,240,234,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ fontSize: 16, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>Fulcra</Link>
      <div style={{ display: 'flex', gap: 28 }}>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} style={{ fontSize: 14, color: n.label === active ? C.ink : C.inkSoft, textDecoration: 'none', fontWeight: n.label === active ? 500 : 400 }}>{n.label}</Link>
        ))}
      </div>
      <Link href="/signup" style={{ ...btnPrimary, padding: '8px 16px', fontSize: 13 }}>Start free</Link>
    </nav>
  )
}

function ResourcesFooter() {
  const cols = [
    { title: 'Product', links: [['Features','/features'], ['Integrations','/integrations'], ['Pricing','/pricing'], ['Changelog','/changelog']] },
    { title: 'Build',   links: [['Developers','/developers'], ['API reference','/developers/reference'], ['Status','/status']] },
    { title: 'Resources', links: [['Partners','/partners'], ['Affiliates','/affiliates'], ['Developers','/developers'], ['Status','/status'], ['Changelog','/changelog'], ['Directories','/directories'], ['Community','/community']] },
    { title: 'Company', links: [['About','/about'], ['Contact','/contact'], ['Privacy','/privacy'], ['Terms','/terms']] },
  ] as const
  return (
    <footer style={{ borderTop: `1px solid ${C.rule}`, background: C.bg }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32 }}>
        <div>
          <Link href="/" style={{ fontSize: 18, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>Fulcra</Link>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginTop: 12, maxWidth: 240 }}>The operating layer for multichannel commerce.</p>
        </div>
        {cols.map(col => (
          <div key={col.title}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 16 }}>{col.title}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
              {col.links.map(([label, href]) => (
                <li key={label}><Link href={href} style={{ fontSize: 14, color: C.inkSoft, textDecoration: 'none' }}>{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${C.ruleSoft}`, padding: '20px 32px', maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 12, color: C.muted }}>© {new Date().getFullYear()} Fulcra. All rights reserved.</div>
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
