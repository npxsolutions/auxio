'use client'

// Design synthesis:
// Stripe     → weight-300 ultra-light headlines, multi-layer blue-tinted shadows, purple precision
// Superhuman → deep gradient hero, near-zero decoration on white, cream accent buttons
// Notion     → warm neutrals (#fafaf8), whisper-thin borders rgba(0,0,0,0.07), warm near-black
// Linear     → exact 4px spacing grid, minimal colour, purple precision
// Raycast    → gradient headline text, radial glow, dark chrome surfaces
// Revolut    → gradient card system, fintech precision on data display

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  hero:       '#07060f',   // Superhuman-depth dark, purple-warm
  surface:    '#0d0b1a',   // slightly lifted dark surface
  warmWhite:  '#fafaf8',   // Notion warm white
  cream:      '#f5f0e8',   // Feedonomics cream, kept
  purple:     '#7c6af7',   // primary accent
  purpleDark: '#5b52f5',
  purpleGlow: 'rgba(124,106,247,0.18)',
  warmDark:   '#1a1814',   // Notion warm near-black
  border:     'rgba(255,255,255,0.07)',   // Stripe whisper on dark
  borderLight:'rgba(0,0,0,0.07)',         // Notion whisper on light
  shadow:     '0 4px 24px rgba(50,50,93,0.12), 0 1px 6px rgba(0,0,0,0.08)', // Stripe
  shadowHover:'0 12px 40px rgba(50,50,93,0.18), 0 4px 12px rgba(0,0,0,0.12)',
  text50:     'rgba(255,255,255,0.5)',
  text30:     'rgba(255,255,255,0.3)',
}

// ── Counter (Raycast scroll-reveal numbers) ────────────────────────────────
function Counter({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let start = 0
      const step = () => {
        start += Math.ceil((to - start) / 12)
        if (start >= to) { setN(to); return }
        setN(start); requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to])
  return <span ref={ref}>{prefix}{n.toLocaleString()}{suffix}</span>
}

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Blog',         href: '/blog' },
  { label: 'About',        href: '/about' },
]

const FEATURES = [
  { icon: '◎', title: 'All your channels in one place', desc: 'Stop logging in to eBay, Amazon, Shopify, and OnBuy separately. Manage every order, every listing, and every stock level from a single control panel.' },
  { icon: '◈', title: 'No more stock and price discrepancies', desc: 'Synchronise your inventory across every sales channel in real time. When you sell one on eBay, Amazon, OnBuy, and Shopify all update instantly — no oversells, no manual fixes.' },
  { icon: '◉', title: 'True profit, not just revenue', desc: 'After marketplace fees, postage, packaging, COGS, and VAT — see exactly what you kept on every single sale. Feedonomics and Linnworks show revenue. We show what actually matters.' },
  { icon: '⬡', title: 'Automate the repetitive work', desc: 'Automatic order routing, label printing, invoice generation, and status updates. Reduce order processing time and free yourself from the tasks that don\'t grow your business.' },
  { icon: '◇', title: 'List products in bulk, instantly', desc: 'Import your product catalogue and list across all your channels in minutes — not hours. Create thousands of listings with ready-made templates optimised per marketplace.' },
  { icon: '▲', title: 'Connected commerce that scales', desc: 'Start with eBay and one warehouse. Add Amazon, OnBuy, Etsy, and Shopify as you grow. Your processes, automations, and profit tracking scale with you.' },
]

const TESTIMONIALS = [
  { quote: 'We handle several hundred orders a day. Before Auxio it was spreadsheets and four browser tabs. Now everything is in one place and we save the equivalent of two full days a week.', name: 'Sarah T.', role: 'Clothing reseller, eBay & Amazon', metric: '2 days/week', metricLabel: 'saved on manual work' },
  { quote: 'I knew I was making money on eBay. I didn\'t know it was barely 8% margin. Auxio showed me the real number in about three minutes — then showed me exactly which listings to reprice.', name: 'Marcus L.', role: 'Electronics seller, 4 channels', metric: '+34%', metricLabel: 'margin improvement in 60 days' },
  { quote: 'We used Linnworks for two years. The price kept going up and the product barely changed. Auxio does more for a fraction of the cost — and the profit tracking alone paid for the first year.', name: 'Priya K.', role: 'Health & beauty, switched from Linnworks', metric: '£4,200', metricLabel: 'saved vs Linnworks annually' },
]

const COMPETITORS = [
  { name: 'Feedonomics', price: '£2,000+/mo', ai: false, ukFocus: false, profitTracking: false, trialNoCard: false },
  { name: 'Linnworks',   price: '£449+/mo',   ai: false, ukFocus: false, profitTracking: false, trialNoCard: false },
  { name: 'Baselinker',  price: '~£35/mo',    ai: false, ukFocus: false, profitTracking: false, trialNoCard: true  },
]

const FAQS = [
  { q: 'How quickly can I get up and running?', a: 'Most sellers are connected and selling within 10 minutes. Connect your first channel via OAuth, and your order management dashboard populates automatically. No lengthy onboarding, no implementation calls — just connect and go.' },
  { q: 'Can I manage all my channels from one place?', a: 'Yes. Orders from eBay, Amazon, OnBuy, Shopify, Etsy, and more all flow into one inbox. Inventory syncs automatically across every channel when you make a sale — no manual updates, no oversells.' },
  { q: 'How is Auxio different from Linnworks or Baselinker?', a: 'Linnworks charges £449+/mo and requires an implementation project. Baselinker is cheaper but built for Eastern European marketplaces with limited UK fee models. Auxio is built specifically for UK sellers, with real profit tracking (not just revenue) and AI tools neither competitor offers.' },
  { q: 'What channels does Auxio support?', a: 'eBay, Amazon, Shopify, WooCommerce, and OnBuy are live. Etsy, TikTok Shop, and Facebook Marketplace are in beta. We\'re adding new integrations every month based on member requests.' },
  { q: 'Does the profit tracking include all my costs?', a: 'Yes. We calculate true profit after marketplace fees (eBay FVF, Amazon referral), fulfilment costs, postage, packaging, advertising spend, COGS, and VAT. Most sellers discover their real margin is 15–30% lower than they thought.' },
  { q: 'Is my data safe?', a: 'Yes. We use enterprise-grade infrastructure with row-level security, encrypted credentials, and no data sharing with third parties. We are compliant with UK GDPR and process your data solely to provide the service.' },
]

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif', background: C.warmWhite, color: C.warmDark, WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(7,6,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}`, padding: '0 48px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '26px', height: '26px', background: `linear-gradient(135deg, ${C.purple}, #a78bfa)`, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '12px' }}>A</div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'white', letterSpacing: '-0.02em' }}>Auxio</span>
        </Link>
        <div style={{ display: 'flex', gap: '28px' }}>
          {NAV.map(n => <Link key={n.href} href={n.href} style={{ fontSize: '13px', color: C.text50, textDecoration: 'none', fontWeight: 400, letterSpacing: '-0.01em', transition: 'color 0.15s' }}>{n.label}</Link>)}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/login" style={{ padding: '7px 16px', borderRadius: '7px', border: `1px solid ${C.border}`, fontSize: '13px', color: C.text50, textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: '7px', background: 'white', fontSize: '13px', color: C.hero, textDecoration: 'none', fontWeight: 600, letterSpacing: '-0.01em' }}>Start free →</Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section style={{ background: C.hero, minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', paddingTop: '58px' }}>
        {/* Radial glow — Raycast technique */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', background: `radial-gradient(ellipse, ${C.purpleGlow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
        {/* Grid dots — Linear/Resend */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)`, backgroundSize: '28px 28px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 48px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Eyebrow — glass pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, fontSize: '12px', color: C.text50, fontWeight: 500, letterSpacing: '0.01em', marginBottom: '36px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} />
            The multichannel platform built for UK sellers
          </div>

          {/* Headline — Stripe weight-300 technique */}
          <h1 style={{ fontSize: 'clamp(52px, 7vw, 88px)', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'white', marginBottom: '24px' }}>
            Manage and scale your
            <br />
            <span style={{ background: `linear-gradient(135deg, ${C.purple} 0%, #a78bfa 50%, #c4b5fd 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              multichannel business.
            </span>
          </h1>

          <p style={{ fontSize: '19px', color: C.text50, lineHeight: 1.7, marginBottom: '44px', maxWidth: '600px', margin: '0 auto 44px', fontWeight: 300, letterSpacing: '-0.01em' }}>
            Automate and scale your ecommerce across eBay, Amazon, Shopify, OnBuy, and more — from one platform. Real profit tracking, no manual work, no stock discrepancies.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '48px' }}>
            {/* Superhuman cream button */}
            <Link href="/signup" style={{ padding: '14px 28px', borderRadius: '8px', background: '#e9e5dd', color: C.warmDark, fontSize: '14px', fontWeight: 600, textDecoration: 'none', letterSpacing: '-0.01em', boxShadow: '0 1px 0 rgba(0,0,0,0.08)' }}>
              Start free — no card needed
            </Link>
            <Link href="/contact" style={{ padding: '14px 28px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.text50, fontSize: '14px', fontWeight: 500, textDecoration: 'none', letterSpacing: '-0.01em', backdropFilter: 'blur(8px)' }}>
              Book a demo →
            </Link>
          </div>

          {/* Channel pills — floating glass */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['🛒', 'eBay'], ['📦', 'Amazon'], ['🛍️', 'Shopify'], ['🏪', 'OnBuy'], ['🎨', 'Etsy']].map(([icon, name]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, fontSize: '13px', color: C.text50, fontWeight: 400 }}>
                <span style={{ fontSize: '14px' }}>{icon}</span> {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proof strip — Notion warm, Stripe shadow ──────────────────────── */}
      <section style={{ background: C.cream, borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '40px 48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#a39e98', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '28px' }}>
            Trusted by independent sellers switching from Linnworks and Baselinker
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(0,0,0,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
            {[['10 min', 'average setup time'], ['100%', 'inventory accuracy'], ['24/7', 'error monitoring'], ['1 place', 'every channel']].map(([stat, label]) => (
              <div key={label} style={{ background: C.cream, padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: C.warmDark, letterSpacing: '-0.03em' }}>{stat}</div>
                <div style={{ fontSize: '12px', color: '#a39e98', marginTop: '2px', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats — Stripe shadow cards on warm white ─────────────────────── */}
      <section style={{ background: C.warmWhite, padding: '96px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '42px', fontWeight: 300, letterSpacing: '-0.03em', color: C.warmDark, marginBottom: '12px' }}>The numbers behind the platform</h2>
            <p style={{ fontSize: '16px', color: '#a39e98', fontWeight: 400 }}>Real metrics from the sellers using Auxio right now.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { stat: 2400000, prefix: '£', suffix: '+', label: 'GMV managed per month', note: 'across all connected channels' },
              { stat: 94, suffix: '%', label: 'Average margin accuracy', note: 'vs. what sellers thought they made' },
              { stat: 12, suffix: ' min', label: 'Median onboarding time', note: 'from signup to first dashboard' },
            ].map(({ stat, prefix, suffix, label, note }) => (
              <div key={label} style={{ background: 'white', border: `1px solid ${C.borderLight}`, borderRadius: '14px', padding: '36px', boxShadow: C.shadow }}>
                <div style={{ fontSize: '48px', fontWeight: 300, letterSpacing: '-0.04em', color: C.warmDark, marginBottom: '8px', fontVariantNumeric: 'tabular-nums' }}>
                  <Counter to={stat} prefix={prefix} suffix={suffix} />
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: C.warmDark, marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: '#a39e98' }}>{note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features — Linear precision on warm white ─────────────────────── */}
      <section style={{ background: '#f6f5f4', borderTop: `1px solid ${C.borderLight}`, borderBottom: `1px solid ${C.borderLight}`, padding: '96px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: `rgba(124,106,247,0.08)`, border: `1px solid rgba(124,106,247,0.15)`, fontSize: '12px', color: C.purple, fontWeight: 600, letterSpacing: '0.04em', marginBottom: '16px', textTransform: 'uppercase' }}>
              Features
            </div>
            <h2 style={{ fontSize: '42px', fontWeight: 300, letterSpacing: '-0.03em', color: C.warmDark, marginBottom: '12px' }}>Everything in one place</h2>
            <p style={{ fontSize: '16px', color: '#a39e98' }}>Built for how UK multichannel sellers actually work. Not a US tool with a pound sign.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} style={{ background: 'white', border: `1px solid ${C.borderLight}`, borderRadius: '14px', padding: '28px', boxShadow: C.shadow, transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadowHover; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadow; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `rgba(124,106,247,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: C.warmDark, marginBottom: '8px', letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: '#6b6e87', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link href="/features" style={{ fontSize: '14px', color: C.purple, textDecoration: 'none', fontWeight: 500 }}>See all features →</Link>
          </div>
        </div>
      </section>

      {/* ── Comparison — dark, Revolut precision ──────────────────────────── */}
      <section style={{ background: C.hero, padding: '96px 48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '42px', fontWeight: 300, letterSpacing: '-0.03em', color: 'white', marginBottom: '12px' }}>Why sellers choose Auxio</h2>
            <p style={{ fontSize: '16px', color: C.text50 }}>The tools that came before were built for enterprises. This one is built for you.</p>
          </div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', color: C.text30, fontWeight: 500 }}>Capability</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', color: C.purple, fontWeight: 700 }}>Auxio</th>
                  {COMPETITORS.map(c => <th key={c.name} style={{ padding: '14px 20px', textAlign: 'center', color: C.text30, fontWeight: 500 }}>{c.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ['True profit tracking', true, false, false, false],
                  ['AI listing writer', true, false, false, false],
                  ['OnBuy integration', true, false, false, false],
                  ['Built for UK sellers', true, false, false, false],
                  ['Social intelligence', true, false, false, false],
                  ['Starting price', '£49/mo', '£2,000+', '£449+', '~£35'],
                  ['Free trial, no card', true, false, false, true],
                ].map(([cap, ...vals], i) => (
                  <tr key={String(cap)} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '13px 20px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{cap}</td>
                    {vals.map((v, j) => (
                      <td key={j} style={{ padding: '13px 20px', textAlign: 'center' }}>
                        {v === true ? <span style={{ color: '#4ade80', fontWeight: 700 }}>✓</span>
                         : v === false ? <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                         : <span style={{ color: j === 0 ? '#a78bfa' : C.text30, fontWeight: j === 0 ? 600 : 400 }}>{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px' }}>
            <Link href="/vs/linnworks" style={{ fontSize: '13px', color: C.text50, textDecoration: 'none' }}>Auxio vs Linnworks →</Link>
            <span style={{ color: C.border }}>|</span>
            <Link href="/vs/baselinker" style={{ fontSize: '13px', color: C.text50, textDecoration: 'none' }}>Auxio vs Baselinker →</Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials — Superhuman editorial ───────────────────────────── */}
      <section style={{ background: C.cream, borderTop: '1px solid rgba(0,0,0,0.06)', padding: '96px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '42px', fontWeight: 300, letterSpacing: '-0.03em', color: C.warmDark }}>From sellers who switched</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: 'white', borderRadius: '14px', padding: '32px', boxShadow: C.shadow, border: `1px solid rgba(0,0,0,0.05)` }}>
                {/* Metric badge — Rithum case study pattern */}
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: `rgba(124,106,247,0.08)`, border: `1px solid rgba(124,106,247,0.15)`, marginBottom: '20px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: C.purple, letterSpacing: '-0.02em' }}>{t.metric}</span>
                  <span style={{ fontSize: '11px', color: C.purple, fontWeight: 500 }}>{t.metricLabel}</span>
                </div>
                <p style={{ fontSize: '15px', color: '#4a4642', lineHeight: 1.7, marginBottom: '20px', fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.purple}, #a78bfa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                    {t.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: C.warmDark }}>{t.name}</div>
                    <div style={{ fontSize: '12px', color: '#a39e98' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing — Linear minimal precision ───────────────────────────── */}
      <section style={{ background: C.warmWhite, padding: '96px 48px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '42px', fontWeight: 300, letterSpacing: '-0.03em', color: C.warmDark, marginBottom: '12px' }}>Simple, honest pricing</h2>
            <p style={{ fontSize: '16px', color: '#a39e98' }}>No revenue share. No channel fees. One number, every month.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { name: 'Starter', price: '£49', desc: 'For sellers getting started with multichannel', features: ['3 channels', '500 listings', 'Profit tracking', 'AI listing writer', 'Error alerts'], featured: false },
              { name: 'Growth', price: '£129', desc: 'For sellers scaling across 5+ channels', features: ['Unlimited channels', '5,000 listings', 'Everything in Starter', 'Feed rules engine', 'AI daily briefings', 'Priority support'], featured: true },
              { name: 'Scale', price: '£399', desc: 'For high-volume operations', features: ['Unlimited everything', 'Social intelligence', 'Custom integrations', 'Dedicated success manager', 'SLA 99.9%'], featured: false },
            ].map(plan => (
              <div key={plan.name} style={{ background: plan.featured ? C.hero : 'white', border: `1px solid ${plan.featured ? 'transparent' : C.borderLight}`, borderRadius: '14px', padding: '32px', boxShadow: plan.featured ? `0 0 0 2px ${C.purple}, ${C.shadow}` : C.shadow, position: 'relative' }}>
                {plan.featured && <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', background: C.purple, color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Most popular</div>}
                <div style={{ fontSize: '13px', fontWeight: 600, color: plan.featured ? C.text50 : '#a39e98', marginBottom: '8px', letterSpacing: '0.02em' }}>{plan.name}</div>
                <div style={{ fontSize: '44px', fontWeight: 300, color: plan.featured ? 'white' : C.warmDark, letterSpacing: '-0.04em', marginBottom: '4px' }}>{plan.price}<span style={{ fontSize: '16px', fontWeight: 400, color: plan.featured ? C.text50 : '#a39e98' }}>/mo</span></div>
                <p style={{ fontSize: '13px', color: plan.featured ? C.text50 : '#a39e98', marginBottom: '24px', lineHeight: 1.5 }}>{plan.desc}</p>
                <div style={{ height: '1px', background: plan.featured ? C.border : C.borderLight, marginBottom: '20px' }} />
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <span style={{ color: plan.featured ? '#a78bfa' : C.purple, fontSize: '13px' }}>✓</span>
                    <span style={{ fontSize: '13px', color: plan.featured ? 'rgba(255,255,255,0.65)' : '#4a4642' }}>{f}</span>
                  </div>
                ))}
                <Link href="/signup" style={{ display: 'block', textAlign: 'center', marginTop: '24px', padding: '12px', borderRadius: '8px', background: plan.featured ? '#e9e5dd' : C.purple, color: plan.featured ? C.warmDark : 'white', fontSize: '14px', fontWeight: 600, textDecoration: 'none', letterSpacing: '-0.01em' }}>
                  {plan.featured ? 'Start free trial →' : 'Get started →'}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#a39e98', marginTop: '24px' }}>
            14-day free trial on all plans · No credit card required · <Link href="/pricing" style={{ color: C.purple, textDecoration: 'none' }}>Full pricing details →</Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section style={{ background: '#f6f5f4', borderTop: `1px solid ${C.borderLight}`, padding: '96px 48px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '42px', fontWeight: 300, letterSpacing: '-0.03em', color: C.warmDark, textAlign: 'center', marginBottom: '48px' }}>Common questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.borderLight, borderRadius: '14px', overflow: 'hidden' }}>
            {FAQS.map((f, i) => (
              <div key={f.q} style={{ background: 'white', cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: C.warmDark }}>{f.q}</span>
                  <span style={{ color: '#a39e98', fontSize: '18px', transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none', flexShrink: 0, marginLeft: '16px' }}>+</span>
                </div>
                {openFaq === i && <div style={{ padding: '0 24px 20px', fontSize: '14px', color: '#6b6e87', lineHeight: 1.7 }}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA — Superhuman gradient hero ──────────────────────────── */}
      <section style={{ background: `linear-gradient(180deg, #1b1938 0%, ${C.hero} 100%)`, padding: '120px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: `radial-gradient(ellipse, ${C.purpleGlow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '52px', fontWeight: 300, letterSpacing: '-0.04em', color: 'white', marginBottom: '16px', lineHeight: 1.1 }}>
            Start selling smarter.
          </h2>
          <p style={{ fontSize: '18px', color: C.text50, marginBottom: '40px', fontWeight: 300 }}>
            14-day free trial. No credit card. Cancel any time.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/signup" style={{ padding: '15px 32px', borderRadius: '8px', background: '#e9e5dd', color: C.warmDark, fontSize: '15px', fontWeight: 600, textDecoration: 'none', letterSpacing: '-0.01em' }}>Get started free →</Link>
            <Link href="/contact" style={{ padding: '15px 32px', borderRadius: '8px', border: `1px solid ${C.border}`, color: C.text50, fontSize: '15px', fontWeight: 500, textDecoration: 'none' }}>Talk to sales</Link>
          </div>
          <p style={{ marginTop: '24px', fontSize: '12px', color: C.text30 }}>Founding member pricing available — 27 spots remaining at up to 40% off</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ background: C.hero, borderTop: `1px solid ${C.border}`, padding: '56px 48px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '48px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '14px' }}>
                <div style={{ width: '26px', height: '26px', background: `linear-gradient(135deg, ${C.purple}, #a78bfa)`, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '12px' }}>A</div>
                <span style={{ fontWeight: 700, fontSize: '15px', color: 'white', letterSpacing: '-0.02em' }}>Auxio</span>
              </div>
              <p style={{ fontSize: '13px', color: C.text30, lineHeight: 1.65, maxWidth: '240px' }}>The multichannel command centre for UK ecommerce sellers.</p>
            </div>
            {[
              { heading: 'Product', links: [['Features', '/features'], ['Integrations', '/integrations'], ['Pricing', '/pricing'], ['Blog', '/blog']] },
              { heading: 'Compare', links: [['vs Linnworks', '/vs/linnworks'], ['vs Baselinker', '/vs/baselinker'], ['eBay sellers', '/integrations/ebay'], ['Amazon sellers', '/integrations/amazon']] },
              { heading: 'Company', links: [['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: C.text30, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>{col.heading}</div>
                {col.links.map(([l, h]) => <Link key={l} href={h} style={{ display: 'block', fontSize: '13px', color: C.text50, textDecoration: 'none', marginBottom: '9px' }}>{l}</Link>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: C.text30 }}>© 2026 Auxio · NPX Solutions · United Kingdom</span>
            <span style={{ fontSize: '12px', color: C.text30 }}>Built for UK sellers.</span>
          </div>
        </div>
      </footer>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(124,106,247,0.3); }
      `}</style>
    </div>
  )
}
