// TODO(walmart-webhooks): implement Order Release event handler when the exact
// X-Walmart-Signature HMAC base string is verified against Walmart docs.
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

const OVERLAP_MS = 5 * 60_000 // 5m overlap so nothing slips between runs
const PAGE_LIMIT = 200
const MAX_PAGES = 20

interface WalmartOrder {
  purchaseOrderId?: string
  customerOrderId?: string
  orderDate?: number | string
  orderLines?: { orderLine?: Array<{ charges?: { charge?: Array<{ chargeAmount?: { amount?: number; currency?: string } }> } }> }
  shipNode?: { type?: string }
  orderType?: string
}

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdmin()
  const { data: channels } = await supabase
    .from('channels')
    .select('user_id, access_token, shop_domain, metadata')
    .eq('type', 'walmart')
    .eq('active', true)

  if (!channels?.length) return NextResponse.json({ processed: 0 })

  let processed = 0
  const results: Array<{ userId: string; orders: number; error?: string }> = []

  for (const ch of channels) {
    const userId = ch.user_id as string
    const metadata = (ch.metadata as Record<string, unknown> | null) ?? {}

    const jobId = await enqueueJob({
      userId,
      jobType: 'walmart_orders_sync',
      channelType: 'walmart',
    })
    if (jobId) await markStarted(jobId)

    let orderCount = 0
    let failure: string | undefined

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

      const prevIso = metadata.orders_last_synced_at as string | undefined
      const prevMs = prevIso ? Date.parse(prevIso) : NaN
      const sinceMs = Number.isFinite(prevMs)
        ? Math.max(0, prevMs - OVERLAP_MS)
        : Date.now() - 24 * 3600_000
      const createdStartDate = new Date(sinceMs).toISOString()

      let cursor: string | null = null
      for (let page = 0; page < MAX_PAGES; page++) {
        // Walmart paginates via /v3/orders (first page) -> /v3/orders?nextCursor=...
        const url: string = cursor
          ? `${baseUrl}/v3/orders${cursor}`
          : `${baseUrl}/v3/orders?createdStartDate=${encodeURIComponent(createdStartDate)}&limit=${PAGE_LIMIT}`

        const res = await withRateLimit('walmart', userId, () =>
          syncFetch(url, {
            headers: walmartHeaders({ accessToken }),
            label: `walmart.orders:${userId}`,
          }),
        )
        if (!res.ok) { failure = `HTTP ${res.status}`; break }
        const body = (await res.json()) as {
          list?: {
            meta?: { nextCursor?: string | null }
            elements?: { order?: WalmartOrder[] }
          }
        }
        const orders = body.list?.elements?.order ?? []

        for (const o of orders) {
          const externalId = String(o.purchaseOrderId ?? o.customerOrderId ?? '')
          if (!externalId) continue
          // Sum line charges as gross revenue.
          let amount = 0
          let currency = 'USD'
          const lines = o.orderLines?.orderLine ?? []
          for (const line of lines) {
            const charges = line.charges?.charge ?? []
            for (const c of charges) {
              amount += Number(c.chargeAmount?.amount ?? 0)
              if (c.chargeAmount?.currency) currency = c.chargeAmount.currency
            }
          }
          const orderDateIso = o.orderDate
            ? (typeof o.orderDate === 'number'
                ? new Date(o.orderDate).toISOString()
                : new Date(String(o.orderDate)).toISOString())
            : new Date().toISOString()

          await supabase.from('transactions').upsert(
            {
              user_id: userId,
              channel: 'walmart',
              external_id: externalId,
              shop_domain: (ch.shop_domain as string | null) ?? null,
              sale_price: amount,
              gross_revenue: amount,
              currency,
              order_state: 'open',
              order_date: orderDateIso,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,external_id,channel' },
          )
          orderCount++
        }

        const next = body.list?.meta?.nextCursor
        if (!next) break
        cursor = next.startsWith('?') ? next : `?${next}`
      }

      await supabase
        .from('channels')
        .update({
          last_synced_at: new Date().toISOString(),
          metadata: { ...metadata, orders_last_synced_at: new Date().toISOString() },
        })
        .eq('user_id', userId)
        .eq('type', 'walmart')

      if (jobId) await markCompleted(jobId, orderCount)
      processed++
    } catch (err: unknown) {
      failure = (err as Error).message || 'unknown'
      console.error(`[walmart:orders] ${userId} failed:`, err)
      if (jobId) await markFailed(jobId, failure)
      await recordDeadLetter({
        userId,
        channelType: 'walmart',
        jobType: 'walmart_orders_sync',
        errorMessage: failure,
      })
    }

    results.push({ userId, orders: orderCount, error: failure })
  }

  return NextResponse.json({ processed, results })
}

export { GET as POST }
