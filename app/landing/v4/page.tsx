'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Auxio — Landing v4
// Direction: Editorial Financial. Bloomberg + NYT Magazine + Financial Times.
// Parchment paper, ink-black, vermillion accent, high-contrast Fraunces display
// against Geist body and Geist Mono numerics. Density, hairlines, tabular nums,
// drop caps, hand-built SVG. No emoji. No purple gradient.
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { Fraunces } from 'next/font/google'
import { useEffect, useRef, useState } from 'react'

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'opsz'],
  display: 'swap',
  variable: '--font-display',
})

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  paper:    '#f1ebdf',                  // warm parchment
  paperAlt: '#e7dfce',                  // raised paper
  ink:      '#0a0908',                  // true near-black
  inkSoft:  '#1f1c18',                  // softened ink
  rule:     'rgba(10,9,8,0.14)',        // hairline
  ruleSoft: 'rgba(10,9,8,0.08)',        // whisper
  muted:    '#6b6356',                  // warm taupe
  mutedDk:  '#3a3530',                  // taupe ink
  accent:   '#c8431a',                  // deep vermillion (NYT-magazine red)
  accentDk: '#9a3414',                  // pressed vermillion
  green:    '#2f5d3a',                  // forest, for positive deltas
  red:      '#8a2b1a',                  // oxblood, for negative deltas
}

const NAV = [
  { label: 'Platform',      href: '#platform' },
  { label: 'Why Auxio',     href: '#why' },
  { label: 'Pricing',       href: '#pricing' },
  { label: 'Customers',     href: '#customers' },
  { label: 'Documentation', href: '/integrations' },
]

// ── Counter (intersection-triggered) ─────────────────────────────────────────
function Counter({ to, prefix = '', suffix = '', decimals = 0 }: { to: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const start = performance.now()
      const dur = 1400
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur)
        const eased = 1 - Math.pow(1 - p, 3)
        setN(to * eased)
        if (p < 1) requestAnimationFrame(tick)
        else setN(to)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to])
  return <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>{prefix}{n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}</span>
}

// ── Hairline ─────────────────────────────────────────────────────────────────
const Rule = ({ color = C.rule, my = 0 }: { color?: string; my?: number }) => (
  <div style={{ height: 1, background: color, width: '100%', margin: `${my}px 0` }} />
)

// ── SVG: Auxio mark (custom) ─────────────────────────────────────────────────
const Mark = ({ size = 20, fill = C.ink }: { size?: number; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={fill} />
    <path d="M9.2 17 L14.8 17 L14.8 19.2 L9.2 19.2 Z" fill={fill} />
  </svg>
)

// ── Tickers (top market strip) ───────────────────────────────────────────────
const TICKERS: { code: string; symbol: string; rate: string; delta: number }[] = [
  { code: 'USD', symbol: '$',  rate: '1.0000', delta:  0.00 },
  { code: 'GBP', symbol: '£',  rate: '0.7842', delta: -0.12 },
  { code: 'EUR', symbol: '€',  rate: '0.9211', delta: +0.04 },
  { code: 'AUD', symbol: 'A$', rate: '1.5238', delta: +0.31 },
  { code: 'CAD', symbol: 'C$', rate: '1.3614', delta: -0.09 },
  { code: 'JPY', symbol: '¥',  rate: '149.21', delta: +0.42 },
]

// ── Pillars ──────────────────────────────────────────────────────────────────
const PILLARS = [
  {
    n: '01',
    head: 'Inventory & Listings',
    body: 'A single source of truth across every marketplace, in every region. Listings publish, sync, and reconcile in real time — eBay US to Amazon DE to Shopify AU — without the spreadsheet handoff.',
    figures: ['12 marketplaces', '0 oversells', '< 800ms sync'],
  },
  {
    n: '02',
    head: 'Orders & Fulfilment',
    body: 'Orders route automatically by SKU, region, carrier, and SLA. Print labels in a click. Surface exceptions before the customer notices. Fulfilment becomes operations, not firefighting.',
    figures: ['65% fewer errors', '40+ carriers', 'Per-region rules'],
  },
  {
    n: '03',
    head: 'Procurement & Forecasting',
    body: 'Demand forecasting on 90 days of velocity, by SKU and channel. Reorder thresholds before stockout. POs that auto-update inventory on receipt. The procurement loop, closed.',
    figures: ['90-day horizon', 'Per-SKU velocity', 'Auto-PO trigger'],
  },
  {
    n: '04',
    head: 'Profit & Analytics',
    body: 'True net margin after marketplace fees, fulfilment, packaging, ad spend, COGS, and tax — by SKU, by channel, by month. Reported in your home currency. Audited by your finance team.',
    figures: ['5 currencies', 'SKU-level P&L', 'Finance-grade'],
  },
]

// ── Incumbent obit cards ─────────────────────────────────────────────────────
const INCUMBENTS = [
  { name: 'ChannelAdvisor', est: 'est. 2001', price: 'Custom only',   weakness: 'Sales-led. 90-day onboarding. Built for the catalog era.' },
  { name: 'Brightpearl',    est: 'est. 2007', price: 'Custom only',   weakness: 'ERP-flavoured. Implementation projects measured in months.' },
  { name: 'Linnworks',      est: 'est. 2006', price: '$549+/mo',      weakness: 'Order-volume tax. Forecasting and AI as costly add-ons.' },
  { name: 'Feedonomics',    est: 'est. 2014', price: '$2,500+/mo',    weakness: 'Feed engineering, not operations. Specialist-led, not self-serve.' },
]

// ── Pricing ──────────────────────────────────────────────────────────────────
const PRICE = [
  { name: 'Starter',  price: 59,  desc: 'Solo operators on 1–2 marketplaces.',                tag: 'Founding rate',  cta: 'Begin' },
  { name: 'Growth',   price: 159, desc: 'Multi-channel sellers scaling across regions.',     tag: 'Most adopted',   cta: 'Begin', flag: true },
  { name: 'Scale',    price: 499, desc: 'High-volume operations needing the full platform.', tag: 'Best value',     cta: 'Begin' },
  { name: 'Enterprise', price: null, desc: 'Multi-region rollout, custom SLAs, white-label.', tag: 'By arrangement', cta: 'Speak with us' },
]

// ── Testimonials ─────────────────────────────────────────────────────────────
const QUOTES = [
  { q: 'We were running five marketplaces from four browser tabs. Auxio collapsed it to one screen and a P&L we can actually trust.', who: 'Sarah T.', role: 'Founder · Apparel · 6 channels', metric: '+34%', label: 'net margin, 60 days' },
  { q: 'I knew we were profitable. I did not know we were 8% profitable. Auxio showed me the real number, then showed me the listings to fix.', who: 'Marcus L.', role: 'Operator · Electronics · US/UK/EU', metric: '$5,400', label: 'saved vs Linnworks (year)' },
  { q: 'The forecasting model has paid for the platform twice over this quarter. We have not had an emergency reorder since November.', who: 'Priya K.', role: 'COO · Beauty · 500 SKUs', metric: '0', label: 'stockouts in Q1' },
]

// ── Compliance ───────────────────────────────────────────────────────────────
const COMPLIANCE = [
  ['SOC 2 Type II',    'In progress'],
  ['GDPR & CCPA',      'Compliant'],
  ['ISO 27001',        'Planned 2026'],
  ['Encrypted at rest','AES-256'],
  ['Multi-region',     'EU · US · APAC'],
  ['Data export',      'Customer-owned'],
]

export default function LandingV4() {
  const [tickerOffset, setTickerOffset] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTickerOffset(o => (o + 1) % 1000), 40)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className={fraunces.variable}
      style={{
        background: C.paper,
        color: C.ink,
        fontFamily: 'var(--font-geist), -apple-system, "Helvetica Neue", sans-serif',
        WebkitFontSmoothing: 'antialiased',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle grain texture overlay — adds physicality without weight */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.035 0" />
        </filter>
      </svg>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, mixBlendMode: 'multiply', opacity: 0.6 }}>
        <svg width="100%" height="100%"><rect width="100%" height="100%" filter="url(#grain)" /></svg>
      </div>

      {/* ── Masthead ───────────────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(241,235,223,0.92)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.ink }}>
            <Mark size={22} />
            <span style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 }}>Auxio</span>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase', marginLeft: 4, paddingLeft: 10, borderLeft: `1px solid ${C.rule}` }}>est. mmxxvi</span>
          </Link>
          <nav style={{ display: 'flex', gap: 26 }}>
            {NAV.map(n => (
              <a key={n.href} href={n.href} style={{ fontSize: 12.5, color: C.mutedDk, textDecoration: 'none', letterSpacing: '0.02em', position: 'relative' }}>{n.label}</a>
            ))}
          </nav>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: 12.5, color: C.mutedDk, textDecoration: 'none', padding: '8px 4px' }}>Sign in</Link>
            <Link href="/signup" style={{ fontSize: 12.5, color: C.paper, background: C.ink, padding: '9px 16px', borderRadius: 0, textDecoration: 'none', fontWeight: 500, letterSpacing: '0.01em', border: `1px solid ${C.ink}` }}>Begin trial →</Link>
          </div>
        </div>

        {/* Market ticker — running rates strip */}
        <div style={{ borderTop: `1px solid ${C.rule}`, background: C.paperAlt, overflow: 'hidden', height: 28, display: 'flex', alignItems: 'center' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', width: '100%', display: 'flex', alignItems: 'center', gap: 28, fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.mutedDk, letterSpacing: '0.04em' }}>
            <span style={{ color: C.accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em' }}>Live · Settlement Rates</span>
            <div style={{ height: 12, width: 1, background: C.rule }} />
            {TICKERS.map(t => (
              <div key={t.code} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ color: C.ink, fontWeight: 600 }}>{t.code}</span>
                <span>{t.symbol}{t.rate}</span>
                <span style={{ color: t.delta > 0 ? C.green : t.delta < 0 ? C.red : C.muted, fontWeight: 500 }}>
                  {t.delta > 0 ? '▲' : t.delta < 0 ? '▼' : '·'} {Math.abs(t.delta).toFixed(2)}%
                </span>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', color: C.muted }}>updated {String(Math.floor(tickerOffset / 4) % 60).padStart(2, '0')}s ago</div>
          </div>
        </div>
      </header>

      {/* ── Hero — editorial broadsheet ────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '88px 32px 72px', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.accent, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600 }}>Vol. 01 · No. 04</span>
            <Rule />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.muted, letterSpacing: '0.18em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>The Operations Issue</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display), Georgia, serif',
            fontSize: 'clamp(56px, 9vw, 132px)',
            fontWeight: 360,
            letterSpacing: '-0.035em',
            lineHeight: 0.94,
            color: C.ink,
            margin: 0,
            fontFeatureSettings: '"ss01", "ss02"',
          }}>
            The operating system <br />
            for <em style={{ fontStyle: 'italic', fontWeight: 320, color: C.accent }}>global commerce.</em>
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, marginTop: 56, alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 17, lineHeight: 1.62, color: C.mutedDk, margin: 0, maxWidth: 540 }}>
                <span style={{
                  float: 'left',
                  fontFamily: 'var(--font-display), Georgia, serif',
                  fontSize: 64,
                  lineHeight: 0.85,
                  fontWeight: 400,
                  color: C.ink,
                  marginRight: 10,
                  marginTop: 4,
                  paddingTop: 4,
                }}>A</span>
                uxio is the unified platform multichannel sellers run on worldwide. Inventory, orders, procurement, demand forecasting, and finance-grade P&amp;L — across every marketplace, every currency, every region. One operating layer where four point-tools used to live.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 32, alignItems: 'center' }}>
                <Link href="/signup" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: C.ink, color: C.paper,
                  padding: '15px 24px', textDecoration: 'none',
                  fontSize: 13.5, fontWeight: 500, letterSpacing: '0.02em',
                  border: `1px solid ${C.ink}`,
                }}>
                  Begin a 14-day trial
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 14 }}>→</span>
                </Link>
                <Link href="/contact" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'transparent', color: C.ink,
                  padding: '15px 24px', textDecoration: 'none',
                  fontSize: 13.5, fontWeight: 500, letterSpacing: '0.02em',
                  border: `1px solid ${C.ink}`,
                }}>
                  Request a private brief
                </Link>
              </div>
              <p style={{ marginTop: 22, fontSize: 11.5, color: C.muted, fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.06em' }}>
                No card · 14 days · ⌘ Cancel anytime
              </p>
            </div>

            {/* Hero figure — multi-currency P&L tearsheet, hand-built SVG */}
            <PnLTearsheet />
          </div>
        </div>
      </section>

      {/* ── Index strip — animated counters as a ledger ─────────────────────── */}
      <section style={{ position: 'relative', zIndex: 2, background: C.ink, color: C.paper, padding: '52px 32px', borderBottom: `1px solid ${C.ink}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 28 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.accent, letterSpacing: '0.22em', textTransform: 'uppercase' }}>The Auxio Index</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(241,235,223,0.18)' }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: 'rgba(241,235,223,0.5)' }}>Q1 · 2026</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
            {[
              { v: 3200000, p: '$', s: '+', label: 'GMV under management',     note: 'monthly across all merchants' },
              { v: 40,      s: '+', label: 'Countries served',                 note: 'home & marketplace currencies' },
              { v: 12,      label: 'Marketplaces integrated',                  note: 'eBay · Amazon · Shopify · …' },
              { v: 65,      s: '%', label: 'Reduction in order errors',         note: 'vs prior tooling, post-implementation' },
              { v: 10,      s: ' min', label: 'Median time to first dashboard', note: 'OAuth in, listings populated' },
            ].map((m, i) => (
              <div key={i} style={{ borderLeft: i === 0 ? 'none' : '1px solid rgba(241,235,223,0.14)', paddingLeft: i === 0 ? 0 : 24, paddingRight: 16 }}>
                <div style={{
                  fontFamily: 'var(--font-display), Georgia, serif',
                  fontSize: 'clamp(40px, 5vw, 64px)',
                  fontWeight: 360,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: C.paper,
                  marginBottom: 14,
                }}>
                  <Counter to={m.v} prefix={m.p} suffix={m.s} />
                </div>
                <div style={{ fontSize: 12.5, color: C.paper, fontWeight: 500, letterSpacing: '0.01em', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(241,235,223,0.55)', fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.04em' }}>{m.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lead story / problem ────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '96px 32px', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '160px 1fr 1fr', gap: 56 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.accent, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600 }}>Premise</div>
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.muted, marginTop: 4 }}>§ 1.0</div>
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(34px, 4vw, 52px)', fontWeight: 380, letterSpacing: '-0.025em', lineHeight: 1.05, color: C.ink, margin: 0 }}>
              Selling on five marketplaces is five businesses pretending to be one.
            </h2>
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.7, color: C.mutedDk }}>
            <p style={{ margin: '0 0 16px' }}>
              Five inventory systems. Five P&amp;Ls. Five truths about how much money you are actually making. The legacy stack — ChannelAdvisor for catalog, Linnworks for orders, Brightpearl for ERP, Feedonomics for feeds — was assembled one tool at a time, by people who could not yet see commerce as a single operating problem.
            </p>
            <p style={{ margin: 0 }}>
              Auxio is the platform that does. One ledger. One inventory. One truth. Built from the operations layer up, not the listings layer down.
            </p>
          </div>
        </div>
      </section>

      {/* ── Platform pillars ────────────────────────────────────────────────── */}
      <section id="platform" style={{ position: 'relative', zIndex: 2, padding: '96px 32px', background: C.paperAlt, borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 56 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.accent, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600 }}>The Platform</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.muted }}>§ 2.0 — Four pillars</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, borderTop: `1px solid ${C.ink}`, borderLeft: `1px solid ${C.ink}` }}>
            {PILLARS.map((p, i) => (
              <article key={p.n} style={{ borderRight: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}`, padding: '40px 36px', background: C.paper, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.accent, letterSpacing: '0.18em', fontWeight: 600 }}>{p.n} / 04</span>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Pillar</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 30, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1, color: C.ink, margin: '0 0 16px' }}>{p.head}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.mutedDk, margin: '0 0 24px' }}>{p.body}</p>
                <Rule />
                <div style={{ display: 'flex', gap: 28, marginTop: 16, fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.05em' }}>
                  {p.figures.map(f => <span key={f}>{f}</span>)}
                </div>
                <PillarFigure n={i} />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Auxio — incumbent comparison ────────────────────────────────── */}
      <section id="why" style={{ position: 'relative', zIndex: 2, padding: '96px 32px', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.accent, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600 }}>Why Auxio</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.muted }}>§ 3.0 — The incumbents</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.08, color: C.ink, margin: '0 0 56px', maxWidth: 760 }}>
            The category was built one tool at a time. <em style={{ color: C.accent, fontStyle: 'italic', fontWeight: 360 }}>We rebuilt it once.</em>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: `1px solid ${C.rule}` }}>
            {INCUMBENTS.map((inc, i) => (
              <div key={inc.name} style={{ padding: '32px 24px', borderRight: i < INCUMBENTS.length - 1 ? `1px solid ${C.rule}` : 'none', borderBottom: `1px solid ${C.rule}`, position: 'relative' }}>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>{inc.est}</div>
                <h4 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 24, fontWeight: 400, color: C.ink, margin: '0 0 6px', letterSpacing: '-0.015em' }}>
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    {inc.name}
                    <span style={{ position: 'absolute', left: -2, right: -2, top: '52%', height: 1.5, background: C.accent, transform: 'rotate(-3deg)' }} />
                  </span>
                </h4>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11.5, color: C.mutedDk, marginBottom: 18 }}>{inc.price}</div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: C.muted, margin: 0, fontStyle: 'italic' }}>{inc.weakness}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: '120px 1fr', gap: 32, alignItems: 'start' }}>
            <div style={{ borderTop: `2px solid ${C.accent}`, paddingTop: 18 }}>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.accent, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase' }}>Auxio</div>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, marginTop: 4 }}>est. mmxxvi</div>
            </div>
            <div>
              <p style={{ fontSize: 18, lineHeight: 1.6, color: C.ink, margin: 0, fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 380, letterSpacing: '-0.012em' }}>
                One platform. Self-serve in ten minutes. Multi-currency from the first SKU. Procurement, fulfilment, listings, and finance-grade P&amp;L on a single ledger. Founding member rate from <span style={{ color: C.accent }}>$59 per month</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Customers / pull-quote ──────────────────────────────────────────── */}
      <section id="customers" style={{ position: 'relative', zIndex: 2, padding: '96px 32px', background: C.paperAlt, borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 56 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.accent, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600 }}>The Operators</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.muted }}>§ 4.0 — Three accounts</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {QUOTES.map((q, i) => (
              <figure key={i} style={{ margin: 0, padding: 0, borderTop: `1px solid ${C.ink}`, paddingTop: 28 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22 }}>
                  <div style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 36, fontWeight: 380, color: C.accent, letterSpacing: '-0.02em', lineHeight: 1 }}>{q.metric}</div>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, letterSpacing: '0.06em', textAlign: 'right', textTransform: 'uppercase', maxWidth: 130 }}>{q.label}</div>
                </div>
                <blockquote style={{ margin: '0 0 24px', fontFamily: 'var(--font-display), Georgia, serif', fontSize: 21, lineHeight: 1.4, color: C.ink, fontWeight: 380, letterSpacing: '-0.01em' }}>
                  &ldquo;{q.q}&rdquo;
                </blockquote>
                <figcaption>
                  <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{q.who}</div>
                  <div style={{ fontSize: 11.5, color: C.muted, fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.04em', marginTop: 2 }}>{q.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing — tearsheet ─────────────────────────────────────────────── */}
      <section id="pricing" style={{ position: 'relative', zIndex: 2, padding: '96px 32px', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.accent, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600 }}>Schedule of Fees</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.muted }}>§ 5.0 — All currencies on /pricing</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.08, color: C.ink, margin: '0 0 48px', maxWidth: 800 }}>
            Transparent, flat-rate. <em style={{ color: C.accent, fontStyle: 'italic', fontWeight: 360 }}>Never a percentage of your revenue.</em>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: `1px solid ${C.ink}`, borderLeft: `1px solid ${C.ink}` }}>
            {PRICE.map(p => (
              <div key={p.name} style={{ borderRight: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}`, padding: '32px 28px', background: p.flag ? C.ink : C.paper, color: p.flag ? C.paper : C.ink, position: 'relative' }}>
                {p.flag && (
                  <div style={{ position: 'absolute', top: -1, left: -1, right: -1, height: 4, background: C.accent }} />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
                  <span style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 22, fontWeight: 420, letterSpacing: '-0.01em' }}>{p.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: p.flag ? 'rgba(241,235,223,0.6)' : C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{p.tag}</span>
                </div>
                {p.price !== null ? (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, fontFamily: 'var(--font-display), Georgia, serif' }}>
                      <span style={{ fontSize: 16, color: p.flag ? 'rgba(241,235,223,0.65)' : C.muted, fontWeight: 400 }}>$</span>
                      <span style={{ fontSize: 56, fontWeight: 360, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{p.price}</span>
                      <span style={{ fontSize: 13, color: p.flag ? 'rgba(241,235,223,0.65)' : C.muted, marginLeft: 4 }}>/ mo</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 36, fontWeight: 380, marginBottom: 20, letterSpacing: '-0.02em' }}>By arrangement</div>
                )}
                <p style={{ fontSize: 13, lineHeight: 1.55, color: p.flag ? 'rgba(241,235,223,0.7)' : C.muted, margin: '0 0 28px', minHeight: 60 }}>{p.desc}</p>
                <Link href={p.price === null ? '/contact' : '/signup'} style={{
                  display: 'block', textAlign: 'center', padding: '12px 16px',
                  background: p.flag ? C.paper : C.ink,
                  color: p.flag ? C.ink : C.paper,
                  border: `1px solid ${p.flag ? C.paper : C.ink}`,
                  fontSize: 12.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase',
                  textDecoration: 'none',
                }}>{p.cta}</Link>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
            <span>Billed monthly · USD shown · GBP £49 · EUR €55 · AUD A$89 · CAD C$79</span>
            <Link href="/pricing" style={{ color: C.accent, textDecoration: 'none' }}>View full schedule →</Link>
          </div>
        </div>
      </section>

      {/* ── Compliance — fineprint as feature ───────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '64px 32px', background: C.ink, color: C.paper, borderBottom: `1px solid ${C.ink}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 28 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.accent, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600 }}>Compliance & Infrastructure</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(241,235,223,0.18)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0 }}>
            {COMPLIANCE.map(([k, v], i) => (
              <div key={k} style={{ borderLeft: i === 0 ? 'none' : '1px solid rgba(241,235,223,0.14)', paddingLeft: i === 0 ? 0 : 20, paddingRight: 12 }}>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: 'rgba(241,235,223,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{k}</div>
                <div style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 18, color: C.paper, fontWeight: 380, letterSpacing: '-0.01em' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '120px 32px', borderBottom: `1px solid ${C.rule}`, textAlign: 'center' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', marginBottom: 28 }}>
            <Rule />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.accent, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap' }}>Coda</span>
            <Rule />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(48px, 6vw, 84px)', fontWeight: 380, letterSpacing: '-0.035em', lineHeight: 1.0, color: C.ink, margin: '0 0 28px' }}>
            Run your operation <br /><em style={{ color: C.accent, fontStyle: 'italic', fontWeight: 360 }}>on one platform.</em>
          </h2>
          <p style={{ fontSize: 17, color: C.mutedDk, lineHeight: 1.6, margin: '0 auto 40px', maxWidth: 580 }}>
            Fourteen days. No card. Connect a marketplace and watch the ledger populate in under ten minutes. We will be here when you are ready to scale.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/signup" style={{ background: C.ink, color: C.paper, padding: '17px 32px', textDecoration: 'none', fontSize: 14, fontWeight: 500, letterSpacing: '0.02em', border: `1px solid ${C.ink}` }}>
              Begin your trial
            </Link>
            <Link href="/contact" style={{ background: 'transparent', color: C.ink, padding: '17px 32px', textDecoration: 'none', fontSize: 14, fontWeight: 500, letterSpacing: '0.02em', border: `1px solid ${C.ink}` }}>
              Speak with founders
            </Link>
          </div>
        </div>
      </section>

      {/* ── Colophon / footer ───────────────────────────────────────────────── */}
      <footer style={{ position: 'relative', zIndex: 2, padding: '56px 32px 40px', background: C.paper }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Mark size={20} />
                <span style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}>Auxio</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: C.mutedDk, margin: 0, maxWidth: 320, fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic', fontWeight: 380 }}>
                The operating system for global commerce.
              </p>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 18, fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.06em' }}>
                Set in Fraunces &amp; Geist · est. mmxxvi
              </p>
            </div>
            {[
              { h: 'Platform', l: [['Inventory', '/features'], ['Orders', '/orders'], ['Procurement', '/purchase-orders'], ['Profit', '/financials']] },
              { h: 'Compare',  l: [['ChannelAdvisor', '/vs/channelAdvisor'], ['Brightpearl', '/vs/brightpearl'], ['Linnworks', '/vs/linnworks'], ['Feedonomics', '/vs/baselinker']] },
              { h: 'Company',  l: [['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
            ].map(col => (
              <div key={col.h}>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.accent, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 14 }}>{col.h}</div>
                {col.l.map(([label, href]) => (
                  <Link key={label} href={href} style={{ display: 'block', fontSize: 13, color: C.mutedDk, textDecoration: 'none', marginBottom: 8 }}>{label}</Link>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.rule}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.04em' }}>
            <span>© MMXXVI · NPX Solutions · All rights reserved</span>
            <span>Worldwide · Multi-currency · Multichannel</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Hero figure — multi-currency P&L tearsheet (hand-built SVG/CSS)
// ════════════════════════════════════════════════════════════════════════════
function PnLTearsheet() {
  return (
    <div style={{
      background: C.paper,
      border: `1px solid ${C.ink}`,
      boxShadow: `8px 8px 0 ${C.ink}`,
      padding: 0,
      position: 'relative',
    }}>
      {/* Tearsheet header */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.ink}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.ink, color: C.paper }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Mark size={14} fill={C.paper} />
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}>P&amp;L · Live · Q1-2026</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['$', '£', '€', 'A$', 'C$'].map(s => (
            <span key={s} style={{ fontSize: 10, fontFamily: 'var(--font-mono), monospace', padding: '3px 6px', background: 'rgba(241,235,223,0.12)', color: C.paper, letterSpacing: '0.04em' }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Body — grid ledger */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9.5, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Net margin · Trailing 30d</div>
            <div style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 52, fontWeight: 380, letterSpacing: '-0.035em', lineHeight: 1, color: C.ink, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>
              $128,402<span style={{ fontSize: 22, color: C.muted, fontWeight: 400 }}>.18</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.green, letterSpacing: '0.04em' }}>▲ +24.6% MoM</div>
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9.5, color: C.muted, letterSpacing: '0.06em', marginTop: 4 }}>vs. revenue $612,108</div>
          </div>
        </div>

        {/* Channel rows */}
        <Rule />
        <div style={{ marginTop: 12 }}>
          {[
            { ch: 'eBay US',    cur: '$',  rev: '184,221', margin: '23.4%', d: +1.8 },
            { ch: 'Amazon DE',  cur: '€',  rev: '142,008', margin: '19.1%', d: +0.4 },
            { ch: 'Shopify AU', cur: 'A$', rev: '88,442',  margin: '28.2%', d: +3.1 },
            { ch: 'Amazon UK',  cur: '£',  rev: '92,116',  margin: '17.8%', d: -0.6 },
            { ch: 'Etsy CA',    cur: 'C$', rev: '54,901',  margin: '31.5%', d: +2.0 },
          ].map(r => (
            <div key={r.ch} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.5fr 1fr 0.8fr 0.6fr', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.ruleSoft}`, fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.inkSoft, alignItems: 'center', letterSpacing: '0.02em' }}>
              <span style={{ color: C.ink, fontWeight: 600 }}>{r.ch}</span>
              <span style={{ color: C.muted }}>{r.cur}</span>
              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.rev}</span>
              <span style={{ textAlign: 'right', color: C.ink, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{r.margin}</span>
              <span style={{ textAlign: 'right', color: r.d >= 0 ? C.green : C.red, fontVariantNumeric: 'tabular-nums' }}>{r.d >= 0 ? '+' : ''}{r.d.toFixed(1)}</span>
            </div>
          ))}
        </div>

        {/* Mini chart — sparkline */}
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9.5, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Cumulative · 30d</div>
            <div style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 18, color: C.ink, letterSpacing: '-0.01em', marginTop: 2 }}>Margin trend ↗</div>
          </div>
          <svg width="200" height="48" viewBox="0 0 200 48">
            <defs>
              <linearGradient id="sparkfill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={C.accent} stopOpacity={0.18} />
                <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d="M0,40 L20,38 L40,32 L60,34 L80,28 L100,24 L120,26 L140,18 L160,14 L180,10 L200,6 L200,48 L0,48 Z" fill="url(#sparkfill)" />
            <path d="M0,40 L20,38 L40,32 L60,34 L80,28 L100,24 L120,26 L140,18 L160,14 L180,10 L200,6" fill="none" stroke={C.accent} strokeWidth={1.5} />
            {[[0,40],[60,34],[120,26],[180,10],[200,6]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r={2.2} fill={C.paper} stroke={C.accent} strokeWidth={1.5} />
            ))}
          </svg>
        </div>
      </div>

      {/* Footer rule */}
      <div style={{ padding: '10px 20px', borderTop: `1px solid ${C.ink}`, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono), monospace', fontSize: 9.5, color: C.muted, letterSpacing: '0.08em' }}>
        <span>auxio · ledger v3</span>
        <span>fx settled hourly · all figures audited</span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Pillar figures — small accent SVGs per pillar
// ════════════════════════════════════════════════════════════════════════════
function PillarFigure({ n }: { n: number }) {
  const common = { position: 'absolute' as const, right: 28, top: 28, opacity: 0.9 }
  if (n === 0) {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={common} aria-hidden>
        <rect x="6"  y="14" width="14" height="36" stroke={C.ink} strokeWidth="1.2" />
        <rect x="25" y="20" width="14" height="30" stroke={C.ink} strokeWidth="1.2" />
        <rect x="44" y="8"  width="14" height="42" stroke={C.ink} strokeWidth="1.2" />
        <rect x="44" y="8"  width="14" height="6"  fill={C.accent} />
        <line x1="0" y1="55" x2="64" y2="55" stroke={C.ink} strokeWidth="1.2" />
      </svg>
    )
  }
  if (n === 1) {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={common} aria-hidden>
        <circle cx="32" cy="32" r="22" stroke={C.ink} strokeWidth="1.2" />
        <path d="M32 32 L32 12" stroke={C.accent} strokeWidth="1.5" />
        <path d="M32 32 L48 40" stroke={C.ink} strokeWidth="1.2" />
        <circle cx="32" cy="32" r="2" fill={C.ink} />
        {[0, 90, 180, 270].map(a => (
          <line key={a} x1="32" y1="10" x2="32" y2="14" stroke={C.ink} strokeWidth="1.2" transform={`rotate(${a} 32 32)`} />
        ))}
      </svg>
    )
  }
  if (n === 2) {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={common} aria-hidden>
        <path d="M6 50 Q 18 18 32 32 T 58 14" stroke={C.ink} strokeWidth="1.2" fill="none" />
        <path d="M6 50 Q 18 18 32 32 T 58 14" stroke={C.accent} strokeWidth="1.2" strokeDasharray="2 3" fill="none" transform="translate(0 -8)" />
        <line x1="0"  y1="56" x2="64" y2="56" stroke={C.ink} strokeWidth="1.2" />
        <line x1="6"  y1="56" x2="6"  y2="6"  stroke={C.ink} strokeWidth="1.2" />
        {[14, 32, 50].map(x => <circle key={x} cx={x} cy={56} r="1.5" fill={C.ink} />)}
      </svg>
    )
  }
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={common} aria-hidden>
      <rect x="8"  y="8"  width="48" height="48" stroke={C.ink} strokeWidth="1.2" />
      <line x1="8"  y1="22" x2="56" y2="22" stroke={C.ink} strokeWidth="0.8" />
      <line x1="8"  y1="36" x2="56" y2="36" stroke={C.ink} strokeWidth="0.8" />
      <line x1="8"  y1="50" x2="56" y2="50" stroke={C.ink} strokeWidth="0.8" />
      <line x1="32" y1="8"  x2="32" y2="56" stroke={C.ink} strokeWidth="0.8" />
      <rect x="34" y="24" width="20" height="10" fill={C.accent} opacity="0.4" />
      <rect x="34" y="38" width="14" height="10" fill={C.accent} />
    </svg>
  )
}
