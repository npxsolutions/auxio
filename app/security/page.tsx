// Fulcra — Security & Trust
// Matches v8 landing language: cream bg, ink type, cobalt accent,
// Instrument Serif display, Geist (system) for UI, 1.5px SVG discipline.
// Honest posture — we mark in-progress work as in-progress.

import Link from 'next/link'
import type { Metadata } from 'next'
import { Instrument_Serif } from 'next/font/google'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display-sec',
})

export const metadata: Metadata = {
  title: 'Security · Fulcra',
  description:
    'How Fulcra handles your data — compliance posture, infrastructure, encryption, sub-processors, incident response, and your GDPR rights.',
}

const C = {
  bg:        '#f3f0ea',
  surface:   '#ffffff',
  raised:    '#ebe6dc',
  ink:       '#0b0f1a',
  inkSoft:   '#1c2233',
  rule:      'rgba(11,15,26,0.10)',
  ruleSoft:  'rgba(11,15,26,0.06)',
  muted:     '#5a6171',
  mutedDk:   '#2c3142',
  cobalt:    '#1d5fdb',
  cobaltDk:  '#1647a8',
  cobaltSft: 'rgba(29,95,219,0.10)',
  emerald:   '#0e7c5a',
  amber:     '#b5651d',
  oxblood:   '#7d2a1a',
}

const mono = 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace'
const serif = 'var(--font-display-sec), Georgia, serif'
const sans  = '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Geist, sans-serif'

type Status = 'live' | 'progress' | 'planned' | 'na'
const STATUS_STYLES: Record<Status, { label: string; fg: string; bg: string; dot: string }> = {
  live:     { label: 'Live',        fg: C.emerald, bg: 'rgba(14,124,90,0.10)',  dot: C.emerald },
  progress: { label: 'In progress', fg: C.amber,   bg: 'rgba(181,101,29,0.10)', dot: C.amber   },
  planned:  { label: 'Planned',     fg: C.cobalt,  bg: C.cobaltSft,             dot: C.cobalt  },
  na:       { label: 'N / A',       fg: C.muted,   bg: 'rgba(11,15,26,0.05)',   dot: C.muted   },
}

const COMPLIANCE: Array<{ name: string; status: Status; detail: string }> = [
  { name: 'SOC 2 Type II', status: 'progress', detail: 'Observation window open. Report target Q3 2026. Gap analysis complete; controls implemented.' },
  { name: 'GDPR',          status: 'live',     detail: 'Data Processing Agreement available on request. DSAR fulfilment in-app. EU data residency on Supabase eu-west-1.' },
  { name: 'UK GDPR / DPA 2018', status: 'live', detail: 'Operated by NPX Solutions (UK). ICO registration in process.' },
  { name: 'ISO 27001',     status: 'planned',  detail: 'Scoped for 2026 following SOC 2 report issuance.' },
  { name: 'HIPAA',         status: 'na',       detail: 'Fulcra is not a covered entity. Do not upload PHI.' },
  { name: 'PCI DSS',       status: 'na',       detail: 'We never touch card data. All payments are tokenised and handled by Stripe (PCI DSS Level 1).' },
]

const INFRA: Array<{ name: string; location: string; role: string }> = [
  { name: 'Vercel Functions', location: 'US · EU regions',     role: 'Application runtime. Edge and Node.js serverless. Traffic terminated at nearest region.' },
  { name: 'Supabase Postgres', location: 'eu-west-1 (Ireland)', role: 'Primary datastore and auth. Point-in-time recovery enabled (7 days).' },
  { name: 'Sentry',            location: 'United States',       role: 'Error telemetry. PII scrubbed at the SDK before transmission.' },
  { name: 'PostHog EU',        location: 'Frankfurt, DE',       role: 'Product analytics. EU-resident; no data leaves the EEA.' },
  { name: 'Upstash Redis',     location: 'EU regions',          role: 'Rate limiting, job queues. Contains no customer content.' },
  { name: 'Apify',             location: 'United States',       role: 'Isolated scraping workers for competitive-intelligence jobs. Receives job inputs only.' },
]

const SUBPROCESSORS: Array<{ name: string; processes: string; link: string }> = [
  { name: 'Vercel Inc.',         processes: 'Application hosting, logs',                link: 'https://vercel.com/legal/dpa' },
  { name: 'Supabase Inc.',       processes: 'Database, authentication, storage',        link: 'https://supabase.com/privacy' },
  { name: 'Stripe, Inc.',        processes: 'Billing, payment tokens',                  link: 'https://stripe.com/legal/dpa' },
  { name: 'Resend, Inc.',        processes: 'Transactional email delivery',             link: 'https://resend.com/legal/dpa' },
  { name: 'Functional Software (Sentry)', processes: 'Application error telemetry',     link: 'https://sentry.io/legal/dpa/' },
  { name: 'PostHog Ltd (EU)',    processes: 'Product analytics',                        link: 'https://posthog.com/dpa' },
  { name: 'Upstash, Inc.',       processes: 'Rate-limit counters, background queues',   link: 'https://upstash.com/trust' },
  { name: 'Apify Technologies',  processes: 'Competitive-intel scraping jobs',          link: 'https://apify.com/privacy-policy' },
  { name: 'Anthropic PBC',       processes: 'AI content generation (opt-in)',           link: 'https://www.anthropic.com/legal/dpa' },
]

export default function SecurityPage() {
  return (
    <div className={display.variable} style={{ background: C.bg, color: C.ink, fontFamily: sans, minHeight: '100vh' }}>

      {/* Top bar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(243,240,234,0.85)', backdropFilter: 'saturate(140%) blur(10px)', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.ink }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M2 22 L12 2 L22 22 L17.5 22 L12 11 L6.5 22 Z" fill={C.ink} />
              <rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt} />
            </svg>
            <span style={{ fontFamily: serif, fontSize: 22, letterSpacing: '-0.015em' }}>Fulcra</span>
          </Link>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: C.mutedDk }}>
            <Link href="/privacy" style={{ color: C.mutedDk, textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" style={{ color: C.mutedDk, textDecoration: 'none' }}>Terms</Link>
            <a href="mailto:security@fulcra.com" style={{ color: C.cobalt, textDecoration: 'none', fontWeight: 600 }}>security@fulcra.com</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 32px 72px', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: C.cobalt, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 20 }}>
          § Trust · Security · Privacy
        </div>
        <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(44px, 7vw, 84px)', lineHeight: 1.04, letterSpacing: '-0.025em', margin: 0 }}>
          Security at <span style={{ fontStyle: 'italic', color: C.cobaltDk }}>Fulcra</span>.
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: C.mutedDk, maxWidth: 720, marginTop: 24 }}>
          Your catalogue, orders, and channel credentials are operational data that keeps your business running. We treat them that way — encrypted in transit and at rest, fenced behind row-level authorisation, and exportable in one click whenever you ask.
        </p>
        <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <a href="#compliance"  style={pill(C)}>Compliance posture</a>
          <a href="#infra"       style={pill(C)}>Infrastructure</a>
          <a href="#sub"         style={pill(C)}>Sub-processors</a>
          <a href="#incident"    style={pill(C)}>Incident response</a>
          <a href="#bounty"      style={pill(C)}>Bug bounty</a>
          <a href="#rights"      style={pill(C)}>Your data, your rights</a>
        </div>
      </header>

      {/* Compliance posture */}
      <Section id="compliance" label="01 / Compliance" title="Where we stand, honestly." C={C}>
        <p style={paraStyle(C)}>
          We publish the real state of each framework — not the aspirational one. If something says <em>in progress</em>, the observation window is live but the attestation is not yet in hand. Ask security@fulcra.com for the latest evidence package.
        </p>
        <div style={{ marginTop: 28, border: `1px solid ${C.rule}`, borderRadius: 12, overflow: 'hidden', background: C.surface }}>
          {COMPLIANCE.map((c, i) => {
            const s = STATUS_STYLES[c.status]
            return (
              <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '220px 140px 1fr', gap: 20, padding: '18px 22px', borderTop: i === 0 ? 'none' : `1px solid ${C.ruleSoft}`, alignItems: 'baseline' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{c.name}</div>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: s.bg, color: s.fg, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: mono }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
                    {s.label}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: C.mutedDk, lineHeight: 1.55 }}>{c.detail}</div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Infrastructure */}
      <Section id="infra" label="02 / Infrastructure" title="Where your data lives." C={C}>
        <p style={paraStyle(C)}>
          Fulcra runs on managed primitives from operators we trust — chosen so your data stays in the EU by default and never sits on a server we operate by hand.
        </p>
        <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {INFRA.map(i => (
            <div key={i.name} style={{ background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 12, padding: 22 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{i.name}</div>
              <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt, marginTop: 4 }}>{i.location}</div>
              <p style={{ fontSize: 13.5, color: C.mutedDk, lineHeight: 1.55, margin: '12px 0 0' }}>{i.role}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Data handling */}
      <Section id="handling" label="03 / Data handling" title="Encryption, backups, residency." C={C}>
        <div style={twoCol}>
          <Block C={C} title="Encryption in transit">
            TLS 1.3 enforced end-to-end. HSTS preloaded on fulcra.com. Channel OAuth flows use PKCE where the marketplace supports it.
          </Block>
          <Block C={C} title="Encryption at rest">
            AES-256 on Supabase managed Postgres volumes and on Vercel build artefacts. OAuth refresh tokens are additionally wrapped with a key scoped per environment.
          </Block>
          <Block C={C} title="Backups &amp; recovery">
            Supabase point-in-time recovery retains 7 days of WAL. We test restore into a staging project on a documented cadence.
          </Block>
          <Block C={C} title="Data residency">
            Primary store in Supabase eu-west-1 (Ireland). Product analytics in PostHog Frankfurt. Error telemetry in Sentry US with PII scrubbed before send.
          </Block>
        </div>
      </Section>

      {/* Access control */}
      <Section id="access" label="04 / Access control" title="Row-level by default." C={C}>
        <p style={paraStyle(C)}>
          Every public table in Fulcra has Row Level Security enabled, and every policy is scoped by <code style={codeStyle(C)}>user_id = auth.uid()</code>. Our service role exists only inside server functions — it is never exposed to the browser, never committed to the repo, and rotated on role change.
        </p>
        <ul style={listStyle(C)}>
          <li>Least-privilege engineering access, brokered through Supabase roles and reviewed quarterly.</li>
          <li>No production shell access without a change ticket, a second pair of eyes, and an audit-log entry.</li>
          <li>Admin routes gated by an allow-list in <code style={codeStyle(C)}>ADMIN_EMAILS</code>; rotated on offboarding.</li>
          <li>Supabase Advisor is monitored — we treat any new advisor finding as a P1.</li>
        </ul>
      </Section>

      {/* Sub-processors */}
      <Section id="sub" label="05 / Sub-processors" title="Every vendor. Every purpose." C={C}>
        <p style={paraStyle(C)}>
          We sub-contract narrowly, with DPAs in place. Material changes are announced on this page and — for enterprise plans — emailed 30 days before any new sub-processor goes live.
        </p>
        <div style={{ marginTop: 28, border: `1px solid ${C.rule}`, borderRadius: 12, overflow: 'hidden', background: C.surface }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr 0.8fr', gap: 20, padding: '12px 22px', background: C.raised, fontFamily: mono, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.mutedDk, borderBottom: `1px solid ${C.rule}` }}>
            <span>Processor</span><span>Purpose</span><span>DPA</span>
          </div>
          {SUBPROCESSORS.map((s, i) => (
            <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr 0.8fr', gap: 20, padding: '16px 22px', borderTop: i === 0 ? 'none' : `1px solid ${C.ruleSoft}`, alignItems: 'baseline' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{s.name}</div>
              <div style={{ fontSize: 13.5, color: C.mutedDk, lineHeight: 1.55 }}>{s.processes}</div>
              <div><a href={s.link} target="_blank" rel="noreferrer noopener" style={{ color: C.cobalt, fontSize: 13, textDecoration: 'none' }}>View DPA →</a></div>
            </div>
          ))}
        </div>
      </Section>

      {/* Incident response */}
      <Section id="incident" label="06 / Incident response" title="What happens if something goes wrong." C={C}>
        <div style={twoCol}>
          <Block C={C} title="24 hours · Discovery">
            On confirmed incident, a response lead is appointed and a triage channel opened. Customer impact is scoped before anything is said publicly.
          </Block>
          <Block C={C} title="72 hours · Notification">
            If personal data is affected, we notify the ICO within 72 hours (UK GDPR Art. 33) and the affected customers without undue delay.
          </Block>
          <Block C={C} title="Status page">
            Live incidents are posted at <a href="https://status.fulcra.com" target="_blank" rel="noreferrer noopener" style={{ color: C.cobalt, textDecoration: 'none' }}>status.fulcra.com</a>. Post-mortems are published after resolution for material incidents.
          </Block>
          <Block C={C} title="Contact">
            Security <a href="mailto:security@fulcra.com" style={{ color: C.cobalt, textDecoration: 'none' }}>security@fulcra.com</a> · Press <a href="mailto:info@npx-solutions.com" style={{ color: C.cobalt, textDecoration: 'none' }}>info@npx-solutions.com</a>
          </Block>
        </div>
      </Section>

      {/* Bug bounty */}
      <Section id="bounty" label="07 / Responsible disclosure" title="Report a vulnerability." C={C}>
        <p style={paraStyle(C)}>
          We welcome reports from the security community. Email <a href="mailto:security@fulcra.com" style={{ color: C.cobalt, textDecoration: 'none', fontWeight: 600 }}>security@fulcra.com</a> — PGP available on request. We respond within two business days and provide a fix timeline within ten.
        </p>
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <Block C={C} title="In scope">
            <code style={codeStyle(C)}>fulcra.com</code>, <code style={codeStyle(C)}>*.fulcra.com</code>, the Fulcra web app, our public API, and our marketing site.
          </Block>
          <Block C={C} title="Out of scope">
            Denial-of-service, volumetric testing, social engineering, physical attacks, third-party infrastructure (Vercel, Supabase, Stripe), and findings that require a rooted device.
          </Block>
          <Block C={C} title="Safe harbour">
            Act in good faith and we will not pursue legal action. Give us reasonable time to remediate before publishing.
          </Block>
        </div>
      </Section>

      {/* Your data / rights */}
      <Section id="rights" label="08 / Your data" title="Your data is yours." C={C}>
        <p style={paraStyle(C)}>
          GDPR gives you the right to access, correct, export, and erase the personal data we hold about you. Fulcra fulfils these rights in-app — no emails, no forms, no waiting.
        </p>
        <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <RightCard C={C} title="Export everything" subtitle="Art. 15 · 20 · 30-day SLA · usually seconds"
            body="Download a signed JSON archive of every row in every table we associate with your account — profile, channels, listings, transactions, audit trail."
            ctaLabel="Open settings → Export"
            ctaHref="/settings#privacy"
          />
          <RightCard C={C} title="Delete your account" subtitle="Art. 17 · processed within 30 days"
            body="Request erasure from inside the app. We queue the request, confirm by email, and purge within the GDPR window (billing records retained as required by law)."
            ctaLabel="Open settings → Delete"
            ctaHref="/settings#privacy"
          />
          <RightCard C={C} title="DPA &amp; documents" subtitle="Available on request"
            body="Standard SCC-backed Data Processing Agreement, sub-processor list, and data-retention schedule. We will sign mutual NDAs for enterprise evaluation."
            ctaLabel="Email security@fulcra.com"
            ctaHref="mailto:security@fulcra.com?subject=Fulcra%20DPA%20request"
          />
        </div>
      </Section>

      {/* Footer */}
      <footer style={{ background: C.bg, borderTop: `1px solid ${C.rule}`, padding: '48px 32px 40px', marginTop: 64 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 24, alignItems: 'center' }}>
          <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: C.mutedDk, maxWidth: 520 }}>
            If your procurement team needs something specific — a SIG lite, a custom DPA, or a security review call — reach out. We will reply the same working day.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="mailto:security@fulcra.com" style={btnPrimary(C)}>Contact security →</a>
            <Link href="/privacy" style={btnGhost(C)}>Privacy policy</Link>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '28px auto 0', borderTop: `1px solid ${C.rule}`, paddingTop: 18, display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: '0.04em' }}>
          <span>© MMXXVI · NPX Solutions</span>
          <span>Last reviewed · April 2026</span>
        </div>
      </footer>
    </div>
  )
}

// ── Layout primitives ───────────────────────────────────────────────────────
function Section({ id, label, title, children, C }: { id: string; label: string; title: string; children: React.ReactNode; C: Record<string, string> }) {
  return (
    <section id={id} style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 32px', borderBottom: `1px solid ${C.rule}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 48, alignItems: 'start' }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.cobalt }}>{label}</div>
        </div>
        <div>
          <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(28px, 3.4vw, 42px)', lineHeight: 1.12, letterSpacing: '-0.018em', margin: '0 0 20px', color: C.ink }}>{title}</h2>
          {children}
        </div>
      </div>
    </section>
  )
}

function Block({ title, children, C }: { title: string; children: React.ReactNode; C: Record<string, string> }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 12, padding: 22 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: C.mutedDk, lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

function RightCard({ title, subtitle, body, ctaLabel, ctaHref, C }:
  { title: string; subtitle: string; body: string; ctaLabel: string; ctaHref: string; C: Record<string, string> }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cobalt }}>{subtitle}</div>
      <div style={{ fontSize: 17, fontWeight: 600, color: C.ink, letterSpacing: '-0.01em' }} dangerouslySetInnerHTML={{ __html: title }} />
      <p style={{ fontSize: 13.5, color: C.mutedDk, lineHeight: 1.6, margin: 0 }}>{body}</p>
      <div style={{ marginTop: 8 }}>
        <Link href={ctaHref} style={{ fontSize: 13, color: C.cobalt, textDecoration: 'none', fontWeight: 600 }}>{ctaLabel} →</Link>
      </div>
    </div>
  )
}

// ── style helpers ───────────────────────────────────────────────────────────
const twoCol: React.CSSProperties = {
  marginTop: 28,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 14,
}

function pill(C: Record<string, string>): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: `1px solid ${C.rule}`, background: C.surface, color: C.inkSoft,
    padding: '7px 13px', borderRadius: 999, fontSize: 12.5, textDecoration: 'none',
  }
}
function paraStyle(C: Record<string, string>): React.CSSProperties {
  return { fontSize: 16, color: C.mutedDk, lineHeight: 1.65, maxWidth: 760, margin: 0 }
}
function listStyle(C: Record<string, string>): React.CSSProperties {
  return { fontSize: 15, color: C.mutedDk, lineHeight: 1.75, paddingLeft: 20, margin: '16px 0 0', maxWidth: 760 }
}
function codeStyle(C: Record<string, string>): React.CSSProperties {
  return { fontFamily: mono, fontSize: 12.5, background: C.raised, color: C.ink, padding: '1px 6px', borderRadius: 4 }
}
function btnPrimary(C: Record<string, string>): React.CSSProperties {
  return { background: C.ink, color: C.bg, padding: '11px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }
}
function btnGhost(C: Record<string, string>): React.CSSProperties {
  return { background: 'transparent', color: C.ink, border: `1px solid ${C.rule}`, padding: '11px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }
}
