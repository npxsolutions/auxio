'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Fulcra — Developers
// Production page. v8 palette + Instrument Serif display + Geist body + mono.
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'
import { useState } from 'react'

const display = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], display: 'swap' })

const C = {
  bg: '#f3f0ea', surface: '#ffffff', raised: '#ebe6dc',
  ink: '#0b0f1a', inkSoft: '#1c2233',
  rule: 'rgba(11,15,26,0.10)', ruleSoft: 'rgba(11,15,26,0.06)',
  muted: '#5a6171', cobalt: '#1d5fdb',
  emerald: '#0e7c5a',
}

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Developers',   href: '/developers' },
  { label: 'Changelog',    href: '/changelog' },
]

const HIGHLIGHTS = [
  { title: 'Versioned, stable',     desc: 'v1 is locked. Breaking changes get a new major. Old majors keep working for at least 12 months after deprecation.' },
  { title: '15+ marketplaces, one API', desc: 'Amazon, eBay, Shopify, Etsy, TikTok Shop, Walmart, OnBuy, BigCommerce, WooCommerce, and the rest — normalised to one schema.' },
  { title: 'Webhooks that arrive',  desc: 'Signed with HMAC-SHA256, retried with exponential back-off for 24 hours, replay endpoint included.' },
  { title: 'Honest rate limits',    desc: '1,000 requests per hour by default. Burst to 60/minute. Bumpable on request, no contract negotiation.' },
]

const QUICKSTARTS: { title: string; blurb: string; lang: string; code: string }[] = [
  {
    title: '01 · Authenticate',
    blurb: 'Bearer tokens, scoped per integration. Generate keys in the developer dashboard.',
    lang: 'bash',
    code: `curl https://api.auxio.io/v1 \\
  -H "Authorization: Bearer sk_live_a3f2..." \\
  -H "Accept: application/json"`,
  },
  {
    title: '02 · List products',
    blurb: 'Unified listings across every connected channel. Filter by SKU, channel, or status.',
    lang: 'bash',
    code: `curl "https://api.auxio.io/v1/listings?channel=amazon_uk&status=live" \\
  -H "Authorization: Bearer sk_live_a3f2..."`,
  },
  {
    title: '03 · Manage orders',
    blurb: 'Pull orders from any channel; mark fulfilled; trigger refunds; attach tracking.',
    lang: 'bash',
    code: `curl -X POST https://api.auxio.io/v1/orders/ord_8821/fulfill \\
  -H "Authorization: Bearer sk_live_a3f2..." \\
  -H "Content-Type: application/json" \\
  -d '{ "carrier": "royal_mail", "tracking": "AB123456789GB" }'`,
  },
  {
    title: '04 · Receive webhooks',
    blurb: 'Subscribe once, receive every event. Verify signatures, replay any missed delivery.',
    lang: 'bash',
    code: `curl -X POST https://api.auxio.io/v1/webhooks \\
  -H "Authorization: Bearer sk_live_a3f2..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yourapp.com/hooks/auxio",
    "events": ["order.created", "inventory.low_stock"]
  }'`,
  },
]

const ENDPOINTS = [
  { method: 'GET',  path: '/v1/channels',         desc: 'Connected sales channels and their sync status.' },
  { method: 'GET',  path: '/v1/listings',         desc: 'Listings across every channel. Filter by channel, SKU, or status.' },
  { method: 'POST', path: '/v1/listings',         desc: 'Create a listing draft. Push to one or many channels.' },
  { method: 'GET',  path: '/v1/orders',           desc: 'Unified order feed across all channels.' },
  { method: 'POST', path: '/v1/orders/:id/fulfill', desc: 'Mark fulfilled. Pushes tracking back to the channel.' },
  { method: 'GET',  path: '/v1/inventory',        desc: 'Live stock levels across warehouses and channels.' },
  { method: 'GET',  path: '/v1/profit',           desc: 'True profit per SKU, channel, period — fees, shipping, VAT included.' },
  { method: 'POST', path: '/v1/webhooks',         desc: 'Subscribe an endpoint to one or many events.' },
]

const EVENTS = [
  'listing.published', 'listing.updated', 'listing.error',
  'order.created', 'order.fulfilled', 'order.cancelled',
  'inventory.low_stock', 'inventory.out_of_stock',
  'price.changed', 'sync.completed', 'sync.failed',
]

const SDKS = [
  { name: 'Node.js / TypeScript', status: 'beta',  install: 'npm i @auxio/node' },
  { name: 'Python',               status: 'soon',  install: 'pip install auxio (Q3)' },
  { name: 'Ruby',                 status: 'soon',  install: 'gem install auxio (Q4)' },
  { name: 'Go',                   status: 'soon',  install: 'On the roadmap.' },
]

const VERSIONS = [
  { v: 'v1.4', date: '2026-04-08', notes: 'Added /v1/profit/breakdown. Webhooks now include `delivery_id` for idempotency.' },
  { v: 'v1.3', date: '2026-03-22', notes: 'TikTok Shop UK + US listing endpoints. Order partial-fulfillment supported.' },
  { v: 'v1.2', date: '2026-02-14', notes: 'New scopes (`analytics:read`, `inventory:write`). Old scopes accepted until 2026-08-14.' },
  { v: 'v1.1', date: '2026-01-09', notes: 'Walmart marketplace endpoints reach GA. Cursor pagination on /listings and /orders.' },
  { v: 'v1.0', date: '2025-11-04', notes: 'First stable release. v1 contract guaranteed for 12 months past deprecation.' },
]

export default function DevelopersPage() {
  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Nav />

      <header style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '120px 32px 64px', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>Developers</div>
          <h1 className={display.className} style={{ fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 1.02, letterSpacing: '-0.02em', fontWeight: 400, margin: '20px 0 0' }}>
            Build on <em style={{ fontStyle: 'italic', color: C.cobalt }}>Fulcra</em>.<br />
            One API. Every channel.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: C.muted, maxWidth: 640, marginTop: 24 }}>
            Pull unified orders, listings, inventory, and true-profit data from Amazon, eBay, Shopify, TikTok Shop, Etsy, Walmart, OnBuy, BigCommerce, and WooCommerce — through one REST API and a webhook firehose.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
            <Link href="/developer" style={btnPrimary}>Get an API key</Link>
            <Link href="/developers/reference" style={btnGhost}>Read the reference</Link>
          </div>
        </div>
        <BackdropGrid />
      </header>

      <section style={section}>
        <SectionHead kicker="Highlights" title="A platform you can plan around." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginTop: 40 }}>
          {HIGHLIGHTS.map(h => (
            <div key={h.title} style={card}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{h.title}</div>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 8 }}>{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={section}>
        <SectionHead kicker="Quickstart" title="Production-ready in under an hour." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, marginTop: 40 }}>
          {QUICKSTARTS.map(q => <CodeCard key={q.title} q={q} />)}
        </div>
      </section>

      <section style={section} id="reference">
        <SectionHead kicker="Reference" title="Core endpoints." />
        <div style={{ marginTop: 32, border: `1px solid ${C.ruleSoft}`, borderRadius: 14, overflow: 'hidden', background: C.surface }}>
          {ENDPOINTS.map((e, i) => (
            <div key={e.method + e.path} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 20, padding: '18px 24px', alignItems: 'baseline', borderTop: i === 0 ? 'none' : `1px solid ${C.ruleSoft}` }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: e.method === 'GET' ? C.cobalt : C.emerald }}>{e.method}</span>
              <div>
                <code style={{ fontSize: 14, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{e.path}</code>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: '4px 0 0' }}>{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 20 }}>
          Full reference with request/response schemas at <Link href="/developers/reference" style={{ color: C.cobalt }}>/developers/reference</Link>.
        </p>
      </section>

      <section style={section}>
        <SectionHead kicker="Webhooks" title="Subscribe to every event that matters." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, marginTop: 32 }}>
          {EVENTS.map(ev => (
            <code key={ev} style={{ background: C.raised, padding: '10px 14px', display: 'block', fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 13, color: C.inkSoft, borderRadius: 8 }}>{ev}</code>
          ))}
        </div>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 24, lineHeight: 1.6, maxWidth: 720 }}>
          Each delivery is signed with HMAC-SHA256. Failed deliveries retry with exponential back-off for 24 hours; the dashboard shows every attempt with status, latency, and response body.
        </p>
      </section>

      <section style={section}>
        <SectionHead kicker="SDKs" title="Use the language you already write." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginTop: 40 }}>
          {SDKS.map(s => (
            <div key={s.name} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{s.name}</div>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.status === 'beta' ? C.cobalt : C.muted, padding: '3px 8px', border: `1px solid ${C.rule}`, borderRadius: 999 }}>
                  {s.status === 'beta' ? 'Beta' : 'Coming soon'}
                </span>
              </div>
              <code style={{ display: 'block', marginTop: 12, fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 12, color: C.inkSoft, background: C.bg, padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.ruleSoft}` }}>{s.install}</code>
            </div>
          ))}
        </div>
      </section>

      <section style={section}>
        <SectionHead kicker="API changelog" title="What changed, and when." />
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 32, borderTop: `1px solid ${C.ruleSoft}` }}>
          {VERSIONS.map(v => (
            <li key={v.v} style={{ borderBottom: `1px solid ${C.ruleSoft}`, padding: '20px 0', display: 'grid', gridTemplateColumns: '120px 1fr', gap: 20, alignItems: 'baseline' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{v.v}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{v.date}</div>
              </div>
              <p style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.65, margin: 0 }}>{v.notes}</p>
            </li>
          ))}
        </ul>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 20 }}>
          See the <Link href="/changelog" style={{ color: C.cobalt }}>full product changelog</Link> for everything else that shipped.
        </p>
      </section>

      <section style={{ ...section, marginBottom: 80 }}>
        <div style={{ background: C.ink, color: C.bg, borderRadius: 18, padding: '64px 48px' }}>
          <div className={display.className} style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>Build on Fulcra.</div>
          <p style={{ fontSize: 16, color: 'rgba(243,240,234,0.7)', maxWidth: 560, marginTop: 16, lineHeight: 1.6 }}>
            Early builders get white-glove support, a direct line to the platform team, and listing placement in the integrations gallery on day one.
          </p>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/developer" style={{ ...btnPrimary, background: C.bg, color: C.ink }}>Get an API key</Link>
            <a href="mailto:developers@auxio.io" style={{ ...btnGhost, color: C.bg, borderColor: 'rgba(243,240,234,0.25)' }}>Email the platform team</a>
          </div>
        </div>
      </section>

      <ResourcesFooter />
    </div>
  )
}

// ── Code card with copy button ──
function CodeCard({ q }: { q: { title: string; blurb: string; lang: string; code: string } }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(q.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {/* ignore */}
  }
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px 0' }}>
        <div className={display.className} style={{ fontSize: 22, letterSpacing: '-0.01em' }}>{q.title}</div>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginTop: 6 }}>{q.blurb}</p>
      </div>
      <div style={{ position: 'relative', margin: '16px 0 0' }}>
        <button onClick={copy} aria-label="Copy snippet" style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: copied ? C.emerald : 'rgba(228,233,242,0.7)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <pre style={{ margin: 0, background: C.ink, color: '#e4e9f2', padding: '20px 24px', fontSize: 12.5, lineHeight: 1.65, fontFamily: "'Geist Mono', ui-monospace, monospace", overflowX: 'auto' }}>{q.code}</pre>
      </div>
    </div>
  )
}

function BackdropGrid() {
  // SVG craft: 1.5px strokes; ink + cobalt only; ring nodes; no fills.
  return (
    <svg aria-hidden viewBox="0 0 1200 600" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4, pointerEvents: 'none' }}>
      <defs>
        <pattern id="dev-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={C.ink} strokeWidth="1" opacity="0.06" />
        </pattern>
      </defs>
      <rect x="600" y="0" width="600" height="600" fill="url(#dev-grid)" />
      <g stroke={C.cobalt} strokeWidth="1.5" fill="none" opacity="0.7">
        <circle cx="980" cy="180" r="3" fill={C.bg} />
        <circle cx="1080" cy="260" r="3" fill={C.bg} />
        <circle cx="900" cy="340" r="3" fill={C.bg} />
        <line x1="980" y1="180" x2="1080" y2="260" />
        <line x1="1080" y1="260" x2="900" y2="340" />
      </g>
    </svg>
  )
}

function Nav() {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(243,240,234,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ fontSize: 16, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>Fulcra</Link>
      <div style={{ display: 'flex', gap: 28 }}>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} style={{ fontSize: 14, color: n.label === 'Developers' ? C.ink : C.inkSoft, textDecoration: 'none', fontWeight: n.label === 'Developers' ? 500 : 400 }}>{n.label}</Link>
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
          <Link href="/" style={{ fontSize: 18, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>Fulcra</Link>
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
        <div style={{ fontSize: 12, color: C.muted }}>© {new Date().getFullYear()} Fulcra. All rights reserved.</div>
        <div style={{ fontSize: 12, color: C.muted }}>Built for operators.</div>
      </div>
    </footer>
  )
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>{kicker}</div>
      <h2 className={display.className} style={{ fontSize: 'clamp(34px, 4vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 400, margin: '12px 0 0' }}>{title}</h2>
    </>
  )
}

const section: React.CSSProperties = { maxWidth: 1040, margin: '0 auto', padding: '64px 32px' }
const card: React.CSSProperties = { background: C.surface, border: `1px solid ${C.ruleSoft}`, borderRadius: 14, padding: 24 }
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: C.ink, color: C.bg, fontSize: 14, fontWeight: 500, textDecoration: 'none' }
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: 'transparent', color: C.ink, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: `1px solid ${C.rule}` }
