'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────

const FOUNDING_CLAIMED = 23
const FOUNDING_TOTAL   = 50

// ── Animated counter ─────────────────────────────────────────────────────────

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      observer.disconnect()
      const start = Date.now()
      const duration = 1600
      const tick = () => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 3)
        setCount(Math.round(ease * target))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ── Wave divider (Base.com pattern) ──────────────────────────────────────────

function WaveDivider({ fill = '#f7f3eb', inverted = false }: { fill?: string; inverted?: boolean }) {
  return (
    <div style={{ lineHeight: 0, transform: inverted ? 'scaleY(-1)' : 'none' }}>
      <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
        <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill={fill} />
      </svg>
    </div>
  )
}

// ── Logo strip ────────────────────────────────────────────────────────────────

const CHANNEL_LOGOS = [
  { name: 'eBay',        color: '#E53238', bg: '#fff8f8' },
  { name: 'Amazon',      color: '#FF9900', bg: '#fff9f0' },
  { name: 'Shopify',     color: '#96BF48', bg: '#f5f9ee' },
  { name: 'TikTok Shop', color: '#191919', bg: '#f7f7f7' },
  { name: 'Etsy',        color: '#F56400', bg: '#fff6f0' },
  { name: 'OnBuy',       color: '#003087', bg: '#f0f4ff' },
  { name: 'Google',      color: '#4285F4', bg: '#f0f5ff' },
  { name: 'Facebook',    color: '#1877F2', bg: '#f0f5ff' },
]

// ── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '🏷️',
    title: 'List once. Publish everywhere.',
    desc: 'Create a product listing one time and push it to every channel simultaneously. Auxio formats titles, descriptions and attributes for each platform automatically.',
    color: '#5b52f5',
  },
  {
    icon: '🤖',
    title: 'AI that writes for each channel.',
    desc: 'eBay keywords, Amazon bullet points, Shopify brand copy — generated in seconds. Channel-specific optimisation, not generic rewrites.',
    color: '#7c6af7',
  },
  {
    icon: '⚙️',
    title: 'Feed rules engine.',
    desc: 'IF/THEN rules that fire at publish time. Auto-adjust prices, reformat titles, remap categories, fill missing attributes — per channel.',
    color: '#059669',
  },
  {
    icon: '📊',
    title: 'True profit tracking.',
    desc: 'Real profit per order after channel fees, shipping, ad spend and returns. Know which channels make money — not just revenue.',
    color: '#d97706',
  },
  {
    icon: '📦',
    title: 'Real-time inventory sync.',
    desc: 'One sale on eBay, all channels update instantly. Buffer rules protect you from overselling during peak periods.',
    color: '#0891b2',
  },
  {
    icon: '🔍',
    title: 'Social intelligence.',
    desc: 'Scrape top-performing content from TikTok, Instagram and YouTube. Analyse what hooks, formats and content types win in your niche.',
    color: '#e11d48',
  },
]

// ── Stats ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: 12,    suffix: '+',  label: 'Connected channels',      accent: '#a3e635' },
  { value: 10,    suffix: 'min',label: 'Average time to go live', accent: '#38bdf8' },
  { value: 40,    suffix: '%',  label: 'Less time on listing ops', accent: '#fb923c' },
  { value: 1000,  suffix: '+',  label: 'Products in one upload',  accent: '#a78bfa' },
]

// ── Comparison ────────────────────────────────────────────────────────────────

const COMPARE_ROWS = [
  { feature: 'Starting price',          auxio: '£49/mo',   feed: 'Custom',     rithum: '$2,000+', base: '$19/mo' },
  { feature: 'Time to go live',         auxio: '< 10 min', feed: 'Weeks',      rithum: 'Months',  base: '1–2 days' },
  { feature: 'AI listing optimisation', auxio: '✓',        feed: '✓',          rithum: '✓',       base: '✗' },
  { feature: 'True profit tracking',    auxio: '✓',        feed: '✗',          rithum: 'Partial', base: '✗' },
  { feature: 'Social intelligence',     auxio: '✓',        feed: '✗',          rithum: '✗',       base: '✗' },
  { feature: 'Self-serve setup',        auxio: '✓',        feed: 'Managed',    rithum: 'Managed', base: '✓' },
  { feature: 'Transparent pricing',     auxio: '✓',        feed: '✗',          rithum: '✗',       base: '✓' },
  { feature: 'UK-first support',        auxio: '✓',        feed: '✗',          rithum: '✗',       base: 'Partial' },
]

// ── Testimonials ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "We were spending 3 hours a day managing listings across eBay and Amazon. Auxio cut that to under 20 minutes.",
    name: 'Sarah M.',
    role: 'eBay & Amazon seller · 800 SKUs',
    metric: '87% time saved',
    metricColor: '#a3e635',
  },
  {
    quote: "The feed rules engine is genuinely powerful. We auto-apply a 12% markup on eBay and it just works — every time.",
    name: 'James T.',
    role: 'Shopify + eBay seller · UK',
    metric: '12% margin uplift',
    metricColor: '#38bdf8',
  },
  {
    quote: "Finally a platform that shows me actual profit, not just revenue. Changed how I make buying decisions completely.",
    name: 'Priya K.',
    role: 'Multi-channel seller · 1,200 SKUs',
    metric: 'Real profit visibility',
    metricColor: '#fb923c',
  },
]

// ── Plans ─────────────────────────────────────────────────────────────────────

const PLANS = [
  { name: 'Starter', founding: 49,  regular: 79,  desc: '1 channel · 500 listings',     popular: false },
  { name: 'Growth',  founding: 129, regular: 199, desc: '3 channels · unlimited listings', popular: true },
  { name: 'Scale',   founding: 399, regular: 599, desc: '5 channels · full automation',  popular: false },
]

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ = [
  { q: 'How is this different from Feedonomics?', a: "Feedonomics is enterprise — custom quotes, £1,000+/month, dedicated specialists and weeks of onboarding. Auxio is self-serve: connect, import, publish. Under 10 minutes. Founding member pricing from £49/month." },
  { q: 'Do you take a percentage of my revenue?', a: "Never. Flat monthly subscription. No GMV percentage, no per-order fees, no hidden charges." },
  { q: 'What happens to my live listings if I cancel?', a: "They stay live on all channels — we don't delete anything. You lose access to Auxio's dashboard. Month-to-month, cancel any time." },
  { q: 'Do I need technical knowledge?', a: "No. Channel connections use OAuth — click Connect, log in, done. CSV import handles bulk uploads intelligently. No API keys, no developer needed." },
]

// ── Main ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#0f172a', overflowX: 'hidden' }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: '60px', background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 800 }}>A</div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>Auxio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {[['Features', '/features'], ['Integrations', '/integrations'], ['Pricing', '/pricing'], ['Blog', '/blog'], ['About', '/about']].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 400 }}>{l}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => router.push('/login')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Sign in</button>
          {/* Pill button — Rithum pattern */}
          <button onClick={() => router.push('/signup')} style={{ background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', color: 'white', border: 'none', borderRadius: '9999px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '9px 22px', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(91,82,245,0.4)' }}>Start free →</button>
        </div>
      </nav>

      {/* ── HERO — dark navy with radial bloom (Feedonomics pattern) ── */}
      <div style={{ background: '#09090b', paddingTop: '130px', paddingBottom: '0', position: 'relative', overflow: 'hidden' }}>
        {/* Radial bloom */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(91,82,245,0.2) 0%, transparent 65%)', pointerEvents: 'none' }} />
        {/* Grid dot pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 1 }}>

          {/* Founding badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(163,230,53,0.1)', border: '1px solid rgba(163,230,53,0.25)', borderRadius: '9999px', padding: '6px 16px', fontSize: '13px', color: '#a3e635', fontWeight: 500 }}>
              <span style={{ width: '6px', height: '6px', background: '#a3e635', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
              Founding member pricing — <strong style={{ color: '#d4f76e' }}>{FOUNDING_CLAIMED} of {FOUNDING_TOTAL} spots claimed</strong>
              <button onClick={() => router.push('/signup')} style={{ background: 'transparent', border: 'none', color: '#a3e635', fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Claim yours →</button>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: '72px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.0, color: 'white', textAlign: 'center', marginBottom: '24px' }}>
            List once.<br />
            {/* Lime highlight — Feedonomics pattern */}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ background: 'linear-gradient(135deg, #a3e635, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Sell everywhere.</span>
            </span>
            <br />Profit clearly.
          </h1>

          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)', maxWidth: '540px', margin: '0 auto 36px', lineHeight: 1.65, textAlign: 'center' }}>
            The multichannel management platform built for UK sellers. eBay, Amazon, Shopify and 9 more channels — managed from one place, without the enterprise price tag.
          </p>

          {/* CTAs — pill buttons (Rithum pattern) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '14px' }}>
            <button onClick={() => router.push('/signup')} style={{ background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', color: 'white', border: 'none', borderRadius: '9999px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', padding: '15px 32px', fontFamily: 'inherit', boxShadow: '0 8px 32px rgba(91,82,245,0.45)' }}>Start free trial →</button>
            <button onClick={() => router.push('/features')} style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '9999px', fontSize: '16px', fontWeight: 500, cursor: 'pointer', padding: '15px 32px', fontFamily: 'inherit' }}>See how it works</button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginBottom: '56px' }}>No credit card · 14-day free trial · Cancel anytime</p>

          {/* Product mockup */}
          <div style={{ maxWidth: '920px', margin: '0 auto', borderRadius: '16px 16px 0 0', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', boxShadow: '0 -8px 80px rgba(91,82,245,0.25)', overflow: 'hidden', background: 'white' }}>
            {/* Browser chrome */}
            <div style={{ background: '#f7f7f5', borderBottom: '1px solid #e8e8e5', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                {['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} style={{ width: '11px', height: '11px', borderRadius: '50%', background: c }} />)}
              </div>
              <div style={{ flex: 1, background: 'white', borderRadius: '5px', padding: '4px 14px', fontSize: '11px', color: '#9b9b98', border: '1px solid #e8e8e5', textAlign: 'center', maxWidth: '240px', margin: '0 auto' }}>app.auxio.io/listings</div>
            </div>
            {/* App shell */}
            <div style={{ display: 'flex', height: '320px' }}>
              <div style={{ width: '160px', background: '#0f1117', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '12px 8px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px', marginBottom: '14px' }}>
                  <div style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 700 }}>A</div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>Auxio</span>
                </div>
                {[{ icon: '⚡', label: 'Dashboard', active: false }, { icon: '🏷️', label: 'Listings', active: true }, { icon: '🔗', label: 'Channels', active: false }, { icon: '📦', label: 'Inventory', active: false }, { icon: '🤖', label: 'AI Agent', active: false, badge: 3 }].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 8px', borderRadius: '5px', background: item.active ? 'rgba(255,255,255,0.07)' : 'transparent', marginBottom: '1px', fontSize: '11px', color: item.active ? 'white' : 'rgba(255,255,255,0.4)', fontWeight: item.active ? 500 : 400 }}>
                    <span style={{ fontSize: '12px' }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {(item as any).badge > 0 && <span style={{ background: '#f59e0b', color: 'white', fontSize: '9px', fontWeight: 700, padding: '1px 4px', borderRadius: '6px' }}>{(item as any).badge}</span>}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, padding: '16px 20px', background: '#fafafa', overflowX: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Listings</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>12 listings · create once, publish everywhere</div>
                  </div>
                  <div style={{ display: 'flex', gap: '7px' }}>
                    <div style={{ padding: '6px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px', color: '#64748b' }}>Import CSV</div>
                    <div style={{ padding: '6px 12px', background: '#0f172a', borderRadius: '6px', fontSize: '11px', color: 'white', fontWeight: 600 }}>+ New listing</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                  {['All 12', 'Draft 4', 'Published 7', 'Failed 1'].map((f, i) => (
                    <div key={f} style={{ padding: '4px 10px', border: `1px solid ${i === 0 ? '#0f172a' : '#e2e8f0'}`, borderRadius: '5px', fontSize: '10px', fontWeight: i === 0 ? 600 : 400, color: i === 0 ? '#0f172a' : '#94a3b8', background: i === 0 ? '#f1f5f9' : 'white' }}>{f}</div>
                  ))}
                </div>
                <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 120px 100px', gap: 0, borderBottom: '1px solid #f1f5f9', padding: '7px 12px' }}>
                    {['Product', 'Price', 'Stock', 'Channels', 'Status'].map(h => <div key={h} style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>)}
                  </div>
                  {[
                    { title: 'Nike Air Max 90 — UK 10', price: '£89.99', stock: '3', ch: [1,1,1], status: 'Published', sc: '#16a34a', sb: '#dcfce7' },
                    { title: 'Adidas Ultraboost — UK 9', price: '£119.99', stock: '1', ch: [1,1,0], status: 'Published', sc: '#16a34a', sb: '#dcfce7' },
                    { title: 'New Balance 574 — UK 11', price: '£74.99', stock: '5', ch: [0,0,0], status: 'Draft', sc: '#64748b', sb: '#f1f5f9' },
                    { title: 'Puma RS-X — UK 8', price: '£54.99', stock: '0', ch: [1,0,0], status: 'Failed', sc: '#dc2626', sb: '#fef2f2' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 120px 100px', gap: 0, padding: '8px 12px', borderBottom: i < 3 ? '1px solid #f8fafc' : 'none', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{row.title}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>{row.price}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{row.stock}</div>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {(['eBay','AMZ','SFY'] as const).map((ch, j) => <div key={ch} style={{ padding: '2px 5px', borderRadius: '3px', fontSize: '9px', fontWeight: 600, background: row.ch[j] ? '#ede9fe' : '#f1f5f9', color: row.ch[j] ? '#5b52f5' : '#cbd5e1' }}>{ch}</div>)}
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: row.sb, color: row.sc }}>{row.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider — Base.com pattern */}
      <WaveDivider fill="#09090b" inverted />

      {/* ── LOGO STRIP ──────────────────────────────────────── */}
      <div style={{ background: '#f7f3eb', padding: '48px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '28px' }}>Connect and sell on every major channel</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {CHANNEL_LOGOS.map(ch => (
              <div key={ch.name} style={{ padding: '8px 18px', borderRadius: '8px', background: ch.bg, border: '1px solid rgba(0,0,0,0.06)', fontSize: '13px', fontWeight: 700, color: ch.color }}>
                {ch.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS — gradient numbers (Feedonomics pattern) ── */}
      <div style={{ background: '#f7f3eb', padding: '0 48px 72px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {STATS.map(s => (
              <div key={s.label} style={{ padding: '28px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', background: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-0.04em', background: `linear-gradient(135deg, ${s.accent}, ${s.accent}bb)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1, marginBottom: '8px' }}>
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, lineHeight: 1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <WaveDivider fill="#f7f3eb" />

      {/* ── FEATURES ────────────────────────────────────────── */}
      <div id="features" style={{ background: 'white', padding: '80px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(91,82,245,0.08)', border: '1px solid rgba(91,82,245,0.15)', fontSize: '12px', color: '#5b52f5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Platform features</div>
            <h2 style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: '12px' }}>Everything in one place</h2>
            <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>From first listing to every marketplace — without the complexity or the cost.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ padding: '28px', border: '1px solid #e8e8e5', borderRadius: '14px', transition: 'box-shadow 0.2s' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── COMPARISON TABLE ─────────────────────────────────── */}
      <div style={{ background: '#09090b', padding: '80px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.03em', color: 'white', marginBottom: '12px' }}>Why sellers choose Auxio</h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.45)', maxWidth: '480px', margin: '0 auto' }}>Powerful like Feedonomics. Affordable like Baselinker. Faster than both.</p>
          </div>
          <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ padding: '14px 20px' }} />
              {['Auxio', 'Feedonomics', 'Rithum', 'Baselinker'].map((name, i) => (
                <div key={name} style={{ padding: '14px 12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: i === 0 ? '#a3e635' : 'rgba(255,255,255,0.4)' }}>{name}</span>
                </div>
              ))}
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: i < COMPARE_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ padding: '13px 20px', fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{row.feature}</div>
                {[row.auxio, row.feed, row.rithum, row.base].map((val, j) => (
                  <div key={j} style={{ padding: '13px 12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: j === 0 ? '#a3e635' : val === '✗' || val === 'Managed' || val === 'Months' || val === 'Weeks' || val === '$2,000+' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)' }}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS — case study cards (Rithum pattern) ── */}
      <div style={{ background: '#f7f3eb', padding: '80px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: '12px' }}>What sellers say</h2>
            <p style={{ fontSize: '18px', color: '#64748b' }}>Real results from real sellers.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                {/* Metric badge — Rithum case study pattern */}
                <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '9999px', background: `${t.metricColor}18`, border: `1px solid ${t.metricColor}40`, fontSize: '13px', fontWeight: 700, color: t.metricColor, marginBottom: '18px' }}>{t.metric}</div>
                <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.7, marginBottom: '20px', fontStyle: 'italic' }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <div id="pricing" style={{ background: 'white', padding: '80px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', fontSize: '13px', color: '#d97706', fontWeight: 600, marginBottom: '16px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
              {FOUNDING_TOTAL - FOUNDING_CLAIMED} founding spots remaining
            </div>
            <h2 style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: '12px' }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: '18px', color: '#64748b' }}>No custom quotes. No revenue share. Start free, upgrade when ready.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '860px', margin: '0 auto' }}>
            {PLANS.map(plan => (
              <div key={plan.name} style={{ padding: '28px', borderRadius: '16px', border: plan.popular ? '2px solid #5b52f5' : '1px solid #e8e8e5', boxShadow: plan.popular ? '0 8px 40px rgba(91,82,245,0.15)' : 'none', position: 'relative' }}>
                {plan.popular && <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: '#5b52f5', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '9999px', whiteSpace: 'nowrap' }}>MOST POPULAR</div>}
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{plan.name}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>{plan.desc}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '38px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>£{plan.founding}</span>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>/mo</span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', textDecoration: 'line-through', marginBottom: '4px' }}>£{plan.regular}/mo regular</div>
                <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 600, marginBottom: '20px' }}>Founding member rate</div>
                <button onClick={() => router.push('/signup')} style={{ width: '100%', padding: '11px', borderRadius: '9999px', border: plan.popular ? 'none' : '1px solid #e2e8f0', background: plan.popular ? 'linear-gradient(135deg, #5b52f5, #7c6af7)' : 'transparent', color: plan.popular ? 'white' : '#0f172a', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Start free trial →
                </button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#94a3b8' }}>
            Need more? <a href="/pricing" style={{ color: '#5b52f5', textDecoration: 'none', fontWeight: 600 }}>See all plans including Enterprise →</a>
          </p>
        </div>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <div style={{ background: '#f7f3eb', padding: '80px 48px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: '40px', textAlign: 'center' }}>Common questions</h2>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '16px', fontFamily: 'inherit' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{item.q}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M4 6l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {openFaq === i && <div style={{ paddingBottom: '18px', fontSize: '14px', color: '#64748b', lineHeight: 1.7 }}>{item.a}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <div style={{ background: '#09090b', padding: '100px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(91,82,245,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '52px', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '20px' }}>
            Ready to sell smarter?
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', lineHeight: 1.6 }}>
            Join sellers already using Auxio to list faster, profit clearly, and grow without the chaos.
          </p>
          <p style={{ fontSize: '14px', color: '#d97706', fontWeight: 600, marginBottom: '36px' }}>{FOUNDING_TOTAL - FOUNDING_CLAIMED} founding spots left at up to 40% off.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => router.push('/signup')} style={{ background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', color: 'white', border: 'none', borderRadius: '9999px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', padding: '16px 36px', fontFamily: 'inherit', boxShadow: '0 8px 40px rgba(91,82,245,0.45)' }}>
              Claim founding rate →
            </button>
            <button onClick={() => router.push('/contact')} style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '9999px', fontSize: '16px', fontWeight: 500, cursor: 'pointer', padding: '16px 36px', fontFamily: 'inherit' }}>
              Book a demo
            </button>
          </div>
          <p style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>No credit card · 14-day free trial · Cancel anytime</p>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ background: '#09090b', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '40px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 800 }}>A</div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>Auxio</span>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', maxWidth: '220px', lineHeight: 1.5 }}>The multichannel platform for UK sellers.</p>
          </div>
          <div style={{ display: 'flex', gap: '48px' }}>
            {[
              { heading: 'Product', links: [['Features', '/features'], ['Integrations', '/integrations'], ['Pricing', '/pricing'], ['Blog', '/blog']] },
              { heading: 'Company', links: [['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
              { heading: 'Account', links: [['Sign in', '/login'], ['Start free', '/signup']] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>{col.heading}</div>
                {col.links.map(([label, href]) => (
                  <a key={label} href={href} style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: '8px' }}>{label}</a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: '1100px', margin: '24px auto 0', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.15)' }}>© 2026 Auxio. All rights reserved. Built in the UK 🇬🇧</p>
        </div>
      </footer>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        a { color: inherit; }
      `}</style>
    </div>
  )
}
