'use client'

// Palvento — Directories. Where Palvento is (or will be) listed and reviewable.

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'

const display = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], display: 'swap' })

const C = {
  bg: '#f3f0ea', surface: '#ffffff', raised: '#ebe6dc',
  ink: '#0b0f1a', inkSoft: '#1c2233',
  rule: 'rgba(11,15,26,0.10)', ruleSoft: 'rgba(11,15,26,0.06)',
  muted: '#5a6171', cobalt: '#1d5fdb', emerald: '#0e7c5a',
}

type Status = 'live' | 'pending' | 'planned'
type Listing = { name: string; category: string; status: Status; reviewUrl?: string; listingUrl?: string; note?: string }

const LISTINGS: Listing[] = [
  { name: 'G2',                 category: 'Order Management Systems',          status: 'pending',  reviewUrl: 'https://www.g2.com/', note: 'Listing under verification — review link goes live within 14 days.' },
  { name: 'Capterra',           category: 'eCommerce Software',                 status: 'pending',  reviewUrl: 'https://www.capterra.com/', note: 'Submitted; waiting on Gartner editorial approval.' },
  { name: 'GetApp',             category: 'Multichannel Selling',               status: 'pending',  reviewUrl: 'https://www.getapp.com/', note: 'Capterra and GetApp share editorial — listing approval is paired.' },
  { name: 'Software Advice',    category: 'eCommerce Platforms',                status: 'pending',  reviewUrl: 'https://www.softwareadvice.com/' },
  { name: 'Product Hunt',       category: 'eCommerce · SaaS',                   status: 'planned',  note: 'Launch window: Q3, paired with v3 release.' },
  { name: 'AlternativeTo',      category: 'Inventory & Channel Management',     status: 'planned',  note: 'Submission scheduled post-G2 verification.' },
  { name: 'SaaSHub',            category: 'eCommerce Tools',                    status: 'planned' },
  { name: 'Slant',              category: 'Multichannel Selling',               status: 'planned' },
  { name: 'TrustRadius',        category: 'Order Management',                   status: 'pending',  reviewUrl: 'https://www.trustradius.com/' },
  { name: 'Shopify App Store',  category: 'Selling channels · Inventory sync',  status: 'pending',  note: 'Listing draft complete — see /marketing/marketplace-listings/shopify.md.' },
  { name: 'BigCommerce App Store', category: 'Multichannel · Inventory',        status: 'planned',  note: 'After Shopify approval.' },
  { name: 'Zapier App Directory', category: 'Productivity · Automation',        status: 'pending',  note: 'Brief at /marketing/marketplace-listings/zapier.md.' },
  { name: 'Vercel Integrations', category: 'Developer tools',                   status: 'planned',  note: 'For dashboard embeds in custom merchant portals.' },
  { name: 'Intercom App Store', category: 'Support · Customer data',            status: 'planned',  note: 'For support teams reading order context inside Intercom.' },
]

const STATUS_COPY: Record<Status, { label: string; color: string }> = {
  live:    { label: 'Live · Review us',    color: C.emerald },
  pending: { label: 'Listing pending',     color: '#a56a0b' },
  planned: { label: 'Planned',             color: C.muted },
}

export default function DirectoriesPage() {
  const live    = LISTINGS.filter(l => l.status === 'live')
  const pending = LISTINGS.filter(l => l.status === 'pending')
  const planned = LISTINGS.filter(l => l.status === 'planned')

  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Nav />

      <header style={{ maxWidth: 980, margin: '0 auto', padding: '120px 32px 32px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>Directories</div>
        <h1 className={display.className} style={{ fontSize: 'clamp(44px, 6vw, 72px)', lineHeight: 1.04, letterSpacing: '-0.02em', fontWeight: 400, margin: '20px 0 0' }}>
          Where to <em style={{ fontStyle: 'italic', color: C.cobalt }}>review us</em><br />
          and find us listed.
        </h1>
        <p style={{ fontSize: 16, color: C.muted, marginTop: 16, lineHeight: 1.6, maxWidth: 620 }}>
          Reviews and listings are how operators find software they trust. If you use Palvento, the most useful thing you can do is leave an honest review wherever you spend time.
        </p>
      </header>

      <Section title="Live · review us" items={live} />
      <Section title="Listing pending" items={pending} />
      <Section title="On the roadmap" items={planned} />

      <section style={{ maxWidth: 980, margin: '0 auto', padding: '40px 32px 96px' }}>
        <div style={{ background: C.ink, color: C.bg, borderRadius: 18, padding: '36px 40px' }}>
          <div className={display.className} style={{ fontSize: 28, letterSpacing: '-0.02em' }}>Left a review? Tell us.</div>
          <p style={{ fontSize: 14, color: 'rgba(243,240,234,0.7)', lineHeight: 1.6, marginTop: 10, maxWidth: 540 }}>
            Forward us a screenshot of your published review and we&rsquo;ll send you swag, a one-month credit, and an early-access pass to the next major release.
          </p>
          <div style={{ marginTop: 18 }}>
            <a href="mailto:reviews@palvento.io" style={{ ...btnPrimary, background: C.bg, color: C.ink }}>reviews@palvento.io</a>
          </div>
        </div>
      </section>

      <ResourcesFooter />
    </div>
  )
}

function Section({ title, items }: { title: string; items: Listing[] }) {
  if (items.length === 0) return null
  return (
    <section style={{ maxWidth: 980, margin: '0 auto', padding: '32px 32px 0' }}>
      <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, margin: 0 }}>{title}</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', border: `1px solid ${C.ruleSoft}`, borderRadius: 14, overflow: 'hidden', background: C.surface }}>
        {items.map((l, i) => {
          const s = STATUS_COPY[l.status]
          return (
            <li key={l.name} style={{ padding: '20px 24px', borderTop: i === 0 ? 'none' : `1px solid ${C.ruleSoft}`, display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{l.name}</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{l.category}</div>
                {l.note && <div style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.55, maxWidth: 540 }}>{l.note}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.color, padding: '4px 10px', border: `1px solid ${C.rule}`, borderRadius: 999 }}>{s.label}</span>
                {l.reviewUrl && l.status !== 'planned' && (
                  <a href={l.reviewUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: C.cobalt, textDecoration: 'none' }}>Open ↗</a>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Nav() {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(243,240,234,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ fontSize: 16, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>Palvento</Link>
      <div style={{ display: 'flex', gap: 28 }}>
        <Link href="/features" style={{ fontSize: 14, color: C.inkSoft, textDecoration: 'none' }}>Features</Link>
        <Link href="/integrations" style={{ fontSize: 14, color: C.inkSoft, textDecoration: 'none' }}>Integrations</Link>
        <Link href="/pricing" style={{ fontSize: 14, color: C.inkSoft, textDecoration: 'none' }}>Pricing</Link>
        <Link href="/community" style={{ fontSize: 14, color: C.inkSoft, textDecoration: 'none' }}>Community</Link>
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
