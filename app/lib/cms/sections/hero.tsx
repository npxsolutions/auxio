/**
 * HeroSection — top-of-page headline block.
 *
 * Server component. Uses shared design-system tokens (P, HEADING, MONO, etc).
 * Supports an eyebrow label, headline, subhead, and up to two CTAs.
 */

import Link from 'next/link'
import type { HeroSection as HeroProps } from '../types'
import { P, HEADING, MONO, BTN_PRIMARY, BTN_SECONDARY } from '../../design-system'

export function HeroSection(props: HeroProps['props']) {
  const {
    eyebrow,
    headline,
    subhead,
    ctaLabel,
    ctaHref,
    secondaryCtaLabel,
    secondaryCtaHref,
    variant = 'default',
  } = props

  const isCentered = variant === 'centered'

  return (
    <section
      style={{
        background: P.bg,
        padding: '96px 32px 80px',
        borderBottom: `1px solid ${P.rule}`,
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          textAlign: isCentered ? 'center' : 'left',
        }}
      >
        {eyebrow && (
          <div
            style={{
              ...MONO,
              fontSize: 11,
              fontWeight: 600,
              color: P.cobalt,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: 20,
            }}
          >
            {eyebrow}
          </div>
        )}

        <h1
          style={{
            ...HEADING,
            fontSize: 'clamp(40px, 6vw, 72px)',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            color: P.ink,
            margin: '0 0 24px',
            maxWidth: isCentered ? '100%' : 880,
            ...(isCentered ? { marginLeft: 'auto', marginRight: 'auto' } : {}),
          }}
        >
          {headline}
        </h1>

        {subhead && (
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: P.mutedDk,
              margin: '0 0 40px',
              maxWidth: isCentered ? 640 : 640,
              ...(isCentered ? { marginLeft: 'auto', marginRight: 'auto' } : {}),
            }}
          >
            {subhead}
          </p>
        )}

        {(ctaLabel || secondaryCtaLabel) && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: isCentered ? 'center' : 'flex-start',
            }}
          >
            {ctaLabel && ctaHref && (
              <Link href={ctaHref} style={{ ...BTN_PRIMARY, padding: '12px 22px', fontSize: 15 }}>
                {ctaLabel}
              </Link>
            )}
            {secondaryCtaLabel && secondaryCtaHref && (
              <Link
                href={secondaryCtaHref}
                style={{ ...BTN_SECONDARY, padding: '12px 22px', fontSize: 15 }}
              >
                {secondaryCtaLabel}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
