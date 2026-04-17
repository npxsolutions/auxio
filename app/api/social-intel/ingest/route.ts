import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  runActor, tiktokInput, instagramInput, facebookAdsInput, youtubeInput,
  normaliseTikTok, normaliseInstagram, normaliseFacebookAd, normaliseYouTube,
  type Platform, type NormalisedPost, type NormalisedAd,
} from '../../../lib/apify'

// POST /api/social-intel/ingest
// Body: { keyword: string, platforms: string[], maxItems?: number }
// Starts Apify scrapes for each platform, stores raw results, returns jobId.

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  })
}

export async function POST(request: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { keyword, platforms = ['tiktok', 'instagram', 'youtube'], maxItems = 50 } = await request.json()
  if (!keyword?.trim()) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  const kw = keyword.trim()

  // Create job record
  const { data: job, error: jobErr } = await supabase
    .from('si_jobs')
    .insert({ user_id: user.id, keyword: kw, platforms, status: 'running' })
    .select()
    .single()

  if (jobErr || !job) {
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }

  // Run ingestion in background (don't await — return jobId immediately)
  runIngestion(supabase, job.id, user.id, kw, platforms, maxItems).catch(err => {
    console.error('[social-intel/ingest] background error:', err)
    supabase.from('si_jobs').update({ status: 'error', error: err.message }).eq('id', job.id)
  })

  return NextResponse.json({ jobId: job.id, keyword: kw, platforms })
}

async function runIngestion(
  supabase: any,
  jobId: string,
  userId: string,
  keyword: string,
  platforms: string[],
  maxItems: number
) {
  let postsIngested = 0
  let adsIngested   = 0
  const apifyRuns:  Record<string, string> = {}

  for (const platform of platforms) {
    try {
      let items: unknown[]
      let runId: string

      if (platform === 'tiktok') {
        ({ runId, items } = await runActor('tiktok', tiktokInput(keyword, maxItems), 180))
        apifyRuns.tiktok = runId
        const posts = items.map(i => normaliseTikTok(i as any))
        postsIngested += await storePosts(supabase, userId, posts, keyword)

      } else if (platform === 'instagram') {
        ({ runId, items } = await runActor('instagram', instagramInput(keyword, maxItems), 180))
        apifyRuns.instagram = runId
        const posts = items.map(i => normaliseInstagram(i as any))
        postsIngested += await storePosts(supabase, userId, posts, keyword)

      } else if (platform === 'facebook_ads') {
        ({ runId, items } = await runActor('facebook_ads', facebookAdsInput(keyword, maxItems), 180))
        apifyRuns.facebook_ads = runId
        const ads = items.map(i => normaliseFacebookAd(i as any))
        adsIngested += await storeAds(supabase, userId, ads, keyword)

      } else if (platform === 'youtube') {
        ({ runId, items } = await runActor('youtube', youtubeInput(keyword, maxItems), 180))
        apifyRuns.youtube = runId
        const posts = items.map(i => normaliseYouTube(i as any))
        postsIngested += await storePosts(supabase, userId, posts, keyword)
      }
    } catch (err: any) {
      console.error(`[ingest] ${platform} failed:`, err.message)
      // Continue with other platforms
    }
  }

  // Mark job done
  await supabase.from('si_jobs').update({
    status:         'processing',
    apify_runs:     apifyRuns,
    posts_ingested: postsIngested,
    ads_ingested:   adsIngested,
  }).eq('id', jobId)

  // Trigger processing pipeline
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://palvento-lkqv.vercel.app'}/api/social-intel/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cron-secret': process.env.CRON_SECRET! },
      body: JSON.stringify({ jobId, userId, keyword }),
    })
  } catch (err: any) {
    console.error('[ingest] process trigger failed:', err.message)
  }
}

async function storePosts(supabase: any, userId: string, posts: NormalisedPost[], keyword: string): Promise<number> {
  if (!posts.length) return 0

  // Deduplication: only insert IDs not already stored for this user
  const ids = posts.map(p => p.id)
  const { data: existing } = await supabase
    .from('si_posts')
    .select('id')
    .eq('user_id', userId)
    .in('id', ids)

  const existingIds = new Set((existing || []).map((r: any) => r.id))
  const newPosts = posts.filter(p => !existingIds.has(p.id))

  if (!newPosts.length) return 0

  const postRows = newPosts.map(p => ({
    id:           p.id,
    user_id:      userId,
    platform:     p.platform,
    caption:      p.caption?.slice(0, 2000),
    url:          p.url,
    posted_at:    p.posted_at,
    duration_sec: p.duration_sec,
    keyword,
    raw_data:     p.raw_data,
    processed:    false,
  }))

  const engRows = newPosts.map(p => {
    const total  = (p.likes + p.shares + p.saves + p.comments)
    const views  = p.views || 1
    return {
      post_id:         p.id,
      user_id:         userId,
      likes:           p.likes,
      shares:          p.shares,
      saves:           p.saves,
      comments:        p.comments,
      views:           p.views,
      engagement_rate: (total / views) * 100,
      share_rate:      (p.shares  / views) * 100,
      save_rate:       (p.saves   / views) * 100,
      comment_rate:    (p.comments / views) * 100,
    }
  })

  const { error: postErr } = await supabase.from('si_posts').upsert(postRows, { onConflict: 'id' })
  if (postErr) console.error('[storePosts]', postErr.message)

  const { error: engErr } = await supabase.from('si_engagements').upsert(engRows, { onConflict: 'post_id' })
  if (engErr) console.error('[storeEngagements]', engErr.message)

  return newPosts.length
}

async function storeAds(supabase: any, userId: string, ads: NormalisedAd[], keyword: string): Promise<number> {
  if (!ads.length) return 0

  const adRows = ads.map(a => ({
    id:              a.id,
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

  const { error } = await supabase.from('si_ads').upsert(adRows, { onConflict: 'id' })
  if (error) console.error('[storeAds]', error.message)

  return adRows.length
}

// GET /api/social-intel/ingest?jobId=xxx — poll job status
export async function GET(request: Request) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const { data: job } = await supabase
    .from('si_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(job || { error: 'Job not found' })
}
