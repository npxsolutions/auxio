import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// POST /api/affiliates/apply
// Public affiliate-program application from /affiliates.
// Persists to public.affiliate_applications (RLS: anon insert allowed, no public read).
// TODO: push to Rewardful / PartnerStack. Create Stripe Connect onboarding link on approval.

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
    const { error } = await supabase.from('affiliate_applications').insert({
      email,
      name: str('name'),
      audience_type: str('audienceType') ?? str('audience'),
      audience_size: typeof body.audienceSize === 'number' ? body.audienceSize : null,
      url: str('url'),
      country: str('country'),
      payout_method: str('payoutMethod') ?? 'stripe',
      notes: str('notes'),
      utm: body.utm ?? null,
    })

    if (error) {
      console.error('[api/affiliates/apply] insert error', error)
      return NextResponse.json({ ok: false, error: 'Could not save application.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Application received. We respond inside 72 hours.' })
  } catch (err) {
    console.error('[api/affiliates/apply] error', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
