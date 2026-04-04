'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChannelOptimisationInfographic, TrueProfitWaterfall, TimeSavedInfographic } from './components/LandingInfographics'

const FOUNDING_CLAIMED = 23

function ProductMockup() {
  const rows = [
    { title: 'Nike Air Max 90 — UK 10',     price: '£89.99',  stock: '3', status: 'published', statusColor: '#0f7b6c', statusBg: '#e8f5f3', ch: [1,1,1] },
    { title: 'Adidas Ultraboost 22 — UK 9', price: '£119.99', stock: '1', status: 'published', statusColor: '#0f7b6c', statusBg: '#e8f5f3', ch: [1,1,0] },
    { title: 'New Balance 574 — UK 11',     price: '£74.99',  stock: '5', status: 'draft',     statusColor: '#9b9b98', statusBg: '#f1f1ef', ch: [0,0,0] },
    { title: 'Puma RS-X — UK 8',            price: '£54.99',  stock: '0', status: 'failed',    statusColor: '#c9372c', statusBg: '#fce8e6', ch: [1,0,0] },
  ]
  const chIcons = ['🛍️','🛒','📦']

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', borderRadius: '16px', border: '1px solid #e8e8e5', boxShadow: '0 24px 80px rgba(0,0,0,0.10)', overflow: 'hidden', background: 'white' }}>
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
            <div style={{ width: '22px', height: '22px', background: '#191919', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 700 }}>A</div>
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
            {rows.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 32px 1fr 64px 44px 88px 68px', gap: '8px', padding: '8px 12px', borderBottom: i < rows.length - 1 ? '1px solid #f7f7f5' : 'none', alignItems: 'center' }}>
                <div style={{ width: '11px', height: '11px', border: '1.5px solid #d8d8d4', borderRadius: '2px' }} />
                <div style={{ width: '28px', height: '28px', borderRadius: '5px', background: '#f1f1ef' }} />
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#191919', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#191919' }}>{row.price}</div>
                <div style={{ fontSize: '10px', color: row.stock === '0' ? '#c9372c' : '#191919', fontWeight: row.stock === '0' ? 700 : 400 }}>{row.stock === '0' ? 'Out' : row.stock}</div>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {row.ch.map((on, ci) => (
                    <div key={ci} style={{ width: '22px', height: '22px', borderRadius: '5px', background: on ? '#f0f7ff' : '#fafafa', border: `1px solid ${on ? '#c7dff7' : '#f0f0ec'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', opacity: on ? 1 : 0.3 }}>{on ? chIcons[ci] : '·'}</div>
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
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#ffffff', color: '#191919', minHeight: '100vh' }}>

      {/* ANNOUNCEMENT BAR */}
      <div style={{ background: '#191919', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: '#888' }}>
          🎉 Founding member pricing — <strong style={{ color: 'white' }}>{FOUNDING_CLAIMED} of 50 spots claimed.</strong> Starter from £49/mo, locked in forever.
        </span>
        <button
          onClick={() => router.push('/signup')}
          style={{ background: 'white', color: '#191919', border: 'none', borderRadius: '5px', padding: '5px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Claim your spot →
        </button>
      </div>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e8e5', padding: '0 48px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Auxio</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="#how-it-works" style={{ fontSize: '14px', color: '#787774', textDecoration: 'none', fontWeight: 500 }}>How it works</a>
          <a href="#pricing"      style={{ fontSize: '14px', color: '#787774', textDecoration: 'none', fontWeight: 500 }}>Pricing</a>
          <button onClick={() => router.push('/login')}  style={{ background: 'transparent', border: 'none', color: '#787774', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '8px 16px' }}>Sign in</button>
          <button onClick={() => router.push('/signup')} style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '8px 18px' }}>Start free →</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ padding: '80px 48px 72px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Copy block — centered */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 56px' }}>
          {/* Social proof strip */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#f7f7f5', border: '1px solid #e8e8e5', borderRadius: '100px', padding: '7px 18px', fontSize: '13px', color: '#787774', marginBottom: '28px', fontWeight: 500 }}>
            <div style={{ display: 'flex' }}>
              {['S','M','A','R','T'].map((l, i) => (
                <div key={i} style={{ width: '24px', height: '24px', borderRadius: '50%', background: ['#2383e2','#0f7b6c','#d9730d','#7c3aed','#c9372c'][i], color: 'white', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? '-6px' : 0, border: '2px solid #f7f7f5', position: 'relative', zIndex: 5 - i }}>
                  {l}
                </div>
              ))}
            </div>
            <span>Trusted by <strong style={{ color: '#191919' }}>200+ UK sellers</strong></span>
          </div>

          <h1 style={{ fontSize: '68px', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.0, marginBottom: '22px' }}>
            List once.<br />
            <span style={{ color: '#2383e2' }}>Sell everywhere.</span>
          </h1>

          <p style={{ fontSize: '20px', color: '#787774', maxWidth: '580px', margin: '0 auto 36px', lineHeight: 1.65, fontWeight: 400 }}>
            Auxio connects Shopify, eBay and Amazon. Create one listing and publish to all three — with AI-optimised titles, descriptions, and attributes per platform. In under 10 minutes.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
            <button
              onClick={() => router.push('/signup')}
              style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', padding: '14px 32px' }}
            >
              Start 7-day free trial →
            </button>
            <a
              href="#how-it-works"
              style={{ background: 'transparent', color: '#191919', border: '1.5px solid #e8e8e5', borderRadius: '8px', fontSize: '15px', fontWeight: 500, cursor: 'pointer', padding: '13px 24px', textDecoration: 'none', display: 'inline-block' }}
            >
              See how it works
            </a>
          </div>
          <p style={{ fontSize: '13px', color: '#9b9b98' }}>No credit card required · Cancel any time · 2-minute setup</p>
        </div>

        {/* PRODUCT MOCKUP */}
        <ProductMockup />

        {/* Channel logos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', marginTop: '48px', paddingTop: '40px', borderTop: '1px solid #e8e8e5' }}>
          <span style={{ fontSize: '12px', color: '#9b9b98', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Works with</span>
          {[
            { label: 'Shopify',  icon: '🛍️', color: '#96BF48' },
            { label: 'eBay',     icon: '🛒', color: '#E53238' },
            { label: 'Amazon',   icon: '📦', color: '#FF9900' },
          ].map(ch => (
            <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', border: '1px solid #e8e8e5', borderRadius: '8px', background: 'white' }}>
              <span style={{ fontSize: '16px' }}>{ch.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#191919' }}>{ch.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', border: '1px dashed #e8e8e5', borderRadius: '8px' }}>
            <span style={{ fontSize: '13px', color: '#9b9b98' }}>+ Etsy, TikTok Shop coming</span>
          </div>
        </div>
      </div>

      {/* PROBLEM */}
      <div style={{ background: '#f7f7f5', borderTop: '1px solid #e8e8e5', borderBottom: '1px solid #e8e8e5', padding: '80px 48px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#c9372c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>The problem</div>
          <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '14px', lineHeight: 1.1 }}>
            Managing listings across channels<br />is a full-time job
          </h2>
          <p style={{ fontSize: '17px', color: '#787774', marginBottom: '48px', lineHeight: 1.6, maxWidth: '680px', margin: '0 auto 48px' }}>
            Every platform has different requirements. Getting it right on all three means hours of copy-paste, manual exports, and constant fixes — every time you add a product.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'left', marginBottom: '56px' }}>
            {[
              {
                icon: '⏱',
                label: '#1 Time',
                title: '3+ hours wasted per product launch',
                desc: 'One product, three platforms. eBay wants keyword-rich titles. Amazon needs bullet points. Shopify wants your brand story. Getting all three right takes all afternoon.',
              },
              {
                icon: '❌',
                label: '#2 Errors',
                title: 'Listings rejected — and you only find out after',
                desc: 'Wrong category, missing required attributes, title too long. Each platform has its own rules. You only discover the violations after publishing — if you\'re lucky.',
              },
              {
                icon: '💸',
                label: '#3 Cost',
                title: 'Enterprise tools charge £1,000+/month',
                desc: 'Feedonomics and ChannelAdvisor are built for teams with dedicated onboarding specialists. If you\'re not a retailer spending £10M/year, they\'re not built for you.',
              },
            ].map(p => (
              <div key={p.title} style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '12px', padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '26px' }}>{p.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#c9372c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.label}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px', lineHeight: 1.3, color: '#191919' }}>{p.title}</div>
                <div style={{ fontSize: '14px', color: '#787774', lineHeight: 1.65 }}>{p.desc}</div>
              </div>
            ))}
          </div>

          <TimeSavedInfographic />
        </div>
      </div>

      {/* SOLUTION */}
      <div style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f7b6c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>The solution</div>
        <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '14px' }}>
          One listing. Three platforms. Zero copy-paste.
        </h2>
        <p style={{ fontSize: '17px', color: '#787774', maxWidth: '620px', margin: '0 auto 56px', lineHeight: 1.6 }}>
          Auxio sits between your products and your sales channels. Create once, and it handles the formatting, optimisation, and publishing for each platform — automatically.
        </p>
        <ChannelOptimisationInfographic />
      </div>

      {/* HOW IT WORKS */}
      <div id="how-it-works" style={{ background: '#f7f7f5', borderTop: '1px solid #e8e8e5', borderBottom: '1px solid #e8e8e5', padding: '80px 48px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#2383e2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', textAlign: 'center' }}>How it works</div>
          <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '8px', textAlign: 'center' }}>Up and running in 2 minutes</h2>
          <p style={{ fontSize: '16px', color: '#787774', marginBottom: '48px', textAlign: 'center', lineHeight: 1.6 }}>No specialists. No onboarding calls. No annual contracts.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              {
                step: '01',
                title: 'Connect your channels',
                desc: 'Link Shopify, eBay and Amazon with OAuth in one click each. Your existing products and orders sync automatically. Takes under 2 minutes.',
                color: '#2383e2',
                tag: '~2 minutes',
              },
              {
                step: '02',
                title: 'Create or import your listings',
                desc: 'Add products manually, import via CSV, or pull directly from your Shopify store. Auxio maps your columns automatically and handles 25+ field name variations.',
                color: '#0f7b6c',
                tag: '~5 minutes for 100 products',
              },
              {
                step: '03',
                title: 'AI optimises per channel',
                desc: 'Auxio rewrites your title and description for each platform — keyword-rich for eBay\'s Cassini algorithm, bullet-point format for Amazon\'s A9, brand-forward for Shopify.',
                color: '#7c3aed',
                tag: 'Automatic',
              },
              {
                step: '04',
                title: 'Publish everywhere in one click',
                desc: 'Hit publish and Auxio pushes the listing to every selected channel simultaneously. Feed health scoring catches category errors, missing attributes, and title issues before they go live.',
                color: '#d9730d',
                tag: '1 click',
              },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: '24px', padding: '24px 28px', background: 'white', borderRadius: '12px', border: '1px solid #e8e8e5', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: item.color, minWidth: '28px', paddingTop: '2px', letterSpacing: '-0.01em' }}>{item.step}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '17px', fontWeight: 600, color: '#191919' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: item.color, background: item.color + '12', padding: '3px 9px', borderRadius: '100px', whiteSpace: 'nowrap' }}>{item.tag}</div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#787774', lineHeight: 1.65 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#2383e2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', textAlign: 'center' }}>What sellers say</div>
        <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '48px', textAlign: 'center' }}>
          Real sellers. Real results.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            {
              quote: 'I was spending 3 hours every time I listed a new product across eBay and Shopify. Now it takes 10 minutes. I\'ve relisted my entire back catalogue in a weekend.',
              name: 'Sarah T.',
              role: 'Clothing reseller, Sheffield',
              plan: 'Growth plan',
              stat: '3h → 10min',
              statLabel: 'per product launch',
              initials: 'ST',
              color: '#2383e2',
            },
            {
              quote: 'The AI-written eBay titles actually rank better than the ones I was writing manually. My impressions went up 40% in the first month without touching a single listing.',
              name: 'Marcus B.',
              role: 'Electronics seller, Manchester',
              plan: 'Scale plan',
              stat: '+40%',
              statLabel: 'eBay impressions',
              initials: 'MB',
              color: '#0f7b6c',
            },
            {
              quote: 'Feedonomics wanted £1,200/month with a year\'s contract and an onboarding specialist. Auxio was live in an afternoon. Night and day difference for a small operation like mine.',
              name: 'The Vintage Room',
              role: 'Boutique reseller, Bristol',
              plan: 'Starter plan',
              stat: '£1,200 → £49',
              statLabel: 'per month vs Feedonomics',
              initials: 'VR',
              color: '#7c3aed',
            },
          ].map(t => (
            <div key={t.name} style={{ border: '1px solid #e8e8e5', borderRadius: '14px', padding: '28px', background: 'white', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Stars */}
              <div style={{ display: 'flex', gap: '3px' }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#F59E0B', fontSize: '15px' }}>★</span>)}
              </div>
              {/* Stat callout */}
              <div style={{ background: t.color + '0e', borderRadius: '8px', padding: '14px 16px', borderLeft: `3px solid ${t.color}` }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: t.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{t.stat}</div>
                <div style={{ fontSize: '12px', color: '#787774', marginTop: '3px' }}>{t.statLabel}</div>
              </div>
              {/* Quote */}
              <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.7, margin: 0, flex: 1 }}>"{t.quote}"</p>
              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f1ef' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: t.color, color: 'white', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {t.initials}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#191919' }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: '#9b9b98' }}>{t.role} · {t.plan}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ background: '#f7f7f5', borderTop: '1px solid #e8e8e5', borderBottom: '1px solid #e8e8e5', padding: '80px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#2383e2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', textAlign: 'center' }}>Features</div>
          <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '8px', textAlign: 'center' }}>Everything you need to scale</h2>
          <p style={{ fontSize: '16px', color: '#787774', marginBottom: '48px', textAlign: 'center' }}>Built for sellers who want to grow, not spend their days maintaining spreadsheets.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              {
                icon: '🔁',
                title: 'One-click multi-channel publish',
                desc: 'Push to Shopify, eBay, and Amazon simultaneously. The right format for each platform, sent in one click.',
                tag: 'Core',
                tagColor: '#2383e2',
              },
              {
                icon: '🤖',
                title: 'AI listing optimisation',
                desc: 'Channel-specific titles and descriptions written automatically. eBay titles that respect the 80-char limit and rank on Cassini. Amazon bullets ready for A9. Every time.',
                tag: 'AI-powered',
                tagColor: '#7c3aed',
              },
              {
                icon: '✅',
                title: 'Feed health scoring',
                desc: 'See exactly what\'s blocking a listing per channel before it goes live — missing images, wrong category, title too long, required attributes empty.',
                tag: 'Core',
                tagColor: '#2383e2',
              },
              {
                icon: '📥',
                title: 'CSV bulk import',
                desc: 'Upload your full catalogue in minutes. Auxio maps columns intelligently and handles 25+ field name variations. 1,000 products in one upload.',
                tag: 'Core',
                tagColor: '#2383e2',
              },
              {
                icon: '📊',
                title: 'True profit dashboard',
                desc: 'Real profit per order after every fee, every shipping cost, every ad pound. Know which channels and products actually make money — not just revenue.',
                tag: 'Intelligence',
                tagColor: '#0f7b6c',
              },
              {
                icon: '📦',
                title: 'Inventory management',
                desc: 'Track stock levels across all channels. Set reorder points. Get alerts before you oversell. Sync quantity changes back to all connected platforms.',
                tag: 'Core',
                tagColor: '#2383e2',
              },
            ].map(f => (
              <div key={f.title} style={{ border: '1px solid #e8e8e5', borderRadius: '12px', padding: '26px 24px', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '28px' }}>{f.icon}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: f.tagColor, background: f.tagColor + '12', padding: '3px 8px', borderRadius: '100px', letterSpacing: '0.02em' }}>{f.tag}</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.3, color: '#191919' }}>{f.title}</div>
                <div style={{ fontSize: '13px', color: '#787774', lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TRUE PROFIT */}
      <div style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f7b6c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>True profit intelligence</div>
        <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '14px', lineHeight: 1.1 }}>
          Revenue is vanity.<br />Profit is reality.
        </h2>
        <p style={{ fontSize: '17px', color: '#787774', maxWidth: '600px', margin: '0 auto 48px', lineHeight: 1.6 }}>
          Most sellers know what they sold. Almost none know what they kept. Auxio strips out every fee, every shipping cost, every ad pound — so you see true profit, per order, per channel.
        </p>
        <TrueProfitWaterfall />
      </div>

      {/* VS COMPETITORS */}
      <div style={{ background: '#191919', padding: '80px 48px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Why Auxio</div>
          <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', color: 'white', marginBottom: '12px' }}>
            Built for sellers, not enterprise IT
          </h2>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '48px', lineHeight: 1.6 }}>Feedonomics and ChannelAdvisor are great tools — for £10M/year retailers with dedicated ops teams. Auxio is for everyone else.</p>

          <div style={{ background: '#111', borderRadius: '14px', overflow: 'hidden', marginBottom: '48px', border: '1px solid #2a2a2a' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #222' }}>
              <div style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em' }}></div>
              <div style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: '#555', textAlign: 'center', borderLeft: '1px solid #222' }}>Feedonomics / ChannelAdvisor</div>
              <div style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 700, color: '#2383e2', textAlign: 'center', borderLeft: '1px solid #222', background: '#0d1929' }}>Auxio</div>
            </div>
            {[
              { label: 'Setup time',       them: '2–4 weeks with onboarding',  us: '2 minutes, self-serve' },
              { label: 'Price',            them: '£1,000–£5,000/month',        us: 'From £49/month' },
              { label: 'Contract',         them: 'Annual contract required',    us: 'Month to month' },
              { label: 'Who runs it',      them: 'Dedicated agency team',       us: 'You — no agency needed' },
              { label: 'AI optimisation',  them: 'Manual rules only',           us: 'Built-in per-channel AI' },
              { label: 'Profit tracking',  them: 'Add-on or not included',      us: 'Included on all plans' },
            ].map((row, i) => (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: i < 5 ? '1px solid #1a1a1a' : 'none' }}>
                <div style={{ padding: '13px 20px', fontSize: '13px', fontWeight: 500, color: '#787774' }}>{row.label}</div>
                <div style={{ padding: '13px 20px', fontSize: '13px', color: '#444', textAlign: 'center', borderLeft: '1px solid #1a1a1a' }}>{row.them}</div>
                <div style={{ padding: '13px 20px', fontSize: '13px', color: '#7eb8f7', textAlign: 'center', borderLeft: '1px solid #1a1a1a', background: '#0d1929', fontWeight: 500 }}>
                  <span style={{ color: '#4ade80', marginRight: '4px' }}>✓</span>{row.us}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ background: '#f7f7f5', borderBottom: '1px solid #e8e8e5', padding: '64px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'center' }}>
            {[
              { value: '< 10 min', label: 'Average time to first published listing' },
              { value: '3',        label: 'Channels managed from one dashboard simultaneously' },
              { value: '20×',      label: 'Faster than managing channels manually' },
              { value: '£49/mo',   label: 'Starting price — fraction of enterprise tools' },
            ].map(stat => (
              <div key={stat.value}>
                <div style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', color: '#191919', marginBottom: '8px' }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: '#787774', lineHeight: 1.55 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing" style={{ padding: '80px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#2383e2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', textAlign: 'center' }}>Pricing</div>
        <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '8px', textAlign: 'center' }}>Simple, transparent pricing</h2>
        <p style={{ fontSize: '16px', color: '#787774', marginBottom: '32px', textAlign: 'center' }}>7-day free trial on all plans. No credit card required.</p>

        {/* Billing toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
          <button
            onClick={() => setBilling('monthly')}
            style={{ padding: '8px 20px', borderRadius: '7px', border: `1.5px solid ${billing === 'monthly' ? '#191919' : '#e8e8e5'}`, background: billing === 'monthly' ? '#191919' : 'white', color: billing === 'monthly' ? 'white' : '#787774', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            style={{ padding: '8px 20px', borderRadius: '7px', border: `1.5px solid ${billing === 'annual' ? '#191919' : '#e8e8e5'}`, background: billing === 'annual' ? '#191919' : 'white', color: billing === 'annual' ? 'white' : '#787774', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Annual
            <span style={{ background: '#0f7b6c', color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px' }}>Save 20%</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {plans.map(plan => (
            <div key={plan.name} style={{ border: plan.popular ? '2px solid #2383e2' : '1px solid #e8e8e5', borderRadius: '14px', padding: '28px 22px', position: 'relative', background: '#fff' }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: '#2383e2', color: 'white', fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '100px', whiteSpace: 'nowrap' }}>Most popular</div>
              )}
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '3px', color: '#191919' }}>{plan.name}</div>
              <div style={{ fontSize: '12px', color: '#9b9b98', marginBottom: '20px' }}>{plan.desc}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginBottom: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#191919' }}>£</span>
                <span style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: '#191919' }}>{fmt(plan.price)}</span>
                <span style={{ fontSize: '13px', color: '#9b9b98' }}>/mo</span>
              </div>
              {billing === 'annual' && (
                <div style={{ fontSize: '12px', color: '#9b9b98', marginBottom: '4px', textDecoration: 'line-through' }}>£{plan.price}/mo</div>
              )}
              <div style={{ fontSize: '12px', color: '#0f7b6c', fontWeight: 600, marginBottom: '22px' }}>✓ 7-day free trial</div>
              <ul style={{ listStyle: 'none', marginBottom: '24px', padding: 0 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: '13px', color: '#787774', padding: '4px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ color: '#0f7b6c', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/signup')}
                style={{ width: '100%', background: plan.popular ? '#2383e2' : 'transparent', color: plan.popular ? 'white' : '#191919', border: plan.popular ? 'none' : '1.5px solid #e8e8e5', borderRadius: '7px', padding: '11px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Start free trial
              </button>
            </div>
          ))}
        </div>

        {/* Founding member banner */}
        <div style={{ marginTop: '24px', background: '#191919', borderRadius: '12px', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '22px' }}>🎉</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '3px' }}>
              Founding member pricing — {FOUNDING_CLAIMED} of 50 spots claimed
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              Starter £49 · Growth £129 · Scale £399 · Locked in forever, even as we raise prices
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ width: '120px', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555', marginBottom: '5px' }}>
              <span>{FOUNDING_CLAIMED} claimed</span>
              <span>50 total</span>
            </div>
            <div style={{ height: '5px', background: '#333', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(FOUNDING_CLAIMED / 50) * 100}%`, background: '#2383e2', borderRadius: '100px' }} />
            </div>
          </div>
          <button
            onClick={() => router.push('/signup')}
            style={{ background: 'white', color: '#191919', border: 'none', borderRadius: '7px', padding: '11px 22px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}
          >
            Claim founding rate →
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: '#f7f7f5', borderTop: '1px solid #e8e8e5', borderBottom: '1px solid #e8e8e5', padding: '80px 48px' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '40px', textAlign: 'center' }}>Common questions</h2>
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
            <div key={item.q} style={{ borderBottom: '1px solid #e8e8e5', padding: '24px 0' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px', color: '#191919' }}>{item.q}</div>
              <div style={{ fontSize: '14px', color: '#787774', lineHeight: 1.7 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ background: '#191919', padding: '96px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1a2744', border: '1px solid #2a3a5e', borderRadius: '100px', padding: '6px 16px', fontSize: '13px', color: '#7eb8f7', marginBottom: '28px', fontWeight: 500 }}>
            <span style={{ width: '6px', height: '6px', background: '#2383e2', borderRadius: '50%', display: 'inline-block' }}></span>
            {50 - FOUNDING_CLAIMED} founding member spots remaining
          </div>
          <h2 style={{ fontSize: '48px', fontWeight: 700, color: 'white', letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.05 }}>
            Stop managing channels.<br />Start scaling them.
          </h2>
          <p style={{ fontSize: '18px', color: '#888', marginBottom: '36px', lineHeight: 1.6 }}>
            Join 200+ sellers who've stopped copy-pasting listings across platforms and started actually growing.
          </p>
          <button
            onClick={() => router.push('/signup')}
            style={{ background: '#2383e2', color: 'white', border: 'none', borderRadius: '8px', fontSize: '17px', fontWeight: 700, cursor: 'pointer', padding: '16px 40px', fontFamily: 'inherit' }}
          >
            Start your free 7-day trial →
          </button>
          <p style={{ fontSize: '13px', color: '#555', marginTop: '16px' }}>No credit card required · Cancel any time · Setup in 2 minutes</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: '#f7f7f5', borderTop: '1px solid #e8e8e5', padding: '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#191919' }}>Auxio</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['Privacy Policy', '/privacy'], ['Terms of Service', '#'], ['Contact', '#']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: '13px', color: '#9b9b98', textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
        <div style={{ fontSize: '13px', color: '#9b9b98' }}>© 2026 NPX Solutions Ltd</div>
      </footer>

    </div>
  )
}
