// [careers/[slug]] — individual role page.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Instrument_Serif } from 'next/font/google'
import { ROLES, roleBySlug } from '../roles'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display-v8',
})

const C = {
  bg:      '#f8f4ec',
  ink:     '#0b0f1a',
  mutedDk: '#2c3142',
  muted:   '#5a6171',
  rule:    'rgba(11,15,26,0.10)',
  cobalt:  '#e8863f',
  surface: '#ffffff',
}

export function generateStaticParams() {
  return ROLES.map(r => ({ slug: r.slug }))
}

type RoleContent = {
  pitch: string
  ownership: string[]
  lookingFor: string[]
}

const CONTENT: Record<string, RoleContent> = {
  'founding-engineer': {
    pitch:
      `You will be one of the first three engineers on Palvento. The product is a unified commerce operating system — inventory, orders, forecasting, margin, advertising, AI agents — all on a single data model across eBay, Shopify, Amazon, Etsy, Walmart, and a dozen more. Our stack is deliberately boring where it needs to be (Next.js App Router, Supabase Postgres, Stripe, Vercel) and deliberately interesting where it matters (a live cross-channel routing engine, an agent loop that proposes and executes merchandising actions, a forecasting layer that beats a good human on a bad day). ` +
      `You will own product surfaces end-to-end — schema, API, UI, and the analytics that tell you whether what you shipped worked. Expect to pair on architecture, argue against overbuilding, and delete as much code as you add. We ship daily. The test suite is non-negotiable; tasteful types are; dark patterns aren&apos;t. ` +
      `If you have shipped a multi-tenant SaaS product that integrated real money and real third-party APIs, and you have opinions about when to reach for a queue and when a cron is fine, this is a good fit.`,
    ownership: [
      'A full product surface (e.g. Forecasting, Repricing, Channels) — schema through UI.',
      'The reliability bar — idempotent webhooks, retries, observable failures.',
      'Architecture calls for your surface; pairing on calls for the whole system.',
    ],
    lookingFor: [
      '5+ years shipping production TypeScript on a serious product.',
      'Deep comfort with Postgres, async queues, and third-party API integrations.',
      'Taste: you can tell a good UI from a bad one and you care.',
      'Written communication that reads like a real human wrote it.',
    ],
  },
  'head-of-growth': {
    pitch:
      `Palvento&apos;s growth function is a blank page. You will design it, staff it, and run it. Our ICP is the cross-border commerce operator running 3+ channels, $500k–$20M GMV, who is presently held together by spreadsheets and ops hires. Our moat is a genuinely unified data model and a ruthless point of view on what commerce software should feel like. ` +
      `You will own the whole funnel — SEO, content, paid, partnerships, lifecycle, onboarding activation — and you will own the number (net-new ARR, month over month). You will write the positioning, choose the beachhead, pick the channels to kill, and run the playbook. You will have an engineer and a designer to pair with on every meaningful growth experiment, and tooling (PostHog, Segment, Customer.io, Webflow) already in place. ` +
      `If you&apos;ve run growth at a commerce-adjacent SaaS from $1M to $10M ARR, if you&apos;ve written copy a founder actually shipped, and if you&apos;ve ever sat with an eBay seller and run their repricing tool with them — we should talk.`,
    ownership: [
      'Net-new ARR target. You will carry and defend the number.',
      'Positioning, ICP definition, and all public-facing copy of consequence.',
      'Channel mix — which channels live, which die, which double.',
    ],
    lookingFor: [
      'Prior commerce / ops / marketplace-software exposure. You speak the customer&apos;s language.',
      'Full-stack growth — you can write copy, configure Customer.io, and read a SQL query.',
      'A bias for doing before delegating.',
      'A portfolio of experiments with numbers, not vibes.',
    ],
  },
  'founding-designer': {
    pitch:
      `The bar for Palvento&apos;s craft is set somewhere between Linear, Stripe, and Arc. If that reference set makes you roll your eyes, the rest of this post will too. We think design is a load-bearing part of the product — how the data feels, how the empty states read, how a cron-failure banner gets worded — and we hire accordingly. ` +
      `You will own the system end-to-end: product UI, marketing site, brand, print, on occasion physical objects. You will pair with engineers daily and ship Figma-to-PR yourself when it&apos;s faster. You will write. You will draw. You will fight for white space. ` +
      `Our landing is on its eighth version and counting. We have a cream-and-cobalt palette, an Instrument Serif display face, and a 1.5px SVG stroke discipline. If you look at that and want to tear it down and rebuild it correctly, tell us how. If you look at it and want to refine it to a razor, tell us why. Either answer works — we want conviction.`,
    ownership: [
      'The entire design system — product, marketing, brand — and its evolution.',
      'Empty states, error states, and onboarding. The 80% of design that most teams skip.',
      'Hiring the second designer.',
    ],
    lookingFor: [
      'A portfolio that makes engineers want to build it.',
      'End-to-end — IA, interaction, visual, motion, copy. Generalist by conviction.',
      'Comfort in the browser. You can push a CSS tweak without filing a ticket.',
      'A point of view you can defend for more than 30 seconds.',
    ],
  },
}

export default async function RolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const role = roleBySlug(slug)
  if (!role) notFound()
  const content = CONTENT[role.slug]

  return (
    <main className={display.variable} style={{ background: C.bg, color: C.ink, minHeight: '100vh', fontFamily: 'var(--font-geist), -apple-system, sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      <header style={{ padding: '24px 32px', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/careers" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.ink }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.ink} />
            </svg>
            <span style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 22, letterSpacing: '-0.015em' }}>Palvento</span>
          </Link>
          <Link href="/careers" style={{ fontSize: 13, color: C.mutedDk, textDecoration: 'none' }}>← All roles</Link>
        </div>
      </header>

      <article style={{ maxWidth: 760, margin: '0 auto', padding: '80px 32px 96px' }}>
        <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>{role.team}</div>
        <h1 style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 'clamp(44px, 6vw, 84px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 0.98, margin: 0 }}>
          {role.title}
        </h1>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 13, color: C.mutedDk }}>
          <span>{role.location}</span>
          <span>·</span>
          <span>{role.compBand}</span>
        </div>

        <p style={{ marginTop: 36, fontSize: 17, lineHeight: 1.65, color: C.mutedDk, whiteSpace: 'pre-wrap' }}>{content.pitch}</p>

        <h2 style={{ marginTop: 48, fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 32, letterSpacing: '-0.02em', fontWeight: 400 }}>What you&apos;ll own</h2>
        <ul style={{ marginTop: 12, paddingLeft: 20, color: C.mutedDk, fontSize: 16, lineHeight: 1.6 }}>
          {content.ownership.map((o, i) => <li key={i} style={{ marginBottom: 8 }}>{o}</li>)}
        </ul>

        <h2 style={{ marginTop: 40, fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 32, letterSpacing: '-0.02em', fontWeight: 400 }}>What we&apos;re looking for</h2>
        <ul style={{ marginTop: 12, paddingLeft: 20, color: C.mutedDk, fontSize: 16, lineHeight: 1.6 }}>
          {content.lookingFor.map((o, i) => <li key={i} style={{ marginBottom: 8 }}>{o}</li>)}
        </ul>

        <div style={{ marginTop: 48, padding: 28, background: C.surface, border: `1px solid ${C.rule}` }}>
          <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 26, letterSpacing: '-0.02em' }}>How to apply</div>
          <p style={{ marginTop: 10, fontSize: 15, color: C.mutedDk, lineHeight: 1.55 }}>
            Email <a href={`mailto:careers@palvento-placeholder.com?subject=${encodeURIComponent(role.title)}`} style={{ color: C.cobalt, textDecoration: 'none' }}>careers@palvento-placeholder.com</a> with a short note, links to prior work, and one thing you&apos;d change about Palvento today.
          </p>
        </div>
      </article>
    </main>
  )
}
