import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../_lib/guard'

// Owner-allowlisted read-only view of feed_health_rollups and
// feed_pattern_observations. Not user-facing — this exists so we can eyeball
// the data before building the user-visible benchmarks layer.

export const dynamic = 'force-dynamic'

function getAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function GET() {
  const guard = await requireAdmin()
  if ('response' in guard) return guard.response

  const supabase = getAdmin()
  const { data: rollups, error: rErr } = await supabase
    .from('feed_health_rollups')
    .select('*')
    .order('computed_at', { ascending: false })
    .limit(500)
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 })

  const { data: patterns, error: pErr } = await supabase
    .from('feed_pattern_observations')
    .select('*')
    .order('computed_at', { ascending: false })
    .limit(500)
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    rollups: rollups ?? [],
    patterns: patterns ?? [],
    count: { rollups: rollups?.length ?? 0, patterns: patterns?.length ?? 0 },
  })
}
