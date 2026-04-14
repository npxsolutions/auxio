'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Meridia — Landing v8
// Delta from v7: surgical copy rewrites (Stripe/Linear/Vercel-grade) + SVG
// craft pass (1.5px stroke discipline, two-color limit, ring nodes, motion
// discipline). Section structure unchanged from v7.
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'
import { useEffect, useRef, useState } from 'react'
import { useFlag } from '../../lib/ab'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display-v8',
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

// ── Hubs / map ──────────────────────────────────────────────────────────────
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
const DOT_FIELD: { x: number; y: number; r: number }[] = (() => {
  const dots: { x: number; y: number; r: number }[] = []
  const step = 13
  for (let y = 14; y < MAP_H - 14; y += step) {
    for (let x = 14; x < MAP_W - 14; x += step) {
      if (!isLand(x, y)) continue
      dots.push({ x, y, r: 1.5 })
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

// ── Hooks ───────────────────────────────────────────────────────────────────
function useReveal<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { obs.disconnect(); setTimeout(() => setShown(true), delay) }
    }, { threshold: 0.15 })
    obs.observe(el); return () => obs.disconnect()
  }, [delay])
  return { ref, style: { opacity: shown ? 1 : 0, transform: shown ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 700ms cubic-bezier(.2,.7,.2,1), transform 700ms cubic-bezier(.2,.7,.2,1)' } as const }
}

function useParallax<T extends HTMLElement>(speed = 0.25) {
  const ref = useRef<T>(null)
  const [y, setY] = useState(0)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setY(window.scrollY * -speed)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [speed])
  return { ref, style: { transform: `translate3d(0, ${y}px, 0)`, willChange: 'transform' } as const }
}

function Counter({ to, prefix = '', suffix = '', decimals = 0 }: { to: number; prefix?: string; suffix?: string; decimals?: number }) {
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
  const formatted = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString()
  return <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>{prefix}{formatted}{suffix}</span>
}

function LiveGMV() {
  const [n, setN] = useState(3214842)
  useEffect(() => {
    const id = setInterval(() => setN(v => v + Math.floor(40 + Math.random() * 180)), 1600)
    return () => clearInterval(id)
  }, [])
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>${n.toLocaleString()}</span>
}

// ── Live map ─────────────────────────────────────────────────────────────────
// SVG craft: 1.5px strokes; ink + cobalt only; ring nodes; one moving element.
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
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.cobalt }} />
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, letterSpacing: '0.02em', color: C.mutedDk, fontWeight: 500 }}>Meridia Atlas — live across 42 markets</span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, letterSpacing: '0.06em' }}>
          <span>{HUBS.length} markets</span><span>·</span><span>{ARCS.length} active routes</span>
        </div>
      </div>

      <div style={{ position: 'relative', background: C.surface }}>
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} width="100%" style={{ display: 'block', background: 'linear-gradient(180deg, #f9f7f1 0%, #ffffff 100%)' }} aria-label="Live world map of order flow">
          <defs>
            <linearGradient id="arcGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={C.cobalt} stopOpacity={0} />
              <stop offset="50%"  stopColor={C.cobalt} stopOpacity={0.95} />
              <stop offset="100%" stopColor={C.cobalt} stopOpacity={0} />
            </linearGradient>
            <radialGradient id="hubGlow"><stop offset="0%" stopColor={C.cobalt} stopOpacity={0.45} /><stop offset="100%" stopColor={C.cobalt} stopOpacity={0} /></radialGradient>
          </defs>
          {/* Graticules — stay 0.5px per S2 exception */}
          {[15, 30, 45, 60, 75].map(lat => (
            <line key={`lat${lat}`} x1="0" x2={MAP_W} y1={projectMercator(lat, 0).y} y2={projectMercator(lat, 0).y} stroke={C.ink} strokeOpacity={0.04} strokeWidth={0.5} strokeDasharray="2 6" />
          ))}
          {[-60, -30, 0, 30, 60, 90, 120, 150].map(lon => {
            const x = ((lon + 180) / 360) * MAP_W
            return <line key={`lon${lon}`} x1={x} x2={x} y1="0" y2={MAP_H} stroke={C.ink} strokeOpacity={0.04} strokeWidth={0.5} strokeDasharray="2 6" />
          })}
          {DOT_FIELD.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={C.ink} opacity={0.38} />
          ))}
          {ARCS.map((a, i) => {
            const from = projectMercator(hubMap[a.from].lat, hubMap[a.from].lon)
            const to = projectMercator(hubMap[a.to].lat, hubMap[a.to].lon)
            const isActive = i === activeIdx
            return (
              <g key={`${a.from}-${a.to}-${i}`}>
                <path d={arcPath(from, to)} fill="none" stroke={isActive ? 'url(#arcGradient)' : C.cobalt} strokeOpacity={isActive ? 1 : 0.22} strokeWidth={isActive ? 2 : 0.8} strokeLinecap="round" style={{ strokeDasharray: isActive ? '6 8' : 'none', animation: isActive ? 'arcdash 2.4s linear forwards' : undefined }} />
                {isActive && <circle r={4} fill={C.cobalt}><animateMotion dur="2.2s" repeatCount="1" path={arcPath(from, to)} /></circle>}
              </g>
            )
          })}
          {HUBS.map(h => {
            const p = projectMercator(h.lat, h.lon)
            const isActive = h.id === ARCS[activeIdx].from || h.id === ARCS[activeIdx].to
            if (isActive) {
              return (
                <g key={h.id}>
                  <circle cx={p.x} cy={p.y} r={14} fill="url(#hubGlow)" />
                  <circle cx={p.x} cy={p.y} r={h.tier === 1 ? 3.2 : 2.2} fill={C.cobalt} />
                  <circle cx={p.x} cy={p.y} r={h.tier === 1 ? 5 : 3.6} fill="none" stroke={C.cobalt} strokeOpacity={0.5} strokeWidth={1.5} />
                  {h.tier === 1 && <text x={p.x + 7} y={p.y + 3.5} fontSize={10} fontFamily='var(--font-mono), monospace' fill={C.cobaltDk} letterSpacing="0.04em" style={{ textTransform: 'uppercase', fontWeight: 600 }}>{h.city}</text>}
                </g>
              )
            }
            return (
              <g key={h.id}>
                <circle cx={p.x} cy={p.y} r={h.tier === 1 ? 3.2 : 2.2} fill="none" stroke={C.ink} strokeWidth={1.5} opacity={0.45} />
                {h.tier === 1 && <text x={p.x + 7} y={p.y + 3.5} fontSize={10} fontFamily='var(--font-mono), monospace' fill={C.mutedDk} letterSpacing="0.04em" style={{ textTransform: 'uppercase', fontWeight: 600 }}>{h.city}</text>}
              </g>
            )
          })}
        </svg>

        <div style={{ position: 'absolute', left: 18, bottom: 18, background: 'rgba(11,15,26,0.95)', color: C.bg, padding: '10px 14px', minWidth: 320, borderLeft: `2px solid ${C.cobalt}` }}>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(243,240,234,0.55)', marginBottom: 6 }}>Order received · just now</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 18 }}>
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
              <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 18, color: C.ink, lineHeight: 1, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PILLAR DIAGRAMS — 1.5px strokes, ink + cobalt, ring nodes, no motion
// ════════════════════════════════════════════════════════════════════════════

function DiagramSync() {
  const channels = ['eBay', 'Amazon', 'Shopify', 'Etsy', 'OnBuy']
  return (
    <svg viewBox="0 0 480 280" width="100%" style={{ display: 'block' }}>
      {channels.map((ch, i) => {
        const y = 30 + i * 50
        return (
          <g key={ch}>
            <rect x="20" y={y - 14} width="100" height="28" fill={C.surface} stroke={C.ink} strokeWidth="1.5" />
            <text x="70" y={y + 4} fontSize="11" fontFamily='var(--font-mono), monospace' fill={C.ink} textAnchor="middle" letterSpacing="0.06em">{ch.toUpperCase()}</text>
            <path d={`M 124 ${y} Q 200 ${y} 240 140`} stroke={C.cobalt} strokeWidth="1.5" fill="none" strokeOpacity="0.55" />
          </g>
        )
      })}
      {/* Central hub: ring only */}
      <circle cx="240" cy="140" r="44" fill="none" stroke={C.ink} strokeWidth="1.5" />
      <circle cx="240" cy="140" r="56" fill="none" stroke={C.cobalt} strokeWidth="1.5" strokeDasharray="3 4" />
      <text x="240" y="135" fontSize="11" fontFamily='var(--font-mono), monospace' fill={C.ink} textAnchor="middle" letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>One</text>
      <text x="240" y="150" fontSize="11" fontFamily='var(--font-mono), monospace' fill={C.ink} textAnchor="middle" letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>Ledger</text>
      {channels.map((ch, i) => {
        const y = 30 + i * 50
        return (
          <g key={`back-${ch}`}>
            <path d={`M 240 140 Q 320 140 360 ${y}`} stroke={C.ink} strokeWidth="1.5" strokeOpacity="0.45" strokeDasharray="2 3" fill="none" />
            <rect x="360" y={y - 14} width="100" height="28" fill={C.surface} stroke={C.ink} strokeWidth="1.5" strokeOpacity="0.5" />
            <text x="410" y={y + 4} fontSize="10" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.06em">{ch.toUpperCase()}</text>
          </g>
        )
      })}
      <text x="70" y="285" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>Channels in</text>
      <text x="240" y="285" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>Reconciled</text>
      <text x="410" y="285" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>Synced back</text>
    </svg>
  )
}

function DiagramRoute() {
  return (
    <svg viewBox="0 0 480 280" width="100%" style={{ display: 'block' }}>
      {/* Order box: ring only */}
      <rect x="14" y="120" width="100" height="40" fill={C.surface} stroke={C.ink} strokeWidth="1.5" />
      <text x="64" y="138" fontSize="10" fontFamily='var(--font-mono), monospace' fill={C.ink} textAnchor="middle" letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>Order</text>
      <text x="64" y="152" fontSize="10" fontFamily='var(--font-mono), monospace' fill={C.cobalt} textAnchor="middle" letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>$142.18</text>
      {/* Decision diamond: ring only */}
      <path d="M 160 140 L 200 110 L 240 140 L 200 170 Z" fill="none" stroke={C.ink} strokeWidth="1.5" />
      <text x="200" y="138" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.ink} textAnchor="middle" letterSpacing="0.08em" style={{ textTransform: 'uppercase' }}>Region</text>
      <text x="200" y="150" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.06em">SLA · SKU</text>
      <line x1="114" y1="140" x2="160" y2="140" stroke={C.cobalt} strokeWidth="1.5" />
      {[
        { y: 60,  carrier: 'DHL · EU',     time: '2 day' },
        { y: 140, carrier: 'USPS · US',    time: '3 day' },
        { y: 220, carrier: 'Aus Post',     time: '5 day' },
      ].map((b, i) => {
        const winner = i === 1
        return (
          <g key={i}>
            <path d={`M 240 140 Q 290 140 330 ${b.y + 20}`} stroke={winner ? C.cobalt : C.ink} strokeWidth="1.5" strokeOpacity={winner ? 1 : 0.35} fill="none" />
            <rect x="332" y={b.y} width="120" height="40" fill="none" stroke={winner ? C.cobalt : C.ink} strokeWidth="1.5" strokeOpacity={winner ? 1 : 0.4} />
            <text x="392" y={b.y + 18} fontSize="11" fontFamily='var(--font-mono), monospace' fill={winner ? C.cobalt : C.muted} textAnchor="middle" letterSpacing="0.04em">{b.carrier}</text>
            <text x="392" y={b.y + 32} fontSize="9" fontFamily='var(--font-mono), monospace' fill={winner ? C.cobalt : C.muted} textAnchor="middle" letterSpacing="0.06em">{b.time}</text>
          </g>
        )
      })}
      <text x="64" y="100" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>Inbound</text>
      <text x="200" y="195" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>Auto-route</text>
      <text x="392" y="270" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>Best carrier wins</text>
    </svg>
  )
}

function DiagramForecast() {
  return (
    <svg viewBox="0 0 480 280" width="100%" style={{ display: 'block' }}>
      <line x1="40" y1="240" x2="460" y2="240" stroke={C.ink} strokeWidth="1.5" />
      <line x1="40" y1="40" x2="40" y2="240" stroke={C.ink} strokeWidth="1.5" />
      {/* History */}
      <path d="M 40 200 L 80 195 L 120 180 L 160 170 L 200 155 L 240 140" stroke={C.ink} strokeWidth="1.5" fill="none" />
      {/* Forecast */}
      <path d="M 240 140 L 280 122 L 320 105 L 360 88 L 400 72 L 440 58" stroke={C.cobalt} strokeWidth="1.5" fill="none" strokeDasharray="4 4" />
      {/* Threshold line — ink, not oxblood */}
      <line x1="40" y1="100" x2="460" y2="100" stroke={C.ink} strokeWidth="1.5" strokeDasharray="2 4" />
      <text x="450" y="95" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.ink} textAnchor="end" letterSpacing="0.06em" style={{ textTransform: 'uppercase' }}>Reorder threshold</text>
      {/* Threshold-cross marker — ring only */}
      <circle cx="335" cy="100" r="6" fill="none" stroke={C.cobalt} strokeWidth="1.5" />
      <line x1="335" y1="100" x2="335" y2="40" stroke={C.cobalt} strokeWidth="1.5" strokeDasharray="2 3" />
      {/* PO trigger pill — ring only with cobalt text */}
      <rect x="290" y="20" width="90" height="22" fill="none" stroke={C.cobalt} strokeWidth="1.5" />
      <text x="335" y="35" fontSize="10" fontFamily='var(--font-mono), monospace' fill={C.cobalt} textAnchor="middle" letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>PO #4421</text>
      <line x1="240" y1="40" x2="240" y2="240" stroke={C.ink} strokeWidth="1.5" strokeDasharray="2 3" strokeOpacity="0.4" />
      <text x="240" y="258" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.06em">TODAY</text>
      <text x="60" y="258" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} letterSpacing="0.06em">−90D</text>
      <text x="445" y="258" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="end" letterSpacing="0.06em">+30D</text>
      <text x="22" y="60" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="end" letterSpacing="0.06em" style={{ textTransform: 'uppercase' }}>Demand</text>
    </svg>
  )
}

function DiagramPnL() {
  return (
    <svg viewBox="0 0 480 280" width="100%" style={{ display: 'block' }}>
      {/* Revenue bar — ink fill (data bar exception) */}
      <rect x="20" y="80" width="80" height="120" fill={C.ink} />
      <text x="60" y="225" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.08em" style={{ textTransform: 'uppercase' }}>Revenue</text>
      <text x="60" y="240" fontSize="11" fontFamily='var(--font-mono), monospace' fill={C.ink} textAnchor="middle" fontWeight="600">$612k</text>
      {[
        { x: 130, w: 50, h: 30,  label: 'Fees',       v: '−$78k' },
        { x: 190, w: 50, h: 28,  label: 'Fulfilment', v: '−$54k' },
        { x: 250, w: 50, h: 22,  label: 'Ad spend',   v: '−$42k' },
        { x: 310, w: 50, h: 56,  label: 'COGS',       v: '−$268k' },
        { x: 370, w: 50, h: 18,  label: 'Tax · VAT',  v: '−$42k' },
      ].map(d => (
        <g key={d.label}>
          <rect x={d.x} y={200 - d.h} width={d.w} height={d.h} fill={C.ink} opacity="0.45" />
          <text x={d.x + d.w / 2} y="225" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.muted} textAnchor="middle" letterSpacing="0.06em" style={{ textTransform: 'uppercase' }}>{d.label}</text>
          {/* Financial delta convention exempt */}
          <text x={d.x + d.w / 2} y="240" fontSize="10" fontFamily='var(--font-mono), monospace' fill={C.oxblood} textAnchor="middle">{d.v}</text>
        </g>
      ))}
      {/* Net margin — cobalt accent bar */}
      <rect x="430" y="155" width="40" height="45" fill={C.cobalt} />
      <text x="450" y="225" fontSize="9" fontFamily='var(--font-mono), monospace' fill={C.cobalt} textAnchor="middle" letterSpacing="0.08em" style={{ textTransform: 'uppercase', fontWeight: 700 }}>Net</text>
      <text x="450" y="240" fontSize="11" fontFamily='var(--font-mono), monospace' fill={C.cobalt} textAnchor="middle" fontWeight="700">$128k</text>
      {/* Single cobalt waterline — no separate ink segment */}
      <path d="M 20 80 L 100 80 L 430 155 L 470 155" fill="none" stroke={C.cobalt} strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="240" y="40" fontSize="11" fontFamily='var(--font-mono), monospace' fill={C.ink} textAnchor="middle" letterSpacing="0.18em" style={{ textTransform: 'uppercase', fontWeight: 600 }}>Q1 · Net Margin Waterfall</text>
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// "Inside the ledger"
// ════════════════════════════════════════════════════════════════════════════
type LedgerRow = { sku: string; title: string; channel: string; cur: string; rev: string; margin: string; delta: number }
const LEDGER_ROWS: LedgerRow[] = [
  { sku: 'A-2204-K', title: 'Linen Overshirt · Ecru',    channel: 'Shopify US',  cur: 'USD', rev: '12,418.00', margin: '38.4%', delta:  4.2 },
  { sku: 'J-0017-B', title: 'Ceramic Kettle · Matte',    channel: 'Rakuten JP',  cur: 'JPY', rev: ' 8,902.11', margin: '42.1%', delta:  2.7 },
  { sku: 'D-9912-Z', title: 'Merino Crew · Slate',       channel: 'Amazon DE',   cur: 'EUR', rev: ' 6,180.50', margin: '31.0%', delta: -1.4 },
  { sku: 'I-7741-R', title: 'Leather Card Case',         channel: 'Etsy IT',     cur: 'EUR', rev: ' 4,812.40', margin: '54.8%', delta:  6.1 },
  { sku: 'S-2102-X', title: 'Cedar Diffuser · 120ml',    channel: 'Lazada SG',   cur: 'SGD', rev: ' 3,944.10', margin: '47.3%', delta:  1.9 },
  { sku: 'B-3380-A', title: 'Waxed Canvas Tote',         channel: 'Shopify CA',  cur: 'CAD', rev: ' 3,102.90', margin: '29.6%', delta: -0.8 },
  { sku: 'F-1199-Q', title: 'Cold Brew Carafe · 1L',     channel: 'Flipkart IN', cur: 'INR', rev: ' 2,418.65', margin: '33.2%', delta:  3.3 },
  { sku: 'M-3340-V', title: 'Walnut Desk Tray',          channel: 'Mercado MX',  cur: 'MXN', rev: ' 1,988.00', margin: '40.5%', delta:  0.6 },
]

function LedgerSurface() {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.ink}`, boxShadow: `0 1px 0 ${C.rule}, 0 40px 80px -40px rgba(11,15,26,0.28)` }}>
      {/* Window chrome — ink rings, no traffic-light colors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${C.rule}`, background: C.bg }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'transparent', border: `1.5px solid ${C.ink}`, opacity: 0.5 }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'transparent', border: `1.5px solid ${C.ink}`, opacity: 0.5 }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'transparent', border: `1.5px solid ${C.ink}`, opacity: 0.5 }} />
        <span style={{ marginLeft: 14, fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.mutedDk, letterSpacing: '0.06em' }}>auxio.app / ledger / revenue</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.cobalt }} />
          Synced · 2s ago
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0', borderBottom: `1px solid ${C.rule}`, background: C.surface }}>
        {[
          { k: 'Channel',  v: 'All channels',  active: true  },
          { k: 'Period',   v: 'Last 30 days',  active: true  },
          { k: 'Home',     v: 'USD',           active: true  },
          { k: 'Segment',  v: 'All SKUs',      active: false },
        ].map((f, i) => (
          <div key={f.k} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '14px 20px', borderRight: i < 3 ? `1px solid ${C.rule}` : 'none' }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9.5, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase' }}>{f.k}</span>
            <span style={{ fontSize: 13, color: f.active ? C.ink : C.muted, fontWeight: f.active ? 500 : 400 }}>{f.v}</span>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, color: C.muted }}>▾</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px' }}>
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{LEDGER_ROWS.length} rows</span>
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.06em', fontWeight: 600 }}>Σ $43,766.66</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 2.2fr 1.4fr 0.7fr 1.2fr 0.9fr 0.8fr', padding: '10px 20px', borderBottom: `1px solid ${C.rule}`, background: C.bg, fontFamily: 'var(--font-mono), monospace', fontSize: 9.5, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        <span>SKU</span>
        <span>Item</span>
        <span>Channel</span>
        <span>Cur</span>
        <span style={{ textAlign: 'right' }}>Revenue</span>
        <span style={{ textAlign: 'right' }}>Margin</span>
        <span style={{ textAlign: 'right' }}>Δ 30d</span>
      </div>

      {LEDGER_ROWS.map((r, i) => (
        <div key={r.sku} className="ledger-row" style={{ display: 'grid', gridTemplateColumns: '1.1fr 2.2fr 1.4fr 0.7fr 1.2fr 0.9fr 0.8fr', alignItems: 'center', padding: '12px 20px', borderBottom: i < LEDGER_ROWS.length - 1 ? `1px solid ${C.ruleSoft}` : 'none', fontSize: 13, color: C.ink, transition: 'background 180ms ease' }}>
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11.5, color: C.cobalt, letterSpacing: '0.04em' }}>{r.sku}</span>
          <span style={{ color: C.ink }}>{r.title}</span>
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11.5, color: C.mutedDk, letterSpacing: '0.02em' }}>{r.channel}</span>
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.1em' }}>{r.cur}</span>
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12.5, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: C.ink }}>{r.rev}</span>
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12.5, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: C.mutedDk }}>{r.margin}</span>
          {/* Δ column — financial convention exempt */}
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12.5, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: r.delta >= 0 ? C.emerald : C.oxblood, fontWeight: 600 }}>
            {r.delta >= 0 ? '+' : ''}{r.delta.toFixed(1)}%
          </span>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: `1px solid ${C.rule}`, background: C.bg, fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: C.muted, letterSpacing: '0.06em' }}>
        <span>Normalized to USD · live FX · auto-reconciled</span>
        <span style={{ color: C.ink }}>⌘K · search ledger</span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
const VERSUS_PAIRS = [
  { who: 'ChannelAdvisor', est: 'est. 2001', painHead: '90-day rollout', painSub: 'Consultant-led.',          auxHead: '10 minutes',   auxSub: 'Self-serve onboarding.' },
  { who: 'Linnworks',      est: 'est. 2006', painHead: '40-day onboarding', painSub: 'Manual channel wiring.', auxHead: 'Same day',     auxSub: 'Pre-built integrations.' },
  { who: 'Brightpearl',    est: 'est. 2007', painHead: 'Revenue % pricing', painSub: 'You scale, they scale.', auxHead: 'Flat monthly', auxSub: 'Never a cut of revenue.' },
  { who: 'Feedonomics',    est: 'est. 2014', painHead: '4 tool sprawl',     painSub: 'Feed + OMS + BI + WMS.', auxHead: 'One ledger',   auxSub: 'Inventory → P&L in one place.' },
]

function VersusRow({ p, i }: { p: typeof VERSUS_PAIRS[number]; i: number }) {
  const rev = useReveal<HTMLDivElement>(i * 90)
  return (
    <div ref={rev.ref} style={{ ...rev.style, display: 'grid', gridTemplateColumns: '1.3fr 1.4fr 0.2fr 1.4fr', alignItems: 'stretch', borderRight: `1px solid rgba(243,240,234,0.2)`, borderBottom: `1px solid rgba(243,240,234,0.2)` }}>
      <div style={{ padding: '28px 28px', borderRight: `1px solid rgba(243,240,234,0.12)`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: 'rgba(243,240,234,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>{p.est}</div>
        <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 30, color: C.bg, letterSpacing: '-0.02em', lineHeight: 1 }}>{p.who}</div>
      </div>
      <div style={{ padding: '28px 28px', borderRight: `1px solid rgba(243,240,234,0.12)`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 32, color: 'rgba(243,240,234,0.78)', letterSpacing: '-0.022em', lineHeight: 1.05, fontStyle: 'italic' }}>{p.painHead}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(243,240,234,0.5)', fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.02em' }}>{p.painSub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid rgba(243,240,234,0.12)` }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <path d="M4 8 L18 8 M14 4 L18 8 L14 12 M18 14 L4 14 M8 10 L4 14 L8 18" stroke={C.cobalt} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ padding: '28px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(29,95,219,0.08)' }}>
        <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 34, color: C.bg, letterSpacing: '-0.022em', lineHeight: 1.05 }}>{p.auxHead}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: '#7BB7FF', fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.02em' }}>{p.auxSub}</div>
      </div>
    </div>
  )
}

function VersusStatGrid() {
  return (
    <div style={{ borderTop: `1px solid rgba(243,240,234,0.2)`, borderLeft: `1px solid rgba(243,240,234,0.2)` }}>
      {VERSUS_PAIRS.map((p, i) => <VersusRow key={p.who} p={p} i={i} />)}
    </div>
  )
}

function NumberCell({ m, i }: { m: { v: number; p?: string; s?: string; label: string }; i: number }) {
  const rev = useReveal<HTMLDivElement>(i * 80)
  return (
    <div ref={rev.ref} style={{ ...rev.style, borderLeft: i === 0 ? 'none' : `1px solid ${C.rule}`, paddingLeft: i === 0 ? 0 : 28, paddingRight: 16 }}>
      <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 'clamp(44px, 5.5vw, 72px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1, color: C.ink, marginBottom: 12 }}>
        <Counter to={m.v} prefix={m.p} suffix={m.s} />
      </div>
      <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{m.label}</div>
    </div>
  )
}

function PillarCard({ p, i }: { p: typeof PILLARS[number]; i: number }) {
  const rev = useReveal<HTMLDivElement>(i * 120)
  return (
    <article ref={rev.ref} className="pillar-card" style={{ ...rev.style, borderRight: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}`, padding: '32px 36px 28px', background: C.surface, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: C.cobalt, letterSpacing: '0.02em', fontWeight: 500 }}>{p.tag}</span>
        <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.18em', fontWeight: 600 }}>§ {p.n}</span>
      </div>
      <h3 style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 56, fontWeight: 400, letterSpacing: '-0.028em', lineHeight: 0.98, color: C.ink, margin: 0 }}>
        {p.head}
      </h3>
      <div style={{ marginTop: 28, padding: '16px 0', borderTop: `1px solid ${C.ruleSoft}` }}>
        <p.Diagram />
      </div>
    </article>
  )
}

function QuoteCard({ q, i }: { q: typeof QUOTES[number]; i: number }) {
  const rev = useReveal<HTMLElement>(i * 120)
  return (
    <figure ref={rev.ref as React.RefObject<HTMLElement>} className="quote-card" style={{ ...rev.style, margin: 0, padding: 0, background: C.surface, border: `1px solid ${C.rule}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 36, fontWeight: 400, color: C.cobalt, letterSpacing: '-0.02em', lineHeight: 1 }}>{q.metric}</div>
        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, letterSpacing: '0.06em', textAlign: 'right', textTransform: 'uppercase' }}>{q.label}</div>
      </div>
      <div style={{ padding: 24 }}>
        <blockquote style={{ margin: '0 0 24px', fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 22, lineHeight: 1.35, color: C.ink, fontWeight: 400 }}>
          &ldquo;{q.q}&rdquo;
        </blockquote>
        <figcaption>
          <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{q.who}</div>
          <div style={{ fontSize: 11.5, color: C.muted, fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.04em', marginTop: 2 }}>{q.role}</div>
        </figcaption>
      </div>
    </figure>
  )
}

function PriceRow({ p, i, isLast }: { p: typeof PRICE_ROWS[number]; i: number; isLast: boolean }) {
  const rev = useReveal<HTMLDivElement>(i * 80)
  return (
    <div ref={rev.ref} className="price-row" style={{ ...rev.style, display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 2fr 0.9fr', alignItems: 'center', padding: '28px 0', borderBottom: !isLast ? `1px solid ${C.rule}` : `1px solid ${C.ink}`, position: 'relative', transition: 'background 220ms ease, transform 220ms ease' }}>
      {p.flag && <span style={{ position: 'absolute', left: -14, top: '50%', transform: 'translateY(-50%)', width: 4, height: 48, background: C.cobalt }} />}
      <div>
        <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 40, fontWeight: 400, color: C.ink, letterSpacing: '-0.022em', lineHeight: 1 }}>{p.name}</div>
        <div style={{ marginTop: 8, fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: p.flag ? C.cobalt : C.muted, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>{p.tag}</div>
        <div style={{ marginTop: 6, fontSize: 13, color: C.mutedDk, maxWidth: 280 }}>{p.desc}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        {p.price !== null ? (
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, fontFamily: 'var(--font-display-v8), Georgia, serif' }}>
            <span style={{ fontSize: 18, color: C.muted }}>$</span>
            <span style={{ fontSize: 64, fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: C.ink }}>{p.price}</span>
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 40, fontWeight: 400, letterSpacing: '-0.02em', color: C.ink }}>Bespoke</div>
        )}
      </div>
      <div style={{ paddingLeft: 32, display: 'flex', flexWrap: 'wrap', gap: '6px 18px' }}>
        {p.includes.map(item => (
          <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.mutedDk }}>
            <span style={{ width: 4, height: 4, background: C.cobalt, display: 'inline-block' }} />
            {item}
          </span>
        ))}
      </div>
      <div style={{ textAlign: 'right' }}>
        <Link href={p.price === null ? '/contact' : '/signup'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: p.flag ? C.ink : 'transparent', color: p.flag ? C.bg : C.ink, border: `1px solid ${C.ink}`, fontSize: 13, fontWeight: 500, letterSpacing: '0.02em', textDecoration: 'none' }}>
          {p.cta}<span style={{ fontFamily: 'var(--font-mono), monospace' }}>→</span>
        </Link>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
const NAV = [
  { label: 'Atlas',    href: '#atlas' },
  { label: 'Ledger',   href: '#ledger' },
  { label: 'Platform', href: '#platform' },
  { label: 'Why',      href: '#why' },
  { label: 'Pricing',  href: '#pricing' },
]

const PILLARS = [
  { n: '01', tag: 'One ledger.',           head: 'Inventory',   Diagram: DiagramSync     },
  { n: '02', tag: 'Orders, auto-routed.',  head: 'Orders',      Diagram: DiagramRoute    },
  { n: '03', tag: 'Never a stockout.',     head: 'Forecasting', Diagram: DiagramForecast },
  { n: '04', tag: 'Margin, after everything.', head: 'Profit',  Diagram: DiagramPnL      },
]

const QUOTES = [
  { metric: '+34%',   label: 'net margin · 60d',   q: 'One screen. A P&L we trust.',              who: 'Sarah T.',  role: 'Apparel · 6 channels' },
  { metric: '$5,400', label: 'saved · year',       q: 'Meridia showed me my real margin.',         who: 'Marcus L.', role: 'Electronics · US/UK/EU' },
  { metric: '0',      label: 'stockouts · Q1',     q: 'No emergency reorders since November.',    who: 'Priya K.',  role: 'Beauty · 500 SKUs' },
]

const PRICE_ROWS = [
  { name: 'Starter',    price: 59,   tag: 'Founding',     desc: 'Solo operators, 1–2 markets.',            includes: ['2 channels', '1 region', 'Core ledger'],                       cta: 'Start free' },
  { name: 'Growth',     price: 159,  tag: 'Most adopted', desc: 'Multi-channel across regions.',            includes: ['8 channels', '4 regions', 'Forecasting', 'Multi-currency P&L'], cta: 'Start free', flag: true },
  { name: 'Scale',      price: 499,  tag: 'Best value',   desc: 'High-volume, multi-warehouse ops.',        includes: ['Unlimited channels', 'Unlimited regions', 'Priority sync', 'Custom reports'], cta: 'Start free' },
  { name: 'Enterprise', price: null, tag: 'Bespoke',      desc: 'Multi-region, custom SLA, dedicated IR.',  includes: ['Custom SLA', 'Dedicated incident response', 'Audit log exports'], cta: 'Talk to sales' },
]

// ── Connections — marketplaces + stack ──────────────────────────────────────
type Brand = { name: string; tag: string; mark: (s: number) => React.ReactElement; status?: 'live' | 'beta' }
const BRAND_MARK = (paths: React.ReactNode) => (s: number) => (
  <svg width={s} height={s} viewBox="0 0 32 32" fill="none" aria-hidden>{paths}</svg>
)
const COMMERCE_BRANDS: Brand[] = [
  { name: 'Shopify',      tag: 'Storefront',   status: 'live',  mark: BRAND_MARK(<><path d="M10 11 Q16 6 22 11 L24 26 L8 26 Z" stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round"/><path d="M13 14 V18" stroke={C.cobalt} strokeWidth="1.5" strokeLinecap="round"/></>) },
  { name: 'eBay',         tag: 'Marketplace',  status: 'live',  mark: BRAND_MARK(<><rect x="6" y="10" width="20" height="14" rx="2" stroke={C.ink} strokeWidth="1.5"/><path d="M6 14 L26 14" stroke={C.ink} strokeWidth="1.5"/><circle cx="10" cy="12" r="0.9" fill={C.cobalt}/></>) },
  { name: 'Amazon',       tag: 'Marketplace',  status: 'beta',  mark: BRAND_MARK(<><path d="M6 19 Q16 25 26 19" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" fill="none"/><path d="M22 19 L26 19 L26 15" stroke={C.cobalt} strokeWidth="1.5" strokeLinecap="round"/></>) },
  { name: 'Etsy',         tag: 'Marketplace',  status: 'live',  mark: BRAND_MARK(<><path d="M16 6 L26 12 L26 22 L16 28 L6 22 L6 12 Z" stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round"/><circle cx="16" cy="17" r="3" stroke={C.cobalt} strokeWidth="1.5"/></>) },
  { name: 'TikTok Shop',  tag: 'Marketplace',  status: 'beta',  mark: BRAND_MARK(<><path d="M14 8 V20 A4 4 0 1 1 10 16" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" fill="none"/><path d="M14 8 Q18 12 22 12" stroke={C.cobalt} strokeWidth="1.5" strokeLinecap="round" fill="none"/></>) },
  { name: 'Walmart',      tag: 'Marketplace',  status: 'beta',  mark: BRAND_MARK(<><circle cx="16" cy="16" r="2.5" fill={C.cobalt}/>{[0,60,120,180,240,300].map(a=>(<line key={a} x1="16" y1="16" x2={16+10*Math.cos(a*Math.PI/180)} y2={16+10*Math.sin(a*Math.PI/180)} stroke={C.ink} strokeWidth="1.5" strokeLinecap="round"/>))}</>) },
  { name: 'OnBuy',        tag: 'Marketplace',  status: 'live',  mark: BRAND_MARK(<><path d="M6 12 H9 L12 22 H24 L26 14 H11" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="14" cy="26" r="1.5" fill={C.cobalt}/><circle cx="22" cy="26" r="1.5" fill={C.cobalt}/></>) },
  { name: 'BigCommerce',  tag: 'Storefront',   status: 'live',  mark: BRAND_MARK(<><circle cx="16" cy="16" r="10" stroke={C.ink} strokeWidth="1.5"/><circle cx="16" cy="16" r="6" stroke={C.ink} strokeWidth="1.5" strokeOpacity="0.5"/><circle cx="16" cy="16" r="2" fill={C.cobalt}/></>) },
  { name: 'WooCommerce',  tag: 'Storefront',   status: 'live',  mark: BRAND_MARK(<><path d="M4 10 L10 22 L16 12 L22 22 L28 10" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="16" cy="26" r="1.5" fill={C.cobalt}/></>) },
]
const STACK_BRANDS: Brand[] = [
  { name: 'Stripe',    tag: 'Billing',       mark: BRAND_MARK(<><path d="M20 11 Q14 10 14 13 Q14 15 18 16 Q22 17 22 19 Q22 22 16 21 Q12 20 10 19" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" fill="none"/><circle cx="18" cy="14" r="0.9" fill={C.cobalt}/></>) },
  { name: 'Resend',    tag: 'Email',         mark: BRAND_MARK(<><rect x="6" y="10" width="20" height="12" rx="1.5" stroke={C.ink} strokeWidth="1.5"/><path d="M6 11 L16 18 L26 11" stroke={C.cobalt} strokeWidth="1.5" strokeLinejoin="round" fill="none"/></>) },
  { name: 'Supabase',  tag: 'Data layer',    mark: BRAND_MARK(<><path d="M12 6 L22 6 L22 16 L16 16 L16 26 L6 26 L6 16 L12 16 Z" stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round"/><path d="M16 16 L22 16" stroke={C.cobalt} strokeWidth="1.5"/></>) },
  { name: 'Vercel',    tag: 'Edge runtime',  mark: BRAND_MARK(<><path d="M16 7 L27 24 L5 24 Z" stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round"/><path d="M16 7 L21 17" stroke={C.cobalt} strokeWidth="1.5"/></>) },
  { name: 'PostHog',   tag: 'Analytics',     mark: BRAND_MARK(<><path d="M6 26 L16 16 L26 26" stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round" fill="none"/><path d="M6 20 L12 14 L18 20" stroke={C.cobalt} strokeWidth="1.5" strokeLinejoin="round" fill="none"/></>) },
  { name: 'Sentry',    tag: 'Observability', mark: BRAND_MARK(<><path d="M6 24 L16 6 L26 24 Z" stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round" fill="none"/><path d="M12 20 Q16 14 20 20" stroke={C.cobalt} strokeWidth="1.5" fill="none"/></>) },
]

function BrandTile({ b }: { b: Brand }) {
  const r = useReveal<HTMLDivElement>(0)
  return (
    <div
      ref={r.ref}
      style={{
        background: C.surface, border: `1px solid ${C.rule}`, padding: '20px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'transform 200ms ease, border-color 200ms ease, opacity 700ms cubic-bezier(.2,.7,.2,1)',
        opacity: r.style.opacity,
        transform: r.style.transform,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.ink; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.rule; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
    >
      <div style={{ width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b.mark(32)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 18, lineHeight: 1.1, letterSpacing: '-0.012em', color: C.ink }}>{b.name}</div>
        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, letterSpacing: '0.06em', color: C.muted, marginTop: 2 }}>{b.tag}</div>
      </div>
      {b.status && (
        <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.12em', color: b.status === 'live' ? C.emerald : C.muted, textTransform: 'uppercase', flexShrink: 0 }}>
          <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: 3, background: b.status === 'live' ? C.emerald : C.muted, marginRight: 6, verticalAlign: 'middle' }} />
          {b.status}
        </span>
      )}
    </div>
  )
}

function ConnectionsSection() {
  return (
    <section id="connections" style={{ padding: '96px 32px', background: C.bg, borderBottom: `1px solid ${C.rule}` }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 28 }}>
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: C.cobalt, letterSpacing: '0.02em', fontWeight: 500 }}>Connections</span>
          <div style={{ flex: 1, height: 1, background: C.rule }} />
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted }}>§ 02a — {COMMERCE_BRANDS.length} channels · {STACK_BRANDS.length} stack</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.04, color: C.ink, margin: '0 0 40px', maxWidth: 880 }}>
          Speaks every marketplace. <em style={{ color: C.cobalt, fontStyle: 'italic' }}>Plays with your stack.</em>
        </h2>

        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>Sell on</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: `1px solid ${C.rule}`, borderLeft: `1px solid ${C.rule}`, marginBottom: 48 }}>
          {COMMERCE_BRANDS.map(b => (
            <div key={b.name} style={{ borderRight: `1px solid ${C.rule}`, borderBottom: `1px solid ${C.rule}` }}>
              <BrandTile b={b} />
            </div>
          ))}
        </div>

        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>Built on</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: `1px solid ${C.rule}`, borderLeft: `1px solid ${C.rule}` }}>
          {STACK_BRANDS.map(b => (
            <div key={b.name} style={{ borderRight: `1px solid ${C.rule}`, borderBottom: `1px solid ${C.rule}` }}>
              <BrandTile b={b} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
          <span>More coming · request a channel via <Link href="/contact" style={{ color: C.cobalt, textDecoration: 'none' }}>sales</Link></span>
          <Link href="/integrations" style={{ color: C.cobalt, textDecoration: 'none' }}>Full integration catalog →</Link>
        </div>
      </div>
    </section>
  )
}

export default function LandingV8() {
  const heroPar = useParallax<HTMLHeadingElement>(0.15)
  const heroHeadlineV2 = useFlag('hero-headline-v2', false)
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
            <span style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 24, lineHeight: 1, letterSpacing: '-0.015em' }}>Meridia</span>
          </Link>
          <nav style={{ display: 'flex', gap: 28 }}>
            {NAV.map(n => <a key={n.href} href={n.href} style={{ fontSize: 13, color: C.mutedDk, textDecoration: 'none' }}>{n.label}</a>)}
          </nav>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: 13, color: C.mutedDk, textDecoration: 'none', padding: '8px 4px' }}>Sign in</Link>
            <Link href="/signup" style={{ fontSize: 13, color: C.bg, background: C.ink, padding: '10px 18px', textDecoration: 'none', fontWeight: 500 }}>Start free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="atlas" style={{ padding: '64px 32px 32px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <span style={{ width: 24, height: 1, background: C.cobalt }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, letterSpacing: '0.02em', color: C.cobalt, fontWeight: 500 }}>Meridia Atlas — live across 42 markets</span>
          </div>
          <h1 ref={heroPar.ref} style={{ ...heroPar.style, fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 'clamp(64px, 10vw, 148px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 0.94, color: C.ink, margin: 0 }}>
            {heroHeadlineV2 ? (
              <>One platform for <em style={{ fontStyle: 'italic', color: C.cobalt }}>global commerce.</em></>
            ) : (
              <>The operating system for <em style={{ fontStyle: 'italic', color: C.cobalt }}>modern commerce.</em></>
            )}
          </h1>

          <div style={{ marginTop: 36, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 620 }}>
              <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 'clamp(28px, 3.2vw, 44px)', lineHeight: 1.05, color: C.ink, fontWeight: 400, letterSpacing: '-0.02em' }}>
                <LiveGMV /> <em style={{ fontStyle: 'italic', color: C.muted, fontSize: '0.68em' }}>GMV this month</em>
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.cobalt }} />
                <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11.5, color: C.mutedDk, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Routing now · {ARCS.length} live corridors</span>
              </div>
              <p style={{ marginTop: 20, fontSize: 20, lineHeight: 1.4, color: C.mutedDk, fontFamily: 'var(--font-display-v8), Georgia, serif', fontStyle: 'italic' }}>
                Inventory, orders, forecasting, and margin — one ledger, every channel.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/signup" style={{ background: C.ink, color: C.bg, padding: '15px 24px', textDecoration: 'none', fontSize: 14, fontWeight: 500, letterSpacing: '0.01em', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Start free<span style={{ fontFamily: 'var(--font-mono), monospace' }}>→</span>
              </Link>
              <Link href="/contact" style={{ background: 'transparent', color: C.ink, padding: '15px 24px', textDecoration: 'none', fontSize: 14, fontWeight: 500, border: `1px solid ${C.ink}` }}>
                Talk to sales
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
          ].map((m, i) => <NumberCell key={i} m={m} i={i} />)}
        </div>
      </section>

      {/* Connections — marketplaces & stack */}
      <ConnectionsSection />

      {/* Inside the ledger */}
      <section id="ledger" style={{ padding: '120px 32px', background: C.bg }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 28 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: C.cobalt, letterSpacing: '0.02em', fontWeight: 500 }}>Inside the ledger</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted }}>§ 02 — Product surface</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.04, color: C.ink, margin: '0 0 40px', maxWidth: 880 }}>
            Every channel, every currency — <em style={{ color: C.cobalt, fontStyle: 'italic' }}>one row each.</em>
          </h2>
          <LedgerSurface />
          <div style={{ marginTop: 18, fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
            <span>Live preview · normalized to home currency</span>
            <Link href="/product" style={{ color: C.cobalt, textDecoration: 'none' }}>Tour the product →</Link>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section id="platform" style={{ padding: '120px 32px', borderTop: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 56 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: C.cobalt, letterSpacing: '0.02em', fontWeight: 500 }}>The platform</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted }}>§ 03 — Four primitives</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, borderTop: `1px solid ${C.ink}`, borderLeft: `1px solid ${C.ink}` }}>
            {PILLARS.map((p, i) => <PillarCard key={p.n} p={p} i={i} />)}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" style={{ padding: '120px 32px', background: C.ink, color: C.bg }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 48 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: C.cobalt, letterSpacing: '0.02em', fontWeight: 500 }}>Why Meridia</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(243,240,234,0.18)' }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: 'rgba(243,240,234,0.5)' }}>§ 04</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 'clamp(48px, 6vw, 84px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.0, color: C.bg, margin: '0 0 48px', maxWidth: 880 }}>
            Four tools then. <em style={{ color: '#7BB7FF', fontStyle: 'italic' }}>One platform now.</em>
          </h2>
          <VersusStatGrid />
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono), monospace', fontSize: 10.5, color: 'rgba(243,240,234,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <span>Then — fragmented stack</span>
            <span style={{ color: C.cobalt, fontWeight: 700 }}>Now — one ledger</span>
          </div>
        </div>
      </section>

      {/* Operators */}
      <section style={{ padding: '120px 32px', background: C.bg, borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 56 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: C.cobalt, letterSpacing: '0.02em', fontWeight: 500 }}>From operators</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted }}>§ 05</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {QUOTES.map((q, i) => <QuoteCard key={i} q={q} i={i} />)}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '120px 32px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: C.cobalt, letterSpacing: '0.02em', fontWeight: 500 }}>Pricing</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted }}>§ 06</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.05, color: C.ink, margin: '0 0 40px', maxWidth: 880 }}>
            Flat. <em style={{ color: C.cobalt, fontStyle: 'italic' }}>Never a cut of revenue.</em>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 2fr 0.9fr', padding: '12px 0', borderTop: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.rule}`, fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            <span>Plan</span>
            <span style={{ textAlign: 'right' }}>Rate / mo</span>
            <span style={{ paddingLeft: 32 }}>Includes</span>
            <span style={{ textAlign: 'right' }}>Action</span>
          </div>

          {PRICE_ROWS.map((p, i) => <PriceRow key={p.name} p={p} i={i} isLast={i === PRICE_ROWS.length - 1} />)}

          <div style={{ marginTop: 24, fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
            <span>USD · GBP · EUR · AUD · CAD</span>
            <Link href="/pricing" style={{ color: C.cobalt, textDecoration: 'none' }}>Full schedule →</Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '120px 32px', background: C.surface, borderTop: `1px solid ${C.rule}`, borderBottom: `1px solid ${C.rule}`, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 'clamp(56px, 7vw, 104px)', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.0, color: C.ink, margin: '0 0 32px' }}>
          One ledger for every order, every market, <em style={{ color: C.cobalt, fontStyle: 'italic' }}>every margin.</em>
        </h2>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/signup" style={{ background: C.ink, color: C.bg, padding: '17px 32px', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Start free</Link>
          <Link href="/contact" style={{ background: 'transparent', color: C.ink, padding: '17px 32px', textDecoration: 'none', fontSize: 14, fontWeight: 500, border: `1px solid ${C.ink}` }}>Talk to sales</Link>
        </div>
        <div style={{ marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 14, fontFamily: 'var(--font-mono), monospace', fontSize: 11.5, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.cobalt }} />
            Live in under 10 minutes
          </span>
          <span style={{ color: C.rule }}>·</span>
          <span>No card required</span>
          <span style={{ color: C.rule }}>·</span>
          <span>Cancel any time</span>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '48px 32px 32px', background: C.bg }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.ink} />
                <rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt} />
              </svg>
              <span style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 22, letterSpacing: '-0.015em' }}>Meridia</span>
            </div>
            <p style={{ fontSize: 14, color: C.mutedDk, fontFamily: 'var(--font-display-v8), Georgia, serif', fontStyle: 'italic', margin: 0 }}>
              The operating system for modern commerce.
            </p>
          </div>
          {[
            { h: 'Platform', l: [['Atlas', '#atlas'], ['Ledger', '#ledger'], ['Pillars', '#platform'], ['Pricing', '#pricing']] as [string, string][] },
            { h: 'Compare',  l: [['ChannelAdvisor', '/vs/channelAdvisor'], ['Brightpearl', '/vs/brightpearl'], ['Linnworks', '/vs/linnworks'], ['Feedonomics', '/vs/baselinker']] as [string, string][] },
            { h: 'Company',  l: [['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']] as [string, string][] },
            { h: 'Resources', l: [['Enterprise', '/enterprise'], ['Security', '/security'], ['Status', 'https://status.fulcra.com'], ['Changelog', '/changelog'], ['Help', '/help'], ['Careers', '/careers']] as [string, string][] },
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

      <style>{`
        @keyframes arcdash { from { stroke-dashoffset: 28; } to { stroke-dashoffset: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        .pillar-card { transition: transform 280ms cubic-bezier(.2,.7,.2,1), box-shadow 280ms cubic-bezier(.2,.7,.2,1); }
        .pillar-card:hover { transform: translateY(-4px); box-shadow: 0 24px 50px -28px rgba(11,15,26,0.28); }
        .quote-card { transition: transform 280ms cubic-bezier(.2,.7,.2,1), box-shadow 280ms cubic-bezier(.2,.7,.2,1); }
        .quote-card:hover { transform: translateY(-3px); box-shadow: 0 20px 40px -24px rgba(11,15,26,0.22); }
        .price-row:hover { background: rgba(29,95,219,0.04); transform: translateX(4px); }
        .ledger-row:hover { background: rgba(29,95,219,0.05); }
      `}</style>
    </div>
  )
}
