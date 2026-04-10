'use client'

import { useState } from 'react'

const BRANDS = [
  {
    id: 'velo',
    name: 'Velo',
    tagline: 'Sell fast. Stay ahead.',
    primary: '#a8e63d',
    bg: '#0d0d0d',
    text: '#ffffff',
    accent: '#a8e63d',
    fontVar: 'var(--font-bricolage)',
    feel: ['Fast-twitch energy', 'Precision-built', 'No lag, no friction'],
    swatchLabel: '#A8E63D',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <polygon points="8,40 24,8 40,40" stroke="#a8e63d" strokeWidth="3" fill="none" strokeLinejoin="round"/>
        <line x1="14" y1="32" x2="34" y2="32" stroke="#a8e63d" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="24" cy="8" r="3" fill="#a8e63d"/>
      </svg>
    ),
  },
  {
    id: 'helm',
    name: 'Helm',
    tagline: "You're in control.",
    primary: '#f0a500',
    bg: '#0f2d5c',
    text: '#ffffff',
    accent: '#f0a500',
    fontVar: 'var(--font-playfair)',
    feel: ['Authoritative calm', 'Built to last', 'Command without chaos'],
    swatchLabel: '#F0A500',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="18" stroke="#f0a500" strokeWidth="2.5" fill="none"/>
        <circle cx="24" cy="24" r="5" fill="#f0a500"/>
        {[0,45,90,135,180,225,270,315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          const x1 = 24 + 8 * Math.cos(rad), y1 = 24 + 8 * Math.sin(rad)
          const x2 = 24 + 16 * Math.cos(rad), y2 = 24 + 16 * Math.sin(rad)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f0a500" strokeWidth="2.5" strokeLinecap="round"/>
        })}
        {[0,60,120,180,240,300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          return <circle key={i} cx={24 + 18 * Math.cos(rad)} cy={24 + 18 * Math.sin(rad)} r="2.5" fill="#f0a500"/>
        })}
      </svg>
    ),
  },
  {
    id: 'grafter',
    name: 'Grafter',
    tagline: 'Built for sellers who graft.',
    primary: '#c8f060',
    bg: '#1a3a2a',
    text: '#f5f0e8',
    accent: '#c8f060',
    fontVar: 'var(--font-barlow)',
    feel: ['No nonsense', 'Earned, not given', 'Pure British grit'],
    swatchLabel: '#1A3A2A',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="10" y="20" width="28" height="6" rx="3" stroke="#c8f060" strokeWidth="2.5" fill="none"/>
        <rect x="10" y="30" width="28" height="6" rx="3" stroke="#c8f060" strokeWidth="2.5" fill="none"/>
        <rect x="10" y="10" width="28" height="6" rx="3" fill="#c8f060"/>
        <line x1="38" y1="13" x2="44" y2="7" stroke="#c8f060" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="44" y1="7" x2="44" y2="12" stroke="#c8f060" strokeWidth="2" strokeLinecap="round"/>
        <line x1="44" y1="7" x2="39" y2="7" stroke="#c8f060" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'relay',
    name: 'Relay',
    tagline: 'One listing. Every channel.',
    primary: '#2563eb',
    bg: '#f8faff',
    text: '#0a0f2e',
    accent: '#2563eb',
    fontVar: 'var(--font-outfit)',
    feel: ['Frictionless flow', 'Instant handoff', 'Always in motion'],
    swatchLabel: '#2563EB',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="10" cy="24" r="5" fill="#2563eb"/>
        <circle cx="28" cy="14" r="5" fill="#2563eb" fillOpacity="0.7"/>
        <circle cx="28" cy="34" r="5" fill="#2563eb" fillOpacity="0.7"/>
        <circle cx="42" cy="10" r="3" fill="#2563eb" fillOpacity="0.4"/>
        <circle cx="42" cy="24" r="3" fill="#2563eb" fillOpacity="0.4"/>
        <circle cx="42" cy="38" r="3" fill="#2563eb" fillOpacity="0.4"/>
        <line x1="15" y1="21" x2="23" y2="16" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
        <line x1="15" y1="27" x2="23" y2="32" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
        <line x1="33" y1="13" x2="39" y2="11" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="33" y1="16" x2="39" y2="23" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="33" y1="32" x2="39" y2="25" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="33" y1="35" x2="39" y2="37" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'stackd',
    name: 'Stackd',
    tagline: 'Stack your channels. Stack your profit.',
    primary: '#c4ff00',
    bg: '#180a2e',
    text: '#ffffff',
    accent: '#c4ff00',
    fontVar: 'var(--font-syne)',
    feel: ['Maximalist ambition', 'Layer by layer', 'Always building'],
    swatchLabel: '#C4FF00',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="34" width="32" height="7" rx="2" fill="#c4ff00"/>
        <rect x="12" y="25" width="24" height="7" rx="2" fill="#c4ff00" fillOpacity="0.7"/>
        <rect x="16" y="16" width="16" height="7" rx="2" fill="#c4ff00" fillOpacity="0.45"/>
        <rect x="20" y="8" width="8" height="6" rx="2" fill="#c4ff00" fillOpacity="0.2"/>
      </svg>
    ),
  },
  {
    id: 'kova',
    name: 'Kova',
    tagline: 'The smarter way to sell.',
    primary: '#ff6b47',
    bg: '#1c1917',
    text: '#fafaf9',
    accent: '#ff6b47',
    fontVar: 'var(--font-cormorant)',
    feel: ['Refined intelligence', 'Quietly powerful', 'Warm precision'],
    swatchLabel: '#FF6B47',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <polygon points="24,6 42,18 42,30 24,42 6,30 6,18" stroke="#ff6b47" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
        <polygon points="24,14 34,20 34,28 24,34 14,28 14,20" fill="#ff6b47" fillOpacity="0.15" stroke="#ff6b47" strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx="24" cy="24" r="4" fill="#ff6b47"/>
      </svg>
    ),
  },
]

export default function BrandConceptsClient() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '60px 48px 80px' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .brand-card {
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
          cursor: pointer; border-radius: 20px; overflow: hidden; position: relative;
        }
        .brand-card:hover { transform: translateY(-6px) scale(1.01); }
        .brand-card.selected { transform: translateY(-4px) scale(1.02); }
        .select-btn {
          transition: all 0.2s ease; cursor: pointer; border: none;
          font-size: 13px; font-weight: 700; letter-spacing: 0.04em;
          padding: 12px 0; width: 100%; border-radius: 10px;
        }
        .select-btn:hover { filter: brightness(1.12); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .brand-card { animation: fadeUp 0.5s ease both; }
        .brand-card:nth-child(1) { animation-delay: 0.05s; }
        .brand-card:nth-child(2) { animation-delay: 0.12s; }
        .brand-card:nth-child(3) { animation-delay: 0.19s; }
        .brand-card:nth-child(4) { animation-delay: 0.26s; }
        .brand-card:nth-child(5) { animation-delay: 0.33s; }
        .brand-card:nth-child(6) { animation-delay: 0.40s; }
        .selected-banner { animation: fadeUp 0.4s ease both; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '20px' }}>
          Brand Identity Concepts
        </div>
        <h1 style={{ fontSize: '42px', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', marginBottom: '12px', lineHeight: 1.1 }}>
          Choose your identity
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.35)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
          Six distinct directions for your brand. Each has its own character, colour system, and market position.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {BRANDS.map(brand => {
          const isSelected = selected === brand.id
          const isLight = brand.id === 'relay'

          return (
            <div
              key={brand.id}
              className={`brand-card${isSelected ? ' selected' : ''}`}
              style={{
                background: brand.bg,
                border: isSelected ? `2px solid ${brand.accent}` : '2px solid transparent',
                boxShadow: isSelected
                  ? `0 0 0 4px ${brand.accent}22, 0 24px 48px ${brand.accent}18`
                  : '0 4px 24px rgba(0,0,0,0.4)',
              }}
              onClick={() => setSelected(isSelected ? null : brand.id)}
            >
              {isSelected && (
                <div style={{ position: 'absolute', top: '16px', right: '16px', background: brand.accent, color: isLight ? '#0a0f2e' : brand.bg, fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', fontFamily: brand.fontVar }}>
                  Selected
                </div>
              )}

              <div style={{ padding: '36px 32px 28px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ marginBottom: '20px' }}>{brand.icon}</div>
                  <div style={{ fontFamily: brand.fontVar, fontSize: '38px', fontWeight: 700, color: brand.text, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '8px' }}>
                    {brand.name}
                  </div>
                  <div style={{ fontFamily: brand.fontVar, fontSize: '13px', color: brand.accent, fontWeight: 500, fontStyle: brand.id === 'kova' ? 'italic' : 'normal', lineHeight: 1.4 }}>
                    {brand.tagline}
                  </div>
                </div>

                <div style={{ height: '1px', background: `${brand.text}12`, marginBottom: '20px' }} />

                {/* Swatches */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: brand.accent, flexShrink: 0, boxShadow: `0 0 12px ${brand.accent}60` }} />
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: brand.bg, border: `1px solid ${brand.text}20`, flexShrink: 0 }} />
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: brand.text, flexShrink: 0, opacity: 0.9 }} />
                  <span style={{ fontSize: '11px', color: `${brand.text}50`, fontWeight: 500, letterSpacing: '0.04em', marginLeft: '4px' }}>{brand.swatchLabel}</span>
                </div>

                {/* Feel */}
                <div style={{ marginBottom: '24px' }}>
                  {brand.feel.map((line, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: brand.accent, flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: `${brand.text}60`, lineHeight: 1.4, fontFamily: brand.fontVar }}>{line}</span>
                    </div>
                  ))}
                </div>

                <button
                  className="select-btn"
                  style={{
                    background: isSelected ? brand.accent : `${brand.accent}18`,
                    color: isSelected ? (isLight ? '#0a0f2e' : brand.bg) : brand.accent,
                    fontFamily: brand.fontVar,
                    border: `1px solid ${brand.accent}40`,
                  }}
                  onClick={e => { e.stopPropagation(); setSelected(isSelected ? null : brand.id) }}
                >
                  {isSelected ? '✓ Selected' : `Choose ${brand.name}`}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selection banner */}
      {selected && (() => {
        const b = BRANDS.find(x => x.id === selected)!
        const isLight = selected === 'relay'
        return (
          <div className="selected-banner" style={{ maxWidth: '1200px', margin: '32px auto 0', padding: '24px 32px', background: `${b.accent}12`, border: `1px solid ${b.accent}30`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: b.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, fontFamily: b.fontVar, color: isLight ? '#0a0f2e' : b.bg }}>{b.name[0]}</span>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', fontFamily: b.fontVar, marginBottom: '2px' }}>
                  You selected <span style={{ color: b.accent }}>{b.name}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                  Tell me and I'll rename the entire codebase to <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{b.name.toLowerCase()}</strong> in one go.
                </div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '4px 8px' }}>×</button>
          </div>
        )
      })()}

      <div style={{ textAlign: 'center', marginTop: '56px' }}>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.04em' }}>Internal · Brand direction selection</p>
      </div>
    </div>
  )
}
