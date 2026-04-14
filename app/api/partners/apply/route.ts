import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { notifySlack } from '../../../lib/slack/notify'

// POST /api/partners/apply
// Public partner-program application from /partners.
// Persists to public.partner_applications (RLS: anon insert allowed, no public read).
// TODO: push to CRM (HubSpot/Attio).

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
    const company = str('company')
    const tier = str('tier') ?? 'registered'
    const estimatedAccounts = typeof body.estimatedAccounts === 'number' ? body.estimatedAccounts : null
    const { data: inserted, error } = await supabase.from('partner_applications').insert({
      email,
      company,
      website: str('website'),
      country: str('country'),
      role: str('role'),
      tier,
      partner_type: str('partnerType'),
      estimated_accounts: estimatedAccounts,
      notes: str('notes'),
      utm: body.utm ?? null,
    }).select('id').single()

    if (error) {
      console.error('[api/partners/apply] insert error', error)
      return NextResponse.json({ ok: false, error: 'Could not save application.' }, { status: 500 })
    }

    // Fire-and-forget Slack notification.
    const adminLink = inserted?.id
      ? `https://auxio-lkqv.vercel.app/admin/partners/${inserted.id}`
      : `mailto:${email}`
    void notifySlack({
      channel: 'partnerships',
      text: `New partner application: ${company ?? email} (${tier})`,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: 'New partner application' } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Email:*\n${email}` },
            { type: 'mrkdwn', text: `*Company:*\n${company ?? '—'}` },
            { type: 'mrkdwn', text: `*Tier:*\n${tier}` },
            { type: 'mrkdwn', text: `*Est. accounts:*\n${estimatedAccounts ?? '—'}` },
          ],
        },
        { type: 'context', elements: [{ type: 'mrkdwn', text: `<${adminLink}|Open in admin>` }] },
      ],
    })

    return NextResponse.json({ ok: true, message: 'Application received. We review weekly.' })
  } catch (err) {
    console.error('[api/partners/apply] error', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
