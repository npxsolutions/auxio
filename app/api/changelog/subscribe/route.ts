import { NextResponse } from 'next/server'

// POST /api/changelog/subscribe
// Captures email subscriptions for changelog updates.
// TODO: wire to Loops / Resend audiences / Customer.io. Currently logs only.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const email = typeof body.email === 'string' ? body.email.trim() : ''

    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'A valid email is required.' }, { status: 400 })
    }

    console.log('[api/changelog/subscribe] subscriber added', {
      email,
      receivedAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, message: 'Subscribed. Watch your inbox on ship days.' })
  } catch (err) {
    console.error('[api/changelog/subscribe] error', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
