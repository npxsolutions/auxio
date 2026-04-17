// DSAR — Data export (GDPR Art. 15 / 20).
// POST /api/data/export
// Returns a JSON attachment containing everything we hold that is owned by
// the authenticated user. Service-role client is instantiated lazily so build
// never touches secret env.

import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase-server'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Tables owned by the user, keyed by their user-id column name.
// NB: `costs` is not a standalone table in this schema — COGS lives on
// listings + channels. We dump the closest equivalents.
const USER_TABLES: Array<{ table: string; userCol: string }> = [
  { table: 'channels',          userCol: 'user_id' },
  { table: 'listings',          userCol: 'user_id' },
  { table: 'listing_channels',  userCol: 'user_id' },
  { table: 'listing_versions',  userCol: 'user_id' },
  { table: 'transactions',      userCol: 'user_id' },
  { table: 'orders',            userCol: 'user_id' },
  { table: 'repricing_rules',   userCol: 'user_id' },
  { table: 'purchase_orders',   userCol: 'user_id' },
  { table: 'purchase_order_items', userCol: 'user_id' },
  { table: 'bundles',           userCol: 'user_id' },
  { table: 'bundle_items',      userCol: 'user_id' },
  { table: 'suppliers',         userCol: 'user_id' },
  { table: 'inventory',         userCol: 'user_id' },
  { table: 'metrics_daily',     userCol: 'user_id' },
  { table: 'audit_log',         userCol: 'user_id' },
  { table: 'email_sends',       userCol: 'user_id' },
  { table: 'decisions_log',     userCol: 'user_id' },
  { table: 'agent_action_log',  userCol: 'user_id' },
  { table: 'category_mappings', userCol: 'user_id' },
  { table: 'feed_rules',        userCol: 'user_id' },
  { table: 'feed_health',       userCol: 'user_id' },
  { table: 'ai_insights',       userCol: 'user_id' },
  { table: 'import_jobs',       userCol: 'user_id' },
  { table: 'sync_jobs',         userCol: 'user_id' },
  { table: 'sync_failures',     userCol: 'user_id' },
  { table: 'sync_log',          userCol: 'user_id' },
  { table: 'deletion_requests', userCol: 'user_id' },
]

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const userId = user.id

  // Profile row.
  const { data: profile } = await admin.from('users').select('*').eq('id', userId).maybeSingle()

  const dump: Record<string, unknown> = { users: profile ?? null }
  const counts: Record<string, number> = { users: profile ? 1 : 0 }

  for (const { table, userCol } of USER_TABLES) {
    const { data, error } = await admin.from(table).select('*').eq(userCol, userId)
    if (error) {
      // Log but don't fail the whole export — the user still gets a partial dump.
      dump[table] = { _error: error.message }
      counts[table] = 0
      continue
    }
    dump[table] = data ?? []
    counts[table] = (data ?? []).length
  }

  const body = {
    _meta: {
      format: 'fulcra.dsar.v1',
      exported_at: new Date().toISOString(),
      user_id: userId,
      user_email: user.email,
      counts,
      notice:
        'This archive contains all personal and operational data Palvento holds about you under GDPR Art. 15 (right of access) and Art. 20 (right to portability). Questions: security@fulcra.com.',
    },
    ...dump,
  }

  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="fulcra-export-${userId}-${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
