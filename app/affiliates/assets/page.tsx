'use client'

// Affiliate brand asset library — stub. Real downloads ship with the partner
// portal; meanwhile this page advertises what's available on request.

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'

const display = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], display: 'swap' })

const C = {
  bg: '#f3f0ea', surface: '#ffffff', raised: '#ebe6dc',
  ink: '#0b0f1a', inkSoft: '#1c2233',
  rule: 'rgba(11,15,26,0.10)', ruleSoft: 'rgba(11,15,26,0.06)',
  muted: '#5a6171', cobalt: '#1d5fdb',
}

const PACKS: { name: string; desc: string; size: string; status: 'ready' | 'soon' }[] = [
  { name: 'Wordmark + monogram', desc: 'SVG and PNG, ink on cream and cream on ink.', size: '4 files · 220 KB', status: 'ready' },
  { name: 'Banner pack',          desc: 'Square, vertical, leaderboard, and skyscraper. Three palettes.', size: '12 files · 1.4 MB', status: 'ready' },
  { name: 'Product screenshots',  desc: 'Dashboard, listings table, profit view, repricing, mobile.', size: '8 files · 3.2 MB', status: 'ready' },
  { name: 'Demo videos',          desc: '60-second tour, 3-minute walkthrough, integration teasers.', size: '5 files · 142 MB', status: 'ready' },
  { name: 'Email swipe file',     desc: 'Six warm intros, four cold sequences, three newsletter drops.', size: 'PDF + DOCX', status: 'ready' },
  { name: 'Comparison decks',     desc: 'Fulcra versus the four most-asked competitors.', size: 'PDF · 2.1 MB', status: 'soon' },
  { name: 'Press kit',            desc: 'Founder bios, company facts, logo lockups, boilerplate.', size: 'ZIP · 18 MB', status: 'soon' },
]

export default function AssetsPage() {
  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <Nav />
      <header style={{ maxWidth: 880, margin: '0 auto', padding: '120px 32px 32px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>Brand assets</div>
        <h1 className={display.className} style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 400, margin: '20px 0 0' }}>
          Everything you need to <em style={{ fontStyle: 'italic', color: C.cobalt }}>recommend Fulcra</em>.
        </h1>
        <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.6, marginTop: 16, maxWidth: 580 }}>
          Approved affiliates can download from the partner dashboard. Anyone can request a pack at <a href="mailto:brand@auxio.io" style={{ color: C.cobalt }}>brand@auxio.io</a>.
        </p>
      </header>

      <section style={{ maxWidth: 880, margin: '0 auto', padding: '32px 32px 120px' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, border: `1px solid ${C.ruleSoft}`, borderRadius: 14, overflow: 'hidden', background: C.surface }}>
          {PACKS.map((p, i) => (
            <li key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderTop: i === 0 ? 'none' : `1px solid ${C.ruleSoft}`, gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 320px' }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{p.desc}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{p.size}</div>
              </div>
              <div>
                {p.status === 'ready' ? (
                  <a href={`mailto:brand@auxio.io?subject=Asset%20pack%3A%20${encodeURIComponent(p.name)}`} style={btnGhost}>Request</a>
                ) : (
                  <span style={{ fontSize: 12, color: C.muted, padding: '6px 12px', border: `1px dashed ${C.rule}`, borderRadius: 999 }}>Coming soon</span>
                )}
              </div>
            </li>
          ))}
        </ul>

        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, marginTop: 32, maxWidth: 640 }}>
          By using these assets you agree to the Fulcra brand guidelines. Don&rsquo;t alter the wordmark, don&rsquo;t put it on a clashing background, and don&rsquo;t use it to imply endorsement of unrelated products.
        </p>
        <div style={{ marginTop: 24 }}>
          <Link href="/affiliates" style={{ fontSize: 14, color: C.cobalt, textDecoration: 'none' }}>← Back to the affiliate program</Link>
        </div>
      </section>
    </div>
  )
}

function Nav() {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(243,240,234,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ fontSize: 16, fontWeight: 600, color: C.ink, textDecoration: 'none' }}>Fulcra</Link>
      <Link href="/affiliates" style={{ fontSize: 14, color: C.inkSoft, textDecoration: 'none' }}>Affiliate program</Link>
    </nav>
  )
}

const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '8px 14px', borderRadius: 999, background: 'transparent', color: C.ink, fontSize: 13, fontWeight: 500, textDecoration: 'none', border: `1px solid ${C.rule}` }
