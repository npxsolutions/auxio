/** FaqSection — collapsible FAQ list using native <details>/<summary>. */
import type { FaqSection as FaqProps } from '../types'
import { P, HEADING, MONO } from '../../design-system'

export function FaqSection(props: FaqProps['props']) {
  const { eyebrow, title, items } = props
  return (
    <section style={{ padding: '80px 32px', background: '#fff', borderBottom: `1px solid ${P.rule}` }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
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

        <div style={{ borderTop: `1px solid ${P.rule}` }}>
          {items.map((item, i) => (
            <details
              key={i}
              style={{ borderBottom: `1px solid ${P.rule}`, padding: '20px 0' }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 500,
                  color: P.ink,
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 20,
                }}
              >
                {item.question}
                <span style={{ color: P.muted, fontSize: 20, lineHeight: 1 }}>+</span>
              </summary>
              <div style={{ marginTop: 12, fontSize: 14, color: P.mutedDk, lineHeight: 1.6 }}>
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
