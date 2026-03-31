/**
 * Autopilot execution endpoint — called by the Railway nightly worker.
 * Automatically approves and logs pending actions for users in autopilot mode,
 * while enforcing their safety rail thresholds.
 *
 * Protected by CRON_SECRET header (same secret used by vercel.json crons).
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const MAX_REPRICE_CHANGE_PCT = 20  // never move price more than 20% in one action
const MAX_BID_CHANGE_PCT     = 30  // never adjust bid more than 30% in one action

export async function POST(request: Request) {
  // Verify caller is our cron worker
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let executed = 0
  let blocked  = 0
  const errors: string[] = []

  try {
    // Find all users in autopilot mode
    const { data: autopilotUsers } = await getAdmin()
      .from('users')
      .select('id, min_margin, max_acos, safety_stock_days')
      .eq('agent_mode', 'autopilot')

    if (!autopilotUsers?.length) {
      return NextResponse.json({ executed: 0, blocked: 0, message: 'No autopilot users' })
    }

    for (const user of autopilotUsers) {
      const { data: pendingActions } = await getAdmin()
        .from('agent_pending_actions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('profit_impact', { ascending: false })

      for (const action of pendingActions || []) {
        const violation = checkSafetyRails(action, user)
        if (violation) {
          // Block and log the violation
          await getAdmin()
            .from('agent_pending_actions')
            .update({ status: 'blocked', actioned_at: new Date().toISOString(), block_reason: violation })
            .eq('id', action.id)
          blocked++
          continue
        }

        // Execute: mark approved and log
        await getAdmin()
          .from('agent_pending_actions')
          .update({ status: 'approved', actioned_at: new Date().toISOString() })
          .eq('id', action.id)

        await getAdmin().from('agent_action_log').insert({
          user_id:       user.id,
          action_type:   action.action_type,
          title:         action.title,
          description:   action.description,
          profit_impact: action.profit_impact,
          executed_at:   new Date().toISOString(),
          mode:          'autopilot',
        })

        executed++
      }
    }

    return NextResponse.json({ executed, blocked, errors })
  } catch (error: any) {
    console.error('Autopilot execution error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function checkSafetyRails(
  action: any,
  user: { min_margin: number | null; max_acos: number | null }
): string | null {
  const minMargin = user.min_margin ?? 15
  const maxAcos   = user.max_acos ?? 30

  if (action.action_type === 'reprice') {
    if (action.metadata?.new_margin != null && action.metadata.new_margin < minMargin) {
      return `Margin ${action.metadata.new_margin}% below minimum ${minMargin}%`
    }
    if (action.metadata?.price_change_pct != null && Math.abs(action.metadata.price_change_pct) > MAX_REPRICE_CHANGE_PCT) {
      return `Price change ${action.metadata.price_change_pct}% exceeds max ${MAX_REPRICE_CHANGE_PCT}%`
    }
  }

  if (action.action_type === 'bid_adjustment') {
    if (action.metadata?.new_acos != null && action.metadata.new_acos > maxAcos) {
      return `Projected ACOS ${action.metadata.new_acos}% exceeds maximum ${maxAcos}%`
    }
    if (action.metadata?.bid_change_pct != null && Math.abs(action.metadata.bid_change_pct) > MAX_BID_CHANGE_PCT) {
      return `Bid change ${action.metadata.bid_change_pct}% exceeds max ${MAX_BID_CHANGE_PCT}%`
    }
  }

  return null
}
