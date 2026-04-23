import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { requireActiveOrg } from '@/app/lib/org/context'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: Request) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { actionId } = await request.json()
    if (!actionId) return NextResponse.json({ error: 'Missing actionId' }, { status: 400 })

    // agent_pending_actions is org-scoped — RLS handles isolation
    const { data: action } = await supabase
      .from('agent_pending_actions')
      .select('*')
      .eq('id', actionId)
      .eq('status', 'pending')
      .single()

    if (!action) return NextResponse.json({ error: 'Action not found' }, { status: 404 })

    // Safety rail check: validate action against user's thresholds
    const { data: userSettings } = await getAdmin()
      .from('users')
      .select('min_margin, max_acos, agent_mode')
      .eq('id', ctx.user.id)
      .single()

    if (userSettings && action.action_type === 'reprice' && action.metadata?.new_margin != null) {
      const minMargin = userSettings.min_margin ?? 15
      if (action.metadata.new_margin < minMargin) {
        return NextResponse.json({
          error: `Safety rail: new margin (${action.metadata.new_margin}%) is below your minimum (${minMargin}%)`,
          blocked: true,
        }, { status: 422 })
      }
    }

    if (userSettings && action.action_type === 'bid_adjustment' && action.metadata?.new_acos != null) {
      const maxAcos = userSettings.max_acos ?? 30
      if (action.metadata.new_acos > maxAcos) {
        return NextResponse.json({
          error: `Safety rail: projected ACOS (${action.metadata.new_acos}%) exceeds your maximum (${maxAcos}%)`,
          blocked: true,
        }, { status: 422 })
      }
    }

    // Mark approved
    await supabase
      .from('agent_pending_actions')
      .update({ status: 'approved', actioned_at: new Date().toISOString() })
      .eq('id', actionId)

    // Log to action log
    await supabase.from('agent_action_log').insert({
      organization_id: ctx.id,
      user_id:         ctx.user.id,
      action_type:     action.action_type,
      title:           action.title,
      description:     action.description,
      profit_impact:   action.profit_impact,
      executed_at:     new Date().toISOString(),
      mode:            'copilot',
    })

    return NextResponse.json({ success: true, action })
  } catch (error: any) {
    console.error('Agent approve error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
