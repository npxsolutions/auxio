import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { withRateLimit } from '../../../../lib/rate-limit/channel'
import { syncFetch } from '../../../../lib/sync/http'
import { enqueueJob, markCompleted, markFailed, markStarted } from '../../../../lib/sync/jobs'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

const OVERLAP_MINUTES = 5

async function refreshUserToken(refreshToken: string): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID!}:${process.env.EBAY_CLIENT_SECRET!}`,
  ).toString('base64')
  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  })
  if (!res.ok) throw new Error(`eBay token refresh failed: ${res.status}`)
  const body = await res.json()
  return body.access_token as string
}

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdmin()
  const { data: channels } = await supabase
    .from('channels')
    .select('user_id, access_token, refresh_token, metadata')
    .eq('type', 'ebay')
    .eq('active', true)

  if (!channels?.length) return NextResponse.json({ processed: 0 })

  let processed = 0
  const results: Array<{ userId: string; orders: number; error?: string }> = []

  for (const ch of channels) {
    const userId = ch.user_id as string
    let token = ch.access_token as string
    const refresh = ch.refresh_token as string | null
    const metadata = (ch.metadata as Record<string, unknown> | null) ?? {}
    const lastSync = (metadata.orders_last_synced_at as string | undefined) ?? null

    const sinceMs =
      (lastSync ? new Date(lastSync).getTime() : Date.now() - 24 * 3600_000) -
      OVERLAP_MINUTES * 60_000
    const since = new Date(Math.max(sinceMs, 0)).toISOString()
    const now = new Date().toISOString()

    const jobId = await enqueueJob({
      userId,
      jobType: 'ebay.orders.poll',
      channelType: 'ebay',
    })
    if (jobId) await markStarted(jobId)

    let orderCount = 0
    let failure: string | undefined

    try {
      const url = `https://api.ebay.com/sell/fulfillment/v1/order?filter=${encodeURIComponent(`lastmodifieddate:[${since}..${now}]`)}&limit=200`

      let doFetch = async () =>
        syncFetch(url, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          label: `ebay.orders:${userId}`,
        })

      let res = await withRateLimit('ebay', userId, doFetch)
      if (res.status === 401 && refresh) {
        token = await refreshUserToken(refresh)
        await supabase.from('channels').update({ access_token: token }).eq('user_id', userId).eq('type', 'ebay')
        doFetch = async () =>
          syncFetch(url, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            label: `ebay.orders:${userId}:retry`,
          })
        res = await withRateLimit('ebay', userId, doFetch)
      }

      if (res.ok) {
        const body = await res.json()
        const orders = (body.orders ?? []) as Array<Record<string, unknown>>
        for (const o of orders) {
          const orderId = String((o as { orderId?: string }).orderId ?? '')
          if (!orderId) continue
          const pricing = (o as { pricingSummary?: { total?: { value?: string } } }).pricingSummary
          const gross = Number(pricing?.total?.value ?? 0)
          const status = String((o as { orderFulfillmentStatus?: string }).orderFulfillmentStatus ?? 'pending').toLowerCase()
          await supabase.from('transactions').upsert(
            {
              user_id: userId,
              channel: 'ebay',
              external_id: orderId,
              sale_price: gross,
              gross_revenue: gross,
              currency: String((o as { pricingSummary?: { total?: { currency?: string } } }).pricingSummary?.total?.currency ?? 'USD'),
              order_state: status,
              order_date:
                (o as { creationDate?: string }).creationDate ||
                (o as { lastModifiedDate?: string }).lastModifiedDate ||
                new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,external_id,channel' },
          )
          orderCount++
        }
      } else {
        failure = `HTTP ${res.status}`
      }

      await supabase
        .from('channels')
        .update({
          metadata: { ...metadata, orders_last_synced_at: now },
          last_synced_at: now,
        })
        .eq('user_id', userId)
        .eq('type', 'ebay')

      if (jobId) await markCompleted(jobId, orderCount)
      processed++
    } catch (err: unknown) {
      failure = (err as Error).message
      console.error(`[sync:ebay:orders] ${userId} failed:`, err)
      if (jobId) await markFailed(jobId, failure)
    }

    results.push({ userId, orders: orderCount, error: failure })
  }

  return NextResponse.json({ processed, results })
}

export { GET as POST }
