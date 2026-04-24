/** IntegrationGridSection — N-column grid of named integrations with status chips. */
import type { IntegrationGridSection as IntegrationGridProps } from '../types'
import { P, HEADING, MONO } from '../../design-system'

const STATUS_COLOR: Record<'live' | 'beta' | 'coming_soon', string> = {
  live:        '#0f8a5b',
  beta:        '#b88404',
  coming_soon: P.muted,
}

export function IntegrationGridSection(props: IntegrationGridProps['props']) {
  const { eyebrow, title, columns = 4, integrations } = props
  return (
    <section style={{ padding: '72px 32px', background: P.bg, borderBottom: `1px solid ${P.rule}` }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        {eyebrow && (
          <div style={{ ...MONO, fontSize: 11, fontWeight: 600, color: P.cobalt, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>
            {eyebrow}
          </div>
        )}
        {title && (
          <h2 style={{ ...HEADING, fontSize: 'clamp(26px, 3.5vw, 38px)', letterSpacing: '-0.02em', color: P.ink, margin: '0 0 36px' }}>
            {title}
          </h2>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 16 }}>
          {integrations.map((i) => (
            <div key={i.name} style={{ background: '#fff', border: `1px solid ${P.rule}`, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: P.ink }}>{i.name}</div>
                {i.status && (
                  <span style={{ ...MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
                                 color: STATUS_COLOR[i.status], fontWeight: 600 }}>
                    {i.status.replaceAll('_', ' ')}
                  </span>
                )}
              </div>
              {i.description && <div style={{ fontSize: 13, color: P.mutedDk, lineHeight: 1.5 }}>{i.description}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
