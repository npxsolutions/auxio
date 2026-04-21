'use client'

/**
 * Palvento — Landing v9
 *
 * Hard pivot from v8 editorial-cream + Instrument Serif to Vercel/Linear/
 * Mercury/Ramp territory: ink-default, data-forward, product-screenshot
 * hero, single bold sans. No serif. No abstract maps. No fake testimonials.
 *
 * Sections (6):
 *   01 Hero                — product UI mock + one-line thesis + one CTA
 *   02 Install in 9 minutes — vertical animated timeline, real channels
 *   03 Before / After      — split: what breaks today vs what we catch
 *   04 Per-channel P&L     — dashboard mock with real-shaped numbers
 *   05 Pricing             — 4 tiers, dark cards, cobalt on recommended
 *   06 Final CTA           — founding-partner ask
 *
 * Palette (2026-04-21 pivot): Ramp-style — warm cream #f8f4ec bg, white
 * #ffffff for card contrast, warm burnished orange #e8863f as single
 * accent, near-black #0b0f1a for text. Status dots in darker emerald /
 * burnt amber / deep red (tuned for light-bg readability). Type: Geist
 * (sans) via --font-geist, Geist Mono via --font-mono. No Instrument
 * Serif anywhere.
 */

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

// ── Palette ──────────────────────────────────────────────────────────────────
// Ramp-style warm cream + orange. Light-default. Variable names kept from the
// prior dark palette (ink / text / cobalt) so the rest of the file cascades —
// but the values have swapped semantics:
//   ink / inkSoft / inkRaised → cream page bg / white cards / warm raised
//   text / textMuted / textFaint → dark ink / muted gray / fainter gray
//   cobalt / cobaltSoft / cobaltGlow → warm burnished orange (single accent)
// Rename to bg/surface/accent when the palette propagates to other pages.
const C = {
  ink:        '#f8f4ec',   // page bg — warm cream
  inkSoft:    '#ffffff',   // card bg — pure white for contrast islands
  inkRaised:  '#fdfaf2',   // elevated surface — slightly warmer white
  border:     'rgba(11,15,26,0.10)',
  borderBright: 'rgba(11,15,26,0.22)',
  text:       '#0b0f1a',   // primary text — near-black ink
  textMuted:  '#5a6171',   // secondary text
  textFaint:  '#8b8e9d',   // eyebrow / meta
  cobalt:     '#e8863f',   // accent — warm burnished orange
  cobaltSoft: 'rgba(232,134,63,0.12)',
  cobaltGlow: 'rgba(232,134,63,0.30)',
  cream:      '#f8f4ec',
  emerald:    '#0e7c5a',   // status — darker emerald for light-bg readability
  amber:      '#b5651d',   // status — burnt amber
  red:        '#b32718',   // status — deeper red
}

const mono = 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace'
const sans = 'var(--font-geist), -apple-system, BlinkMacSystemFont, system-ui, sans-serif'

// ── Hooks ────────────────────────────────────────────────────────────────────
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
  return {
    ref,
    style: {
      opacity: shown ? 1 : 0,
      transform: shown ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 600ms cubic-bezier(.2,.7,.2,1), transform 600ms cubic-bezier(.2,.7,.2,1)',
    } as const
  }
}

function useCounter(to: number, decimals = 0, dur = 1400) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; obs.disconnect()
      const start = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur)
        setN(to * (1 - Math.pow(1 - p, 3)))
        if (p < 1) requestAnimationFrame(tick); else setN(to)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    obs.observe(el); return () => obs.disconnect()
  }, [to, dur])
  const formatted = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString()
  return { ref, formatted }
}

function Counter({ to, prefix = '', suffix = '', decimals = 0 }: { to: number; prefix?: string; suffix?: string; decimals?: number }) {
  const { ref, formatted } = useCounter(to, decimals)
  return <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>{prefix}{formatted}{suffix}</span>
}

// ── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(248,244,236,0.82)', backdropFilter: 'saturate(140%) blur(16px)', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.text }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.text}/>
            <rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt}/>
          </svg>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Palvento</span>
        </Link>
        <nav style={{ display: 'flex', gap: 28 }} className="v9-nav-links">
          {[['Product', '#product'], ['Install', '#install'], ['Pricing', '#pricing'], ['Enterprise', '/enterprise']].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: 13, color: C.textMuted, textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
               onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.text}
               onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMuted}
            >{l}</a>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: 13, color: C.textMuted, textDecoration: 'none', padding: '8px 4px' }}>Sign in</Link>
          <Link href="/signup" style={{ fontSize: 13, color: C.ink, background: C.text, padding: '9px 16px', textDecoration: 'none', fontWeight: 500, borderRadius: 6, letterSpacing: '0.01em' }}>
            Start free
          </Link>
        </div>
      </div>
    </header>
  )
}

// ── 01 Hero ──────────────────────────────────────────────────────────────────
function Hero() {
  const r = useReveal<HTMLDivElement>(0)
  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Ambient cobalt glow */}
      <div aria-hidden style={{ position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 900, background: `radial-gradient(circle, ${C.cobaltGlow} 0%, transparent 55%)`, pointerEvents: 'none', opacity: 0.6 }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 32px 40px', position: 'relative' }}>
        <div ref={r.ref} style={{ ...r.style, maxWidth: 900 }}>
          {/* Eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 100, background: C.cobaltSoft, border: `1px solid rgba(232,134,63,0.28)`, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.cobalt, boxShadow: `0 0 8px ${C.cobalt}` }} />
            <span style={{ fontFamily: mono, fontSize: 11.5, color: C.cobalt, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>
              Founding partners · 10 spots · 40% off for life
            </span>
          </div>

          {/* H1 */}
          <h1 style={{ fontFamily: sans, fontSize: 'clamp(48px, 6.5vw, 88px)', fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.02, margin: '0 0 22px', color: C.text }}>
            Every marketplace. <br />
            <span style={{ color: C.cobalt }}>One clean feed.</span>
          </h1>

          {/* Sub */}
          <p style={{ fontFamily: sans, fontSize: 19, lineHeight: 1.5, color: C.textMuted, margin: '0 0 36px', maxWidth: 560, fontWeight: 400 }}>
            Self-serve multichannel feed management for Shopify-led sellers. Live in under ten minutes.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/signup" style={{ background: C.cobalt, color: C.text, padding: '14px 22px', textDecoration: 'none', fontSize: 14.5, fontWeight: 500, borderRadius: 8, letterSpacing: '0.01em', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: `0 8px 24px -8px ${C.cobaltGlow}`, transition: 'transform 0.15s' }}
                 onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
                 onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}>
              Start free trial <span style={{ fontFamily: mono }}>→</span>
            </Link>
            <Link href="/enterprise" style={{ background: 'transparent', color: C.text, padding: '14px 22px', textDecoration: 'none', fontSize: 14.5, fontWeight: 500, border: `1px solid ${C.borderBright}`, borderRadius: 8, letterSpacing: '0.01em' }}>
              Talk to sales
            </Link>
            <span style={{ fontFamily: mono, fontSize: 12, color: C.textFaint, letterSpacing: '0.04em', marginLeft: 8 }}>
              No card required · 14-day trial
            </span>
          </div>

          {/* Proof strip */}
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', paddingTop: 32, borderTop: `1px solid ${C.border}` }}>
            {[
              { v: 3, suffix: '',     label: 'Channels live today' },
              { v: 5, suffix: '',     label: 'Currencies published' },
              { v: 10, suffix: ' min', label: 'To first listing live' },
              { v: 149, prefix: '$',  label: 'From per month' },
            ].map((m, i) => (
              <div key={i}>
                <div style={{ fontFamily: sans, fontSize: 28, fontWeight: 600, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  <Counter to={m.v} prefix={m.prefix} suffix={m.suffix} />
                </div>
                <div style={{ fontFamily: mono, fontSize: 11, color: C.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 8 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Product UI mock */}
        <HeroProductMock />
      </div>
    </section>
  )
}

// ── Hero product UI mock — composited SVG ───────────────────────────────────
function HeroProductMock() {
  const r = useReveal<HTMLDivElement>(200)
  return (
    <div ref={r.ref} style={{ ...r.style, marginTop: 64, position: 'relative' }}>
      <div style={{
        background: C.inkSoft,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 1,
        boxShadow: `0 24px 64px -28px rgba(11,15,26,0.22), 0 2px 8px -2px rgba(11,15,26,0.08)`,
        overflow: 'hidden',
      }}>
        {/* Fake window chrome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: C.ink }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[C.red, C.amber, C.emerald].map((col, i) => (
              <span key={i} style={{ width: 10, height: 10, borderRadius: 5, background: col, opacity: 0.8 }} />
            ))}
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: C.textFaint, letterSpacing: '0.05em' }}>palvento.com/dashboard</span>
          </div>
          <span style={{ width: 42 }} />
        </div>

        {/* Mock content — split: feed validator left, P&L right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: C.border }}>
          <FeedValidatorPanel />
          <PnlPanel />
        </div>
      </div>
    </div>
  )
}

function FeedValidatorPanel() {
  // 7-second loop: error appears → validator catches it → auto-fix applied.
  // Shows the core product working live, not a static screenshot.
  const [phase, setPhase] = useState<'error' | 'fixing' | 'fixed'>('error')
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>
    let t2: ReturnType<typeof setTimeout>
    let t3: ReturnType<typeof setTimeout>
    const loop = () => {
      setPhase('error')
      t1 = setTimeout(() => setPhase('fixing'), 2200)
      t2 = setTimeout(() => setPhase('fixed'), 3800)
      t3 = setTimeout(loop, 6500)
    }
    loop()
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const topRow =
    phase === 'error'  ? { sev: 'error',   dot: C.red,     msg: 'Missing GTIN — Amazon',     fix: 'Enter 13-digit UPC' } :
    phase === 'fixing' ? { sev: 'fixing',  dot: C.amber,   msg: 'Suggesting GTIN from UPC-A', fix: 'Validating…' } :
                          { sev: 'ok',     dot: C.emerald, msg: '5041234567890 · validated', fix: 'Fixed · pushed' }

  return (
    <div style={{ background: C.inkSoft, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Feed validator · live</div>
          <div style={{ fontFamily: sans, fontSize: 16, color: C.text, fontWeight: 500 }}>
            {phase === 'fixed' ? '3 listings · all green' : phase === 'fixing' ? '3 listings · catching error' : '3 listings · 1 error caught'}
          </div>
        </div>
        <span style={{
          fontFamily: mono, fontSize: 10, color: phase === 'fixed' ? C.emerald : phase === 'fixing' ? C.amber : C.red,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '4px 8px', borderRadius: 4,
          background: phase === 'fixed' ? 'rgba(52,211,153,0.1)' : phase === 'fixing' ? 'rgba(245,158,11,0.1)' : 'rgba(248,113,113,0.1)',
          border: `1px solid ${phase === 'fixed' ? 'rgba(52,211,153,0.25)' : phase === 'fixing' ? 'rgba(245,158,11,0.25)' : 'rgba(248,113,113,0.25)'}`,
          transition: 'all 0.4s',
        }}>
          {phase === 'fixed' ? 'Resolved' : phase === 'fixing' ? 'Fixing' : 'Error'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Top row — animated across the 3 phases */}
        <div style={{
          background: C.inkRaised,
          border: `1px solid ${phase === 'error' ? 'rgba(248,113,113,0.5)' : phase === 'fixing' ? 'rgba(245,158,11,0.5)' : 'rgba(52,211,153,0.3)'}`,
          borderRadius: 8, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: phase === 'error' ? `0 0 20px rgba(248,113,113,0.15)` : phase === 'fixing' ? `0 0 20px rgba(245,158,11,0.15)` : 'none',
          transition: 'border-color 0.5s, box-shadow 0.5s',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 3,
            background: topRow.dot,
            boxShadow: `0 0 ${phase === 'fixed' ? 0 : 8}px ${topRow.dot}`,
            flexShrink: 0,
            animation: phase === 'error' ? 'v9pulse 1.4s ease-in-out infinite' : 'none',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.text, letterSpacing: '0.02em' }}>HOODIE-BLK-L</div>
            <div style={{ fontFamily: sans, fontSize: 12.5, color: C.textMuted, marginTop: 3, transition: 'color 0.3s' }}>{topRow.msg}</div>
          </div>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: topRow.dot, whiteSpace: 'nowrap', transition: 'color 0.3s' }}>
            {phase === 'fixing' && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, border: `1.5px solid ${C.amber}`, borderTopColor: 'transparent', marginRight: 6, verticalAlign: 'middle', animation: 'v9spin 0.8s linear infinite' }} />}
            {topRow.fix}
          </div>
        </div>

        {/* Other two rows — static, always green */}
        <div style={{ background: C.inkRaised, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: C.emerald, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.text, letterSpacing: '0.02em' }}>CANDLE-FIG-04</div>
            <div style={{ fontFamily: sans, fontSize: 12.5, color: C.textMuted, marginTop: 3 }}>12 checks passed</div>
          </div>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.emerald, whiteSpace: 'nowrap' }}>Ready to push</div>
        </div>
        <div style={{ background: C.inkRaised, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: C.emerald, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.text, letterSpacing: '0.02em' }}>SOAP-LVND-200</div>
            <div style={{ fontFamily: sans, fontSize: 12.5, color: C.textMuted, marginTop: 3 }}>14 checks passed</div>
          </div>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.emerald, whiteSpace: 'nowrap' }}>Synced · 0:02</div>
        </div>
      </div>
    </div>
  )
}

function PnlPanel() {
  // Live-ticking revenue — numbers increment every 3.5s to feel alive without
  // being distracting. Values are illustrative (the hero map label already
  // calls this a preview).
  const [rows, setRows] = useState([
    { ch: 'Shopify',         rev: 12440, fees: 361, margin: '96.4%', trend: 'up' as const },
    { ch: 'eBay',            rev:  3210, fees: 419, margin: '86.9%', trend: 'flat' as const },
    { ch: 'Google Shopping', rev:  8820, fees: 231, margin: '97.4%', trend: 'up' as const },
  ])
  useEffect(() => {
    const id = setInterval(() => {
      setRows(prev => prev.map(r => ({ ...r, rev: r.rev + Math.floor(4 + Math.random() * 26) })))
    }, 3500)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ background: C.inkSoft, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Per-channel P&amp;L · Oct</div>
          <div style={{ fontFamily: sans, fontSize: 16, color: C.text, fontWeight: 500 }}>$24,470 net · 93.9% margin</div>
        </div>
        <span style={{ fontFamily: mono, fontSize: 10, color: C.cobalt, letterSpacing: '0.08em', textTransform: 'uppercase' }}>→ Export</span>
      </div>

      {/* Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.7fr 0.8fr 0.4fr', fontFamily: mono, fontSize: 9.5, color: C.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, paddingBottom: 8, marginBottom: 4 }}>
        <span>Channel</span><span style={{ textAlign: 'right' }}>Rev</span><span style={{ textAlign: 'right' }}>Fees</span><span style={{ textAlign: 'right' }}>Margin</span><span style={{ textAlign: 'right' }}></span>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.7fr 0.8fr 0.4fr', alignItems: 'center', padding: '10px 0', borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <span style={{ fontFamily: sans, fontSize: 13, color: C.text, fontWeight: 500 }}>{r.ch}</span>
          <span style={{ fontFamily: mono, fontSize: 12.5, color: C.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums', transition: 'color 0.6s' }}>${r.rev.toLocaleString()}</span>
          <span style={{ fontFamily: mono, fontSize: 12.5, color: C.textMuted, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${r.fees}</span>
          <span style={{ fontFamily: mono, fontSize: 12.5, color: parseFloat(r.margin) > 90 ? C.emerald : C.amber, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.margin}</span>
          <span style={{ fontFamily: mono, fontSize: 13, textAlign: 'right', color: r.trend === 'up' ? C.emerald : C.textMuted }}>{r.trend === 'up' ? '↑' : '→'}</span>
        </div>
      ))}

      {/* Fee breakdown card */}
      <div style={{ marginTop: 16, padding: 14, background: C.inkRaised, border: `1px solid ${C.border}`, borderRadius: 8 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: C.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Fee breakdown · eBay · item #A-2204-K</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['Insertion fee',  '$0.35'],
            ['Final value 12.9%',  '$6.06'],
            ['Payment proc.', '$1.68'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 11.5 }}>
              <span style={{ color: C.textMuted }}>{k}</span>
              <span style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 02 Install timeline ──────────────────────────────────────────────────────
function InstallTimeline() {
  const steps = [
    { t: '0:00', title: 'Install from Shopify App Store' },
    { t: '0:45', title: 'OAuth two-way sync' },
    { t: '2:30', title: 'Catalogue imports' },
    { t: '6:15', title: 'First listing pushed to eBay' },
    { t: '9:00', title: 'Live. First order flows back.' },
  ]

  // Scroll-triggered playhead: sweeps 0→100% over 5s, pausing briefly on each step.
  const [pct, setPct] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const start = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / 5000)
        setPct(p * 100)
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="install" style={{ padding: '120px 32px', background: C.ink, borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <SectionHead eyebrow="§ 02 · Install" title={<>Live in <span style={{ color: C.cobalt }}>under ten minutes.</span></>} />

        <div ref={ref} style={{ position: 'relative', maxWidth: 680, marginLeft: 'auto', marginRight: 'auto' }}>
          {/* Rail — full height, muted */}
          <div style={{ position: 'absolute', left: 78, top: 16, bottom: 16, width: 2, background: C.border, borderRadius: 1 }} />
          {/* Playhead — cobalt progress rail */}
          <div style={{ position: 'absolute', left: 78, top: 16, width: 2, height: `calc(${pct}% - 32px)`, background: `linear-gradient(180deg, ${C.cobalt} 0%, ${C.cobalt} 100%)`, boxShadow: `0 0 12px ${C.cobaltGlow}`, borderRadius: 1, transition: 'height 0.04s linear' }} />

          {steps.map((s, i) => (
            <TimelineStep key={i} step={s} index={i} total={steps.length} pct={pct} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TimelineStep({ step, index, total, pct }: { step: { t: string; title: string }; index: number; total: number; pct: number }) {
  const threshold = ((index + 0.5) / total) * 100
  const active = pct >= threshold
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '64px 28px 1fr',
      gap: 14,
      alignItems: 'center',
      padding: '22px 0',
      position: 'relative',
      opacity: active ? 1 : 0.45,
      transform: active ? 'translateX(0)' : 'translateX(-4px)',
      transition: 'opacity 0.4s, transform 0.4s',
    }}>
      <span style={{ fontFamily: mono, fontSize: 13, color: active ? C.text : C.textFaint, letterSpacing: '0.02em', textAlign: 'right', transition: 'color 0.3s' }}>{step.t}</span>
      <span style={{
        width: active ? 14 : 10,
        height: active ? 14 : 10,
        borderRadius: 8,
        background: active ? C.cobalt : C.inkRaised,
        border: active ? 'none' : `1.5px solid ${C.border}`,
        boxShadow: active ? `0 0 16px ${C.cobaltGlow}, 0 0 0 3px ${C.ink}` : 'none',
        marginLeft: active ? 7 : 9,
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.4s cubic-bezier(.2,.7,.2,1)',
      }} />
      <div style={{ fontFamily: sans, fontSize: 17, color: active ? C.text : C.textMuted, fontWeight: 500, letterSpacing: '-0.01em', transition: 'color 0.3s' }}>
        {step.title}
      </div>
    </div>
  )
}

// ── 03 Before / After ────────────────────────────────────────────────────────
function BeforeAfter() {
  const pairs = [
    { before: 'Amazon listing suppressed · GTIN off by one digit',         after: 'Caught at ingest · 5041234567890 suggested' },
    { before: 'Same price on every channel · losing 38% margin on Amazon', after: 'Per-channel floor enforced at sync' },
    { before: 'P&L in three spreadsheet tabs',                              after: 'One screen · per SKU · per channel' },
    { before: "TikTok's schema changed · integrations broke silently",     after: 'Schema diff tracked on our side · auto-migrated' },
  ]
  return (
    <section id="product" style={{ padding: '120px 32px', background: C.inkSoft, borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <SectionHead eyebrow="§ 03 · Product" title={<>What <span style={{ color: C.red, textDecoration: 'line-through', textDecorationColor: 'rgba(248,113,113,0.4)' }}>breaks</span> — and what <span style={{ color: C.cobalt }}>Palvento catches.</span></>} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {pairs.map((p, i) => <BeforeAfterRow key={i} pair={p} index={i} />)}
        </div>
      </div>
    </section>
  )
}

function BeforeAfterRow({ pair, index }: { pair: { before: string; after: string }; index: number }) {
  const r = useReveal<HTMLDivElement>(index * 80)
  return (
    <div ref={r.ref} style={{ ...r.style, display: 'grid', gridTemplateColumns: '1fr 32px 1fr', gap: 0, alignItems: 'stretch' }} className="v9-ba-row">
      {/* Before */}
      <div style={{ background: C.ink, border: `1px solid ${C.border}`, borderRight: 'none', borderRadius: '10px 0 0 10px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: C.red, boxShadow: `0 0 10px rgba(248,113,113,0.5)`, flexShrink: 0 }} />
        <span style={{ fontFamily: sans, fontSize: 14.5, color: C.textMuted, lineHeight: 1.5 }}>{pair.before}</span>
      </div>
      {/* Arrow */}
      <div style={{ background: C.inkRaised, border: `1px solid ${C.border}`, borderLeft: 'none', borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 13, color: C.cobalt }}>
        →
      </div>
      {/* After */}
      <div style={{ background: `linear-gradient(90deg, ${C.ink} 0%, ${C.cobaltSoft} 100%)`, border: `1px solid ${C.border}`, borderLeft: 'none', borderRadius: '0 10px 10px 0', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: C.cobalt, boxShadow: `0 0 10px ${C.cobaltGlow}`, flexShrink: 0 }} />
        <span style={{ fontFamily: sans, fontSize: 14.5, color: C.text, lineHeight: 1.5, fontWeight: 500 }}>{pair.after}</span>
      </div>
    </div>
  )
}

// ── 04 P&L dashboard ─────────────────────────────────────────────────────────
function DashboardShowcase() {
  return (
    <section style={{ padding: '120px 32px', background: C.ink, borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <SectionHead eyebrow="§ 04 · P&L" title={<>Which channel was <span style={{ color: C.cobalt }}>actually profitable</span>?</>} />
        <DashboardMock />
      </div>
    </section>
  )
}

// Animated mini sparkline — draws its path on scroll-into-view.
function Sparkline({ points, color, width = 84, height = 22 }: { points: number[]; color: string; width?: number; height?: number }) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const step = width / (points.length - 1)
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(height - ((v - min) / range) * height).toFixed(1)}`).join(' ')
  const ref = useRef<SVGPathElement>(null)
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const len = el.getTotalLength()
    el.style.strokeDasharray = `${len}`
    el.style.strokeDashoffset = `${len}`
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      el.style.transition = 'stroke-dashoffset 1200ms cubic-bezier(.2,.7,.2,1)'
      el.style.strokeDashoffset = '0'
      setDrawn(true)
    }, { threshold: 0.2 })
    obs.observe(el); return () => obs.disconnect()
  }, [d])
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <path ref={ref} d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {drawn && <circle cx={(points.length - 1) * step} cy={height - ((points[points.length - 1] - min) / range) * height} r={2.5} fill={color} />}
    </svg>
  )
}

function DashboardMock() {
  const r = useReveal<HTMLDivElement>(0)
  const rows = [
    { ch: 'Shopify',         rev: 124400, fees: 3610, margin: 96.4, units: 842, spark: [52,58,61,60,65,72,78,74,82,88,92,98] },
    { ch: 'eBay',            rev:  32100, fees: 4190, margin: 86.9, units: 289, spark: [40,44,41,48,45,50,47,52,55,58,56,61] },
    { ch: 'Google Shopping', rev:  88200, fees: 2310, margin: 97.4, units: 612, spark: [30,35,42,48,55,58,62,68,72,78,82,88] },
  ]
  return (
    <div ref={r.ref} style={{ ...r.style, background: C.inkSoft, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, marginTop: 48 }}>
      {/* Head */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>October 2026 · 31 days · 1,743 orders</div>
          <div style={{ fontFamily: sans, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: C.text }}>
            $244,700 net <span style={{ color: C.textMuted, fontWeight: 400 }}>·</span> <span style={{ color: C.emerald }}>93.9% margin</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Day', 'Week', 'Month', 'YTD'].map((l, i) => (
            <button key={l} style={{ background: i === 2 ? C.cobaltSoft : 'transparent', color: i === 2 ? C.cobalt : C.textMuted, border: `1px solid ${i === 2 ? 'rgba(232,134,63,0.35)' : C.border}`, fontFamily: mono, fontSize: 11, letterSpacing: '0.04em', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Table head */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr 0.8fr 0.7fr 0.6fr 1fr', padding: '10px 4px', fontFamily: mono, fontSize: 10, color: C.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        <span>Channel</span>
        <span style={{ textAlign: 'right' }}>Revenue</span>
        <span style={{ textAlign: 'right' }}>Net</span>
        <span style={{ textAlign: 'right' }}>Margin</span>
        <span style={{ textAlign: 'right' }}>Units</span>
        <span style={{ textAlign: 'right', paddingRight: 4 }}>30-day trend</span>
      </div>

      {rows.map((r, i) => {
        const net = r.rev - r.fees
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr 0.8fr 0.7fr 0.6fr 1fr', padding: '16px 4px', alignItems: 'center', borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontFamily: sans, fontSize: 14, color: C.text, fontWeight: 500 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 3, background: C.cobalt, marginRight: 10, verticalAlign: 'middle' }} />
              {r.ch}
            </span>
            <span style={{ fontFamily: mono, fontSize: 13, color: C.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${r.rev.toLocaleString()}</span>
            <span style={{ fontFamily: mono, fontSize: 13, color: C.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>${net.toLocaleString()}</span>
            <span style={{ fontFamily: mono, fontSize: 13, color: r.margin > 90 ? C.emerald : C.amber, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.margin.toFixed(1)}%</span>
            <span style={{ fontFamily: mono, fontSize: 13, color: C.textMuted, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.units}</span>
            <span style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 4 }}>
              <Sparkline points={r.spark} color={r.margin > 90 ? C.emerald : C.amber} />
            </span>
          </div>
        )
      })}

      {/* Footer / insight */}
      <div style={{ marginTop: 20, padding: '14px 16px', background: C.inkRaised, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: sans, fontSize: 13, color: C.textMuted, lineHeight: 1.55 }}>
        <strong style={{ color: C.text, fontWeight: 500 }}>Palvento insight:</strong> eBay contributes $27,910 net at 86.9% margin — 10.5pts below Shopify. Three low-margin SKUs account for 62% of the gap. <span style={{ color: C.cobalt }}>Review → </span>
      </div>
    </div>
  )
}

// ── 05 Pricing ───────────────────────────────────────────────────────────────
function Pricing() {
  const tiers = [
    { name: 'Starter',  price: 149,  tag: 'Shopify + 1 channel',  features: ['1 sales channel', 'Pre-flight validator', 'Feed health hub', '10 AI enrichments / mo'], cta: 'Start free', popular: false },
    { name: 'Growth',   price: 349,  tag: 'Most adopted',          features: ['5 channels', 'Category suggester', 'Per-channel P&L', 'Rules engine', '200 AI enrichments / mo'], cta: 'Start free', popular: true },
    { name: 'Scale',    price: 799,  tag: 'Unlimited channels',    features: ['Unlimited channels', 'Priority sync', 'Reconciled payouts', 'Unlimited AI enrichment'], cta: 'Start free', popular: false },
    { name: 'Enterprise', price: 2000, tag: 'From · custom',        features: ['SSO / SAML', 'Dedicated solutions architect', 'Custom SLA', 'Data residency'], cta: 'Talk to sales', popular: false },
  ]
  return (
    <section id="pricing" style={{ padding: '120px 32px', background: C.inkSoft, borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHead eyebrow="§ 05 · Pricing" title={<>Flat monthly. <span style={{ color: C.cobalt }}>Five currencies.</span> No percentage of GMV.</>} sub="$149 / $349 / $799 — published prices, not quote-form floors. Enterprise from $2,000/mo with SSO, SLA, and data residency." />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 48 }} className="v9-pricing-grid">
          {tiers.map((t, i) => <PriceCard key={t.name} t={t} index={i} />)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28, flexWrap: 'wrap', marginTop: 32, fontFamily: mono, fontSize: 11, color: C.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <span>USD · GBP · EUR · AUD · CAD</span>
          <span>·</span>
          <span>14-day free trial</span>
          <span>·</span>
          <span>No card required</span>
          <span>·</span>
          <span>Cancel any time</span>
        </div>
      </div>
    </section>
  )
}

function PriceCard({ t, index }: { t: { name: string; price: number; tag: string; features: string[]; cta: string; popular: boolean }; index: number }) {
  const r = useReveal<HTMLDivElement>(index * 80)
  return (
    <div ref={r.ref} style={{
      ...r.style,
      background: t.popular ? `linear-gradient(180deg, ${C.cobaltSoft} 0%, ${C.inkSoft} 60%)` : C.ink,
      border: `1px solid ${t.popular ? 'rgba(232,134,63,0.45)' : C.border}`,
      borderRadius: 14,
      padding: '28px 24px',
      position: 'relative',
      transition: 'transform 0.2s cubic-bezier(.2,.7,.2,1), border-color 0.2s',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)' }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
    >
      {t.popular && (
        <div style={{ position: 'absolute', top: -10, left: 20, fontFamily: mono, fontSize: 10, color: C.cobalt, background: C.ink, border: `1px solid rgba(232,134,63,0.55)`, padding: '3px 10px', borderRadius: 100, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          Most adopted
        </div>
      )}
      <div style={{ fontFamily: mono, fontSize: 10.5, color: C.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{t.tag}</div>
      <div style={{ fontFamily: sans, fontSize: 22, fontWeight: 600, color: C.text, letterSpacing: '-0.01em', marginBottom: 14 }}>{t.name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
        <span style={{ fontFamily: sans, fontSize: 42, fontWeight: 600, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>${t.price}</span>
        <span style={{ fontFamily: mono, fontSize: 12, color: C.textMuted }}>/ mo</span>
      </div>

      <Link href={t.cta === 'Talk to sales' ? '/enterprise' : '/signup'}
        style={{
          display: 'block',
          textAlign: 'center',
          background: t.popular ? C.cobalt : 'transparent',
          color: t.popular ? C.text : C.text,
          border: t.popular ? 'none' : `1px solid ${C.borderBright}`,
          padding: '11px 16px',
          borderRadius: 8,
          textDecoration: 'none',
          fontSize: 13.5,
          fontWeight: 500,
          marginBottom: 20,
          letterSpacing: '0.01em',
          boxShadow: t.popular ? `0 8px 20px -8px ${C.cobaltGlow}` : 'none',
        }}
      >{t.cta} →</Link>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
        {t.features.map(f => (
          <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 9 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
              <circle cx="7" cy="7" r="6" fill={C.cobaltSoft}/>
              <path d="M4.2 7l2 2 3.6-4" stroke={C.cobalt} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: sans, fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 06 Final CTA ─────────────────────────────────────────────────────────────
function FinalCta() {
  return (
    <section style={{ padding: '140px 32px', background: C.ink, borderTop: `1px solid ${C.border}`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 1000, height: 600, background: `radial-gradient(ellipse, ${C.cobaltGlow} 0%, transparent 60%)`, opacity: 0.5, pointerEvents: 'none' }} />
      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: C.cobalt, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24, fontWeight: 500 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 3, background: C.cobalt, marginRight: 10, verticalAlign: 'middle', boxShadow: `0 0 8px ${C.cobalt}` }} />
          § 06 · Ship now
        </div>
        <h2 style={{ fontFamily: sans, fontSize: 'clamp(40px, 5.2vw, 76px)', fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 20px', color: C.text }}>
          Install from the App Store. <br />
          <span style={{ color: C.cobalt }}>Live in under ten minutes.</span>
        </h2>
        <p style={{ fontFamily: sans, fontSize: 17, lineHeight: 1.55, color: C.textMuted, margin: '0 auto 36px', maxWidth: 560 }}>
          Founding-partner pricing locked in for the first 10 Shopify operators. 40% off for life.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ background: C.cobalt, color: C.text, padding: '16px 28px', textDecoration: 'none', fontSize: 15, fontWeight: 500, borderRadius: 8, letterSpacing: '0.01em', boxShadow: `0 12px 32px -12px ${C.cobaltGlow}` }}>
            Start free trial →
          </Link>
          <Link href="/enterprise" style={{ background: 'transparent', color: C.text, padding: '16px 28px', textDecoration: 'none', fontSize: 15, fontWeight: 500, border: `1px solid ${C.borderBright}`, borderRadius: 8, letterSpacing: '0.01em' }}>
            Talk to sales
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding: '48px 32px 32px', background: C.ink, borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 40 }} className="v9-footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.text}/>
              <rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt}/>
            </svg>
            <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 600, color: C.text }}>Palvento</span>
          </div>
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.textMuted, margin: 0, lineHeight: 1.55, maxWidth: 260 }}>
            Self-serve multichannel feed management for Shopify-led sellers.
          </p>
        </div>
        {[
          { h: 'Product',   l: [['Pricing', '/pricing'], ['Enterprise', '/enterprise'], ['Changelog', '/changelog'], ['Security', '/security']] },
          { h: 'Compare',   l: [['vs Feedonomics', '/vs/feedonomics'], ['vs Linnworks', '/vs/linnworks'], ['vs ChannelAdvisor', '/vs/channelAdvisor'], ['vs Brightpearl', '/vs/brightpearl']] },
          { h: 'Company',   l: [['About', '/about'], ['Careers', '/careers'], ['Contact', '/contact'], ['Blog', '/blog']] },
          { h: 'Resources', l: [['Docs', '/help'], ['Status', '/status'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
        ].map(col => (
          <div key={col.h}>
            <div style={{ fontFamily: mono, fontSize: 10.5, color: C.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14, fontWeight: 600 }}>{col.h}</div>
            {col.l.map(([label, href]) => (
              <Link key={label} href={href} style={{ display: 'block', fontFamily: sans, fontSize: 13, color: C.textMuted, textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.text}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMuted}>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1280, margin: '32px auto 0', paddingTop: 20, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 11, color: C.textFaint, letterSpacing: '0.04em', flexWrap: 'wrap', gap: 12 }}>
        <span>© MMXXVI · NPX Solutions Ltd</span>
        <span>Shopify-led multichannel · Built in the UK</span>
      </div>
    </footer>
  )
}

// ── Section head helper ──────────────────────────────────────────────────────
function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  const r = useReveal<HTMLDivElement>(0)
  return (
    <div ref={r.ref} style={{ ...r.style, maxWidth: 760, marginBottom: sub ? 48 : 40 }}>
      <div style={{ fontFamily: mono, fontSize: 11, color: C.cobalt, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>{eyebrow}</div>
      <h2 style={{ fontFamily: sans, fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.08, margin: sub ? '0 0 14px' : 0, color: C.text }}>{title}</h2>
      {sub && <p style={{ fontFamily: sans, fontSize: 16, lineHeight: 1.55, color: C.textMuted, margin: 0, maxWidth: 600 }}>{sub}</p>}
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function LandingV9() {
  return (
    <div style={{ background: C.ink, color: C.text, minHeight: '100vh', fontFamily: sans, WebkitFontSmoothing: 'antialiased' }}>
      <Nav />
      <Hero />
      <InstallTimeline />
      <BeforeAfter />
      <DashboardShowcase />
      <Pricing />
      <FinalCta />
      <Footer />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${C.ink}; color: ${C.text}; }
        @keyframes v9pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes v9spin  { to { transform: rotate(360deg); } }

        @media (max-width: 1024px) {
          .v9-nav-links { display: none !important; }
          .v9-pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .v9-footer-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .v9-footer-grid > div:first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 720px) {
          .v9-ba-row { grid-template-columns: 1fr !important; gap: 6px !important; }
          .v9-ba-row > div:nth-child(1) { border-radius: 10px !important; border-right: 1px solid ${C.border} !important; }
          .v9-ba-row > div:nth-child(2) { display: none !important; }
          .v9-ba-row > div:nth-child(3) { border-radius: 10px !important; border-left: 1px solid ${C.border} !important; }
        }
        @media (max-width: 640px) {
          .v9-pricing-grid { grid-template-columns: 1fr !important; }
          .v9-footer-grid { grid-template-columns: 1fr 1fr !important; }
          .v9-footer-grid > div:first-child { grid-column: 1 / -1; }
        }
      `}</style>
    </div>
  )
}
