import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  runActor,
  tiktokInput,
  instagramInput,
  facebookAdsInput,
  youtubeInput,
  normaliseTikTok,
  normaliseInstagram,
  normaliseFacebookAd,
  normaliseYouTube,
  type NormalisedAd,
  type NormalisedPost,
} from '../../../lib/apify'
import { reserveChannelCall } from '../../../lib/rate-limit/channel'
import { recordDeadLetter } from '../../../lib/sync/jobs'

// Lazy admin client — module-level instantiation breaks Next build per repo rule.
const getAdmin = (): SupabaseClient =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

const BATCH_CLAIM_LIMIT = 10
const MAX_CONSECUTIVE_FAILURES = 5
const DEFAULT_DAILY_CAP = 20

type WatchRow = {
  id: string
  user_id: string
  organization_id: string
  keyword: string
  platforms: string[]
  max_items: number
  frequency_minutes: number
  consecutive_failures: number
  last_run_at: string | null
}

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdmin()
  const nowIso = new Date().toISOString()

  // Claim candidates: active watches whose next-run window has elapsed.
  // We compute eligibility in SQL via a view-like filter:
  //   last_run_at IS NULL OR last_run_at + frequency_minutes * 1 min < now()
  // supabase-js doesn't express that inline well, so we fetch active rows ordered
  // by last_run_at nulls first and filter in-code.
  const { data: candidates, error: fetchErr } = await admin
    .from('si_watchlist')
    .select('id, user_id, organization_id, keyword, platforms, max_items, frequency_minutes, consecutive_failures, last_run_at')
    .eq('active', true)
    .order('last_run_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true })
    .limit(BATCH_CLAIM_LIMIT * 4)

  if (fetchErr) {
    console.error('[sync:social-intel] fetch watchlist:', fetchErr)
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  const rows: WatchRow[] = []
  for (const c of candidates ?? []) {
    if (rows.length >= BATCH_CLAIM_LIMIT) break
    const lastMs = c.last_run_at ? new Date(c.last_run_at).getTime() : 0
    const dueAt  = lastMs + (c.frequency_minutes as number) * 60_000
    if (!c.last_run_at || dueAt <= Date.now()) {
      rows.push(c as WatchRow)
    }
  }

  const dailyCap = Number(process.env.SI_DAILY_JOB_CAP) || DEFAULT_DAILY_CAP

  let claimed = 0
  let succeeded = 0
  let failed = 0
  let rateLimited = 0
  let capSkipped = 0

  for (const row of rows) {
    claimed++

    // 1) Per-user rate-limit gate (skip this tick, leave last_run_at unchanged).
    const res = await reserveChannelCall('apify', row.user_id)
    if (!res.ok) {
      rateLimited++
      continue
    }

    // 2) Daily per-org cap gate — soft cost control.
    const since24h = new Date(Date.now() - 24 * 3600_000).toISOString()
    const { count: jobCount } = await admin
      .from('si_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', row.organization_id)
      .gte('created_at', since24h)
      .in('status', ['running', 'completed', 'processing', 'done'])

    if ((jobCount ?? 0) >= dailyCap) {
      capSkipped++
      await admin
        .from('si_watchlist')
        .update({ last_error: 'daily cap reached' })
        .eq('id', row.id)
      continue
    }

    // 3) Create si_jobs row for this tick.
    const { data: job, error: jobErr } = await admin
      .from('si_jobs')
      .insert({
        organization_id: row.organization_id,
        user_id: row.user_id,
        keyword: row.keyword,
        platforms: row.platforms,
        status: 'running',
      })
      .select('id')
      .single()

    if (jobErr || !job) {
      failed++
      console.error('[sync:social-intel:createJob]', jobErr)
      await bumpFailure(admin, row, jobErr?.message || 'failed to create si_jobs row')
      continue
    }

    const jobId = job.id as string
    let postsIngested = 0
    let adsIngested = 0
    const apifyRuns: Record<string, string> = {}
    const platformErrors: string[] = []

    for (const platform of row.platforms) {
      try {
        if (platform === 'tiktok') {
          const { runId, items } = await runActor('tiktok', tiktokInput(row.keyword, row.max_items), 180)
          apifyRuns.tiktok = runId
          const posts = items.map(i => normaliseTikTok(i as Record<string, unknown> as Record<string, any>))
          postsIngested += await storePosts(admin, row.organization_id, row.user_id, posts, row.keyword)
        } else if (platform === 'instagram') {
          const { runId, items } = await runActor('instagram', instagramInput(row.keyword, row.max_items), 180)
          apifyRuns.instagram = runId
          const posts = items.map(i => normaliseInstagram(i as Record<string, any>))
          postsIngested += await storePosts(admin, row.organization_id, row.user_id, posts, row.keyword)
        } else if (platform === 'facebook_ads') {
          const { runId, items } = await runActor('facebook_ads', facebookAdsInput(row.keyword, row.max_items), 180)
          apifyRuns.facebook_ads = runId
          const ads = items.map(i => normaliseFacebookAd(i as Record<string, any>))
          adsIngested += await storeAds(admin, row.organization_id, row.user_id, ads, row.keyword)
        } else if (platform === 'youtube') {
          const { runId, items } = await runActor('youtube', youtubeInput(row.keyword, row.max_items), 180)
          apifyRuns.youtube = runId
          const posts = items.map(i => normaliseYouTube(i as Record<string, any>))
          postsIngested += await storePosts(admin, row.organization_id, row.user_id, posts, row.keyword)
        }
      } catch (err: unknown) {
        const msg = (err as Error)?.message || String(err)
        console.error(`[sync:social-intel:runActor:${platform}]`, msg)
        platformErrors.push(`${platform}: ${msg}`)
      }
    }

    const anySuccess = Object.keys(apifyRuns).length > 0
    const allFailed  = platformErrors.length === row.platforms.length

    if (allFailed || !anySuccess) {
      const errMsg = platformErrors.join(' | ') || 'no platforms ran'
      failed++
      await admin
        .from('si_jobs')
        .update({ status: 'error', error: errMsg, completed_at: new Date().toISOString() })
        .eq('id', jobId)
      await bumpFailure(admin, row, errMsg)
      continue
    }

    // Success (at least one platform succeeded). Mark job + reset failure counter.
    await admin
      .from('si_jobs')
      .update({
        status: 'processing',
        apify_runs: apifyRuns,
        posts_ingested: postsIngested,
        ads_ingested: adsIngested,
      })
      .eq('id', jobId)

    await admin
      .from('si_watchlist')
      .update({
        last_run_at: nowIso,
        last_run_job_id: jobId,
        consecutive_failures: 0,
        last_error: platformErrors.length ? platformErrors.join(' | ') : null,
      })
      .eq('id', row.id)

    succeeded++

    // Kick off the processing pipeline for this user's new posts.
    try {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'https://palvento-lkqv.vercel.app'
      await fetch(`${base}/api/social-intel/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': process.env.CRON_SECRET || '',
        },
        body: JSON.stringify({ jobId, userId: row.user_id, orgId: row.organization_id, keyword: row.keyword }),
      }).catch(e => console.error('[sync:social-intel:process-trigger]', e))
    } catch (err: unknown) {
      console.error('[sync:social-intel:process-trigger]', err)
    }
  }

  return NextResponse.json({
    claimed,
    succeeded,
    failed,
    rateLimited,
    capSkipped,
  })
}

export { GET as POST }

async function bumpFailure(admin: SupabaseClient, row: WatchRow, errorMessage: string): Promise<void> {
  const next = (row.consecutive_failures ?? 0) + 1
  const terminal = next >= MAX_CONSECUTIVE_FAILURES
  const patch: Record<string, unknown> = {
    consecutive_failures: next,
    last_error: errorMessage.slice(0, 2000),
  }
  if (terminal) patch.active = false

  const { error } = await admin.from('si_watchlist').update(patch).eq('id', row.id)
  if (error) console.error('[sync:social-intel:bumpFailure]', error)

  if (terminal) {
    await recordDeadLetter({
      userId: row.user_id,
      channelType: 'apify',
      jobType: 'si_watchlist_ingest',
      errorMessage,
      payload: { watchlistId: row.id, keyword: row.keyword, platforms: row.platforms },
    })
  }
}

async function storePosts(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
  posts: NormalisedPost[],
  keyword: string,
): Promise<number> {
  if (!posts.length) return 0

  const ids = posts.map(p => p.id)
  const { data: existing } = await admin
    .from('si_posts')
    .select('id')
    .eq('organization_id', orgId)
    .in('id', ids)
  const existingIds = new Set((existing || []).map((r: { id: string }) => r.id))
  const newPosts = posts.filter(p => !existingIds.has(p.id))
  if (!newPosts.length) return 0

  const postRows = newPosts.map(p => ({
    id:              p.id,
    organization_id: orgId,
    user_id:         userId,
    platform:        p.platform,
    caption:         p.caption?.slice(0, 2000),
    url:             p.url,
    posted_at:       p.posted_at,
    duration_sec:    p.duration_sec,
    keyword,
    raw_data:        p.raw_data,
    processed:       false,
  }))

  const engRows = newPosts.map(p => {
    const total = p.likes + p.shares + p.saves + p.comments
    const views = p.views || 1
    return {
      post_id:         p.id,
      organization_id: orgId,
      user_id:         userId,
      likes:           p.likes,
      shares:          p.shares,
      saves:           p.saves,
      comments:        p.comments,
      views:           p.views,
      engagement_rate: (total / views) * 100,
      share_rate:      (p.shares / views) * 100,
      save_rate:       (p.saves / views) * 100,
      comment_rate:    (p.comments / views) * 100,
    }
  })

  const { error: postErr } = await admin.from('si_posts').upsert(postRows, { onConflict: 'id' })
  if (postErr) console.error('[sync:social-intel:storePosts]', postErr.message)

  const { error: engErr } = await admin.from('si_engagements').upsert(engRows, { onConflict: 'post_id' })
  if (engErr) console.error('[sync:social-intel:storeEngagements]', engErr.message)

  return newPosts.length
}

async function storeAds(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
  ads: NormalisedAd[],
  keyword: string,
): Promise<number> {
  if (!ads.length) return 0

  const adRows = ads.map(a => ({
    id:              a.id,
    organization_id: orgId,
    user_id:         userId,
    platform:        a.platform,
    advertiser:      a.advertiser?.slice(0, 200),
    headline:        a.headline?.slice(0, 500),
    body_text:       a.body_text?.slice(0, 2000),
    cta:             a.cta?.slice(0, 100),
    spend_min:       a.spend_min,
    spend_max:       a.spend_max,
    impressions_min: a.impressions_min,
    impressions_max: a.impressions_max,
    start_date:      a.start_date,
    status:          a.status,
    keyword,
    raw_data:        a.raw_data,
  }))

  const { error } = await admin.from('si_ads').upsert(adRows, { onConflict: 'id' })
  if (error) console.error('[sync:social-intel:storeAds]', error.message)

  return adRows.length
}
