/** PricingTableSection — N-tier pricing grid with a highlighted recommended tier. */
import Link from 'next/link'
import type { PricingTableSection as PricingTableProps } from '../types'
import { P, HEADING, MONO, BTN_PRIMARY, BTN_SECONDARY } from '../../design-system'

export function PricingTableSection(props: PricingTableProps['props']) {
  const { eyebrow, title, tiers } = props
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

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tiers.length}, minmax(0, 1fr))`, gap: 16 }}>
          {tiers.map((t) => (
            <div
              key={t.name}
              style={{
                background: '#fff',
                border: t.highlight ? `2px solid ${P.cobalt}` : `1px solid ${P.rule}`,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {t.highlight && (
                <span style={{
                  position: 'absolute', top: -12, left: 16,
                  background: P.cobalt, color: '#fff', padding: '4px 10px',
                  ...MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  Recommended
                </span>
              )}
              <div style={{ fontSize: 16, fontWeight: 600, color: P.ink, marginBottom: 6 }}>{t.name}</div>
              <div style={{ fontSize: 38, fontWeight: 700, color: P.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {t.price}
                {t.cadence && <span style={{ fontSize: 14, fontWeight: 400, color: P.muted, marginLeft: 4 }}>{t.cadence}</span>}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {t.features.map((f, idx) => (
                  <li key={idx} style={{ fontSize: 13, color: P.inkSoft, display: 'flex', gap: 8, lineHeight: 1.4 }}>
                    <span style={{ color: P.cobalt }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={t.ctaHref}
                style={{
                  ...(t.highlight ? BTN_PRIMARY : BTN_SECONDARY),
                  textAlign: 'center',
                  padding: '10px 18px',
                  fontSize: 13,
                  marginTop: 'auto',
                }}
              >
                {t.ctaLabel}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
