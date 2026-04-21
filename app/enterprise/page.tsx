'use client'

// /enterprise — editorial v8-craft quote page. Cream background, Instrument
// Serif display, Geist body, 1.5px SVG strokes, cobalt accent, ink text.
// Posts to /api/enterprise/quote which inserts into public.enterprise_quotes.

import Link from 'next/link'
import { useState } from 'react'

const C = {
  cream: '#f8f4ec',
  creamSoft: '#fdfaf2',
  ink: '#0b0f1a',
  inkSoft: 'rgba(11,15,26,0.62)',
  inkMuted: 'rgba(11,15,26,0.42)',
  inkFaint: 'rgba(11,15,26,0.14)',
  cobalt: '#e8863f',
  rule: 'rgba(11,15,26,0.10)',
}

const SERIF = "'Instrument Serif', 'Times New Roman', serif"
const SANS  = "'Geist', -apple-system, system-ui, sans-serif"

const GMV_BANDS = ['$5M–$25M', '$25M–$100M', '$100M–$500M', '$500M+']
const CHANNEL_COUNTS = ['1–3', '4–7', '8–15', '16+']
const REGIONS = ['North America', 'UK / EU', 'APAC', 'LATAM', 'Global']
const STARTS = ['Within 30 days', '30–60 days', '60–90 days', 'Evaluating']

function Icon({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.cobalt} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}

const INCLUDES = [
  { t: 'Dedicated instance',    d: 'Single-tenant deployment on your VPC or ours. No shared data plane.',      i: 'M4 7h16M4 12h16M4 17h16' },
  { t: 'Custom SLAs',           d: '99.95% uptime, 1-hour P1 response, credits for misses — written in.',     i: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4' },
  { t: 'SSO / SAML',            d: 'Okta, Azure AD, Google Workspace, custom IdPs. SCIM provisioning.',       i: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3' },
  { t: 'Data residency',        d: 'Pin all data to US, UK, EU, or APAC regions. No cross-border transit.',   i: 'M12 2a10 10 0 1 0 10 10M2 12h20M12 2a15 15 0 0 1 0 20' },
  { t: 'White-glove onboarding',d: 'Dedicated solutions architect, custom integrations, migration support.',  i: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { t: 'Enterprise support',    d: '24/7 on-call, named account manager, quarterly business reviews.',        i: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
]

const PROFILES = [
  'You do $25M+ a year across four or more channels and nothing ties it together.',
  'Your finance team gets the same reconciliation wrong every month and it costs days.',
  'You run multiple brands or entities and need segregated reporting without duplicate tooling.',
  'You’ve outgrown spreadsheets but you won’t sign a 6-figure contract for a feature list you don’t need.',
]

const COMPLIANCE = [
  { t: 'SOC 2 Type II',  d: 'Annual audit by independent firm, current report available under NDA.' },
  { t: 'GDPR + UK DPA',  d: 'DPAs on request, standard contractual clauses, right-to-erasure honoured within 30 days.' },
  { t: 'SAML + SCIM',    d: 'Enterprise SSO via any SAML 2.0 IdP. Just-in-time and SCIM user provisioning.' },
  { t: 'Audit logs',     d: 'Every read, write, and config change is logged with actor, IP, and request ID. Exportable.' },
]

export default function EnterprisePage() {
  const [form, setForm] = useState({
    name: '', work_email: '', company: '', role: '',
    hq_region: '', annual_gmv_band: '', channels_count: '',
    main_challenge: '', preferred_start: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function update<K extends keyof typeof form>(k: K, v: string) { setForm(s => ({ ...s, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setSending(true)
    try {
      const res = await fetch('/api/enterprise/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setErr(json.error || 'Could not send. Try again.'); return }
      setSent(true)
    } catch (e: any) {
      setErr(e?.message || 'Could not send. Try again.')
    } finally {
      setSending(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: 14, fontFamily: SANS,
    background: 'white', border: `1px solid ${C.inkFaint}`, borderRadius: 8, color: C.ink,
    outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontFamily: 'var(--font-mono), ui-monospace, monospace',
    letterSpacing: '0.14em', textTransform: 'uppercase', color: C.inkMuted,
    fontWeight: 600, marginBottom: 8, display: 'block',
  }

  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: SANS, minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(243,240,234,0.88)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.rule}`, padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', color: C.ink, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke={C.ink} strokeWidth="1.5"/><rect x="9.2" y="17" width="5.6" height="2.2" fill={C.cobalt}/></svg>
          <span style={{ fontFamily: SERIF, fontSize: 20, letterSpacing: '-0.015em' }}>Palvento</span>
        </Link>
        <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
          <Link href="/pricing" style={{ color: C.inkSoft, textDecoration: 'none' }}>Pricing</Link>
          <Link href="/about" style={{ color: C.inkSoft, textDecoration: 'none' }}>About</Link>
          <Link href="/login" style={{ color: C.ink, textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '88px 32px 56px' }}>
        <div style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.cobalt, fontWeight: 600, marginBottom: 20 }}>
          Enterprise
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 0.96, margin: 0, color: C.ink }}>
          Palvento for enterprise.
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: C.inkSoft, maxWidth: 640, marginTop: 28 }}>
          The same intelligence engine, wrapped in the governance, support, and isolation that large operations require. Deployed in your region, audited against your standards, priced to your scale.
        </p>
      </section>

      {/* Includes grid */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 32px', borderTop: `1px solid ${C.rule}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 0, borderTop: `1px solid ${C.rule}`, borderLeft: `1px solid ${C.rule}` }}>
          {INCLUDES.map(item => (
            <div key={item.t} style={{ padding: '28px 28px 32px', borderRight: `1px solid ${C.rule}`, borderBottom: `1px solid ${C.rule}`, background: C.cream }}>
              <Icon d={item.i} />
              <div style={{ fontFamily: SERIF, fontSize: 22, letterSpacing: '-0.02em', marginTop: 14, marginBottom: 6 }}>{item.t}</div>
              <div style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.55 }}>{item.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Profiles */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '64px 32px', borderTop: `1px solid ${C.rule}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 48 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.05 }}>
            You should talk to us if…
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {PROFILES.map((p, i) => (
              <li key={i} style={{ padding: '20px 0', borderBottom: `1px solid ${C.rule}`, fontSize: 17, color: C.ink, lineHeight: 1.55, display: 'flex', gap: 18 }}>
                <span style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', fontSize: 12, color: C.cobalt, fontWeight: 600, flexShrink: 0, paddingTop: 4 }}>
                  0{i + 1}
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Compliance */}
      <section style={{ background: C.creamSoft, borderTop: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '64px 32px' }}>
          <div style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.cobalt, fontWeight: 600, marginBottom: 16 }}>
            Compliance
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.05, marginBottom: 36 }}>
            Built for the security review.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28 }}>
            {COMPLIANCE.map(c => (
              <div key={c.t}>
                <div style={{ fontFamily: SERIF, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 8 }}>{c.t}</div>
                <div style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.55 }}>{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="quote" style={{ borderTop: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '80px 32px 120px' }}>
          <div style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.cobalt, fontWeight: 600, marginBottom: 16 }}>
            Request a quote
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 400, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.05, marginBottom: 16 }}>
            Tell us about your operation.
          </h2>
          <p style={{ fontSize: 16, color: C.inkSoft, lineHeight: 1.55, marginBottom: 40, maxWidth: 560 }}>
            We respond within one business day. No demo-before-price games — we’ll quote a tailored number and book an intro only if the shape fits.
          </p>

          {sent ? (
            <div style={{ background: 'white', border: `1px solid ${C.inkFaint}`, borderRadius: 12, padding: '36px 32px' }}>
              <div style={{ fontFamily: SERIF, fontSize: 28, letterSpacing: '-0.02em', marginBottom: 10 }}>Received. Thank you.</div>
              <p style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.55, margin: 0 }}>
                We’ll be in touch within one business day with a quote and a calendar link. If you need to reach us sooner, reply to the confirmation email.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ background: 'white', border: `1px solid ${C.inkFaint}`, borderRadius: 12, padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div><label style={labelStyle}>Name *</label><input required value={form.name} onChange={e => update('name', e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Work email *</label><input required type="email" value={form.work_email} onChange={e => update('work_email', e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Company</label><input value={form.company} onChange={e => update('company', e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Role</label><input value={form.role} onChange={e => update('role', e.target.value)} style={inputStyle} /></div>
                <div>
                  <label style={labelStyle}>HQ region</label>
                  <select value={form.hq_region} onChange={e => update('hq_region', e.target.value)} style={inputStyle}>
                    <option value="">Select…</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Annual GMV</label>
                  <select value={form.annual_gmv_band} onChange={e => update('annual_gmv_band', e.target.value)} style={inputStyle}>
                    <option value="">Select…</option>
                    {GMV_BANDS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Channels</label>
                  <select value={form.channels_count} onChange={e => update('channels_count', e.target.value)} style={inputStyle}>
                    <option value="">Select…</option>
                    {CHANNEL_COUNTS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Preferred start</label>
                  <select value={form.preferred_start} onChange={e => update('preferred_start', e.target.value)} style={inputStyle}>
                    <option value="">Select…</option>
                    {STARTS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Main challenge</label>
                <textarea value={form.main_challenge} onChange={e => update('main_challenge', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }} />
              </div>

              {err && <div style={{ fontSize: 13, color: '#b4321f', marginBottom: 16 }}>{err}</div>}

              <button type="submit" disabled={sending} style={{ background: C.ink, color: C.cream, border: 'none', borderRadius: 8, padding: '14px 28px', fontSize: 14, fontWeight: 600, cursor: sending ? 'wait' : 'pointer', opacity: sending ? 0.7 : 1, fontFamily: SANS }}>
                {sending ? 'Sending…' : 'Request quote →'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
