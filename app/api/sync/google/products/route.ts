// Google Merchant Center product sync. Hourly cron.
// Content API for Shopping v2.1: GET /{merchantId}/products?maxResults=250&pageToken=
// TODO(google-webhooks): Content API has no push notifications — poll-only.
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  GOOGLE_CONTENT_BASE,
  getGoogleAccessToken,
  googleHeaders,
} from '../../../../lib/google/auth'
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

const PAGE_LIMIT = 250
const MAX_PAGES = 10

interface GoogleProductPrice {
  value?: string
  currency?: string
}
interface GoogleProduct {
  id?: string
  offerId?: string
  title?: string
  description?: string
  price?: GoogleProductPrice
  availability?: string
  imageLink?: string
  brand?: string
  productTypes?: string[]
}
interface GoogleProductsResponse {
  resources?: GoogleProduct[]
  nextPageToken?: string
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
    .eq('type', 'google')
    .eq('active', true)

  if (!channels?.length) return NextResponse.json({ processed: 0 })

  let processed = 0
  const results: Array<{ userId: string; listings: number; capped?: boolean; error?: string }> = []

  for (const ch of channels) {
    const userId = ch.user_id as string
    const orgId  = ch.organization_id as string
    const metadata = (ch.metadata as Record<string, unknown> | null) ?? {}
    const merchantId = metadata.merchant_id as string | undefined

    const jobId = await enqueueJob({
      userId,
      jobType: 'google_products_sync',
      channelType: 'google',
    })
    if (jobId) await markStarted(jobId)

    let listingCount = 0
    let capped = false
    let failure: string | undefined
    const now = new Date().toISOString()

    try {
      if (!merchantId) throw new Error('missing_merchant_id')

      const { accessToken } = await getGoogleAccessToken(
        {
          user_id: userId,
          access_token: ch.access_token as string | null,
          metadata,
        },
        supabase,
      )

      let pageToken: string | null = null
      for (let page = 0; page < MAX_PAGES; page++) {
        const qs = new URLSearchParams({ maxResults: String(PAGE_LIMIT) })
        if (pageToken) qs.set('pageToken', pageToken)
        const url = `${GOOGLE_CONTENT_BASE}/${encodeURIComponent(merchantId)}/products?${qs.toString()}`

        const res = await withRateLimit('google', String(merchantId), () =>
          syncFetch(url, {
            headers: googleHeaders({ accessToken }),
            label: `google.products:${userId}`,
          }),
        )
        if (!res.ok) {
          failure = `HTTP ${res.status}`
          break
        }
        const body = (await res.json()) as GoogleProductsResponse
        const items = body.resources ?? []

        for (const item of items) {
          const externalId = String(item.id ?? item.offerId ?? '')
          if (!externalId) continue
          const sku = item.offerId ?? null
          const title = item.title ?? externalId
          const priceNum = item.price?.value ? parseFloat(item.price.value) : 0
          const status =
            (item.availability ?? '').toLowerCase() === 'in stock' ? 'published' : 'draft'
          const images = item.imageLink ? [item.imageLink] : []

          let listingId: string | undefined
          const { data: lc } = await supabase
            .from('listing_channels')
            .select('listing_id')
            .eq('organization_id', orgId)
            .eq('channel_type', 'google')
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
            price: Number.isFinite(priceNum) ? priceNum : 0,
            brand: item.brand ?? '',
            category: item.productTypes?.[0] ?? '',
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
                channel_type: 'google',
                channel_listing_id: externalId,
                status,
                updated_at: now,
              },
              { onConflict: 'user_id,channel_type,channel_listing_id' },
            )
            listingCount++
          }
        }

        pageToken = body.nextPageToken ?? null
        if (!pageToken) break
        if (page === MAX_PAGES - 1) {
          capped = true
          console.warn(`[google:products] ${userId} page cap hit (${MAX_PAGES * PAGE_LIMIT})`)
        }
      }

      await supabase
        .from('channels')
        .update({
          metadata: { ...metadata, products_last_synced_at: new Date().toISOString() },
        })
        .eq('organization_id', orgId)
        .eq('type', 'google')

      if (jobId) await markCompleted(jobId, listingCount)
      processed++
    } catch (err: unknown) {
      failure = (err as Error).message || 'unknown'
      console.error(`[google:products] ${userId} failed:`, err)
      if (jobId) await markFailed(jobId, failure)
      await recordDeadLetter({
        userId,
        channelType: 'google',
        jobType: 'google_products_sync',
        errorMessage: failure,
      })
    }

    results.push({ userId, listings: listingCount, capped, error: failure })
  }

  return NextResponse.json({ processed, results })
}

export { GET as POST }
