// [api/enterprise/quote] — accepts the /enterprise quote form; inserts into
// public.enterprise_quotes and fires a Slack notification to #sales.

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'
import { notifySlack } from '../../../lib/slack/notify'

export const runtime = 'nodejs'

type Payload = {
  name?: string
  work_email?: string
  company?: string
  role?: string
  hq_region?: string
  annual_gmv_band?: string
  channels_count?: string
  main_challenge?: string
  preferred_start?: string
  utm?: Record<string, string | undefined>
}

export async function POST(request: Request) {
  let body: Payload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const name  = (body.name || '').trim()
  const email = (body.work_email || '').trim().toLowerCase()
  if (!name)  return NextResponse.json({ error: 'name required' }, { status: 400 })
  if (!email || !/.+@.+\..+/.test(email)) return NextResponse.json({ error: 'valid work email required' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('enterprise_quotes')
    .insert({
      name,
      work_email: email,
      company: body.company || null,
      role: body.role || null,
      hq_region: body.hq_region || null,
      annual_gmv_band: body.annual_gmv_band || null,
      channels_count: body.channels_count || null,
      main_challenge: body.main_challenge || null,
      preferred_start: body.preferred_start || null,
      utm: body.utm || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[api/enterprise/quote:POST] insert failed', error.message)
    return NextResponse.json({ error: 'could not save quote' }, { status: 500 })
  }

  const adminLink = data?.id
    ? `https://palvento-lkqv.vercel.app/admin/enterprise/${data.id}`
    : `mailto:${email}`

  void notifySlack({
    channel: 'sales',
    text: `New enterprise quote: ${body.company || name}`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: 'New enterprise quote' } },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Name:*\n${name}` },
          { type: 'mrkdwn', text: `*Email:*\n${email}` },
          { type: 'mrkdwn', text: `*Company:*\n${body.company || '—'}` },
          { type: 'mrkdwn', text: `*Role:*\n${body.role || '—'}` },
          { type: 'mrkdwn', text: `*HQ region:*\n${body.hq_region || '—'}` },
          { type: 'mrkdwn', text: `*Annual GMV:*\n${body.annual_gmv_band || '—'}` },
          { type: 'mrkdwn', text: `*Channels:*\n${body.channels_count || '—'}` },
          { type: 'mrkdwn', text: `*Preferred start:*\n${body.preferred_start || '—'}` },
        ],
      },
      ...(body.main_challenge ? [{ type: 'section', text: { type: 'mrkdwn', text: `*Main challenge:*\n${body.main_challenge}` } }] : []),
      { type: 'context', elements: [{ type: 'mrkdwn', text: `<${adminLink}|Open in admin>` }] },
    ],
  })

  return NextResponse.json({ ok: true, id: data?.id })
}
