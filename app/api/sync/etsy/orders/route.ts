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

const OVERLAP_SECONDS = 300 // 5m overlap to avoid missing edge events
const ETSY_BASE = 'https://openapi.etsy.com/v3/application'
const PAGE_LIMIT = 100

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdmin()
  const { data: channels } = await supabase
    .from('channels')
    .select('user_id, access_token, refresh_token, shop_domain, metadata')
    .eq('type', 'etsy')
    .eq('active', true)

  if (!channels?.length) return NextResponse.json({ processed: 0 })

  let processed = 0
  const results: Array<{ shopId: string | null; orders: number; error?: string }> = []

  for (const ch of channels) {
    const userId = ch.user_id as string
    const metadata = (ch.metadata as Record<string, unknown> | null) ?? {}
    const shopId = (metadata.etsy_shop_id as string | undefined) ?? (ch.shop_domain as string | null)
    const etsyUserId = (metadata.etsy_user_id as string | undefined) ?? null

    if (!shopId || !etsyUserId) {
      results.push({ shopId: shopId ?? null, orders: 0, error: 'missing shop_id / etsy_user_id' })
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
      console.warn(`[sync:etsy:orders] skip shop=${shopId} — token refresh failed`)
      results.push({ shopId: String(shopId), orders: 0, error: 'token_refresh_failed' })
      continue
    }
    const token = tokenResult.accessToken

    const jobId = await enqueueJob({
      userId,
      jobType: 'etsy_orders_sync',
      channelType: 'etsy',
      payload: { shop_id: shopId },
    })
    if (jobId) await markStarted(jobId)

    // Etsy uses epoch seconds for min_last_modified.
    const prevEpoch = Number(metadata.orders_last_synced_at as number | string | undefined)
    const nowEpoch  = Math.floor(Date.now() / 1000)
    const since     = Number.isFinite(prevEpoch) && prevEpoch > 0
      ? Math.max(0, prevEpoch - OVERLAP_SECONDS)
      : nowEpoch - 24 * 3600

    let orderCount = 0
    let failure: string | undefined

    try {
      let offset = 0
      for (let page = 0; page < 50; page++) { // hard safety cap
        const url =
          `${ETSY_BASE}/shops/${shopId}/receipts` +
          `?min_last_modified=${since}` +
          `&limit=${PAGE_LIMIT}&offset=${offset}&was_paid=true`

        const res = await withRateLimit('etsy', String(shopId), () =>
          syncFetch(url, {
            headers: etsyHeaders({ userId: etsyUserId, accessToken: token }),
            label: `etsy.orders:${shopId}`,
          }),
        )
        if (!res.ok) {
          failure = `HTTP ${res.status}`
          break
        }
        const body = (await res.json()) as {
          count?: number
          results?: Array<Record<string, unknown>>
        }
        const receipts = body.results ?? []
        for (const r of receipts) {
          const receiptId = String((r as { receipt_id?: number | string }).receipt_id ?? '')
          if (!receiptId) continue

          const gt = (r as { grandtotal?: { amount?: number; divisor?: number; currency_code?: string } }).grandtotal
          const divisor = Number(gt?.divisor ?? 100)
          const amount  = Number(gt?.amount ?? 0) / (divisor > 0 ? divisor : 100)
          const currency = gt?.currency_code ?? 'USD'
          const status = String((r as { status?: string }).status ?? 'open').toLowerCase()
          const createdTs = Number((r as { created_timestamp?: number }).created_timestamp ?? 0)
          const orderDate = createdTs > 0
            ? new Date(createdTs * 1000).toISOString()
            : new Date().toISOString()

          await supabase.from('transactions').upsert(
            {
              user_id: userId,
              channel: 'etsy',
              external_id: receiptId,
              shop_domain: String(shopId),
              sale_price: amount,
              gross_revenue: amount,
              currency,
              order_state: status,
              order_date: orderDate,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,external_id,channel' },
          )
          orderCount++
        }

        if (receipts.length < PAGE_LIMIT) break
        offset += PAGE_LIMIT
      }

      await supabase
        .from('channels')
        .update({
          last_synced_at: new Date().toISOString(),
          metadata: { ...metadata, orders_last_synced_at: nowEpoch },
        })
        .eq('user_id', userId)
        .eq('type', 'etsy')

      if (jobId) await markCompleted(jobId, orderCount)
      processed++
    } catch (err: unknown) {
      failure = (err as Error).message || 'unknown'
      console.error(`[etsy:orders] ${shopId} failed:`, err)
      if (jobId) await markFailed(jobId, failure)
      await recordDeadLetter({
        userId,
        channelType: 'etsy',
        jobType: 'etsy_orders_sync',
        errorMessage: failure,
        payload: { shop_id: shopId },
      })
    }

    results.push({ shopId: String(shopId), orders: orderCount, error: failure })
  }

  return NextResponse.json({ processed, results })
}

export { GET as POST }
