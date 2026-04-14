import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase-server'

const TAG = '[api/billing/cancel-survey]'

const VALID_REASONS = [
  'Too expensive',
  'Missing feature',
  'Going with competitor',
  'Not the right time',
  'Other',
]

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const reason = typeof body?.reason === 'string' ? body.reason : ''
    const detail = typeof body?.detail === 'string' ? body.detail.slice(0, 2000) : null
    const saveAccepted = Boolean(body?.save_accepted)

    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'invalid reason' }, { status: 400 })
    }

    let saveOffered: string | null = null
    if (reason === 'Too expensive') saveOffered = 'discount_25_3mo'
    else if (reason === 'Missing feature') saveOffered = 'feature_request'

    const { error } = await supabase.from('cancel_surveys').insert({
      user_id: user.id,
      reason,
      detail,
      save_offered: saveOffered,
      save_accepted: saveAccepted,
    })

    if (error) {
      console.error(TAG, 'insert failed', error.message)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, save_offered: saveOffered })
  } catch (err: any) {
    console.error(TAG, 'error', err?.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
