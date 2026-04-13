'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Auxio — Landing v6
// Direction: "Global Map as Product." (continued from v5)
// Iteration: ruthless word-stripping. Concepts now carried by SVG diagrams,
// not paragraphs. One sentence max per section. The visuals do the explaining.
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'
import { useEffect, useRef, useState } from 'react'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display-v6',
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
  mutedDk:   '#2c3142',
  cobalt:    '#1d5fdb',
  cobaltDk:  '#1647a8',
  cobaltSft: 'rgba(29,95,219,0.10)',
  emerald:   '#0e7c5a',
  oxblood:   '#7d2a1a',
}

// ── Hubs / map (same as v5) ─────────────────────────────────────────────────
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
const MAP_W = 1000
const MAP_H = 480
const projectMercator = (lat: number, lon: number) => {
  const x = ((lon + 180) / 360) * MAP_W
  const latRad = (lat * Math.PI) / 180
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2))
  const y = MAP_H / 2 - (MAP_W * mercN) / (2 * Math.PI)
  return { x, y }
}
const CONTINENT_BANDS = [
  { cx: 220, cy: 175, rx: 110, ry: 80, rot: -22 },
  { cx: 270, cy: 240, rx:  60, ry: 36, rot:  -8 },
  { cx: 280, cy: 270, rx:  30, ry: 14, rot: -25 },
  { cx: 325, cy: 340, rx:  55, ry: 95, rot: -10 },
  { cx: 510, cy: 175, rx:  62, ry: 38, rot:   8 },
  { cx: 540, cy: 290, rx:  68, ry: 100, rot:  4 },
  { cx: 590, cy: 230, rx:  44, ry: 32, rot:  18 },
  { cx: 700, cy: 150, rx: 180, ry: 50, rot:   0 },
  { cx: 680, cy: 240, rx:  40, ry: 36, rot:   0 },
  { cx: 770, cy: 260, rx:  56, ry: 30, rot:  -8 },
  { cx: 790, cy: 200, rx:  70, ry: 36, rot:   2 },
  { cx: 800, cy: 290, rx:  60, ry: 16, rot:   2 },
  { cx: 850, cy: 350, rx:  72, ry: 38, rot:   0 },
  { cx: 920, cy: 380, rx:  16, ry: 12, rot:  20 },
  { cx: 425, cy: 100, rx:  44, ry: 26, rot: -10 },
  { cx: 488, cy: 168, rx:  16, ry: 22, rot:   0 },
  { cx: 855, cy: 215, rx:  18, ry: 30, rot:  18 },
]
const isLand = (x: number, y: number) => {
  for (const b of CONTINENT_BANDS) {
    const cos = Math.cos((b.rot * Math.PI) / 180)
    const sin = Math.sin((b.rot * Math.PI) / 180)
    const dx = x - b.cx; const dy = y - b.cy
    const xr = dx * cos + dy * sin; const yr = -dx * sin + dy * cos
    if ((xr * xr) / (b.rx * b.rx) + (yr * yr) / (b.ry * b.ry) <= 1) return true
  }
  return false
}
const DOT_FIELD: { x: number; y: number; r: number; land: boolean }[] = (() => {
  const dots = []
  const step = 11
  for (let y = 12; y < MAP_H - 12; y += step) {
    for (let x = 12; x < MAP_W - 12; x += step) {
      const land = isLand(x, y)
      if (!land && Math.random() > 0.5) continue
      dots.push({ x, y, r: land ? 1.6 : 0.9, land })
    }
  }
  return dots
})()
type Arc = { from: string; to: string; chFrom: string; chTo: string; curFrom: string; curTo: string; amount: string; sku: string }
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
const arcPath = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2
  const dx = b.x - a.x; const dy = b.y - a.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${mx.toFixed(1)} ${(my - Math.min(180, dist * 0.45)).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
}

function Counter({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; obs.disconnect()
      const start = performance.now(); const dur = 1600
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur)
        setN(to * (1 - Math.pow(1 - p, 3)))
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
  const [activeIdx, setActiveIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setActiveIdx(i => (i + 1) % ARCS.length), 2400)
    return () => clearInterval(id)
  }, [])
  const hubMap: Record<string, Hub> = Object.fromEntries(HUBS.map(h => [h.id, h]))

  return (
    <div style={{ position: 'relative', background: C.surface, border: `1px solid ${C.rule}`, boxShadow: `0 1px 0 ${C.rule}, 0 24px 60px -32px rgba(11,15,26,0.18)` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: `1px solid ${C.rule}`, background: C.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.emerald, boxShadow: `0 0 0 3px ${C.emerald}33` }} />
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.mutedDk, fontWeight: 600 }}>Live · Auxio Atlas</span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, letterSpacing: '0.06em' }}>
          <span>{HUBS.length} markets</span><span>·</span><span>{ARCS.length} active routes</span>
        </div>
      </div>

      <div style={{ position: 'relative', background: C.surface }}>
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} width="100%" style={{ display: 'block', background: 'linear-gradient(180deg, #f9f7f1 0%, #ffffff 100%)' }} aria-label="Live world map of order flow">
          <defs>
            <linearGradient id="arcGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={C.cobalt}  stopOpacity={0} />
              <stop offset="35%"  stopColor={C.cobalt}  stopOpacity={0.95} />
              <stop offset="65%"  stopColor={C.emerald} stopOpacity={0.95} />
              <stop offset="100%" stopColor={C.emerald} stopOpacity={0} />
            </linearGradient>
            <radialGradient id="hubGlow"><stop offset="0%" stopColor={C.cobalt} stopOpacity={0.45} /><stop offset="100%" stopColor={C.cobalt} stopOpacity={0} /></radialGradient>
          </defs>
          {[15, 30, 45, 60, 75].map(lat => (
            <line key={`lat${lat}`} x1="0" x2={MAP_W} y1={projectMercator(lat, 0).y} y2={projectMercator(lat, 0).y} stroke={C.ink} strokeOpacity={0.04} strokeDasharray="2 6" />
          ))}
          {[-60, -30, 0, 30, 60, 90, 120, 150].map(lon => {
            const x = ((lon + 180) / 360) * MAP_W
            return <line key={`lon${lon}`} x1={x} x2={x} y1="0" y2={MAP_H} stroke={C.ink} strokeOpacity={0.04} strokeDasharray="2 6" />
          })}
          {DOT_FIELD.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.land ? C.ink : C.muted} opacity={d.land ? 0.42 : 0.18} />
          ))}
          {ARCS.map((a, i) => {
            const from = projectMercator(hubMap[a.from].lat, hubMap[a.from].lon)
            const to = projectMercator(hubMap[a.to].lat, hubMap[a.to].lon)
            const isActive = i === activeIdx
            return (
              <g key={`${a.from}-${a.to}-${i}`}>
                <path d={arcPath(from, to)} fill="none" stroke={isActive ? 'url(#arcGradient)' : C.cobalt} strokeOpacity={isActive ? 1 : 0.18} strokeWidth={isActive ? 1.6 : 0.8} strokeLinecap="round" style={{ strokeDasharray: isActive ? '6 8' : 'none', animation: isActive ? 'arcdash 2.4s linear forwards' : undefined }} />
                {isActive && <circle r={3.5} fill={C.emerald}><animateMotion dur="2.2s" repeatCount="1" path={arcPath(from, to)} /></circle>}
              </g>
            )
          })}
          {HUBS.map(h => {
            const p = projectMercator(h.lat, h.lon)
            const isActive = h.id === ARCS[activeIdx].from || h.id === ARCS[activeIdx].to
            return (
              <g key={h.id}>
                {isActive && <circle cx={p.x} cy={p.y} r={14} fill="url(#hubGlow)" />}
                <circle cx={p.x} cy={p.y} r={h.tier === 1 ? 3.2 : 2.2} fill={isActive ? C.cobalt : C.ink} />
                <circle cx={p.x} cy={p.y} r={h.tier === 1 ? 5 : 3.6} fill="none" stroke={isActive ? C.cobalt : C.ink} strokeOpacity={isActive ? 0.5 : 0.2} strokeWidth={1} />
                {h.tier === 1 && <text x={p.x + 7} y={p.y + 3.5} fontSize={10} fontFamily='var(--font-mono), monospace' fill={isActive ? C.cobaltDk : C.mutedDk} letterSpacing="0.04em" style={{ textTransform: 'uppercase', fontWeight: 600 }}>{h.city}</text>}
              </g>
            )
          })}
        </svg>

        <div style={{ position: 'absolute', left: 18, bottom: 18, background: 'rgba(11,15,26,0.95)', color: C.bg, padding: '10px 14px', minWidth: 320, borderLeft: `2px solid ${C.cobalt}` }}>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(243,240,234,0.55)', marginBottom: 6 }}>Order received · just now</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontFamily: 'var(--font-display-v6), Georgia, serif', fontSize: 18 }}>
            <span style={{ color: C.bg }}>{ARCS[activeIdx].curFrom}{ARCS[activeIdx].amount}</span>
            <span style={{ color: 'rgba(243,240,234,0.4)', fontFamily: 'var(--font-mono), monospace', fontSize: 11 }}>→</span>
            <span style={{ color: C.bg, opacity: 0.7 }}>{ARCS[activeIdx].curTo}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: 'rgba(243,240,234,0.65)', letterSpacing: '0.05em', marginTop: 4 }}>
            {ARCS[activeIdx].chFrom} <span style={{ color: C.cobalt }}>→</span> {ARCS[activeIdx].chTo}
          </div>
        </div>

        <div style={{ position: 'absolute', right: 18, top: 18, display: 'flex', gap: 14 }}>
          {[{ k: 'Today', v: '4,218' }, { k: 'Routes', v: '92' }, { k: 'GMV', v: '$612k' }].map(s => (
            <div key={s.k} style={{ background: 'rgba(255,255,255,0.92)', border: `1px solid ${C.rule}`, padding: '8px 12px' }}>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.k}</div>
              <div style={{ fontFamily: 'var(--font-display-v6), Georgia, serif', fontSize: 18, color: C.ink, lineHeight: 1, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes arcdash { from { stroke-dashoffset: 28; } to { stroke-dashoffset: 0; } }`}</style>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PILLAR DIAGRAMS — each one explains the concept without prose
// ════════════════════════════════════════════════════════════════════════════

// 01 — Inventory & Listings: 5 marketplaces converging into one ledger
function DiagramSync() {
  const channels = ['eBay', 'Amazon', 'Shopify', 'Etsy', 'OnBuy']
  return (
    <svg viewBox="0 0 480 280" width="100%" style={{ display: 'block' }}>
      {/* Channels — left column */}
      {channels.map((ch, i) => {
        const y = 30 + i * 50
        return (
          <g key={ch}>
            <rect x="20" y={y - 14} width="100" height="28" fill={C.surface} stroke={C.ink} strokeWidth="1" />
            <text x="70" y={y + 4} fontSize="11" fontFamily='var(--font-mono), monospace' fill={C.ink} textAnchor="middle" letterSpacing="0.06em">{ch.toUpperCase()}</text>
            {/* Arrow to hub */}
            <path d={`M 124 ${y} Q 200 ${y} 240 140`} stroke={C.cobalt} strokeWidth="1" fill="none" strokeOpacity="0.55" />
            <circle r="2" fill={C.cobalt}>
              <animateMotion dur={`${2.4 + i * 0.3}s`} repeatCount="indefinite" path={`M 124 ${y} Q 200 ${y} 240 140`} />
            </circle>
          </g>
        )
      })}
      {/* Hub — single ledger */}
      <circle cx="240" cy="140" r="44" fill={C.ink} />
      <circle cx="240" cy="140" r="56" fill="none" stroke={C.cobalt} strokeWidth="1" strokeDasharray="3 4" />
      <text x="240" y="135" fontSize="11" fontFamily='var(--font-mono), monospace' fill={C.bg} textAnchor="middle" letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>One</text>
      <text x="240" y="150" fontSize="11" fontFamily='var(--font-mono), monospace' fill={C.bg} textAnchor="middle" letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>Ledger</text>
      {/* Sync arrows back out — shows reconciliation */}
      {channels.map((ch, i) => {
        const y = 30 + i * 50
        return (
          <g key={`back-${ch}`}>
            <path d={`M 240 140 Q 320 140 360 ${y}`} stroke={C.ink} strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="2 3" fill="none" />
            <rect x="360" y={y - 14} width="100" height="28" fill={C.bg} stroke={C.ink} strokeWidth="1" strokeOpacity="0.4" />
            <text x="410" y={y + 4} fontSize="10" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.06em">{ch.toUpperCase()}</text>
          </g>
        )
      })}
      {/* Captions */}
      <text x="70" y="285" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>Channels in</text>
      <text x="240" y="285" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>Reconciled</text>
      <text x="410" y="285" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>Synced back</text>
    </svg>
  )
}

// 02 — Orders & Fulfilment: order routes through decision tree to carrier
function DiagramRoute() {
  return (
    <svg viewBox="0 0 480 280" width="100%" style={{ display: 'block' }}>
      {/* Order in */}
      <rect x="14" y="120" width="100" height="40" fill={C.ink} />
      <text x="64" y="138" fontSize="10" fontFamily='var(--font-mono), monospace' fill={C.bg} textAnchor="middle" letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>Order</text>
      <text x="64" y="152" fontSize="10" fontFamily='var(--font-mono), monospace' fill={C.cobalt} textAnchor="middle" letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>$142.18</text>
      {/* Decision diamond */}
      <path d="M 160 140 L 200 110 L 240 140 L 200 170 Z" fill={C.surface} stroke={C.ink} strokeWidth="1" />
      <text x="200" y="138" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.ink} textAnchor="middle" letterSpacing="0.08em" style={{ textTransform: 'uppercase' }}>Region</text>
      <text x="200" y="150" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.06em">SLA · SKU</text>
      <line x1="114" y1="140" x2="160" y2="140" stroke={C.cobalt} strokeWidth="1.4" />
      {/* Three branches */}
      {[
        { y: 60,  carrier: 'DHL · EU',     time: '2 day' },
        { y: 140, carrier: 'USPS · US',    time: '3 day' },
        { y: 220, carrier: 'Aus Post',     time: '5 day' },
      ].map((b, i) => (
        <g key={i}>
          <path d={`M 240 140 Q 290 140 330 ${b.y + 20}`} stroke={i === 1 ? C.cobalt : C.ink} strokeWidth={i === 1 ? 1.4 : 0.9} strokeOpacity={i === 1 ? 1 : 0.45} fill="none" />
          <rect x="332" y={b.y} width="120" height="40" fill={i === 1 ? C.ink : C.surface} stroke={C.ink} strokeWidth="1" strokeOpacity={i === 1 ? 1 : 0.4} />
          <text x="392" y={b.y + 18} fontSize="11" fontFamily='var(--font-mono), monospace' fill={i === 1 ? C.bg : C.muted} textAnchor="middle" letterSpacing="0.04em">{b.carrier}</text>
          <text x="392" y={b.y + 32} fontSize="9" fontFamily='var(--font-mono), monospace' fill={i === 1 ? C.cobalt : C.muted} textAnchor="middle" letterSpacing="0.06em">{b.time}</text>
        </g>
      ))}
      <text x="64" y="100" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>Inbound</text>
      <text x="200" y="195" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>Auto-route</text>
      <text x="392" y="270" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>Best carrier wins</text>
    </svg>
  )
}

// 03 — Procurement & Forecasting: velocity curve, threshold, PO trigger
function DiagramForecast() {
  return (
    <svg viewBox="0 0 480 280" width="100%" style={{ display: 'block' }}>
      {/* Axes */}
      <line x1="40" y1="240" x2="460" y2="240" stroke={C.ink} strokeWidth="1" />
      <line x1="40" y1="40" x2="40" y2="240" stroke={C.ink} strokeWidth="1" />
      {/* History curve (solid) */}
      <path d="M 40 200 L 80 195 L 120 180 L 160 170 L 200 155 L 240 140" stroke={C.ink} strokeWidth="1.6" fill="none" />
      {/* Forecast curve (dashed cobalt) */}
      <path d="M 240 140 L 280 122 L 320 105 L 360 88 L 400 72 L 440 58" stroke={C.cobalt} strokeWidth="1.6" fill="none" strokeDasharray="4 4" />
      {/* Stockout threshold */}
      <line x1="40" y1="100" x2="460" y2="100" stroke={C.oxblood} strokeWidth="1" strokeDasharray="2 4" />
      <text x="450" y="95" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.oxblood} textAnchor="end" letterSpacing="0.06em" style={{ textTransform: 'uppercase' }}>Reorder threshold</text>
      {/* Threshold cross marker */}
      <circle cx="335" cy="100" r="6" fill={C.surface} stroke={C.cobalt} strokeWidth="1.6" />
      <circle cx="335" cy="100" r="2.5" fill={C.cobalt} />
      {/* PO trigger line */}
      <line x1="335" y1="100" x2="335" y2="40" stroke={C.cobalt} strokeWidth="0.8" strokeDasharray="2 3" />
      <rect x="290" y="20" width="90" height="22" fill={C.cobalt} />
      <text x="335" y="35" fontSize="10" fontFamily='var(--font-mono), monospace' fill={C.bg} textAnchor="middle" letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>PO #4421</text>
      {/* Today marker */}
      <line x1="240" y1="40" x2="240" y2="240" stroke={C.ink} strokeWidth="0.8" strokeDasharray="2 3" strokeOpacity="0.4" />
      <text x="240" y="258" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.06em">TODAY</text>
      {/* Axis labels */}
      <text x="60" y="258" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} letterSpacing="0.06em">−90D</text>
      <text x="445" y="258" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="end" letterSpacing="0.06em">+30D</text>
      <text x="22" y="60" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="end" letterSpacing="0.06em" style={{ textTransform: 'uppercase' }}>Demand</text>
    </svg>
  )
}

// 04 — Profit & Analytics: Sankey-style deduction Revenue → Net Margin
function DiagramPnL() {
  return (
    <svg viewBox="0 0 480 280" width="100%" style={{ display: 'block' }}>
      {/* Big revenue bar */}
      <rect x="20" y="80" width="80" height="120" fill={C.ink} />
      <text x="60" y="225" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.08em" style={{ textTransform: 'uppercase' }}>Revenue</text>
      <text x="60" y="240" fontSize="11" fontFamily='var(--font-mono), monospace' fill={C.ink} textAnchor="middle" fontWeight="600">$612k</text>

      {/* Deduction strips */}
      {[
        { x: 130, w: 50, h: 30,  label: 'Fees',       v: '−$78k',  color: C.muted },
        { x: 190, w: 50, h: 28,  label: 'Fulfilment', v: '−$54k',  color: C.muted },
        { x: 250, w: 50, h: 22,  label: 'Ad spend',   v: '−$42k',  color: C.muted },
        { x: 310, w: 50, h: 56,  label: 'COGS',       v: '−$268k', color: C.muted },
        { x: 370, w: 50, h: 18,  label: 'Tax · VAT',  v: '−$42k',  color: C.muted },
      ].map(d => (
        <g key={d.label}>
          <rect x={d.x} y={200 - d.h} width={d.w} height={d.h} fill={d.color} opacity="0.45" />
          <text x={d.x + d.w / 2} y="225" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.06em" style={{ textTransform: 'uppercase' }}>{d.label}</text>
          <text x={d.x + d.w / 2} y="240" fontSize="10" fontFamily='var(--font-mono), monospace' fill={C.oxblood} textAnchor="middle">{d.v}</text>
        </g>
      ))}

      {/* Net margin bar — accent */}
      <rect x="430" y="155" width="40" height="45" fill={C.cobalt} />
      <text x="450" y="225" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.cobalt} textAnchor="middle" letterSpacing="0.08em" style={{ textTransform: 'uppercase', fontWeight: 700 }}>Net</text>
      <text x="450" y="240" fontSize="11" fontFamily='var(--font-mono), monospace' fill={C.cobalt} textAnchor="middle" fontWeight="700">$128k</text>

      {/* Connecting waterline */}
      <line x1="20" y1="80" x2="100" y2="80" stroke={C.ink} strokeWidth="1" />
      <line x1="100" y1="80" x2="430" y2="155" stroke={C.cobalt} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="430" y1="155" x2="470" y2="155" stroke={C.cobalt} strokeWidth="1" />

      {/* Top label */}
      <text x="240" y="40" fontSize="11" fontFamily='var(--font-mono), monospace' fill={C.ink} textAnchor="middle" letterSpacing="0.18em" style={{ textTransform: 'uppercase', fontWeight: 600 }}>Q1 · Net Margin Waterfall</text>
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// "Versus" diagram — fragmented timeline → unified
// ════════════════════════════════════════════════════════════════════════════
function DiagramVersus() {
  const incumbents = [
    { name: 'ChannelAdvisor', year: '2001', cy: 70 },
    { name: 'Brightpearl',    year: '2007', cy: 130 },
    { name: 'Linnworks',      year: '2006', cy: 190 },
    { name: 'Feedonomics',    year: '2014', cy: 250 },
  ]
  return (
    <svg viewBox="0 0 1280 320" width="100%" style={{ display: 'block' }}>
      {/* Timeline axis */}
      <line x1="80" y1="160" x2="1200" y2="160" stroke={C.bg} strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 6" />
      {/* Year markers */}
      {['2001', '2007', '2014', '2026'].map((y, i) => {
        const x = 100 + i * 350
        return (
          <text key={y} x={x} y="306" fontSize="10" fontFamily='var(--font-mono), monospace' fill="rgba(243,240,234,0.5)" textAnchor="middle" letterSpacing="0.1em">{y}</text>
        )
      })}
      {/* Incumbent boxes — scattered, separated */}
      {incumbents.map((inc, i) => {
        const x = 80 + i * 130 + Math.sin(i) * 20
        return (
          <g key={inc.name}>
            <rect x={x} y={inc.cy - 18} width="140" height="36" fill="rgba(243,240,234,0.06)" stroke="rgba(243,240,234,0.25)" strokeWidth="1" />
            <text x={x + 70} y={inc.cy - 2} fontSize="11" fontFamily='var(--font-display-v6), Georgia, serif' fill="rgba(243,240,234,0.7)" textAnchor="middle">{inc.name}</text>
            <text x={x + 70} y={inc.cy + 12} fontSize="9" fontFamily='var(--font-mono), monospace' fill="rgba(243,240,234,0.4)" textAnchor="middle" letterSpacing="0.06em">{inc.year}</text>
            {/* Lonely connecting line drifting toward Auxio */}
            <path d={`M ${x + 140} ${inc.cy} Q ${(x + 1080) / 2} 160 1080 160`} stroke="rgba(243,240,234,0.12)" strokeWidth="0.6" fill="none" strokeDasharray="2 5" />
          </g>
        )
      })}
      {/* Auxio — the unified box, glowing */}
      <rect x="1080" y="118" width="180" height="84" fill={C.cobalt} />
      <rect x="1072" y="110" width="196" height="100" fill="none" stroke={C.cobalt} strokeWidth="1" strokeOpacity="0.4" />
      <rect x="1064" y="102" width="212" height="116" fill="none" stroke={C.cobalt} strokeWidth="1" strokeOpacity="0.18" />
      <text x="1170" y="150" fontSize="22" fontFamily='var(--font-display-v6), Georgia, serif' fill={C.bg} textAnchor="middle" letterSpacing="-0.01em">Auxio</text>
      <text x="1170" y="174" fontSize="10" fontFamily='var(--font-mono), monospace' fill={C.bg} textAnchor="middle" letterSpacing="0.16em" style={{ textTransform: 'uppercase' }}>One platform</text>
      <text x="1170" y="190" fontSize="9" fontFamily='var(--font-mono), monospace' fill="rgba(243,240,234,0.7)" textAnchor="middle" letterSpacing="0.06em">est. 2026</text>
      {/* Section captions */}
      <text x="80" y="40" fontSize="10" fontFamily='var(--font-mono), monospace' fill="rgba(243,240,234,0.5)" letterSpacing="0.18em" style={{ textTransform: 'uppercase' }}>Then — fragmented stack</text>
      <text x="1260" y="40" fontSize="10" fontFamily='var(--font-mono), monospace' fill={C.cobalt} textAnchor="end" letterSpacing="0.18em" style={{ textTransform: 'uppercase', fontWeight: 700 }}>Now — one ledger</text>
    </svg>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
const NAV = [
  { label: 'Atlas',    href: '#atlas' },
  { label: 'Platform', href: '#platform' },
  { label: 'Why',      href: '#why' },
  { label: 'Pricing',  href: '#pricing' },
]

const PILLARS = [
  { n: '01', head: 'Inventory',   sub: 'One ledger.',         Diagram: DiagramSync     },
  { n: '02', head: 'Orders',      sub: 'Routed automatically.', Diagram: DiagramRoute    },
  { n: '03', head: 'Forecasting', sub: 'Reorder before stockout.', Diagram: DiagramForecast },
  { n: '04', head: 'Profit',      sub: 'True net margin.',    Diagram: DiagramPnL      },
]

const QUOTES = [
  { metric: '+34%', label: 'net margin · 60d',         q: 'One screen. A P&L we trust.',                 who: 'Sarah T.', role: 'Apparel · 6 channels' },
  { metric: '$5,400', label: 'saved · year',            q: 'Auxio showed me my real margin.',             who: 'Marcus L.', role: 'Electronics · US/UK/EU' },
  { metric: '0', label: 'stockouts · Q1',               q: 'No emergency reorders since November.',       who: 'Priya K.', role: 'Beauty · 500 SKUs' },
]

const PRICE = [
  { name: 'Starter',    price: 59,   tag: 'Founding',     desc: 'Solo, 1–2 markets.',           cta: 'Begin' },
  { name: 'Growth',     price: 159,  tag: 'Most adopted', desc: 'Multi-channel, multi-region.', cta: 'Begin', flag: true },
  { name: 'Scale',      price: 499,  tag: 'Best value',   desc: 'High-volume operations.',       cta: 'Begin' },
  { name: 'Enterprise', price: null, tag: 'Bespoke',      desc: 'Multi-region, custom SLA.',     cta: 'Speak with us' },
]

export default function LandingV6() {
  return (
    <div className={display.variable} style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: 'var(--font-geist), -apple-system, sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(243,240,234,0.86)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.ink }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.ink} />
              <rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt} />
            </svg>
            <span style={{ fontFamily: 'var(--font-display-v6), Georgia, serif', fontSize: 24, lineHeight: 1, letterSpacing: '-0.015em' }}>Auxio</span>
          </Link>
          <nav style={{ display: 'flex', gap: 28 }}>
            {NAV.map(n => <a key={n.href} href={n.href} style={{ fontSize: 13, color: C.mutedDk, textDecoration: 'none' }}>{n.label}</a>)}
          </nav>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: 13, color: C.mutedDk, textDecoration: 'none', padding: '8px 4px' }}>Sign in</Link>
            <Link href="/signup" style={{ fontSize: 13, color: C.bg, background: C.ink, padding: '10px 18px', textDecoration: 'none', fontWeight: 500 }}>Begin trial</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="atlas" style={{ padding: '64px 32px 32px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <span style={{ width: 24, height: 1, background: C.cobalt }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.cobalt, fontWeight: 600 }}>Live · Auxio Atlas</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display-v6), Georgia, serif', fontSize: 'clamp(64px, 10vw, 148px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 0.94, color: C.ink, margin: 0 }}>
            Commerce, <em style={{ fontStyle: 'italic', color: C.cobalt }}>operated.</em>
          </h1>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 28, gap: 32, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 20, lineHeight: 1.4, color: C.mutedDk, margin: 0, maxWidth: 460, fontFamily: 'var(--font-display-v6), Georgia, serif' }}>
              One platform. Every market.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/signup" style={{ background: C.ink, color: C.bg, padding: '15px 24px', textDecoration: 'none', fontSize: 14, fontWeight: 500, letterSpacing: '0.01em', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Begin trial<span style={{ fontFamily: 'var(--font-mono), monospace' }}>→</span>
              </Link>
              <Link href="/contact" style={{ background: 'transparent', color: C.ink, padding: '15px 24px', textDecoration: 'none', fontSize: 14, fontWeight: 500, border: `1px solid ${C.ink}` }}>
                Brief
              </Link>
            </div>
          </div>
          <div style={{ marginTop: 40 }}>
            <LiveMap />
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section style={{ padding: '64px 32px', borderTop: `1px solid ${C.rule}`, borderBottom: `1px solid ${C.rule}`, background: C.surface }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
          {[
            { v: 3200000, p: '$', s: '+', label: 'GMV / mo' },
            { v: 40,      s: '+', label: 'Countries' },
            { v: 12,      label: 'Marketplaces' },
            { v: 65,      s: '%', label: 'Fewer errors' },
            { v: 10,      s: ' min', label: 'To live' },
          ].map((m, i) => (
            <div key={i} style={{ borderLeft: i === 0 ? 'none' : `1px solid ${C.rule}`, paddingLeft: i === 0 ? 0 : 28, paddingRight: 16 }}>
              <div style={{ fontFamily: 'var(--font-display-v6), Georgia, serif', fontSize: 'clamp(44px, 5.5vw, 72px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1, color: C.ink, marginBottom: 12 }}>
                <Counter to={m.v} prefix={m.p} suffix={m.s} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars — diagram-led */}
      <section id="platform" style={{ padding: '120px 32px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 56 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>Platform</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted }}>§ 02 — Four primitives</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, borderTop: `1px solid ${C.ink}`, borderLeft: `1px solid ${C.ink}` }}>
            {PILLARS.map(p => (
              <article key={p.n} style={{ borderRight: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}`, padding: '32px 36px 28px', background: C.surface, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.18em', fontWeight: 700 }}>{p.n}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display-v6), Georgia, serif', fontSize: 40, fontWeight: 400, letterSpacing: '-0.022em', lineHeight: 1.0, color: C.ink, margin: 0 }}>
                  {p.head}<span style={{ color: C.muted, fontStyle: 'italic', fontSize: 22, marginLeft: 12 }}>{p.sub}</span>
                </h3>
                <div style={{ marginTop: 28, padding: '16px 0', borderTop: `1px solid ${C.ruleSoft}` }}>
                  <p.Diagram />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Why — single big diagram, no prose */}
      <section id="why" style={{ padding: '120px 32px', background: C.ink, color: C.bg }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 48 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>Why Auxio</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(243,240,234,0.18)' }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: 'rgba(243,240,234,0.5)' }}>§ 03</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display-v6), Georgia, serif', fontSize: 'clamp(48px, 6vw, 84px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.0, color: C.bg, margin: '0 0 64px', maxWidth: 880 }}>
            Four tools then. <em style={{ color: '#7BB7FF', fontStyle: 'italic' }}>One platform now.</em>
          </h2>
          <DiagramVersus />
        </div>
      </section>

      {/* Customers */}
      <section style={{ padding: '120px 32px', background: C.bg, borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 56 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>Operators</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted }}>§ 04</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {QUOTES.map((q, i) => (
              <figure key={i} style={{ margin: 0, padding: 0, background: C.surface, border: `1px solid ${C.rule}` }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${C.rule}` }}>
                  <div style={{ fontFamily: 'var(--font-display-v6), Georgia, serif', fontSize: 36, fontWeight: 400, color: C.cobalt, letterSpacing: '-0.02em', lineHeight: 1 }}>{q.metric}</div>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, letterSpacing: '0.06em', textAlign: 'right', textTransform: 'uppercase' }}>{q.label}</div>
                </div>
                <div style={{ padding: 24 }}>
                  <blockquote style={{ margin: '0 0 24px', fontFamily: 'var(--font-display-v6), Georgia, serif', fontSize: 22, lineHeight: 1.35, color: C.ink, fontWeight: 400 }}>
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

      {/* Pricing */}
      <section id="pricing" style={{ padding: '120px 32px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>Pricing</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted }}>§ 05</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display-v6), Georgia, serif', fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.05, color: C.ink, margin: '0 0 56px', maxWidth: 880 }}>
            Flat. <em style={{ color: C.cobalt, fontStyle: 'italic' }}>Never a cut of revenue.</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: `1px solid ${C.ink}`, borderLeft: `1px solid ${C.ink}` }}>
            {PRICE.map(p => (
              <div key={p.name} style={{ borderRight: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}`, padding: '32px 28px', background: p.flag ? C.ink : C.surface, color: p.flag ? C.bg : C.ink, position: 'relative' }}>
                {p.flag && <div style={{ position: 'absolute', top: -1, left: -1, right: -1, height: 4, background: C.cobalt }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
                  <span style={{ fontFamily: 'var(--font-display-v6), Georgia, serif', fontSize: 26, fontWeight: 400 }}>{p.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: p.flag ? 'rgba(243,240,234,0.55)' : C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{p.tag}</span>
                </div>
                {p.price !== null ? (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, fontFamily: 'var(--font-display-v6), Georgia, serif' }}>
                      <span style={{ fontSize: 18, color: p.flag ? 'rgba(243,240,234,0.65)' : C.muted }}>$</span>
                      <span style={{ fontSize: 64, fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{p.price}</span>
                      <span style={{ fontSize: 14, color: p.flag ? 'rgba(243,240,234,0.65)' : C.muted, marginLeft: 4 }}>/ mo</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-display-v6), Georgia, serif', fontSize: 36, fontWeight: 400, marginBottom: 16, letterSpacing: '-0.02em' }}>Bespoke</div>
                )}
                <p style={{ fontSize: 13, lineHeight: 1.55, color: p.flag ? 'rgba(243,240,234,0.7)' : C.muted, margin: '0 0 28px', minHeight: 36 }}>{p.desc}</p>
                <Link href={p.price === null ? '/contact' : '/signup'} style={{ display: 'block', textAlign: 'center', padding: '12px 16px', background: p.flag ? C.bg : C.ink, color: p.flag ? C.ink : C.bg, fontSize: 12.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none' }}>{p.cta}</Link>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
            <span>USD · GBP · EUR · AUD · CAD</span>
            <Link href="/pricing" style={{ color: C.cobalt, textDecoration: 'none' }}>Full schedule →</Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '120px 32px', background: C.surface, borderTop: `1px solid ${C.rule}`, borderBottom: `1px solid ${C.rule}`, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display-v6), Georgia, serif', fontSize: 'clamp(56px, 7vw, 104px)', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.0, color: C.ink, margin: '0 0 32px' }}>
          One ledger. <em style={{ color: C.cobalt, fontStyle: 'italic' }}>One operation.</em>
        </h2>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/signup" style={{ background: C.ink, color: C.bg, padding: '17px 32px', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Begin trial</Link>
          <Link href="/contact" style={{ background: 'transparent', color: C.ink, padding: '17px 32px', textDecoration: 'none', fontSize: 14, fontWeight: 500, border: `1px solid ${C.ink}` }}>Brief</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '48px 32px 32px', background: C.bg }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.ink} />
                <rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt} />
              </svg>
              <span style={{ fontFamily: 'var(--font-display-v6), Georgia, serif', fontSize: 22, letterSpacing: '-0.015em' }}>Auxio</span>
            </div>
            <p style={{ fontSize: 14, color: C.mutedDk, fontFamily: 'var(--font-display-v6), Georgia, serif', fontStyle: 'italic', margin: 0 }}>
              Commerce, operated.
            </p>
          </div>
          {[
            { h: 'Platform', l: [['Atlas', '#atlas'], ['Pillars', '#platform'], ['Pricing', '#pricing']] },
            { h: 'Compare',  l: [['ChannelAdvisor', '/vs/channelAdvisor'], ['Brightpearl', '/vs/brightpearl'], ['Linnworks', '/vs/linnworks'], ['Feedonomics', '/vs/baselinker']] },
            { h: 'Company',  l: [['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
          ].map(col => (
            <div key={col.h}>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.cobalt, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>{col.h}</div>
              {col.l.map(([label, href]) => <Link key={label} href={href} style={{ display: 'block', fontSize: 13, color: C.mutedDk, textDecoration: 'none', marginBottom: 8 }}>{label}</Link>)}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1320, margin: '32px auto 0', borderTop: `1px solid ${C.rule}`, paddingTop: 18, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.04em' }}>
          <span>© MMXXVI · NPX Solutions</span>
          <span>Worldwide · Multi-currency</span>
        </div>
      </footer>
    </div>
  )
}
