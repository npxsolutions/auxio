/** StepFlowSection — numbered horizontal steps with duration badges. */
import type { StepFlowSection as StepFlowProps } from '../types'
import { P, HEADING, MONO } from '../../design-system'

export function StepFlowSection(props: StepFlowProps['props']) {
  const { eyebrow, title, subtitle, steps } = props
  return (
    <section style={{ padding: '80px 32px', background: '#fff', borderBottom: `1px solid ${P.rule}` }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        {eyebrow && (
          <div style={{ ...MONO, fontSize: 11, fontWeight: 600, color: P.cobalt, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>
            {eyebrow}
          </div>
        )}
        {title && (
          <h2 style={{ ...HEADING, fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.02em', color: P.ink, margin: '0 0 12px' }}>
            {title}
          </h2>
        )}
        {subtitle && <p style={{ fontSize: 16, color: P.mutedDk, margin: '0 0 48px', maxWidth: 720 }}>{subtitle}</p>}

        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 20,
                     gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((s, i) => (
            <li key={i} style={{ border: `1px solid ${P.rule}`, padding: 20, background: P.bg, position: 'relative' }}>
              <div style={{ ...MONO, fontSize: 10, color: P.cobalt, letterSpacing: '0.12em', marginBottom: 10 }}>
                STEP {String(i + 1).padStart(2, '0')}
                {s.duration ? ` · ${s.duration}` : ''}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: P.ink, marginBottom: 6 }}>{s.label}</div>
              {s.description && <div style={{ fontSize: 13, color: P.mutedDk, lineHeight: 1.5 }}>{s.description}</div>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
