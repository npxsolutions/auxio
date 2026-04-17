// Lifecycle email templates — $1B SaaS grade.
// Design: Stripe/Linear/Vercel reference. No exclamation marks, no emoji.
// Each template returns { subject, html, text }.

export type LifecycleUser = {
  id: string
  email: string
  firstName?: string | null
}

export type LifecycleContext = {
  orders7d?: number
  gmv7d?: number
  topChannel?: string | null
  appUrl?: string
  // Feed health digest
  feedHealthScore?: number
  totalListings?: number
  errorsCaught?: number
  optimizationTips?: string[]
  // Trial
  trialDaysLeft?: number
  planName?: string
  // Invoice
  invoiceAmount?: number
  invoiceCurrency?: string
  invoicePeriodStart?: string
  invoicePeriodEnd?: string
  nextBillingDate?: string
  invoiceNumber?: string
}

export type RenderedEmail = { subject: string; html: string; text: string }

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://palvento.com'

// ─── Palvento triangle mark as inline SVG data URI (20x20) ───────────────
const LOGO_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M10 2L18.66 18H1.34L10 2z' fill='%230b0f1a'/%3E%3C/svg%3E"

// ─── Shell ────────────────────────────────────────────────────────────────
function shell(inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Palvento</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style>
  body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f3f0ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0b0f1a;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f0ea;">
<tr><td align="center" style="padding:40px 16px;">

<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<!-- Logo -->
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

<!-- Content card -->
<tr><td style="background-color:#ffffff;border:1px solid #e8e5de;padding:40px 40px 36px;">
  ${inner}
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 0 0 0;font-size:12px;line-height:1.7;color:#5a6171;">
  <p style="margin:0 0 4px;">&copy; 2026 NPX Solutions Ltd &middot; <a href="https://palvento.com" style="color:#5a6171;text-decoration:none;">palvento.com</a></p>
  <p style="margin:0 0 4px;"><a href="${BASE_URL}/settings/notifications" style="color:#5a6171;text-decoration:underline;">Unsubscribe</a> &middot; <a href="${BASE_URL}/settings" style="color:#5a6171;text-decoration:underline;">Email preferences</a></p>
  <p style="margin:0;color:#8a8f9c;">NPX Solutions Ltd, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom</p>
</td></tr>
</table>

</td></tr>
</table>
</body>
</html>`
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Primary CTA button — VML compatible for Outlook */
function btn(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
<tr><td align="center" style="background-color:#0b0f1a;border-radius:6px;">
  <!--[if mso]>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="14%" strokecolor="#0b0f1a" fillcolor="#0b0f1a">
  <w:anchorlock/>
  <center style="color:#f3f0ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:500;">${label}</center>
  </v:roundrect>
  <![endif]-->
  <!--[if !mso]><!-->
  <a href="${href}" style="display:inline-block;background-color:#0b0f1a;color:#f3f0ea;text-decoration:none;border-radius:6px;padding:12px 24px;font-size:14px;font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1;">${label}</a>
  <!--<![endif]-->
</td></tr>
</table>`
}

/** Paragraph */
function p(text: string): string {
  return `<p style="font-size:15px;line-height:1.65;color:#1c2233;margin:0 0 16px;">${text}</p>`
}

/** Muted paragraph */
function muted(text: string): string {
  return `<p style="font-size:13px;line-height:1.6;color:#5a6171;margin:0 0 12px;">${text}</p>`
}

/** Inline monospace span — for codes, SKU refs, numbers */
function mono(text: string): string {
  return `<code style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:13px;background-color:#f3f0ea;padding:2px 6px;border-radius:3px;color:#0b0f1a;">${text}</code>`
}

/** Horizontal divider */
function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-top:1px solid #e8e5de;font-size:0;line-height:0;">&nbsp;</td></tr></table>`
}

/** Metric display — "34 orders · $4,218 GMV" */
function metric(items: Array<{ value: string; label: string }>): string {
  const cells = items
    .map(
      (item) =>
        `<td style="padding:16px 20px 16px 0;">
      <div style="font-family:'Instrument Serif',Georgia,serif;font-size:28px;font-weight:400;letter-spacing:-0.02em;color:#0b0f1a;line-height:1.2;">${item.value}</div>
      <div style="font-size:12px;color:#5a6171;margin-top:4px;text-transform:uppercase;letter-spacing:0.04em;">${item.label}</div>
    </td>`
    )
    .join('')
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%;"><tr>${cells}</tr></table>`
}

/** Key-value data row — like a receipt line */
function dataRow(label: string, value: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
  <td style="padding:10px 0;font-size:14px;color:#5a6171;border-bottom:1px solid #f3f0ea;">${label}</td>
  <td style="padding:10px 0;font-size:14px;color:#0b0f1a;text-align:right;border-bottom:1px solid #f3f0ea;font-weight:500;">${value}</td>
</tr></table>`
}

/** Heading */
function h1(text: string): string {
  return `<h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:28px;font-weight:400;letter-spacing:-0.02em;line-height:1.2;margin:0 0 20px;color:#0b0f1a;">${text}</h1>`
}

/** Sign-off */
function signoff(): string {
  return `<p style="font-size:14px;line-height:1.6;color:#5a6171;margin:28px 0 0;">— The Palvento team</p>`
}

// ─── Templates ────────────────────────────────────────────────────────────

export function welcomeEmail(user: LifecycleUser, _ctx: LifecycleContext = {}): RenderedEmail {
  const name = user.firstName ? `, ${user.firstName}` : ''
  const subject = 'Your Palvento account is ready'
  const html = shell(`
    ${h1(`Your account is ready${name}.`)}
    ${p('Palvento gives you one view across every marketplace you sell on — real orders, true costs, actual margin per SKU. No spreadsheets, no guesswork.')}
    ${p('Connect your first channel and you will see live data within minutes. Shopify, Amazon, eBay, Etsy — pick whichever store has the most recent activity.')}
    ${p('If you would rather have a human walk you through it, reply to this email. It goes to a real inbox.')}
    ${btn(`${BASE_URL}/onboarding`, 'Connect your first channel')}
    ${signoff()}
  `)
  const text = `Your account is ready${name}.

Palvento gives you one view across every marketplace you sell on — real orders, true costs, actual margin per SKU.

Connect your first channel and you will see live data within minutes. Shopify, Amazon, eBay, Etsy — pick whichever store has the most recent activity.

Reply to this email if you need a hand. It goes to a real inbox.

Connect your first channel: ${BASE_URL}/onboarding

— The Palvento team`
  return { subject, html, text }
}

export function day1NudgeEmail(user: LifecycleUser, _ctx: LifecycleContext = {}): RenderedEmail {
  const subject = 'Your first feed is one click away'
  const html = shell(`
    ${h1('Your first feed is one click away.')}
    ${p('You signed up yesterday but have not connected a channel yet. That is normal — the first one takes a moment of thought.')}
    ${p('Pick the store with the most recent sales. Palvento pulls in orders, matches marketplace fees, and surfaces your real margin. Most sellers see their first profit number within ten minutes.')}
    ${btn(`${BASE_URL}/onboarding`, 'Connect a channel')}
    ${muted('Stuck on something specific? Reply with the channel name and we will walk you through it.')}
  `)
  const text = `Your first feed is one click away.

You signed up yesterday but have not connected a channel yet. That is normal — the first one takes a moment of thought.

Pick the store with the most recent sales. Palvento pulls in orders, matches marketplace fees, and surfaces your real margin.

Connect a channel: ${BASE_URL}/onboarding

Stuck on something specific? Reply with the channel name and we will walk you through it.`
  return { subject, html, text }
}

export function day3NudgeEmail(user: LifecycleUser, _ctx: LifecycleContext = {}): RenderedEmail {
  const subject = 'Your feed sync is running'
  const html = shell(`
    ${h1('Your feed sync is running.')}
    ${p('Your channel is connected. Palvento is pulling in your catalog and matching orders to fees. Depending on how many listings you have, the first full sync takes anywhere from a few minutes to a few hours.')}
    ${p('Once complete, you will see every order with its true cost breakdown — marketplace fees, shipping, returns, and the margin left over.')}
    ${p('Open your dashboard to check sync progress and trigger a backfill if you want to move faster.')}
    ${btn(`${BASE_URL}/dashboard`, 'View sync status')}
  `)
  const text = `Your feed sync is running.

Your channel is connected. Palvento is pulling in your catalog and matching orders to fees.

Once complete, you will see every order with its true cost breakdown — marketplace fees, shipping, returns, and the margin left over.

View sync status: ${BASE_URL}/dashboard`
  return { subject, html, text }
}

export function day7ActiveEmail(user: LifecycleUser, ctx: LifecycleContext = {}): RenderedEmail {
  const orders = ctx.orders7d ?? 0
  const gmv = ctx.gmv7d ?? 0
  const top = ctx.topChannel || 'your top channel'
  const subject = `Your first week: ${orders} orders synced`
  const html = shell(`
    ${h1('Your first week in review.')}
    ${metric([
      { value: String(orders), label: 'Orders' },
      { value: `\u00a3${gmv.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`, label: 'GMV' },
      { value: top, label: 'Top channel' },
    ])}
    ${divider()}
    ${p('You have the baseline. Two things most operators turn on next.')}
    ${p('<strong>Feed rules.</strong> Set pricing floors, margin targets, and inventory thresholds. Palvento adjusts your listings automatically across channels.')}
    ${p('<strong>Team access.</strong> Invite your ops team so they see the same numbers, scoped to the channels and SKUs you choose.')}
    ${btn(`${BASE_URL}/feeds`, 'Set up feed rules')}
    <p style="margin:16px 0 0;"><a href="${BASE_URL}/settings/team" style="color:#1d5fdb;text-decoration:none;font-size:14px;">Invite your team</a></p>
  `)
  const text = `Your first week in review.

${orders} orders | \u00a3${gmv.toLocaleString('en-GB', { maximumFractionDigits: 0 })} GMV | Top channel: ${top}

Two things to turn on next:

1. Feed rules — pricing floors, margin targets, inventory thresholds.
   ${BASE_URL}/feeds

2. Team access — invite your ops team.
   ${BASE_URL}/settings/team`
  return { subject, html, text }
}

export function day7DormantEmail(user: LifecycleUser, _ctx: LifecycleContext = {}): RenderedEmail {
  const subject = 'Need a hand? 15 minutes and you are live'
  const html = shell(`
    ${h1('Need a hand getting started?')}
    ${p('A week in and you have not seen your first profit number yet. That is almost always a setup thing we can fix in fifteen minutes.')}
    ${p('We will share a screen, get your first channel syncing, and point you at the views that matter. No slides, no pitch — just the product.')}
    ${btn(`${BASE_URL}/contact`, 'Book a 15-minute setup call')}
    ${muted('Prefer email? Reply with the channel you are trying to connect and we will walk you through it in writing.')}
  `)
  const text = `Need a hand getting started?

A week in and you have not seen your first profit number yet. That is almost always a setup thing we can fix in fifteen minutes.

Book a 15-minute setup call: ${BASE_URL}/contact

Prefer email? Reply with the channel you are trying to connect and we will walk you through it in writing.`
  return { subject, html, text }
}

// ─── New templates ────────────────────────────────────────────────────────

export function confirmationEmail(user: LifecycleUser, _ctx: LifecycleContext = {}): RenderedEmail {
  const subject = 'Confirm your email'
  const html = shell(`
    ${h1('Confirm your email address.')}
    ${p('Click the button below to verify your email and activate your Palvento account.')}
    ${btn(`${BASE_URL}/auth/confirm?email=${encodeURIComponent(user.email)}`, 'Confirm email')}
    ${divider()}
    ${muted('If you did not create a Palvento account, you can ignore this email.')}
  `)
  const text = `Confirm your email address.

Click the link below to verify your email and activate your Palvento account.

Confirm email: ${BASE_URL}/auth/confirm?email=${encodeURIComponent(user.email)}

If you did not create a Palvento account, you can ignore this email.`
  return { subject, html, text }
}

export function passwordResetEmail(user: LifecycleUser, _ctx: LifecycleContext = {}): RenderedEmail {
  const subject = 'Reset your password'
  const html = shell(`
    ${h1('Reset your password.')}
    ${p('We received a request to reset the password for your Palvento account. Click the button below to choose a new password.')}
    ${btn(`${BASE_URL}/auth/reset-password`, 'Reset password')}
    ${divider()}
    ${muted('This link expires in 24 hours. If you did not request a password reset, you can safely ignore this email. Your password will not be changed.')}
  `)
  const text = `Reset your password.

We received a request to reset the password for your Palvento account.

Reset password: ${BASE_URL}/auth/reset-password

This link expires in 24 hours. If you did not request a password reset, you can safely ignore this email.`
  return { subject, html, text }
}

export function trialEndingEmail(user: LifecycleUser, ctx: LifecycleContext = {}): RenderedEmail {
  const days = ctx.trialDaysLeft ?? 3
  const plan = ctx.planName || 'Pro'
  const subject = `Your trial ends in ${days} days`
  const html = shell(`
    ${h1(`Your trial ends in ${days} days.`)}
    ${p('When your trial ends, you will lose access to:')}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      <tr><td style="padding:4px 0;font-size:15px;color:#1c2233;">&bull;&ensp;Real-time feed sync across all channels</td></tr>
      <tr><td style="padding:4px 0;font-size:15px;color:#1c2233;">&bull;&ensp;Automated feed rules and repricing</td></tr>
      <tr><td style="padding:4px 0;font-size:15px;color:#1c2233;">&bull;&ensp;Margin and profit analytics</td></tr>
      <tr><td style="padding:4px 0;font-size:15px;color:#1c2233;">&bull;&ensp;Error detection and feed health monitoring</td></tr>
    </table>
    ${p(`Upgrade to ${plan} to keep everything running. Your data and feed configurations will stay exactly as they are.`)}
    ${btn(`${BASE_URL}/settings/billing`, 'Upgrade now')}
    ${muted('Have questions about pricing? Reply to this email.')}
  `)
  const text = `Your trial ends in ${days} days.

When your trial ends, you will lose access to:
- Real-time feed sync across all channels
- Automated feed rules and repricing
- Margin and profit analytics
- Error detection and feed health monitoring

Upgrade to ${plan} to keep everything running.

Upgrade now: ${BASE_URL}/settings/billing

Have questions about pricing? Reply to this email.`
  return { subject, html, text }
}

export function trialExpiredEmail(user: LifecycleUser, ctx: LifecycleContext = {}): RenderedEmail {
  const plan = ctx.planName || 'Pro'
  const subject = 'Your trial has ended'
  const html = shell(`
    ${h1('Your trial has ended.')}
    ${p('Your Palvento trial has expired. Your feeds are paused and data sync has stopped, but nothing has been deleted. Your channels, feed rules, and historical data are all still here.')}
    ${p(`Upgrade to ${plan} to resume syncing. Everything will pick up right where it left off.`)}
    ${btn(`${BASE_URL}/settings/billing`, 'Upgrade to continue')}
    ${divider()}
    ${muted('If you have decided Palvento is not the right fit, no action needed. Your account will remain accessible in read-only mode for 30 days.')}
  `)
  const text = `Your trial has ended.

Your feeds are paused and data sync has stopped, but nothing has been deleted. Your channels, feed rules, and historical data are all still here.

Upgrade to ${plan} to resume syncing: ${BASE_URL}/settings/billing

If you have decided Palvento is not the right fit, no action needed. Your account will remain accessible in read-only mode for 30 days.`
  return { subject, html, text }
}

export function invoiceEmail(user: LifecycleUser, ctx: LifecycleContext = {}): RenderedEmail {
  const currency = ctx.invoiceCurrency || '\u00a3'
  const amount = ctx.invoiceAmount ?? 0
  const periodStart = ctx.invoicePeriodStart || ''
  const periodEnd = ctx.invoicePeriodEnd || ''
  const nextBilling = ctx.nextBillingDate || ''
  const plan = ctx.planName || 'Pro'
  const invoiceNum = ctx.invoiceNumber || ''
  const subject = `Your Palvento invoice — ${currency}${amount.toFixed(2)}`
  const html = shell(`
    ${h1('Your invoice is ready.')}
    ${p(`Here is a summary of your latest payment.`)}
    ${divider()}
    ${dataRow('Plan', plan)}
    ${dataRow('Period', `${periodStart} — ${periodEnd}`)}
    ${dataRow('Amount', `${currency}${amount.toFixed(2)}`)}
    ${invoiceNum ? dataRow('Invoice number', mono(invoiceNum)) : ''}
    ${nextBilling ? dataRow('Next billing date', nextBilling) : ''}
    ${divider()}
    ${muted('This payment was charged to the card on file. You can view and download all invoices from your billing settings.')}
    ${btn(`${BASE_URL}/settings/billing`, 'View billing')}
  `)
  const text = `Your invoice is ready.

Plan: ${plan}
Period: ${periodStart} — ${periodEnd}
Amount: ${currency}${amount.toFixed(2)}${invoiceNum ? `\nInvoice number: ${invoiceNum}` : ''}${nextBilling ? `\nNext billing date: ${nextBilling}` : ''}

View billing: ${BASE_URL}/settings/billing`
  return { subject, html, text }
}

export function feedHealthDigest(user: LifecycleUser, ctx: LifecycleContext = {}): RenderedEmail {
  const score = ctx.feedHealthScore ?? 0
  const listings = ctx.totalListings ?? 0
  const errors = ctx.errorsCaught ?? 0
  const tips = ctx.optimizationTips ?? []
  const subject = `Feed health: ${score}/100 — weekly digest`
  const html = shell(`
    ${h1('Weekly feed health digest.')}
    ${metric([
      { value: `${score}/100`, label: 'Health score' },
      { value: listings.toLocaleString('en-GB'), label: 'Listings synced' },
      { value: String(errors), label: 'Errors caught' },
    ])}
    ${divider()}
    ${tips.length > 0 ? `
      ${p('<strong>Optimization suggestions</strong>')}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
        ${tips.map((tip) => `<tr><td style="padding:4px 0;font-size:14px;color:#1c2233;">&bull;&ensp;${tip}</td></tr>`).join('')}
      </table>
    ` : p('No issues detected this week. Your feeds are running cleanly.')}
    ${btn(`${BASE_URL}/feeds/health`, 'View full report')}
    ${signoff()}
  `)
  const text = `Weekly feed health digest.

Health score: ${score}/100
Listings synced: ${listings.toLocaleString('en-GB')}
Errors caught: ${errors}
${tips.length > 0 ? `\nOptimization suggestions:\n${tips.map((t) => `- ${t}`).join('\n')}` : '\nNo issues detected this week.'}

View full report: ${BASE_URL}/feeds/health

— The Palvento team`
  return { subject, html, text }
}

// ─── Template registry ───────────────────────────────────────────────────

export const LIFECYCLE_TEMPLATES = {
  welcome: welcomeEmail,
  day1_nudge: day1NudgeEmail,
  day3_nudge: day3NudgeEmail,
  day7_active: day7ActiveEmail,
  day7_dormant: day7DormantEmail,
  confirmation: confirmationEmail,
  password_reset: passwordResetEmail,
  trial_ending: trialEndingEmail,
  trial_expired: trialExpiredEmail,
  invoice: invoiceEmail,
  feed_health_digest: feedHealthDigest,
} as const

export type LifecycleTemplate = keyof typeof LIFECYCLE_TEMPLATES
