// Lifecycle email templates — editorial voice mirroring v8 landing.
// No exclamation marks, no emoji. Each template returns { subject, html, text }.

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
}

export type RenderedEmail = { subject: string; html: string; text: string }

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://auxio-lkqv.vercel.app'

function shell(inner: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f0ea;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#0b0f1a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f0ea;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid rgba(11,15,26,0.08);border-radius:14px;padding:36px 40px;">
<tr><td>
  <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:28px;">
    <div style="width:26px;height:26px;background:#0b0f1a;border-radius:6px;"></div>
    <span style="font-size:14px;font-weight:600;color:#0b0f1a;letter-spacing:-0.01em;">Meridia</span>
  </div>
  ${inner}
  <div style="margin-top:36px;padding-top:20px;border-top:1px solid rgba(11,15,26,0.06);font-size:12px;color:#5a6171;line-height:1.6;">
    You're receiving this as part of your Meridia onboarding. <a href="${BASE_URL}/settings" style="color:#1d5fdb;text-decoration:none;">Manage email preferences</a>.
  </div>
</td></tr></table>
</td></tr></table>
</body></html>`
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#0b0f1a;color:#f3f0ea;text-decoration:none;border-radius:999px;padding:12px 22px;font-size:14px;font-weight:500;margin-top:8px;">${label}</a>`
}

function p(text: string): string {
  return `<p style="font-size:15px;line-height:1.65;color:#1c2233;margin:0 0 16px;">${text}</p>`
}

export function welcomeEmail(user: LifecycleUser, _ctx: LifecycleContext = {}): RenderedEmail {
  const name = user.firstName ? `, ${user.firstName}` : ''
  const subject = 'Welcome to Meridia.'
  const html = shell(`
    <h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:34px;font-weight:400;letter-spacing:-0.02em;line-height:1.1;margin:0 0 20px;">Welcome to Meridia${name}.</h1>
    ${p('Thanks for signing up. Meridia is the operating layer for multichannel commerce — one place to see true profit across every marketplace you sell on.')}
    ${p('Your first move: connect a marketplace. As soon as one channel syncs, you will see real orders, real costs, and the actual profit per SKU. Most operators reach that moment inside ten minutes.')}
    ${p('If you would rather have a human walk you through it, reply to this email. It lands in a real inbox, not a ticketing queue.')}
    ${btn(`${BASE_URL}/onboarding`, 'Connect your first channel')}
    <p style="font-size:14px;line-height:1.6;color:#5a6171;margin:28px 0 0;">— The Meridia team</p>
  `)
  const text = `Welcome to Meridia${name}.

Thanks for signing up. Meridia is the operating layer for multichannel commerce — one place to see true profit across every marketplace you sell on.

Your first move: connect a marketplace. As soon as one channel syncs, you will see real orders, real costs, and the actual profit per SKU.

If you would rather have a human walk you through it, reply to this email.

Connect your first channel: ${BASE_URL}/onboarding

— The Meridia team`
  return { subject, html, text }
}

export function day1NudgeEmail(user: LifecycleUser, _ctx: LifecycleContext = {}): RenderedEmail {
  const subject = 'One step to your first profit number.'
  const html = shell(`
    <h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:32px;font-weight:400;letter-spacing:-0.02em;line-height:1.1;margin:0 0 20px;">One step to your first profit number.</h1>
    ${p('You signed up yesterday and have not connected a channel yet. That is fine — the first connection is the one that takes a bit of thought.')}
    ${p('Pick whichever store has the most recent activity. Shopify, eBay, Amazon, Etsy — any of them work. Meridia does the rest: pulls orders, matches fees, surfaces margin.')}
    ${btn(`${BASE_URL}/onboarding`, 'Pick a channel to connect')}
    <p style="font-size:14px;line-height:1.6;color:#5a6171;margin:28px 0 0;">Stuck on something specific. Reply and tell us which channel — we will unblock you.</p>
  `)
  const text = `One step to your first profit number.

You signed up yesterday and have not connected a channel yet. That is fine — the first connection is the one that takes a bit of thought.

Pick whichever store has the most recent activity. Shopify, eBay, Amazon, Etsy — any of them work. Meridia does the rest: pulls orders, matches fees, surfaces margin.

Pick a channel: ${BASE_URL}/onboarding

Stuck on something specific. Reply and tell us which channel — we will unblock you.`
  return { subject, html, text }
}

export function day3NudgeEmail(user: LifecycleUser, _ctx: LifecycleContext = {}): RenderedEmail {
  const subject = 'We can see your channels — orders next.'
  const html = shell(`
    <h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:32px;font-weight:400;letter-spacing:-0.02em;line-height:1.1;margin:0 0 20px;">We can see your channels — orders next.</h1>
    ${p('Your channel is connected. Orders have not flowed through yet, which usually means one of two things.')}
    ${p('First path: webhook registration. When a new sale happens, the marketplace pings Meridia in real time. Already set up for you.')}
    ${p('Second path: the overnight poll. We sweep each channel for the past 90 days on first connect. This can take up to a few hours depending on catalogue size.')}
    ${p('Open the dashboard to see the sync status and manually trigger a backfill if you want to move faster.')}
    ${btn(`${BASE_URL}/dashboard`, 'Open dashboard')}
  `)
  const text = `We can see your channels — orders next.

Your channel is connected. Orders have not flowed through yet, which usually means one of two things.

First: webhook registration — when a new sale happens, the marketplace pings Meridia in real time. Already set up.

Second: the overnight poll — we sweep each channel for the past 90 days on first connect. Can take a few hours depending on catalogue size.

Open the dashboard to see sync status: ${BASE_URL}/dashboard`
  return { subject, html, text }
}

export function day7ActiveEmail(user: LifecycleUser, ctx: LifecycleContext = {}): RenderedEmail {
  const orders = ctx.orders7d ?? 0
  const gmv = ctx.gmv7d ?? 0
  const top = ctx.topChannel || 'your top channel'
  const subject = 'Your first week.'
  const html = shell(`
    <h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:32px;font-weight:400;letter-spacing:-0.02em;line-height:1.1;margin:0 0 20px;">Your first week.</h1>
    ${p(`Seven days in. We counted <strong>${orders} order${orders === 1 ? '' : 's'}</strong> and <strong>£${gmv.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</strong> in GMV, with ${top} leading the pack.`)}
    ${p('You have the baseline. Two things operators usually turn on next, in this order.')}
    ${p('One — repricing rules. Set a floor, a ceiling, and a margin target. Meridia moves prices automatically against competitor velocity.')}
    ${p('Two — invite your ops team. They get the same view, scoped to the channels and SKUs you decide.')}
    ${btn(`${BASE_URL}/repricing`, 'Set up repricing')}
    <p style="font-size:14px;line-height:1.6;color:#5a6171;margin:20px 0 0;"><a href="${BASE_URL}/settings" style="color:#1d5fdb;text-decoration:none;">Invite your team →</a></p>
  `)
  const text = `Your first week.

Seven days in. We counted ${orders} order${orders === 1 ? '' : 's'} and £${gmv.toLocaleString('en-GB', { maximumFractionDigits: 0 })} in GMV, with ${top} leading the pack.

You have the baseline. Two things to turn on next:
1. Repricing rules — floor, ceiling, margin target. ${BASE_URL}/repricing
2. Invite your ops team — ${BASE_URL}/settings`
  return { subject, html, text }
}

export function day7DormantEmail(user: LifecycleUser, _ctx: LifecycleContext = {}): RenderedEmail {
  const subject = 'Still figuring it out?'
  const html = shell(`
    <h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:32px;font-weight:400;letter-spacing:-0.02em;line-height:1.1;margin:0 0 20px;">Still figuring it out.</h1>
    ${p('A week in and Meridia has not given you a profit number yet. That is almost always a setup thing we can fix in fifteen minutes on a call.')}
    ${p('We will share a screen, get the first channel syncing, and point at the view that matters. No slides, no qualification — just the product.')}
    ${btn(`${BASE_URL}/contact`, 'Book a 15-minute setup call')}
    <p style="font-size:14px;line-height:1.6;color:#5a6171;margin:20px 0 0;">Prefer email. Reply with the channel you are trying to connect and we will walk you through it in writing.</p>
  `)
  const text = `Still figuring it out.

A week in and Meridia has not given you a profit number yet. That is almost always a setup thing we can fix in fifteen minutes on a call.

Book a 15-minute setup call: ${BASE_URL}/contact

Prefer email. Reply with the channel you are trying to connect.`
  return { subject, html, text }
}

export const LIFECYCLE_TEMPLATES = {
  welcome: welcomeEmail,
  day1_nudge: day1NudgeEmail,
  day3_nudge: day3NudgeEmail,
  day7_active: day7ActiveEmail,
  day7_dormant: day7DormantEmail,
} as const

export type LifecycleTemplate = keyof typeof LIFECYCLE_TEMPLATES
