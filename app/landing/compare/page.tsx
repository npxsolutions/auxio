'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type VariantId = 'v1' | 'v2' | 'v3'

const VARIANTS: { id: VariantId; name: string; tagline: string; headline: string; vibe: string; href: string }[] = [
  { id: 'v1', name: 'V1 — IR-Deck',       tagline: 'Analyst-grade, category-leader',     headline: '"The Operating System for Global Commerce."', vibe: 'Snowflake / Databricks energy. Navy + confident blue. Weight-600 type. Trust signals heavy.', href: '/landing/v1' },
  { id: 'v2', name: 'V2 — Editorial',     tagline: 'Stripe-narrative scrollytelling',    headline: '"Every marketplace. Every currency. One platform."', vibe: 'Stripe / Vercel / Linear long-form. Warm whites + purple. Weight-300 wisps. Story-driven.', href: '/landing/v2' },
  { id: 'v3', name: 'V3 — Bold Founder',  tagline: 'Dark, opinionated, cinematic',       headline: '"The OS for global commerce."', vibe: 'Linear / Superhuman / Raycast dark mode. Radial glows, bento, animated counters.', href: '/landing/v3' },
]

const CRITERIA: { key: string; label: string; help: string; weight: number }[] = [
  { key: 'category',   label: 'Category-claim strength',     help: 'Does the hero own a category? Would an analyst quote it?',     weight: 3 },
  { key: 'memorable',  label: 'Memorability of the headline', help: 'Would a buyer repeat this to a colleague?',                     weight: 2 },
  { key: 'clarity',    label: 'Clarity of what we do',        help: 'Does a stranger get it in 5 seconds?',                          weight: 2 },
  { key: 'design',     label: 'Design ambition / craft',      help: 'Does this feel like a $1B company already?',                    weight: 3 },
  { key: 'global',     label: 'Global-positioning signal',    help: 'Does it read worldwide, not local?',                            weight: 2 },
  { key: 'differ',     label: 'Differentiation vs incumbents',help: 'ChannelAdvisor / Linnworks / Brightpearl / Feedonomics — does it land?', weight: 2 },
  { key: 'trust',      label: 'Trust + proof signals',        help: 'Numbers, logos, compliance — believable?',                      weight: 2 },
  { key: 'cta',        label: 'CTA clarity & weight',         help: 'Does the eye go to "Start free"?',                              weight: 1 },
  { key: 'tech',       label: 'Buyer-segment fit (Enterprise)', help: 'Would a CFO / Head of Ops take a meeting from this?',        weight: 2 },
  { key: 'gut',        label: 'Gut feel — would you ship it?', help: 'Pure instinct.',                                                weight: 3 },
]

const STORAGE_KEY = 'palvento.landing.scores.v1'

const C = {
  bg: '#fafaf8',
  ink: '#0f0e13',
  border: 'rgba(0,0,0,0.08)',
  borderSoft: 'rgba(0,0,0,0.05)',
  muted: '#6b6e87',
  purple: '#e8863f',
  purpleSoft: 'rgba(232,134,63,0.10)',
  green: '#0f9b6e',
  amber: '#d97706',
  card: '#ffffff',
}

type ScoreMap = Record<VariantId, Record<string, number>>

const blankScores = (): ScoreMap => ({
  v1: Object.fromEntries(CRITERIA.map(c => [c.key, 5])) as Record<string, number>,
  v2: Object.fromEntries(CRITERIA.map(c => [c.key, 5])) as Record<string, number>,
  v3: Object.fromEntries(CRITERIA.map(c => [c.key, 5])) as Record<string, number>,
})

const totalFor = (s: Record<string, number>) =>
  CRITERIA.reduce((acc, c) => acc + (s[c.key] ?? 0) * c.weight, 0)
const maxTotal = CRITERIA.reduce((acc, c) => acc + 10 * c.weight, 0)

export default function CompareLandingPage() {
  const [scores, setScores] = useState<ScoreMap>(blankScores)
  const [notes, setNotes] = useState<Record<VariantId, string>>({ v1: '', v2: '', v3: '' })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.scores) setScores(parsed.scores)
        if (parsed.notes) setNotes(parsed.notes)
      }
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ scores, notes })) } catch {}
  }, [scores, notes, hydrated])

  const setScore = (v: VariantId, key: string, value: number) =>
    setScores(prev => ({ ...prev, [v]: { ...prev[v], [key]: value } }))

  const reset = () => {
    if (!confirm('Reset all scores and notes?')) return
    setScores(blankScores())
    setNotes({ v1: '', v2: '', v3: '' })
  }

  const [copied, setCopied] = useState(false)
  const exportScores = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      maxTotal,
      criteria: CRITERIA,
      results: VARIANTS.map(v => ({
        id: v.id,
        name: v.name,
        headline: v.headline,
        total: totalFor(scores[v.id]),
        scores: scores[v.id],
        notes: notes[v.id],
      })),
    }
    const text = JSON.stringify(payload, null, 2)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt('Copy this JSON and paste it back to Claude:', text)
    }
  }

  const ranked = [...VARIANTS]
    .map(v => ({ ...v, total: totalFor(scores[v.id]) }))
    .sort((a, b) => b.total - a.total)
  const winner = ranked[0]
  const tied = ranked.filter(r => r.total === winner.total).length > 1

  return (
    <div style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif', background: C.bg, color: C.ink, minHeight: '100vh', padding: '40px 32px 80px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <Link href="/" style={{ fontSize: '13px', color: C.muted, textDecoration: 'none' }}>← Palvento</Link>
            <h1 style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.025em', marginTop: '8px', marginBottom: '6px' }}>
              Landing-page bake-off
            </h1>
            <p style={{ fontSize: '15px', color: C.muted, lineHeight: 1.6, maxWidth: '640px' }}>
              Three candidate homepages for the $1B-positioning relaunch. Open each in a new tab, then score on the rubric below. Weights reflect what matters most for the exit narrative. Scores save to your browser automatically.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={exportScores}
              style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${C.purple}`, background: C.purple, color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              {copied ? '✓ Copied — paste to Claude' : 'Export scores → clipboard'}
            </button>
            <button
              onClick={reset}
              style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'white', color: C.muted, fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              Reset scores
            </button>
          </div>
        </div>

        {/* Live ranking summary */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px 24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live ranking</div>
            <div style={{ fontSize: '11px', color: C.muted }}>· {hydrated ? 'saved' : 'loading…'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {ranked.map((r, i) => {
              const pct = Math.round((r.total / maxTotal) * 100)
              const isTop = i === 0 && !tied
              return (
                <div key={r.id} style={{ background: isTop ? C.purpleSoft : C.bg, border: `1px solid ${isTop ? C.purple : C.borderSoft}`, borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isTop ? C.purple : C.ink }}>#{i + 1} · {r.name}</span>
                    {isTop && <span style={{ fontSize: '10px', fontWeight: 700, color: C.purple, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leader</span>}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>{r.total} <span style={{ fontSize: '13px', color: C.muted, fontWeight: 500 }}>/ {maxTotal}</span></div>
                  <div style={{ marginTop: '8px', height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: isTop ? C.purple : C.muted, transition: 'width 0.2s' }} />
                  </div>
                </div>
              )
            })}
          </div>
          {tied && <p style={{ marginTop: '12px', fontSize: '12px', color: C.amber }}>Tie at the top — keep scoring to break it.</p>}
        </div>

        {/* Variant cards + scoring */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
          {VARIANTS.map(v => {
            const total = totalFor(scores[v.id])
            const pct = Math.round((total / maxTotal) * 100)
            return (
              <div key={v.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: C.purple, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{v.name}</div>
                  <Link href={v.href} target="_blank" style={{ fontSize: '12px', color: C.purple, textDecoration: 'none', fontWeight: 600 }}>Preview ↗</Link>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{v.tagline}</div>
                <div style={{ fontSize: '13px', color: C.ink, marginBottom: '10px', fontStyle: 'italic' }}>{v.headline}</div>
                <div style={{ fontSize: '12px', color: C.muted, lineHeight: 1.55, marginBottom: '20px' }}>{v.vibe}</div>

                <div style={{ height: '1px', background: C.borderSoft, marginBottom: '16px' }} />

                {CRITERIA.map(c => {
                  const value = scores[v.id][c.key] ?? 5
                  return (
                    <div key={c.key} style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: C.ink }}>
                          {c.label}
                          <span style={{ fontSize: '10px', color: C.muted, fontWeight: 500, marginLeft: '6px' }}>×{c.weight}</span>
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: C.purple, fontVariantNumeric: 'tabular-nums' }}>{value}/10</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        value={value}
                        onChange={e => setScore(v.id, c.key, Number(e.target.value))}
                        style={{ width: '100%', accentColor: C.purple, cursor: 'pointer' }}
                        aria-label={`${v.name} — ${c.label}`}
                        title={c.help}
                      />
                    </div>
                  )
                })}

                <div style={{ height: '1px', background: C.borderSoft, margin: '4px 0 16px' }} />

                <label style={{ fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Notes</label>
                <textarea
                  value={notes[v.id]}
                  onChange={e => setNotes(prev => ({ ...prev, [v.id]: e.target.value }))}
                  placeholder="What stood out, what would you change…"
                  rows={3}
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', color: C.ink, resize: 'vertical', background: C.bg, marginBottom: '20px' }}
                />

                <div style={{ marginTop: 'auto', padding: '14px 0 0', borderTop: `1px solid ${C.borderSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weighted total</span>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: C.purple, letterSpacing: '-0.02em' }}>{total} <span style={{ fontSize: '12px', color: C.muted, fontWeight: 500 }}>/ {maxTotal} ({pct}%)</span></span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Rubric reference */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Rubric</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px' }}>
            {CRITERIA.map(c => (
              <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '8px 0', borderBottom: `1px solid ${C.borderSoft}` }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink }}>{c.label}</div>
                  <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>{c.help}</div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.purple, whiteSpace: 'nowrap' }}>weight ×{c.weight}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
