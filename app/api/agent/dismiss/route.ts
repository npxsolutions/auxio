import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { actionId } = await request.json()
    if (!actionId) return NextResponse.json({ error: 'Missing actionId' }, { status: 400 })

    const { data: action } = await supabase
      .from('agent_pending_actions')
      .select('id')
      .eq('id', actionId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single()

    if (!action) return NextResponse.json({ error: 'Action not found' }, { status: 404 })

    await supabase
      .from('agent_pending_actions')
      .update({ status: 'dismissed', actioned_at: new Date().toISOString() })
      .eq('id', actionId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Agent dismiss error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
