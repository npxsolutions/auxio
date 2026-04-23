// TODO(etsy-webhooks): implement when Event Notifications HMAC scheme is verified
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { etsyHeaders, getEtsyAccessToken } from '../../../../lib/etsy/auth'
import { withRateLimit } from '../../../../lib/rate-limit/channel'
import { syncFetch } from '../../../../lib/sync/http'
import {
  enqueueJob,
  markCompleted,
  markFailed,
  markStarted,
  recordDeadLetter,
} from '../../../../lib/sync/jobs'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

const ETSY_BASE = 'https://openapi.etsy.com/v3/application'
const PAGE_LIMIT = 100
const MAX_PAGES = 10 // cap at 1000 listings / run; log if capped

interface EtsyListing {
  listing_id?: number | string
  title?: string
  description?: string
  state?: string
  quantity?: number
  sku?: string[]
  price?: { amount?: number; divisor?: number; currency_code?: string }
  images?: Array<{ url_fullxfull?: string }>
}

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdmin()
  const { data: channels } = await supabase
    .from('channels')
    .select('user_id, organization_id, access_token, refresh_token, shop_domain, metadata')
    .eq('type', 'etsy')
    .eq('active', true)

  if (!channels?.length) return NextResponse.json({ processed: 0 })

  let processed = 0
  const results: Array<{ shopId: string | null; listings: number; capped?: boolean; error?: string }> = []

  for (const ch of channels) {
    const userId = ch.user_id as string
    const orgId  = ch.organization_id as string
    const metadata = (ch.metadata as Record<string, unknown> | null) ?? {}
    const shopId = (metadata.etsy_shop_id as string | undefined) ?? (ch.shop_domain as string | null)
    const etsyUserId = (metadata.etsy_user_id as string | undefined) ?? null

    if (!shopId || !etsyUserId) {
      results.push({ shopId: shopId ?? null, listings: 0, error: 'missing shop_id / etsy_user_id' })
      continue
    }

    const tokenResult = await getEtsyAccessToken(
      {
        user_id: userId,
        access_token: ch.access_token as string | null,
        refresh_token: (ch.refresh_token as string | null) ?? null,
        metadata,
      },
      supabase,
    )
    if (!tokenResult) {
      console.warn(`[sync:etsy:listings] skip shop=${shopId} — token refresh failed`)
      results.push({ shopId: String(shopId), listings: 0, error: 'token_refresh_failed' })
      continue
    }
    const token = tokenResult.accessToken

    const jobId = await enqueueJob({
      userId,
      jobType: 'etsy_listings_sync',
      channelType: 'etsy',
      payload: { shop_id: shopId },
    })
    if (jobId) await markStarted(jobId)

    let listingCount = 0
    let capped = false
    let failure: string | undefined
    const now = new Date().toISOString()

    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        const offset = page * PAGE_LIMIT
        // Etsy v3 doesn't support min_last_modified on /listings/active — paginate fully.
        const url = `${ETSY_BASE}/shops/${shopId}/listings/active?limit=${PAGE_LIMIT}&offset=${offset}`

        const res = await withRateLimit('etsy', String(shopId), () =>
          syncFetch(url, {
            headers: etsyHeaders({ userId: etsyUserId, accessToken: token }),
            label: `etsy.listings:${shopId}`,
          }),
        )
        if (!res.ok) {
          failure = `HTTP ${res.status}`
          break
        }
        const body = (await res.json()) as { count?: number; results?: EtsyListing[] }
        const items = body.results ?? []

        for (const item of items) {
          const externalId = String(item.listing_id ?? '')
          if (!externalId) continue
          const sku = Array.isArray(item.sku) && item.sku.length > 0 ? item.sku[0] : null
          const divisor = Number(item.price?.divisor ?? 100)
          const price = Number(item.price?.amount ?? 0) / (divisor > 0 ? divisor : 100)
          const title = item.title ?? externalId
          const desc  = item.description ?? ''
          const qty   = Number(item.quantity ?? 0)
          const images = (item.images ?? []).map(i => i.url_fullxfull).filter(Boolean) as string[]

          // Locate existing listing via listing_channels (channel_listing_id) first,
          // then SKU fallback.
          let listingId: string | undefined
          const { data: lc } = await supabase
            .from('listing_channels')
            .select('listing_id')
            .eq('organization_id', orgId)
            .eq('channel_type', 'etsy')
            .eq('channel_listing_id', externalId)
            .maybeSingle()
          listingId = lc?.listing_id as string | undefined

          if (!listingId && sku) {
            const { data: bySku } = await supabase
              .from('listings')
              .select('id')
              .eq('organization_id', orgId)
              .eq('sku', sku)
              .maybeSingle()
            listingId = bySku?.id as string | undefined
          }

          const listingPayload = {
            organization_id: orgId,
            user_id: userId,
            title,
            description: desc,
            sku,
            price,
            quantity: qty,
            images,
            status: item.state === 'active' ? 'published' : 'draft',
            updated_at: now,
          }

          if (listingId) {
            await supabase.from('listings').update(listingPayload).eq('id', listingId)
          } else {
            const { data: created } = await supabase
              .from('listings')
              .insert(listingPayload)
              .select('id')
              .single()
            listingId = created?.id as string | undefined
          }

          if (listingId) {
            await supabase.from('listing_channels').upsert(
              {
                listing_id: listingId,
                organization_id: orgId,
                user_id: userId,
                channel_type: 'etsy',
                channel_listing_id: externalId,
                status: item.state === 'active' ? 'published' : 'draft',
                updated_at: now,
              },
              { onConflict: 'user_id,channel_type,channel_listing_id' },
            )
            listingCount++
          }
        }

        if (items.length < PAGE_LIMIT) break
        if (page === MAX_PAGES - 1 && items.length === PAGE_LIMIT) {
          capped = true
          console.warn(`[etsy:listings] ${shopId} page cap hit (${MAX_PAGES * PAGE_LIMIT})`)
        }
      }

      await supabase
        .from('channels')
        .update({ metadata: { ...metadata, listings_last_synced_at: Math.floor(Date.now() / 1000) } })
        .eq('organization_id', orgId)
        .eq('type', 'etsy')

      if (jobId) await markCompleted(jobId, listingCount)
      processed++
    } catch (err: unknown) {
      failure = (err as Error).message || 'unknown'
      console.error(`[etsy:listings] ${shopId} failed:`, err)
      if (jobId) await markFailed(jobId, failure)
      await recordDeadLetter({
        userId,
        channelType: 'etsy',
        jobType: 'etsy_listings_sync',
        errorMessage: failure,
        payload: { shop_id: shopId },
      })
    }

    results.push({ shopId: String(shopId), listings: listingCount, capped, error: failure })
  }

  return NextResponse.json({ processed, results })
}

export { GET as POST }
