// Facebook Commerce Catalog product sync. Hourly cron.
// Graph API v19.0: GET /{catalog_id}/products?fields=...&limit=100
// Cursor pagination via paging.cursors.after. Cap at 10 pages (1k products/run).
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { facebookHeaders, graphUrl } from '../../../../lib/facebook/auth'
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

const PAGE_LIMIT = 100
const MAX_PAGES = 10

interface FbProduct {
  id: string
  retailer_id?: string
  name?: string
  description?: string
  price?: string
  currency?: string
  availability?: string
  image_url?: string
  updated_time?: string
}

interface FbProductsResponse {
  data?: FbProduct[]
  paging?: { cursors?: { after?: string }; next?: string }
}

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdmin()
  const { data: channels } = await supabase
    .from('channels')
    .select('user_id, organization_id, access_token, metadata')
    .eq('type', 'facebook')
    .eq('active', true)

  if (!channels?.length) return NextResponse.json({ processed: 0 })

  let processed = 0
  const results: Array<{ userId: string; listings: number; capped?: boolean; error?: string }> = []

  for (const ch of channels) {
    const userId = ch.user_id as string
    const orgId  = ch.organization_id as string
    const metadata = (ch.metadata as Record<string, unknown> | null) ?? {}
    const catalogId = metadata.catalog_id as string | undefined
    const accessToken = ch.access_token as string | null

    const jobId = await enqueueJob({
      userId,
      jobType: 'facebook_products_sync',
      channelType: 'facebook',
    })
    if (jobId) await markStarted(jobId)

    let listingCount = 0
    let capped = false
    let failure: string | undefined
    const now = new Date().toISOString()

    try {
      if (!accessToken) throw new Error('missing_access_token')
      if (!catalogId) throw new Error('missing_catalog_id')

      const fields =
        'id,retailer_id,name,description,price,currency,availability,image_url,updated_time'
      let after: string | null = null
      for (let page = 0; page < MAX_PAGES; page++) {
        const qs = new URLSearchParams({ fields, limit: String(PAGE_LIMIT) })
        if (after) qs.set('after', after)
        const url = graphUrl(`${catalogId}/products?${qs.toString()}`)

        const res = await withRateLimit('facebook', String(catalogId), () =>
          syncFetch(url, {
            headers: facebookHeaders({ accessToken }),
            label: `facebook.products:${userId}`,
          }),
        )
        if (!res.ok) {
          failure = `HTTP ${res.status}`
          break
        }
        const body = (await res.json()) as FbProductsResponse
        const items = body.data ?? []

        for (const item of items) {
          const externalId = String(item.id)
          if (!externalId) continue
          const sku = item.retailer_id ?? null
          const title = item.name ?? externalId
          // FB returns price like "19.99 USD" — split if needed.
          let priceNum = 0
          if (item.price) {
            const p = parseFloat(String(item.price).replace(/[^0-9.]/g, ''))
            if (Number.isFinite(p)) priceNum = p
          }
          const status =
            (item.availability ?? '').toLowerCase() === 'in stock' ? 'published' : 'draft'
          const images = item.image_url ? [item.image_url] : []

          let listingId: string | undefined
          const { data: lc } = await supabase
            .from('listing_channels')
            .select('listing_id')
            .eq('organization_id', orgId)
            .eq('channel_type', 'facebook')
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
            description: item.description ?? '',
            sku,
            price: priceNum,
            images,
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
                channel_type: 'facebook',
                channel_listing_id: externalId,
                status,
                updated_at: now,
              },
              { onConflict: 'user_id,channel_type,channel_listing_id' },
            )
            listingCount++
          }
        }

        after = body.paging?.cursors?.after ?? null
        if (!after || !body.paging?.next) break
        if (page === MAX_PAGES - 1) {
          capped = true
          console.warn(
            `[facebook:products] ${userId} page cap hit (${MAX_PAGES * PAGE_LIMIT})`,
          )
        }
      }

      await supabase
        .from('channels')
        .update({
          metadata: { ...metadata, products_last_synced_at: new Date().toISOString() },
        })
        .eq('organization_id', orgId)
        .eq('type', 'facebook')

      if (jobId) await markCompleted(jobId, listingCount)
      processed++
    } catch (err: unknown) {
      failure = (err as Error).message || 'unknown'
      console.error(`[facebook:products] ${userId} failed:`, err)
      if (jobId) await markFailed(jobId, failure)
      await recordDeadLetter({
        userId,
        channelType: 'facebook',
        jobType: 'facebook_products_sync',
        errorMessage: failure,
      })
    }

    results.push({ userId, listings: listingCount, capped, error: failure })
  }

  return NextResponse.json({ processed, results })
}

export { GET as POST }
