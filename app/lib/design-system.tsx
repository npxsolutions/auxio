/* ─────────────────────────────────────────────────────────────────────────────
   Palvento Design System
   Shared constants + style objects for all product surfaces.
   Import { P, CARD, MONO, ... } from '@/app/lib/design-system'
   ───────────────────────────────────────────────────────────────────────────── */
import React from 'react'

/* ── Palette ── */
export const P = {
  bg:         '#f3f0ea',
  surface:    '#ffffff',
  raised:     '#ebe6dc',
  ink:        '#0b0f1a',
  inkSoft:    '#1c2233',
  rule:       'rgba(11,15,26,0.10)',
  ruleSoft:   'rgba(11,15,26,0.06)',
  muted:      '#5a6171',
  mutedDk:    '#2c3142',
  cobalt:     '#1d5fdb',
  cobaltDk:   '#1647a8',
  cobaltSft:  'rgba(29,95,219,0.10)',
  emerald:    '#0e7c5a',
  emeraldSft: 'rgba(14,124,90,0.10)',
  oxblood:    '#7d2a1a',
  oxbloodSft: 'rgba(125,42,26,0.10)',
  amber:      '#9a6700',
  amberSft:   'rgba(154,103,0,0.10)',
} as const

/* ── Card ── */
export const CARD: React.CSSProperties = {
  background: P.surface,
  border: `1px solid ${P.rule}`,
  borderRadius: '2px',
}

/* ── Typography: mono family ── */
export const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono), ui-monospace, monospace',
}

/* ── Data label: uppercase monospace ── */
export const LABEL: React.CSSProperties = {
  ...MONO,
  fontSize: '10px',
  fontWeight: 600,
  color: P.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.10em',
}

/* ── Heading: serif ── */
export const HEADING: React.CSSProperties = {
  fontFamily: "'Instrument Serif', Georgia, serif",
}

/* ── Tabular numbers ── */
export const NUMBER: React.CSSProperties = {
  ...MONO,
  fontVariantNumeric: 'tabular-nums',
}

/* ── Primary button: ink bg + cream text ── */
export const BTN_PRIMARY: React.CSSProperties = {
  background: P.ink,
  color: P.bg,
  border: 'none',
  borderRadius: '2px',
  padding: '8px 16px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '0.02em',
}

/* ── Secondary button: transparent + rule border ── */
export const BTN_SECONDARY: React.CSSProperties = {
  background: 'transparent',
  color: P.ink,
  border: `1px solid ${P.rule}`,
  borderRadius: '2px',
  padding: '8px 16px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '0.02em',
}

/* ── Section header: cobalt tag ── */
export const SECTION_HEADER: React.CSSProperties = {
  ...MONO,
  fontSize: '10px',
  fontWeight: 600,
  color: P.cobalt,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
}

/* ── Status dot ── */
export const STATUS_DOT = (color: string): React.CSSProperties => ({
  width: '5px',
  height: '5px',
  borderRadius: '50%',
  background: color,
  display: 'inline-block',
  flexShrink: 0,
})

/* ── Metric cell (stat cards) ── */
export const METRIC_VALUE: React.CSSProperties = {
  ...NUMBER,
  fontSize: '28px',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1,
  color: P.ink,
}

export const METRIC_LABEL: React.CSSProperties = {
  ...LABEL,
  fontSize: '10px',
  marginBottom: '6px',
}

/* ── Channel SVG marks (stroke-based, ink color) ── */
export const CHANNEL_SVG: Record<string, React.ReactElement> = {
  ebay: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 4.5h3v3h-3v3h4.5"/>
      <path d="M6 10.5V4.5l3.5 6V4.5"/>
      <path d="M11 7.5h2.5"/>
    </svg>
  ),
  amazon: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10c2.5 2 8.5 2 11 0"/>
      <path d="M11 10l1.5-1"/>
      <path d="M4 8.5V5.5a3.5 3.5 0 0 1 7 0v3"/>
    </svg>
  ),
  shopify: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2L10 5l3-.5-.5 7.5-5 2-5-2L2 4.5 5 5l.5-3"/>
      <path d="M5.5 2a2.5 2.5 0 0 0 4 0"/>
      <path d="M7.5 7v5"/>
    </svg>
  ),
  tiktok_shop: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 12.5a3.5 3.5 0 1 1 3.5-3.5V2c1 1 2.5 1.5 4 1.5"/>
    </svg>
  ),
  etsy: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 2.5h6v4h-4v2h3v4h-5"/>
    </svg>
  ),
}
