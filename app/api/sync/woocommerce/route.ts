import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { withRateLimit } from '../../../lib/rate-limit/channel'
import { syncFetch } from '../../../lib/sync/http'
import { enqueueJob, markCompleted, markFailed, markStarted, recordDeadLetter } from '../../../lib/sync/jobs'

// Lazy admin client — per repo rule, never instantiate at module top level.
const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

const OVERLAP_MINUTES = 5

type WooOrder = {
  id: number
  status?: string
  currency?: string
  total?: string
  total_tax?: string
  date_created_gmt?: string
  date_modified_gmt?: string
  date_paid_gmt?: string | null
  billing?: { country?: string }
  line_items?: Array<{ sku?: string; name?: string; price?: string; quantity?: number }>
}

type WooProduct = {
  id: number
  name?: string
  description?: string
  status?: string
  sku?: string
  price?: string
  regular_price?: string
  stock_quantity?: number | null
  images?: Array<{ src?: string }>
  categories?: Array<{ name?: string }>
}

function basicAuthHeader(accessToken: string): string {
  // access_token is stored as base64("<consumer_key>:<consumer_secret>")
  return `Basic ${accessToken}`
}

function hostOf(siteUrl: string): string {
  try {
    return new URL(siteUrl).host
  } catch {
    return siteUrl
  }
}

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdmin()
  const { data: channels, error } = await supabase
    .from('channels')
    .select('user_id, organization_id, shop_domain, access_token, last_synced_at, metadata')
    .eq('type', 'woocommerce')
    .eq('active', true)

  if (error) {
    console.error('[sync:woocommerce] fetch channels:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!channels?.length) return NextResponse.json({ processed: 0 })

  let processed = 0
  const results: Array<{ site: string; orders: number; products: number; error?: string }> = []

  for (const ch of channels) {
    const siteUrl = ch.shop_domain as string
    const userId = ch.user_id as string
    const orgId  = ch.organization_id as string
    const token = ch.access_token as string
    if (!siteUrl || !token) continue
    const siteHost = hostOf(siteUrl)

    const jobId = await enqueueJob({
      userId,
      jobType: 'woocommerce.poll',
      channelType: 'woocommerce',
      payload: { site: siteUrl },
    })
    if (jobId) await markStarted(jobId)

    const sinceMs =
      (ch.last_synced_at ? new Date(ch.last_synced_at).getTime() : Date.now() - 24 * 3600_000) -
      OVERLAP_MINUTES * 60_000
    const since = new Date(Math.max(sinceMs, 0)).toISOString()

    let orderCount = 0
    let productCount = 0
    let failure: string | undefined

    try {
      // --- Orders (paginated via X-WP-TotalPages) ---
      {
        let page = 1
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const url = `${siteUrl}/wp-json/wc/v3/orders?modified_after=${encodeURIComponent(
            since,
          )}&per_page=100&page=${page}&orderby=modified&order=asc`
          const res = await withRateLimit('woocommerce', siteHost, () =>
            syncFetch(url, {
              headers: { Authorization: basicAuthHeader(token), Accept: 'application/json' },
              label: `woocommerce.orders:${siteHost}`,
            }),
          )
          if (!res.ok) break
          const totalPages = Number(res.headers.get('x-wp-totalpages') || '1')
          const orders = (await res.json()) as WooOrder[]
          for (const o of orders) {
            const gross = Number(o.total ?? 0)
            const tax = Number(o.total_tax ?? 0)
            const firstItem = o.line_items?.[0]
            await supabase.from('transactions').upsert(
              {
                organization_id: orgId,
                user_id: userId,
                channel: 'woocommerce',
                external_id: String(o.id),
                shop_domain: siteUrl,
                sku: firstItem?.sku ?? null,
                title: firstItem?.name ?? null,
                sale_price: gross,
                gross_revenue: gross,
                currency: o.currency ?? null,
                order_state: o.status ?? 'pending',
                order_date:
                  o.date_paid_gmt || o.date_created_gmt || new Date().toISOString(),
                buyer_location: o.billing?.country ?? null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,external_id,channel' },
            )
            // Tax note: schema has no dedicated tax column on transactions; tax captured in channel_fee=0 left alone.
            void tax
            orderCount++
          }
          if (page >= totalPages || orders.length === 0) break
          page++
        }
      }

      // --- Products (paginated) ---
      {
        let page = 1
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const url = `${siteUrl}/wp-json/wc/v3/products?modified_after=${encodeURIComponent(
            since,
          )}&per_page=100&page=${page}&orderby=modified&order=asc`
          const res = await withRateLimit('woocommerce', siteHost, () =>
            syncFetch(url, {
              headers: { Authorization: basicAuthHeader(token), Accept: 'application/json' },
              label: `woocommerce.products:${siteHost}`,
            }),
          )
          if (!res.ok) break
          const totalPages = Number(res.headers.get('x-wp-totalpages') || '1')
          const products = (await res.json()) as WooProduct[]
          for (const p of products) {
            const externalId = String(p.id)
            const price = Number(p.price ?? p.regular_price ?? 0)
            const qty = p.stock_quantity ?? 0
            const images = (p.images ?? []).map(i => i.src).filter(Boolean) as string[]
            const status = p.status === 'publish' ? 'published' : 'draft'

            const { data: lc } = await supabase
              .from('listing_channels')
              .select('listing_id')
              .eq('organization_id', orgId)
              .eq('channel_type', 'woocommerce')
              .eq('channel_listing_id', externalId)
              .maybeSingle()

            let listingId = lc?.listing_id as string | undefined
            const listingPayload = {
              organization_id: orgId,
              user_id: userId,
              title: p.name ?? 'Untitled',
              description: p.description ?? '',
              price,
              sku: p.sku ?? null,
              quantity: qty,
              images,
              category: p.categories?.[0]?.name ?? '',
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
                  organization_id: orgId,
                  user_id: userId,
                  channel_type: 'woocommerce',
                  channel_listing_id: externalId,
                  status,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,channel_type,channel_listing_id' },
              )
              productCount++
            }
          }
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
            orders_last_synced_at: now,
            products_last_synced_at: now,
          },
        })
        .eq('organization_id', orgId)
        .eq('type', 'woocommerce')

      if (jobId) await markCompleted(jobId, orderCount + productCount)
      processed++
    } catch (err: unknown) {
      failure = (err as Error).message || 'unknown'
      console.error(`[sync:woocommerce] ${siteUrl} failed:`, err)
      if (jobId) await markFailed(jobId, failure)
      // Best-effort dead-letter; recordDeadLetter only promotes after repeated failures.
      await recordDeadLetter({
        userId,
        channelType: 'woocommerce',
        jobType: 'woocommerce.poll',
        errorMessage: failure,
        payload: { site: siteUrl },
      })
    }

    results.push({ site: siteUrl, orders: orderCount, products: productCount, error: failure })
  }

  return NextResponse.json({ processed, results })
}

export { GET as POST }
