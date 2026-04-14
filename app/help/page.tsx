'use client'

import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'
import { useState, useMemo } from 'react'
import { ARTICLES, GROUPS } from './articles'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const C = {
  bg:       '#f3f0ea',
  surface:  '#ffffff',
  ink:      '#0b0f1a',
  inkSoft:  '#1c2233',
  rule:     'rgba(11,15,26,0.10)',
  ruleSoft: 'rgba(11,15,26,0.06)',
  muted:    '#5a6171',
  cobalt:   '#1d5fdb',
}

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Partners',     href: '/partners' },
  { label: 'Developers',   href: '/developers' },
]

export default function HelpIndex() {
  const [query, setQuery] = useState('')

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return GROUPS
    const q = query.toLowerCase()
    return GROUPS
      .map(g => ({
        ...g,
        slugs: g.slugs.filter(s => {
          const a = ARTICLES[s]
          if (!a) return false
          return a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
        }),
      }))
      .filter(g => g.slugs.length > 0)
  }, [query])

  return (
    <div style={{ fontFamily: "'Geist', 'Inter', system-ui, sans-serif", background: C.bg, color: C.ink, minHeight: '100vh' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: `${C.bg}cc`, backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.ruleSoft}`, padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 26, height: 26, background: C.ink, borderRadius: 6 }} />
          <span style={{ fontWeight: 600, fontSize: 15, color: C.ink, letterSpacing: '-0.01em' }}>Meridia</span>
        </Link>
        <div style={{ display: 'flex', gap: 28 }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{ fontSize: 14, color: C.inkSoft, textDecoration: 'none' }}>{n.label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/login" style={{ padding: '8px 14px', borderRadius: 999, border: `1px solid ${C.rule}`, fontSize: 13, color: C.ink, textDecoration: 'none' }}>Log in</Link>
          <Link href="/signup" style={{ padding: '8px 16px', borderRadius: 999, background: C.ink, fontSize: 13, color: C.bg, textDecoration: 'none', fontWeight: 500 }}>Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '72px 32px 32px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>Help centre</div>
        <h1 className={display.className} style={{ fontSize: 'clamp(44px, 6vw, 68px)', lineHeight: 1.04, letterSpacing: '-0.02em', fontWeight: 400, margin: '12px 0 24px' }}>
          Meridia help
        </h1>
        <div style={{ position: 'relative', maxWidth: 520 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search articles"
            style={{
              width: '100%',
              padding: '14px 18px 14px 44px',
              fontSize: 15,
              border: `1px solid ${C.rule}`,
              borderRadius: 12,
              background: C.surface,
              color: C.ink,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 14 }}>⌕</div>
        </div>
      </section>

      {/* Groups */}
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '16px 32px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {filteredGroups.map(group => (
            <div key={group.title} style={{ background: C.surface, border: `1px solid ${C.ruleSoft}`, borderRadius: 14, padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt, marginBottom: 14 }}>{group.title}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                {group.slugs.map(slug => {
                  const a = ARTICLES[slug]
                  if (!a) return null
                  return (
                    <li key={slug}>
                      <Link href={`/help/${slug}`} style={{ textDecoration: 'none', color: C.ink, display: 'block', padding: '8px 0', borderBottom: `1px solid ${C.ruleSoft}` }}>
                        <div style={{ fontSize: 15, fontWeight: 500, color: C.ink }}>{a.title}</div>
                        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginTop: 2 }}>{a.summary}</div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {filteredGroups.length === 0 && (
            <div style={{ fontSize: 14, color: C.muted }}>No articles match "{query}". Try a shorter search.</div>
          )}
        </div>

        <div style={{ marginTop: 48, padding: 24, background: C.surface, border: `1px solid ${C.ruleSoft}`, borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, color: C.ink, fontWeight: 500 }}>Can't find what you need.</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Book a twenty-minute call or email the team directly.</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/demo" style={{ padding: '10px 18px', borderRadius: 999, background: C.ink, color: C.bg, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Book a demo</Link>
            <Link href="/contact" style={{ padding: '10px 18px', borderRadius: 999, border: `1px solid ${C.rule}`, color: C.ink, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Contact us</Link>
          </div>
        </div>
      </section>

      <footer style={{ background: C.ink, color: C.bg, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'rgba(243,240,234,0.45)' }}>© {new Date().getFullYear()} Meridia.</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['Pricing', '/pricing'], ['Partners', '/partners'], ['Help', '/help'], ['Contact', '/contact']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 13, color: 'rgba(243,240,234,0.45)', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`input:focus { border-color: ${C.cobalt} !important; box-shadow: 0 0 0 3px rgba(29,95,219,0.12); }`}</style>
    </div>
  )
}
