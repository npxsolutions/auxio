import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// POST /api/changelog/subscribe
// Public changelog email capture from /changelog.
// Persists to public.changelog_subscribers with confirmation_token; caller should
// trigger a double-opt-in email elsewhere (Resend/Loops). Unique on email — existing
// subscribers return ok without error.
// TODO: wire Resend to send confirm-your-subscription email using confirmation_token.
// TODO (slack): deliberately skipped — changelog signups are expected to be high-volume
// and would be too noisy for a channel. Wire notifySlack({ channel: 'changelog' }) here
// if/when we want per-signup pings (see app/lib/slack/notify.ts).

const getSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const str = (k: string) => typeof body[k] === 'string' ? (body[k] as string).trim() : null
    const email = str('email')
    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'A valid email is required.' }, { status: 400 })
    }

    const supabase = await getSupabase()
    const { error } = await supabase.from('changelog_subscribers').insert({
      email,
      source: str('source') ?? 'changelog',
      utm: body.utm ?? null,
    })

    // Postgres unique_violation = 23505 — treat as idempotent success.
    if (error && (error as { code?: string }).code !== '23505') {
      console.error('[api/changelog/subscribe] insert error', error)
      return NextResponse.json({ ok: false, error: 'Could not save subscription.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Subscribed. Watch your inbox on ship days.' })
  } catch (err) {
    console.error('[api/changelog/subscribe] error', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
