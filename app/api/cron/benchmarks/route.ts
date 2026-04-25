/**
 * [cron/benchmarks] — Nightly benchmark aggregation orchestrator.
 *
 * Computes and caches both feed_health_rollups and feed_pattern_observations
 * in a single pass, preventing expensive real-time aggregation on every
 * /api/benchmarks or /api/patterns API call.
 *
 * This endpoint delegates to the existing weekly rollup logic
 * (/api/cron/feed-benchmarks) and daily pattern logic
 * (/api/cron/feed-patterns) but can be called on any schedule.
 *
 * Auth: CRON_SECRET bearer token (same pattern as all other crons).
 *
 * TODO Stage A.1: switch anonymity-floor key from user_id to organization_id
 * (same rationale as feed-benchmarks + feed-patterns).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  PRIVACY_FLOOR_K,
  deriveCategoryBucket,
  gmvBand,
  type CategoryBucket,
} from '@/app/lib/feed/category-buckets'

export const maxDuration = 300

function getAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

type GmvBand = ReturnType<typeof gmvBand>

interface HealthRow {
  user_id: string
  listing_id: string
  channel: string
  health_score: number | null
  errors_count: number | null
  warnings_count: number | null
}

interface ListingRow {
  id: string
  user_id: string
  title: string | null
  brand: string | null
  condition: string | null
  barcode: string | null
  images: unknown
  image_count: number | null
  category: string | null
}

interface ChannelRow {
  listing_id: string
  user_id: string
  channel_type: string
  category_id: string | null
  category_name: string | null
  status: string | null
}

interface TxRow {
  user_id: string
  gross_revenue: number | null
}

function hasImages(v: unknown): boolean {
  if (Array.isArray(v)) return v.length > 0
  if (v && typeof v === 'object') return Object.keys(v as object).length > 0
  return false
}

function imageCountOf(l: ListingRow): number {
  if (typeof l.image_count === 'number') return l.image_count
  if (Array.isArray(l.images)) return l.images.length
  if (l.images && typeof l.images === 'object') return Object.keys(l.images as object).length
  return 0
}

function pctSafe(num: number, denom: number): number | null {
  if (denom <= 0) return null
  return Math.round((num / denom) * 10_000) / 100
}

function avgSafe(sum: number, count: number): number | null {
  if (count <= 0) return null
  return Math.round((sum / count) * 100) / 100
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

// ── Rollup bucket ──
interface Bucket {
  users: Set<string>
  listings: number
  healthSum: number
  healthCount: number
  errSum: number
  errCount: number
  warnSum: number
  warnCount: number
  withImages: number
  withGtin: number
  withBrand: number
  withCondition: number
  withCategoryMapped: number
  withBusinessPolicies: number
}

function emptyBucket(): Bucket {
  return {
    users: new Set<string>(),
    listings: 0,
    healthSum: 0, healthCount: 0,
    errSum: 0, errCount: 0,
    warnSum: 0, warnCount: 0,
    withImages: 0, withGtin: 0, withBrand: 0, withCondition: 0,
    withCategoryMapped: 0, withBusinessPolicies: 0,
  }
}

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  const supabase = getAdmin()
  const periodEnd = new Date()
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000)
  const periodStartIso = periodStart.toISOString()
  const periodEndIso = periodEnd.toISOString()
  const periodStartDate = periodStartIso.slice(0, 10)
  const periodEndDate = periodEndIso.slice(0, 10)
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  try {
    // ── Phase 1: Pull source data ──
    const { data: health, error: healthErr } = await supabase
      .from('listing_health')
      .select('user_id, listing_id, channel, health_score, errors_count, warnings_count, last_validated_at')
      .gte('last_validated_at', periodStartIso)
    if (healthErr) throw healthErr

    const listingIds = Array.from(new Set((health ?? []).map((r) => (r as HealthRow).listing_id)))
    if (listingIds.length === 0) {
      return NextResponse.json({ ok: true, rollups: 0, patterns: 0, ms: Date.now() - started })
    }

    const [listingsRes, channelsRes] = await Promise.all([
      supabase
        .from('channel_listings')
        .select('id, user_id, title, brand, condition, barcode, images, image_count, category')
        .in('id', listingIds),
      supabase
        .from('listing_channels')
        .select('listing_id, user_id, channel_type, category_id, category_name, status')
        .in('listing_id', listingIds),
    ])
    if (listingsRes.error) throw listingsRes.error
    if (channelsRes.error) throw channelsRes.error

    const userIds = Array.from(new Set((health ?? []).map((r) => (r as HealthRow).user_id)))
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .select('user_id, gross_revenue')
      .in('user_id', userIds)
      .gte('order_date', periodStartIso)
      .lte('order_date', periodEndIso)
    if (txErr) throw txErr

    // GMV per user
    const gmvByUser = new Map<string, number>()
    for (const raw of (tx ?? []) as TxRow[]) {
      const rev = Number(raw.gross_revenue ?? 0)
      gmvByUser.set(raw.user_id, (gmvByUser.get(raw.user_id) ?? 0) + (Number.isFinite(rev) ? rev : 0))
    }

    // Lookup maps
    const listingById = new Map<string, ListingRow>()
    for (const l of (listingsRes.data ?? []) as ListingRow[]) listingById.set(l.id, l)
    const channelsByListing = new Map<string, ChannelRow[]>()
    for (const c of (channelsRes.data ?? []) as ChannelRow[]) {
      const arr = channelsByListing.get(c.listing_id) ?? []
      arr.push(c)
      channelsByListing.set(c.listing_id, arr)
    }

    // ── Phase 2: Rollup aggregation ──
    const buckets = new Map<string, Bucket & { channel: string; category_bucket: CategoryBucket; gmv_band: GmvBand }>()
    const keyOf = (ch: string, cb: string, gb: string) => `${ch}||${cb}||${gb}`

    for (const rRaw of (health ?? []) as HealthRow[]) {
      const listing = listingById.get(rRaw.listing_id)
      if (!listing) continue
      const channelRows = channelsByListing.get(rRaw.listing_id) ?? []
      const cr = channelRows.find((c) => c.channel_type === rRaw.channel) ?? channelRows[0]

      const bucket = deriveCategoryBucket({
        channel: rRaw.channel,
        externalCategoryId: cr?.category_id ?? null,
        categoryName: cr?.category_name ?? listing.category ?? null,
      })
      const band = gmvBand(gmvByUser.get(rRaw.user_id) ?? 0)
      const key = keyOf(rRaw.channel, bucket, band)

      let b = buckets.get(key)
      if (!b) {
        b = { ...emptyBucket(), channel: rRaw.channel, category_bucket: bucket, gmv_band: band }
        buckets.set(key, b)
      }
      b.users.add(rRaw.user_id)
      b.listings += 1
      if (rRaw.health_score != null) { b.healthSum += rRaw.health_score; b.healthCount += 1 }
      if (rRaw.errors_count != null) { b.errSum += rRaw.errors_count; b.errCount += 1 }
      if (rRaw.warnings_count != null) { b.warnSum += rRaw.warnings_count; b.warnCount += 1 }
      if (hasImages(listing.images)) b.withImages += 1
      if (listing.barcode && listing.barcode.trim()) b.withGtin += 1
      if (listing.brand && listing.brand.trim()) b.withBrand += 1
      if (listing.condition && listing.condition.trim()) b.withCondition += 1
      if (cr?.category_id) b.withCategoryMapped += 1
      if (cr && cr.status && cr.status !== 'error') b.withBusinessPolicies += 1
    }

    let rollupsWritten = 0
    let rollupsSkipped = 0
    for (const [, b] of buckets) {
      if (b.users.size < PRIVACY_FLOOR_K) { rollupsSkipped += 1; continue }
      const { error } = await supabase.from('feed_health_rollups').upsert({
        period_start: periodStartDate,
        period_end: periodEndDate,
        channel: b.channel,
        category_bucket: b.category_bucket,
        gmv_band: b.gmv_band,
        listings_total: b.listings,
        avg_health_score: avgSafe(b.healthSum, b.healthCount),
        avg_errors_per_listing: avgSafe(b.errSum, b.errCount),
        avg_warnings_per_listing: avgSafe(b.warnSum, b.warnCount),
        pct_with_images: pctSafe(b.withImages, b.listings),
        pct_with_gtin: pctSafe(b.withGtin, b.listings),
        pct_with_brand: pctSafe(b.withBrand, b.listings),
        pct_with_condition: pctSafe(b.withCondition, b.listings),
        pct_with_category_mapped: pctSafe(b.withCategoryMapped, b.listings),
        pct_with_business_policies: pctSafe(b.withBusinessPolicies, b.listings),
        sample_size: b.users.size,
      }, { onConflict: 'period_start,period_end,channel,category_bucket,gmv_band' })
      if (error) throw error
      rollupsWritten += 1
    }

    // ── Phase 3: Pattern observations ──
    // Use 30-day window for channel publish data.
    const { data: patternChannels, error: pcErr } = await supabase
      .from('listing_channels')
      .select('listing_id, user_id, channel_type, category_id, category_name, status, updated_at')
      .gte('updated_at', since30d)
    if (pcErr) throw pcErr

    const patListingIds = Array.from(new Set((patternChannels ?? []).map((c) => (c as ChannelRow).listing_id)))
    let patternsWritten = 0
    let patternsSkipped = 0

    if (patListingIds.length > 0) {
      const { data: patListings, error: plErr } = await supabase
        .from('channel_listings')
        .select('id, title, images, category, image_count')
        .in('id', patListingIds)
      if (plErr) throw plErr

      const patListingById = new Map<string, ListingRow>()
      for (const l of (patListings ?? []) as ListingRow[]) patListingById.set(l.id, l)

      interface PatternAgg { users: Set<string>; successes: number; total: number }
      const patAgg = new Map<string, PatternAgg & {
        channel: string; category_bucket: string
        pattern_kind: 'title_length' | 'image_count'; pattern_value: string
      }>()

      const ensure = (channel: string, bucket: string, kind: 'title_length' | 'image_count', value: string) => {
        const k = `${channel}|${bucket}|${kind}|${value}`
        let v = patAgg.get(k)
        if (!v) {
          v = { users: new Set(), successes: 0, total: 0, channel, category_bucket: bucket, pattern_kind: kind, pattern_value: value }
          patAgg.set(k, v)
        }
        return v
      }

      for (const cRaw of (patternChannels ?? []) as ChannelRow[]) {
        const l = patListingById.get(cRaw.listing_id)
        if (!l) continue
        const bucket = deriveCategoryBucket({
          channel: cRaw.channel_type,
          externalCategoryId: cRaw.category_id,
          categoryName: cRaw.category_name ?? l.category ?? null,
        })
        const isSuccess = cRaw.status === 'active' || cRaw.status === 'published' || cRaw.status === 'live'

        const tEntry = ensure(cRaw.channel_type, bucket, 'title_length', titleLengthBin((l.title ?? '').length))
        tEntry.users.add(cRaw.user_id)
        tEntry.total += 1
        if (isSuccess) tEntry.successes += 1

        const iEntry = ensure(cRaw.channel_type, bucket, 'image_count', imageCountBin(imageCountOf(l)))
        iEntry.users.add(cRaw.user_id)
        iEntry.total += 1
        if (isSuccess) iEntry.successes += 1
      }

      for (const [, v] of patAgg) {
        if (v.users.size < PRIVACY_FLOOR_K) { patternsSkipped += 1; continue }
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
        patternsWritten += 1
      }
    }

    const ms = Date.now() - started
    console.log(`[cron/benchmarks] rollups=${rollupsWritten} patterns=${patternsWritten} skipped_rollups=${rollupsSkipped} skipped_patterns=${patternsSkipped} ms=${ms}`)
    return NextResponse.json({
      ok: true,
      rollups: rollupsWritten,
      patterns: patternsWritten,
      skippedRollups: rollupsSkipped,
      skippedPatterns: patternsSkipped,
      ms,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[cron/benchmarks] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return POST(request)
}
