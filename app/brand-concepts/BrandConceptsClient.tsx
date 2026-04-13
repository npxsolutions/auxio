'use client'

import { useState } from 'react'

// Mini-site previews: render at 1040×600, scaled to fit 346px wide card
const IW = 1040
const IH = 600
const OW = 346
const S  = OW / IW   // ≈ 0.333
const OH = IH * S    // ≈ 200

// ── Brand mini-site previews ─────────────────────────────────────────────────

function VeloPreview() {
  // Velo: Dark teal + white. Clean SaaS. Like Vercel meets Linear.
  // Font: Plus Jakarta Sans
  const F = 'var(--font-jakarta)'
  const bg = '#0a0f0f'
  const acc = '#00c896'

  return (
    <div style={{ width: IW, height: IH, background: bg, fontFamily: F, position: 'relative', overflow: 'hidden' }}>
      {/* Subtle dot grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(0,200,150,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Nav */}
      <div style={{ position: 'relative', zIndex: 1, height: 60, display: 'flex', alignItems: 'center', padding: '0 56px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div style={{ width: 28, height: 28, background: acc, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 12L7 2L12 12" stroke="#0a0f0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="3.5" y1="9" x2="10.5" y2="9" stroke="#0a0f0f" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '-0.03em' }}>Velo</span>
        </div>
        <div style={{ display: 'flex', gap: 32, marginRight: 40 }}>
          {['Features','Integrations','Pricing'].map(t => (
            <span key={t} style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{t}</span>
          ))}
        </div>
        <div style={{ background: acc, borderRadius: 7, padding: '9px 22px', fontSize: 13, fontWeight: 600, color: '#0a0f0f' }}>
          Get started free
        </div>
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 1, padding: '72px 56px 0', maxWidth: 660 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)', borderRadius: 6, padding: '5px 14px', marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: acc }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: acc, letterSpacing: '0.02em' }}>Connected commerce for multichannel sellers</span>
        </div>
        <h1 style={{ fontSize: 58, fontWeight: 700, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Manage and scale<br />
          <span style={{ color: acc }}>every channel.</span>
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 40, maxWidth: 520 }}>
          One platform to manage orders, listings, and inventory across eBay, Amazon, Shopify and more. Real profit tracking included.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ background: acc, borderRadius: 7, padding: '13px 28px', fontSize: 14, fontWeight: 600, color: '#0a0f0f' }}>Start free trial</div>
          <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: '13px 28px', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>See demo</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {[['10 min','average setup'],['100%','inventory sync'],['8 channels','supported'],['No hidden fees','ever']].map(([v, l]) => (
          <div key={v} style={{ flex: 1, padding: '20px 28px', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 3 }}>{v}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HelmPreview() {
  // Helm: Clean white/light. Professional. Like Stripe or Notion.
  // Font: DM Sans. Navy #1e2d3d + sky blue #3b82f6
  const F = 'var(--font-dmsans)'
  const bg = '#ffffff'
  const navy = '#1e2d3d'
  const blue = '#3b82f6'

  return (
    <div style={{ width: IW, height: IH, background: bg, fontFamily: F, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 480, height: 480, background: 'radial-gradient(circle at 80% 20%, rgba(59,130,246,0.07) 0%, transparent 65%)' }} />

      {/* Nav */}
      <div style={{ position: 'relative', zIndex: 1, height: 60, display: 'flex', alignItems: 'center', padding: '0 56px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="11" stroke={blue} strokeWidth="2" fill="none"/>
            <circle cx="13" cy="13" r="3.5" fill={blue}/>
            {[0,60,120,180,240,300].map((deg, i) => {
              const r = (deg * Math.PI) / 180
              return <line key={i} x1={13 + 5.5 * Math.cos(r)} y1={13 + 5.5 * Math.sin(r)} x2={13 + 9.5 * Math.cos(r)} y2={13 + 9.5 * Math.sin(r)} stroke={blue} strokeWidth="1.8" strokeLinecap="round"/>
            })}
          </svg>
          <span style={{ fontWeight: 700, fontSize: 18, color: navy, letterSpacing: '-0.02em' }}>Helm</span>
        </div>
        <div style={{ display: 'flex', gap: 32, marginRight: 40 }}>
          {['Platform','Channels','Pricing'].map(t => (
            <span key={t} style={{ fontSize: 14, color: 'rgba(30,45,61,0.45)', fontWeight: 400 }}>{t}</span>
          ))}
        </div>
        <div style={{ background: blue, borderRadius: 7, padding: '9px 22px', fontSize: 13, fontWeight: 600, color: '#fff' }}>
          Get started
        </div>
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 1, padding: '68px 56px 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#eff6ff', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, padding: '5px 14px', marginBottom: 28 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: blue }}>Multichannel ecommerce, simplified</span>
        </div>
        <h1 style={{ fontSize: 58, fontWeight: 700, color: navy, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20, maxWidth: 640 }}>
          You're in control of<br />
          <span style={{ color: blue }}>every channel.</span>
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(30,45,61,0.5)', lineHeight: 1.7, marginBottom: 40, maxWidth: 520 }}>
          Manage orders, inventory, and listings across all your marketplaces from one dashboard. No more tabs. No more discrepancies.
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 48 }}>
          <div style={{ background: navy, borderRadius: 7, padding: '13px 28px', fontSize: 14, fontWeight: 600, color: '#fff' }}>Start free trial</div>
          <div style={{ border: '1px solid rgba(30,45,61,0.15)', borderRadius: 7, padding: '13px 28px', fontSize: 14, fontWeight: 500, color: 'rgba(30,45,61,0.6)' }}>See how it works →</div>
        </div>
        {/* Channel pills */}
        <div style={{ display: 'flex', gap: 10 }}>
          {['eBay','Amazon','Shopify','OnBuy','Etsy'].map(ch => (
            <div key={ch} style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: 'rgba(30,45,61,0.6)' }}>{ch}</div>
          ))}
          <div style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '7px 16px', fontSize: 13, color: blue, fontWeight: 600 }}>+3 more</div>
        </div>
      </div>
    </div>
  )
}

function GrafterPreview() {
  // Grafter: Dark slate. No-nonsense British. Like Basecamp or Framer dark.
  // Font: Manrope. Amber #f59e0b accent.
  const F = 'var(--font-manrope)'
  const bg = '#111827'
  const acc = '#f59e0b'

  return (
    <div style={{ width: IW, height: IH, background: bg, fontFamily: F, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 500, height: 300, background: 'radial-gradient(ellipse at 100% 100%, rgba(245,158,11,0.1) 0%, transparent 60%)' }} />

      {/* Nav */}
      <div style={{ position: 'relative', zIndex: 1, height: 60, display: 'flex', alignItems: 'center', padding: '0 56px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{ width: 28, height: 28, background: acc, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="3" width="12" height="2.5" rx="1" fill="#111827"/>
              <rect x="1" y="7" width="12" height="2.5" rx="1" fill="#111827" opacity="0.7"/>
              <rect x="1" y="11" width="8" height="2.5" rx="1" fill="#111827" opacity="0.4"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>Grafter</span>
        </div>
        <div style={{ display: 'flex', gap: 32, marginRight: 40 }}>
          {['Features','Pricing','About'].map(t => (
            <span key={t} style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>{t}</span>
          ))}
        </div>
        <div style={{ border: '1px solid rgba(245,158,11,0.4)', borderRadius: 7, padding: '9px 22px', fontSize: 13, fontWeight: 600, color: acc }}>
          Start free
        </div>
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 1, padding: '68px 56px 0', maxWidth: 660 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <span style={{ fontSize: 16 }}>🇬🇧</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Built for multichannel sellers</span>
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Less tabs.<br />
          More <span style={{ color: acc }}>selling.</span>
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 40, maxWidth: 500 }}>
          All your orders, listings, and stock in one straightforward platform. No bloat, no enterprise pricing, no nonsense.
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 52 }}>
          <div style={{ background: acc, borderRadius: 7, padding: '13px 28px', fontSize: 14, fontWeight: 700, color: '#111827' }}>Try Grafter free</div>
          <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '13px 28px', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>Watch a demo</div>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Straightforward','pricing'],['No contract','cancel any time'],['Global-first','support']].map(([v, l]) => (
            <div key={v}>
              <div style={{ fontSize: 13, fontWeight: 700, color: acc, marginBottom: 1 }}>{v}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RelayPreview() {
  // Relay: Soft white/cream. Warm and modern. Like Notion meets Linear.
  // Font: Work Sans. Green #16a34a accent.
  const F = 'var(--font-worksans)'
  const bg = '#fafaf8'
  const green = '#16a34a'
  const dark = '#1a1a1a'

  return (
    <div style={{ width: IW, height: IH, background: bg, fontFamily: F, position: 'relative', overflow: 'hidden' }}>
      {/* Nav */}
      <div style={{ position: 'relative', zIndex: 1, height: 60, display: 'flex', alignItems: 'center', padding: '0 56px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="8" cy="14" r="4" fill={green}/>
            <circle cx="20" cy="8" r="3" fill={green} fillOpacity="0.6"/>
            <circle cx="20" cy="20" r="3" fill={green} fillOpacity="0.6"/>
            <line x1="12" y1="12" x2="17" y2="9.5" stroke={green} strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="16" x2="17" y2="18.5" stroke={green} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 18, color: dark, letterSpacing: '-0.02em' }}>Relay</span>
        </div>
        <div style={{ display: 'flex', gap: 32, marginRight: 40 }}>
          {['Product','Integrations','Pricing'].map(t => (
            <span key={t} style={{ fontSize: 14, color: 'rgba(26,26,26,0.4)', fontWeight: 400 }}>{t}</span>
          ))}
        </div>
        <div style={{ background: dark, borderRadius: 7, padding: '9px 22px', fontSize: 13, fontWeight: 600, color: '#fff' }}>
          Start for free
        </div>
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 1, padding: '64px 56px 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 20, padding: '5px 14px', marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: green }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: green }}>One listing. Every channel.</span>
        </div>
        <h1 style={{ fontSize: 58, fontWeight: 600, color: dark, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 20, maxWidth: 620 }}>
          Automate and scale<br />
          your ecommerce.
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(26,26,26,0.5)', lineHeight: 1.7, marginBottom: 40, maxWidth: 500 }}>
          Manage inventory, orders, and listings across 8+ marketplaces from one place. No more discrepancies. No more manual work.
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 52 }}>
          <div style={{ background: green, borderRadius: 7, padding: '13px 28px', fontSize: 14, fontWeight: 600, color: '#fff' }}>Get started free</div>
          <div style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 7, padding: '13px 28px', fontSize: 14, fontWeight: 500, color: 'rgba(26,26,26,0.55)' }}>See all integrations →</div>
        </div>
        {/* Channel row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(26,26,26,0.35)', marginRight: 4, fontWeight: 500 }}>Works with:</span>
          {['eBay','Amazon','Shopify','OnBuy','Etsy','TikTok','+ more'].map((ch, i) => (
            <div key={ch} style={{ background: i === 6 ? 'transparent' : '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 500, color: i === 6 ? green : 'rgba(26,26,26,0.6)' }}>{ch}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StackdPreview() {
  // Stackd: Clean dark with indigo/violet. Modern B2B SaaS.
  // Font: Nunito Sans. Violet #8b5cf6 accent.
  const F = 'var(--font-nunito)'
  const bg = '#0e0e16'
  const acc = '#8b5cf6'

  return (
    <div style={{ width: IW, height: IH, background: bg, fontFamily: F, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -80, right: -80, width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 65%)', borderRadius: '50%' }} />

      {/* Nav */}
      <div style={{ position: 'relative', zIndex: 1, height: 60, display: 'flex', alignItems: 'center', padding: '0 56px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[16, 12, 8].map((w, i) => (
              <div key={i} style={{ width: w, height: 3.5, background: acc, borderRadius: 2, opacity: 1 - i * 0.2 }} />
            ))}
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>Stackd</span>
        </div>
        <div style={{ display: 'flex', gap: 32, marginRight: 40 }}>
          {['Features','Channels','Pricing'].map(t => (
            <span key={t} style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>{t}</span>
          ))}
        </div>
        <div style={{ background: acc, borderRadius: 7, padding: '9px 22px', fontSize: 13, fontWeight: 700, color: '#fff' }}>
          Try free
        </div>
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 1, padding: '68px 56px 0', display: 'flex', gap: 60, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, maxWidth: 560 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 6, padding: '5px 14px', marginBottom: 28 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}>Connected commerce for growing sellers</span>
          </div>
          <h1 style={{ fontSize: 54, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Stack your channels.<br />
            <span style={{ color: acc }}>Stack your profit.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
            Every channel you add is more revenue. Stackd keeps them all in sync, your stock accurate, and your margin visible.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ background: acc, borderRadius: 7, padding: '12px 26px', fontSize: 14, fontWeight: 700, color: '#fff' }}>Start stacking</div>
            <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '12px 26px', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>Watch demo</div>
          </div>
        </div>

        {/* Channel stack visual */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12 }}>
          {[
            { ch: 'eBay', col: '#E53238', orders: 24, status: 'Synced' },
            { ch: 'Amazon', col: '#FF9900', orders: 18, status: 'Synced' },
            { ch: 'OnBuy', col: '#0066cc', orders: 9, status: 'Synced' },
            { ch: 'Shopify', col: '#96bf48', orders: 6, status: 'Synced' },
          ].map(({ ch, col, orders, status }) => (
            <div key={ch} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1 }}>{ch}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{orders} orders</span>
              <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KovaPreview() {
  // Kova: Warm white. Premium minimal. Like Framer or Figma.
  // Font: Space Grotesk. Slate + coral #f97316 accent.
  const F = 'var(--font-space)'
  const bg = '#ffffff'
  const dark = '#18181b'
  const coral = '#f97316'

  return (
    <div style={{ width: IW, height: IH, background: bg, fontFamily: F, position: 'relative', overflow: 'hidden' }}>
      {/* Warm gradient background */}
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 600, height: 400, background: 'radial-gradient(ellipse at 100% 100%, rgba(249,115,22,0.06) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 400, height: 400, background: 'radial-gradient(ellipse at 0% 0%, rgba(249,115,22,0.04) 0%, transparent 60%)' }} />

      {/* Nav */}
      <div style={{ position: 'relative', zIndex: 1, height: 60, display: 'flex', alignItems: 'center', padding: '0 56px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <polygon points="13,2 24,8 24,18 13,24 2,18 2,8" stroke={coral} strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
            <circle cx="13" cy="13" r="3.5" fill={coral}/>
          </svg>
          <span style={{ fontWeight: 600, fontSize: 18, color: dark, letterSpacing: '-0.02em' }}>Kova</span>
        </div>
        <div style={{ display: 'flex', gap: 32, marginRight: 40 }}>
          {['Platform','Channels','Pricing'].map(t => (
            <span key={t} style={{ fontSize: 14, color: 'rgba(24,24,27,0.4)', fontWeight: 400 }}>{t}</span>
          ))}
        </div>
        <div style={{ border: '1px solid rgba(24,24,27,0.15)', borderRadius: 7, padding: '9px 22px', fontSize: 13, fontWeight: 500, color: dark }}>
          Get started
        </div>
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 1, padding: '68px 56px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(24,24,27,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>
          The smarter way to sell
        </div>
        <h1 style={{ fontSize: 60, fontWeight: 600, color: dark, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 22, maxWidth: 620 }}>
          All your channels.<br />
          <span style={{ color: coral }}>One platform.</span>
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(24,24,27,0.5)', lineHeight: 1.65, marginBottom: 40, maxWidth: 500, fontWeight: 400 }}>
          Connect eBay, Amazon, Shopify and more. Manage orders, sync inventory, and track true profit — automatically.
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 52 }}>
          <div style={{ background: coral, borderRadius: 7, padding: '13px 28px', fontSize: 14, fontWeight: 600, color: '#fff' }}>Start for free</div>
          <div style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 7, padding: '13px 28px', fontSize: 14, fontWeight: 500, color: 'rgba(24,24,27,0.5)' }}>Book a demo</div>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          {[['No credit card','required'],['Set up','in 10 minutes'],['Cancel','any time']].map(([v, l]) => (
            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" fill={coral} fillOpacity="0.12"/>
                <path d="M4 7l2 2 4-4" stroke={coral} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 12, color: 'rgba(24,24,27,0.5)', fontWeight: 400 }}>{v} {l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Brand data ────────────────────────────────────────────────────────────────

const BRANDS = [
  {
    id: 'velo', name: 'Velo', tagline: 'Sell fast. Stay ahead.',
    font: 'var(--font-jakarta)', accent: '#00c896', bg: '#0a0f0f', text: '#fff',
    desc: 'Dark, precise, teal. Clean SaaS energy. For sellers who move fast.',
    preview: <VeloPreview />,
  },
  {
    id: 'helm', name: 'Helm', tagline: "You're in control.",
    font: 'var(--font-dmsans)', accent: '#3b82f6', bg: '#ffffff', text: '#1e2d3d',
    desc: 'Clean and professional. Light mode authority. Like Stripe or Notion.',
    preview: <HelmPreview />,
  },
  {
    id: 'grafter', name: 'Grafter', tagline: 'Built for sellers who graft.',
    font: 'var(--font-manrope)', accent: '#f59e0b', bg: '#111827', text: '#fff',
    desc: 'Dark slate, amber accent. Honest, direct, British in character.',
    preview: <GrafterPreview />,
  },
  {
    id: 'relay', name: 'Relay', tagline: 'One listing. Every channel.',
    font: 'var(--font-worksans)', accent: '#16a34a', bg: '#fafaf8', text: '#1a1a1a',
    desc: 'Warm cream, forest green. Calm and trustworthy. Like Notion or Linear.',
    preview: <RelayPreview />,
  },
  {
    id: 'stackd', name: 'Stackd', tagline: 'Stack your channels. Stack your profit.',
    font: 'var(--font-nunito)', accent: '#8b5cf6', bg: '#0e0e16', text: '#fff',
    desc: 'Deep dark with violet. Modern B2B SaaS. Growth-focused, bold.',
    preview: <StackdPreview />,
  },
  {
    id: 'kova', name: 'Kova', tagline: 'The smarter way to sell.',
    font: 'var(--font-space)', accent: '#f97316', bg: '#ffffff', text: '#18181b',
    desc: 'White, warm coral. Premium minimal. Figma/Framer energy.',
    preview: <KovaPreview />,
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function BrandConceptsClient() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: '#0c0c0e', padding: '64px 48px 96px', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .bc-card { border-radius: 14px; overflow: hidden; cursor: pointer; transition: transform 0.25s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.2s ease; border: 1.5px solid rgba(255,255,255,0.06); }
        .bc-card:hover { transform: translateY(-6px); border-color: rgba(255,255,255,0.12); }
        .bc-card.sel { transform: translateY(-4px); }
        .bc-btn { border: none; cursor: pointer; width: 100%; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.01em; transition: filter 0.15s; }
        .bc-btn:hover { filter: brightness(1.08); }
        @keyframes up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .bc-card { animation: up 0.45s ease both; }
        .bc-card:nth-child(1){animation-delay:.04s}
        .bc-card:nth-child(2){animation-delay:.10s}
        .bc-card:nth-child(3){animation-delay:.16s}
        .bc-card:nth-child(4){animation-delay:.22s}
        .bc-card:nth-child(5){animation-delay:.28s}
        .bc-card:nth-child(6){animation-delay:.34s}
        .bc-banner { animation: up 0.3s ease both; }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 720, margin: '0 auto 56px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
          Brand Direction · Internal
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12 }}>
          Choose your brand.
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
          Six directions, each with a real hero preview. These are exactly how the site would look — not mockups, live rendered code. Pick the one that feels right and say the word.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
        {BRANDS.map(brand => {
          const isSel = selected === brand.id
          const isLight = brand.bg === '#ffffff' || brand.bg === '#fafaf8'

          return (
            <div
              key={brand.id}
              className={`bc-card${isSel ? ' sel' : ''}`}
              style={{
                background: '#141417',
                boxShadow: isSel
                  ? `0 0 0 2px ${brand.accent}, 0 16px 48px ${brand.accent}22`
                  : '0 2px 20px rgba(0,0,0,0.5)',
                borderColor: isSel ? brand.accent : undefined,
              }}
              onClick={() => setSelected(isSel ? null : brand.id)}
            >
              {/* Scaled preview */}
              <div style={{ width: OW, height: OH, overflow: 'hidden', position: 'relative', background: brand.bg }}>
                <div style={{ transform: `scale(${S})`, transformOrigin: 'top left', width: IW, height: IH, position: 'absolute', top: 0, left: 0, pointerEvents: 'none', userSelect: 'none' }}>
                  {brand.preview}
                </div>
              </div>

              {/* Card footer */}
              <div style={{ padding: '18px 20px 20px', background: '#141417' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: brand.font, fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                    {brand.name}
                  </span>
                  {isSel && (
                    <div style={{ background: brand.accent, borderRadius: 9999, padding: '2px 9px', fontSize: 10, fontWeight: 700, color: isLight ? '#000' : '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Selected
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: brand.font, fontSize: 12, color: brand.accent, fontWeight: 500, marginBottom: 10, lineHeight: 1.4 }}>
                  {brand.tagline}
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.55, marginBottom: 14 }}>
                  {brand.desc}
                </p>
                {/* Accent swatch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: brand.accent }} />
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: brand.bg, border: '1px solid rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{brand.accent}</span>
                </div>
                <button
                  className="bc-btn"
                  style={{
                    background: isSel ? brand.accent : `${brand.accent}18`,
                    color: isSel ? (isLight ? '#000' : '#fff') : brand.accent,
                    fontFamily: brand.font,
                    border: `1px solid ${brand.accent}${isSel ? '' : '35'}`,
                  }}
                  onClick={e => { e.stopPropagation(); setSelected(isSel ? null : brand.id) }}
                >
                  {isSel ? `✓ This is the one` : `Choose ${brand.name}`}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selection banner */}
      {selected && (() => {
        const b = BRANDS.find(x => x.id === selected)!
        const isLight = b.bg === '#ffffff' || b.bg === '#fafaf8'
        return (
          <div className="bc-banner" style={{ maxWidth: 1100, margin: '24px auto 0', padding: '20px 24px', background: `${b.accent}0c`, border: `1px solid ${b.accent}28`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: b.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: b.font, fontSize: 16, fontWeight: 800, color: isLight ? '#000' : '#fff' }}>{b.name[0]}</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: b.font, marginBottom: 2 }}>
                  You chose <span style={{ color: b.accent }}>{b.name}</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                  Say the word — I'll rename the app, update all the copy, and push it as a single commit.
                </div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 20, padding: '4px 8px', flexShrink: 0 }}>×</button>
          </div>
        )
      })()}

      <p style={{ textAlign: 'center', marginTop: 56, fontSize: 11, color: 'rgba(255,255,255,0.1)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Internal use only · Brand selection
      </p>
    </div>
  )
}
