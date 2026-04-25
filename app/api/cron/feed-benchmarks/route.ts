import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  CATEGORY_BUCKETS,
  PRIVACY_FLOOR_K,
  deriveCategoryBucket,
  gmvBand,
  type CategoryBucket,
} from '../../../lib/feed/category-buckets'

// Weekly 05:00 UTC Monday — see vercel.json.
// Computes anonymised (channel, category_bucket, gmv_band) rollups from
// listing_health + listing_channels + transactions for the trailing 7 days.
// Only tuples with >= PRIVACY_FLOOR_K distinct contributing users are persisted.
//
// TODO Stage A.1: switch the anonymity-floor key from user_id to
// organization_id. Today one user contributes once per bucket regardless of
// how many orgs they belong to, which understates the k-count. Each org is
// the business unit — that's what should be counted.

export const maxDuration = 300

// Lazy SDK instantiation — never at module scope.
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
  brand: string | null
  condition: string | null
  barcode: string | null
  images: unknown
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
  order_date: string
}

function hasImages(v: unknown): boolean {
  if (Array.isArray(v)) return v.length > 0
  if (v && typeof v === 'object') return Object.keys(v as object).length > 0
  return false
}

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
    withImages: 0,
    withGtin: 0,
    withBrand: 0,
    withCondition: 0,
    withCategoryMapped: 0,
    withBusinessPolicies: 0,
  }
}

function pct(num: number, denom: number): number | null {
  if (denom <= 0) return null
  return Math.round((num / denom) * 10_000) / 100
}

function avg(sum: number, count: number): number | null {
  if (count <= 0) return null
  return Math.round((sum / count) * 100) / 100
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

  try {
    // Pull the four source slices. All queries are service-role so RLS is
    // bypassed on purpose — this is the only place we aggregate across
    // tenants and nothing cross-tenant ever leaves this function without
    // the k-anonymity check below.

    const { data: health, error: healthErr } = await supabase
      .from('listing_health')
      .select('user_id, listing_id, channel, health_score, errors_count, warnings_count, last_validated_at')
      .gte('last_validated_at', periodStartIso)
    if (healthErr) throw healthErr

    const listingIds = Array.from(new Set((health ?? []).map((r) => (r as HealthRow).listing_id)))
    if (listingIds.length === 0) {
      console.log(`[cron:feed-benchmarks] no health rows in window; ms=${Date.now() - started}`)
      return NextResponse.json({ ok: true, rollups: 0, ms: Date.now() - started })
    }

    const { data: listings, error: listingsErr } = await supabase
      .from('channel_listings')
      .select('id, user_id, brand, condition, barcode, images, category')
      .in('id', listingIds)
    if (listingsErr) throw listingsErr

    const { data: channels, error: channelsErr } = await supabase
      .from('listing_channels')
      .select('listing_id, user_id, channel_type, category_id, category_name, status')
      .in('listing_id', listingIds)
    if (channelsErr) throw channelsErr

    const userIds = Array.from(new Set((health ?? []).map((r) => (r as HealthRow).user_id)))
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .select('user_id, gross_revenue, order_date')
      .in('user_id', userIds)
      .gte('order_date', periodStartIso)
      .lte('order_date', periodEndIso)
    if (txErr) throw txErr

    // GMV band per user over the period.
    const gmvByUser = new Map<string, number>()
    for (const raw of (tx ?? []) as TxRow[]) {
      const rev = Number(raw.gross_revenue ?? 0)
      gmvByUser.set(raw.user_id, (gmvByUser.get(raw.user_id) ?? 0) + (Number.isFinite(rev) ? rev : 0))
    }

    // Build lookup maps.
    const listingById = new Map<string, ListingRow>()
    for (const l of (listings ?? []) as ListingRow[]) listingById.set(l.id, l)
    // listing_id -> array of channel rows (a listing can be on multiple channels).
    const channelsByListing = new Map<string, ChannelRow[]>()
    for (const c of (channels ?? []) as ChannelRow[]) {
      const arr = channelsByListing.get(c.listing_id) ?? []
      arr.push(c)
      channelsByListing.set(c.listing_id, arr)
    }

    // Aggregate per (channel, category_bucket, gmv_band).
    const buckets = new Map<string, Bucket & { channel: string; category_bucket: CategoryBucket; gmv_band: GmvBand }>()
    const keyOf = (ch: string, cb: string, gb: string) => `${ch}||${cb}||${gb}`

    for (const rRaw of (health ?? []) as HealthRow[]) {
      const listing = listingById.get(rRaw.listing_id)
      if (!listing) continue
      const channelRows = channelsByListing.get(rRaw.listing_id) ?? []
      // Prefer the channel row matching health row's channel; otherwise first.
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
      // Business policies — we use "channel row exists and status != error" as a weak proxy
      // until a dedicated policies table lands. Good enough for week-one signal.
      if (cr && cr.status && cr.status !== 'error') b.withBusinessPolicies += 1
    }

    // Apply k-anonymity floor and persist.
    let persisted = 0
    let skipped = 0
    for (const [, b] of buckets) {
      if (b.users.size < PRIVACY_FLOOR_K) { skipped += 1; continue }
      const row = {
        period_start: periodStartDate,
        period_end: periodEndDate,
        channel: b.channel,
        category_bucket: b.category_bucket,
        gmv_band: b.gmv_band,
        listings_total: b.listings,
        avg_health_score: avg(b.healthSum, b.healthCount),
        avg_errors_per_listing: avg(b.errSum, b.errCount),
        avg_warnings_per_listing: avg(b.warnSum, b.warnCount),
        pct_with_images: pct(b.withImages, b.listings),
        pct_with_gtin: pct(b.withGtin, b.listings),
        pct_with_brand: pct(b.withBrand, b.listings),
        pct_with_condition: pct(b.withCondition, b.listings),
        pct_with_category_mapped: pct(b.withCategoryMapped, b.listings),
        pct_with_business_policies: pct(b.withBusinessPolicies, b.listings),
        sample_size: b.users.size,
      }
      const { error } = await supabase
        .from('feed_health_rollups')
        .upsert(row, { onConflict: 'period_start,period_end,channel,category_bucket,gmv_band' })
      if (error) throw error
      persisted += 1
    }

    const ms = Date.now() - started
    console.log(`[cron:feed-benchmarks] persisted=${persisted} skipped_below_k=${skipped} tuples_total=${buckets.size} buckets_universe=${CATEGORY_BUCKETS.length} ms=${ms}`)
    return NextResponse.json({ ok: true, rollups: persisted, skipped_below_k: skipped, tuples: buckets.size, ms })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[cron:feed-benchmarks] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return POST(request)
}
