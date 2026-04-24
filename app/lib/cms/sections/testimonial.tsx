/** TestimonialSection — single pull-quote with attribution. */
import type { TestimonialSection as TestimonialProps } from '../types'
import { P, MONO } from '../../design-system'

export function TestimonialSection(props: TestimonialProps['props']) {
  const { quote, author, role, company } = props
  return (
    <section style={{ padding: '88px 32px', background: '#fff', borderBottom: `1px solid ${P.rule}` }}>
      <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
        <blockquote
          style={{
            margin: 0,
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(22px, 3vw, 32px)',
            fontStyle: 'italic',
            letterSpacing: '-0.01em',
            lineHeight: 1.35,
            color: P.ink,
          }}
        >
          &ldquo;{quote}&rdquo;
        </blockquote>
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: P.ink }}>{author}</span>
          {(role || company) && (
            <span style={{ ...MONO, fontSize: 10, color: P.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {[role, company].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
