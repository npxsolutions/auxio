// [settings/referral] — user-facing referral program page (v8 editorial craft).
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '../../lib/supabase-server'
import { getOrCreateReferralCode } from '../../lib/referral/code'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import CopyButton from './CopyButton'

const C = {
  bg:      '#f3f0ea',
  ink:     '#0b0f1a',
  mutedDk: '#2c3142',
  muted:   '#5a6171',
  rule:    'rgba(11,15,26,0.10)',
  cobalt:  '#1d5fdb',
  surface: '#ffffff',
}

export default async function ReferralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const code = await getOrCreateReferralCode(user.id)

  const hdrs = await headers()
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'meridia.com'
  const proto = hdrs.get('x-forwarded-proto') || 'https'
  const shareUrl = `${proto}://${host}/?ref=${code}`

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
  const { data: refs } = await admin
    .from('referrals')
    .select('status, credit_amount_cents')
    .eq('referrer_user_id', user.id)

  const counts = { pending: 0, paid: 0, credited: 0 }
  let totalCreditsCents = 0
  for (const r of (refs || [])) {
    if (r.status === 'pending' || r.status === 'signed_up') counts.pending++
    else if (r.status === 'paid') counts.paid++
    else if (r.status === 'credited') counts.credited++
    if (r.status === 'paid' || r.status === 'credited') totalCreditsCents += (r.credit_amount_cents || 0)
  }

  return (
    <main style={{ background: C.bg, color: C.ink, minHeight: '100vh', padding: '64px 32px', fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{ width: 24, height: 1, background: C.cobalt }} />
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, letterSpacing: '0.02em', color: C.cobalt, fontWeight: 500 }}>Invite friends</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1, margin: 0 }}>
          Share Meridia. <em style={{ fontStyle: 'italic', color: C.cobalt }}>Earn credit.</em>
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.5, color: C.mutedDk, fontFamily: 'var(--font-display-v8), Georgia, serif', fontStyle: 'italic', marginTop: 20, maxWidth: 560 }}>
          Send your friends your link. When they start paying, you get $50 in credit, they get 10% off their first month.
        </p>

        {/* Share URL */}
        <section style={{ marginTop: 48, padding: 28, background: C.surface, border: `1px solid ${C.rule}` }}>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Your link</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <code style={{ flex: 1, minWidth: 280, fontFamily: 'var(--font-mono), monospace', fontSize: 14, color: C.ink, padding: '12px 14px', background: C.bg, border: `1px solid ${C.rule}`, overflow: 'auto' }}>{shareUrl}</code>
            <CopyButton text={shareUrl} />
          </div>
          <div style={{ marginTop: 16, fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Code · {code}</div>
        </section>

        {/* Stats */}
        <section style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { label: 'Pending', value: counts.pending },
            { label: 'Paid',    value: counts.paid },
            { label: 'Credited', value: counts.credited },
            { label: 'Earned',  value: `$${(totalCreditsCents / 100).toFixed(0)}` },
          ].map(s => (
            <div key={s.label} style={{ padding: 20, background: C.surface, border: `1px solid ${C.rule}` }}>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: C.cobalt, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 40, letterSpacing: '-0.02em', color: C.ink }}>{s.value}</div>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section style={{ marginTop: 48 }}>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: C.cobalt, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>How it works</div>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 20 }}>
            {[
              { n: '01', t: 'Share your link', d: 'Send it to a friend running a store, or post it anywhere you like.' },
              { n: '02', t: 'They sign up and start paying', d: 'Meridia attributes them to you for 30 days. They get 10% off month one.' },
              { n: '03', t: 'You get $50 credit', d: 'Applied automatically to your next invoice. Stack as many as you want.' },
            ].map(s => (
              <li key={s.n} style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 20, paddingBottom: 20, borderBottom: `1px solid ${C.rule}` }}>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: C.cobalt, fontWeight: 700, letterSpacing: '0.02em' }}>{s.n}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display-v8), Georgia, serif', fontSize: 24, color: C.ink, letterSpacing: '-0.015em' }}>{s.t}</div>
                  <div style={{ marginTop: 6, fontSize: 15, color: C.mutedDk, lineHeight: 1.5 }}>{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div style={{ marginTop: 48 }}>
          <Link href="/billing" style={{ fontSize: 13, color: C.cobalt, textDecoration: 'none', fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.02em' }}>View credits on billing →</Link>
        </div>
      </div>
    </main>
  )
}
