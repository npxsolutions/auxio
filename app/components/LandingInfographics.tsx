'use client'

// ── 1. ONE LISTING → 3 CHANNEL-OPTIMISED VERSIONS ──────────────────────────
export function ChannelOptimisationInfographic() {
  const channels = [
    {
      icon: '🛒',
      name: 'eBay',
      color: '#E53238',
      bg: '#fff5f5',
      border: '#fecaca',
      badge: 'Cassini-optimised',
      title: 'Nike Air Max 90 Mens Running Trainers White Black Size 10  New',
      bullets: ['Keyword-rich title', '80-char limit respected', 'Condition + category set'],
    },
    {
      icon: '🛍️',
      name: 'Shopify',
      color: '#96BF48',
      bg: '#f5faee',
      border: '#c6e29b',
      badge: 'Brand-forward',
      title: 'Nike Air Max 90 — Iconic comfort, refined for everyday wear',
      bullets: ['Brand story lead', 'Lifestyle-focused copy', 'SEO meta description'],
    },
    {
      icon: '📦',
      name: 'Amazon',
      color: '#FF9900',
      bg: '#fffbf0',
      border: '#fcd89a',
      badge: 'A9 algorithm',
      title: 'Nike Air Max 90 Mens Trainers | Lightweight |  10 | White/Black',
      bullets: ['Bullet-point format', 'Backend keywords filled', 'ASIN-ready attributes'],
    },
  ]

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 0 16px' }}>
      {/* Source listing */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
        <div style={{ background: '#191919', borderRadius: '12px', padding: '18px 32px', textAlign: 'center', minWidth: '260px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>You create once</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>Nike Air Max 90 —  10</div>
          <div style={{ fontSize: '12px', color: '#888' }}>Title · Description · Images · Price</div>
        </div>
      </div>

      {/* Arrow + AI badge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px', gap: '0' }}>
        <div style={{ width: '2px', height: '20px', background: '#e8e8e5' }} />
        <div style={{ background: '#f0f7ff', border: '1.5px solid #c7dff7', borderRadius: '100px', padding: '5px 14px', fontSize: '12px', fontWeight: 700, color: '#2383e2' }}>
          🤖 Auxio AI optimises per channel
        </div>
        <div style={{ width: '2px', height: '16px', background: '#e8e8e5' }} />
        {/* Spread line */}
        <div style={{ width: '72%', height: '2px', background: '#e8e8e5', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: '-5px', width: '12px', height: '12px', borderRadius: '50%', background: '#e8e8e5' }} />
          <div style={{ position: 'absolute', left: '50%', top: '-5px', transform: 'translateX(-50%)', width: '12px', height: '12px', borderRadius: '50%', background: '#e8e8e5' }} />
          <div style={{ position: 'absolute', right: 0, top: '-5px', width: '12px', height: '12px', borderRadius: '50%', background: '#e8e8e5' }} />
        </div>
      </div>

      {/* Channel cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '8px' }}>
        {channels.map(ch => (
          <div key={ch.name} style={{ background: ch.bg, border: `1.5px solid ${ch.border}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px' }}>{ch.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#191919' }}>{ch.name}</span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: ch.color, background: 'white', border: `1px solid ${ch.border}`, padding: '2px 7px', borderRadius: '100px' }}>{ch.badge}</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#191919', lineHeight: 1.4, background: 'white', padding: '10px 12px', borderRadius: '7px', border: `1px solid ${ch.border}` }}>
              "{ch.title}"
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {ch.bullets.map(b => (
                <li key={b} style={{ fontSize: '11px', color: '#787774', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: ch.color, fontWeight: 700, fontSize: '13px' }}>✓</span>{b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 2. TRUE PROFIT WATERFALL ─────────────────────────────────────────────────
export function TrueProfitWaterfall() {
  const steps = [
    { label: 'Sale price',    value: 100, cumulative: 100,  type: 'start',  color: '#2383e2', bg: '#f0f7ff'  },
    { label: 'eBay fees',     value: -12, cumulative: 88,   type: 'cost',   color: '#c9372c', bg: '#fce8e6'  },
    { label: 'Shipping',      value: -5,  cumulative: 83,   type: 'cost',   color: '#c9372c', bg: '#fce8e6'  },
    { label: 'Ad spend',      value: -8,  cumulative: 75,   type: 'cost',   color: '#c9372c', bg: '#fce8e6'  },
    { label: 'Cost of goods', value: -52, cumulative: 23,   type: 'cost',   color: '#c9372c', bg: '#fce8e6'  },
    { label: 'True profit',   value: 23,  cumulative: 23,   type: 'result', color: '#0f7b6c', bg: '#e8f5f3'  },
  ]

  const maxValue = 100
  const barHeight = 32

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Example: £100 eBay sale</div>
        <div style={{ fontSize: '11px', color: '#9b9b98' }}>True margin: <strong style={{ color: '#0f7b6c' }}>23%</strong></div>
      </div>

      {steps.map((step, i) => {
        const width = Math.abs(step.value) / maxValue * 100
        const isCost = step.type === 'cost'
        const isResult = step.type === 'result'
        return (
          <div key={step.label} style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '100px', fontSize: '12px', textAlign: 'right', flexShrink: 0, fontWeight: isResult ? 700 : 400, color: isResult ? '#0f7b6c' : '#787774' }}>
              {step.label}
            </div>
            <div style={{ flex: 1, position: 'relative', height: `${barHeight}px`, background: '#f7f7f5', borderRadius: '6px', overflow: 'hidden' }}>
              {step.type === 'start' && (
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '100%', background: '#e8f1fb', borderRadius: '6px' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${width}%`, background: step.color, borderRadius: '6px', opacity: 0.8 }} />
                </div>
              )}
              {isCost && (
                <div style={{ position: 'absolute', left: `${step.cumulative / maxValue * 100}%`, top: 0, height: '100%', width: `${width}%`, background: '#fce8e6', borderRadius: '4px', border: '1px solid #f5c2bb' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '100%', background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(201,55,44,0.12) 4px, rgba(201,55,44,0.12) 8px)', borderRadius: '4px' }} />
                </div>
              )}
              {isResult && (
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${width}%`, background: step.color, borderRadius: '6px', opacity: 0.85 }} />
              )}
              {/* Running total line */}
              {!isResult && (
                <div style={{ position: 'absolute', left: `${step.cumulative / maxValue * 100}%`, top: 0, bottom: 0, width: '2px', background: '#191919', opacity: 0.15 }} />
              )}
            </div>
            <div style={{ width: '52px', textAlign: 'right', flexShrink: 0 }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: isCost ? '#c9372c' : isResult ? '#0f7b6c' : '#2383e2' }}>
                {isCost ? '' : ''}£{Math.abs(step.value)}
              </span>
            </div>
          </div>
        )
      })}

      {/* Footer note */}
      <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f7f7f5', borderRadius: '8px', border: '1px solid #e8e8e5', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '16px' }}>💡</span>
        <div style={{ fontSize: '12px', color: '#787774', lineHeight: 1.5 }}>
          Most sellers think they made £100. Auxio shows you made <strong style={{ color: '#0f7b6c' }}>£23</strong> — and which channel, product, and ad spend drove it.
        </div>
      </div>
    </div>
  )
}

// ── 3. TIME SAVED COMPARISON ─────────────────────────────────────────────────
export function TimeSavedInfographic() {
  const tasks = [
    { task: 'Write eBay listing',     manual: 45, auxio: 0,  auxioNote: 'AI writes it' },
    { task: 'Write Shopify listing',  manual: 40, auxio: 0,  auxioNote: 'AI writes it' },
    { task: 'Write Amazon listing',   manual: 50, auxio: 0,  auxioNote: 'AI writes it' },
    { task: 'Upload & format images', manual: 20, auxio: 5,  auxioNote: '1 upload' },
    { task: 'Set pricing & stock',    manual: 10, auxio: 3,  auxioNote: 'Once, syncs everywhere' },
    { task: 'Validate & fix errors',  manual: 30, auxio: 2,  auxioNote: 'Feed health catches it' },
  ]

  const maxManual = Math.max(...tasks.map(t => t.manual))

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

        {/* WITHOUT AUXIO */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#c9372c' }} />
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919' }}>Without Auxio</div>
          </div>
          {tasks.map(t => (
            <div key={t.task} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: '11px', color: '#787774' }}>{t.task}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#c9372c' }}>{t.manual}m</span>
              </div>
              <div style={{ height: '8px', background: '#f7f7f5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${t.manual / maxManual * 100}%`, background: '#fca5a5', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '16px', padding: '12px 16px', background: '#fce8e6', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#c9372c', letterSpacing: '-0.02em' }}>3h 15m</div>
            <div style={{ fontSize: '12px', color: '#c9372c', marginTop: '2px' }}>per new product launch</div>
          </div>
        </div>

        {/* WITH AUXIO */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0f7b6c' }} />
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#191919' }}>With Auxio</div>
          </div>
          {tasks.map(t => (
            <div key={t.task} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: '11px', color: '#787774' }}>{t.auxioNote}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: t.auxio === 0 ? '#0f7b6c' : '#0f7b6c' }}>
                  {t.auxio === 0 ? '✓ auto' : `${t.auxio}m`}
                </span>
              </div>
              <div style={{ height: '8px', background: '#f7f7f5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: t.auxio === 0 ? '4%' : `${t.auxio / maxManual * 100}%`,
                  background: t.auxio === 0 ? '#b7e4d8' : '#0f7b6c',
                  borderRadius: '4px',
                }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '16px', padding: '12px 16px', background: '#e8f5f3', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f7b6c', letterSpacing: '-0.02em' }}>~10m</div>
            <div style={{ fontSize: '12px', color: '#0f7b6c', marginTop: '2px' }}>per new product launch</div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ marginTop: '20px', background: '#191919', borderRadius: '10px', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ fontSize: '14px', color: '#888', lineHeight: 1.5 }}>
          If you launch <strong style={{ color: 'white' }}>5 products a week</strong>, Auxio saves you
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>15+ hours</div>
          <div style={{ fontSize: '12px', color: '#555' }}>every single week</div>
        </div>
      </div>
    </div>
  )
}
