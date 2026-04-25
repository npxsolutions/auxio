/** ProductPreviewSection — split copy + screenshot, image left or right. */
import Link from 'next/link'
import Image from 'next/image'
import type { ProductPreviewSection as ProductPreviewProps } from '../types'
import { P, HEADING, MONO, BTN_PRIMARY } from '../../design-system'

export function ProductPreviewSection(props: ProductPreviewProps['props']) {
  const { eyebrow, title, description, imageUrl, imageAlt, imagePosition = 'right', ctaLabel, ctaHref } = props
  const copyOrder = imagePosition === 'left' ? 2 : 1
  const imageOrder = imagePosition === 'left' ? 1 : 2

  return (
    <section style={{ padding: '88px 32px', background: P.bg, borderBottom: `1px solid ${P.rule}` }}>
      <div style={{
        maxWidth: 1160,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 56,
        alignItems: 'center',
      }}>
        <div style={{ order: copyOrder, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {eyebrow && (
            <div style={{ ...MONO, fontSize: 11, fontWeight: 600, color: P.cobalt, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              {eyebrow}
            </div>
          )}
          <h2 style={{ ...HEADING, fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.02em', color: P.ink, margin: 0 }}>
            {title}
          </h2>
          {description && (
            <p style={{ fontSize: 16, color: P.inkSoft, lineHeight: 1.6, margin: 0, maxWidth: 480 }}>
              {description}
            </p>
          )}
          {ctaLabel && ctaHref && (
            <Link
              href={ctaHref}
              style={{ ...BTN_PRIMARY, padding: '10px 18px', fontSize: 13, alignSelf: 'flex-start', marginTop: 8 }}
            >
              {ctaLabel}
            </Link>
          )}
        </div>
        <div style={{ order: imageOrder, position: 'relative', aspectRatio: '4 / 3', background: '#fff', border: `1px solid ${P.rule}` }}>
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>
    </section>
  )
}
