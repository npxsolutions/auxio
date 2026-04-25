import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  PRIVACY_FLOOR_K,
  deriveCategoryBucket,
} from '../../../lib/feed/category-buckets'

// Daily 06:00 UTC — see vercel.json.
// Computes which pattern_value (e.g. title-length bin, image-count bin)
// correlates with the highest publish_success_rate per
// (channel, category_bucket, pattern_kind). Starts with only two kinds —
// title_length and image_count — so the loop proves itself before we fan out.
//
// TODO Stage A.1: switch anonymity-floor key from user_id to organization_id
// (same rationale as feed-benchmarks).

export const maxDuration = 300

function getAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

interface ChannelRow {
  listing_id: string
  user_id: string
  channel_type: string
  category_id: string | null
  category_name: string | null
  status: string | null
}
interface ListingRow {
  id: string
  title: string | null
  images: unknown
  category: string | null
  image_count: number | null
}

function titleLengthBin(len: number): string {
  if (len <= 0) return 'title_length:0'
  if (len < 40) return 'title_length:0-39'
  if (len < 60) return 'title_length:40-59'
  if (len < 80) return 'title_length:60-79'
  if (len < 100) return 'title_length:80-99'
  if (len < 140) return 'title_length:100-139'
  return 'title_length:140+'
}

function imageCountBin(n: number): string {
  if (n <= 0) return 'image_count:0'
  if (n === 1) return 'image_count:1'
  if (n <= 3) return 'image_count:2-3'
  if (n <= 6) return 'image_count:4-6'
  if (n <= 9) return 'image_count:7-9'
  return 'image_count:10+'
}

function imageCountOf(l: ListingRow): number {
  if (typeof l.image_count === 'number') return l.image_count
  if (Array.isArray(l.images)) return l.images.length
  if (l.images && typeof l.images === 'object') return Object.keys(l.images as object).length
  return 0
}

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const started = Date.now()
  const supabase = getAdmin()

  // Trailing 30 days of channel publish attempts.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  try {
    const { data: channels, error: chErr } = await supabase
      .from('listing_channels')
      .select('listing_id, user_id, channel_type, category_id, category_name, status, updated_at')
      .gte('updated_at', since)
    if (chErr) throw chErr

    const listingIds = Array.from(new Set((channels ?? []).map((c) => (c as ChannelRow).listing_id)))
    if (listingIds.length === 0) {
      console.log(`[cron:feed-patterns] no channel rows in window; ms=${Date.now() - started}`)
      return NextResponse.json({ ok: true, observations: 0, ms: Date.now() - started })
    }

    const { data: listings, error: lErr } = await supabase
      .from('channel_listings')
      .select('id, title, images, category, image_count')
      .in('id', listingIds)
    if (lErr) throw lErr

    const listingById = new Map<string, ListingRow>()
    for (const l of (listings ?? []) as ListingRow[]) listingById.set(l.id, l)

    // key = channel|bucket|pattern_kind|pattern_value
    interface PatternAgg { users: Set<string>; successes: number; total: number }
    const agg = new Map<string, PatternAgg & {
      channel: string
      category_bucket: string
      pattern_kind: 'title_length' | 'image_count'
      pattern_value: string
    }>()

    const ensure = (
      channel: string,
      bucket: string,
      kind: 'title_length' | 'image_count',
      value: string,
    ) => {
      const k = `${channel}|${bucket}|${kind}|${value}`
      let v = agg.get(k)
      if (!v) {
        v = { users: new Set<string>(), successes: 0, total: 0, channel, category_bucket: bucket, pattern_kind: kind, pattern_value: value }
        agg.set(k, v)
      }
      return v
    }

    for (const cRaw of (channels ?? []) as ChannelRow[]) {
      const l = listingById.get(cRaw.listing_id)
      if (!l) continue
      const bucket = deriveCategoryBucket({
        channel: cRaw.channel_type,
        externalCategoryId: cRaw.category_id,
        categoryName: cRaw.category_name ?? l.category ?? null,
      })
      const isSuccess = cRaw.status === 'active' || cRaw.status === 'published' || cRaw.status === 'live'

      const tlen = (l.title ?? '').length
      const tBin = titleLengthBin(tlen)
      const tEntry = ensure(cRaw.channel_type, bucket, 'title_length', tBin)
      tEntry.users.add(cRaw.user_id)
      tEntry.total += 1
      if (isSuccess) tEntry.successes += 1

      const iCount = imageCountOf(l)
      const iBin = imageCountBin(iCount)
      const iEntry = ensure(cRaw.channel_type, bucket, 'image_count', iBin)
      iEntry.users.add(cRaw.user_id)
      iEntry.total += 1
      if (isSuccess) iEntry.successes += 1
    }

    let persisted = 0
    let skipped = 0
    for (const [, v] of agg) {
      if (v.users.size < PRIVACY_FLOOR_K) { skipped += 1; continue }
      const rate = v.total > 0 ? Math.round((v.successes / v.total) * 10_000) / 100 : null
      const { error } = await supabase.from('feed_pattern_observations').insert({
        channel: v.channel,
        category_bucket: v.category_bucket,
        pattern_kind: v.pattern_kind,
        pattern_value: v.pattern_value,
        sample_size: v.users.size,
        outcome_metric: 'publish_success_rate',
        outcome_value: rate,
      })
      if (error) throw error
      persisted += 1
    }

    const ms = Date.now() - started
    console.log(`[cron:feed-patterns] persisted=${persisted} skipped_below_k=${skipped} tuples_total=${agg.size} kinds=title_length,image_count deferred=bullet_count,aspect_completeness,price_position,gtin_presence,brand_presence ms=${ms}`)
    return NextResponse.json({ ok: true, observations: persisted, skipped_below_k: skipped, tuples: agg.size, ms })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[cron:feed-patterns] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return POST(request)
}
