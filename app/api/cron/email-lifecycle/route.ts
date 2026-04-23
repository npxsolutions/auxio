/**
 * Day-1/3/7 lifecycle email cron.
 *
 * TODO Stage C.4: once onboarding creates one org per new user (Stage A
 * already backfilled personal orgs), replace per-user channel/txn lookups
 * with per-org queries scoped to the user's personal org. Today service-role
 * bypasses RLS so user_id-based filters still work correctly.
 */
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'
import { sendLifecycleEmail } from '../../../lib/email/send-lifecycle'
import type { LifecycleTemplate } from '../../../lib/email/lifecycle'

export const runtime = 'nodejs'
export const maxDuration = 60

const DAY_MS = 24 * 60 * 60 * 1000

type AuthUser = { id: string; email?: string | null; created_at?: string; user_metadata?: any }

async function loadAllAuthUsers(admin: ReturnType<typeof getSupabaseAdmin>): Promise<AuthUser[]> {
  const out: AuthUser[] = []
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const users = data?.users || []
    out.push(...(users as any))
    if (users.length < 200) break
    page += 1
    if (page > 50) break // safety
  }
  return out
}

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const now = Date.now()

  // Pull recently-created auth users (last 14 days window covers day-1/3/7).
  const users = await loadAllAuthUsers(admin)
  const recent = users.filter(u => {
    if (!u.created_at) return false
    const age = now - new Date(u.created_at).getTime()
    return age >= DAY_MS && age <= 14 * DAY_MS
  })

  if (recent.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0 })
  }

  const userIds = recent.map(u => u.id)

  // Existing sends, so we skip quickly.
  const { data: existingSends } = await admin
    .from('email_sends')
    .select('user_id, template')
    .in('user_id', userIds)
  const sentSet = new Set((existingSends || []).map(r => `${r.user_id}:${r.template}`))

  // Channel connections — used to gate day-1 vs day-3.
  // We treat any row in `channels` as "connected".
  const { data: connections } = await admin
    .from('channels')
    .select('user_id')
    .in('user_id', userIds)
  const connectedSet = new Set((connections || []).map((r: any) => r.user_id))

  // Order activity — last 7 days. Used for day-3 gate + day-7 fork.
  const sevenAgo = new Date(now - 7 * DAY_MS).toISOString()
  const { data: txns } = await admin
    .from('transactions')
    .select('user_id, gross_revenue, channel, order_date')
    .in('user_id', userIds)
    .gte('order_date', sevenAgo)

  const stats: Record<string, { orders: number; gmv: number; channels: Record<string, number> }> = {}
  for (const t of txns || []) {
    const s = stats[t.user_id] || (stats[t.user_id] = { orders: 0, gmv: 0, channels: {} })
    s.orders += 1
    s.gmv += Number(t.gross_revenue || 0)
    const ch = t.channel || 'other'
    s.channels[ch] = (s.channels[ch] || 0) + Number(t.gross_revenue || 0)
  }

  let sent = 0
  const dispatched: { user_id: string; template: LifecycleTemplate }[] = []

  for (const u of recent) {
    if (!u.email) continue
    const ageMs = now - new Date(u.created_at!).getTime()
    const ageDays = ageMs / DAY_MS
    const connected = connectedSet.has(u.id)
    const s = stats[u.id]
    const hasOrders = !!s && s.orders > 0

    const profile = {
      id: u.id,
      email: u.email!,
      firstName: (u.user_metadata as any)?.first_name ?? null,
    }

    let template: LifecycleTemplate | null = null

    if (ageDays >= 7) {
      template = hasOrders ? 'day7_active' : 'day7_dormant'
    } else if (ageDays >= 3 && connected && !hasOrders) {
      template = 'day3_nudge'
    } else if (ageDays >= 1 && !connected) {
      template = 'day1_nudge'
    }

    if (!template) continue
    if (sentSet.has(`${u.id}:${template}`)) continue

    const topChannel = s
      ? Object.entries(s.channels).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
      : null

    const ok = await sendLifecycleEmail(template, profile, {
      orders7d: s?.orders ?? 0,
      gmv7d: s?.gmv ?? 0,
      topChannel,
    })
    if (ok) {
      sent++
      dispatched.push({ user_id: u.id, template })
    }
  }

  return NextResponse.json({
    processed: recent.length,
    sent,
    dispatched,
  })
}

export async function GET(request: Request) {
  return POST(request)
}
