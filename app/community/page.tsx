'use client'

// Palvento — Community hub.

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'

const display = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], display: 'swap' })

const C = {
  bg: '#f3f0ea', surface: '#ffffff', raised: '#ebe6dc',
  ink: '#0b0f1a', inkSoft: '#1c2233',
  rule: 'rgba(11,15,26,0.10)', ruleSoft: 'rgba(11,15,26,0.06)',
  muted: '#5a6171', cobalt: '#1d5fdb',
}

type Surface = { name: string; what: string; href?: string; soon?: boolean; cta: string }
const SURFACES: Surface[] = [
  { name: 'Slack',     what: 'Operator-only Slack. Real-time peer help on repricing, multichannel ops, and integration debugging.',                cta: 'Request invite',  href: 'mailto:community@palvento.io?subject=Slack%20invite' },
  { name: 'Discord',   what: 'Casual lounge for builders, agencies, and the curious. Office hours every Thursday.',                                  cta: 'Join Discord',    soon: true },
  { name: 'X / Twitter', what: 'Product nudges, ship notes, the occasional spicy graph.',                                                            cta: '@palvento',          href: 'https://twitter.com/palvento' },
  { name: 'LinkedIn',  what: 'Long-form posts on commerce ops, hiring updates, and customer wins.',                                                  cta: 'Follow',          href: 'https://www.linkedin.com/company/palvento' },
  { name: 'Reddit',    what: 'r/palvento — open subreddit for unfiltered feedback. Mods don\u2019t delete criticism.',                                 cta: 'Visit subreddit', soon: true },
  { name: 'YouTube',   what: 'Walkthroughs, customer stories, integration deep-dives.',                                                              cta: 'Subscribe',       soon: true },
  { name: 'GitHub',    what: 'Public SDKs, sample apps, and a discussions tab for the developer platform.',                                          cta: 'Browse repos',    href: 'https://github.com/palvento' },
  { name: 'RSS',       what: 'Changelog and incident feed for the people who still wire their own automations.',                                     cta: 'Subscribe',       href: '/rss/changelog.xml' },
]

const VALUES = [
  { t: 'Operators first',     d: 'Conversations stay grounded in real shipments, real refunds, real ASIN suspensions. No vibes-based growth-hacking.' },
  { t: 'Honest by default',   d: 'We don\u2019t delete critical posts, hide bad reviews, or astroturf upvotes. If something is broken, the place to say so is in our face.' },
  { t: 'Earned not bought',   d: 'No paid mods, no ambassadors with fake titles, no pyramid programs disguised as community. We pay for time when we ask for time.' },
  { t: 'High-signal, low-volume', d: 'We\u2019d rather have 200 active operators than 20,000 lurkers. We close channels that drift.' },
]

export default function CommunityPage() {
  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Nav />

      <header style={{ maxWidth: 980, margin: '0 auto', padding: '120px 32px 40px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>Community</div>
        <h1 className={display.className} style={{ fontSize: 'clamp(44px, 6vw, 72px)', lineHeight: 1.04, letterSpacing: '-0.02em', fontWeight: 400, margin: '20px 0 0' }}>
          Operators talking <em style={{ fontStyle: 'italic', color: C.cobalt }}>shop</em>.<br />
          Out loud, in public.
        </h1>
        <p style={{ fontSize: 16, color: C.muted, marginTop: 16, lineHeight: 1.65, maxWidth: 640 }}>
          Palvento runs the operating layer for thousands of merchants. The community is where they swap repricing tactics, debug tax setups, and tell us — sometimes loudly — what to fix next.
        </p>
      </header>

      <section style={{ maxWidth: 980, margin: '0 auto', padding: '32px 32px 0' }}>
        <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, margin: 0 }}>Where we are</h2>
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {SURFACES.map(s => (
            <div key={s.name} style={{ background: C.surface, border: `1px solid ${C.ruleSoft}`, borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className={display.className} style={{ fontSize: 24, letterSpacing: '-0.01em' }}>{s.name}</div>
                {s.soon && <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, padding: '3px 10px', border: `1px dashed ${C.rule}`, borderRadius: 999 }}>Coming soon</span>}
              </div>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 10, flex: 1 }}>{s.what}</p>
              <div style={{ marginTop: 18 }}>
                {s.href && !s.soon ? (
                  <a href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" style={btnGhost}>{s.cta} →</a>
                ) : (
                  <span style={{ fontSize: 13, color: C.muted }}>{s.cta} — opens when we open the channel.</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 980, margin: '0 auto', padding: '64px 32px 24px' }}>
        <h2 className={display.className} style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', letterSpacing: '-0.02em', fontWeight: 400, margin: 0 }}>How we run community.</h2>
        <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.65, marginTop: 16, maxWidth: 720 }}>
          Most B2B SaaS communities are vendor-flavoured Slack groups where the loudest voice is a CSM trying to deflect a complaint. Ours runs on different rules.
        </p>
        <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {VALUES.map(v => (
            <div key={v.t} style={{ background: C.raised, border: `1px solid ${C.ruleSoft}`, borderRadius: 14, padding: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{v.t}</div>
              <p style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.65, marginTop: 8 }}>{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 980, margin: '0 auto', padding: '40px 32px 96px' }}>
        <div style={{ background: C.ink, color: C.bg, borderRadius: 18, padding: '40px 40px' }}>
          <div className={display.className} style={{ fontSize: 28, letterSpacing: '-0.02em' }}>Want to host an operator dinner?</div>
          <p style={{ fontSize: 14, color: 'rgba(243,240,234,0.7)', lineHeight: 1.6, marginTop: 10, maxWidth: 560 }}>
            We sponsor small, invite-only dinners for ecommerce operators in London, NYC, LA, Berlin, Singapore, and Sydney. Twelve people, one table, no slides.
          </p>
          <div style={{ marginTop: 18 }}>
            <a href="mailto:community@palvento.io?subject=Operator%20dinner" style={{ ...btnPrimary, background: C.bg, color: C.ink }}>community@palvento.io</a>
          </div>
        </div>
      </section>

      <ResourcesFooter />
    </div>
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
        <Link href="/directories" style={{ fontSize: 14, color: C.inkSoft, textDecoration: 'none' }}>Directories</Link>
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
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 20px', borderRadius: 999, background: 'transparent', color: C.ink, fontSize: 13, fontWeight: 500, textDecoration: 'none', border: `1px solid ${C.rule}` }
