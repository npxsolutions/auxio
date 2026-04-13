import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// POST /api/partners/apply
// Public partner-program application from /partners.
// Persists to public.partner_applications (RLS: anon insert allowed, no public read).
// TODO: push to CRM (HubSpot/Attio). Notify #partnerships Slack.

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
    const { error } = await supabase.from('partner_applications').insert({
      email,
      company: str('company'),
      website: str('website'),
      country: str('country'),
      role: str('role'),
      tier: str('tier') ?? 'registered',
      partner_type: str('partnerType'),
      estimated_accounts: typeof body.estimatedAccounts === 'number' ? body.estimatedAccounts : null,
      notes: str('notes'),
      utm: body.utm ?? null,
    })

    if (error) {
      console.error('[api/partners/apply] insert error', error)
      return NextResponse.json({ ok: false, error: 'Could not save application.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Application received. We review weekly.' })
  } catch (err) {
    console.error('[api/partners/apply] error', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
