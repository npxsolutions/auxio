'use client'

import Link from 'next/link'
import { useState } from 'react'

const NAV = [
  { label: 'Features',     href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'About',        href: '/about' },
]

const FOUNDING_CLAIMED = 23

const PLANS = [
  {
    name: 'Starter',
    monthlyPrice: 79,
    annualPrice: 63,
    foundingPrice: 49,
    desc: 'Perfect for solo sellers getting started on their first marketplace.',
    color: '#64748b',
    features: [
      '1 sales channel',
      'Up to 500 active listings',
      'CSV import & bulk upload',
      'Feed health scoring & error hub',
      'True profit dashboard',
      'Email support',
    ],
    cta: 'Start free trial',
    popular: false,
  },
  {
    name: 'Growth',
    monthlyPrice: 199,
    annualPrice: 159,
    foundingPrice: 129,
    desc: 'For sellers scaling across multiple channels who need automation.',
    color: '#5b52f5',
    features: [
      '3 sales channels',
      'Unlimited listings',
      'AI listing optimisation',
      'AI agent & chat',
      'Feed rules engine',
      'Social Intelligence',
      'Priority support',
    ],
    cta: 'Start free trial',
    popular: true,
  },
  {
    name: 'Scale',
    monthlyPrice: 599,
    annualPrice: 479,
    foundingPrice: 399,
    desc: 'High-volume operations that need full automation and deep analytics.',
    color: '#059669',
    features: [
      '5 sales channels',
      'Everything in Growth',
      'Autopilot AI agent',
      'Real-time inventory sync',
      'Full ML analytics suite',
      'Repricing engine',
      'Dedicated account manager',
    ],
    cta: 'Start free trial',
    popular: false,
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    foundingPrice: null,
    desc: 'Agencies, large catalogues, and custom requirements.',
    color: '#d97706',
    features: [
      'Unlimited channels',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      'Full API access',
      'White-label option',
      'Custom onboarding',
    ],
    cta: 'Talk to us',
    popular: false,
  },
]

const COMPARE = [
  { feature: 'Channels supported',     auxio: '12+',         feedonomics: '300+',       rithum: '420+',     baselinker: '1,000+' },
  { feature: 'Starting price',         auxio: '£49/mo',      feedonomics: 'Custom',     rithum: '$2,000+',  baselinker: '$19/mo' },
  { feature: 'Time to go live',        auxio: '< 10 min',    feedonomics: 'Weeks',      rithum: 'Months',   baselinker: '1-2 days' },
  { feature: 'AI listing optimisation',auxio: '✓',           feedonomics: '✓',          rithum: '✓',        baselinker: '✗' },
  { feature: 'True profit tracking',   auxio: '✓',           feedonomics: '✗',          rithum: 'Partial',  baselinker: '✗' },
  { feature: 'Social Intelligence',    auxio: '✓',           feedonomics: '✗',          rithum: '✗',        baselinker: '✗' },
  { feature: 'Self-serve setup',       auxio: '✓',           feedonomics: 'Managed',    rithum: 'Managed',  baselinker: '✓' },
  { feature: 'UK-first support',       auxio: '✓',           feedonomics: '✗',          rithum: '✗',        baselinker: 'Partial' },
  { feature: 'Transparent pricing',    auxio: '✓',           feedonomics: '✗',          rithum: '✗',        baselinker: '✓' },
]

const FAQ = [
  { q: 'Is there a free trial?', a: 'Yes — every plan starts with a 14-day free trial. No credit card required. You get full access to all features on your chosen plan.' },
  { q: 'What happens after my trial?', a: "You'll be prompted to enter payment details. If you don't, your account moves to read-only mode — your listings on channels stay live, you just can't create new ones or make changes through Auxio." },
  { q: 'Can I switch plans?', a: 'Yes, upgrade or downgrade at any time. Upgrades take effect immediately. Downgrades take effect at the next billing date.' },
  { q: 'What counts as a "channel"?', a: 'Each marketplace or store counts as one channel — so eBay UK, Amazon UK, and Shopify would be three channels. Channel connections within the same platform (e.g. eBay UK + eBay US) each count separately.' },
  { q: 'Do you take a cut of my revenue?', a: "Never. We charge a flat monthly subscription. No percentage of GMV, no per-order fees, no hidden charges. What you see is what you pay." },
  { q: 'How is this different from Feedonomics?', a: 'Feedonomics is built for enterprise teams — dedicated specialists, custom contracts, and prices starting at £1,000+/month. Auxio is fully self-serve: connect your channels, import your products, and go live in under 10 minutes. Founding member pricing starts at £49/month.' },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const remaining = 50 - FOUNDING_CLAIMED

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', color: '#0f172a' }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e8e5', padding: '0 48px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>A</div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', letterSpacing: '-0.01em' }}>Auxio</span>
        </Link>
        <div style={{ display: 'flex', gap: '32px' }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{ fontSize: '14px', color: n.href === '/pricing' ? '#5b52f5' : '#64748b', textDecoration: 'none', fontWeight: n.href === '/pricing' ? 500 : 400 }}>{n.label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/login" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
          <Link href="/signup" style={{ padding: '8px 16px', borderRadius: '8px', background: '#0f172a', fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Start free →</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ paddingTop: '120px', paddingBottom: '60px', textAlign: 'center' }}>
        {/* Founding member banner */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', fontSize: '13px', color: '#d97706', fontWeight: 600, marginBottom: '24px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
          {remaining} founding member spots remaining at up to 40% off
        </div>

        <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 20px', color: '#0f172a' }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '480px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          No custom quotes. No percentage of revenue. No enterprise sales calls. Start free, upgrade when you're ready.
        </p>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '4px', background: '#f1f5f9', borderRadius: '10px' }}>
          <button onClick={() => setAnnual(false)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: !annual ? 'white' : 'transparent', color: !annual ? '#0f172a' : '#64748b', boxShadow: !annual ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>Monthly</button>
          <button onClick={() => setAnnual(true)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: annual ? 'white' : 'transparent', color: annual ? '#0f172a' : '#64748b', boxShadow: annual ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Annual
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#16a34a', fontWeight: 700 }}>Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 48px 80px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'start' }}>
        {PLANS.map(plan => (
          <div key={plan.name} style={{
            border: plan.popular ? `2px solid ${plan.color}` : '1px solid #e8e8e5',
            borderRadius: '16px',
            padding: '28px',
            position: 'relative',
            boxShadow: plan.popular ? `0 8px 40px rgba(91,82,245,0.15)` : 'none',
          }}>
            {plan.popular && (
              <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: plan.color, color: 'white', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                MOST POPULAR
              </div>
            )}

            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{plan.name}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>{plan.desc}</div>

            {plan.monthlyPrice ? (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
                    £{plan.foundingPrice}
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>/mo</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                  £{annual ? plan.annualPrice : plan.monthlyPrice}/mo regular price
                </div>
                <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 600, marginTop: '2px' }}>Founding member rate</div>
              </div>
            ) : (
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', letterSpacing: '-0.02em' }}>Custom</div>
            )}

            <Link
              href={plan.name === 'Enterprise' ? '/contact' : '/signup'}
              style={{
                display: 'block', textAlign: 'center', padding: '11px',
                borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                textDecoration: 'none', marginBottom: '24px', marginTop: '16px',
                background: plan.popular ? `linear-gradient(135deg, #5b52f5, #7c6af7)` : 'transparent',
                color: plan.popular ? 'white' : '#0f172a',
                border: plan.popular ? 'none' : '1px solid #e2e8f0',
              }}
            >
              {plan.cta} →
            </Link>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Includes</div>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="7" cy="7" r="6" fill={`${plan.color}20`}/>
                    <path d="M4.5 7l1.8 1.8L9.5 5" stroke={plan.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div style={{ background: '#fafafa', borderTop: '1px solid #f1f1ef', padding: '80px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '8px', textAlign: 'center' }}>How we compare</h2>
          <p style={{ fontSize: '16px', color: '#64748b', textAlign: 'center', marginBottom: '48px' }}>See why sellers choose Auxio over the enterprise alternatives.</p>

          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e8e5', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: '2px solid #f1f5f9' }}>
              <div style={{ padding: '16px 20px' }} />
              {['Auxio', 'Feedonomics', 'Rithum', 'Baselinker'].map((name, i) => (
                <div key={name} style={{ padding: '16px 12px', textAlign: 'center', background: i === 0 ? 'rgba(91,82,245,0.05)' : 'transparent', borderLeft: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: i === 0 ? '#5b52f5' : '#0f172a' }}>{name}</div>
                </div>
              ))}
            </div>

            {COMPARE.map((row, i) => (
              <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: i < COMPARE.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ padding: '14px 20px', fontSize: '13px', color: '#374151', fontWeight: 500 }}>{row.feature}</div>
                {[row.auxio, row.feedonomics, row.rithum, row.baselinker].map((val, j) => (
                  <div key={j} style={{ padding: '14px 12px', textAlign: 'center', background: j === 0 ? 'rgba(91,82,245,0.03)' : 'transparent', borderLeft: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: j === 0 ? '#5b52f5' : val === '✗' ? '#94a3b8' : '#374151' }}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 48px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '48px', textAlign: 'center' }}>Frequently asked questions</h2>
        {FAQ.map((item, i) => (
          <div key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '16px' }}
            >
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{item.q}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                <path d="M4 6l4 4 4-4" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {openFaq === i && (
              <div style={{ paddingBottom: '20px', fontSize: '14px', color: '#64748b', lineHeight: 1.7 }}>{item.a}</div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ background: '#0f172a', padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '40px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '16px' }}>Start your free trial today</h2>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>14 days free. No credit card required. Cancel any time.</p>
        <p style={{ fontSize: '14px', color: '#d97706', fontWeight: 600, marginBottom: '32px' }}>{remaining} founding member spots left at up to 40% off.</p>
        <Link href="/signup" style={{ display: 'inline-block', padding: '16px 32px', borderRadius: '10px', background: 'linear-gradient(135deg, #5b52f5, #7c6af7)', color: 'white', fontSize: '16px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(91,82,245,0.4)' }}>
          Claim your founding rate →
        </Link>
      </div>

      {/* Footer */}
      <footer style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>© 2026 Auxio. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['Privacy', '/privacy'], ['Features', '/features'], ['Integrations', '/integrations'], ['Login', '/login']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}
