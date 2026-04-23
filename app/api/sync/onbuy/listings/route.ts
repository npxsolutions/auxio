// OnBuy has no webhooks — poll-only.
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getOnBuyAccessToken, onbuyHeaders } from '../../../../lib/onbuy/auth'
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
const MAX_PAGES = 10

interface OnBuyListing {
  listing_id?: string | number
  product_sku?: string
  sku?: string
  name?: string
  title?: string
  status?: string
  price?: number | string
  stock?: number
  quantity?: number
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
    .eq('type', 'onbuy')
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
      jobType: 'onbuy_listings_sync',
      channelType: 'onbuy',
    })
    if (jobId) await markStarted(jobId)

    let listingCount = 0
    let capped = false
    let failure: string | undefined
    const now = new Date().toISOString()

    try {
      const { accessToken, siteId, baseUrl } = await getOnBuyAccessToken(
        {
          user_id: userId,
          access_token: ch.access_token as string | null,
          shop_domain: ch.shop_domain as string | null,
          metadata,
        },
        supabase,
      )

      for (let page = 0; page < MAX_PAGES; page++) {
        const offset = page * PAGE_LIMIT
        const url = `${baseUrl}/listings?site_id=${encodeURIComponent(siteId)}&limit=${PAGE_LIMIT}&offset=${offset}`

        const res = await withRateLimit('onbuy', userId, () =>
          syncFetch(url, {
            headers: onbuyHeaders({ accessToken }),
            label: `onbuy.listings:${userId}`,
          }),
        )
        if (!res.ok) { failure = `HTTP ${res.status}`; break }
        const body = (await res.json()) as { results?: OnBuyListing[]; total?: number }
        const items = body.results ?? []

        for (const item of items) {
          const externalId = String(item.listing_id ?? item.sku ?? '')
          if (!externalId) continue
          const sku = item.product_sku ?? item.sku ?? null
          const title = item.name ?? item.title ?? externalId
          const price = Number(item.price ?? 0)
          const qty = Number(item.stock ?? item.quantity ?? 0)
          const rawStatus = (item.status ?? '').toLowerCase()
          const status = rawStatus === 'live' || rawStatus === 'active' || rawStatus === 'published'
            ? 'published'
            : 'draft'

          let listingId: string | undefined
          const { data: lc } = await supabase
            .from('listing_channels')
            .select('listing_id')
            .eq('organization_id', orgId)
            .eq('channel_type', 'onbuy')
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
                channel_type: 'onbuy',
                channel_listing_id: externalId,
                status,
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
          console.warn(`[onbuy:listings] ${userId} page cap hit (${MAX_PAGES * PAGE_LIMIT})`)
        }
      }

      await supabase
        .from('channels')
        .update({ metadata: { ...metadata, listings_last_synced_at: Math.floor(Date.now() / 1000), onbuy_site_id: siteId } })
        .eq('organization_id', orgId)
        .eq('type', 'onbuy')

      if (jobId) await markCompleted(jobId, listingCount)
      processed++
    } catch (err: unknown) {
      failure = (err as Error).message || 'unknown'
      console.error(`[onbuy:listings] ${userId} failed:`, err)
      if (jobId) await markFailed(jobId, failure)
      await recordDeadLetter({
        userId,
        channelType: 'onbuy',
        jobType: 'onbuy_listings_sync',
        errorMessage: failure,
      })
    }

    results.push({ userId, listings: listingCount, capped, error: failure })
  }

  return NextResponse.json({ processed, results })
}

export { GET as POST }
