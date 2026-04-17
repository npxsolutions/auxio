import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { notifySlack } from '../../../lib/slack/notify'

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
    const name = str('name')
    const audienceType = str('audienceType') ?? str('audience')
    const audienceSize = typeof body.audienceSize === 'number' ? body.audienceSize : null
    const url = str('url')
    const { data: inserted, error } = await supabase.from('affiliate_applications').insert({
      email,
      name,
      audience_type: audienceType,
      audience_size: audienceSize,
      url,
      country: str('country'),
      payout_method: str('payoutMethod') ?? 'stripe',
      notes: str('notes'),
      utm: body.utm ?? null,
    }).select('id').single()

    if (error) {
      console.error('[api/affiliates/apply] insert error', error)
      return NextResponse.json({ ok: false, error: 'Could not save application.' }, { status: 500 })
    }

    const adminLink = inserted?.id
      ? `https://palvento-lkqv.vercel.app/admin/affiliates/${inserted.id}`
      : `mailto:${email}`
    void notifySlack({
      channel: 'affiliates',
      text: `New affiliate application: ${name ?? email}`,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: 'New affiliate application' } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Email:*\n${email}` },
            { type: 'mrkdwn', text: `*Name:*\n${name ?? '—'}` },
            { type: 'mrkdwn', text: `*Audience:*\n${audienceType ?? '—'}` },
            { type: 'mrkdwn', text: `*Size:*\n${audienceSize ?? '—'}` },
            { type: 'mrkdwn', text: `*URL:*\n${url ?? '—'}` },
          ],
        },
        { type: 'context', elements: [{ type: 'mrkdwn', text: `<${adminLink}|Open in admin>` }] },
      ],
    })

    return NextResponse.json({ ok: true, message: 'Application received. We respond inside 72 hours.' })
  } catch (err) {
    console.error('[api/affiliates/apply] error', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
