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

const OVERLAP_SECONDS = 300
const PAGE_LIMIT = 200
const MAX_PAGES = 20

interface OnBuyOrder {
  order_id?: string | number
  order_reference?: string
  status?: string
  currency?: string
  total?: number | string
  created?: string
  last_updated?: string
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
  const results: Array<{ userId: string; orders: number; error?: string }> = []

  for (const ch of channels) {
    const userId = ch.user_id as string
    const orgId  = ch.organization_id as string
    const metadata = (ch.metadata as Record<string, unknown> | null) ?? {}

    const jobId = await enqueueJob({
      userId,
      jobType: 'onbuy_orders_sync',
      channelType: 'onbuy',
    })
    if (jobId) await markStarted(jobId)

    let orderCount = 0
    let failure: string | undefined

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

      const prevEpoch = Number(metadata.orders_last_synced_at as number | string | undefined)
      const nowEpoch = Math.floor(Date.now() / 1000)
      const since = Number.isFinite(prevEpoch) && prevEpoch > 0
        ? Math.max(0, prevEpoch - OVERLAP_SECONDS)
        : nowEpoch - 24 * 3600

      for (let page = 0; page < MAX_PAGES; page++) {
        const offset = page * PAGE_LIMIT
        const url =
          `${baseUrl}/orders?site_id=${encodeURIComponent(siteId)}` +
          `&filter[last_updated_from]=${since}` +
          `&limit=${PAGE_LIMIT}&offset=${offset}`

        const res = await withRateLimit('onbuy', userId, () =>
          syncFetch(url, {
            headers: onbuyHeaders({ accessToken }),
            label: `onbuy.orders:${userId}`,
          }),
        )
        if (!res.ok) { failure = `HTTP ${res.status}`; break }
        const body = (await res.json()) as { results?: OnBuyOrder[]; total?: number }
        const orders = body.results ?? []

        for (const o of orders) {
          const externalId = String(o.order_reference ?? o.order_id ?? '')
          if (!externalId) continue
          const amount = Number(o.total ?? 0)
          const currency = o.currency ?? 'GBP'
          const orderDateIso = o.created
            ? new Date(o.created).toISOString()
            : new Date().toISOString()

          await supabase.from('transactions').upsert(
            {
              organization_id: orgId,
              user_id: userId,
              channel: 'onbuy',
              external_id: externalId,
              shop_domain: siteId,
              sale_price: amount,
              gross_revenue: amount,
              currency,
              order_state: String(o.status ?? 'open').toLowerCase(),
              order_date: orderDateIso,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,external_id,channel' },
          )
          orderCount++
        }

        if (orders.length < PAGE_LIMIT) break
      }

      await supabase
        .from('channels')
        .update({
          last_synced_at: new Date().toISOString(),
          metadata: { ...metadata, orders_last_synced_at: nowEpoch, onbuy_site_id: siteId },
        })
        .eq('organization_id', orgId)
        .eq('type', 'onbuy')

      if (jobId) await markCompleted(jobId, orderCount)
      processed++
    } catch (err: unknown) {
      failure = (err as Error).message || 'unknown'
      console.error(`[onbuy:orders] ${userId} failed:`, err)
      if (jobId) await markFailed(jobId, failure)
      await recordDeadLetter({
        userId,
        channelType: 'onbuy',
        jobType: 'onbuy_orders_sync',
        errorMessage: failure,
      })
    }

    results.push({ userId, orders: orderCount, error: failure })
  }

  return NextResponse.json({ processed, results })
}

export { GET as POST }
