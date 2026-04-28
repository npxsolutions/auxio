'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'
import { P, CARD, MONO, LABEL, HEADING, SECTION_HEADER, NUMBER, Button } from '../lib/design-system'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const FOUNDING_TOTAL = 10
const FOUNDING_CLAIMED = 0

type Currency = 'USD' | 'GBP' | 'EUR' | 'AUD' | 'CAD'
const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$',  label: 'USD' },
  { code: 'GBP', symbol: '£',  label: 'GBP' },
  { code: 'EUR', symbol: '€',  label: 'EUR' },
  { code: 'AUD', symbol: 'A$', label: 'AUD' },
  { code: 'CAD', symbol: 'C$', label: 'CAD' },
]

type Tier = { name: string; desc: string; channels: string; monthly: Record<Currency, number>; founding: Record<Currency, number>; features: string[] }

const TIERS: Tier[] = [
  {
    name: 'Starter',
    desc: 'Shopify-led sellers adding their first extra channel.',
    channels: '1 channel',
    monthly:  { USD:  99, GBP:  79, EUR:  89, AUD: 149, CAD: 129 },
    founding: { USD:  59, GBP:  49, EUR:  55, AUD:  89, CAD:  79 },
    features: ['Up to 500 listings', 'Per-channel P&L (rate-based)', 'Feed health scoring', 'No GMV fee on this tier'],
  },
  {
    name: 'Growth',
    desc: '$50k–$500k/mo GMV operators running 3–5 marketplaces.',
    channels: '3 channels',
    monthly:  { USD: 299, GBP: 239, EUR: 269, AUD: 449, CAD: 399 },
    founding: { USD: 199, GBP: 159, EUR: 179, AUD: 299, CAD: 269 },
    features: ['Unlimited listings', 'Payout-reconciled P&L (eBay/Shopify/Etsy)', 'AI listing optimisation', '+ 0.15% of GMV over $50k/mo (capped +$200/mo)'],
  },
  {
    name: 'Scale',
    desc: '$500k+/mo GMV merchants on every marketplace that matters.',
    channels: '5 channels',
    monthly:  { USD: 699, GBP: 559, EUR: 629, AUD: 1049, CAD:  939 },
    founding: { USD: 499, GBP: 399, EUR: 449, AUD:  749, CAD:  669 },
    features: ['Autopilot AI agent', 'Real-time inventory sync', 'Full ML analytics', '+ 0.10% of GMV over $250k/mo (capped +$1,500/mo)'],
  },
]

const BENEFITS: { title: string; body: string }[] = [
  {
    title: 'Founding price locked for life.',
    body: 'Up to 40% off standard pricing. The rate you sign up at today is the rate you pay forever — even after we raise list prices.',
  },
  {
    title: 'Direct Slack channel with the founding team.',
    body: 'Shared channel, not a ticket queue. Feature requests go from DM to roadmap in the same week.',
  },
  {
    title: 'Your workflow shapes the roadmap.',
    body: 'The next ten features ship in the order our founding partners need them. No committee, no product council.',
  },
  {
    title: 'Hands-on onboarding from me.',
    body: 'I personally set up the first channel connection, the first pre-flight validator pass, and the first per-channel P&L. One call, no handoff.',
  },
]

const FAQ: { q: string; a: string }[] = [
  { q: 'How long is the founding-partner price locked?', a: 'For the life of your subscription. If you stay, the price does not change — even when we raise standard pricing.' },
  { q: 'Is there a contract or minimum term?', a: 'No contract, no minimum. Monthly billing, cancel any time. The founding-partner rate only survives continuous subscription.' },
  { q: 'Can I upgrade or downgrade later?', a: 'Yes. Founding pricing applies to whichever tier you are on, at the same percentage discount off standard. Change plans any time.' },
  { q: 'What if I am not a Shopify seller?', a: 'The platform is Shopify-first today. If you are on WooCommerce or BigCommerce, email me directly — we are taking a handful of non-Shopify founding partners case-by-case.' },
  { q: 'Who should not buy this?', a: 'If you sell on one channel only, the ROI is thin. Founding partner is built for the operator running Shopify plus two to five marketplaces.' },
]

export default function FoundingPartnersPage() {
  const [currency, setCurrency] = useState<Currency>('USD')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const remaining = FOUNDING_TOTAL - FOUNDING_CLAIMED
  const currencySymbol = CURRENCIES.find(c => c.code === currency)!.symbol

  return (
    <div style={{ background: P.bg, minHeight: '100vh', fontFamily: 'var(--font-geist), -apple-system, system-ui, sans-serif', color: P.ink }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', maxWidth: 1160, margin: '0 auto' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2L18.66 18H1.34L10 2z" fill={P.ink} /></svg>
          <span style={{ fontSize: '14px', fontWeight: 600, color: P.ink, letterSpacing: '-0.01em' }}>Palvento</span>
        </Link>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/pricing" style={{ ...MONO, fontSize: '12px', color: P.muted, textDecoration: 'none', fontWeight: 500 }}>Standard pricing</Link>
          <Link href="/login" style={{ ...MONO, fontSize: '12px', color: P.muted, textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </div>
      </nav>

      <main style={{ maxWidth: 1160, margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '32px 0 56px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', background: P.cobaltSft, border: `1px solid ${P.cobalt}`, fontSize: '12px', color: P.cobalt, fontWeight: 600, marginBottom: '24px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: P.cobalt, display: 'inline-block' }} />
            {remaining} of {FOUNDING_TOTAL} spots open
          </div>

          <div style={{ ...SECTION_HEADER, marginBottom: '16px' }}>Founding partners — Y1</div>
          <h1 className={display.className} style={{ ...HEADING, fontSize: 'clamp(40px, 6vw, 72px)', letterSpacing: '-0.025em', lineHeight: 1.05, color: P.ink, margin: '0 auto 20px', maxWidth: 880 }}>
            10 spots. <em style={{ fontStyle: 'italic', color: P.cobalt }}>40% off for life.</em>
          </h1>
          <p style={{ fontSize: '17px', lineHeight: 1.6, color: P.mutedDk, margin: '0 auto 32px', maxWidth: 620 }}>
            Self-serve multichannel feed management for Shopify-led operators. Shopify OAuth in one click. Live on your first marketplace in under ten minutes. Founding rate locked for the life of your subscription.
          </p>

          {/* Currency switcher */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px', background: P.surface, border: `1px solid ${P.rule}`, borderRadius: '8px' }}>
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                aria-pressed={currency === c.code}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  background: currency === c.code ? P.cobalt : 'transparent',
                  color: currency === c.code ? '#fff' : P.muted,
                  transition: 'all 120ms ease',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {/* Pricing tiers */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '80px' }} className="pricing-grid">
          {TIERS.map(tier => {
            const discount = Math.round(((tier.monthly[currency] - tier.founding[currency]) / tier.monthly[currency]) * 100)
            return (
              <div key={tier.name} style={{ ...CARD, padding: '28px 24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ ...LABEL, color: P.cobalt, marginBottom: '6px' }}>{tier.channels}</div>
                <h3 style={{ fontSize: '22px', fontWeight: 600, color: P.ink, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{tier.name}</h3>
                <p style={{ fontSize: '13px', color: P.muted, lineHeight: 1.5, margin: '0 0 20px' }}>{tier.desc}</p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ ...NUMBER, fontSize: '38px', fontWeight: 700, color: P.ink, letterSpacing: '-0.02em' }}>
                    {currencySymbol}{tier.founding[currency]}
                  </span>
                  <span style={{ fontSize: '13px', color: P.muted }}>/mo</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <span style={{ ...NUMBER, fontSize: '13px', color: P.muted, textDecoration: 'line-through' }}>
                    {currencySymbol}{tier.monthly[currency]}
                  </span>
                  <span style={{ ...MONO, fontSize: '11px', fontWeight: 600, color: P.emerald, padding: '2px 6px', borderRadius: '4px', background: P.emeraldSft }}>
                    −{discount}%
                  </span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: P.cobalt, flexShrink: 0, marginTop: '7px' }} />
                      <span style={{ fontSize: '13px', color: P.inkSoft, lineHeight: 1.5 }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button href={`/signup?plan=${tier.name.toLowerCase()}&founding=1`} variant="primary" arrow>
                  Claim {tier.name} founding
                </Button>
              </div>
            )
          })}
        </section>

        {/* Benefits */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ ...SECTION_HEADER, marginBottom: '12px' }}>What founding partners get</div>
          <h2 className={display.className} style={{ ...HEADING, fontSize: '36px', letterSpacing: '-0.02em', lineHeight: 1.15, color: P.ink, margin: '0 0 32px', maxWidth: 720 }}>
            The deal, in four lines.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px 40px' }} className="benefits-grid">
            {BENEFITS.map(b => (
              <div key={b.title}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: P.ink, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{b.title}</h3>
                <p style={{ fontSize: '14px', color: P.mutedDk, lineHeight: 1.6, margin: 0 }}>{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: '64px', maxWidth: 720 }}>
          <div style={{ ...SECTION_HEADER, marginBottom: '12px' }}>FAQ</div>
          <h2 className={display.className} style={{ ...HEADING, fontSize: '32px', letterSpacing: '-0.02em', lineHeight: 1.15, color: P.ink, margin: '0 0 24px' }}>
            Before you claim a spot.
          </h2>
          <div style={{ borderTop: `1px solid ${P.rule}` }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${P.rule}` }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', textAlign: 'left', padding: '18px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px', fontWeight: 500, color: P.ink, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}
                >
                  <span>{item.q}</span>
                  <span style={{ ...MONO, color: P.muted, fontSize: '18px', lineHeight: 1 }}>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div style={{ fontSize: '14px', color: P.mutedDk, lineHeight: 1.65, padding: '0 0 20px', maxWidth: 640 }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ ...CARD, padding: '40px 32px', textAlign: 'center', background: P.raised }}>
          <div style={{ ...SECTION_HEADER, marginBottom: '12px' }}>{remaining} spots remaining</div>
          <h2 className={display.className} style={{ ...HEADING, fontSize: '32px', letterSpacing: '-0.02em', lineHeight: 1.15, color: P.ink, margin: '0 auto 16px', maxWidth: 560 }}>
            Ready when you are.
          </h2>
          <p style={{ fontSize: '15px', color: P.mutedDk, lineHeight: 1.6, margin: '0 auto 24px', maxWidth: 520 }}>
            Shopify OAuth, first channel live in ten minutes, founding rate locked for life.
          </p>
          <Button href="/signup?founding=1" variant="primary" arrow>
            Claim your spot
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${P.rule}`, padding: '24px 32px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ ...MONO, fontSize: '11px', color: P.muted, margin: 0 }}>
            &copy; 2026 NPX Solutions Ltd &middot;{' '}
            <Link href="/privacy" style={{ color: P.muted, textDecoration: 'none' }}>Privacy</Link>
            {' '}&middot;{' '}
            <Link href="/terms" style={{ color: P.muted, textDecoration: 'none' }}>Terms</Link>
          </p>
          <Link href="/pricing" style={{ ...MONO, fontSize: '11px', color: P.muted, textDecoration: 'none' }}>
            Not a founding partner? See standard pricing →
          </Link>
        </div>
      </footer>

      <style>{`
        @media (max-width: 820px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .benefits-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  )
}
