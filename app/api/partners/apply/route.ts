import { NextResponse } from 'next/server'

// POST /api/partners/apply
// Accepts a partner-program application from the public /partners page.
// TODO: wire to CRM (HubSpot/Attio) + Supabase `partner_applications` table.
//       Notify #partnerships Slack channel on receipt.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const company = typeof body.company === 'string' ? body.company.trim() : ''

    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'A valid email is required.' }, { status: 400 })
    }

    console.log('[api/partners/apply] application received', {
      email,
      company,
      tier: body.tier ?? null,
      receivedAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, message: 'Application received. We review weekly.' })
  } catch (err) {
    console.error('[api/partners/apply] error', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
