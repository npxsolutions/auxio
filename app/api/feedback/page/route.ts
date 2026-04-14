import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase-server'

const TAG = '[api/feedback/page]'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const route = typeof body?.route === 'string' ? body.route.slice(0, 200) : ''
    const sentiment = body?.sentiment
    const comment = typeof body?.comment === 'string' ? body.comment.slice(0, 2000) : null

    if (!route) return NextResponse.json({ error: 'route required' }, { status: 400 })
    if (sentiment !== 'up' && sentiment !== 'down') {
      return NextResponse.json({ error: 'sentiment must be up or down' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('page_feedback')
      .insert({ user_id: user?.id ?? null, route, sentiment, comment })

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
