// ── Apify REST API Client ────────────────────────────────────────────────────
// Docs: https://docs.apify.com/api/v2
// Each platform uses a specific Apify actor optimised for that source.

const APIFY_BASE = 'https://api.apify.com/v2'
const TOKEN = () => process.env.APIFY_API_TOKEN!

// Actor IDs (public actors — no approval needed)
export const ACTORS = {
  tiktok:       'clockworks/free-tiktok-scraper',
  instagram:    'apify/instagram-scraper',
  facebook_ads: 'apify/facebook-ads-scraper',
  youtube:      'bernardo/youtube-scraper',
} as const

export type Platform = keyof typeof ACTORS

// ── Run an actor and wait for results ────────────────────────────────────────
export async function runActor(
  platform: Platform,
  input: Record<string, unknown>,
  timeoutSecs = 120
): Promise<{ runId: string; items: unknown[] }> {
  const actorId = encodeURIComponent(ACTORS[platform])

  // Start the run
  const startRes = await fetch(
    `${APIFY_BASE}/acts/${actorId}/runs?token=${TOKEN()}&timeout=${timeoutSecs}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  )
  if (!startRes.ok) {
    const err = await startRes.text()
    throw new Error(`Apify run start failed for ${platform}: ${err}`)
  }

  const { data: run } = await startRes.json()
  const runId: string = run.id

  // Poll for completion (max timeoutSecs)
  const deadline = Date.now() + timeoutSecs * 1000
  while (Date.now() < deadline) {
    await sleep(4000)
    const statusRes = await fetch(
      `${APIFY_BASE}/actor-runs/${runId}?token=${TOKEN()}`
    )
    const { data: status } = await statusRes.json()
    if (status.status === 'SUCCEEDED') break
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status.status)) {
      throw new Error(`Apify run ${runId} ${status.status}`)
    }
  }

  // Fetch dataset items
  const dataRes = await fetch(
    `${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${TOKEN()}&format=json`
  )
  if (!dataRes.ok) throw new Error(`Failed to fetch Apify results for run ${runId}`)
  const items: unknown[] = await dataRes.json()

  return { runId, items }
}

// ── Platform-specific input builders ─────────────────────────────────────────

export function tiktokInput(keyword: string, maxItems = 50) {
  return {
    hashtags:        [keyword.replace(/^#/, '')],
    searchKeywords:  [keyword],
    maxItems,
    scrapeType:      'hashtag',
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
  }
}

export function instagramInput(keyword: string, maxItems = 50) {
  return {
    hashtags:     [keyword.replace(/^#/, '')],
    resultsType:  'posts',
    resultsLimit: maxItems,
    addParentData: false,
  }
}

export function facebookAdsInput(keyword: string, maxItems = 50) {
  return {
    searchTerm: keyword,
    adType:     'all',
    limit:      maxItems,
    country:    'GB',
  }
}

export function youtubeInput(keyword: string, maxResults = 30) {
  return {
    searchKeywords: keyword,
    maxResults,
    maxResultsShorts: maxResults,
    includeVideoStats: true,
  }
}

// ── Normalise raw platform data → common schema ───────────────────────────────

export interface NormalisedPost {
  id:          string
  platform:    Platform
  caption:     string
  url:         string
  posted_at:   string | null
  duration_sec: number | null
  likes:       number
  shares:      number
  saves:       number
  comments:    number
  views:       number
  raw_data:    unknown
}

export interface NormalisedAd {
  id:              string
  platform:        string
  advertiser:      string
  headline:        string
  body_text:       string
  cta:             string
  spend_min:       number | null
  spend_max:       number | null
  impressions_min: number | null
  impressions_max: number | null
  start_date:      string | null
  status:          string
  raw_data:        unknown
}

export function normaliseTikTok(raw: Record<string, any>): NormalisedPost {
  return {
    id:           String(raw.id || raw.webVideoUrl || Math.random()),
    platform:     'tiktok',
    caption:      raw.text || raw.desc || '',
    url:          raw.webVideoUrl || raw.shareUrl || '',
    posted_at:    raw.createTime ? new Date(raw.createTime * 1000).toISOString() : null,
    duration_sec: raw.video?.duration ?? null,
    likes:        raw.diggCount   ?? raw.stats?.diggCount    ?? 0,
    shares:       raw.shareCount  ?? raw.stats?.shareCount   ?? 0,
    saves:        raw.collectCount ?? raw.stats?.collectCount ?? 0,
    comments:     raw.commentCount ?? raw.stats?.commentCount ?? 0,
    views:        raw.playCount   ?? raw.stats?.playCount    ?? 0,
    raw_data:     raw,
  }
}

export function normaliseInstagram(raw: Record<string, any>): NormalisedPost {
  return {
    id:           String(raw.id || raw.shortCode || Math.random()),
    platform:     'instagram',
    caption:      raw.caption || raw.accessibility_caption || '',
    url:          raw.url || raw.displayUrl || '',
    posted_at:    raw.timestamp || null,
    duration_sec: raw.videoDuration ?? null,
    likes:        raw.likesCount   ?? raw.likes?.count   ?? 0,
    shares:       0,
    saves:        0,
    comments:     raw.commentsCount ?? raw.comments?.count ?? 0,
    views:        raw.videoViewCount ?? raw.videoPlayCount ?? 0,
    raw_data:     raw,
  }
}

export function normaliseFacebookAd(raw: Record<string, any>): NormalisedAd {
  const spend = raw.spend || raw.spendData || {}
  const imp   = raw.impressions || {}
  return {
    id:              String(raw.adArchiveId || raw.id || Math.random()),
    platform:        'facebook_ad',
    advertiser:      raw.bylines?.[0] || raw.pageName || '',
    headline:        raw.snapshot?.title || raw.title || '',
    body_text:       raw.body || raw.snapshot?.body?.markup?.__html || raw.caption || '',
    cta:             raw.snapshot?.cta?.text || '',
    spend_min:       spend.lower_bound ?? null,
    spend_max:       spend.upper_bound ?? null,
    impressions_min: imp.lower_bound ?? null,
    impressions_max: imp.upper_bound ?? null,
    start_date:      raw.startDate || raw.start_date || null,
    status:          raw.isActive ? 'active' : 'inactive',
    raw_data:        raw,
  }
}

export function normaliseYouTube(raw: Record<string, any>): NormalisedPost {
  const stats = raw.statistics || raw.stats || {}
  return {
    id:           String(raw.id || raw.videoId || Math.random()),
    platform:     'youtube',
    caption:      raw.title || raw.description || '',
    url:          raw.url || `https://youtube.com/watch?v=${raw.id}`,
    posted_at:    raw.publishedAt || null,
    duration_sec: raw.duration ?? parseDuration(raw.durationFormatted) ?? null,
    likes:        Number(stats.likeCount    ?? raw.likes    ?? 0),
    shares:       0,
    saves:        0,
    comments:     Number(stats.commentCount ?? raw.comments ?? 0),
    views:        Number(stats.viewCount    ?? raw.views    ?? 0),
    raw_data:     raw,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDuration(s?: string): number | null {
  if (!s) return null
  // PT1H2M3S or 1:02:03 or 2:03
  const isoMatch = s.match(/(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (isoMatch && (isoMatch[1] || isoMatch[2] || isoMatch[3])) {
    return (Number(isoMatch[1] || 0) * 3600) + (Number(isoMatch[2] || 0) * 60) + Number(isoMatch[3] || 0)
  }
  const parts = s.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
