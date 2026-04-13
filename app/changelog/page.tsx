'use client'

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'

const display = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], display: 'swap' })

const C = {
  bg: '#f3f0ea', surface: '#ffffff', raised: '#ebe6dc',
  ink: '#0b0f1a', inkSoft: '#1c2233',
  rule: 'rgba(11,15,26,0.10)', ruleSoft: 'rgba(11,15,26,0.06)',
  muted: '#5a6171', cobalt: '#1d5fdb',
}

const NAV = [
  { label: 'Features', href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Developers', href: '/developers' },
  { label: 'Changelog', href: '/changelog' },
]

type Tag = 'new' | 'improved' | 'fixed' | 'integration'
const TAGS: Record<Tag, { label: string; color: string; bg: string }> = {
  new:         { label: 'New',         color: '#1d5fdb', bg: 'rgba(29,95,219,0.10)' },
  improved:    { label: 'Improved',    color: '#0e7c5a', bg: 'rgba(14,124,90,0.10)' },
  fixed:       { label: 'Fixed',       color: '#7d2a1a', bg: 'rgba(125,42,26,0.10)' },
  integration: { label: 'Integration', color: '#6b2db5', bg: 'rgba(107,45,181,0.10)' },
}

type Entry = { date: string; title: string; tag: Tag; body: string }

const ENTRIES: Entry[] = [
  {
    date: '2026-04-10',
    title: 'True profit v2 — sales-tax and VAT on every SKU',
    tag: 'improved',
    body: 'Profit calculations now include per-region VAT, GST, and US sales tax, pulled from the channel where the order landed. OSS and IOSS handled automatically for EU sellers.',
  },
  {
    date: '2026-04-04',
    title: 'TikTok Shop — UK and US regions',
    tag: 'integration',
    body: 'Inventory sync, order ingestion, and listing uploads for TikTok Shop UK and US. EU regions land next.',
  },
  {
    date: '2026-03-28',
    title: 'Faster inventory sync across Amazon marketplaces',
    tag: 'improved',
    body: 'Multi-region Amazon accounts now sync in parallel instead of sequentially. Median sync time down from 7m to 1m40s for sellers across five marketplaces.',
  },
  {
    date: '2026-03-20',
    title: 'AI listing agent — channel-specific copy',
    tag: 'new',
    body: 'Generate listing titles and descriptions tuned to the tone, length, and keyword patterns of each channel. Amazon, eBay, Etsy, Shopify supported at launch.',
  },
  {
    date: '2026-03-12',
    title: 'Fixed: duplicate order events when Shopify bulk-fulfills',
    tag: 'fixed',
    body: 'Shopify bulk fulfillment occasionally emitted the same webhook twice. Deduplication now happens on the ingest side.',
  },
]

export default function ChangelogPage() {
  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Nav />

      <header style={{ maxWidth: 920, margin: '0 auto', padding: '120px 32px 48px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>Changelog</div>
        <h1 className={display.className} style={{ fontSize: 'clamp(44px, 6vw, 72px)', lineHeight: 1.03, letterSpacing: '-0.02em', fontWeight: 400, margin: '20px 0 0' }}>
          What shipped, <em style={{ fontStyle: 'italic', color: C.cobalt }}>when</em>, and why.
        </h1>
        <p style={{ fontSize: 16, color: C.muted, marginTop: 16, maxWidth: 560 }}>
          We publish every meaningful change. No marketing copy — just the thing that changed, the reason it changed, and who it helps.
        </p>
        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <a href="/rss/changelog.xml" style={btnGhost}>RSS</a>
          <a href="mailto:changelog@auxio.io?subject=Subscribe" style={btnPrimary}>Email me updates</a>
        </div>
      </header>

      <section style={{ maxWidth: 920, margin: '0 auto', padding: '16px 32px 120px' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {ENTRIES.map(e => {
            const tag = TAGS[e.tag]
            return (
              <li key={e.title} style={{ borderTop: `1px solid ${C.ruleSoft}`, padding: '40px 0' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                  <time style={{ fontSize: 13, color: C.muted, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{e.date}</time>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: tag.color, background: tag.bg, padding: '4px 10px', borderRadius: 999 }}>{tag.label}</span>
                </div>
                <h2 className={display.className} style={{ fontSize: 30, letterSpacing: '-0.015em', fontWeight: 400, margin: 0, lineHeight: 1.15 }}>{e.title}</h2>
                <p style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.65, marginTop: 12, maxWidth: 640 }}>{e.body}</p>
              </li>
            )
          })}
        </ul>
      </section>

      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(243,240,234,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ fontSize: 16, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>Auxio</Link>
      <div style={{ display: 'flex', gap: 28 }}>
        {NAV.map(n => <Link key={n.href} href={n.href} style={{ fontSize: 14, color: C.inkSoft, textDecoration: 'none' }}>{n.label}</Link>)}
      </div>
      <Link href="/signup" style={{ ...btnPrimary, padding: '8px 16px', fontSize: 13 }}>Start free</Link>
    </nav>
  )
}

function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.rule}`, padding: '40px 32px', fontSize: 13, color: C.muted, display: 'flex', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap', gap: 16 }}>
      <div>© {new Date().getFullYear()} Auxio</div>
      <div style={{ display: 'flex', gap: 20 }}>
        <Link href="/privacy" style={{ color: C.muted, textDecoration: 'none' }}>Privacy</Link>
        <Link href="/terms" style={{ color: C.muted, textDecoration: 'none' }}>Terms</Link>
        <Link href="/status" style={{ color: C.muted, textDecoration: 'none' }}>Status</Link>
        <Link href="/changelog" style={{ color: C.muted, textDecoration: 'none' }}>Changelog</Link>
      </div>
    </footer>
  )
}

const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: C.ink, color: C.bg, fontSize: 14, fontWeight: 500, textDecoration: 'none' }
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: 'transparent', color: C.ink, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: `1px solid ${C.rule}` }
