'use client'

import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { Instrument_Serif } from 'next/font/google'
import { useMemo, useState } from 'react'
import { ARTICLES, GROUPS, groupForSlug } from '../articles'

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

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

type Block = { kind: 'h2'; id: string; text: string } | { kind: 'p'; text: string }

function parseBody(body: string): Block[] {
  const blocks: Block[] = []
  const paras = body.trim().split(/\n\n+/)
  for (const para of paras) {
    const lines = para.split('\n')
    if (lines[0].startsWith('## ')) {
      const text = lines[0].replace(/^##\s+/, '')
      blocks.push({ kind: 'h2', id: slugify(text), text })
      const rest = lines.slice(1).join('\n').trim()
      if (rest) blocks.push({ kind: 'p', text: rest })
    } else {
      blocks.push({ kind: 'p', text: para })
    }
  }
  return blocks
}

export default function ArticlePage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug as string
  const article = ARTICLES[slug]
  const [feedback, setFeedback] = useState<null | 'up' | 'down'>(null)

  const blocks = useMemo(() => article ? parseBody(article.body) : [], [article])
  const headings = blocks.filter((b): b is Extract<Block, { kind: 'h2' }> => b.kind === 'h2')

  if (!article) {
    notFound()
  }

  const groupTitle = groupForSlug(slug)
  const relatedGroup = GROUPS.find(g => g.title === groupTitle)
  const related = relatedGroup ? relatedGroup.slugs.filter(s => s !== slug).slice(0, 4) : []

  async function submitFeedback(helpful: boolean) {
    setFeedback(helpful ? 'up' : 'down')
    try {
      await fetch('/api/help/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, helpful }),
      })
    } catch {
      // UI-only stub; ignore errors.
    }
  }

  return (
    <div style={{ fontFamily: "'Geist', 'Inter', system-ui, sans-serif", background: C.bg, color: C.ink, minHeight: '100vh' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: `${C.bg}cc`, backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.ruleSoft}`, padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 26, height: 26, background: C.ink, borderRadius: 6 }} />
          <span style={{ fontWeight: 600, fontSize: 15, color: C.ink }}>Auxio</span>
        </Link>
        <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
          <Link href="/help" style={{ color: C.inkSoft, textDecoration: 'none' }}>← All articles</Link>
        </div>
        <div>
          <Link href="/demo" style={{ padding: '8px 16px', borderRadius: 999, background: C.ink, fontSize: 13, color: C.bg, textDecoration: 'none', fontWeight: 500 }}>Book demo</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 32px 80px', display: 'grid', gridTemplateColumns: '1fr 220px', gap: 64, alignItems: 'start' }}>
        <article>
          {groupTitle && (
            <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt, marginBottom: 12 }}>{groupTitle}</div>
          )}
          <h1 className={display.className} style={{ fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 400, margin: '0 0 16px' }}>
            {article.title}
          </h1>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 32 }}>Last updated {new Date(article.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

          <div style={{ fontSize: 17, color: C.inkSoft, lineHeight: 1.7 }}>
            {blocks.map((b, i) => {
              if (b.kind === 'h2') {
                return (
                  <h2
                    key={i}
                    id={b.id}
                    className={display.className}
                    style={{ fontSize: 26, fontWeight: 400, letterSpacing: '-0.01em', margin: '36px 0 12px', color: C.ink, scrollMarginTop: 80 }}
                  >
                    {b.text}
                  </h2>
                )
              }
              return (
                <p key={i} style={{ margin: '0 0 16px', fontSize: 16, lineHeight: 1.75 }}>{b.text}</p>
              )
            })}
          </div>

          {/* Feedback */}
          <div style={{ marginTop: 48, padding: 20, background: C.surface, border: `1px solid ${C.ruleSoft}`, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 14, color: C.inkSoft }}>Was this helpful?</div>
            {feedback ? (
              <div style={{ fontSize: 13, color: C.muted }}>
                {feedback === 'up' ? 'Thanks — glad it helped.' : 'Thanks — we\'ll improve this article.'}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => submitFeedback(true)} style={btnStyle}>Yes</button>
                <button onClick={() => submitFeedback(false)} style={btnStyle}>No</button>
              </div>
            )}
          </div>

          {related.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt, marginBottom: 12 }}>Related</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {related.map(s => {
                  const a = ARTICLES[s]
                  if (!a) return null
                  return (
                    <Link key={s} href={`/help/${s}`} style={{ textDecoration: 'none', color: C.ink, padding: '12px 14px', border: `1px solid ${C.ruleSoft}`, borderRadius: 10, background: C.surface }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{a.title}</div>
                      <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{a.summary}</div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </article>

        {/* Sidebar: On this page */}
        <aside style={{ position: 'sticky', top: 80 }}>
          {headings.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>On this page</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                {headings.map(h => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} style={{ fontSize: 13, color: C.inkSoft, textDecoration: 'none', lineHeight: 1.5 }}>{h.text}</a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>

      <footer style={{ background: C.ink, color: C.bg, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'rgba(243,240,234,0.45)' }}>© {new Date().getFullYear()} Auxio.</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['Pricing', '/pricing'], ['Partners', '/partners'], ['Help', '/help'], ['Contact', '/contact']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 13, color: 'rgba(243,240,234,0.45)', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 999,
  border: `1px solid ${C.rule}`,
  background: 'transparent',
  color: C.ink,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
