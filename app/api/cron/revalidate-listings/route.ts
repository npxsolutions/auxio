// [api/cron/revalidate-listings] — nightly revalidation sweep.
// For each user, picks listings whose health row is older than 24h (or missing)
// and runs the eBay validator framework. Idempotent — same input ⇒ same output.
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { validateForChannel } from '@/app/lib/feed/validator'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null
  if (expected && authHeader !== expected && !request.headers.get('x-vercel-cron')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const admin = getAdmin()
  const cutoff = new Date(Date.now() - 24 * 3600_000).toISOString()

  // Get listings that have an eBay channel mapping
  const { data: candidates, error } = await admin
    .from('listing_channels')
    .select('listing_id, user_id')
    .eq('channel_type', 'ebay')
    .limit(2000)
  if (error) {
    console.error('[feed:validator] cron query failed:', error)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }

  // Fetch existing health rows so we skip those validated < 24h ago
  const ids = (candidates ?? []).map(c => c.listing_id as string)
  const { data: existing } = await admin
    .from('listing_health')
    .select('listing_id, last_validated_at')
    .eq('channel', 'ebay')
    .in('listing_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])

  const recent = new Set(
    (existing ?? [])
      .filter(r => r.last_validated_at && (r.last_validated_at as string) > cutoff)
      .map(r => r.listing_id as string),
  )

  const todo = (candidates ?? []).filter(c => !recent.has(c.listing_id as string))
  let revalidated = 0
  let failures = 0

  // Concurrency cap to avoid hammering Supabase from a single cron run.
  const CONCURRENCY = 5
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY)
    await Promise.all(
      batch.map(async (c) => {
        try {
          await validateForChannel(c.listing_id as string, 'ebay')
          revalidated++
        } catch (err) {
          failures++
          console.error('[feed:validator] revalidate failed:', err)
        }
      }),
    )
  }

  return NextResponse.json({ ok: true, revalidated, failures, candidates: todo.length })
}
