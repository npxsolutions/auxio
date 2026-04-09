'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChannelOptimisationInfographic, TrueProfitWaterfall, TimeSavedInfographic } from './components/LandingInfographics'

const FOUNDING_CLAIMED = 23

// --- Static data hoisted to module level (rendering-hoist-jsx, rerender-memo) ---

const MOCKUP_ROWS = [
  { title: 'Nike Air Max 90 — UK 10',     price: '£89.99',  stock: '3', status: 'published', statusColor: '#0f7b6c', statusBg: '#e8f5f3', ch: [1,1,1] as const },
  { title: 'Adidas Ultraboost 22 — UK 9', price: '£119.99', stock: '1', status: 'published', statusColor: '#0f7b6c', statusBg: '#e8f5f3', ch: [1,1,0] as const },
  { title: 'New Balance 574 — UK 11',     price: '£74.99',  stock: '5', status: 'draft',     statusColor: '#9b9b98', statusBg: '#f1f1ef', ch: [0,0,0] as const },
  { title: 'Puma RS-X — UK 8',            price: '£54.99',  stock: '0', status: 'failed',    statusColor: '#c9372c', statusBg: '#fce8e6', ch: [1,0,0] as const },
]

const CH_ICONS = ['🛍️','🛒','📦'] as const

const SIDEBAR_ITEMS = [
  { icon: '⚡', label: 'Command Centre', active: false, badge: 0 },
  { icon: '🏷️', label: 'Listings',       active: true,  badge: 0 },
  { icon: '🔗', label: 'Channels',        active: false, badge: 0 },
  { icon: '📦', label: 'Inventory',       active: false, badge: 0 },
  { icon: '🤖', label: 'AI Agent',        active: false, badge: 3 },
] as const

const CHANNEL_BADGES = [
  { label: 'Shopify', icon: '🛍️' },
  { label: 'eBay',    icon: '🛒' },
  { label: 'Amazon',  icon: '📦' },
] as const

const FEATURE_CARDS = [
  {
    icon: <svg key="profit" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'True Profit Tracking',
    desc: 'Real profit per order after every fee, every shipping cost, every ad pound. Know which channels actually make money — not just revenue.',
  },
  {
    icon: <svg key="sync" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2"/><path d="M8 5v3l2 2" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>,
    title: 'Multichannel Sync',
    desc: 'Push one listing to Shopify, eBay, and Amazon simultaneously. The right format for each platform, sent in one click.',
  },
  {
    icon: <svg key="ai" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'AI Agent',
    desc: 'Channel-specific titles and descriptions written automatically. eBay keywords, Amazon bullet points, Shopify brand copy — every time.',
  },
  {
    icon: <svg key="rules" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="white" strokeWidth="2"/><path d="M5 8h6M5 5h6M5 11h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    title: 'Feed Rules',
    desc: 'Set conditional rules to transform listings at publish time. Auto-adjust titles, prices, categories, and attributes per channel with zero manual work.',
  },
  {
    icon: <svg key="error" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v4M8 10v4M2 8h4M10 8h4" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>,
    title: 'Error Hub',
    desc: "See exactly what's blocking a listing per channel before it goes live — missing images, wrong category, title too long, required attributes empty.",
  },
  {
    icon: <svg key="bulk" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M3 8h10M3 11h6" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>,
    title: 'Bulk Operations',
    desc: 'Upload your full catalogue in minutes. Auxio maps columns intelligently and handles 25+ field name variations. 1,000 products in one upload.',
  },
] as const

const PLANS = [
  {
    name: 'Starter',
    price: 79,
    founding: 49,
    desc: 'Solo seller, 1 channel',
    features: ['1 sales channel', 'Up to 500 listings', 'CSV import & bulk upload', 'Feed health scoring', 'Profit dashboard'],
    popular: false,
  },
  {
    name: 'Growth',
    price: 199,
    founding: 129,
    desc: 'Scaling across 3 channels',
    features: ['3 sales channels', 'Unlimited listings', 'AI listing optimisation', 'AI insights & chat', 'PPC intelligence', 'Bulk publish in one click'],
    popular: true,
  },
  {
    name: 'Scale',
    price: 599,
    founding: 399,
    desc: 'High volume, full automation',
    features: ['5 sales channels', 'Everything in Growth', 'Autopilot AI agent', 'Real-time inventory sync', 'Full ML analytics suite', 'Priority support'],
    popular: false,
  },
  {
    name: 'Enterprise',
    price: 1500,
    founding: null,
    desc: 'Agencies & large operations',
    features: ['Unlimited channels', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee', 'Full API access', 'White-label option'],
    popular: false,
  },
] as const

const FAQ_ITEMS = [
  {
    q: 'How is this different from Feedonomics?',
    a: "Feedonomics is built for enterprise teams with dedicated onboarding, annual contracts, and £1,000+/month price tags. Auxio is self-serve — connect your channels, import your products, and publish in under 10 minutes. No specialists, no minimum spend, no long-term commitment.",
  },
  {
    q: 'What if I already have listings on eBay and Amazon?',
    a: "Existing listings stay live — Auxio doesn't touch what's already there. You create new listings through Auxio and it manages those going forward. You can migrate your existing listings at your own pace.",
  },
  {
    q: 'Do I need technical knowledge to set this up?',
    a: "No. Channel connections use standard OAuth — click Connect, log in to your account, done. Listing creation is a straightforward form. CSV import handles bulk uploads automatically. No API keys, no developer needed.",
  },
  {
    q: 'What happens to my listings if I cancel?',
    a: "Your listings stay live on all channels — we don't delete anything. You just lose access to Auxio's management dashboard. Month-to-month, cancel any time, no data held hostage.",
  },
  {
    q: 'Does the AI actually improve my listings, or is it just rewriting them?',
    a: "It's specifically trained on platform requirements. For eBay, it respects the 80-character title limit and uses search-friendly keywords. For Amazon, it formats bullet points for A9. For Shopify, it writes brand-focused copy. These aren't generic rewrites — they're channel-specific optimisations.",
  },
] as const

const FOOTER_LINKS = [['Privacy Policy', '/privacy'], ['Terms of Service', '#'], ['Contact', '#']] as const

// --- Hoisted static style objects (rendering-hoist-jsx) ---

const NAV_STYLE = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  zIndex: 50,
  background: '#0f1117',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  padding: '0 48px',
  height: '60px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const CONTAINER_STYLE = { maxWidth: '1100px', margin: '0 auto', padding: '0 48px' } as const

function ProductMockup() {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 120px rgba(91,82,245,0.2), 0 0 0 1px rgba(255,255,255,0.05)', overflow: 'hidden', background: 'white' }}>
      {/* Browser chrome */}
      <div style={{ background: '#f7f7f5', borderBottom: '1px solid #e8e8e5', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          {['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} style={{ width: '11px', height: '11px', borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, margin: '0 20px', background: 'white', borderRadius: '5px', padding: '4px 14px', fontSize: '11px', color: '#9b9b98', border: '1px solid #e8e8e5', textAlign: 'center', maxWidth: '260px', marginLeft: 'auto', marginRight: 'auto' }}>
          app.auxio.io/listings
        </div>
      </div>
      {/* App shell */}
      <div style={{ display: 'flex', height: '340px' }}>
        {/* Mini sidebar */}
        <div style={{ width: '164px', background: 'white', borderRight: '1px solid #e8e8e5', padding: '12px 8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px', marginBottom: '12px' }}>
            <div style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg, #5b52f5 0%, #7c6af8 100%)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 700 }}>A</div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#191919' }}>Auxio</span>
          </div>
          {[
            { icon: '⚡', label: 'Command Centre', active: false },
            { icon: '🏷️', label: 'Listings',       active: true  },
            { icon: '🔗', label: 'Channels',        active: false },
            { icon: '📦', label: 'Inventory',       active: false },
            { icon: '🤖', label: 'AI Agent',        active: false, badge: 3 },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 8px', borderRadius: '5px', background: item.active ? '#f1f1ef' : 'transparent', marginBottom: '1px', fontSize: '11px', fontWeight: item.active ? 600 : 400, color: item.active ? '#191919' : '#787774' }}>
              <span style={{ fontSize: '12px' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {(item as any).badge > 0 && <span style={{ background: '#c9372c', color: 'white', fontSize: '9px', fontWeight: 700, padding: '1px 4px', borderRadius: '6px' }}>{(item as any).badge}</span>}
            </div>
          ))}
        </div>
        {/* Content */}
        <div style={{ flex: 1, padding: '18px 22px', overflowX: 'hidden', background: '#f7f7f5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#191919' }}>Listings</div>
              <div style={{ fontSize: '11px', color: '#9b9b98' }}>12 listings · create once, publish everywhere</div>
            </div>
            <div style={{ display: 'flex', gap: '7px' }}>
              <div style={{ padding: '6px 12px', background: 'white', border: '1px solid #e8e8e5', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#787774' }}>Import CSV</div>
              <div style={{ padding: '6px 12px', background: '#191919', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: 'white' }}>+ New listing</div>
            </div>
          </div>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '12px' }}>
            {['All 12','Draft 4','Published 7','Failed 1'].map((f, i) => (
              <div key={f} style={{ padding: '4px 10px', border: `1px solid ${i === 0 ? '#191919' : '#e8e8e5'}`, borderRadius: '5px', fontSize: '10px', fontWeight: 600, color: i === 0 ? '#191919' : '#9b9b98', background: i === 0 ? '#f1f1ef' : 'white' }}>{f}</div>
            ))}
          </div>
          {/* Table */}
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e8e8e5', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '24px 32px 1fr 64px 44px 88px 68px', gap: '8px', padding: '7px 12px', background: '#fafafa', borderBottom: '1px solid #f1f1ef' }}>
              {['','','PRODUCT','PRICE','STOCK','CHANNELS','STATUS'].map((h, i) => (
                <div key={i} style={{ fontSize: '9px', fontWeight: 700, color: '#9b9b98', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {MOCKUP_ROWS.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 32px 1fr 64px 44px 88px 68px', gap: '8px', padding: '8px 12px', borderBottom: i < MOCKUP_ROWS.length - 1 ? '1px solid #f7f7f5' : 'none', alignItems: 'center' }}>
                <div style={{ width: '11px', height: '11px', border: '1.5px solid #d8d8d4', borderRadius: '2px' }} />
                <div style={{ width: '28px', height: '28px', borderRadius: '5px', background: '#f1f1ef' }} />
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#191919', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#191919' }}>{row.price}</div>
                <div style={{ fontSize: '10px', color: row.stock === '0' ? '#c9372c' : '#191919', fontWeight: row.stock === '0' ? 700 : 400 }}>{row.stock === '0' ? 'Out' : row.stock}</div>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {row.ch.map((on, ci) => (
                    <div key={ci} style={{ width: '22px', height: '22px', borderRadius: '5px', background: on ? '#f0f7ff' : '#fafafa', border: `1px solid ${on ? '#c7dff7' : '#f0f0ec'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', opacity: on ? 1 : 0.3 }}>{on ? CH_ICONS[ci] : '·'}</div>
                  ))}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: row.statusColor, background: row.statusBg, padding: '3px 6px', borderRadius: '4px', display: 'inline-block', whiteSpace: 'nowrap' }}>{row.status.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const disc = billing === 'annual' ? 0.8 : 1
  const fmt  = (n: number) => Math.round(n * disc).toLocaleString('en-GB')

  const plans = [
    {
      name: 'Starter',
      price: 79,
      founding: 49,
      desc: 'Solo seller, 1 channel',
      features: ['1 sales channel', 'Up to 500 listings', 'CSV import & bulk upload', 'Feed health scoring', 'Profit dashboard'],
      popular: false,
    },
    {
      name: 'Growth',
      price: 199,
      founding: 129,
      desc: 'Scaling across 3 channels',
      features: ['3 sales channels', 'Unlimited listings', 'AI listing optimisation', 'AI insights & chat', 'PPC intelligence', 'Bulk publish in one click'],
      popular: true,
    },
    {
      name: 'Scale',
      price: 599,
      founding: 399,
      desc: 'High volume, full automation',
      features: ['5 sales channels', 'Everything in Growth', 'Autopilot AI agent', 'Real-time inventory sync', 'Full ML analytics suite', 'Priority support'],
      popular: false,
    },
    {
      name: 'Enterprise',
      price: 1500,
      founding: null,
      desc: 'Agencies & large operations',
      features: ['Unlimited channels', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee', 'Full API access', 'White-label option'],
      popular: false,
    },
  ]

  return (
    <div style={{ fontFamily: 'inherit', background: '#ffffff', color: '#191919', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#0f1117',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 48px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: 'linear-gradient(135deg, #5b52f5 0%, #7c6af8 100%)',
            borderRadius: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}>A</div>
          <span style={{ fontSize: '17px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>Auxio</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="/features" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontWeight: 500 }}>Features</a>
          <a href="/integrations" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontWeight: 500 }}>Integrations</a>
          <a href="/pricing" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontWeight: 500 }}>Pricing</a>
          <a href="/about" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontWeight: 500 }}>About</a>
          <button
            onClick={() => router.push('/login')}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '0', fontFamily: 'inherit' }}
          >Sign in</button>
          <button
            onClick={() => router.push('/signup')}
            style={{ background: '#5b52f5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '9px 20px', fontFamily: 'inherit' }}
          >Start free trial</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        background: '#0f1117',
        paddingTop: '140px',
        paddingBottom: '96px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Radial gradient glow */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(91,82,245,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 1 }}>
          {/* Founding badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(91,82,245,0.12)',
              border: '1px solid rgba(91,82,245,0.3)',
              borderRadius: '100px',
              padding: '7px 18px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 500,
            }}>
              <span style={{ width: '6px', height: '6px', background: '#5b52f5', borderRadius: '50%', display: 'inline-block' }} />
              Founding member pricing — <strong style={{ color: 'white' }}>{FOUNDING_CLAIMED} of 50 spots claimed</strong>
              <button
                onClick={() => router.push('/signup')}
                style={{ background: 'transparent', border: 'none', color: '#7c6af8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
              >Claim yours →</button>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: '64px',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.0,
            color: 'white',
            textAlign: 'center',
            marginBottom: '24px',
          }}>
            One platform. Every channel.<br />Real profit.
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: '20px',
            color: 'rgba(255,255,255,0.55)',
            maxWidth: '520px',
            margin: '0 auto 40px',
            lineHeight: 1.6,
            textAlign: 'center',
          }}>
            Auxio connects Shopify, eBay, and Amazon into a single command centre. Know your true profit. Let AI act for you.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <button
              onClick={() => router.push('/signup')}
              style={{
                background: '#5b52f5',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '14px 28px',
                fontFamily: 'inherit',
              }}
            >Start free trial →</button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '14px 28px',
                fontFamily: 'inherit',
              }}
            >See how it works</button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '48px' }}>
            No credit card · 14-day free trial · Cancel anytime
          </p>

          {/* Product Mockup */}
          <div style={{ marginTop: '48px' }}>
            <ProductMockup />
          </div>
        </div>
      </div>

      {/* LOGOS / SOCIAL PROOF BAR */}
      <div style={{ background: '#0f1117', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '40px', paddingBottom: '48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 48px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
            Trusted by 200+ eCommerce sellers
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'Shopify',  icon: '🛍️', color: '#96BF48' },
              { label: 'eBay',     icon: '🛒', color: '#E53238' },
              { label: 'Amazon',   icon: '📦', color: '#FF9900' },
            ].map(ch => (
              <div key={ch.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: '16px' }}>{ch.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{ch.label}</span>
              </div>
            ))}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '10px',
            }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>+ Etsy, TikTok Shop coming</span>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURE CARDS SECTION */}
      <div id="features" style={{ background: '#f5f3ef', paddingTop: '96px', paddingBottom: '96px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#5b52f5', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Features</p>
            <h2 style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f1117', marginBottom: '14px', lineHeight: 1.1 }}>
              Everything you need to scale
            </h2>
            <p style={{ fontSize: '17px', color: '#6b6e87', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
              Built for sellers who want to grow, not spend their days maintaining spreadsheets.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ),
                title: 'True Profit Tracking',
                desc: 'Real profit per order after every fee, every shipping cost, every ad pound. Know which channels actually make money — not just revenue.',
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2"/><path d="M8 5v3l2 2" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                ),
                title: 'Multichannel Sync',
                desc: 'Push one listing to Shopify, eBay, and Amazon simultaneously. The right format for each platform, sent in one click.',
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ),
                title: 'AI Agent',
                desc: 'Channel-specific titles and descriptions written automatically. eBay keywords, Amazon bullet points, Shopify brand copy — every time.',
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="white" strokeWidth="2"/><path d="M5 8h6M5 5h6M5 11h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                ),
                title: 'Feed Rules',
                desc: 'Set conditional rules to transform listings at publish time. Auto-adjust titles, prices, categories, and attributes per channel with zero manual work.',
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v4M8 10v4M2 8h4M10 8h4" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                ),
                title: 'Error Hub',
                desc: 'See exactly what\'s blocking a listing per channel before it goes live — missing images, wrong category, title too long, required attributes empty.',
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M3 8h10M3 11h6" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                ),
                title: 'Bulk Operations',
                desc: 'Upload your full catalogue in minutes. Auxio maps columns intelligently and handles 25+ field name variations. 1,000 products in one upload.',
              },
            ].map(f => (
              <div key={f.title} style={{
                background: 'white',
                border: '1px solid #e8e5df',
                borderRadius: '12px',
                padding: '28px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: '#5b52f5',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f1117', marginBottom: '8px' }}>{f.title}</div>
                <div style={{ fontSize: '14px', color: '#6b6e87', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* INFOGRAPHICS SECTION */}
      <div style={{ background: '#f5f3ef', paddingTop: '80px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 48px' }}>

          {/* Row 1: Channel Optimisation — text left, graphic right */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center', marginBottom: '96px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#5b52f5', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Channel Optimisation</p>
              <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f1117', marginBottom: '14px', lineHeight: 1.15 }}>
                One listing.<br />Three platforms.<br />Zero copy-paste.
              </h2>
              <p style={{ fontSize: '16px', color: '#6b6e87', lineHeight: 1.65 }}>
                Auxio sits between your products and your sales channels. Create once, and it handles the formatting, optimisation, and publishing for each platform — automatically.
              </p>
            </div>
            <div>
              <ChannelOptimisationInfographic />
            </div>
          </div>

          {/* Row 2: True Profit — graphic left, text right */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center', marginBottom: '96px' }}>
            <div>
              <TrueProfitWaterfall />
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#5b52f5', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>True Profit Intelligence</p>
              <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f1117', marginBottom: '14px', lineHeight: 1.15 }}>
                Revenue is vanity.<br />Profit is reality.
              </h2>
              <p style={{ fontSize: '16px', color: '#6b6e87', lineHeight: 1.65 }}>
                Most sellers know what they sold. Almost none know what they kept. Auxio strips out every fee, every shipping cost, every ad pound — so you see true profit, per order, per channel.
              </p>
            </div>
          </div>

          {/* Row 3: Time Saved — text left, graphic right */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#5b52f5', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Time Saved</p>
              <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f1117', marginBottom: '14px', lineHeight: 1.15 }}>
                3 hours per listing<br />becomes 10 minutes.
              </h2>
              <p style={{ fontSize: '16px', color: '#6b6e87', lineHeight: 1.65 }}>
                Every platform has different requirements. Getting it right on all three used to mean hours of copy-paste. Auxio collapses that to minutes — automatically, every time.
              </p>
            </div>
            <div>
              <TimeSavedInfographic />
            </div>
          </div>

        </div>
      </div>

      {/* PRICING SECTION */}
      <div id="pricing" style={{ background: '#f5f3ef', paddingTop: '96px', paddingBottom: '96px', borderTop: '1px solid #e8e5df' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#5b52f5', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Pricing</p>
            <h2 style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f1117', marginBottom: '12px', lineHeight: 1.1 }}>
              Simple pricing. No surprises.
            </h2>
            <p style={{ fontSize: '17px', color: '#6b6e87', marginBottom: '0' }}>14-day free trial on all plans. No credit card required.</p>
          </div>

          {/* Billing toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '40px' }}>
            <button
              onClick={() => setBilling('monthly')}
              style={{
                padding: '8px 22px',
                borderRadius: '8px',
                border: `1.5px solid ${billing === 'monthly' ? '#5b52f5' : '#e8e5df'}`,
                background: billing === 'monthly' ? '#5b52f5' : 'white',
                color: billing === 'monthly' ? 'white' : '#6b6e87',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >Monthly</button>
            <button
              onClick={() => setBilling('annual')}
              style={{
                padding: '8px 22px',
                borderRadius: '8px',
                border: `1.5px solid ${billing === 'annual' ? '#5b52f5' : '#e8e5df'}`,
                background: billing === 'annual' ? '#5b52f5' : 'white',
                color: billing === 'annual' ? 'white' : '#6b6e87',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Annual
              <span style={{ background: 'rgba(255,255,255,0.25)', color: billing === 'annual' ? 'white' : '#5b52f5', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', border: billing === 'annual' ? 'none' : '1px solid #5b52f5' }}>Save 20%</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {plans.map(plan => (
              <div key={plan.name} style={{
                background: plan.popular ? '#0f1117' : 'white',
                border: plan.popular ? '1px solid rgba(91,82,245,0.4)' : '1px solid #e8e5df',
                borderRadius: '16px',
                padding: '32px',
                position: 'relative',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-13px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#5b52f5',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 16px',
                    borderRadius: '100px',
                    whiteSpace: 'nowrap',
                  }}>Most popular</div>
                )}
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px', color: plan.popular ? 'white' : '#0f1117' }}>{plan.name}</div>
                <div style={{ fontSize: '13px', color: plan.popular ? 'rgba(255,255,255,0.45)' : '#9b9b98', marginBottom: '24px' }}>{plan.desc}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: plan.popular ? 'rgba(255,255,255,0.7)' : '#6b6e87' }}>£</span>
                  <span style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: plan.popular ? 'white' : '#0f1117' }}>{fmt(plan.price)}</span>
                  <span style={{ fontSize: '14px', color: plan.popular ? 'rgba(255,255,255,0.45)' : '#9b9b98' }}>/mo</span>
                </div>
                {billing === 'annual' && (
                  <div style={{ fontSize: '12px', color: plan.popular ? 'rgba(255,255,255,0.35)' : '#9b9b98', marginBottom: '4px', textDecoration: 'line-through' }}>£{plan.price}/mo</div>
                )}
                <div style={{ fontSize: '12px', color: '#5b52f5', fontWeight: 600, marginBottom: '24px' }}>✓ 14-day free trial</div>
                <ul style={{ listStyle: 'none', marginBottom: '28px', padding: 0 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: '13px', color: plan.popular ? 'rgba(255,255,255,0.65)' : '#6b6e87', padding: '5px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#5b52f5', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/signup')}
                  style={{
                    width: '100%',
                    background: plan.popular ? '#5b52f5' : 'transparent',
                    color: plan.popular ? 'white' : '#0f1117',
                    border: plan.popular ? 'none' : '1.5px solid #e8e5df',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Start free trial
                </button>
              </div>
            ))}
          </div>

          {/* Founding member banner */}
          <div style={{ marginTop: '24px', background: '#0f1117', borderRadius: '14px', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '22px' }}>🎉</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                Founding member pricing — {FOUNDING_CLAIMED} of 50 spots claimed
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                Starter £49 · Growth £129 · Scale £399 · Locked in forever, even as we raise prices
              </div>
            </div>
            <div style={{ width: '120px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
                <span>{FOUNDING_CLAIMED} claimed</span>
                <span>50 total</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(FOUNDING_CLAIMED / 50) * 100}%`, background: '#5b52f5', borderRadius: '100px' }} />
              </div>
            </div>
            <button
              onClick={() => router.push('/signup')}
              style={{ background: '#5b52f5', color: 'white', border: 'none', borderRadius: '9px', padding: '12px 24px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}
            >
              Claim founding rate →
            </button>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: 'white', paddingTop: '96px', paddingBottom: '96px' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 48px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '48px', textAlign: 'center', color: '#0f1117' }}>Common questions</h2>
          {[
            {
              q: 'How is this different from Feedonomics?',
              a: 'Feedonomics is built for enterprise teams with dedicated onboarding, annual contracts, and £1,000+/month price tags. Auxio is self-serve — connect your channels, import your products, and publish in under 10 minutes. No specialists, no minimum spend, no long-term commitment.',
            },
            {
              q: 'What if I already have listings on eBay and Amazon?',
              a: 'Existing listings stay live — Auxio doesn\'t touch what\'s already there. You create new listings through Auxio and it manages those going forward. You can migrate your existing listings at your own pace.',
            },
            {
              q: 'Do I need technical knowledge to set this up?',
              a: 'No. Channel connections use standard OAuth — click Connect, log in to your account, done. Listing creation is a straightforward form. CSV import handles bulk uploads automatically. No API keys, no developer needed.',
            },
            {
              q: 'What happens to my listings if I cancel?',
              a: 'Your listings stay live on all channels — we don\'t delete anything. You just lose access to Auxio\'s management dashboard. Month-to-month, cancel any time, no data held hostage.',
            },
            {
              q: 'Does the AI actually improve my listings, or is it just rewriting them?',
              a: 'It\'s specifically trained on platform requirements. For eBay, it respects the 80-character title limit and uses search-friendly keywords. For Amazon, it formats bullet points for A9. For Shopify, it writes brand-focused copy. These aren\'t generic rewrites — they\'re channel-specific optimisations.',
            },
          ].map(item => (
            <div key={item.q} style={{ borderBottom: '1px solid #e8e5df', padding: '24px 0' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px', color: '#0f1117' }}>{item.q}</div>
              <div style={{ fontSize: '14px', color: '#6b6e87', lineHeight: 1.7 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ background: '#0f1117', paddingTop: '96px', paddingBottom: '96px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 60% at 50% 100%, rgba(91,82,245,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(91,82,245,0.12)',
            border: '1px solid rgba(91,82,245,0.25)',
            borderRadius: '100px',
            padding: '6px 16px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.55)',
            marginBottom: '28px',
            fontWeight: 500,
          }}>
            <span style={{ width: '6px', height: '6px', background: '#5b52f5', borderRadius: '50%', display: 'inline-block' }}></span>
            {50 - FOUNDING_CLAIMED} founding member spots remaining
          </div>
          <h2 style={{ fontSize: '48px', fontWeight: 800, color: 'white', letterSpacing: '-0.04em', marginBottom: '16px', lineHeight: 1.05 }}>
            Stop managing channels.<br />Start scaling them.
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.45)', marginBottom: '36px', lineHeight: 1.6 }}>
            Join 200+ sellers who've stopped copy-pasting listings across platforms and started actually growing.
          </p>
          <button
            onClick={() => router.push('/signup')}
            style={{ background: '#5b52f5', color: 'white', border: 'none', borderRadius: '10px', fontSize: '17px', fontWeight: 700, cursor: 'pointer', padding: '16px 40px', fontFamily: 'inherit' }}
          >
            Start your free trial →
          </button>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', marginTop: '16px' }}>No credit card · 14-day free trial · Cancel anytime</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: '#0f1117', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg, #5b52f5 0%, #7c6af8 100%)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 800 }}>A</div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>Auxio</span>
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>Multichannel eCommerce made simple.</div>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            {[['Privacy Policy', '/privacy'], ['Terms of Service', '#'], ['Contact', '#']].map(([label, href]) => (
              <a key={label} href={href} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>© 2026 NPX Solutions Ltd</div>
        </div>
      </footer>

    </div>
  )
}
