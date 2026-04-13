import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { withRateLimit } from '../../../lib/rate-limit/channel'
import { syncFetch } from '../../../lib/sync/http'
import { enqueueJob, markCompleted, markFailed, markStarted, recordDeadLetter } from '../../../lib/sync/jobs'

// Lazy admin client.
const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

const OVERLAP_MINUTES = 5

type BcOrderV2 = {
  id: number
  status?: string
  currency_code?: string
  total_inc_tax?: string | number
  total_tax?: string | number
  refunded_amount?: string | number
  date_created?: string
  date_modified?: string
  billing_address?: { country_iso2?: string }
}

type BcProductV3 = {
  id: number
  name?: string
  description?: string
  sku?: string
  price?: number
  inventory_level?: number
  is_visible?: boolean
  images?: Array<{ url_standard?: string; url_thumbnail?: string }>
  categories?: number[]
}

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdmin()
  const { data: channels, error } = await supabase
    .from('channels')
    .select('user_id, shop_domain, access_token, last_synced_at, metadata')
    .eq('type', 'bigcommerce')
    .eq('active', true)

  if (error) {
    console.error('[sync:bigcommerce] fetch channels:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!channels?.length) return NextResponse.json({ processed: 0 })

  const clientId = process.env.BIGCOMMERCE_CLIENT_ID
  if (!clientId) {
    console.error('[sync:bigcommerce] missing BIGCOMMERCE_CLIENT_ID')
    return NextResponse.json({ error: 'missing_client_id' }, { status: 500 })
  }

  let processed = 0
  const results: Array<{ store: string; orders: number; products: number; error?: string }> = []

  for (const ch of channels) {
    const storeHash =
      (ch.shop_domain as string) ||
      ((ch.metadata as Record<string, unknown> | null)?.store_hash as string | undefined) ||
      ''
    const userId = ch.user_id as string
    const token = ch.access_token as string
    if (!storeHash || !token) continue

    const base = `https://api.bigcommerce.com/stores/${storeHash}`
    const headers = {
      'X-Auth-Token': token,
      'X-Auth-Client': clientId,
      Accept: 'application/json',
    }

    const jobId = await enqueueJob({
      userId,
      jobType: 'bigcommerce.poll',
      channelType: 'bigcommerce',
      payload: { store_hash: storeHash },
    })
    if (jobId) await markStarted(jobId)

    const sinceMs =
      (ch.last_synced_at ? new Date(ch.last_synced_at).getTime() : Date.now() - 24 * 3600_000) -
      OVERLAP_MINUTES * 60_000
    const sinceIso = new Date(Math.max(sinceMs, 0)).toISOString()

    let orderCount = 0
    let productCount = 0
    let failure: string | undefined

    try {
      // --- Orders (v2, paginated) ---
      {
        let page = 1
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const url = `${base}/v2/orders?min_date_modified=${encodeURIComponent(
            sinceIso,
          )}&limit=250&page=${page}`
          const res = await withRateLimit('bigcommerce', storeHash, () =>
            syncFetch(url, { headers, label: `bigcommerce.orders:${storeHash}` }),
          )
          // v2 returns 204 when there are no orders.
          if (res.status === 204) break
          if (!res.ok) break
          const orders = (await res.json()) as BcOrderV2[]
          if (!Array.isArray(orders) || orders.length === 0) break
          for (const o of orders) {
            const gross = Number(o.total_inc_tax ?? 0)
            const refunded = Number(o.refunded_amount ?? 0)
            await supabase.from('transactions').upsert(
              {
                user_id: userId,
                channel: 'bigcommerce',
                external_id: String(o.id),
                shop_domain: storeHash,
                sale_price: gross,
                gross_revenue: gross,
                refunded_amount: refunded,
                currency: o.currency_code ?? null,
                order_state: o.status ?? 'pending',
                order_date: o.date_created || new Date().toISOString(),
                buyer_location: o.billing_address?.country_iso2 ?? null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,external_id,channel' },
            )
            orderCount++
          }
          if (orders.length < 250) break
          page++
        }
      }

      // --- Products (v3, paginated) ---
      {
        let page = 1
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const url = `${base}/v3/catalog/products?date_modified:min=${encodeURIComponent(
            sinceIso,
          )}&limit=250&page=${page}&include=images`
          const res = await withRateLimit('bigcommerce', storeHash, () =>
            syncFetch(url, { headers, label: `bigcommerce.products:${storeHash}` }),
          )
          if (!res.ok) break
          const body = (await res.json()) as {
            data?: BcProductV3[]
            meta?: { pagination?: { total_pages?: number } }
          }
          const products = body.data ?? []
          for (const p of products) {
            const externalId = String(p.id)
            const price = Number(p.price ?? 0)
            const qty = p.inventory_level ?? 0
            const images = (p.images ?? [])
              .map(i => i.url_standard || i.url_thumbnail)
              .filter(Boolean) as string[]
            const status = p.is_visible ? 'published' : 'draft'

            const { data: lc } = await supabase
              .from('listing_channels')
              .select('listing_id')
              .eq('user_id', userId)
              .eq('channel_type', 'bigcommerce')
              .eq('channel_listing_id', externalId)
              .maybeSingle()

            let listingId = lc?.listing_id as string | undefined
            const listingPayload = {
              user_id: userId,
              title: p.name ?? 'Untitled',
              description: p.description ?? '',
              price,
              sku: p.sku ?? null,
              quantity: qty,
              images,
              status,
              updated_at: new Date().toISOString(),
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
                  user_id: userId,
                  channel_type: 'bigcommerce',
                  channel_listing_id: externalId,
                  status,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,channel_type,channel_listing_id' },
              )
              productCount++
            }
          }
          const totalPages = body.meta?.pagination?.total_pages ?? 1
          if (page >= totalPages || products.length === 0) break
          page++
        }
      }

      const now = new Date().toISOString()
      const prevMeta = (ch.metadata ?? {}) as Record<string, unknown>
      await supabase
        .from('channels')
        .update({
          last_synced_at: now,
          metadata: {
            ...prevMeta,
            store_hash: storeHash,
            orders_last_synced_at: now,
            products_last_synced_at: now,
          },
        })
        .eq('user_id', userId)
        .eq('type', 'bigcommerce')

      if (jobId) await markCompleted(jobId, orderCount + productCount)
      processed++
    } catch (err: unknown) {
      failure = (err as Error).message || 'unknown'
      console.error(`[sync:bigcommerce] ${storeHash} failed:`, err)
      if (jobId) await markFailed(jobId, failure)
      await recordDeadLetter({
        userId,
        channelType: 'bigcommerce',
        jobType: 'bigcommerce.poll',
        errorMessage: failure,
        payload: { store_hash: storeHash },
      })
    }

    results.push({ store: storeHash, orders: orderCount, products: productCount, error: failure })
  }

  return NextResponse.json({ processed, results })
}

export { GET as POST }
