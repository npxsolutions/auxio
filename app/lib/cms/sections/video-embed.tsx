/** VideoEmbedSection — responsive iframe with optional headline/subtitle. */
import type { VideoEmbedSection as VideoEmbedProps } from '../types'
import { P, HEADING, MONO } from '../../design-system'

const RATIO_TO_PADDING: Record<NonNullable<VideoEmbedProps['props']['aspectRatio']>, string> = {
  '16:9': '56.25%',
  '4:3':  '75%',
  '1:1':  '100%',
  '9:16': '177.78%',
}

export function VideoEmbedSection(props: VideoEmbedProps['props']) {
  const { eyebrow, title, subtitle, src, aspectRatio = '16:9' } = props
  return (
    <section style={{ padding: '88px 32px', background: P.bg, borderBottom: `1px solid ${P.rule}` }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {eyebrow && (
          <div style={{ ...MONO, fontSize: 11, fontWeight: 600, color: P.cobalt, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14, textAlign: 'center' }}>
            {eyebrow}
          </div>
        )}
        {title && (
          <h2 style={{ ...HEADING, fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.02em', color: P.ink, margin: '0 0 12px', textAlign: 'center' }}>
            {title}
          </h2>
        )}
        {subtitle && (
          <p style={{ fontSize: 16, color: P.inkSoft, lineHeight: 1.5, margin: '0 auto 36px', textAlign: 'center', maxWidth: 640 }}>
            {subtitle}
          </p>
        )}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: RATIO_TO_PADDING[aspectRatio],
          background: '#000',
          border: `1px solid ${P.rule}`,
        }}>
          <iframe
            src={src}
            title={title ?? 'Embedded video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
      </div>
    </section>
  )
}
