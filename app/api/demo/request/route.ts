import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'
import { notifySlack } from '../../../lib/slack/notify'

export const runtime = 'nodejs'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

type DemoPayload = {
  name?: string
  email?: string
  company?: string
  role?: string
  monthly_gmv?: string
  channels?: string[]
  notes?: string
  utm?: Record<string, string | undefined>
}

function confirmationHtml(name: string): string {
  const first = name ? name.split(' ')[0] : 'there'
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f0ea;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#0b0f1a;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid rgba(11,15,26,0.08);border-radius:14px;padding:36px 40px;">
<tr><td>
  <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:28px;">
    <div style="width:26px;height:26px;background:#0b0f1a;border-radius:6px;"></div>
    <span style="font-size:14px;font-weight:600;">Palvento</span>
  </div>
  <h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:30px;font-weight:400;letter-spacing:-0.02em;line-height:1.1;margin:0 0 20px;">Thanks${name ? `, ${first}` : ''}.</h1>
  <p style="font-size:15px;line-height:1.65;color:#1c2233;margin:0 0 16px;">We've received your demo request. Expect a reply within one business day with calendar options or, if you booked directly on Cal, a confirmation of the slot.</p>
  <p style="font-size:15px;line-height:1.65;color:#1c2233;margin:0 0 16px;">The demo is twenty minutes, working session format — we share a screen, pull your public data where possible, and show you the view that matters. No slides.</p>
  <p style="font-size:14px;color:#5a6171;margin:28px 0 0;">— The Palvento team</p>
</td></tr></table>
</td></tr></table></body></html>`
}

export async function POST(request: Request) {
  let body: DemoPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const email = (body.email || '').trim().toLowerCase()
  if (!email || !/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: 'valid email required' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('demo_requests')
    .insert({
      name: body.name || null,
      email,
      company: body.company || null,
      role: body.role || null,
      monthly_gmv: body.monthly_gmv || null,
      channels: body.channels && body.channels.length ? body.channels : null,
      notes: body.notes || null,
      utm: body.utm || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[demo/request] insert failed:', error.message)
    return NextResponse.json({ error: 'could not save request' }, { status: 500 })
  }

  // Confirmation email (fire-and-forget; do not block response on Resend).
  try {
    const resend = getResend()
    await resend.emails.send({
      from: 'Palvento <hello@palvento.app>',
      to: email,
      replyTo: 'hello@palvento.app',
      subject: 'We received your demo request.',
      html: confirmationHtml(body.name || ''),
    })
  } catch (err: any) {
    console.error('[demo/request] confirmation email failed:', err.message)
  }

  // Fire-and-forget #demos slack notification.
  const adminLink = data?.id
    ? `https://palvento-lkqv.vercel.app/admin/demos/${data.id}`
    : `mailto:${email}`
  void notifySlack({
    channel: 'demos',
    text: `New demo request: ${body.company || body.name || email}`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: 'New demo request' } },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Email:*\n${email}` },
          { type: 'mrkdwn', text: `*Name:*\n${body.name || '—'}` },
          { type: 'mrkdwn', text: `*Company:*\n${body.company || '—'}` },
          { type: 'mrkdwn', text: `*Role:*\n${body.role || '—'}` },
          { type: 'mrkdwn', text: `*Monthly GMV:*\n${body.monthly_gmv || '—'}` },
          { type: 'mrkdwn', text: `*Channels:*\n${(body.channels && body.channels.length ? body.channels.join(', ') : '—')}` },
        ],
      },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `<${adminLink}|Open in admin>` }] },
    ],
  })

  return NextResponse.json({ ok: true, id: data?.id })
}
