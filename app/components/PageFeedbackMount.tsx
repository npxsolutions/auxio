'use client'

import { usePathname } from 'next/navigation'
import { PageFeedback } from './PageFeedback'

const ALLOWED = new Set([
  '/dashboard',
  '/listings',
  '/orders',
  '/financials',
  '/repricing',
  '/forecasting',
  '/onboarding',
])

/**
 * Renders the PageFeedback footer as a floating strip at the bottom of the
 * viewport, only on top-level product surfaces. Mounted once in the root
 * layout so it applies without editing each product page.
 */
export function PageFeedbackMount() {
  const pathname = usePathname() || ''
  if (!ALLOWED.has(pathname)) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: 240, // clear of 220px sidebar + a little breathing room
        right: 24,
        bottom: 0,
        zIndex: 90,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          maxWidth: 760,
          margin: '0 auto',
          background: 'rgba(243,240,234,0.92)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          borderTop: '1px solid #e4dfd4',
          borderLeft: '1px solid #e4dfd4',
          borderRight: '1px solid #e4dfd4',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          padding: '0 16px',
        }}
      >
        <PageFeedback />
      </div>
    </div>
  )
}
