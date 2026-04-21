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
 * Palette: #0a0a12 ink, #3d7cff cobalt (amplified for glow on dark),
 * #f3f0ea cream used sparingly for contrast cards only, status dots in
 * emerald / amber / red. Type: Geist (sans) via --font-geist, Geist Mono
 * via --font-mono. No Instrument Serif anywhere.
 */

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  ink:        '#0a0a12',
  inkSoft:    '#12131c',
  inkRaised:  '#1a1b28',
  border:     'rgba(255,255,255,0.08)',
  borderBright: 'rgba(255,255,255,0.16)',
  text:       '#e8e9ed',
  textMuted:  '#8b8e9d',
  textFaint:  '#5a5d6e',
  cobalt:     '#3d7cff',
  cobaltSoft: 'rgba(61,124,255,0.14)',
  cobaltGlow: 'rgba(61,124,255,0.35)',
  cream:      '#f3f0ea',
  emerald:    '#34d399',
  amber:      '#f59e0b',
  red:        '#f87171',
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
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(10,10,18,0.72)', backdropFilter: 'saturate(140%) blur(16px)', borderBottom: `1px solid ${C.border}` }}>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 100, background: C.cobaltSoft, border: `1px solid rgba(61,124,255,0.2)`, marginBottom: 28 }}>
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
          <p style={{ fontFamily: sans, fontSize: 19, lineHeight: 1.5, color: C.textMuted, margin: '0 0 36px', maxWidth: 640, fontWeight: 400 }}>
            Self-serve multichannel feed management for Shopify-led sellers. Install from the App Store, live in under ten minutes — with per-channel P&amp;L, pre-flight validation, and published pricing in five currencies.
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
        boxShadow: `0 24px 64px -24px rgba(0,0,0,0.8), 0 0 0 1px ${C.border}`,
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
  const issues = [
    { severity: 'error',   sku: 'HOODIE-BLK-L',  error: 'Missing GTIN — Amazon',       fix: 'Enter 13-digit UPC' },
    { severity: 'warning', sku: 'CANDLE-FIG-04', error: 'Banned word "free" — TikTok', fix: 'Suggest: "complimentary"' },
    { severity: 'ok',      sku: 'SOAP-LVND-200', error: '12 checks passed',            fix: 'Ready to push' },
  ]
  return (
    <div style={{ background: C.inkSoft, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Feed validator · eBay</div>
          <div style={{ fontFamily: sans, fontSize: 16, color: C.text, fontWeight: 500 }}>3 listings · 1 error caught</div>
        </div>
        <span style={{ fontFamily: mono, fontSize: 10, color: C.emerald, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 4, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>Live</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {issues.map((i, idx) => {
          const dot = i.severity === 'error' ? C.red : i.severity === 'warning' ? C.amber : C.emerald
          return (
            <div key={idx} style={{ background: C.inkRaised, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: dot, boxShadow: i.severity !== 'ok' ? `0 0 6px ${dot}` : 'none', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: mono, fontSize: 11, color: C.text, letterSpacing: '0.02em' }}>{i.sku}</div>
                <div style={{ fontFamily: sans, fontSize: 12.5, color: C.textMuted, marginTop: 3 }}>{i.error}</div>
              </div>
              <div style={{ fontFamily: mono, fontSize: 10.5, color: dot, whiteSpace: 'nowrap' }}>{i.fix}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PnlPanel() {
  const rows = [
    { ch: 'Shopify',         rev: '12,440', fees: '361', margin: '96.4%', trend: 'up' },
    { ch: 'eBay',            rev: '3,210',  fees: '419', margin: '86.9%', trend: 'flat' },
    { ch: 'Google Shopping', rev: '8,820',  fees: '231', margin: '97.4%', trend: 'up' },
  ]
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
          <span style={{ fontFamily: mono, fontSize: 12.5, color: C.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${r.rev}</span>
          <span style={{ fontFamily: mono, fontSize: 12.5, color: C.textMuted, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${r.fees}</span>
          <span style={{ fontFamily: mono, fontSize: 12.5, color: r.margin > '90%' ? C.emerald : C.amber, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.margin}</span>
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
  const r = useReveal<HTMLDivElement>(0)
  const steps = [
    { t: '0:00', title: 'Install from Shopify App Store',          body: 'One click from the admin. No API keys to paste.' },
    { t: '0:45', title: 'OAuth two-way sync',                       body: 'Products, inventory, orders flow both directions from the first handshake.' },
    { t: '2:30', title: 'Catalogue imports',                        body: 'Up to 10,000 SKUs in under two minutes. Errors surfaced at ingest, not after push.' },
    { t: '6:15', title: 'First listing pushed to eBay',             body: 'Category suggested, item specifics auto-completed, pre-flight validator green.' },
    { t: '9:00', title: 'Live. First order flows back.',            body: 'Shopify gets the channel-tagged order. Contribution margin updates per SKU.' },
  ]
  return (
    <section id="install" style={{ padding: '120px 32px', background: C.ink, borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <SectionHead eyebrow="§ 02 · Install" title={<>Live on your <span style={{ color: C.cobalt }}>first marketplace</span> in under ten minutes.</>} sub="Measured across 38 test installs. No sales call, no solutions architect, no 30-day kickoff." />

        <div ref={r.ref} style={{ ...r.style, position: 'relative', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
          {/* Vertical rule */}
          <div style={{ position: 'absolute', left: 78, top: 8, bottom: 8, width: 1, background: C.border }} />
          {steps.map((s, i) => (
            <TimelineStep key={i} step={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TimelineStep({ step, index }: { step: { t: string; title: string; body: string }; index: number }) {
  const r = useReveal<HTMLDivElement>(index * 80)
  return (
    <div ref={r.ref} style={{ ...r.style, display: 'grid', gridTemplateColumns: '64px 28px 1fr', gap: 14, alignItems: 'flex-start', padding: '18px 0', position: 'relative' }}>
      <span style={{ fontFamily: mono, fontSize: 13, color: C.textMuted, letterSpacing: '0.02em', paddingTop: 4, textAlign: 'right' }}>{step.t}</span>
      <span style={{ width: 12, height: 12, borderRadius: 6, background: C.cobalt, boxShadow: `0 0 12px ${C.cobaltGlow}`, marginTop: 8, marginLeft: 8, position: 'relative', zIndex: 1 }} />
      <div style={{ paddingBottom: 8 }}>
        <div style={{ fontFamily: sans, fontSize: 17, color: C.text, fontWeight: 500, letterSpacing: '-0.01em' }}>{step.title}</div>
        <div style={{ fontFamily: sans, fontSize: 14.5, color: C.textMuted, marginTop: 6, lineHeight: 1.55 }}>{step.body}</div>
      </div>
    </div>
  )
}

// ── 03 Before / After ────────────────────────────────────────────────────────
function BeforeAfter() {
  const before = [
    { title: 'Amazon listing gets suppressed',   body: 'For a GTIN that was off by a digit. Revenue drops 22% on the ASIN before anyone notices.' },
    { title: 'Pricing rule not enforced',        body: 'Same price everywhere. Amazon SKU contributes 38% less per unit than Shopify — and nobody in the business knows.' },
    { title: 'P&L in three spreadsheet tabs',    body: 'Which channel was profitable last month? Half a Sunday in Sheets to answer it.' },
    { title: 'TikTok Shop changes its schema',   body: 'New beauty-category fields in February. Half the integrations on the market broke silently.' },
  ]
  const after = [
    { title: 'Caught at ingest, before submit',  body: 'Per-channel validator checks GTIN format, image pixel floor, banned words, category attributes. You see the error and the exact fix before anything hits the marketplace.' },
    { title: 'Per-channel floors, set once',     body: 'Target net margin per channel. Pricing engine backs out the list price that hits it. Amazon vs Shopify vs eBay — same margin, different list.' },
    { title: 'One screen. All channels.',        body: 'Line-item fee attribution reconciled into contribution margin per SKU per channel. The pivot-table question becomes redundant.' },
    { title: 'Schemas tracked on our side',      body: 'Named engineer reads the policy notes weekly. When TikTok changes, your feed already matches the new shape before you list a new product.' },
  ]
  return (
    <section id="product" style={{ padding: '120px 32px', background: C.inkSoft, borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHead eyebrow="§ 03 · Product" title={<>What <span style={{ color: C.red, textDecoration: 'line-through', textDecorationColor: 'rgba(248,113,113,0.4)' }}>breaks today</span> — and what Palvento catches.</>} sub="These are real failure modes from real Shopify operators we've interviewed. Every one maps to a product surface we've shipped." />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }} className="v9-ba-grid">
          <Column title="Today. Without Palvento." accent={C.red} items={before} direction="left" />
          <Column title="With Palvento." accent={C.cobalt} items={after} direction="right" />
        </div>
      </div>
    </section>
  )
}

function Column({ title, accent, items, direction }: { title: string; accent: string; items: { title: string; body: string }[]; direction: 'left' | 'right' }) {
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 11, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 600 }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 3, background: accent, marginRight: 10, verticalAlign: 'middle' }} />
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, border: `1px solid ${C.border}`, background: C.ink, borderRadius: 12, overflow: 'hidden' }}>
        {items.map((it, i) => <BeforeAfterCard key={i} item={it} accent={accent} index={i} direction={direction} last={i === items.length - 1} />)}
      </div>
    </div>
  )
}

function BeforeAfterCard({ item, accent, index, direction, last }: { item: { title: string; body: string }; accent: string; index: number; direction: 'left' | 'right'; last: boolean }) {
  const r = useReveal<HTMLDivElement>(index * 60)
  return (
    <div ref={r.ref} style={{ ...r.style, padding: '20px 22px', borderBottom: last ? 'none' : `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <span style={{ fontFamily: mono, fontSize: 10.5, color: accent, letterSpacing: '0.04em', paddingTop: 3, minWidth: 24 }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div>
          <div style={{ fontFamily: sans, fontSize: 15.5, color: C.text, fontWeight: 500, marginBottom: 5, letterSpacing: '-0.005em' }}>{item.title}</div>
          <div style={{ fontFamily: sans, fontSize: 13.5, color: C.textMuted, lineHeight: 1.55 }}>{item.body}</div>
        </div>
      </div>
    </div>
  )
}

// ── 04 P&L dashboard ─────────────────────────────────────────────────────────
function DashboardShowcase() {
  return (
    <section style={{ padding: '120px 32px', background: C.ink, borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <SectionHead eyebrow="§ 04 · P&L" title={<>Which channel was <span style={{ color: C.cobalt }}>actually profitable</span> last month?</>} sub="Line-item fee attribution — FBA removal, eBay insertion, TikTok Shop commission — reconciled into contribution margin. Per SKU. Per channel. One screen." />
        <DashboardMock />
      </div>
    </section>
  )
}

function DashboardMock() {
  const r = useReveal<HTMLDivElement>(0)
  const rows = [
    { ch: 'Shopify',         rev: 124400, fees: 3610, margin: 96.4, units: 842 },
    { ch: 'eBay',            rev:  32100, fees: 4190, margin: 86.9, units: 289 },
    { ch: 'Google Shopping', rev:  88200, fees: 2310, margin: 97.4, units: 612 },
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
            <button key={l} style={{ background: i === 2 ? C.cobaltSoft : 'transparent', color: i === 2 ? C.cobalt : C.textMuted, border: `1px solid ${i === 2 ? 'rgba(61,124,255,0.3)' : C.border}`, fontFamily: mono, fontSize: 11, letterSpacing: '0.04em', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Table head */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr 0.9fr 0.8fr 0.7fr 0.7fr', padding: '10px 4px', fontFamily: mono, fontSize: 10, color: C.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        <span>Channel</span>
        <span style={{ textAlign: 'right' }}>Revenue</span>
        <span style={{ textAlign: 'right' }}>Fees</span>
        <span style={{ textAlign: 'right' }}>Net</span>
        <span style={{ textAlign: 'right' }}>Margin</span>
        <span style={{ textAlign: 'right' }}>Units</span>
      </div>

      {rows.map((r, i) => {
        const net = r.rev - r.fees
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr 0.9fr 0.8fr 0.7fr 0.7fr', padding: '14px 4px', alignItems: 'center', borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontFamily: sans, fontSize: 14, color: C.text, fontWeight: 500 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 3, background: C.cobalt, marginRight: 10, verticalAlign: 'middle' }} />
              {r.ch}
            </span>
            <span style={{ fontFamily: mono, fontSize: 13, color: C.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${r.rev.toLocaleString()}</span>
            <span style={{ fontFamily: mono, fontSize: 13, color: C.textMuted, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${r.fees.toLocaleString()}</span>
            <span style={{ fontFamily: mono, fontSize: 13, color: C.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>${net.toLocaleString()}</span>
            <span style={{ fontFamily: mono, fontSize: 13, color: r.margin > 90 ? C.emerald : C.amber, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.margin.toFixed(1)}%</span>
            <span style={{ fontFamily: mono, fontSize: 13, color: C.textMuted, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.units}</span>
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
      border: `1px solid ${t.popular ? 'rgba(61,124,255,0.4)' : C.border}`,
      borderRadius: 14,
      padding: '28px 24px',
      position: 'relative',
      transition: 'transform 0.2s cubic-bezier(.2,.7,.2,1), border-color 0.2s',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)' }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
    >
      {t.popular && (
        <div style={{ position: 'absolute', top: -10, left: 20, fontFamily: mono, fontSize: 10, color: C.cobalt, background: C.ink, border: `1px solid rgba(61,124,255,0.5)`, padding: '3px 10px', borderRadius: 100, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
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
function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub: string }) {
  const r = useReveal<HTMLDivElement>(0)
  return (
    <div ref={r.ref} style={{ ...r.style, maxWidth: 760, marginBottom: 48 }}>
      <div style={{ fontFamily: mono, fontSize: 11, color: C.cobalt, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>{eyebrow}</div>
      <h2 style={{ fontFamily: sans, fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.08, margin: '0 0 14px', color: C.text }}>{title}</h2>
      <p style={{ fontFamily: sans, fontSize: 16, lineHeight: 1.55, color: C.textMuted, margin: 0, maxWidth: 600 }}>{sub}</p>
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

        @media (max-width: 1024px) {
          .v9-nav-links { display: none !important; }
          .v9-pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .v9-footer-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .v9-footer-grid > div:first-child { grid-column: 1 / -1; }
          .v9-ba-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
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
