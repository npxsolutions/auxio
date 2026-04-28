'use client'

/**
 * Dedicated outreach landing page for cold DMs / cold email to Shopify-led
 * sellers. Speaks Shopify-specifically: assumes the visitor is on Shopify
 * already, running 1-4 marketplaces alongside.
 *
 * Conversion-focused (single CTA → /signup?founding=1 with UTM forwarding).
 * Lean — outreach links should land on a tight page, not a long-form pitch.
 *
 * UTM convention for outreach campaigns:
 *   utm_source=outbound    (or =linkedin or =email)
 *   utm_medium=dm          (or =email or =profile-view)
 *   utm_campaign=shopify-outreach-v1
 *   utm_content=DMv1       (template version, for A/B)
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

const C = {
  bg:        '#f8f4ec',
  surface:   '#ffffff',
  raised:    '#fdfaf2',
  ink:       '#0b0f1a',
  inkSoft:   '#2c3142',
  muted:     '#5a6171',
  faint:     '#8b8e9d',
  rule:      'rgba(11,15,26,0.10)',
  ruleStrong:'rgba(11,15,26,0.18)',
  cobalt:    '#e8863f',
  cobaltDk:  '#c46f2a',
  cobaltSft: 'rgba(232,134,63,0.12)',
  cobaltGlow:'rgba(232,134,63,0.30)',
  emerald:   '#0e7c5a',
  amber:     '#b5651d',
  red:       '#b32718',
}

const sans = 'var(--font-geist), -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const mono = 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace'

type ChannelExample = { name: string; status: 'reconciled' | 'estimated' | 'roadmap'; note: string }

const CHANNEL_EXAMPLES: ChannelExample[] = [
  { name: 'Shopify',     status: 'reconciled', note: 'Real gateway fees from Order.transactions' },
  { name: 'eBay',        status: 'reconciled', note: 'eBay Finances API per-order fees + payouts' },
  { name: 'Etsy',        status: 'reconciled', note: 'Ledger entries by receipt' },
  { name: 'Amazon',      status: 'roadmap',    note: 'SP-API SettlementReportV2 — Q3' },
  { name: 'TikTok Shop', status: 'roadmap',    note: 'Q3 — early-mover wedge' },
  { name: 'Walmart',     status: 'estimated',  note: 'Order capture live; fees roadmap' },
]

const STATUS_LABEL: Record<ChannelExample['status'], { label: string; color: string }> = {
  reconciled: { label: 'Reconciled today', color: C.emerald },
  estimated:  { label: 'Estimated today',  color: C.amber },
  roadmap:    { label: 'Q3 roadmap',       color: C.faint },
}

export default function ForShopifySellersPage() {
  const [incomingQuery, setIncomingQuery] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const forward = new URLSearchParams()
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const v = params.get(k)
      if (v) forward.set(k, v)
    }
    // Default to outreach attribution if no UTMs supplied — page is reachable
    // by direct link too.
    if (!forward.get('utm_source')) forward.set('utm_source', 'outbound')
    if (!forward.get('utm_medium')) forward.set('utm_medium', 'direct')
    if (!forward.get('utm_campaign')) forward.set('utm_campaign', 'shopify-outreach')
    setIncomingQuery(forward.toString())
  }, [])

  const signupHref = useMemo(() => {
    const q = new URLSearchParams(incomingQuery)
    q.set('founding', '1')
    return `/signup?${q.toString()}`
  }, [incomingQuery])

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.ink,
      fontFamily: sans,
      WebkitFontSmoothing: 'antialiased' as const,
    }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 32px', maxWidth: 1080, margin: '0 auto',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.ink }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.ink} />
            <rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt} />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Palvento</span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/pricing" style={{ fontFamily: mono, fontSize: 12, color: C.muted, textDecoration: 'none', fontWeight: 500 }}>Pricing</Link>
          <Link href="/login" style={{ fontFamily: mono, fontSize: 12, color: C.muted, textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </div>
      </nav>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '32px 32px 80px' }}>
        {/* Founding pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', borderRadius: 100,
          background: C.cobaltSft, border: `1px solid ${C.cobalt}`,
          marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: C.cobalt, boxShadow: `0 0 8px ${C.cobalt}` }} />
          <span style={{ fontFamily: mono, fontSize: 11, color: C.cobaltDk, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
            Founding partners · 10 spots · 40% off for life
          </span>
        </div>

        {/* Hero */}
        <h1 style={{
          fontFamily: sans, fontSize: 'clamp(40px, 5.5vw, 68px)', fontWeight: 600,
          letterSpacing: '-0.035em', lineHeight: 1.05,
          margin: '0 0 22px', color: C.ink,
        }}>
          You&apos;re running Shopify + 2-4 marketplaces.<br />
          <span style={{ color: C.cobalt }}>You can&apos;t tell which one makes you money.</span>
        </h1>

        <p style={{ fontFamily: sans, fontSize: 19, lineHeight: 1.55, color: C.inkSoft, margin: '0 0 36px', maxWidth: 660 }}>
          The first per-channel P&amp;L for Shopify-led sellers that reconciles real marketplace fees, not rate-card estimates. Live today on eBay, Shopify and Etsy. Amazon and TikTok Shop on the roadmap for Q3.
        </p>

        {/* Single CTA above the fold */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
          <Link href={signupHref} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 22px', background: C.cobalt, color: C.surface,
            borderRadius: 10, fontSize: 15, fontWeight: 600,
            textDecoration: 'none', letterSpacing: '0.005em',
            boxShadow: `0 1px 0 rgba(255,255,255,0.22) inset, 0 8px 24px -10px ${C.cobaltGlow}`,
          }}>
            Claim your founding spot
            <span style={{ fontFamily: mono, opacity: 0.85 }}>→</span>
          </Link>
          <span style={{ fontFamily: mono, fontSize: 12, color: C.faint, letterSpacing: '0.02em' }}>
            $59/mo locked for life · No card to start · Cancel any time
          </span>
        </div>

        {/* The wedge — what we reconcile */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.cobalt, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
            § 01 · The wedge
          </div>
          <h2 style={{ fontFamily: sans, fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1, color: C.ink, margin: '0 0 16px', maxWidth: 640 }}>
            Real fees from the marketplace, not a rate card.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: C.inkSoft, maxWidth: 600, margin: '0 0 28px' }}>
            Linnworks tells you what sold. ChannelAdvisor tells you what shipped. Neither tells you which channel made you money after fees, returns, and ad spend on a per-SKU basis. Palvento pulls the actual reconciled fees from each marketplace&apos;s finances API and writes them to the SKU.
          </p>

          <div style={{
            background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 12,
            padding: 24,
          }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
              Status · per channel · today
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1, background: C.rule }}>
              {CHANNEL_EXAMPLES.map((ch) => {
                const s = STATUS_LABEL[ch.status]
                return (
                  <div key={ch.name} style={{
                    background: C.surface, padding: '14px 16px',
                    display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 16,
                    alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{ch.name}</span>
                    <span style={{ fontSize: 13, color: C.muted }}>{ch.note}</span>
                    <span style={{
                      fontFamily: mono, fontSize: 10, fontWeight: 600,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: s.color, whiteSpace: 'nowrap',
                    }}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Why it matters for you specifically */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.cobalt, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
            § 02 · What you&apos;ll see in week 1
          </div>
          <h2 style={{ fontFamily: sans, fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1, color: C.ink, margin: '0 0 28px', maxWidth: 640 }}>
            The numbers Linnworks doesn&apos;t put in front of you.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              {
                eyebrow: 'Margin truth',
                title: 'Your eBay margin is 9% lower than Shopify on the same SKU.',
                body:  'Reconciled final-value fee + ad fee + payment processing tells you a different story than gross revenue alone.',
              },
              {
                eyebrow: 'Channel concentration',
                title: '64% of contribution margin comes from 12% of SKUs.',
                body:  'Per-channel x per-SKU rollup surfaces the dependency you&apos;re already running but can&apos;t see.',
              },
              {
                eyebrow: 'Fee drift',
                title: 'eBay Promoted Listings Standard quietly raised your effective fee 1.4%.',
                body:  'Reconciled fees catch the rate-card changes nobody emails you about.',
              },
            ].map((card, i) => (
              <div key={i} style={{
                background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 12,
                padding: 20,
              }}>
                <div style={{ fontFamily: mono, fontSize: 10, color: C.cobalt, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                  {card.eyebrow}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35, color: C.ink, marginBottom: 8 }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
                  {card.body}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Founding offer */}
        <section style={{
          background: C.surface, border: `2px solid ${C.cobalt}`, borderRadius: 16,
          padding: 32, marginBottom: 48,
        }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.cobalt, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
            § 03 · The offer
          </div>
          <h2 style={{ fontFamily: sans, fontSize: 'clamp(28px, 3.4vw, 38px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1, color: C.ink, margin: '0 0 16px' }}>
            10 founding partners. 40% off for life.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: C.inkSoft, margin: '0 0 24px', maxWidth: 600 }}>
            The first 10 multichannel sellers shape the roadmap and lock founding pricing for the lifetime of their subscription. Direct Slack with the founding team. No contract, no minimum term. Hands-on onboarding from me, personally.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 600 }}>
            {[
              'Founding price locked for life',
              'Direct Slack with the team',
              'Roadmap influence from week 1',
              'Hands-on onboarding by the founder',
              '14-day free trial, no card',
              'No contract, cancel any time',
            ].map((b, i) => (
              <li key={i} style={{ fontSize: 13.5, color: C.inkSoft, display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.45 }}>
                <span style={{ color: C.cobalt, fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <Link href={signupHref} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 22px', background: C.ink, color: C.bg,
            borderRadius: 10, fontSize: 15, fontWeight: 600,
            textDecoration: 'none', letterSpacing: '0.005em',
          }}>
            Claim a founding spot
            <span style={{ fontFamily: mono, opacity: 0.85 }}>→</span>
          </Link>
        </section>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: 12, color: C.faint, lineHeight: 1.5, letterSpacing: '0.01em' }}>
          Naveen Rees, founder · <Link href="/" style={{ color: C.muted, textDecoration: 'none' }}>palvento.com</Link>
          {' '}·{' '}
          <Link href="/founding-partners" style={{ color: C.muted, textDecoration: 'none' }}>Full founding-partner detail</Link>
          {' '}·{' '}
          <Link href="/pricing" style={{ color: C.muted, textDecoration: 'none' }}>Standard pricing</Link>
        </p>
      </main>
    </div>
  )
}
