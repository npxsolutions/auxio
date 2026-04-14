'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Meridia — Landing v5
// Direction: "Global Map as Product."
// Hero is a live dot-grid world with animated order-flow arcs between commerce
// hubs. Cream paper, blue-black ink, deep cobalt accent. Instrument Serif
// display + Geist + Geist Mono for tabular numerics. Restraint everywhere
// else so the map breathes. No screenshot. The map *is* the product.
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'
import { useEffect, useRef, useState } from 'react'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display-v5',
})

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg:        '#f3f0ea',                  // cool cream
  surface:   '#ffffff',
  raised:    '#ebe6dc',
  ink:       '#0b0f1a',                  // blue-black
  inkSoft:   '#1c2233',
  rule:      'rgba(11,15,26,0.10)',
  ruleSoft:  'rgba(11,15,26,0.06)',
  muted:     '#5a6171',
  mutedDk:   '#2c3142',
  cobalt:    '#1d5fdb',                  // accent
  cobaltDk:  '#1647a8',
  cobaltSft: 'rgba(29,95,219,0.10)',
  emerald:   '#0e7c5a',                  // arc terminus
  oxblood:   '#7d2a1a',                  // negative deltas
}

// ── Commerce hubs (lon/lat) ──────────────────────────────────────────────────
type Hub = { id: string; city: string; country: string; lat: number; lon: number; tier: 1 | 2 }
const HUBS: Hub[] = [
  { id: 'nyc', city: 'New York',     country: 'US', lat:  40.71, lon:  -74.00, tier: 1 },
  { id: 'lax', city: 'Los Angeles',  country: 'US', lat:  34.05, lon: -118.24, tier: 2 },
  { id: 'tor', city: 'Toronto',      country: 'CA', lat:  43.65, lon:  -79.38, tier: 2 },
  { id: 'mex', city: 'Mexico City',  country: 'MX', lat:  19.43, lon:  -99.13, tier: 2 },
  { id: 'sao', city: 'São Paulo',    country: 'BR', lat: -23.55, lon:  -46.63, tier: 2 },
  { id: 'lon', city: 'London',       country: 'GB', lat:  51.51, lon:   -0.13, tier: 1 },
  { id: 'par', city: 'Paris',        country: 'FR', lat:  48.86, lon:    2.35, tier: 2 },
  { id: 'ber', city: 'Berlin',       country: 'DE', lat:  52.52, lon:   13.40, tier: 1 },
  { id: 'mad', city: 'Madrid',       country: 'ES', lat:  40.42, lon:   -3.70, tier: 2 },
  { id: 'mil', city: 'Milan',        country: 'IT', lat:  45.46, lon:    9.19, tier: 2 },
  { id: 'ams', city: 'Amsterdam',    country: 'NL', lat:  52.37, lon:    4.90, tier: 2 },
  { id: 'sto', city: 'Stockholm',    country: 'SE', lat:  59.33, lon:   18.07, tier: 2 },
  { id: 'dub', city: 'Dubai',        country: 'AE', lat:  25.20, lon:   55.27, tier: 2 },
  { id: 'mum', city: 'Mumbai',       country: 'IN', lat:  19.08, lon:   72.88, tier: 2 },
  { id: 'sin', city: 'Singapore',    country: 'SG', lat:   1.35, lon:  103.82, tier: 2 },
  { id: 'hkg', city: 'Hong Kong',    country: 'HK', lat:  22.32, lon:  114.17, tier: 2 },
  { id: 'tok', city: 'Tokyo',        country: 'JP', lat:  35.68, lon:  139.69, tier: 1 },
  { id: 'syd', city: 'Sydney',       country: 'AU', lat: -33.87, lon:  151.21, tier: 1 },
  { id: 'mel', city: 'Melbourne',    country: 'AU', lat: -37.81, lon:  144.96, tier: 2 },
  { id: 'jhb', city: 'Johannesburg', country: 'ZA', lat: -26.20, lon:   28.05, tier: 2 },
]

// Mercator projection helper for our viewBox 0..MAP_W × 0..MAP_H
const MAP_W = 1000
const MAP_H = 480
const projectMercator = (lat: number, lon: number) => {
  const x = ((lon + 180) / 360) * MAP_W
  const latRad = (lat * Math.PI) / 180
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2))
  const y = MAP_H / 2 - (MAP_W * mercN) / (2 * Math.PI)
  return { x, y }
}

// Land-mask check using a downloaded silhouette is overkill here. We use a
// hand-curated set of bounding ellipses approximating the continents. Good
// enough for an evocative dot-grid; not pretending to be cartography.
const CONTINENT_BANDS: { cx: number; cy: number; rx: number; ry: number; rot: number }[] = [
  // North America
  { cx: 220, cy: 175, rx: 110, ry: 80, rot: -22 },
  { cx: 270, cy: 240, rx:  60, ry: 36, rot:  -8 },
  // Central America
  { cx: 280, cy: 270, rx:  30, ry: 14, rot: -25 },
  // South America
  { cx: 325, cy: 340, rx:  55, ry: 95, rot: -10 },
  // Europe
  { cx: 510, cy: 175, rx:  62, ry: 38, rot:   8 },
  // Africa
  { cx: 540, cy: 290, rx:  68, ry: 100, rot:  4 },
  // Middle East
  { cx: 590, cy: 230, rx:  44, ry: 32, rot:  18 },
  // Russia / N Asia
  { cx: 700, cy: 150, rx: 180, ry: 50, rot:   0 },
  // India
  { cx: 680, cy: 240, rx:  40, ry: 36, rot:   0 },
  // SE Asia
  { cx: 770, cy: 260, rx:  56, ry: 30, rot:  -8 },
  // China / Japan
  { cx: 790, cy: 200, rx:  70, ry: 36, rot:   2 },
  // Indonesia
  { cx: 800, cy: 290, rx:  60, ry: 16, rot:   2 },
  // Australia
  { cx: 850, cy: 350, rx:  72, ry: 38, rot:   0 },
  // New Zealand
  { cx: 920, cy: 380, rx:  16, ry: 12, rot:  20 },
  // Greenland
  { cx: 425, cy: 100, rx:  44, ry: 26, rot: -10 },
  // British Isles refinement
  { cx: 488, cy: 168, rx:  16, ry: 22, rot:   0 },
  // Japan refinement
  { cx: 855, cy: 215, rx:  18, ry: 30, rot:  18 },
]

const isLand = (x: number, y: number) => {
  for (const b of CONTINENT_BANDS) {
    const cos = Math.cos((b.rot * Math.PI) / 180)
    const sin = Math.sin((b.rot * Math.PI) / 180)
    const dx = x - b.cx
    const dy = y - b.cy
    const xr = dx * cos + dy * sin
    const yr = -dx * sin + dy * cos
    if ((xr * xr) / (b.rx * b.rx) + (yr * yr) / (b.ry * b.ry) <= 1) return true
  }
  return false
}

// Generate dot field (memoized once at module load — deterministic)
type Dot = { x: number; y: number; r: number; land: boolean }
const DOT_FIELD: Dot[] = (() => {
  const dots: Dot[] = []
  const step = 11
  for (let y = 12; y < MAP_H - 12; y += step) {
    for (let x = 12; x < MAP_W - 12; x += step) {
      const land = isLand(x, y)
      // Random skip on water for breathing
      if (!land && Math.random() > 0.5) continue
      dots.push({ x, y, r: land ? 1.6 : 0.9, land })
    }
  }
  return dots
})()

// Order-flow arcs (curated routes that look real)
type Arc = {
  from: string; to: string; chFrom: string; chTo: string;
  curFrom: string; curTo: string; amount: string; sku: string;
}
const ARCS: Arc[] = [
  { from: 'nyc', to: 'lon', chFrom: 'eBay US',     chTo: 'Amazon UK',  curFrom: '$',  curTo: '£',  amount: '142.18', sku: 'A-2204-K' },
  { from: 'ber', to: 'syd', chFrom: 'Amazon DE',   chTo: 'Shopify AU', curFrom: '€',  curTo: 'A$', amount: '88.40',  sku: 'D-9912-Z' },
  { from: 'tok', to: 'lax', chFrom: 'Rakuten JP',  chTo: 'Amazon US',  curFrom: '¥',  curTo: '$',  amount: '24,808', sku: 'J-0017-B' },
  { from: 'lon', to: 'tor', chFrom: 'eBay UK',     chTo: 'Shopify CA', curFrom: '£',  curTo: 'C$', amount: '54.90',  sku: 'B-3380-A' },
  { from: 'mil', to: 'nyc', chFrom: 'Etsy IT',     chTo: 'Etsy US',    curFrom: '€',  curTo: '$',  amount: '218.00', sku: 'I-7741-R' },
  { from: 'sin', to: 'syd', chFrom: 'Lazada SG',   chTo: 'Amazon AU',  curFrom: 'S$', curTo: 'A$', amount: '312.05', sku: 'S-2102-X' },
  { from: 'par', to: 'mum', chFrom: 'Cdiscount FR',chTo: 'Flipkart IN',curFrom: '€',  curTo: '₹',  amount: '6,142',  sku: 'F-1199-Q' },
  { from: 'sao', to: 'mex', chFrom: 'Mercado BR',  chTo: 'Mercado MX', curFrom: 'R$', curTo: 'M$', amount: '482.10', sku: 'M-3340-V' },
  { from: 'ams', to: 'ber', chFrom: 'Bol.com NL',  chTo: 'Otto DE',    curFrom: '€',  curTo: '€',  amount: '74.30',  sku: 'N-9981-D' },
  { from: 'hkg', to: 'lon', chFrom: 'Amazon HK',   chTo: 'eBay UK',    curFrom: 'HK$',curTo: '£',  amount: '38.40',  sku: 'H-4452-T' },
]

// Great-circle-ish arc as quadratic bezier with elevated control point
const arcPath = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  // Lift control point perpendicular to midpoint
  const cx = mx
  const cy = my - Math.min(180, dist * 0.45)
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
}

// Counter
function Counter({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const start = performance.now()
      const dur = 1600
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur)
        const eased = 1 - Math.pow(1 - p, 3)
        setN(to * eased)
        if (p < 1) requestAnimationFrame(tick); else setN(to)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    obs.observe(el); return () => obs.disconnect()
  }, [to])
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{prefix}{Math.round(n).toLocaleString()}{suffix}</span>
}

// ── Live map ─────────────────────────────────────────────────────────────────
function LiveMap() {
  // Cycle which arc is "active" — drives ticker + highlight
  const [activeIdx, setActiveIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setActiveIdx(i => (i + 1) % ARCS.length), 2400)
    return () => clearInterval(id)
  }, [])

  const hubMap: Record<string, Hub> = Object.fromEntries(HUBS.map(h => [h.id, h]))

  return (
    <div style={{ position: 'relative', background: C.surface, border: `1px solid ${C.rule}`, boxShadow: `0 1px 0 ${C.rule}, 0 24px 60px -32px rgba(11,15,26,0.18)` }}>
      {/* Top chrome — like a live data panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: `1px solid ${C.rule}`, background: C.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.emerald, boxShadow: `0 0 0 3px ${C.emerald}33` }} />
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.mutedDk, fontWeight: 600 }}>
            Meridia · Live order flow · Global
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, letterSpacing: '0.06em' }}>
          <span>{HUBS.length} markets</span>
          <span>·</span>
          <span>{ARCS.length} active routes</span>
          <span>·</span>
          <span>fx: hourly</span>
        </div>
      </div>

      {/* Map */}
      <div style={{ position: 'relative', background: C.surface }}>
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          width="100%"
          style={{ display: 'block', background: 'linear-gradient(180deg, #f9f7f1 0%, #ffffff 100%)' }}
          aria-label="Live world map of order flow"
        >
          <defs>
            <linearGradient id="arcGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={C.cobalt} stopOpacity={0} />
              <stop offset="35%"  stopColor={C.cobalt} stopOpacity={0.95} />
              <stop offset="65%"  stopColor={C.emerald} stopOpacity={0.95} />
              <stop offset="100%" stopColor={C.emerald} stopOpacity={0} />
            </linearGradient>
            <radialGradient id="hubGlow">
              <stop offset="0%" stopColor={C.cobalt} stopOpacity={0.45} />
              <stop offset="100%" stopColor={C.cobalt} stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* Latitude/longitude graticule — very faint */}
          {[15, 30, 45, 60, 75].map(lat => (
            <line key={`lat${lat}`} x1="0" x2={MAP_W} y1={projectMercator(lat, 0).y} y2={projectMercator(lat, 0).y} stroke={C.ink} strokeOpacity={0.04} strokeDasharray="2 6" />
          ))}
          {[-60, -30, 0, 30, 60, 90, 120, 150].map(lon => {
            const x = ((lon + 180) / 360) * MAP_W
            return <line key={`lon${lon}`} x1={x} x2={x} y1="0" y2={MAP_H} stroke={C.ink} strokeOpacity={0.04} strokeDasharray="2 6" />
          })}

          {/* Dot field — landmasses */}
          {DOT_FIELD.map((d, i) => (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill={d.land ? C.ink : C.muted}
              opacity={d.land ? 0.42 : 0.18}
            />
          ))}

          {/* Arcs */}
          {ARCS.map((a, i) => {
            const from = projectMercator(hubMap[a.from].lat, hubMap[a.from].lon)
            const to = projectMercator(hubMap[a.to].lat, hubMap[a.to].lon)
            const isActive = i === activeIdx
            return (
              <g key={`${a.from}-${a.to}-${i}`}>
                <path
                  d={arcPath(from, to)}
                  fill="none"
                  stroke={isActive ? 'url(#arcGradient)' : C.cobalt}
                  strokeOpacity={isActive ? 1 : 0.18}
                  strokeWidth={isActive ? 1.6 : 0.8}
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: isActive ? '6 8' : 'none',
                    animation: isActive ? 'arcdash 2.4s linear forwards' : undefined,
                  }}
                />
                {isActive && (
                  <circle r={3.5} fill={C.emerald}>
                    <animateMotion dur="2.2s" repeatCount="1" path={arcPath(from, to)} />
                  </circle>
                )}
              </g>
            )
          })}

          {/* Hubs */}
          {HUBS.map(h => {
            const p = projectMercator(h.lat, h.lon)
            const isActive = h.id === ARCS[activeIdx].from || h.id === ARCS[activeIdx].to
            return (
              <g key={h.id}>
                {isActive && <circle cx={p.x} cy={p.y} r={14} fill="url(#hubGlow)" />}
                <circle cx={p.x} cy={p.y} r={h.tier === 1 ? 3.2 : 2.2} fill={isActive ? C.cobalt : C.ink} />
                <circle cx={p.x} cy={p.y} r={h.tier === 1 ? 5 : 3.6} fill="none" stroke={isActive ? C.cobalt : C.ink} strokeOpacity={isActive ? 0.5 : 0.2} strokeWidth={1} />
                {h.tier === 1 && (
                  <text
                    x={p.x + 7}
                    y={p.y + 3.5}
                    fontSize={10}
                    fontFamily='var(--font-mono), monospace'
                    fill={isActive ? C.cobaltDk : C.mutedDk}
                    letterSpacing="0.04em"
                    style={{ textTransform: 'uppercase', fontWeight: 600 }}
                  >
                    {h.city}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Live order ticker overlay — bottom-left */}
        <div style={{
          position: 'absolute', left: 18, bottom: 18,
          background: 'rgba(11,15,26,0.95)', color: C.bg,
          padding: '10px 14px', minWidth: 320,
          borderLeft: `2px solid ${C.cobalt}`,
          backdropFilter: 'blur(6px)',
        }}>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(243,240,234,0.55)', marginBottom: 6 }}>
            Order received · just now
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontFamily: 'var(--font-display-v5), Georgia, serif', fontSize: 18, fontWeight: 400 }}>
            <span style={{ color: C.bg }}>{ARCS[activeIdx].curFrom}{ARCS[activeIdx].amount}</span>
            <span style={{ color: 'rgba(243,240,234,0.4)', fontFamily: 'var(--font-mono), monospace', fontSize: 11 }}>→</span>
            <span style={{ color: C.bg, opacity: 0.7 }}>settled in {ARCS[activeIdx].curTo}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: 'rgba(243,240,234,0.65)', letterSpacing: '0.05em', marginTop: 4 }}>
            {ARCS[activeIdx].chFrom} <span style={{ color: C.cobalt }}>→</span> {ARCS[activeIdx].chTo} · SKU {ARCS[activeIdx].sku}
          </div>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: 'rgba(243,240,234,0.4)', letterSpacing: '0.05em', marginTop: 6 }}>
            {hubMap[ARCS[activeIdx].from].city}, {hubMap[ARCS[activeIdx].from].country} <span style={{ color: 'rgba(243,240,234,0.25)' }}>↗</span> {hubMap[ARCS[activeIdx].to].city}, {hubMap[ARCS[activeIdx].to].country}
          </div>
        </div>

        {/* Mini stats overlay — top-right */}
        <div style={{ position: 'absolute', right: 18, top: 18, display: 'flex', gap: 14 }}>
          {[
            { k: 'Today', v: '4,218' },
            { k: 'Routes', v: '92' },
            { k: 'GMV', v: '$612k' },
          ].map(s => (
            <div key={s.k} style={{ background: 'rgba(255,255,255,0.92)', border: `1px solid ${C.rule}`, padding: '8px 12px', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.k}</div>
              <div style={{ fontFamily: 'var(--font-display-v5), Georgia, serif', fontSize: 18, color: C.ink, lineHeight: 1, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom chrome */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderTop: `1px solid ${C.rule}`, background: C.bg, fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, letterSpacing: '0.06em' }}>
        <span>auxio.com/atlas · v3.2</span>
        <span>40+ countries · multi-currency · finance-grade ledger</span>
      </div>

      <style>{`
        @keyframes arcdash {
          from { stroke-dashoffset: 28; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}

// ── Sections content ─────────────────────────────────────────────────────────
const NAV = [
  { label: 'Atlas',        href: '#atlas' },
  { label: 'Platform',     href: '#platform' },
  { label: 'Why Meridia',    href: '#why' },
  { label: 'Pricing',      href: '#pricing' },
  { label: 'Customers',    href: '#customers' },
]

const PILLARS = [
  { n: '01', head: 'Inventory & Listings',       body: 'One source of truth across every marketplace, in every region. Listings publish, sync, and reconcile in real time.', figure: 'sync' },
  { n: '02', head: 'Orders & Fulfilment',        body: 'Orders route automatically by SKU, region, carrier, and SLA. Print labels in a click. Surface exceptions before customers notice.', figure: 'route' },
  { n: '03', head: 'Procurement & Forecasting',  body: 'Demand forecasting on 90 days of velocity, by SKU and channel. Reorder thresholds. POs that auto-update inventory on receipt.', figure: 'curve' },
  { n: '04', head: 'Profit & Analytics',         body: 'True net margin after fees, fulfilment, ad spend, COGS, and tax — by SKU, by channel, by month. Reported in your home currency.', figure: 'pnl' },
]

const QUOTES = [
  { metric: '+34%', label: 'net margin · 60 days', q: 'Five marketplaces from four browser tabs became one screen and a P&L we trust.', who: 'Sarah T.', role: 'Apparel · 6 channels' },
  { metric: '$5,400', label: 'saved vs Linnworks · year', q: 'I knew we were profitable. I did not know we were 8% profitable. Meridia showed the real number.', who: 'Marcus L.', role: 'Electronics · US/UK/EU' },
  { metric: '0', label: 'stockouts · Q1', q: 'The forecasting model has paid for the platform twice over. No emergency reorders since November.', who: 'Priya K.', role: 'Beauty · 500 SKUs' },
]

const PRICE = [
  { name: 'Starter',    price: 59,   tag: 'Founding rate', desc: 'Solo operators on 1–2 marketplaces.',                cta: 'Begin' },
  { name: 'Growth',     price: 159,  tag: 'Most adopted',  desc: 'Multi-channel sellers scaling across regions.',     cta: 'Begin', flag: true },
  { name: 'Scale',      price: 499,  tag: 'Best value',    desc: 'High-volume operations on the full platform.',       cta: 'Begin' },
  { name: 'Enterprise', price: null, tag: 'By arrangement', desc: 'Multi-region rollout, custom SLAs, white-label.',  cta: 'Speak with us' },
]

const INCUMBENTS = [
  { name: 'ChannelAdvisor', est: '2001', pos: 'Sales-led catalog era. 90-day onboardings.' },
  { name: 'Brightpearl',    est: '2007', pos: 'ERP-flavoured. Implementation projects in months.' },
  { name: 'Linnworks',      est: '2006', pos: 'Order-volume tax. AI as a paid add-on.' },
  { name: 'Feedonomics',    est: '2014', pos: 'Feeds engineering. Specialist-led, not self-serve.' },
]

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LandingV5() {
  return (
    <div
      className={display.variable}
      style={{
        background: C.bg, color: C.ink, minHeight: '100vh',
        fontFamily: 'var(--font-geist), -apple-system, "Helvetica Neue", sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(243,240,234,0.86)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.ink }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.ink} />
              <rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt} />
            </svg>
            <span style={{ fontFamily: 'var(--font-display-v5), Georgia, serif', fontSize: 24, lineHeight: 1, letterSpacing: '-0.015em' }}>Meridia</span>
          </Link>
          <nav style={{ display: 'flex', gap: 28 }}>
            {NAV.map(n => <a key={n.href} href={n.href} style={{ fontSize: 13, color: C.mutedDk, textDecoration: 'none', letterSpacing: '0.005em' }}>{n.label}</a>)}
          </nav>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: 13, color: C.mutedDk, textDecoration: 'none', padding: '8px 4px' }}>Sign in</Link>
            <Link href="/signup" style={{
              fontSize: 13, color: C.bg, background: C.ink,
              padding: '10px 18px', textDecoration: 'none',
              fontWeight: 500, letterSpacing: '0.005em',
            }}>
              Begin trial
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section id="atlas" style={{ padding: '64px 32px 32px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }}>
            <div style={{ maxWidth: 1100 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <span style={{ width: 24, height: 1, background: C.cobalt }} />
                <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.cobalt, fontWeight: 600 }}>Live · Meridia Atlas</span>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display-v5), Georgia, serif',
                fontSize: 'clamp(60px, 9vw, 132px)',
                fontWeight: 400,
                letterSpacing: '-0.025em',
                lineHeight: 0.96,
                color: C.ink,
                margin: 0,
              }}>
                Commerce, <em style={{ fontStyle: 'italic', color: C.cobalt }}>operated.</em>
                <br />
                In every market.
              </h1>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 56, alignItems: 'end', marginTop: 36 }}>
                <p style={{ fontSize: 18, lineHeight: 1.6, color: C.mutedDk, margin: 0, maxWidth: 620 }}>
                  Meridia is the operating system for global commerce — one ledger, one inventory, one truth across every marketplace, every currency, every region. The map below is live: orders settling right now, in {HUBS.length}+ markets, across {ARCS.length} active routes.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <Link href="/signup" style={{
                    background: C.ink, color: C.bg,
                    padding: '15px 24px', textDecoration: 'none',
                    fontSize: 14, fontWeight: 500, letterSpacing: '0.01em',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}>
                    Begin a 14-day trial
                    <span style={{ fontFamily: 'var(--font-mono), monospace' }}>→</span>
                  </Link>
                  <Link href="/contact" style={{
                    background: 'transparent', color: C.ink,
                    padding: '15px 24px', textDecoration: 'none',
                    fontSize: 14, fontWeight: 500,
                    border: `1px solid ${C.ink}`,
                  }}>
                    Book a brief
                  </Link>
                </div>
              </div>
            </div>

            {/* THE MAP — full bleed of container */}
            <LiveMap />

            {/* Hub inline ticker — moves under the map */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.06em', flexWrap: 'wrap' }}>
              <span style={{ color: C.cobalt, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em' }}>Hubs ●</span>
              {HUBS.filter(h => h.tier === 1).map(h => <span key={h.id}>{h.city.toUpperCase()}, {h.country}</span>).reduce((acc: React.ReactNode[], el, i, arr) => {
                acc.push(<span key={`s-${i}`}>{el}</span>)
                if (i < arr.length - 1) acc.push(<span key={`d-${i}`} style={{ color: C.rule }}>·</span>)
                return acc
              }, [])}
              <span style={{ color: C.rule }}>·</span>
              <span style={{ color: C.cobaltDk }}>+ {HUBS.length - HUBS.filter(h => h.tier === 1).length} regional</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Numbers strip ───────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 32px', borderTop: `1px solid ${C.rule}`, borderBottom: `1px solid ${C.rule}`, background: C.surface }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
            {[
              { v: 3200000, p: '$', s: '+', label: 'GMV under management',     note: 'monthly across all merchants' },
              { v: 40,      s: '+', label: 'Countries served',                 note: 'home & marketplace currencies' },
              { v: 12,      label: 'Marketplaces integrated',                  note: 'eBay · Amazon · Shopify · Etsy …' },
              { v: 65,      s: '%', label: 'Reduction in order errors',         note: 'vs prior tooling, post-implementation' },
              { v: 10,      s: ' min', label: 'Median time to first dashboard', note: 'OAuth in, ledger populated' },
            ].map((m, i) => (
              <div key={i} style={{
                borderLeft: i === 0 ? 'none' : `1px solid ${C.rule}`,
                paddingLeft: i === 0 ? 0 : 28,
                paddingRight: 16,
              }}>
                <div style={{
                  fontFamily: 'var(--font-display-v5), Georgia, serif',
                  fontSize: 'clamp(40px, 5vw, 64px)',
                  fontWeight: 400,
                  letterSpacing: '-0.025em',
                  lineHeight: 1,
                  color: C.ink,
                  marginBottom: 14,
                }}>
                  <Counter to={m.v} prefix={m.p} suffix={m.s} />
                </div>
                <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 500, marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.04em' }}>{m.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pillars ─────────────────────────────────────────────────────────── */}
      <section id="platform" style={{ padding: '120px 32px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 56, marginBottom: 56 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>The Platform</div>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, marginTop: 4 }}>§ 02 — Four pillars</div>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display-v5), Georgia, serif',
              fontSize: 'clamp(40px, 5vw, 64px)',
              fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.05,
              color: C.ink, margin: 0, maxWidth: 820,
            }}>
              Four primitives. <em style={{ color: C.cobalt, fontStyle: 'italic' }}>One ledger.</em> Built from the operations layer up.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, borderTop: `1px solid ${C.ink}`, borderLeft: `1px solid ${C.ink}` }}>
            {PILLARS.map(p => (
              <article key={p.n} style={{
                borderRight: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}`,
                padding: '40px 36px', background: C.surface, position: 'relative',
                display: 'flex', flexDirection: 'column', minHeight: 280,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22 }}>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.18em', fontWeight: 700 }}>{p.n} / 04</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display-v5), Georgia, serif', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1, color: C.ink, margin: '0 0 14px' }}>{p.head}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: C.mutedDk, margin: 0 }}>{p.body}</p>
                <div style={{ marginTop: 'auto', paddingTop: 28 }}>
                  <PillarFigure kind={p.figure} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Meridia ───────────────────────────────────────────────────────── */}
      <section id="why" style={{ padding: '120px 32px', background: C.ink, color: C.bg }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 48 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>Why Meridia</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(243,240,234,0.18)' }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: 'rgba(243,240,234,0.5)' }}>§ 03 — Versus the incumbents</span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display-v5), Georgia, serif',
            fontSize: 'clamp(40px, 5vw, 64px)',
            fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.05,
            color: C.bg, margin: '0 0 64px', maxWidth: 880,
          }}>
            The category was assembled one tool at a time. <em style={{ color: '#7BB7FF', fontStyle: 'italic' }}>We rebuilt it once.</em>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: '1px solid rgba(243,240,234,0.18)' }}>
            {INCUMBENTS.map((inc, i) => (
              <div key={inc.name} style={{
                padding: '32px 24px',
                borderRight: i < INCUMBENTS.length - 1 ? '1px solid rgba(243,240,234,0.18)' : 'none',
                borderBottom: '1px solid rgba(243,240,234,0.18)',
              }}>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: 'rgba(243,240,234,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>est. {inc.est}</div>
                <h4 style={{ fontFamily: 'var(--font-display-v5), Georgia, serif', fontSize: 28, fontWeight: 400, color: C.bg, margin: '0 0 14px', letterSpacing: '-0.018em' }}>
                  {inc.name}
                </h4>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'rgba(243,240,234,0.65)', margin: 0, fontStyle: 'italic' }}>{inc.pos}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 64, padding: '32px 32px', borderLeft: `3px solid ${C.cobalt}`, background: 'rgba(29,95,219,0.08)', maxWidth: 920 }}>
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: '#7BB7FF', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 14 }}>Meridia · est. mmxxvi</div>
            <p style={{ fontFamily: 'var(--font-display-v5), Georgia, serif', fontSize: 22, lineHeight: 1.45, color: C.bg, margin: 0, fontWeight: 400, letterSpacing: '-0.012em' }}>
              One platform. Self-serve in ten minutes. Multi-currency from the first SKU. Procurement, fulfilment, listings, and finance-grade P&amp;L on a single ledger. Founding member rate from <span style={{ color: '#7BB7FF' }}>$59 per month</span>.
            </p>
          </div>
        </div>
      </section>

      {/* ── Customers ───────────────────────────────────────────────────────── */}
      <section id="customers" style={{ padding: '120px 32px', background: C.bg, borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 56 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>The Operators</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted }}>§ 04 — Three accounts</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {QUOTES.map((q, i) => (
              <figure key={i} style={{ margin: 0, padding: 0, background: C.surface, border: `1px solid ${C.rule}` }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${C.rule}` }}>
                  <div style={{ fontFamily: 'var(--font-display-v5), Georgia, serif', fontSize: 36, fontWeight: 400, color: C.cobalt, letterSpacing: '-0.02em', lineHeight: 1 }}>{q.metric}</div>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, letterSpacing: '0.06em', textAlign: 'right', textTransform: 'uppercase', maxWidth: 130 }}>{q.label}</div>
                </div>
                <div style={{ padding: '24px' }}>
                  <blockquote style={{ margin: '0 0 24px', fontFamily: 'var(--font-display-v5), Georgia, serif', fontSize: 21, lineHeight: 1.4, color: C.ink, fontWeight: 400, letterSpacing: '-0.005em' }}>
                    &ldquo;{q.q}&rdquo;
                  </blockquote>
                  <figcaption>
                    <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{q.who}</div>
                    <div style={{ fontSize: 11.5, color: C.muted, fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.04em', marginTop: 2 }}>{q.role}</div>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '120px 32px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>Schedule of Fees</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted }}>§ 05 — All currencies on /pricing</span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display-v5), Georgia, serif',
            fontSize: 'clamp(40px, 5vw, 64px)',
            fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.05,
            color: C.ink, margin: '0 0 56px', maxWidth: 880,
          }}>
            Transparent, flat-rate. <em style={{ color: C.cobalt, fontStyle: 'italic' }}>Never a percentage of your revenue.</em>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: `1px solid ${C.ink}`, borderLeft: `1px solid ${C.ink}` }}>
            {PRICE.map(p => (
              <div key={p.name} style={{
                borderRight: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}`,
                padding: '32px 28px',
                background: p.flag ? C.ink : C.surface,
                color: p.flag ? C.bg : C.ink,
                position: 'relative',
              }}>
                {p.flag && <div style={{ position: 'absolute', top: -1, left: -1, right: -1, height: 4, background: C.cobalt }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
                  <span style={{ fontFamily: 'var(--font-display-v5), Georgia, serif', fontSize: 24, fontWeight: 400, letterSpacing: '-0.01em' }}>{p.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: p.flag ? 'rgba(243,240,234,0.55)' : C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{p.tag}</span>
                </div>
                {p.price !== null ? (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, fontFamily: 'var(--font-display-v5), Georgia, serif' }}>
                      <span style={{ fontSize: 18, color: p.flag ? 'rgba(243,240,234,0.65)' : C.muted }}>$</span>
                      <span style={{ fontSize: 60, fontWeight: 400, letterSpacing: '-0.035em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{p.price}</span>
                      <span style={{ fontSize: 14, color: p.flag ? 'rgba(243,240,234,0.65)' : C.muted, marginLeft: 4 }}>/ mo</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-display-v5), Georgia, serif', fontSize: 36, fontWeight: 400, marginBottom: 20, letterSpacing: '-0.02em' }}>By arrangement</div>
                )}
                <p style={{ fontSize: 13, lineHeight: 1.6, color: p.flag ? 'rgba(243,240,234,0.7)' : C.muted, margin: '0 0 28px', minHeight: 60 }}>{p.desc}</p>
                <Link href={p.price === null ? '/contact' : '/signup'} style={{
                  display: 'block', textAlign: 'center', padding: '12px 16px',
                  background: p.flag ? C.bg : C.ink,
                  color: p.flag ? C.ink : C.bg,
                  fontSize: 12.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase',
                  textDecoration: 'none',
                }}>{p.cta}</Link>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
            <span>USD shown · GBP £49 · EUR €55 · AUD A$89 · CAD C$79</span>
            <Link href="/pricing" style={{ color: C.cobalt, textDecoration: 'none' }}>View full schedule →</Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 32px', background: C.surface, borderTop: `1px solid ${C.rule}`, borderBottom: `1px solid ${C.rule}`, textAlign: 'center' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display-v5), Georgia, serif', fontSize: 'clamp(48px, 6vw, 88px)', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.0, color: C.ink, margin: '0 0 28px' }}>
            Run your operation <br /><em style={{ color: C.cobalt, fontStyle: 'italic' }}>on one platform.</em>
          </h2>
          <p style={{ fontSize: 17, color: C.mutedDk, lineHeight: 1.6, margin: '0 auto 40px', maxWidth: 580 }}>
            Fourteen days. No card. Connect a marketplace and watch the ledger populate in under ten minutes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/signup" style={{ background: C.ink, color: C.bg, padding: '17px 32px', textDecoration: 'none', fontSize: 14, fontWeight: 500, letterSpacing: '0.02em' }}>
              Begin your trial
            </Link>
            <Link href="/contact" style={{ background: 'transparent', color: C.ink, padding: '17px 32px', textDecoration: 'none', fontSize: 14, fontWeight: 500, border: `1px solid ${C.ink}` }}>
              Speak with founders
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{ padding: '56px 32px 40px', background: C.bg }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.ink} />
                <rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt} />
              </svg>
              <span style={{ fontFamily: 'var(--font-display-v5), Georgia, serif', fontSize: 22, letterSpacing: '-0.015em' }}>Meridia</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: C.mutedDk, fontFamily: 'var(--font-display-v5), Georgia, serif', fontStyle: 'italic', margin: 0, maxWidth: 320 }}>
              The operating system for global commerce.
            </p>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 18, fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.06em' }}>
              Set in Instrument Serif &amp; Geist · est. mmxxvi
            </p>
          </div>
          {[
            { h: 'Platform', l: [['Atlas', '#atlas'], ['Pillars', '#platform'], ['Pricing', '#pricing'], ['Customers', '#customers']] },
            { h: 'Compare',  l: [['ChannelAdvisor', '/vs/channelAdvisor'], ['Brightpearl', '/vs/brightpearl'], ['Linnworks', '/vs/linnworks'], ['Feedonomics', '/vs/baselinker']] },
            { h: 'Company',  l: [['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
          ].map(col => (
            <div key={col.h}>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.cobalt, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 14 }}>{col.h}</div>
              {col.l.map(([label, href]) => (
                <Link key={label} href={href} style={{ display: 'block', fontSize: 13, color: C.mutedDk, textDecoration: 'none', marginBottom: 8 }}>{label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1320, margin: '32px auto 0', borderTop: `1px solid ${C.rule}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.04em' }}>
          <span>© MMXXVI · NPX Solutions · All rights reserved</span>
          <span>Worldwide · Multi-currency · Multichannel</span>
        </div>
      </footer>
    </div>
  )
}

// ── Pillar figures (small accent SVGs) ───────────────────────────────────────
function PillarFigure({ kind }: { kind: string }) {
  if (kind === 'sync') {
    return (
      <svg viewBox="0 0 240 80" width="100%" height="80" style={{ overflow: 'visible' }}>
        {[20, 80, 140, 200].map((cx, i) => (
          <g key={cx}>
            <circle cx={cx} cy="40" r="14" fill="none" stroke={C.ink} strokeWidth="1" />
            <circle cx={cx} cy="40" r="3.5" fill={i === 1 ? C.cobalt : C.ink} />
          </g>
        ))}
        <line x1="34" y1="40" x2="66" y2="40" stroke={C.ink} strokeWidth="1" strokeDasharray="2 3" />
        <line x1="94" y1="40" x2="126" y2="40" stroke={C.cobalt} strokeWidth="1.4" />
        <line x1="154" y1="40" x2="186" y2="40" stroke={C.ink} strokeWidth="1" strokeDasharray="2 3" />
      </svg>
    )
  }
  if (kind === 'route') {
    return (
      <svg viewBox="0 0 240 80" width="100%" height="80">
        <path d="M10 60 Q 60 10, 120 40 T 230 25" stroke={C.cobalt} strokeWidth="1.4" fill="none" />
        <path d="M10 60 Q 60 10, 120 40 T 230 25" stroke={C.ink} strokeWidth="0.8" fill="none" strokeDasharray="2 3" transform="translate(0 12)" />
        <circle cx="10" cy="60" r="4" fill={C.ink} />
        <circle cx="120" cy="40" r="3" fill={C.cobalt} />
        <circle cx="230" cy="25" r="4" fill={C.ink} />
      </svg>
    )
  }
  if (kind === 'curve') {
    return (
      <svg viewBox="0 0 240 80" width="100%" height="80">
        <line x1="0" y1="70" x2="240" y2="70" stroke={C.ink} strokeWidth="1" />
        <path d="M0 60 L 30 58 L 60 50 L 90 52 L 120 42 L 150 32 L 180 24 L 210 16 L 240 8" stroke={C.cobalt} strokeWidth="1.4" fill="none" />
        <path d="M0 60 L 30 58 L 60 50 L 90 52 L 120 42 L 150 32 L 180 24 L 210 16 L 240 8 L 240 70 L 0 70 Z" fill={C.cobaltSft} />
        {[60, 120, 180].map(x => <line key={x} x1={x} y1="65" x2={x} y2="75" stroke={C.ink} strokeWidth="0.8" />)}
      </svg>
    )
  }
  // pnl bar chart
  return (
    <svg viewBox="0 0 240 80" width="100%" height="80">
      <line x1="0" y1="70" x2="240" y2="70" stroke={C.ink} strokeWidth="1" />
      {[18, 30, 48, 26, 56, 44, 62, 50, 70].map((h, i) => (
        <rect key={i} x={6 + i * 26} y={70 - h} width="14" height={h} fill={i === 6 ? C.cobalt : C.ink} opacity={i === 6 ? 1 : 0.78} />
      ))}
    </svg>
  )
}
