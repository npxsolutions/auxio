/**
 * FeatureGridSection — N-column grid of feature cards.
 *
 * Each feature has a title, optional description, optional bullet list. Columns
 * default to 2; a grid-template-columns lookup handles 2 / 3 / 4.
 */

import type { FeatureGridSection as FeatureGridProps } from '../types'
import { P, CARD, HEADING, MONO } from '../../design-system'

const columnTemplates = {
  2: 'repeat(2, minmax(0, 1fr))',
  3: 'repeat(3, minmax(0, 1fr))',
  4: 'repeat(4, minmax(0, 1fr))',
} as const

export function FeatureGridSection(props: FeatureGridProps['props']) {
  const { eyebrow, title, features, columns = 2 } = props

  return (
    <section
      style={{
        background: P.surface,
        padding: '96px 32px',
        borderBottom: `1px solid ${P.rule}`,
      }}
    >
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        {(eyebrow || title) && (
          <div style={{ marginBottom: 56, maxWidth: 720 }}>
            {eyebrow && (
              <div
                style={{
                  ...MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  color: P.cobalt,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  marginBottom: 16,
                }}
              >
                {eyebrow}
              </div>
            )}
            {title && (
              <h2
                style={{
                  ...HEADING,
                  fontSize: 'clamp(28px, 3.5vw, 40px)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  color: P.ink,
                  margin: 0,
                }}
              >
                {title}
              </h2>
            )}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: columnTemplates[columns],
            gap: 24,
          }}
          className="cms-feature-grid"
        >
          {features.map((feature, i) => (
            <div
              key={`${feature.title}-${i}`}
              style={{
                ...CARD,
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: P.ink,
                  margin: 0,
                }}
              >
                {feature.title}
              </h3>

              {feature.description && (
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: P.mutedDk,
                    margin: 0,
                  }}
                >
                  {feature.description}
                </p>
              )}

              {feature.bullets && feature.bullets.length > 0 && (
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {feature.bullets.map((bullet, bi) => (
                    <li
                      key={bi}
                      style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: P.cobalt,
                          flexShrink: 0,
                          marginTop: 8,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 14,
                          lineHeight: 1.5,
                          color: P.inkSoft,
                        }}
                      >
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .cms-feature-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
