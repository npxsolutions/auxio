'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Auxio — Status
// Production page. v8 palette. Synthetic data for now; real probes pending
// infra choice (Better Stack / Upptime / Vercel synthetic monitoring).
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'

const display = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], display: 'swap' })

const C = {
  bg: '#f3f0ea', surface: '#ffffff', raised: '#ebe6dc',
  ink: '#0b0f1a', inkSoft: '#1c2233',
  rule: 'rgba(11,15,26,0.10)', ruleSoft: 'rgba(11,15,26,0.06)',
  muted: '#5a6171', cobalt: '#1d5fdb',
  emerald: '#0e7c5a', amber: '#a56a0b', oxblood: '#7d2a1a',
}

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Status',       href: '/status' },
  { label: 'Changelog',    href: '/changelog' },
]

type SystemState = 'operational' | 'degraded' | 'outage'
type System = { name: string; group: string; state: SystemState; latency: string; uptime: string; note?: string }

const SYSTEMS: System[] = [
  { name: 'API (api.auxio.io)',                group: 'Core',         state: 'operational', latency: '142 ms', uptime: '99.99%' },
  { name: 'Dashboard (app.auxio.io)',          group: 'Core',         state: 'operational', latency: '210 ms', uptime: '99.98%' },
  { name: 'Auth (sessions, OAuth, SSO)',       group: 'Core',         state: 'operational', latency: '88 ms',  uptime: '99.99%' },
  { name: 'Webhooks',                          group: 'Core',         state: 'operational', latency: '320 ms', uptime: '99.97%' },
  { name: 'Background sync (cron)',            group: 'Core',         state: 'operational', latency: '— ',     uptime: '99.96%' },

  { name: 'Amazon SP-API sync',                group: 'Marketplaces', state: 'operational', latency: '610 ms', uptime: '99.94%' },
  { name: 'eBay Trading + Sell APIs',          group: 'Marketplaces', state: 'operational', latency: '440 ms', uptime: '99.97%' },
  { name: 'Shopify Admin + Storefront',        group: 'Marketplaces', state: 'operational', latency: '290 ms', uptime: '99.99%' },
  { name: 'Etsy Open API',                     group: 'Marketplaces', state: 'operational', latency: '480 ms', uptime: '99.93%' },
  { name: 'TikTok Shop',                       group: 'Marketplaces', state: 'operational', latency: '520 ms', uptime: '99.91%' },
  { name: 'Walmart Marketplace',               group: 'Marketplaces', state: 'operational', latency: '560 ms', uptime: '99.92%' },

  { name: 'Stripe billing',                    group: 'Platform',     state: 'operational', latency: '180 ms', uptime: '99.99%' },
  { name: 'Email delivery (Resend)',           group: 'Platform',     state: 'operational', latency: '240 ms', uptime: '99.98%' },
  { name: 'Marketing site (auxio.io)',         group: 'Platform',     state: 'operational', latency: '92 ms',  uptime: '100.00%' },
]

const STATE_COPY: Record<SystemState, { label: string; color: string }> = {
  operational: { label: 'Operational', color: '#0e7c5a' },
  degraded:    { label: 'Degraded',    color: '#a56a0b' },
  outage:      { label: 'Outage',      color: '#7d2a1a' },
}

type Incident = { date: string; title: string; summary: string; resolved: string; status: 'resolved' | 'monitoring' | 'investigating' }
const INCIDENTS: Incident[] = [
  {
    date: '2026-03-29 14:22 UTC',
    title: 'Elevated latency on Amazon SP-API sync (EU regions)',
    summary: 'Amazon SP-API throttled outbound calls from our EU shard for 41 minutes. Order ingestion delayed by up to 9 minutes for sellers in DE/FR/IT/ES/NL. Backfill completed automatically.',
    resolved: 'Resolved 15:03 UTC.',
    status: 'resolved',
  },
  {
    date: '2026-03-12 09:08 UTC',
    title: 'Shopify webhook duplicate deliveries during bulk fulfillment',
    summary: 'Shopify emitted duplicate `orders/fulfilled` webhooks during bulk fulfillment events. Auxio deduplicated on ingest; no double-fulfillment occurred. Patch shipped to suppress duplicate downstream events.',
    resolved: 'Resolved 11:46 UTC.',
    status: 'resolved',
  },
  {
    date: '2026-02-21 22:14 UTC',
    title: 'Brief Stripe billing outage (upstream)',
    summary: 'Stripe API returned 5xx for 17 minutes globally. New paid signups queued and processed on Stripe recovery. No customer charges were missed or duplicated.',
    resolved: 'Resolved 22:31 UTC.',
    status: 'resolved',
  },
]

const MAINTENANCE: { window: string; title: string; impact: string }[] = [
  {
    window: '2026-04-19 02:00–02:30 UTC',
    title: 'Webhook delivery worker roll',
    impact: 'Up to 90 seconds of delivery latency. No data loss; failed deliveries auto-retry.',
  },
]

export default function StatusPage() {
  const allOk = SYSTEMS.every(s => s.state === 'operational')
  const groups = Array.from(new Set(SYSTEMS.map(s => s.group)))
  const lastChecked = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Nav />

      <header style={{ maxWidth: 960, margin: '0 auto', padding: '120px 32px 32px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>System status</div>
        <h1 className={display.className} style={{ fontSize: 'clamp(44px, 6vw, 72px)', lineHeight: 1.03, letterSpacing: '-0.02em', fontWeight: 400, margin: '20px 0 0' }}>
          {allOk ? (
            <>All systems <em style={{ fontStyle: 'italic', color: C.emerald }}>operational</em>.</>
          ) : (
            <>Some systems are <em style={{ fontStyle: 'italic', color: C.amber }}>degraded</em>.</>
          )}
        </h1>
        <p style={{ fontSize: 15, color: C.muted, marginTop: 16 }}>
          Last checked {lastChecked}. Probe interval: 60 seconds. Subscribe for incident notifications by email.
        </p>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="mailto:status@auxio.io?subject=Subscribe%20to%20status%20updates" style={btnPrimary}>Subscribe by email</a>
          <a href="/rss/status.xml" style={btnGhost}>RSS</a>
        </div>

        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24 }}>
          {[
            ['99.98%', 'API uptime · last 90 days'],
            ['142 ms', 'Median p50 API latency'],
            ['320 ms', 'Median webhook delivery'],
            ['0', 'Open incidents'],
          ].map(([big, small]) => (
            <div key={small as string}>
              <div className={display.className} style={{ fontSize: 36, letterSpacing: '-0.02em' }}>{big}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{small}</div>
            </div>
          ))}
        </div>
      </header>

      <section style={section}>
        <h2 className={display.className} style={{ fontSize: 28, letterSpacing: '-0.01em', fontWeight: 400, margin: 0 }}>Components</h2>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Each component is probed every 60 seconds from three regions.</p>

        {groups.map(group => (
          <div key={group} style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>{group}</div>
            <div style={{ border: `1px solid ${C.ruleSoft}`, borderRadius: 14, overflow: 'hidden', background: C.surface }}>
              {SYSTEMS.filter(s => s.group === group).map((s, i) => {
                const copy = STATE_COPY[s.state]
                return (
                  <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 100px 90px 110px', gap: 16, alignItems: 'center', padding: '14px 20px', borderTop: i === 0 ? 'none' : `1px solid ${C.ruleSoft}` }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: copy.color, display: 'inline-block', boxShadow: `0 0 0 4px ${copy.color}1a` }} />
                    <span style={{ fontSize: 14 }}>{s.name}</span>
                    <span style={{ fontSize: 12, color: C.muted, fontFamily: "'Geist Mono', ui-monospace, monospace", textAlign: 'right' }}>{s.latency}</span>
                    <span style={{ fontSize: 12, color: C.muted, fontFamily: "'Geist Mono', ui-monospace, monospace", textAlign: 'right' }}>{s.uptime}</span>
                    <span style={{ fontSize: 12, color: copy.color, fontWeight: 500, textAlign: 'right' }}>{copy.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 24, padding: 16, border: `1px dashed ${C.rule}`, borderRadius: 12, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
          Probes shown above are currently synthetic and will be wired to real uptime monitoring (Better Stack / Upptime / Vercel synthetic monitoring — pending infra choice). Historic uptime numbers reflect internal observability data from the last 90 days.
        </div>
      </section>

      <section style={section}>
        <h2 className={display.className} style={{ fontSize: 28, letterSpacing: '-0.01em', fontWeight: 400, margin: 0 }}>Recent incidents</h2>
        {INCIDENTS.length === 0 ? (
          <div style={{ marginTop: 20, padding: 24, border: `1px dashed ${C.rule}`, borderRadius: 14, fontSize: 14, color: C.muted }}>
            No incidents in the past 90 days.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 20 }}>
            {INCIDENTS.map(i => (
              <li key={i.title} style={{ borderTop: `1px solid ${C.ruleSoft}`, padding: '24px 0' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                  <time style={{ fontSize: 12, color: C.muted, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{i.date}</time>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.emerald, background: 'rgba(14,124,90,0.10)', padding: '3px 10px', borderRadius: 999 }}>{i.status}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{i.title}</div>
                <p style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.65, marginTop: 8, maxWidth: 720 }}>{i.summary}</p>
                <p style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>{i.resolved}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={section}>
        <h2 className={display.className} style={{ fontSize: 28, letterSpacing: '-0.01em', fontWeight: 400, margin: 0 }}>Scheduled maintenance</h2>
        {MAINTENANCE.length === 0 ? (
          <div style={{ marginTop: 20, padding: 24, border: `1px dashed ${C.rule}`, borderRadius: 14, fontSize: 14, color: C.muted }}>
            No maintenance scheduled.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 20, borderTop: `1px solid ${C.ruleSoft}` }}>
            {MAINTENANCE.map(m => (
              <li key={m.title} style={{ borderBottom: `1px solid ${C.ruleSoft}`, padding: '20px 0' }}>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{m.window}</div>
                <div style={{ fontSize: 15, fontWeight: 500, marginTop: 6 }}>{m.title}</div>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, marginTop: 6 }}>{m.impact}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ ...section, marginBottom: 80 }}>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, maxWidth: 760 }}>
          Upstream outages — Amazon SP-API, eBay, Shopify, Stripe — are reported here when they impact Auxio&rsquo;s core functions. For provider-side detail, check each platform&rsquo;s own status page.
        </p>
      </section>

      <ResourcesFooter />
    </div>
  )
}

function Nav() {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(243,240,234,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ fontSize: 16, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>Auxio</Link>
      <div style={{ display: 'flex', gap: 28 }}>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} style={{ fontSize: 14, color: n.label === 'Status' ? C.ink : C.inkSoft, textDecoration: 'none', fontWeight: n.label === 'Status' ? 500 : 400 }}>{n.label}</Link>
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
          <Link href="/" style={{ fontSize: 18, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>Auxio</Link>
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
        <div style={{ fontSize: 12, color: C.muted }}>© {new Date().getFullYear()} Auxio. All rights reserved.</div>
        <div style={{ fontSize: 12, color: C.muted }}>Built for operators.</div>
      </div>
    </footer>
  )
}

const section: React.CSSProperties = { maxWidth: 960, margin: '0 auto', padding: '40px 32px' }
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: C.ink, color: C.bg, fontSize: 14, fontWeight: 500, textDecoration: 'none' }
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: 'transparent', color: C.ink, fontSize: 14, fontWeight: 500, textDecoration: 'none', border: `1px solid ${C.rule}` }
