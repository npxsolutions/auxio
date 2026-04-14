import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase-server'

const TAG = '[api/feedback/nps]'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const score = Number(body?.score)
    const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 2000) : null

    if (!Number.isInteger(score) || score < 0 || score > 10) {
      return NextResponse.json({ error: 'score must be an integer 0-10' }, { status: 400 })
    }

    const { error } = await supabase
      .from('nps_responses')
      .insert({ user_id: user.id, score, reason })

    if (error) {
      console.error(TAG, 'insert failed', error.message)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error(TAG, 'error', err?.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
