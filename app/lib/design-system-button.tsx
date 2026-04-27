'use client'

/**
 * Palvento Button — client component, split out of design-system.tsx so the
 * rest of design-system (pure-data style tokens) stays server-component-safe.
 *
 * Server components can import these design tokens without pulling in client
 * runtime; only files that actually need Button import this file.
 */

import React from 'react'
import { P, BTN_PRIMARY, BTN_SECONDARY, BTN_DARK, BTN_TEXT } from './design-system'

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'dark' | 'text'
  href?: string
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
  type?: 'button' | 'submit' | 'reset'
  arrow?: boolean
}

export function Button({ variant = 'primary', href, onClick, disabled, children, style, type = 'button', arrow }: ButtonProps) {
  const [hover, setHover] = React.useState(false)
  const [active, setActive] = React.useState(false)

  const base =
    variant === 'secondary' ? BTN_SECONDARY :
    variant === 'dark'      ? BTN_DARK      :
    variant === 'text'      ? BTN_TEXT      :
                              BTN_PRIMARY

  const resolved: React.CSSProperties = {
    ...base,
    ...(hover && !disabled && variant === 'primary' ? {
      background: P.cobaltDk,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 4px rgba(11,15,26,0.10), 0 10px 28px -8px ${P.cobaltGlow}`,
      transform: 'translateY(-1px)',
    } : {}),
    ...(hover && !disabled && variant === 'secondary' ? {
      background: P.raised,
      borderColor: 'rgba(11,15,26,0.28)',
      boxShadow: '0 1px 3px rgba(11,15,26,0.08)',
    } : {}),
    ...(hover && !disabled && variant === 'dark' ? {
      background: P.inkSoft,
      transform: 'translateY(-1px)',
    } : {}),
    ...(active && !disabled ? { transform: 'translateY(0) scale(0.985)' } : {}),
    ...(disabled ? { opacity: 0.55, cursor: 'not-allowed', transform: 'none' } : {}),
    ...style,
  }

  const content = (
    <>
      {children}
      {arrow && <span style={{ fontFamily: 'var(--font-mono), monospace', opacity: 0.85 }}>→</span>}
    </>
  )

  const handlers = {
    onMouseEnter: () => !disabled && setHover(true),
    onMouseLeave: () => { setHover(false); setActive(false) },
    onMouseDown: () => !disabled && setActive(true),
    onMouseUp: () => setActive(false),
  }

  if (href && !disabled) {
    return <a href={href} style={resolved} {...handlers}>{content}</a>
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={resolved} {...handlers}>
      {content}
    </button>
  )
}
