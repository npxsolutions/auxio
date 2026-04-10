'use client'

import { useState } from 'react'

// Mini-site previews: render at 1000×580, scale to 360×209
const S = 0.36
const IW = 1000
const IH = 580
const OW = IW * S   // 360
const OH = IH * S   // 208.8

type Brand = {
  id: string
  name: string
  tagline: string
  font: string
  accent: string
  bg: string
  text: string
  feel: string[]
  preview: React.ReactNode
}

function VeloPreview() {
  const F = "var(--font-bricolage)"
  return (
    <div style={{ width: IW, height: IH, background: '#0d0d0d', position: 'relative', overflow: 'hidden' }}>
      {/* speed lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox={`0 0 ${IW} ${IH}`}>
        {[...Array(8)].map((_, i) => (
          <line key={i} x1={-100 + i * 200} y1={IH} x2={200 + i * 200} y2={0}
            stroke="#a8e63d" strokeWidth="0.6" strokeOpacity="0.06" />
        ))}
      </svg>
      {/* nav */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 52px', borderBottom: '1px solid rgba(168,230,61,0.1)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div style={{ width: 26, height: 26, background: '#a8e63d', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0d0d0d', fontFamily: F }}>V</span>
          </div>
          <span style={{ fontFamily: F, fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.03em' }}>Velo</span>
        </div>
        {['Product','Pricing','Integrations'].map(t => (
          <span key={t} style={{ fontFamily: F, fontSize: 14, color: 'rgba(255,255,255,0.35)', marginRight: 32 }}>{t}</span>
        ))}
        <div style={{ background: '#a8e63d', borderRadius: 9999, padding: '10px 24px', fontFamily: F, fontSize: 13, fontWeight: 700, color: '#0d0d0d' }}>Get started</div>
      </div>
      {/* hero */}
      <div style={{ padding: '64px 52px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(168,230,61,0.1)', border: '1px solid rgba(168,230,61,0.25)', borderRadius: 9999, padding: '7px 16px', marginBottom: 32 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#a8e63d' }} />
          <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: '#a8e63d', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Multichannel · UK</span>
        </div>
        <div style={{ fontFamily: F, fontSize: 88, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 8 }}>Sell fast.</div>
        <div style={{ fontFamily: F, fontSize: 88, fontWeight: 800, color: '#a8e63d', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 28 }}>Stay ahead.</div>
        <div style={{ fontFamily: F, fontSize: 18, color: 'rgba(255,255,255,0.45)', maxWidth: 480, lineHeight: 1.6, marginBottom: 40 }}>
          List once. Sync everywhere. Keep the profit. Built for UK sellers who move fast.
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 48 }}>
          <div style={{ background: '#a8e63d', borderRadius: 9999, padding: '14px 32px', fontFamily: F, fontSize: 15, fontWeight: 700, color: '#0d0d0d' }}>Start free trial</div>
          <div style={{ border: '1.5px solid rgba(168,230,61,0.35)', borderRadius: 9999, padding: '14px 32px', fontFamily: F, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>See demo</div>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['2.4s','Average sync time'],['£0 extra','No per-listing fees'],['8 channels','eBay · Amazon · more']].map(([v, l]) => (
            <div key={v} style={{ background: 'rgba(168,230,61,0.07)', border: '1px solid rgba(168,230,61,0.15)', borderRadius: 12, padding: '14px 20px' }}>
              <div style={{ fontFamily: F, fontSize: 22, fontWeight: 800, color: '#a8e63d', letterSpacing: '-0.02em', marginBottom: 2 }}>{v}</div>
              <div style={{ fontFamily: F, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HelmPreview() {
  const F = "var(--font-playfair)"
  return (
    <div style={{ width: IW, height: IH, background: '#0f2d5c', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 500, height: 500, background: 'radial-gradient(circle, rgba(240,165,0,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
      {/* nav */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 52px', borderBottom: '1px solid rgba(240,165,0,0.12)', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="#f0a500" strokeWidth="1.5" fill="none" />
            <circle cx="14" cy="14" r="3.5" fill="#f0a500" />
            {[0,60,120,180,240,300].map((deg, i) => {
              const r = (deg * Math.PI) / 180
              return <line key={i} x1={14 + 5 * Math.cos(r)} y1={14 + 5 * Math.sin(r)} x2={14 + 10 * Math.cos(r)} y2={14 + 10 * Math.sin(r)} stroke="#f0a500" strokeWidth="1.5" strokeLinecap="round" />
            })}
          </svg>
          <span style={{ fontFamily: F, fontWeight: 700, fontSize: 22, color: '#f0a500', letterSpacing: '-0.01em' }}>Helm</span>
        </div>
        {['Platform','Pricing','Solutions'].map(t => (
          <span key={t} style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.35)', marginRight: 36 }}>{t}</span>
        ))}
        <div style={{ background: '#f0a500', borderRadius: 9999, padding: '10px 26px', fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0f2d5c' }}>Get started</div>
      </div>
      {/* hero */}
      <div style={{ padding: '60px 52px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(240,165,0,0.6)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 28 }}>
          Complete channel control
        </div>
        <div style={{ fontFamily: F, fontSize: 82, fontWeight: 900, color: '#fff', lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: 4 }}>You're in</div>
        <div style={{ fontFamily: F, fontSize: 82, fontWeight: 900, color: '#f0a500', lineHeight: 0.95, letterSpacing: '-0.02em', fontStyle: 'italic', marginBottom: 32 }}>control.</div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, color: 'rgba(255,255,255,0.45)', maxWidth: 500, lineHeight: 1.65, marginBottom: 44 }}>
          One platform to manage every marketplace, every order, every penny. Helm puts you at the wheel.
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 52 }}>
          <div style={{ background: '#f0a500', borderRadius: 9999, padding: '15px 36px', fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, color: '#0f2d5c' }}>Take the helm</div>
          <div style={{ border: '1.5px solid rgba(240,165,0,0.4)', borderRadius: 9999, padding: '15px 36px', fontFamily: F, fontSize: 15, fontStyle: 'italic', color: 'rgba(255,255,255,0.65)' }}>Watch a demo</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'rgba(255,255,255,0.2)', fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
          {['eBay','Amazon','OnBuy','Etsy','Shopify'].map((ch, i) => (
            <span key={ch} style={{ color: i === 0 ? 'rgba(240,165,0,0.7)' : 'rgba(255,255,255,0.3)', fontWeight: i === 0 ? 600 : 400 }}>{ch}</span>
          ))}
          <span style={{ color: 'rgba(240,165,0,0.4)' }}>+ more</span>
        </div>
      </div>
    </div>
  )
}

function GrafterPreview() {
  const F = "var(--font-barlow)"
  return (
    <div style={{ width: IW, height: IH, background: '#1a3a2a', position: 'relative', overflow: 'hidden' }}>
      {/* grid texture */}
      <svg style={{ position: 'absolute', inset: 0, opacity: 0.06 }} width={IW} height={IH}>
        {[...Array(20)].map((_, i) => <line key={`v${i}`} x1={i * 56} y1={0} x2={i * 56} y2={IH} stroke="#c8f060" strokeWidth="0.5" />)}
        {[...Array(12)].map((_, i) => <line key={`h${i}`} x1={0} y1={i * 52} x2={IW} y2={i * 52} stroke="#c8f060" strokeWidth="0.5" />)}
      </svg>
      {/* nav */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 52px', borderBottom: '1px solid rgba(200,240,96,0.1)', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: F, fontWeight: 800, fontSize: 22, color: '#f5f0e8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Grafter</span>
        </div>
        {['How it works','Pricing','About'].map(t => (
          <span key={t} style={{ fontFamily: F, fontSize: 14, color: 'rgba(245,240,232,0.4)', marginRight: 36, fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{t}</span>
        ))}
        <div style={{ background: '#c8f060', borderRadius: 4, padding: '10px 26px', fontFamily: F, fontSize: 13, fontWeight: 800, color: '#1a3a2a', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Try free</div>
      </div>
      {/* hero */}
      <div style={{ padding: '48px 52px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 28, background: 'rgba(197,240,96,0.08)', border: '1px solid rgba(197,240,96,0.2)', padding: '6px 16px', borderRadius: 4 }}>
          <span style={{ fontSize: 16 }}>🇬🇧</span>
          <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: 'rgba(245,240,232,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Made for UK Sellers</span>
        </div>
        <div style={{ fontFamily: F, fontSize: 96, fontWeight: 800, color: '#f5f0e8', lineHeight: 0.88, letterSpacing: '-0.01em', textTransform: 'uppercase', marginBottom: 6 }}>Work</div>
        <div style={{ fontFamily: F, fontSize: 96, fontWeight: 800, color: '#c8f060', lineHeight: 0.88, letterSpacing: '-0.01em', textTransform: 'uppercase', marginBottom: 6 }}>Smart.</div>
        <div style={{ fontFamily: F, fontSize: 96, fontWeight: 800, color: 'rgba(245,240,232,0.45)', lineHeight: 0.88, letterSpacing: '-0.01em', textTransform: 'uppercase', marginBottom: 32 }}>Sell more.</div>
        <div style={{ fontFamily: F, fontSize: 17, color: 'rgba(245,240,232,0.5)', maxWidth: 500, lineHeight: 1.6, marginBottom: 40, fontWeight: 400 }}>
          No fluff. No faff. Just proper multichannel tools built for sellers who put in the work.
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ background: '#c8f060', borderRadius: 4, padding: '14px 32px', fontFamily: F, fontSize: 15, fontWeight: 800, color: '#1a3a2a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Start grafting</div>
          <div style={{ border: '1.5px solid rgba(245,240,232,0.2)', borderRadius: 4, padding: '14px 32px', fontFamily: F, fontSize: 15, fontWeight: 600, color: 'rgba(245,240,232,0.55)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>See the tool</div>
        </div>
      </div>
    </div>
  )
}

function RelayPreview() {
  const F = "var(--font-outfit)"
  return (
    <div style={{ width: IW, height: IH, background: '#f8faff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -100, right: -100, width: 600, height: 600, background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
      {/* nav */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 52px', borderBottom: '1px solid rgba(37,99,235,0.08)', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#2563eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 15, fontWeight: 700, fontFamily: F }}>→</span>
          </div>
          <span style={{ fontFamily: F, fontWeight: 700, fontSize: 20, color: '#0a0f2e', letterSpacing: '-0.02em' }}>Relay</span>
        </div>
        {['Product','Integrations','Pricing'].map(t => (
          <span key={t} style={{ fontFamily: F, fontSize: 14, color: '#64748b', marginRight: 36 }}>{t}</span>
        ))}
        <div style={{ background: '#2563eb', borderRadius: 9999, padding: '10px 26px', fontFamily: F, fontSize: 13, fontWeight: 600, color: '#fff' }}>Start free</div>
      </div>
      {/* hero */}
      <div style={{ padding: '60px 52px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#eff6ff', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 9999, padding: '7px 16px', marginBottom: 32 }}>
          <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: '#2563eb', letterSpacing: '0.04em' }}>Multichannel listings, simplified</span>
        </div>
        <div style={{ fontFamily: F, fontSize: 72, fontWeight: 700, color: '#0a0f2e', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 4 }}>One listing.</div>
        <div style={{ fontFamily: F, fontSize: 72, fontWeight: 700, color: '#2563eb', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 28 }}>Every channel.</div>
        <div style={{ fontFamily: F, fontSize: 17, color: '#64748b', maxWidth: 500, lineHeight: 1.65, marginBottom: 40 }}>
          Create one product listing and let Relay handle the rest — synced across eBay, Amazon, OnBuy, and more in real-time.
        </div>
        <div style={{ display: 'flex', gap: 14, marginBottom: 48 }}>
          <div style={{ background: '#2563eb', borderRadius: 9999, padding: '14px 32px', fontFamily: F, fontSize: 15, fontWeight: 600, color: '#fff' }}>Get started free</div>
          <div style={{ border: '1.5px solid rgba(37,99,235,0.25)', borderRadius: 9999, padding: '14px 32px', fontFamily: F, fontSize: 15, fontWeight: 500, color: '#2563eb' }}>Watch 2-min demo →</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['eBay','Amazon','OnBuy','Etsy','Shopify','TikTok Shop'].map(ch => (
            <div key={ch} style={{ background: '#fff', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 8, padding: '8px 16px', fontFamily: F, fontSize: 12, fontWeight: 600, color: '#2563eb' }}>{ch}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StackdPreview() {
  const F = "var(--font-syne)"
  return (
    <div style={{ width: IW, height: IH, background: '#180a2e', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 500, height: 500, background: 'radial-gradient(circle, rgba(109,40,217,0.4) 0%, transparent 60%)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: -60, right: -60, width: 400, height: 400, background: 'radial-gradient(circle, rgba(196,255,0,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
      {/* horizontal scan lines */}
      <svg style={{ position: 'absolute', inset: 0, opacity: 0.04 }} width={IW} height={IH}>
        {[...Array(29)].map((_, i) => <line key={i} x1={0} y1={i * 20} x2={IW} y2={i * 20} stroke="#c4ff00" strokeWidth="0.5" />)}
      </svg>
      {/* nav */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 52px', borderBottom: '1px solid rgba(196,255,0,0.08)', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: F, fontWeight: 800, fontSize: 22, color: '#c4ff00', letterSpacing: '-0.02em' }}>Stackd</span>
        </div>
        {['Features','Pricing','Channels'].map(t => (
          <span key={t} style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.25)', marginRight: 36, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t}</span>
        ))}
        <div style={{ background: '#c4ff00', borderRadius: 9999, padding: '10px 26px', fontFamily: F, fontSize: 13, fontWeight: 700, color: '#180a2e', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Start stacking</div>
      </div>
      {/* hero */}
      <div style={{ padding: '52px 52px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', gap: 8, background: 'rgba(196,255,0,0.08)', border: '1px solid rgba(196,255,0,0.2)', borderRadius: 6, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: '#c4ff00', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Stack more · Earn more</span>
        </div>
        <div style={{ fontFamily: F, fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 4 }}>Stack your channels.</div>
        <div style={{ fontFamily: F, fontSize: 72, fontWeight: 800, color: '#c4ff00', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 28 }}>Stack your profit.</div>
        <div style={{ fontFamily: F, fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 520, lineHeight: 1.65, marginBottom: 36, fontWeight: 400 }}>
          Every channel you add is profit you're leaving somewhere else. Stop leaving it. Stackd connects everything.
        </div>
        <div style={{ display: 'flex', gap: 14, marginBottom: 40 }}>
          <div style={{ background: '#c4ff00', borderRadius: 9999, padding: '14px 32px', fontFamily: F, fontSize: 14, fontWeight: 700, color: '#180a2e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Add your first channel</div>
          <div style={{ border: '1.5px solid rgba(196,255,0,0.2)', borderRadius: 9999, padding: '14px 32px', fontFamily: F, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>See demo</div>
        </div>
        {/* stacked channel pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 560 }}>
          {[['eBay','#ff4444',1],['Amazon','#ff9900',0.7],['OnBuy','#6d28d9',0.5],['Etsy','#f56400',0.35]].map(([name, color, op]) => (
            <div key={name as string} style={{ display: 'flex', alignItems: 'center', gap: 12, background: `rgba(196,255,0,${Number(op) * 0.04})`, border: `1px solid rgba(196,255,0,${Number(op) * 0.15})`, borderRadius: 8, padding: '10px 16px', opacity: Number(op) + 0.1 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color as string }} />
              <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{name as string}</span>
              <span style={{ marginLeft: 'auto', fontFamily: F, fontSize: 12, color: '#c4ff00', fontWeight: 600 }}>Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KovaPreview() {
  const F = "var(--font-cormorant)"
  return (
    <div style={{ width: IW, height: IH, background: '#1c1917', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 600, height: 400, background: 'radial-gradient(ellipse at top right, rgba(255,107,71,0.1) 0%, transparent 65%)' }} />
      {/* nav */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 52px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" stroke="#ff6b47" strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="12" r="3" fill="#ff6b47" />
          </svg>
          <span style={{ fontFamily: F, fontWeight: 600, fontSize: 22, color: '#fafaf9', letterSpacing: '0.02em' }}>Kova</span>
        </div>
        {['Platform','Channels','Pricing'].map(t => (
          <span key={t} style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(250,250,249,0.3)', marginRight: 36 }}>{t}</span>
        ))}
        <div style={{ border: '1px solid rgba(255,107,71,0.5)', borderRadius: 9999, padding: '10px 26px', fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#ff6b47' }}>Get early access</div>
      </div>
      {/* hero */}
      <div style={{ padding: '64px 52px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: 'rgba(255,107,71,0.6)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 32 }}>
          The intelligent selling platform
        </div>
        <div style={{ fontFamily: F, fontSize: 84, fontWeight: 400, color: 'rgba(250,250,249,0.6)', lineHeight: 0.95, letterSpacing: '-0.01em', fontStyle: 'italic', marginBottom: 4 }}>The smarter</div>
        <div style={{ fontFamily: F, fontSize: 84, fontWeight: 600, color: '#fafaf9', lineHeight: 0.95, letterSpacing: '-0.01em', marginBottom: 32 }}>way to sell.</div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, color: 'rgba(250,250,249,0.4)', maxWidth: 500, lineHeight: 1.65, marginBottom: 44, fontWeight: 300 }}>
          Kova learns how you sell and optimises everything — pricing, listing quality, channel selection — automatically.
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 52 }}>
          <div style={{ background: '#ff6b47', borderRadius: 9999, padding: '15px 36px', fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 500, color: '#fff' }}>Request access</div>
          <div style={{ border: '1px solid rgba(250,250,249,0.12)', borderRadius: 9999, padding: '15px 36px', fontFamily: F, fontSize: 16, fontStyle: 'italic', color: 'rgba(250,250,249,0.45)' }}>Learn more →</div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['Profit tracking','Automated'],['AI optimisation','Live'],['8 channels','Connected']].map(([label, badge]) => (
            <div key={label as string} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontFamily: F, fontSize: 13, color: 'rgba(250,250,249,0.35)', fontStyle: 'italic' }}>{label as string}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#ff6b47', fontWeight: 500, letterSpacing: '0.06em' }}>{badge as string}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const BRANDS: Brand[] = [
  {
    id: 'velo', name: 'Velo', tagline: 'Sell fast. Stay ahead.',
    font: 'var(--font-bricolage)', accent: '#a8e63d', bg: '#0d0d0d', text: '#ffffff',
    feel: ['Fast-twitch energy', 'Precision-built', 'No lag, no friction'],
    preview: <VeloPreview />,
  },
  {
    id: 'helm', name: 'Helm', tagline: "You're in control.",
    font: 'var(--font-playfair)', accent: '#f0a500', bg: '#0f2d5c', text: '#ffffff',
    feel: ['Authoritative calm', 'Serene command', 'Built to last'],
    preview: <HelmPreview />,
  },
  {
    id: 'grafter', name: 'Grafter', tagline: 'Built for sellers who graft.',
    font: 'var(--font-barlow)', accent: '#c8f060', bg: '#1a3a2a', text: '#f5f0e8',
    feel: ['Pure British grit', 'Earned, not given', 'No nonsense'],
    preview: <GrafterPreview />,
  },
  {
    id: 'relay', name: 'Relay', tagline: 'One listing. Every channel.',
    font: 'var(--font-outfit)', accent: '#2563eb', bg: '#f8faff', text: '#0a0f2e',
    feel: ['Frictionless flow', 'Instant handoff', 'Always in motion'],
    preview: <RelayPreview />,
  },
  {
    id: 'stackd', name: 'Stackd', tagline: 'Stack your channels. Stack your profit.',
    font: 'var(--font-syne)', accent: '#c4ff00', bg: '#180a2e', text: '#ffffff',
    feel: ['Maximalist ambition', 'Layer by layer', 'Always building'],
    preview: <StackdPreview />,
  },
  {
    id: 'kova', name: 'Kova', tagline: 'The smarter way to sell.',
    font: 'var(--font-cormorant)', accent: '#ff6b47', bg: '#1c1917', text: '#fafaf9',
    feel: ['Refined intelligence', 'Quietly powerful', 'Warm precision'],
    preview: <KovaPreview />,
  },
]

export default function BrandConceptsClient() {
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: '#050505', padding: '72px 56px 96px' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .bc-card {
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.25s ease;
          border: 1.5px solid transparent;
        }
        .bc-card:hover { transform: translateY(-8px); }
        .bc-card.selected { transform: translateY(-6px); }
        .bc-preview {
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
        }
        .bc-preview-inner {
          transform-origin: top left;
          pointer-events: none;
          user-select: none;
        }
        .bc-btn {
          border: none; cursor: pointer; width: 100%;
          padding: 13px 0; border-radius: 10px;
          font-size: 13px; font-weight: 700; letter-spacing: 0.04em;
          transition: filter 0.15s, opacity 0.15s;
        }
        .bc-btn:hover { filter: brightness(1.1); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .bc-card { animation: fadeUp 0.5s ease both; }
        .bc-card:nth-child(1) { animation-delay: 0.04s; }
        .bc-card:nth-child(2) { animation-delay: 0.10s; }
        .bc-card:nth-child(3) { animation-delay: 0.16s; }
        .bc-card:nth-child(4) { animation-delay: 0.22s; }
        .bc-card:nth-child(5) { animation-delay: 0.28s; }
        .bc-card:nth-child(6) { animation-delay: 0.34s; }
        .bc-banner { animation: fadeUp 0.35s ease both; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 64, maxWidth: 640, margin: '0 auto 64px' }}>
        <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
          Brand Direction · Internal
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 14 }}>
          Choose your identity.
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', lineHeight: 1.65 }}>
          Six fully-realised brand directions. Each shows a real hero — exactly how the site would open.
          Pick the one that feels like you.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 1164, margin: '0 auto' }}>
        {BRANDS.map(brand => {
          const isSel = selected === brand.id
          const isLight = brand.id === 'relay'

          return (
            <div
              key={brand.id}
              className={`bc-card${isSel ? ' selected' : ''}`}
              style={{
                background: '#111',
                borderColor: isSel ? brand.accent : hovered === brand.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                boxShadow: isSel
                  ? `0 0 0 3px ${brand.accent}28, 0 20px 60px ${brand.accent}20, 0 4px 24px rgba(0,0,0,0.6)`
                  : '0 4px 32px rgba(0,0,0,0.5)',
              }}
              onClick={() => setSelected(isSel ? null : brand.id)}
              onMouseEnter={() => setHovered(brand.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Mini-site preview */}
              <div className="bc-preview" style={{ width: OW, height: OH }}>
                <div className="bc-preview-inner" style={{ transform: `scale(${S})`, width: IW, height: IH }}>
                  {brand.preview}
                </div>
              </div>

              {/* Card info */}
              <div style={{ padding: '20px 22px 22px', background: '#111' }}>
                {/* Name + selected badge row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: brand.font, fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                    {brand.name}
                  </span>
                  {isSel && (
                    <div style={{ background: brand.accent, borderRadius: 9999, padding: '3px 10px', fontSize: 10, fontWeight: 800, color: isLight ? brand.bg : '#000', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Selected
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: brand.font, fontSize: 13, color: brand.accent, fontWeight: 500, marginBottom: 16, fontStyle: brand.id === 'kova' ? 'italic' : 'normal', lineHeight: 1.4 }}>
                  {brand.tagline}
                </div>

                {/* Feel descriptors */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                  {brand.feel.map(f => (
                    <div key={f} style={{ background: `${brand.accent}12`, border: `1px solid ${brand.accent}22`, borderRadius: 6, padding: '4px 10px', fontSize: 11, color: `${brand.accent}cc`, fontWeight: 500, lineHeight: 1 }}>
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  className="bc-btn"
                  style={{
                    background: isSel ? brand.accent : `${brand.accent}15`,
                    color: isSel ? (isLight ? brand.bg : '#000') : brand.accent,
                    fontFamily: brand.font,
                    border: `1px solid ${brand.accent}${isSel ? 'ff' : '30'}`,
                  }}
                  onClick={e => { e.stopPropagation(); setSelected(isSel ? null : brand.id) }}
                >
                  {isSel ? `✓ I want ${brand.name}` : `Select ${brand.name}`}
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
          <div className="bc-banner" style={{ maxWidth: 1164, margin: '28px auto 0', padding: '22px 28px', background: `${b.accent}0e`, border: `1px solid ${b.accent}25`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: b.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: b.font, fontSize: 18, fontWeight: 800, color: isLight ? b.bg : '#000' }}>{b.name[0]}</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: b.font, marginBottom: 3 }}>
                  You chose <span style={{ color: b.accent }}>{b.name}</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                  Tell me and I'll rename the entire codebase, update every file, and push a commit — all in one shot.
                </div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '4px 8px', flexShrink: 0 }}>×</button>
          </div>
        )
      })()}

      <div style={{ textAlign: 'center', marginTop: 64 }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Internal use only · Brand selection
        </p>
      </div>
    </div>
  )
}
