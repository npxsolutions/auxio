import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { withRateLimit } from '../../../lib/rate-limit/channel'
import { syncFetch } from '../../../lib/sync/http'
import { enqueueJob, markCompleted, markFailed, markStarted } from '../../../lib/sync/jobs'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

// Overlap buffer so we don't miss events that arrive slightly out of order.
const OVERLAP_MINUTES = 5

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdmin()

  const { data: channels, error } = await supabase
    .from('channels')
    .select('user_id, organization_id, shop_domain, access_token, last_synced_at, metadata')
    .eq('type', 'shopify')
    .eq('active', true)

  if (error) {
    console.error('[sync:shopify] fetch channels:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!channels?.length) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0
  const results: Array<{ shop: string; orders: number; products: number; error?: string }> = []

  for (const ch of channels) {
    const shop = ch.shop_domain as string
    const userId = ch.user_id as string
    const orgId  = ch.organization_id as string
    const token = ch.access_token as string
    if (!shop || !token) continue

    const jobId = await enqueueJob({
      userId,
      jobType: 'shopify.poll',
      channelType: 'shopify',
      payload: { shop },
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
      // Orders delta
      const ordersUrl = `https://${shop}/admin/api/2024-01/orders.json?status=any&updated_at_min=${encodeURIComponent(since)}&limit=250`
      const ordersRes = await withRateLimit('shopify', shop, () =>
        syncFetch(ordersUrl, {
          headers: { 'X-Shopify-Access-Token': token },
          label: `shopify.orders:${shop}`,
        }),
      )
      if (ordersRes.ok) {
        const body = await ordersRes.json()
        const orders = (body.orders ?? []) as Array<Record<string, unknown>>
        for (const o of orders) {
          // Re-use the webhook upsert shape via a minimal transaction row.
          const gross = Number((o as { total_price?: string }).total_price ?? 0)
          const tax = Number((o as { total_tax?: string }).total_tax ?? 0)
          await supabase.from('transactions').upsert(
            {
              organization_id: orgId,
              user_id: userId,
              channel: 'shopify',
              external_id: String((o as { id?: string | number }).id ?? ''),
              shop_domain: shop,
              sale_price: gross,
              gross_revenue: gross,
              tax_cost: tax,
              currency: (o as { currency?: string }).currency ?? null,
              order_state: (o as { financial_status?: string }).financial_status ?? 'pending',
              order_date:
                (o as { processed_at?: string }).processed_at ||
                (o as { created_at?: string }).created_at ||
                new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,external_id,channel' },
          )
          orderCount++
        }
      }

      // Products delta
      const productsUrl = `https://${shop}/admin/api/2024-01/products.json?updated_at_min=${encodeURIComponent(since)}&limit=250`
      const productsRes = await withRateLimit('shopify', shop, () =>
        syncFetch(productsUrl, {
          headers: { 'X-Shopify-Access-Token': token },
          label: `shopify.products:${shop}`,
        }),
      )
      if (productsRes.ok) {
        const body = await productsRes.json()
        const products = (body.products ?? []) as Array<{
          id: number
          title?: string
          body_html?: string
          variants?: Array<{ sku?: string; price?: string; inventory_quantity?: number }>
          status?: string
        }>
        for (const p of products) {
          const firstVar = p.variants?.[0]
          const price = firstVar?.price ? parseFloat(firstVar.price) : 0
          const qty = firstVar?.inventory_quantity ?? 0
          const sku = firstVar?.sku ?? null
          const externalId = String(p.id)

          // Upsert by (user_id, channel_type, channel_listing_id) chain.
          const { data: lc } = await supabase
            .from('listing_channels')
            .select('listing_id')
            .eq('organization_id', orgId)
            .eq('channel_type', 'shopify')
            .eq('channel_listing_id', externalId)
            .maybeSingle()

          let listingId = lc?.listing_id as string | undefined
          const listingPayload = {
            organization_id: orgId,
            user_id: userId,
            title: p.title ?? 'Untitled',
            description: p.body_html ?? '',
            price,
            sku,
            quantity: qty,
            status: p.status === 'active' ? 'published' : 'draft',
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
                organization_id: orgId,
                listing_id: listingId,
                user_id: userId,
                channel_type: 'shopify',
                channel_listing_id: externalId,
                status: p.status === 'active' ? 'published' : 'draft',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,channel_type,channel_listing_id' },
            )
            productCount++
          }
        }
      }

      await supabase
        .from('channels')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('organization_id', orgId)
        .eq('type', 'shopify')

      if (jobId) await markCompleted(jobId, orderCount + productCount)
      processed++
    } catch (err: unknown) {
      failure = (err as Error).message
      console.error(`[sync:shopify] ${shop} failed:`, err)
      if (jobId) await markFailed(jobId, failure)
    }

    results.push({ shop, orders: orderCount, products: productCount, error: failure })
  }

  return NextResponse.json({ processed, results })
}

export { GET as POST }
