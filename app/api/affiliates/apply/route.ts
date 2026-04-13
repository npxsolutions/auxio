import { NextResponse } from 'next/server'

// POST /api/affiliates/apply
// Accepts an affiliate-program application from the public /affiliates page.
// TODO: wire to Rewardful or PartnerStack for tracking + Stripe Connect payouts.
//       Persist to Supabase `affiliate_applications` and notify #affiliates Slack.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const audience = typeof body.audience === 'string' ? body.audience.trim() : ''

    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'A valid email is required.' }, { status: 400 })
    }

    console.log('[api/affiliates/apply] application received', {
      email,
      audience,
      channels: body.channels ?? null,
      receivedAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, message: 'Application received. We respond inside 72 hours.' })
  } catch (err) {
    console.error('[api/affiliates/apply] error', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
