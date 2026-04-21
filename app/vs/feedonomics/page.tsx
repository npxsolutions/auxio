import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'
import type { Metadata } from 'next'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display-vs',
})

export const metadata: Metadata = {
  title: 'Palvento vs Feedonomics — Self-serve feed management without the $2,500/mo floor',
  description: 'Feedonomics is enterprise feed management, quote-only, ~$2,500+/mo, 30-day kickoff. Palvento is self-serve from $149/mo, live in under ten minutes. Honest comparison for Shopify-led sellers.',
  keywords: ['Feedonomics alternative', 'Feedonomics pricing', 'Feedonomics vs Palvento', 'self-serve feed management', 'Shopify feed management'],
}

const C = {
  bg:        '#f8f4ec',
  surface:   '#ffffff',
  raised:    '#fdfaf2',
  ink:       '#0b0f1a',
  inkSoft:   '#1c2233',
  rule:      'rgba(11,15,26,0.10)',
  ruleSoft:  'rgba(11,15,26,0.06)',
  muted:     '#5a6171',
  mutedDk:   '#2c3142',
  cobalt:    '#e8863f',
  cobaltDk:  '#c46f2a',
}

type Row = { feature: string; palvento: string; feedonomics: string; highlight?: boolean }
const ROWS: Row[] = [
  { feature: 'Pricing',                        palvento: 'From $149/mo, published in 5 currencies', feedonomics: 'Quote-only, ~$2,500+/mo floor', highlight: true },
  { feature: 'Time to first listing live',     palvento: 'Under 10 minutes',                        feedonomics: '30-day implementation kickoff',  highlight: true },
  { feature: 'Sales motion',                   palvento: 'Self-serve from Shopify App Store',       feedonomics: 'Sales-led, demo before price' },
  { feature: 'Contract',                       palvento: 'Monthly, cancel any time',                feedonomics: 'Annual, multi-year standard' },
  { feature: 'Channels',                       palvento: '3 live today (Shopify, eBay, Google Shopping); Amazon, Etsy, TikTok Shop, Walmart, OnBuy, BigCommerce, WooCommerce shipping with design partners', feedonomics: '100+ (enterprise retail breadth)' },
  { feature: 'Category + aspects enrichment',  palvento: 'Automatic, rules-based',                   feedonomics: 'Concierge, managed-services team' },
  { feature: 'Onboarding',                     palvento: 'Self-serve, docs + Loom',                  feedonomics: 'Solutions architect, managed' },
  { feature: 'Best for',                       palvento: 'Shopify-led SMB to mid-market',            feedonomics: 'Enterprise catalog ops teams' },
  { feature: 'Per-channel P&L',                palvento: 'Built-in, reconciled payouts',             feedonomics: 'Not included' },
  { feature: 'Pre-flight feed validator',      palvento: 'Built-in, catches before submit',          feedonomics: 'Managed by account team' },
]

const FEEDONOMICS_RIGHT = [
  { h: 'You need 100+ marketplace connectors.',           b: 'Walmart DSV, Target Plus, Kroger, regional retail feeds — if your stack requires connectors outside the major nine, Feedonomics is the deeper bench.' },
  { h: 'You want a concierge managed-services team.',    b: 'Feedonomics will hand-tune your taxonomy and category mappings for you. If that is the service you want to buy, they do it well and have done it for a decade.' },
  { h: 'You have complex enterprise taxonomy.',          b: 'Multi-brand, multi-region, multi-category, with dedicated channel-ops staff already budgeted. The enterprise shape is the right shape for you.' },
]

const MERIDIA_RIGHT = [
  { h: 'You are Shopify-led and want to stay that way.', b: 'Install from the App Store, OAuth in one click, two-way sync on day one. No middleware, no services retainer, no solutions architect.' },
  { h: 'Your budget for feed tooling is under $500/mo.', b: 'Feedonomics will not quote you. Shopify Marketplace Connect caps out at three marketplaces. Palvento fits in the $149–$799/mo band where the rest of your stack already lives.' },
  { h: 'You run under 100 SKUs per channel, 3–5 channels.', b: 'The Shopify-led operator at $10k–$500k/mo GMV is our exact wedge. Feed rules, category suggester, aspects enrichment, per-channel P&L — all without a kickoff meeting.' },
]

const FAQ = [
  { q: 'What happens if I outgrow Palvento?',
    a: 'Our Enterprise tier (from $2,000/mo) serves sellers at $500k+/mo GMV with SSO, SLA, and data residency. If you scale past that — say into multi-region with 10+ channels and a 50+ person ops team — we will honestly tell you when Feedonomics or Rithum is the better fit. The handoff is easier than the migration in.' },
  { q: 'Can I export my feed data if I leave?',
    a: 'Yes. Every SKU, every mapping, every rule exports to CSV at any time. No data lock-in, no exit fee, no notice period beyond the standard monthly cancellation.' },
  { q: 'Do I need a developer to install Palvento?',
    a: 'No. Install from the Shopify App Store, authorize OAuth, and the first sync runs automatically. Most merchants are live on their first marketplace in under ten minutes.' },
  { q: 'Why is Feedonomics so much more expensive?',
    a: 'Feedonomics bundles a managed-services team into every deployment — a Solutions Architect, a dedicated account manager, and 30–90 day onboarding. That team is the product. If you want the team, the price is fair. If you want the software, Palvento is the product.' },
  { q: 'What about Shopify Marketplace Connect?',
    a: 'Free up to 50 marketplace orders/mo, then 1% of synced-order value capped at $99/mo — but only syncs to Amazon, eBay, Walmart, and Target Plus. No TikTok Shop, no Etsy, no OnBuy, thin feed-optimisation, no rules engine. Palvento sits one step above it on channel breadth, feed quality, and error handling.' },
]

export default function VsFeedonomicsPage() {
  return (
    <div className={display.variable} style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: 'var(--font-geist), -apple-system, sans-serif', WebkitFontSmoothing: 'antialiased' }}>

      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(243,240,234,0.86)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.ink }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.ink} />
              <rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt} />
            </svg>
            <span style={{ fontFamily: 'var(--font-display-vs), Georgia, serif', fontSize: 24, lineHeight: 1, letterSpacing: '-0.015em' }}>Palvento</span>
          </Link>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/pricing" style={{ fontSize: 13, color: C.mutedDk, textDecoration: 'none', padding: '8px 4px' }}>Pricing</Link>
            <Link href="/signup" style={{ fontSize: 13, color: C.bg, background: C.ink, padding: '10px 18px', textDecoration: 'none', fontWeight: 500 }}>Start free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '80px 32px 48px', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <span style={{ width: 24, height: 1, background: C.cobalt }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, letterSpacing: '0.02em', color: C.cobalt, fontWeight: 500 }}>Comparison · Palvento vs Feedonomics</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display-vs), Georgia, serif', fontSize: 'clamp(48px, 7vw, 104px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 0.98, color: C.ink, margin: 0 }}>
            Palvento vs <em style={{ fontStyle: 'italic', color: C.cobalt }}>Feedonomics.</em>
          </h1>
          <p style={{ marginTop: 32, fontSize: 22, lineHeight: 1.4, color: C.mutedDk, fontFamily: 'var(--font-display-vs), Georgia, serif', fontStyle: 'italic', maxWidth: 820 }}>
            Self-serve multichannel feed management for Shopify-led sellers — without the $2,500/mo enterprise floor or the 30-day kickoff.
          </p>
          <div style={{ marginTop: 36, display: 'flex', gap: 10 }}>
            <Link href="/signup" style={{ background: C.ink, color: C.bg, padding: '15px 24px', textDecoration: 'none', fontSize: 14, fontWeight: 500, letterSpacing: '0.01em', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Start free<span style={{ fontFamily: 'var(--font-mono), monospace' }}>→</span>
            </Link>
            <Link href="/enterprise" style={{ background: 'transparent', color: C.ink, padding: '15px 24px', textDecoration: 'none', fontSize: 14, fontWeight: 500, border: `1px solid ${C.ink}` }}>
              Talk to sales (&gt;$500k/mo)
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section style={{ padding: '96px 32px', background: C.surface, borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 40 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: C.cobalt, letterSpacing: '0.02em', fontWeight: 500 }}>Side by side</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted }}>§ 01 — {ROWS.length} rows</span>
          </div>
          <div style={{ border: `1px solid ${C.ink}`, background: C.surface }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1.4fr', borderBottom: `1.5px solid ${C.ink}`, background: C.bg }}>
              <div style={{ padding: '16px 20px', fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Feature</div>
              <div style={{ padding: '16px 20px', fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.02em', fontWeight: 600 }}>Palvento</div>
              <div style={{ padding: '16px 20px', fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.mutedDk, letterSpacing: '0.02em', fontWeight: 600 }}>Feedonomics</div>
            </div>
            {ROWS.map((r, i) => (
              <div key={r.feature} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1.4fr', borderBottom: i < ROWS.length - 1 ? `1px solid ${C.ruleSoft}` : 'none', background: r.highlight ? 'rgba(232,134,63,$1)' : C.surface }}>
                <div style={{ padding: '18px 20px', fontSize: 13, color: C.ink, fontWeight: r.highlight ? 600 : 500, borderRight: `1px solid ${C.ruleSoft}` }}>{r.feature}</div>
                <div style={{ padding: '18px 20px', fontSize: 13.5, color: C.ink, lineHeight: 1.45, borderRight: `1px solid ${C.ruleSoft}` }}>{r.palvento}</div>
                <div style={{ padding: '18px 20px', fontSize: 13.5, color: C.mutedDk, lineHeight: 1.45 }}>{r.feedonomics}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* When Feedonomics is right */}
      <section style={{ padding: '96px 32px', background: C.bg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 40 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: C.cobalt, letterSpacing: '0.02em', fontWeight: 500 }}>When Feedonomics is the right call</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted }}>§ 02</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display-vs), Georgia, serif', fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.05, color: C.ink, margin: '0 0 40px', maxWidth: 820 }}>
            Three scenarios where <em style={{ color: C.cobalt, fontStyle: 'italic' }}>we tell you to pick them.</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: `1px solid ${C.ink}`, borderLeft: `1px solid ${C.ink}` }}>
            {FEEDONOMICS_RIGHT.map((s, i) => (
              <article key={i} style={{ borderRight: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}`, padding: '32px 32px 28px', background: C.surface }}>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.18em', fontWeight: 600, marginBottom: 14 }}>§ 0{i + 1}</div>
                <h3 style={{ fontFamily: 'var(--font-display-vs), Georgia, serif', fontSize: 26, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.15, color: C.ink, margin: '0 0 14px' }}>{s.h}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: C.mutedDk, margin: 0 }}>{s.b}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* When Palvento is right */}
      <section style={{ padding: '96px 32px', background: C.ink, color: C.bg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 40 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: C.cobalt, letterSpacing: '0.02em', fontWeight: 500 }}>When Palvento is the right call</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(243,240,234,0.18)' }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: 'rgba(243,240,234,0.5)' }}>§ 03</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display-vs), Georgia, serif', fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.05, color: C.bg, margin: '0 0 40px', maxWidth: 820 }}>
            Three scenarios where <em style={{ color: '#7BB7FF', fontStyle: 'italic' }}>we are the sharper tool.</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: `1px solid rgba(243,240,234,0.18)`, borderLeft: `1px solid rgba(243,240,234,0.18)` }}>
            {MERIDIA_RIGHT.map((s, i) => (
              <article key={i} style={{ borderRight: `1px solid rgba(243,240,234,0.18)`, borderBottom: `1px solid rgba(243,240,234,0.18)`, padding: '32px 32px 28px', background: 'rgba(232,134,63,$1)' }}>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: 'rgba(243,240,234,0.5)', letterSpacing: '0.18em', fontWeight: 600, marginBottom: 14 }}>§ 0{i + 1}</div>
                <h3 style={{ fontFamily: 'var(--font-display-vs), Georgia, serif', fontSize: 26, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.15, color: C.bg, margin: '0 0 14px' }}>{s.h}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(243,240,234,0.75)', margin: 0 }}>{s.b}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '96px 32px', background: C.bg, borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 40 }}>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: C.cobalt, letterSpacing: '0.02em', fontWeight: 500 }}>Objections, answered</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted }}>§ 04 — {FAQ.length} Qs</span>
          </div>
          <div style={{ borderTop: `1px solid ${C.ink}` }}>
            {FAQ.map((f, i) => (
              <div key={i} style={{ padding: '28px 0', borderBottom: `1px solid ${C.rule}` }}>
                <h3 style={{ fontFamily: 'var(--font-display-vs), Georgia, serif', fontSize: 22, fontWeight: 400, letterSpacing: '-0.015em', color: C.ink, margin: '0 0 10px' }}>{f.q}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: C.mutedDk, margin: 0 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '96px 32px', background: C.surface, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display-vs), Georgia, serif', fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.0, color: C.ink, margin: '0 0 28px', maxWidth: 880, marginLeft: 'auto', marginRight: 'auto' }}>
          Install from the App Store. <em style={{ color: C.cobalt, fontStyle: 'italic' }}>Live in ten minutes.</em>
        </h2>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/signup" style={{ background: C.ink, color: C.bg, padding: '17px 32px', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Start free</Link>
          <Link href="/enterprise" style={{ background: 'transparent', color: C.ink, padding: '17px 32px', textDecoration: 'none', fontSize: 14, fontWeight: 500, border: `1px solid ${C.ink}` }}>Talk to sales</Link>
        </div>
        <div style={{ marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 14, fontFamily: 'var(--font-mono), monospace', fontSize: 11.5, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          <span>No card required</span>
          <span style={{ color: C.rule }}>·</span>
          <span>Cancel any time</span>
          <span style={{ color: C.rule }}>·</span>
          <span>Enterprise from $2,000/mo</span>
        </div>
      </section>

      <footer style={{ padding: '32px', background: C.bg, borderTop: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted }}>
          <span>&copy; MMXXVI &middot; Palvento</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/pricing" style={{ color: C.muted, textDecoration: 'none' }}>Pricing</Link>
            <Link href="/vs/linnworks" style={{ color: C.muted, textDecoration: 'none' }}>vs Linnworks</Link>
            <Link href="/enterprise" style={{ color: C.muted, textDecoration: 'none' }}>Enterprise</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
