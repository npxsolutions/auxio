'use client'

// V3 — Bold founder / dark / cinematic
// References: linear.app dark, raycast.com, arc.net, superhuman pre-acquisition
// Aesthetic: dark hero, deep purple gradients, radial glows, bento grid,
// weight-300 wispy display headlines, weight-700 CTAs. $1B feel.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ── Tokens (dark) ─────────────────────────────────────────────────────────────
const C = {
  bg:        '#07060f',
  surface:   '#0d0b1a',
  surface2:  '#12102a',
  cream:     '#f5f0e8',
  purple:    '#e8863f',
  purple2:   '#e8863f',
  purpleGlow:'rgba(124,106,247,0.35)',
  magenta:   '#c64fe8',
  cyan:      '#5ee6ff',
  green:     '#4ade80',
  border:    'rgba(255,255,255,0.08)',
  borderHi:  'rgba(255,255,255,0.14)',
  text:      '#f5f0e8',
  text70:    'rgba(245,240,232,0.7)',
  text50:    'rgba(245,240,232,0.5)',
  text30:    'rgba(245,240,232,0.3)',
}

// ── Counter (IntersectionObserver, rAF) ────────────────────────────────────
function Counter({ to, prefix = '', suffix = '', duration = 1800 }: { to: number; prefix?: string; suffix?: string; duration?: number }) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const t0 = performance.now()
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setN(Math.floor(eased * to))
        if (p < 1) requestAnimationFrame(step)
        else setN(to)
      }
      requestAnimationFrame(step)
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to, duration])
  return <span ref={ref}>{prefix}{n.toLocaleString()}{suffix}</span>
}

const NAV = [
  { label: 'Platform',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Customers',    href: '/about' },
  { label: 'Blog',         href: '/blog' },
]

const MARKETPLACES = [
  'Amazon', 'eBay', 'Shopify', 'Walmart', 'Etsy', 'TikTok Shop', 'OnBuy',
  'Mirakl', 'Otto', 'Allegro', 'Cdiscount', 'Rakuten', 'Mercado Libre',
  'Bol.com', 'Zalando', 'Kaufland',
]

const COMPETITORS = [
  { name: 'Palvento',          us: true },
  { name: 'Linnworks',      us: false },
  { name: 'Brightpearl',    us: false },
  { name: 'ChannelAdvisor', us: false },
  { name: 'Feedonomics',    us: false },
]

const COMPARISON_ROWS: Array<{ label: string; values: Array<boolean | string> }> = [
  { label: 'Live multi-currency P&L',       values: [true,  false, false, false, false] },
  { label: 'AI commerce agent',             values: [true,  false, false, false, false] },
  { label: 'Repricing engine included',     values: [true,  false, false, '$',   false] },
  { label: 'Demand forecasting',            values: [true,  false, true,  true,  false] },
  { label: 'Procurement loop',              values: [true,  true,  true,  false, false] },
  { label: 'Real-time marketplace sync',    values: [true,  true,  true,  true,  true]  },
  { label: 'Transparent pricing',           values: [true,  true,  false, false, false] },
  { label: '10-minute onboarding',          values: [true,  false, false, false, false] },
]

const TESTIMONIALS = [
  { quote: 'Palvento replaced four tools and shaved $4,200 a month off our SaaS bill. The P&L view alone is worth the seat.', name: 'Sarah T.',  role: 'Apparel / US + UK',  metric: '$4,200/mo', metricLabel: 'SaaS savings' },
  { quote: 'Went from 8% to 22% net margin in 60 days. The repricing engine found money we didn\'t know we were leaving on the table.',                name: 'Marcus L.', role: 'Electronics / 4 channels', metric: '+$680k', metricLabel: 'annualised margin' },
  { quote: 'We onboarded in 10 minutes. By the end of week one we\'d forecasted our way out of three stockouts that would have cost us six figures.', name: 'Priya K.',  role: 'Health / 500+ SKUs', metric: '$120k',    metricLabel: 'stockouts avoided' },
]

const TIERS = [
  { name: 'Starter', price: 59,  desc: 'Solo operators, up to 2 channels.', features: ['Up to 2,000 orders/mo', 'Multi-channel sync', 'Basic P&L', 'Email support'] },
  { name: 'Growth',  price: 159, desc: 'Multi-channel teams scaling fast.', features: ['Up to 15,000 orders/mo', 'Repricing engine', 'AI agent (50k tasks)', 'Forecasting + procurement'], highlight: true },
  { name: 'Scale',   price: 499, desc: 'Global brands, unlimited channels.',features: ['Unlimited orders', 'Multi-warehouse + multi-currency', 'Dedicated success manager', 'SLA + SSO'] },
]

// ── Atoms ─────────────────────────────────────────────────────────────────
function Check() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 10, background: 'rgba(74,222,128,0.15)', color: C.green, fontSize: 12, fontWeight: 700 }}>✓</span>
  )
}
function Dash() {
  return (
    <span style={{ display: 'inline-block', width: 14, height: 2, background: C.text30, borderRadius: 2, verticalAlign: 'middle' }} />
  )
}

// ── Mini visuals (CSS art) for bento cards ─────────────────────────────────
function PnlArt() {
  return (
    <div style={{ position: 'relative', height: 160, padding: 16, borderRadius: 12, background: 'linear-gradient(180deg, rgba(124,106,247,0.08), rgba(0,0,0,0))', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.text50, marginBottom: 8 }}>
        <span>Net margin · live</span><span style={{ color: C.green }}>+12.4%</span>
      </div>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 22, fontWeight: 300, letterSpacing: '-0.02em', color: C.cream }}>$412,880.24</div>
      <svg viewBox="0 0 200 60" style={{ width: '100%', height: 60, marginTop: 8 }}>
        <defs>
          <linearGradient id="pnl" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={C.purple} stopOpacity="0.5" />
            <stop offset="1" stopColor={C.purple} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,50 L20,42 L40,46 L60,30 L80,34 L100,22 L120,26 L140,14 L160,18 L180,8 L200,12 L200,60 L0,60 Z" fill="url(#pnl)" />
        <path d="M0,50 L20,42 L40,46 L60,30 L80,34 L100,22 L120,26 L140,14 L160,18 L180,8 L200,12" stroke={C.purple} strokeWidth="1.5" fill="none" />
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 10, color: C.text50 }}>
        <span>USD</span><span>GBP</span><span>EUR</span><span>AUD</span><span>CAD</span>
      </div>
    </div>
  )
}
function AgentArt() {
  return (
    <div style={{ position: 'relative', height: 160, padding: 16, borderRadius: 12, background: `radial-gradient(120% 80% at 20% 0%, ${C.purpleGlow}, transparent 60%)`, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 999, background: 'rgba(124,106,247,0.15)', border: `1px solid ${C.borderHi}`, fontSize: 11, color: C.cream }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: C.green, boxShadow: `0 0 8px ${C.green}` }} /> Agent working
      </div>
      <div style={{ marginTop: 14, fontSize: 12, color: C.text70, lineHeight: 1.6 }}>
        <div>→ Detected 14 SKUs priced below floor</div>
        <div>→ Re-listed 3 eBay bundles at +9% margin</div>
        <div>→ Drafted PO #4820 for Supplier Tailwind</div>
      </div>
    </div>
  )
}
function ReprizArt() {
  return (
    <div style={{ position: 'relative', height: 160, padding: 16, borderRadius: 12, background: 'linear-gradient(135deg, rgba(198,79,232,0.08), rgba(0,0,0,0))', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <div style={{ fontSize: 11, color: C.text50, marginBottom: 10 }}>Repricing · last 60s</div>
      {[{ sku: 'AUX-229', old: '$24.99', now: '$26.40', d: '+5.6%' }, { sku: 'AUX-088', old: '$89.00', now: '$84.50', d: '−5.0%' }, { sku: 'AUX-441', old: '$12.20', now: '$13.05', d: '+7.0%' }].map(r => (
        <div key={r.sku} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, fontSize: 11, padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontFamily: 'ui-monospace, monospace' }}>
          <span style={{ color: C.text70 }}>{r.sku}</span>
          <span style={{ color: C.text50, textDecoration: 'line-through' }}>{r.old}</span>
          <span style={{ color: C.cream }}>{r.now}</span>
          <span style={{ color: r.d.startsWith('+') ? C.green : C.magenta }}>{r.d}</span>
        </div>
      ))}
    </div>
  )
}
function ForecastArt() {
  return (
    <div style={{ position: 'relative', height: 160, padding: 16, borderRadius: 12, background: 'linear-gradient(180deg, rgba(94,230,255,0.06), rgba(0,0,0,0))', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <div style={{ fontSize: 11, color: C.text50, marginBottom: 8 }}>Demand · 30d forecast</div>
      <div style={{ display: 'flex', alignItems: 'end', gap: 4, height: 90 }}>
        {[40, 55, 48, 62, 70, 58, 75, 82, 70, 88, 95, 84, 92, 100].map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h}%`, background: `linear-gradient(180deg, ${C.cyan}, rgba(94,230,255,0.1))`, borderRadius: 2, opacity: i > 6 ? 0.45 : 1 }} />
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 10, color: C.text50, display: 'flex', justifyContent: 'space-between' }}>
        <span>actual</span><span style={{ color: C.cyan }}>predicted · 94% conf</span>
      </div>
    </div>
  )
}
function ProcurementArt() {
  return (
    <div style={{ position: 'relative', height: 160, padding: 16, borderRadius: 12, background: 'linear-gradient(135deg, rgba(74,222,128,0.06), rgba(0,0,0,0))', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <svg viewBox="0 0 220 120" style={{ width: '100%', height: '100%' }}>
        {['Sales', 'Forecast', 'PO', 'Receive', 'Stock'].map((lbl, i) => (
          <g key={lbl} transform={`translate(${i * 44 + 8}, 40)`}>
            <circle r="14" fill={i === 2 ? C.purple : 'rgba(255,255,255,0.06)'} stroke={C.borderHi} />
            <text y="40" textAnchor="middle" fontSize="9" fill={C.text70}>{lbl}</text>
          </g>
        ))}
        <path d="M36,40 Q54,20 80,40 T124,40 T168,40 T212,40" stroke={C.purple} strokeWidth="1" fill="none" strokeDasharray="2 3" />
      </svg>
    </div>
  )
}
function SyncArt() {
  return (
    <div style={{ position: 'relative', height: 160, padding: 16, borderRadius: 12, background: `radial-gradient(100% 80% at 50% 50%, ${C.purpleGlow}, transparent 70%)`, border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${C.borderHi}` }} />
        <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', border: `1px solid ${C.border}` }} />
        <div style={{ position: 'absolute', inset: 28, borderRadius: '50%', border: `1px solid ${C.border}` }} />
        <div style={{ position: 'absolute', inset: 48, borderRadius: '50%', background: C.purple, boxShadow: `0 0 40px ${C.purpleGlow}` }} />
        {[0, 60, 120, 180, 240, 300].map(deg => (
          <div key={deg} style={{ position: 'absolute', left: '50%', top: '50%', width: 8, height: 8, marginLeft: -4, marginTop: -4, borderRadius: 4, background: C.cream, transform: `rotate(${deg}deg) translateY(-60px)` }} />
        ))}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────
export default function LandingV3() {
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', background: 'rgba(7,6,15,0.65)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.cream }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg, ${C.purple}, ${C.magenta})`, boxShadow: `0 0 18px ${C.purpleGlow}` }} />
            <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>Palvento</span>
          </Link>
          <div style={{ display: 'flex', gap: 28 }}>
            {NAV.map(n => (
              <Link key={n.href} href={n.href} style={{ color: C.text70, fontSize: 14, textDecoration: 'none', fontWeight: 400 }}>{n.label}</Link>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/login" style={{ color: C.text70, fontSize: 14, textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" style={{ background: C.cream, color: '#0a0812', fontSize: 14, fontWeight: 600, padding: '8px 14px', borderRadius: 8, textDecoration: 'none' }}>Start free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '120px 32px 96px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(60% 50% at 50% 0%, ${C.purpleGlow}, transparent 70%), radial-gradient(40% 40% at 80% 30%, rgba(198,79,232,0.18), transparent 70%), radial-gradient(40% 40% at 10% 40%, rgba(94,230,255,0.08), transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(60% 60% at 50% 30%, black, transparent)', WebkitMaskImage: 'radial-gradient(60% 60% at 50% 30%, black, transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderHi}`, fontSize: 12, color: C.text70, marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
            Palvento v4 · now with live multi-currency P&L
          </div>
          <h1 style={{ fontSize: 'clamp(56px, 9vw, 112px)', fontWeight: 300, letterSpacing: '-0.045em', lineHeight: 0.98, margin: 0, color: C.cream }}>
            The OS for<br />
            <span style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.magenta} 50%, ${C.cyan} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 300, fontStyle: 'italic' }}>global commerce.</span>
          </h1>
          <p style={{ maxWidth: 620, margin: '32px auto 0', fontSize: 19, lineHeight: 1.55, color: C.text70, fontWeight: 400 }}>
            One platform for every marketplace, every currency, every warehouse. Built for the operators running global brands — not the ones managing spreadsheets.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ background: C.cream, color: '#0a0812', fontSize: 15, fontWeight: 700, padding: '14px 22px', borderRadius: 10, textDecoration: 'none', boxShadow: `0 10px 40px rgba(245,240,232,0.12)` }}>
              Start free — 14 days
            </Link>
            <Link href="/contact" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)', border: `1px solid ${C.borderHi}`, color: C.cream, fontSize: 15, fontWeight: 600, padding: '14px 22px', borderRadius: 10, textDecoration: 'none' }}>
              Book a demo →
            </Link>
          </div>
          <div style={{ marginTop: 28, fontSize: 12, color: C.text50 }}>No credit card · 10-minute onboarding · Cancel anytime</div>
        </div>
      </section>

      {/* ── Marquee ────────────────────────────────────────────────────── */}
      <section style={{ padding: '32px 0 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', fontSize: 12, color: C.text50, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
          Connected to every channel you sell on
        </div>
        <div style={{ position: 'relative', maskImage: 'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)' }}>
          <div style={{ display: 'flex', gap: 48, animation: 'palventoMarquee 42s linear infinite', width: 'max-content' }}>
            {[...MARKETPLACES, ...MARKETPLACES].map((m, i) => (
              <div key={`${m}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: `linear-gradient(135deg, ${C.purple}, ${C.magenta})` }} />
                <span style={{ fontSize: 14, color: C.cream, fontWeight: 500 }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes palventoMarquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </section>

      {/* ── Bento ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 32px', position: 'relative' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ maxWidth: 680, marginBottom: 56 }}>
            <div style={{ fontSize: 12, color: C.purple, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>The platform</div>
            <h2 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 300, letterSpacing: '-0.035em', lineHeight: 1.02, margin: 0, color: C.cream }}>
              Every tool your operation needs.<br /><span style={{ color: C.text50 }}>In one cinematic control plane.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
            {/* Big: P&L */}
            <BentoCard span={4} eyebrow="Live multi-currency P&L" title="Know your real number, in real time." body="Revenue, marketplace fees, COGS, postage, VAT — converted live across USD, GBP, EUR, AUD and CAD. Net margin you can actually trust." art={<PnlArt />} />
            {/* Agent */}
            <BentoCard span={2} eyebrow="AI agent" title="An operator that never sleeps." body="Drafts POs, flags margin leaks, rewrites listings — 24/7." art={<AgentArt />} />
            {/* Repricing */}
            <BentoCard span={2} eyebrow="Repricing" title="Never leave money on the table." body="Floor- and competitor-aware repricing across every channel." art={<ReprizArt />} />
            {/* Forecasting */}
            <BentoCard span={2} eyebrow="Forecasting" title="See demand before it hits." body="90-day velocity, seasonality, and stockout-risk scoring." art={<ForecastArt />} />
            {/* Sync */}
            <BentoCard span={2} eyebrow="Real-time sync" title="One source of truth." body="Inventory propagates across channels in under a second." art={<SyncArt />} />
            {/* Procurement wide */}
            <BentoCard span={6} eyebrow="Procurement loop" title="From forecast to PO to shelf — closed-loop." body="Forecast demand, raise POs, receive stock, reconcile invoices. The entire supply chain in one flow — no spreadsheets, no gaps." art={<ProcurementArt />} />
          </div>
        </div>
      </section>

      {/* ── Comparison ─────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 32px', background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(60% 50% at 80% 20%, ${C.purpleGlow}, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, color: C.purple, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>How we compare</div>
            <h2 style={{ fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0, color: C.cream }}>
              Built for the next decade<br />of commerce.
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: C.text50, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Capability</th>
                  {COMPETITORS.map(c => (
                    <th key={c.name} style={{ padding: '14px 16px', fontSize: 13, color: c.us ? C.cream : C.text50, fontWeight: c.us ? 700 : 500, letterSpacing: '-0.01em', textAlign: 'center', background: c.us ? `linear-gradient(180deg, ${C.purpleGlow}, transparent)` : 'transparent', borderTopLeftRadius: c.us ? 12 : 0, borderTopRightRadius: c.us ? 12 : 0 }}>{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map(row => (
                  <tr key={row.label} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: '16px', fontSize: 14, color: C.cream, fontWeight: 400 }}>{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} style={{ padding: '16px', textAlign: 'center', background: i === 0 ? 'rgba(124,106,247,0.05)' : 'transparent' }}>
                        {v === true ? <Check /> : v === false ? <Dash /> : <span style={{ fontSize: 12, color: C.text50 }}>{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Counters ───────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 32px', position: 'relative' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { to: 3200000, prefix: '$', suffix: '', label: 'GMV processed per month' },
            { to: 40,      prefix: '',  suffix: '+', label: 'Countries served' },
            { to: 12,      prefix: '',  suffix: '',  label: 'Marketplaces connected' },
            { to: 10,      prefix: '',  suffix: ' min', label: 'Average onboarding time' },
          ].map(s => (
            <div key={s.label} style={{ padding: 28, borderRadius: 16, background: C.surface, border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(80% 60% at 100% 0%, ${C.purpleGlow}, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', fontSize: 'clamp(32px, 3.6vw, 48px)', fontWeight: 300, letterSpacing: '-0.03em', color: C.cream }}>
                <Counter to={s.to} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div style={{ position: 'relative', marginTop: 8, fontSize: 13, color: C.text50 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <section style={{ padding: '96px 32px', background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 300, letterSpacing: '-0.03em', margin: '0 0 56px', color: C.cream, maxWidth: 720 }}>
            Operators who stopped counting spreadsheets <span style={{ color: C.text50 }}>and started counting margin.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ padding: 28, borderRadius: 16, background: C.bg, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, padding: '6px 12px', borderRadius: 8, background: `linear-gradient(135deg, ${C.purpleGlow}, rgba(198,79,232,0.15))`, border: `1px solid ${C.borderHi}`, alignSelf: 'flex-start' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: C.cream, letterSpacing: '-0.02em' }}>{t.metric}</span>
                  <span style={{ fontSize: 11, color: C.text70 }}>{t.metricLabel}</span>
                </div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: C.cream, fontWeight: 300 }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${C.border}`, fontSize: 13 }}>
                  <div style={{ color: C.cream, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ color: C.text50 }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ─────────────────────────────────────────────── */}
      <section style={{ padding: '96px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, color: C.purple, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>Founding pricing</div>
            <h2 style={{ fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 300, letterSpacing: '-0.03em', margin: 0, color: C.cream }}>
              Priced like a tool. Performs like a team.
            </h2>
            <p style={{ marginTop: 16, fontSize: 15, color: C.text70 }}>Lock founding rates before public launch. USD shown — GBP, EUR, AUD, CAD available at checkout.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {TIERS.map(t => (
              <div key={t.name} style={{ padding: 32, borderRadius: 18, background: t.highlight ? `linear-gradient(180deg, ${C.surface2}, ${C.surface})` : C.surface, border: `1px solid ${t.highlight ? C.purple : C.border}`, position: 'relative', boxShadow: t.highlight ? `0 20px 80px ${C.purpleGlow}` : 'none' }}>
                {t.highlight && (
                  <div style={{ position: 'absolute', top: -10, left: 24, padding: '4px 10px', borderRadius: 6, background: C.purple, color: C.cream, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Most popular</div>
                )}
                <div style={{ fontSize: 14, fontWeight: 600, color: C.cream, letterSpacing: '-0.01em' }}>{t.name}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: C.text50 }}>{t.desc}</div>
                <div style={{ marginTop: 28, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 56, fontWeight: 300, letterSpacing: '-0.04em', color: C.cream }}>${t.price}</span>
                  <span style={{ color: C.text50, fontSize: 14 }}>/ month</span>
                </div>
                <ul style={{ margin: '28px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {t.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.text70 }}>
                      <Check /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/pricing" style={{ display: 'block', marginTop: 28, textAlign: 'center', padding: '12px', borderRadius: 10, background: t.highlight ? C.cream : 'rgba(255,255,255,0.04)', border: t.highlight ? 'none' : `1px solid ${C.borderHi}`, color: t.highlight ? '#0a0812' : C.cream, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  Start {t.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section style={{ padding: '160px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(60% 80% at 50% 50%, ${C.purpleGlow}, transparent 70%), radial-gradient(40% 60% at 20% 40%, rgba(198,79,232,0.2), transparent 70%), radial-gradient(40% 60% at 80% 60%, rgba(94,230,255,0.1), transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(48px, 7vw, 96px)', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1.0, margin: 0, color: C.cream }}>
            Run commerce<br />
            <span style={{ background: `linear-gradient(135deg, ${C.purple}, ${C.magenta}, ${C.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontStyle: 'italic' }}>like it&rsquo;s 2030.</span>
          </h2>
          <p style={{ margin: '32px auto 0', maxWidth: 520, fontSize: 17, color: C.text70, lineHeight: 1.5 }}>
            Ten minutes to onboard. Fourteen days to try. One platform to run the whole thing.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ background: C.cream, color: '#0a0812', fontSize: 15, fontWeight: 700, padding: '16px 28px', borderRadius: 10, textDecoration: 'none', boxShadow: `0 20px 80px rgba(245,240,232,0.18)` }}>
              Start free
            </Link>
            <Link href="/contact" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderHi}`, color: C.cream, fontSize: 15, fontWeight: 600, padding: '16px 28px', borderRadius: 10, textDecoration: 'none' }}>
              Talk to sales
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ padding: '64px 32px 40px', borderTop: `1px solid ${C.border}`, background: C.bg }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg, ${C.purple}, ${C.magenta})` }} />
              <span style={{ fontWeight: 600, color: C.cream }}>Palvento</span>
            </div>
            <p style={{ marginTop: 14, fontSize: 13, color: C.text50, maxWidth: 280, lineHeight: 1.55 }}>
              The OS for global commerce. Built for operators running multi-channel brands across every currency, marketplace and warehouse.
            </p>
          </div>
          {[
            { title: 'Platform',  items: [['Features','/features'],['Integrations','/integrations'],['Pricing','/pricing'],['Changelog','/blog']] },
            { title: 'Compare',   items: [['vs Linnworks','/vs'],['vs Brightpearl','/vs'],['vs ChannelAdvisor','/vs'],['vs Feedonomics','/vs']] },
            { title: 'Company',   items: [['About','/about'],['Blog','/blog'],['Contact','/contact'],['Developer','/developer']] },
            { title: 'Legal',     items: [['Privacy','/privacy'],['Terms','/terms']] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 12, color: C.cream, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>{col.title}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.items.map(([label, href]) => (
                  <li key={label}><Link href={href} style={{ fontSize: 13, color: C.text50, textDecoration: 'none' }}>{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1240, margin: '48px auto 0', paddingTop: 24, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.text50 }}>
          <span>© {new Date().getFullYear()} Palvento. All rights reserved.</span>
          <span>Made for the operators running global commerce.</span>
        </div>
      </footer>
    </div>
  )
}

// ── Bento card ────────────────────────────────────────────────────────────
function BentoCard({ span, eyebrow, title, body, art }: { span: number; eyebrow: string; title: string; body: string; art: React.ReactNode }) {
  return (
    <div style={{ gridColumn: `span ${span}`, padding: 24, borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontSize: 11, color: C.purple, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{eyebrow}</div>
      <div style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em', color: C.cream, lineHeight: 1.2 }}>{title}</div>
      <div style={{ fontSize: 14, color: C.text70, lineHeight: 1.55 }}>{body}</div>
      <div style={{ marginTop: 'auto' }}>{art}</div>
    </div>
  )
}
