/** StatCardSection — N-column grid of large numeric stats with optional deltas. */
import type { StatCardSection as StatCardProps } from '../types'
import { P, HEADING, MONO } from '../../design-system'

export function StatCardSection(props: StatCardProps['props']) {
  const { eyebrow, title, columns = 3, stats } = props
  return (
    <section style={{ padding: '88px 32px', background: P.bg, borderBottom: `1px solid ${P.rule}` }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        {eyebrow && (
          <div style={{ ...MONO, fontSize: 11, fontWeight: 600, color: P.cobalt, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14, textAlign: 'center' }}>
            {eyebrow}
          </div>
        )}
        {title && (
          <h2 style={{ ...HEADING, fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.02em', color: P.ink, margin: '0 0 48px', textAlign: 'center' }}>
            {title}
          </h2>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 16 }}>
          {stats.map((s, idx) => (
            <div
              key={idx}
              style={{
                background: '#fff',
                border: `1px solid ${P.rule}`,
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, color: P.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: P.inkSoft, lineHeight: 1.4 }}>
                {s.label}
              </div>
              {s.delta && (
                <div style={{ ...MONO, fontSize: 11, fontWeight: 600, color: P.cobalt, marginTop: 4 }}>
                  {s.delta}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
