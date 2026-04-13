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

const ENDPOINTS = [
  { method: 'GET',  path: '/v1/channels',  desc: 'List connected sales channels and their sync status.' },
  { method: 'GET',  path: '/v1/listings',  desc: 'Query listings across every channel, filter by channel, SKU or status.' },
  { method: 'GET',  path: '/v1/orders',    desc: 'Unified order feed across Amazon, eBay, Shopify, TikTok, and the rest.' },
  { method: 'GET',  path: '/v1/profit',    desc: 'True profit per SKU, channel, and period — fees, shipping, VAT accounted for.' },
]

const EVENTS = [
  'listing.published', 'listing.updated', 'listing.error',
  'order.created', 'order.fulfilled',
  'inventory.low_stock', 'inventory.out_of_stock',
  'price.changed', 'sync.completed', 'sync.failed',
]

const SAMPLE = `curl https://api.auxio.io/v1/orders \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Accept: application/json"`

export default function DevelopersPage() {
  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Nav />

      <header style={{ maxWidth: 1040, margin: '0 auto', padding: '120px 32px 64px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>Developers</div>
        <h1 className={display.className} style={{ fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 1.02, letterSpacing: '-0.02em', fontWeight: 400, margin: '20px 0 0' }}>
          One API across <em style={{ fontStyle: 'italic', color: C.cobalt }}>every channel</em> you sell on.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: C.muted, maxWidth: 620, marginTop: 24 }}>
          Pull unified orders, listings, inventory, and true-profit data from Amazon, eBay, Shopify, TikTok, Etsy, Walmart, OnBuy, BigCommerce, and WooCommerce — through a single REST API and a webhook firehose.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <Link href="/developer" style={btnPrimary}>Get an API key</Link>
          <a href="#reference" style={btnGhost}>Read the reference</a>
        </div>
      </header>

      <section style={section}>
        <SectionHead kicker="Quickstart" title="Authenticated in 60 seconds." />
        <pre style={{ background: C.ink, color: '#e4e9f2', padding: 24, borderRadius: 14, fontSize: 13, lineHeight: 1.65, fontFamily: "'Geist Mono', ui-monospace, monospace", overflowX: 'auto', marginTop: 32 }}>
{SAMPLE}
        </pre>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 16 }}>
          Keys are issued from <Link href="/developer" style={{ color: C.cobalt }}>your dashboard</Link>. Scopes:
          {' '}<code style={codeInline}>read</code>, <code style={codeInline}>write</code>, <code style={codeInline}>listings</code>, <code style={codeInline}>orders</code>, <code style={codeInline}>inventory</code>, <code style={codeInline}>analytics</code>.
        </p>
      </section>

      <section id="reference" style={section}>
        <SectionHead kicker="Reference" title="Core endpoints." />
        <div style={{ marginTop: 32, borderTop: `1px solid ${C.ruleSoft}` }}>
          {ENDPOINTS.map(e => (
            <div key={e.path} style={{ borderBottom: `1px solid ${C.ruleSoft}`, padding: '20px 0', display: 'grid', gridTemplateColumns: '80px 1fr', gap: 20, alignItems: 'baseline' }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: C.cobalt }}>{e.method}</span>
              <div>
                <code style={{ fontSize: 15, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{e.path}</code>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, margin: '6px 0 0' }}>{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 20 }}>
          Full reference with request/response schemas is in progress. Want early access? <a href="mailto:developers@auxio.io" style={{ color: C.cobalt }}>Drop us a line.</a>
        </p>
      </section>

      <section style={section}>
        <SectionHead kicker="Webhooks" title="Subscribe to every event that matters." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, marginTop: 32 }}>
          {EVENTS.map(ev => (
            <code key={ev} style={{ ...codeInline, padding: '10px 14px', display: 'block', background: C.raised }}>{ev}</code>
          ))}
        </div>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 24, lineHeight: 1.6 }}>
          Webhooks are signed with HMAC-SHA256 and retried with exponential back-off for 24 hours. Configure endpoints and select events from your <Link href="/developer" style={{ color: C.cobalt }}>developer dashboard</Link>.
        </p>
      </section>

      <section style={{ ...section, marginBottom: 120 }}>
        <div style={{ background: C.ink, color: C.bg, borderRadius: 18, padding: '56px 48px' }}>
          <div className={display.className} style={{ fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.02em' }}>Build on Auxio.</div>
          <p style={{ fontSize: 16, color: 'rgba(243,240,234,0.7)', maxWidth: 520, marginTop: 16 }}>
            Early builders get white-glove support, a direct line to the platform team, and listing placement in the integrations gallery when they ship.
          </p>
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <Link href="/developer" style={{ ...btnPrimary, background: C.bg, color: C.ink }}>Get an API key</Link>
            <a href="mailto:developers@auxio.io" style={{ ...btnGhost, color: C.bg, borderColor: 'rgba(243,240,234,0.2)' }}>Email the platform team</a>
          </div>
        </div>
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

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>{kicker}</div>
      <h2 className={display.className} style={{ fontSize: 'clamp(34px, 4vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 400, margin: '12px 0 0' }}>{title}</h2>
    </>
  )
}

const section: React.CSSProperties = { maxWidth: 1040, margin: '0 auto', padding: '64px 32px' }
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: C.ink, color: C.bg, fontSize: 14, fontWeight: 500, textDecoration: 'none' }
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: 'transparent', color: C.ink, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: `1px solid ${C.rule}` }
const codeInline: React.CSSProperties = { background: C.raised, padding: '2px 8px', borderRadius: 6, fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 13, color: C.inkSoft }
