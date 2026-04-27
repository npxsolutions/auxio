import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'
import { Resend } from 'resend'

export const runtime = 'nodejs'

// ── Rate limiting: 3 applications per IP per hour ──────────────────────────
let _limiter: Ratelimit | null = null
function getLimiter(): Ratelimit | null {
  if (_limiter) return _limiter
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  _limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'rl:beta-apply',
    analytics: false,
  })
  return _limiter
}

// ── Email helpers ──────────────────────────────────────────────────────────
const getResend = () => new Resend(process.env.RESEND_API_KEY)

const ADMIN_EMAIL = 'info@npx-solutions.com'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://palvento.com'
const LOGO_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M10 2L18.66 18H1.34L10 2z' fill='%230b0f1a'/%3E%3C/svg%3E"

function applicantEmail(name: string): { subject: string; html: string; text: string } {
  const firstName = name.split(' ')[0] || name
  const subject = 'We received your beta application'
  const text = `Hi ${firstName},

Thanks for applying to the Palvento beta. We review every application by hand and will get back to you within 48 hours.

If you are selected, you will receive the Scale plan ($799/mo) for life — no strings attached. We are looking for sellers who want a genuine voice in building the next generation of feed management tooling.

In the meantime, if you have any questions, reply to this email. It goes to a real inbox.

— The Palvento team

palvento.com`
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>Palvento</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f4ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0b0f1a;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f4ec;">
<tr><td align="center" style="padding:40px 16px;">

<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="padding:0 0 32px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:middle;padding-right:8px;">
      <img src="${LOGO_DATA_URI}" width="20" height="20" alt="" style="display:block;" />
    </td>
    <td style="vertical-align:middle;font-size:14px;font-weight:600;color:#0b0f1a;letter-spacing:-0.01em;">
      Palvento
    </td>
  </tr></table>
</td></tr>

<tr><td style="background-color:#ffffff;border:1px solid #e8e5de;padding:40px 40px 36px;">
  <h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:28px;font-weight:400;letter-spacing:-0.02em;line-height:1.2;margin:0 0 20px;color:#0b0f1a;">We received your application.</h1>
  <p style="font-size:15px;line-height:1.65;color:#1c2233;margin:0 0 16px;">Hi ${firstName} — thanks for applying to the Palvento beta. We review every application by hand and will get back to you within 48 hours.</p>
  <p style="font-size:15px;line-height:1.65;color:#1c2233;margin:0 0 16px;">If you are selected, you will receive the Scale plan ($799/mo) for life — no strings attached. We are looking for sellers who want a genuine voice in building the next generation of feed management tooling.</p>
  <p style="font-size:15px;line-height:1.65;color:#1c2233;margin:0 0 16px;">In the meantime, if you have any questions, reply to this email. It goes to a real inbox.</p>
  <p style="font-size:14px;line-height:1.6;color:#5a6171;margin:28px 0 0;">— The Palvento team</p>
</td></tr>

<tr><td style="padding:24px 0 0 0;font-size:12px;line-height:1.7;color:#5a6171;">
  <p style="margin:0 0 4px;">&copy; 2026 NPX Solutions Ltd &middot; <a href="https://palvento.com" style="color:#5a6171;text-decoration:none;">palvento.com</a></p>
  <p style="margin:0;color:#8a8f9c;">NPX Solutions Ltd, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom</p>
</td></tr>
</table>

</td></tr>
</table>
</body>
</html>`
  return { subject, html, text }
}

function adminNotification(data: Record<string, unknown>): { subject: string; html: string; text: string } {
  const subject = `New beta application: ${data.name}`
  const text = `New beta application received.

Name: ${data.name}
Email: ${data.email}
Shopify URL: ${data.shopifyUrl}
Marketplaces: ${(data.marketplaces as string[]).join(', ')}
Monthly GMV: ${data.gmvRange}

Review in Supabase: ${BASE_URL}/admin/beta`
  const html = `<div style="font-family:-apple-system,sans-serif;font-size:14px;color:#0b0f1a;padding:20px;">
<h2 style="margin:0 0 16px;">New beta application</h2>
<table style="border-collapse:collapse;font-size:14px;">
<tr><td style="padding:6px 16px 6px 0;color:#5a6171;">Name</td><td style="padding:6px 0;font-weight:500;">${data.name}</td></tr>
<tr><td style="padding:6px 16px 6px 0;color:#5a6171;">Email</td><td style="padding:6px 0;font-weight:500;">${data.email}</td></tr>
<tr><td style="padding:6px 16px 6px 0;color:#5a6171;">Shopify URL</td><td style="padding:6px 0;font-weight:500;">${data.shopifyUrl}</td></tr>
<tr><td style="padding:6px 16px 6px 0;color:#5a6171;">Marketplaces</td><td style="padding:6px 0;font-weight:500;">${(data.marketplaces as string[]).join(', ')}</td></tr>
<tr><td style="padding:6px 16px 6px 0;color:#5a6171;">Monthly GMV</td><td style="padding:6px 0;font-weight:500;">${data.gmvRange}</td></tr>
</table>
</div>`
  return { subject, html, text }
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Rate limit by IP
  const limiter = getLimiter()
  if (limiter) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success } = await limiter.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many applications. Please try again later.' }, { status: 429 })
    }
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { name, email, shopifyUrl, marketplaces, gmvRange } = body as {
    name?: string
    email?: string
    shopifyUrl?: string
    marketplaces?: string[]
    gmvRange?: string
  }

  if (!name || !email || !shopifyUrl || !marketplaces?.length || !gmvRange) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  try {
    const admin = getSupabaseAdmin()

    // Save to beta_applications table
    const { error: insertErr } = await admin.from('beta_applications').insert({
      name,
      email: email.toLowerCase().trim(),
      shopify_url: shopifyUrl,
      marketplaces,
      gmv_range: gmvRange,
      status: 'pending',
    })

    if (insertErr) {
      // Duplicate email
      if (insertErr.code === '23505') {
        return NextResponse.json({ error: 'You have already applied. We will be in touch.' }, { status: 409 })
      }
      console.error('[beta/apply] insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to save application.' }, { status: 500 })
    }

    // Send emails (fire-and-forget — don't block the response)
    const resend = getResend()
    const emailPromises: Promise<unknown>[] = []

    // Confirmation to applicant
    const confirmationEmail = applicantEmail(name)
    emailPromises.push(
      resend.emails.send({
        from: 'Palvento <hello@palvento.com>',
        to: email,
        replyTo: 'hello@palvento.com',
        subject: confirmationEmail.subject,
        html: confirmationEmail.html,
        text: confirmationEmail.text,
      }).catch(err => console.error('[beta/apply] applicant email failed:', err))
    )

    // Notification to admin
    const adminEmail = adminNotification(body)
    emailPromises.push(
      resend.emails.send({
        from: 'Palvento <hello@palvento.com>',
        to: ADMIN_EMAIL,
        subject: adminEmail.subject,
        html: adminEmail.html,
        text: adminEmail.text,
      }).catch(err => console.error('[beta/apply] admin email failed:', err))
    )

    // Don't await — respond immediately
    Promise.all(emailPromises).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[beta/apply] unexpected error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
