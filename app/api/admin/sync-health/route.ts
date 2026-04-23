import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

// Owner-only monitoring endpoint. Owners are identified by ADMIN_OWNER_EMAILS
// (comma-separated) or ADMIN_OWNER_ID.
function isOwner(email: string | null | undefined, id: string | null | undefined): boolean {
  if (id && process.env.ADMIN_OWNER_ID && id === process.env.ADMIN_OWNER_ID) return true
  if (!email) return false
  const list = (process.env.ADMIN_OWNER_EMAILS ?? '').split(',').map(s => s.trim()).filter(Boolean)
  return list.includes(email)
}

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isOwner(user.email, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getAdmin()
  const since24h = new Date(Date.now() - 24 * 3600_000).toISOString()

  const [channelsRes, jobsRes, failuresRes, syncStateRes] = await Promise.all([
    admin.from('channels').select('user_id, organization_id, type, last_synced_at'),
    admin
      .from('sync_jobs')
      .select('user_id, organization_id, channel_type, status, started_at, completed_at, error_message')
      .gte('started_at', since24h),
    admin
      .from('sync_failures')
      .select('user_id, organization_id, channel_type, job_type, attempts, last_failed_at, resolved_at')
      .is('resolved_at', null),
    admin.from('channel_sync_state').select('user_id, organization_id, channel_type, sync_attempts, last_error'),
  ])

  const channels = channelsRes.data ?? []
  const jobs = jobsRes.data ?? []
  const failures = failuresRes.data ?? []
  const syncStates = syncStateRes.data ?? []

  type Stats = {
    last_successful_sync: string | null
    error_rate_24h: number
    rate_limit_hits_24h: number
    queued_jobs: number
    failed_jobs: number
    dead_letter: number
  }

  const buckets: Record<string, Stats & { organization_id: string | null; user_id: string }> = {}
  // Key by org+channel so one user's multiple orgs show as distinct rows.
  const keyFor = (orgId: string | null, ch: string) => `${orgId ?? 'no-org'}::${ch}`

  for (const c of channels) {
    const k = keyFor(c.organization_id as string | null, c.type as string)
    buckets[k] = {
      organization_id: (c.organization_id as string | null) ?? null,
      user_id: c.user_id as string,
      last_successful_sync: (c.last_synced_at as string | null) ?? null,
      error_rate_24h: 0,
      rate_limit_hits_24h: 0,
      queued_jobs: 0,
      failed_jobs: 0,
      dead_letter: 0,
    }
  }

  const jobsByKey: Record<string, { total: number; errors: number }> = {}
  for (const j of jobs) {
    const ch = (j.channel_type as string | null) ?? 'unknown'
    const k = keyFor(j.organization_id as string | null, ch)
    if (!buckets[k]) {
      buckets[k] = {
        organization_id: (j.organization_id as string | null) ?? null,
        user_id: j.user_id as string,
        last_successful_sync: null,
        error_rate_24h: 0,
        rate_limit_hits_24h: 0,
        queued_jobs: 0,
        failed_jobs: 0,
        dead_letter: 0,
      }
    }
    jobsByKey[k] = jobsByKey[k] ?? { total: 0, errors: 0 }
    jobsByKey[k].total++
    if (j.status === 'failed') {
      jobsByKey[k].errors++
      buckets[k].failed_jobs++
    }
    if (j.status === 'queued') buckets[k].queued_jobs++
    if (j.error_message && /rate|429|throttle/i.test(String(j.error_message))) {
      buckets[k].rate_limit_hits_24h++
    }
  }
  for (const [k, { total, errors }] of Object.entries(jobsByKey)) {
    if (buckets[k]) buckets[k].error_rate_24h = total > 0 ? errors / total : 0
  }

  for (const f of failures) {
    const k = keyFor(f.organization_id as string | null, f.channel_type as string)
    if (!buckets[k]) {
      buckets[k] = {
        organization_id: (f.organization_id as string | null) ?? null,
        user_id: f.user_id as string,
        last_successful_sync: null,
        error_rate_24h: 0,
        rate_limit_hits_24h: 0,
        queued_jobs: 0,
        failed_jobs: 0,
        dead_letter: 0,
      }
    }
    buckets[k].dead_letter++
  }

  // Known channel types we actively sync. Used so the dashboard shows a row
  // for each supported channel even if it has no active connections yet.
  const KNOWN_CHANNELS = ['shopify', 'ebay', 'woocommerce', 'bigcommerce', 'etsy', 'walmart', 'onbuy', 'facebook', 'google', 'apify'] as const

  // Social-intel watchlist metrics (caller-scoped, owner-only view is already gated above).
  const { data: watchlist } = await admin
    .from('si_watchlist')
    .select('active, consecutive_failures, last_run_at')

  const watches = watchlist ?? []
  const activeWatches = watches.filter(w => w.active).length
  const failingWatches = watches.filter(w => (w.consecutive_failures ?? 0) > 0).length
  const lastSuccessfulSiRun = watches
    .map(w => w.last_run_at as string | null)
    .filter((x): x is string => !!x)
    .sort()
    .pop() ?? null

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    known_channels: KNOWN_CHANNELS,
    per_channel: Object.fromEntries(
      Object.entries(buckets).map(([k, v]) => {
        const [_orgId, channel] = k.split('::')
        return [k, { channel, ...v }]
      }),
    ),
    social_intel: {
      active_watches: activeWatches,
      failing_watches: failingWatches,
      last_successful_run: lastSuccessfulSiRun,
    },
    total_dead_letter: failures.length,
    total_blocked_sync_states: syncStates.filter(s => (s.sync_attempts ?? 0) >= 5).length,
  })
}
