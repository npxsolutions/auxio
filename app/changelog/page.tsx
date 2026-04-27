'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Palvento — Changelog
// Production page. v8 palette. Filter by type. Email subscribe via API.
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'
import { useMemo, useState } from 'react'

const display = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], display: 'swap' })

const C = {
  bg: '#f8f4ec', surface: '#ffffff', raised: '#fdfaf2',
  ink: '#0b0f1a', inkSoft: '#1c2233',
  rule: 'rgba(11,15,26,0.10)', ruleSoft: 'rgba(11,15,26,0.06)',
  muted: '#5a6171', cobalt: '#e8863f',
  emerald: '#0e7c5a', oxblood: '#7d2a1a',
}

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Developers',   href: '/developers' },
  { label: 'Changelog',    href: '/changelog' },
]

type Tag = 'feature' | 'improvement' | 'fix' | 'breaking' | 'api'
const TAGS: Record<Tag, { label: string; color: string; bg: string }> = {
  feature:     { label: 'Feature',     color: '#e8863f', bg: 'rgba(232,134,63,0.10)' },
  improvement: { label: 'Improvement', color: '#0e7c5a', bg: 'rgba(14,124,90,0.10)' },
  fix:         { label: 'Fix',         color: '#7d2a1a', bg: 'rgba(125,42,26,0.10)' },
  breaking:    { label: 'Breaking',    color: '#a56a0b', bg: 'rgba(165,106,11,0.12)' },
  api:         { label: 'API',         color: '#6b2db5', bg: 'rgba(107,45,181,0.10)' },
}

type Entry = { date: string; version: string; tag: Tag; title: string; body: string }

const ENTRIES: Entry[] = [
  {
    date: '2026-04-12', version: 'v2.18.0', tag: 'feature',
    title: 'Distribution scaffolding — five new public pages',
    body: 'New /partners, /affiliates, /developers, /status, and /changelog pages, with end-to-end application flows and an email subscribe for changelog updates. Cross-linked from a unified Resources footer.',
  },
  {
    date: '2026-04-10', version: 'v2.17.4', tag: 'improvement',
    title: 'True profit v2 — sales tax and VAT on every SKU',
    body: 'Profit now includes per-region VAT, GST, and US sales tax, pulled from the channel where the order landed. OSS and IOSS handled automatically for EU sellers; backfilled across the last 24 months.',
  },
  {
    date: '2026-04-08', version: 'v2.17.0', tag: 'api',
    title: 'API v1.4 — profit breakdown endpoint and webhook idempotency',
    body: 'Added GET /v1/profit/breakdown for SKU-by-fee decomposition. Webhook deliveries now include `delivery_id` for safe consumer-side deduplication. See /developers for migration notes.',
  },
  {
    date: '2026-04-05', version: 'v2.16.2', tag: 'feature',
    title: 'Pricing page — currency toggle (GBP / USD / EUR)',
    body: 'Toggle between GBP, USD, and EUR on /pricing. Currency choice persists in localStorage and propagates to checkout.',
  },
  {
    date: '2026-04-02', version: 'v2.16.0', tag: 'feature',
    title: 'Landing v8 — global commerce, told properly',
    body: 'New marketing homepage at /landing/v8. Live trade map, per-channel arcs, and copy rewritten for clarity over volume. The variant our internal scoring put highest by a clear margin.',
  },
  {
    date: '2026-03-28', version: 'v2.15.3', tag: 'improvement',
    title: 'Faster inventory sync across Amazon marketplaces',
    body: 'Multi-region Amazon accounts now sync in parallel instead of sequentially. Median sync time down from 7m to 1m40s for sellers across five marketplaces.',
  },
  {
    date: '2026-03-25', version: 'v2.15.0', tag: 'feature',
    title: 'SaaS-readiness audit shipped — 47 issues triaged, 31 closed',
    body: 'Internal audit covering accessibility, performance, observability, billing edge cases, and compliance gaps. Top fixes ship over the next two cycles; tracker is open at /docs/SAAS_READINESS_AUDIT.md.',
  },
  {
    date: '2026-03-20', version: 'v2.14.0', tag: 'feature',
    title: 'AI listing agent — channel-specific copy',
    body: 'Generate listing titles and descriptions tuned to the tone, length, and keyword patterns of each channel. Amazon, eBay, Etsy, and Shopify supported at launch; TikTok Shop and Walmart land next sprint.',
  },
  {
    date: '2026-03-12', version: 'v2.13.7', tag: 'fix',
    title: 'Duplicate order events when Shopify bulk-fulfills',
    body: 'Shopify occasionally emitted the same `orders/fulfilled` webhook twice during bulk operations. Deduplication now happens on ingest. No duplicate downstream events; backfill not required.',
  },
  {
    date: '2026-03-04', version: 'v2.13.0', tag: 'breaking',
    title: 'Webhook signature header renamed',
    body: 'Header `X-Palvento-Signature-V1` replaces `X-Palvento-Signature`. The old header continues to send for 90 days alongside the new one. Update your verifier before 2026-06-04.',
  },
  {
    date: '2026-02-26', version: 'v2.12.4', tag: 'improvement',
    title: 'Repricer — quieter rules, louder logs',
    body: 'Repricing rule history now records every price tick with the rule that fired and the competitor snapshot at the time. Helps you debug aggressive rules without re-creating market conditions.',
  },
  {
    date: '2026-02-14', version: 'v2.12.0', tag: 'api',
    title: 'API v1.2 — new scopes and cursor pagination',
    body: 'Adds `analytics:read` and `inventory:write` scopes. /listings and /orders accept cursor pagination via `?after=<id>`. Old offset pagination is supported for 12 months.',
  },
]

type Filter = 'all' | Tag

export default function ChangelogPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const filtered = useMemo(() => filter === 'all' ? ENTRIES : ENTRIES.filter(e => e.tag === filter), [filter])

  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Nav />

      <header style={{ maxWidth: 920, margin: '0 auto', padding: '120px 32px 48px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>Changelog</div>
        <h1 className={display.className} style={{ fontSize: 'clamp(44px, 6vw, 72px)', lineHeight: 1.03, letterSpacing: '-0.02em', fontWeight: 400, margin: '20px 0 0' }}>
          What shipped, <em style={{ fontStyle: 'italic', color: C.cobalt }}>when</em>, and why.
        </h1>
        <p style={{ fontSize: 16, color: C.muted, marginTop: 16, maxWidth: 580, lineHeight: 1.6 }}>
          We publish every meaningful change. No marketing copy — just the thing that changed, the reason it changed, and who it helps.
        </p>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/rss/changelog.xml" style={btnGhost}>RSS</a>
          <a href="#subscribe" style={btnPrimary}>Email me updates</a>
        </div>
      </header>

      <section style={{ maxWidth: 920, margin: '0 auto', padding: '8px 32px 32px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: `1px solid ${C.ruleSoft}`, paddingBottom: 16 }}>
          <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
          {(Object.keys(TAGS) as Tag[]).map(t => (
            <FilterChip key={t} label={TAGS[t].label} active={filter === t} onClick={() => setFilter(t)} color={TAGS[t].color} />
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: C.muted, alignSelf: 'center' }}>
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </section>

      <section style={{ maxWidth: 920, margin: '0 auto', padding: '0 32px 80px' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {filtered.map(e => {
            const tag = TAGS[e.tag]
            return (
              <li key={e.title} style={{ borderTop: `1px solid ${C.ruleSoft}`, padding: '36px 0' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                  <time style={{ fontSize: 12, color: C.muted, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{e.date}</time>
                  <span style={{ fontSize: 12, color: C.muted, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>·</span>
                  <span style={{ fontSize: 12, color: C.inkSoft, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{e.version}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: tag.color, background: tag.bg, padding: '4px 10px', borderRadius: 999 }}>{tag.label}</span>
                </div>
                <h2 className={display.className} style={{ fontSize: 30, letterSpacing: '-0.015em', fontWeight: 400, margin: 0, lineHeight: 1.15 }}>{e.title}</h2>
                <p style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.7, marginTop: 12, maxWidth: 680 }}>{e.body}</p>
                <a href="#" style={{ display: 'inline-block', marginTop: 14, fontSize: 13, color: C.cobalt, textDecoration: 'none' }}>Read more →</a>
              </li>
            )
          })}
        </ul>
      </section>

      <Subscribe />

      <ResourcesFooter />
    </div>
  )
}

function FilterChip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} style={{ fontSize: 13, fontWeight: 500, padding: '6px 14px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${active ? C.ink : C.rule}`, background: active ? C.ink : 'transparent', color: active ? C.bg : (color ?? C.inkSoft), fontFamily: 'inherit' }}>
      {label}
    </button>
  )
}

function Subscribe() {
  const [state, setState] = useState<'idle' | 'submitting' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('submitting')
    setMessage('')
    const form = new FormData(e.currentTarget)
    const email = form.get('email')
    try {
      const res = await fetch('/api/changelog/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setState('error')
        setMessage(data?.error ?? 'Could not subscribe.')
        return
      }
      setState('ok')
      setMessage(data?.message ?? 'Subscribed.')
      ;(e.target as HTMLFormElement).reset()
    } catch {
      setState('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <section id="subscribe" style={{ maxWidth: 920, margin: '0 auto', padding: '0 32px 96px' }}>
      <div style={{ background: C.ink, color: C.bg, borderRadius: 18, padding: '40px 36px' }}>
        <div className={display.className} style={{ fontSize: 32, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Subscribe to updates.</div>
        <p style={{ fontSize: 14, color: 'rgba(243,240,234,0.7)', lineHeight: 1.6, marginTop: 10, maxWidth: 540 }}>
          One email on ship days. No newsletters, no &ldquo;here&rsquo;s what we&rsquo;ve been thinking about,&rdquo; no recap roundups.
        </p>
        <form onSubmit={onSubmit} style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="email"
            name="email"
            required
            placeholder="you@company.com"
            style={{ flex: '1 1 260px', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(243,240,234,0.18)', background: 'rgba(243,240,234,0.06)', color: C.bg, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
          />
          <button type="submit" disabled={state === 'submitting'} style={{ ...btnPrimary, background: C.bg, color: C.ink, opacity: state === 'submitting' ? 0.7 : 1, cursor: state === 'submitting' ? 'progress' : 'pointer', border: 'none' }}>
            {state === 'submitting' ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
        {message && (
          <div style={{ marginTop: 12, fontSize: 13, color: state === 'ok' ? '#66d8a8' : state === 'error' ? '#f08c7c' : 'rgba(243,240,234,0.7)' }}>{message}</div>
        )}
      </div>
    </section>
  )
}

function Nav() {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(243,240,234,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ fontSize: 16, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>Palvento</Link>
      <div style={{ display: 'flex', gap: 28 }}>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} style={{ fontSize: 14, color: n.label === 'Changelog' ? C.ink : C.inkSoft, textDecoration: 'none', fontWeight: n.label === 'Changelog' ? 500 : 400 }}>{n.label}</Link>
        ))}
      </div>
      <Link href="/signup" style={{ ...btnPrimary, padding: '8px 16px', fontSize: 13 }}>Start free</Link>
    </nav>
  )
}

function ResourcesFooter() {
  const cols = [
    { title: 'Product', links: [['Features','/features'], ['Integrations','/integrations'], ['Pricing','/pricing'], ['Changelog','/changelog']] },
    { title: 'Build',   links: [['Developers','/developers'], ['API reference','/developers/reference'], ['Status','/status']] },
    { title: 'Resources', links: [['Partners','/partners'], ['Affiliates','/affiliates'], ['Developers','/developers'], ['Status','/status'], ['Changelog','/changelog'], ['Directories','/directories'], ['Community','/community']] },
    { title: 'Company', links: [['About','/about'], ['Contact','/contact'], ['Privacy','/privacy'], ['Terms','/terms']] },
  ] as const
  return (
    <footer style={{ borderTop: `1px solid ${C.rule}`, background: C.bg }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32 }}>
        <div>
          <Link href="/" style={{ fontSize: 18, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>Palvento</Link>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginTop: 12, maxWidth: 240 }}>The operating layer for multichannel commerce.</p>
        </div>
        {cols.map(col => (
          <div key={col.title}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 16 }}>{col.title}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
              {col.links.map(([label, href]) => (
                <li key={label}><Link href={href} style={{ fontSize: 14, color: C.inkSoft, textDecoration: 'none' }}>{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${C.ruleSoft}`, padding: '20px 32px', maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 12, color: C.muted }}>© {new Date().getFullYear()} Palvento. All rights reserved.</div>
        <div style={{ fontSize: 12, color: C.muted }}>Built for operators.</div>
      </div>
    </footer>
  )
}

const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: C.ink, color: C.bg, fontSize: 14, fontWeight: 500, textDecoration: 'none' }
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: 'transparent', color: C.ink, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: `1px solid ${C.rule}` }
