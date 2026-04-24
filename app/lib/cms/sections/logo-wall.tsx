/** LogoWallSection — row of logo names (no image, typographic treatment). */
import type { LogoWallSection as LogoWallProps } from '../types'
import { P, MONO } from '../../design-system'

export function LogoWallSection(props: LogoWallProps['props']) {
  const { eyebrow, logos } = props
  return (
    <section style={{ padding: '56px 32px', background: P.bg, borderBottom: `1px solid ${P.rule}` }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', textAlign: 'center' }}>
        {eyebrow && (
          <div style={{ ...MONO, fontSize: 10, fontWeight: 600, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 20 }}>
            {eyebrow}
          </div>
        )}
        <div style={{
          display: 'flex',
          gap: 40,
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {logos.map((l) => (
            <span
              key={l.name}
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: P.muted,
                letterSpacing: '-0.01em',
                fontFamily: "'Instrument Serif', Georgia, serif",
              }}
            >
              {l.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
