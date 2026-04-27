/* ─────────────────────────────────────────────────────────────────────────────
   Palvento Design System
   Shared constants + style objects for all product surfaces.
   Import { P, CARD, MONO, ... } from '@/app/lib/design-system'
   ───────────────────────────────────────────────────────────────────────────── */
import React from 'react'

/* ── Palette ── Ramp-style warm cream + orange (2026-04-21 pivot) ─────────
 * Single-accent brand. Variable name `cobalt` retained for backward compat
 * with existing importers; value is now a warm burnished orange.
 */
export const P = {
  bg:         '#f8f4ec',   // warm cream page bg
  surface:    '#ffffff',   // pure white cards
  raised:     '#fdfaf2',   // elevated warm-white
  ink:        '#0b0f1a',   // near-black text
  inkSoft:    '#1c2233',   // darker text variant
  rule:       'rgba(11,15,26,0.10)',
  ruleSoft:   'rgba(11,15,26,0.06)',
  muted:      '#5a6171',
  mutedDk:    '#2c3142',
  cobalt:     '#e8863f',   // accent — warm burnished orange (was #1d5fdb)
  cobaltDk:   '#c46f2a',   // darker orange for hover states
  cobaltSft:  'rgba(232,134,63,0.12)',
  cobaltGlow: 'rgba(232,134,63,0.35)',
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

/* ── Primary button — orange accent fill, white text, glow + inset highlight.
 * Ramp / Mercury / Stripe-level treatment: tight padding, 8px radius, medium
 * weight, tight letter-spacing, accent-glow shadow, contact shadow for depth,
 * subtle top highlight. Use the <Button> component for hover + active + focus
 * states; the style object is for plain anchors / links that can't use it.
 */
export const BTN_PRIMARY: React.CSSProperties = {
  background: P.cobalt,
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  padding: '11px 20px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '-0.005em',
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(11,15,26,0.08), 0 6px 18px -6px ${P.cobaltGlow}`,
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  transition: 'transform 140ms cubic-bezier(.2,.7,.2,1), background 140ms, box-shadow 140ms',
}

/* ── Secondary button — white surface, thin border, subtle contact shadow. */
export const BTN_SECONDARY: React.CSSProperties = {
  background: P.surface,
  color: P.ink,
  border: `1px solid rgba(11,15,26,0.14)`,
  borderRadius: '8px',
  padding: '11px 20px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '-0.005em',
  boxShadow: '0 1px 2px rgba(11,15,26,0.05)',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  transition: 'background 140ms, border-color 140ms, box-shadow 140ms',
}

/* ── Dark button — ink fill, cream text. Used for "Start free" nav-slot where
 * a strong visual anchor matters but orange would over-compete with the hero. */
export const BTN_DARK: React.CSSProperties = {
  ...BTN_PRIMARY,
  background: P.ink,
  color: P.bg,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(11,15,26,0.15), 0 6px 18px -8px rgba(11,15,26,0.22)`,
}

/* ── Tertiary — text-only with a chevron. */
export const BTN_TEXT: React.CSSProperties = {
  background: 'transparent',
  color: P.ink,
  border: 'none',
  padding: '8px 4px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '-0.005em',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
}

/* ── <Button> — React component variant of the above. Handles hover, active,
 * and focus-visible states automatically. Use this for any new button. */
// Button + ButtonProps live in ./design-system-button.tsx (a 'use client' file)
// so server components importing the tokens above don't pull in the client
// runtime. Re-exported here so existing import sites keep working.
export { Button, type ButtonProps } from './design-system-button'

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
