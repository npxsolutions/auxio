'use client'

// V1 — Analyst-grade / IR-deck energy
// Inspiration: Snowflake, Databricks, MongoDB, Cloudflare investor-relations homepages
// Muted enterprise palette, tight tracking, weight-600 display headlines, numbers forward.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  bg:         '#fafafa',     // off-white paper
  bgAlt:      '#f4f5f7',     // subtle band
  navy:       '#0a1628',     // deep IR navy
  navyAlt:    '#0f1f38',
  ink:        '#0a1628',
  body:       '#4a5668',
  muted:      '#7c8696',
  border:     'rgba(10,22,40,0.09)',
  borderStrong:'rgba(10,22,40,0.16)',
  accent:     '#1e5fd9',     // confident enterprise blue
  accentDark: '#1549b0',
  accentSoft: 'rgba(30,95,217,0.08)',
  emerald:    '#0f9b6e',
  white:      '#ffffff',
  text70:     'rgba(255,255,255,0.7)',
  text50:     'rgba(255,255,255,0.5)',
  text30:     'rgba(255,255,255,0.3)',
}

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Blog',         href: '/blog' },
  { label: 'About',        href: '/about' },
]

const NUMBERS = [
  { value: '$3M+',  label: 'GMV processed monthly' },
  { value: '40+',   label: 'countries served' },
  { value: '12',    label: 'marketplaces connected' },
  { value: '65%',   label: 'reduction in order errors' },
  { value: '<10m',  label: 'median setup time' },
]

const REPLACES = [
  { name: 'Linnworks',       note: 'Listings & orders' },
  { name: 'Brightpearl',     note: 'Retail ERP' },
  { name: 'ChannelAdvisor',  note: 'Marketplace management' },
  { name: 'Feedonomics',     note: 'Feed & product data' },
]

const PILLARS = [
  {
    title: 'Inventory & Listings',
    bullets: [
      'Real-time multi-channel stock sync across 12 marketplaces',
      'Bulk listing builder with per-channel attribute mapping',
      'Variant, bundle, and kit support with shared stock pools',
    ],
  },
  {
    title: 'Orders & Fulfilment',
    bullets: [
      'Unified order queue with rules-based routing',
      'Label generation across 30+ carriers, global rates',
      'Returns, RMAs, and exception handling in one workflow',
    ],
  },
  {
    title: 'Procurement & Forecasting',
    bullets: [
      '90-day velocity-based demand forecasts per SKU',
      'Supplier PO automation with lead-time tracking',
      'Reorder alerts tuned to channel-level sell-through',
    ],
  },
  {
    title: 'Profit & Analytics',
    bullets: [
      'True net margin after fees, shipping, COGS, tax',
      'Channel and SKU-level P&L, exportable to CSV / API',
      'Advertising spend attribution across marketplaces',
    ],
  },
]

const PRICE_MATRIX = [
  { cur: 'USD', sym: '$',   v: '59' },
  { cur: 'GBP', sym: '\u00a3',v: '49' },
  { cur: 'EUR', sym: '\u20ac', v: '55' },
  { cur: 'AUD', sym: 'A$',  v: '89' },
  { cur: 'CAD', sym: 'C$',  v: '79' },
]

const LOGOS = [
  'Northwind Goods', 'Meridian Retail', 'Orbit Commerce', 'Harbor & Co.',
  'Lumen Supply', 'Verdant Labs', 'Kite Apparel', 'Ironoak Trading',
]

const QUOTES = [
  {
    quote: 'Meridia replaced three platforms and saved us $84,000 in annual software spend. The P&L module alone has changed how we price across regions.',
    name: 'Sarah T.', role: 'Director of Operations, multi-brand retailer',
    metric: '$84K', metricLabel: 'annual software savings',
  },
  {
    quote: 'We scaled from $400K to $2.1M monthly GMV on Meridia without adding a single ops hire. Forecasting and automated POs do the work of two people.',
    name: 'Marcus L.', role: 'Founder, consumer electronics',
    metric: '5.2x', metricLabel: 'GMV growth, same headcount',
  },
  {
    quote: 'Live on four marketplaces in 11 minutes. By week two we had recovered $12,000 in misattributed advertising spend. The ROI is embarrassing.',
    name: 'Priya K.', role: 'VP Commerce, health & beauty',
    metric: '$12K', metricLabel: 'recovered in week 2',
  },
]

const PLANS = [
  { name: 'Starter',  price: '59',  tagline: 'Solo operators going multi-channel',
    features: ['3 channels', '2,500 SKUs', 'Core inventory & orders', 'Email support'] },
  { name: 'Growth',   price: '159', tagline: 'Scaling teams consolidating tools', highlight: true,
    features: ['8 channels', '25,000 SKUs', 'Procurement + forecasting', 'P&L analytics', 'Priority support'] },
  { name: 'Scale',    price: '499', tagline: 'Operators at $1M+ GMV / month', founding: true,
    features: ['Unlimited channels', '250,000 SKUs', 'Full API + webhooks', 'Multi-workspace', 'Dedicated CSM'] },
]

const COMPLIANCE = [
  { label: 'SOC 2 Type II',        status: 'In progress' },
  { label: 'GDPR',                 status: 'Compliant' },
  { label: 'ISO 27001',            status: 'Planned 2026' },
  { label: 'Encryption at rest',   status: 'AES-256' },
  { label: 'Multi-region infra',   status: 'US / EU / APAC' },
  { label: 'Daily backups',        status: 'Point-in-time' },
]

// ── Counter ──────────────────────────────────────────────────────────────────
function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); obs.disconnect() }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ opacity: seen ? 1 : 0, transform: seen ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      {children}
    </div>
  )
}

export default function LandingV1() {
  const [currency, setCurrency] = useState(0)

  const section: React.CSSProperties = { padding: '96px 48px', maxWidth: '1240px', margin: '0 auto' }
  const eyebrow: React.CSSProperties = { fontSize: '12px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accent, marginBottom: '18px' }
  const h2: React.CSSProperties = { fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.08, color: C.ink, margin: '0 0 20px' }
  const sub: React.CSSProperties = { fontSize: '18px', lineHeight: 1.55, color: C.body, maxWidth: '680px', margin: 0 }

  return (
    <div style={{ fontFamily: 'var(--font-geist), ui-sans-serif, system-ui, sans-serif', background: C.bg, color: C.ink, WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(250,250,250,0.88)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}`, padding: '0 48px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '26px', height: '26px', background: C.navy, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '12px', letterSpacing: '-0.02em' }}>A</div>
          <span style={{ fontWeight: 600, fontSize: '15px', color: C.ink, letterSpacing: '-0.02em' }}>Meridia</span>
        </Link>
        <div style={{ display: 'flex', gap: '28px' }}>
          {NAV.map(n => <Link key={n.href} href={n.href} style={{ fontSize: '13px', color: C.body, textDecoration: 'none', fontWeight: 500, letterSpacing: '-0.005em' }}>{n.label}</Link>)}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/login" style={{ padding: '8px 14px', borderRadius: '6px', fontSize: '13px', color: C.ink, textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
          <Link href="/signup" style={{ padding: '8px 14px', borderRadius: '6px', background: C.navy, fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: 600, letterSpacing: '-0.005em' }}>Start free</Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: '160px', paddingBottom: '72px', paddingLeft: '48px', paddingRight: '48px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ ...eyebrow, display: 'inline-flex', alignItems: 'center', gap: '10px', background: C.accentSoft, color: C.accent, padding: '6px 12px', borderRadius: '100px', marginBottom: '24px' }}>
            <span style={{ width: '6px', height: '6px', background: C.emerald, borderRadius: '50%' }} />
            Series-grade commerce infrastructure
          </div>
          <h1 style={{ fontSize: 'clamp(44px, 6.2vw, 84px)', fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.03, color: C.ink, margin: '0 0 24px', maxWidth: '1100px' }}>
            The Operating System for Global Commerce.
          </h1>
          <p style={{ fontSize: '22px', lineHeight: 1.45, color: C.body, maxWidth: '780px', margin: '0 0 40px', fontWeight: 400 }}>
            Every marketplace, every currency, one platform. Meridia consolidates listings, orders, procurement, and profit analytics for operators selling in 40+ countries.
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
            <Link href="/signup" style={{ padding: '14px 22px', borderRadius: '8px', background: C.navy, color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '15px', letterSpacing: '-0.01em' }}>
              Start free
            </Link>
            <Link href="/contact" style={{ padding: '14px 22px', borderRadius: '8px', background: 'transparent', color: C.ink, textDecoration: 'none', fontWeight: 600, fontSize: '15px', letterSpacing: '-0.01em', border: `1px solid ${C.borderStrong}` }}>
              Book a demo
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: C.muted, fontWeight: 500 }}>
            <span style={{ width: '6px', height: '6px', background: C.emerald, borderRadius: '50%' }} />
            Trusted by sellers in 40+ countries
          </div>
        </div>
      </section>

      {/* ── Big numbers strip ───────────────────────────────────────────── */}
      <section style={{ background: C.navy, padding: '64px 48px', color: 'white' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.text50, marginBottom: '32px' }}>
            Platform metrics — Q1 2026
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '32px' }}>
            {NUMBERS.map((n, i) => (
              <div key={i} style={{ borderLeft: `1px solid rgba(255,255,255,0.14)`, paddingLeft: '20px' }}>
                <div style={{ fontSize: 'clamp(32px, 3.2vw, 46px)', fontWeight: 600, letterSpacing: '-0.03em', color: 'white', lineHeight: 1, marginBottom: '12px' }}>
                  {n.value}
                </div>
                <div style={{ fontSize: '13px', color: C.text70, lineHeight: 1.4, fontWeight: 400 }}>{n.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What we replace ─────────────────────────────────────────────── */}
      <section style={section}>
        <div style={eyebrow}>The consolidation play</div>
        <h2 style={h2}>Four platforms. One bill. One truth.</h2>
        <p style={{ ...sub, marginBottom: '48px' }}>
          Operators stitch together listings tools, ERPs, and feed managers — then reconcile the output in spreadsheets. Meridia replaces the stack.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '48px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {REPLACES.map((r) => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: C.white, border: `1px solid ${C.border}`, borderRadius: '10px', position: 'relative' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: C.ink, textDecoration: 'line-through', textDecorationColor: 'rgba(10,22,40,0.35)', letterSpacing: '-0.01em' }}>{r.name}</div>
                  <div style={{ fontSize: '12px', color: C.muted, marginTop: '3px' }}>{r.note}</div>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>Replaced</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '28px', color: C.accent, fontWeight: 400 }}>→</div>
          <div style={{ padding: '40px 32px', background: C.navy, borderRadius: '14px', color: 'white', minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.text50, marginBottom: '14px' }}>Meridia</div>
            <div style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '16px' }}>
              One platform, one data model, one P&L.
            </div>
            <div style={{ fontSize: '14px', color: C.text70, lineHeight: 1.55 }}>
              Average operator saves $58K+ annually on software alone — before counting the hours recovered from reconciliation work.
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform overview ───────────────────────────────────────────── */}
      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={section}>
          <div style={eyebrow}>Platform</div>
          <h2 style={h2}>Four pillars. One operational surface.</h2>
          <p style={{ ...sub, marginBottom: '56px' }}>
            Every module shares one inventory graph, one order ledger, one identity layer. Nothing to integrate internally.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: C.border, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
            {PILLARS.map((p) => (
              <div key={p.title} style={{ background: C.white, padding: '36px 34px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accent, marginBottom: '14px' }}>Module</div>
                <div style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em', color: C.ink, marginBottom: '20px' }}>{p.title}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {p.bullets.map((b, i) => (
                    <li key={i} style={{ display: 'flex', gap: '12px', fontSize: '14px', color: C.body, lineHeight: 1.5 }}>
                      <span style={{ color: C.accent, fontWeight: 600, flexShrink: 0 }}>—</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Multi-currency proof ────────────────────────────────────────── */}
      <section style={section}>
        <div style={eyebrow}>Priced where your customers shop</div>
        <h2 style={h2}>One SKU. Five currencies. Zero spreadsheets.</h2>
        <p style={{ ...sub, marginBottom: '48px' }}>
          Meridia prices, bills, and reconciles in the local currency of every market you sell in — with FX locked at order creation.
        </p>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '40px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '48px', alignItems: 'center' }}>
          <div>
            <div style={{ width: '100%', aspectRatio: '1', background: `linear-gradient(135deg, ${C.navy}, ${C.navyAlt})`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 500, letterSpacing: '-0.01em' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: C.text50, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>SKU</div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>AUX-PRO-01</div>
                <div style={{ fontSize: '12px', color: C.text70, marginTop: '6px' }}>Standard unit</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {PRICE_MATRIX.map((p, i) => (
              <button key={p.cur} onClick={() => setCurrency(i)} style={{ cursor: 'pointer', padding: '22px 14px', border: `1px solid ${currency === i ? C.accent : C.border}`, background: currency === i ? C.accentSoft : C.white, borderRadius: '10px', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: currency === i ? C.accent : C.muted, marginBottom: '10px' }}>{p.cur}</div>
                <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', color: C.ink }}>
                  {p.sym}{p.v}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Logos + testimonials ────────────────────────────────────────── */}
      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={section}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted, marginBottom: '28px', textAlign: 'center' }}>
            Operators running on Meridia
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: C.border, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '72px' }}>
            {LOGOS.map(l => (
              <div key={l} style={{ background: C.white, padding: '28px 16px', textAlign: 'center', fontSize: '15px', fontWeight: 600, color: C.body, letterSpacing: '-0.01em' }}>
                {l}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {QUOTES.map((q, i) => (
              <Reveal key={i}>
                <div style={{ background: C.white, padding: '32px', borderRadius: '14px', border: `1px solid ${C.border}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.025em', color: C.accent, marginBottom: '6px' }}>{q.metric}</div>
                  <div style={{ fontSize: '12px', color: C.muted, fontWeight: 500, marginBottom: '22px' }}>{q.metricLabel}</div>
                  <p style={{ fontSize: '15px', lineHeight: 1.55, color: C.ink, margin: '0 0 24px', flex: 1 }}>
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink }}>{q.name}</div>
                    <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>{q.role}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ──────────────────────────────────────────────── */}
      <section style={section}>
        <div style={eyebrow}>Pricing</div>
        <h2 style={h2}>Transparent. Predictable. Founding rates locked for life.</h2>
        <p style={{ ...sub, marginBottom: '48px' }}>
          Prices shown in USD. Local-currency billing available in GBP, EUR, AUD, and CAD at checkout.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {PLANS.map(p => (
            <div key={p.name} style={{ background: p.highlight ? C.navy : C.white, color: p.highlight ? 'white' : C.ink, border: `1px solid ${p.highlight ? C.navy : C.border}`, borderRadius: '14px', padding: '32px 28px', position: 'relative' }}>
              {p.founding && (
                <div style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.emerald, background: 'rgba(15,155,110,0.1)', padding: '4px 8px', borderRadius: '100px' }}>Founding</div>
              )}
              <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '10px', color: p.highlight ? C.text70 : C.muted }}>{p.name}</div>
              <div style={{ fontSize: '40px', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '4px' }}>
                ${p.price}
                <span style={{ fontSize: '14px', fontWeight: 500, color: p.highlight ? C.text50 : C.muted, marginLeft: '4px' }}>/mo</span>
              </div>
              <div style={{ fontSize: '13px', color: p.highlight ? C.text70 : C.body, marginBottom: '24px', lineHeight: 1.5 }}>{p.tagline}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {p.features.map((f, i) => (
                  <li key={i} style={{ fontSize: '13px', color: p.highlight ? C.text70 : C.body, display: 'flex', gap: '10px' }}>
                    <span style={{ color: p.highlight ? C.emerald : C.accent }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '10px 16px', borderRadius: '8px', background: p.highlight ? 'white' : C.navy, color: p.highlight ? C.navy : 'white', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
                Start free
              </Link>
            </div>
          ))}
          <div style={{ background: C.bgAlt, border: `1px dashed ${C.borderStrong}`, borderRadius: '14px', padding: '32px 28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: C.muted, marginBottom: '10px' }}>Enterprise</div>
            <div style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', color: C.ink, marginBottom: '4px' }}>Talk to us</div>
            <div style={{ fontSize: '13px', color: C.body, marginBottom: '24px', lineHeight: 1.5 }}>Custom SLAs, dedicated infra, procurement-friendly terms.</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {['Volume pricing', 'Dedicated CSM', 'Security review support', 'SSO / SAML'].map((f) => (
                <li key={f} style={{ fontSize: '13px', color: C.body, display: 'flex', gap: '10px' }}>
                  <span style={{ color: C.accent }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/contact" style={{ display: 'block', textAlign: 'center', padding: '10px 16px', borderRadius: '8px', background: 'transparent', color: C.ink, textDecoration: 'none', fontWeight: 600, fontSize: '13px', border: `1px solid ${C.borderStrong}` }}>
              Contact sales
            </Link>
          </div>
        </div>
      </section>

      {/* ── Compliance / trust ──────────────────────────────────────────── */}
      <section style={{ background: C.navy, color: 'white' }}>
        <div style={{ ...section, padding: '72px 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '56px', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.text50, marginBottom: '18px' }}>Trust & security</div>
              <h3 style={{ fontSize: '34px', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0, color: 'white' }}>
                Built for enterprise procurement from day one.
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.1)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '12px', overflow: 'hidden' }}>
              {COMPLIANCE.map(c => (
                <div key={c.label} style={{ background: C.navy, padding: '22px 20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em', marginBottom: '6px' }}>{c.label}</div>
                  <div style={{ fontSize: '12px', color: C.text70 }}>{c.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section style={{ background: C.bg }}>
        <div style={{ ...section, textAlign: 'center', paddingTop: '112px', paddingBottom: '112px' }}>
          <h2 style={{ fontSize: 'clamp(40px, 5.2vw, 68px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.05, color: C.ink, margin: '0 auto 20px', maxWidth: '820px' }}>
            Run your global commerce operation on one platform.
          </h2>
          <p style={{ fontSize: '18px', lineHeight: 1.5, color: C.body, maxWidth: '560px', margin: '0 auto 36px' }}>
            14-day free trial. No credit card. Live on your first channel in under ten minutes.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ padding: '14px 24px', borderRadius: '8px', background: C.navy, color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }}>
              Start free
            </Link>
            <Link href="/contact" style={{ padding: '14px 24px', borderRadius: '8px', background: 'transparent', color: C.ink, textDecoration: 'none', fontWeight: 600, fontSize: '15px', border: `1px solid ${C.borderStrong}` }}>
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ background: C.navy, color: 'white', padding: '72px 48px 40px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '48px', marginBottom: '56px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '26px', height: '26px', background: 'white', color: C.navy, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>A</div>
                <span style={{ fontWeight: 600, fontSize: '15px', color: 'white' }}>Meridia</span>
              </div>
              <p style={{ fontSize: '13px', color: C.text70, lineHeight: 1.55, maxWidth: '280px', margin: 0 }}>
                The operating system for global commerce. Serving operators in 40+ countries.
              </p>
            </div>
            {[
              { title: 'Product', items: [['Features','/features'],['Integrations','/integrations'],['Pricing','/pricing'],['Changelog','/blog']] },
              { title: 'Company', items: [['About','/about'],['Blog','/blog'],['Contact','/contact']] },
              { title: 'Resources', items: [['Developer API','/developer'],['Security','/about'],['Status','/about']] },
              { title: 'Legal', items: [['Terms','/terms'],['Privacy','/privacy']] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text50, marginBottom: '16px' }}>{col.title}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {col.items.map(([label, href]) => (
                    <li key={href}><Link href={href} style={{ fontSize: '13px', color: C.text70, textDecoration: 'none' }}>{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid rgba(255,255,255,0.1)`, paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: C.text50 }}>© 2026 Meridia. All rights reserved.</div>
            <div style={{ fontSize: '12px', color: C.text50 }}>Serving commerce operators in 40+ countries.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
