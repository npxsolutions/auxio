// TODO(walmart-webhooks): listing-change events not implemented; poll-only for now.
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getWalmartAccessToken, walmartHeaders } from '../../../../lib/walmart/auth'
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

const PAGE_LIMIT = 200
const MAX_PAGES = 10 // 2k listings/run cap

interface WalmartItem {
  sku?: string
  wpid?: string
  productName?: string
  productType?: string
  price?: { amount?: number; currency?: string }
  publishedStatus?: string
  inventory?: { amount?: number }
}

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdmin()
  const { data: channels } = await supabase
    .from('channels')
    .select('user_id, organization_id, access_token, shop_domain, metadata')
    .eq('type', 'walmart')
    .eq('active', true)

  if (!channels?.length) return NextResponse.json({ processed: 0 })

  let processed = 0
  const results: Array<{ userId: string; listings: number; capped?: boolean; error?: string }> = []

  for (const ch of channels) {
    const userId = ch.user_id as string
    const orgId  = ch.organization_id as string
    const metadata = (ch.metadata as Record<string, unknown> | null) ?? {}

    const jobId = await enqueueJob({
      userId,
      jobType: 'walmart_listings_sync',
      channelType: 'walmart',
    })
    if (jobId) await markStarted(jobId)

    let listingCount = 0
    let capped = false
    let failure: string | undefined
    const now = new Date().toISOString()

    try {
      const { accessToken, baseUrl } = await getWalmartAccessToken(
        {
          user_id: userId,
          access_token: ch.access_token as string | null,
          shop_domain: ch.shop_domain as string | null,
          metadata,
        },
        supabase,
      )

      let nextCursor: string | null = null
      for (let page = 0; page < MAX_PAGES; page++) {
        const url: string = nextCursor
          ? `${baseUrl}/v3/items${nextCursor}`
          : `${baseUrl}/v3/items?limit=${PAGE_LIMIT}`

        const res = await withRateLimit('walmart', userId, () =>
          syncFetch(url, {
            headers: walmartHeaders({ accessToken }),
            label: `walmart.listings:${userId}`,
          }),
        )
        if (!res.ok) { failure = `HTTP ${res.status}`; break }
        const body = (await res.json()) as {
          ItemResponse?: WalmartItem[]
          items?: WalmartItem[]
          nextCursor?: string | null
          totalItems?: number
        }
        const items = body.ItemResponse ?? body.items ?? []

        for (const item of items) {
          const externalId = String(item.wpid ?? item.sku ?? '')
          if (!externalId) continue
          const sku = item.sku ?? null
          const title = item.productName ?? externalId
          const price = Number(item.price?.amount ?? 0)
          const qty = Number(item.inventory?.amount ?? 0)
          const state = (item.publishedStatus ?? '').toLowerCase()
          const status = state === 'published' ? 'published' : 'draft'

          let listingId: string | undefined
          const { data: lc } = await supabase
            .from('listing_channels')
            .select('listing_id')
            .eq('organization_id', orgId)
            .eq('channel_type', 'walmart')
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
            sku,
            price,
            quantity: qty,
            status,
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
                channel_type: 'walmart',
                channel_listing_id: externalId,
                status,
                updated_at: now,
              },
              { onConflict: 'user_id,channel_type,channel_listing_id' },
            )
            listingCount++
          }
        }

        const next = body.nextCursor
        if (!next) break
        nextCursor = next.startsWith('?') ? next : `?${next}`
        if (page === MAX_PAGES - 1) {
          capped = true
          console.warn(`[walmart:listings] ${userId} page cap hit (${MAX_PAGES * PAGE_LIMIT})`)
        }
      }

      await supabase
        .from('channels')
        .update({ metadata: { ...metadata, listings_last_synced_at: new Date().toISOString() } })
        .eq('organization_id', orgId)
        .eq('type', 'walmart')

      if (jobId) await markCompleted(jobId, listingCount)
      processed++
    } catch (err: unknown) {
      failure = (err as Error).message || 'unknown'
      console.error(`[walmart:listings] ${userId} failed:`, err)
      if (jobId) await markFailed(jobId, failure)
      await recordDeadLetter({
        userId,
        channelType: 'walmart',
        jobType: 'walmart_listings_sync',
        errorMessage: failure,
      })
    }

    results.push({ userId, listings: listingCount, capped, error: failure })
  }

  return NextResponse.json({ processed, results })
}

export { GET as POST }
