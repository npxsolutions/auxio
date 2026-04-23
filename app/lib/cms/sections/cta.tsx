/**
 * CtaSection — closing action block with title, description, and up to 2 CTAs.
 */

import Link from 'next/link'
import type { CtaSection as CtaProps } from '../types'
import { P, HEADING, BTN_PRIMARY, BTN_SECONDARY } from '../../design-system'

export function CtaSection(props: CtaProps['props']) {
  const {
    title,
    description,
    primaryLabel,
    primaryHref,
    secondaryLabel,
    secondaryHref,
  } = props

  return (
    <section
      style={{
        background: P.raised,
        padding: '96px 32px',
        borderTop: `1px solid ${P.rule}`,
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2
          style={{
            ...HEADING,
            fontSize: 'clamp(32px, 4vw, 44px)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: P.ink,
            margin: '0 0 20px',
          }}
        >
          {title}
        </h2>

        {description && (
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: P.mutedDk,
              margin: '0 0 32px',
            }}
          >
            {description}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Link href={primaryHref} style={{ ...BTN_PRIMARY, padding: '12px 22px', fontSize: 15 }}>
            {primaryLabel}
          </Link>
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              style={{ ...BTN_SECONDARY, padding: '12px 22px', fontSize: 15 }}
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
