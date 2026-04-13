import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { withRateLimit } from '../../../../lib/rate-limit/channel'
import { syncFetch } from '../../../../lib/sync/http'
import { enqueueJob, markCompleted, markFailed, markStarted } from '../../../../lib/sync/jobs'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

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
  const results: Array<{ userId: string; listings: number; error?: string }> = []

  for (const ch of channels) {
    const userId = ch.user_id as string
    let token = ch.access_token as string
    const refresh = ch.refresh_token as string | null
    const metadata = (ch.metadata as Record<string, unknown> | null) ?? {}

    const jobId = await enqueueJob({
      userId,
      jobType: 'ebay.listings.poll',
      channelType: 'ebay',
    })
    if (jobId) await markStarted(jobId)

    let listingCount = 0
    let failure: string | undefined

    try {
      let offset = 0
      const limit = 200
      const now = new Date().toISOString()

      for (;;) {
        const url = `https://api.ebay.com/sell/inventory/v1/inventory_item?limit=${limit}&offset=${offset}`
        let doFetch = async () =>
          syncFetch(url, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Language': 'en-GB' },
            label: `ebay.listings:${userId}`,
          })
        let res = await withRateLimit('ebay', userId, doFetch)
        if (res.status === 401 && refresh) {
          token = await refreshUserToken(refresh)
          await supabase.from('channels').update({ access_token: token }).eq('user_id', userId).eq('type', 'ebay')
          doFetch = async () =>
            syncFetch(url, {
              headers: { Authorization: `Bearer ${token}`, 'Content-Language': 'en-GB' },
              label: `ebay.listings:${userId}:retry`,
            })
          res = await withRateLimit('ebay', userId, doFetch)
        }
        if (!res.ok) {
          failure = `HTTP ${res.status}`
          break
        }
        const body = await res.json()
        const items = (body.inventoryItems ?? []) as Array<{
          sku?: string
          availability?: { shipToLocationAvailability?: { quantity?: number } }
          product?: { title?: string; description?: string; imageUrls?: string[]; brand?: string }
        }>
        for (const item of items) {
          if (!item.sku) continue
          const qty = item.availability?.shipToLocationAvailability?.quantity ?? 0
          const title = item.product?.title ?? item.sku
          const desc = item.product?.description ?? ''

          const { data: existing } = await supabase
            .from('listings')
            .select('id')
            .eq('user_id', userId)
            .eq('sku', item.sku)
            .maybeSingle()

          const listingPayload = {
            user_id: userId,
            title,
            description: desc,
            sku: item.sku,
            brand: item.product?.brand ?? '',
            quantity: qty,
            images: item.product?.imageUrls ?? [],
            updated_at: new Date().toISOString(),
          }

          let listingId = existing?.id as string | undefined
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
            await supabase.from('channel_sync_state').upsert(
              {
                listing_id: listingId,
                user_id: userId,
                channel_type: 'ebay',
                last_synced_at: now,
                last_synced_quantity: qty,
                last_synced_title: title,
                last_synced_description: desc,
                sync_attempts: 0,
                last_error: null,
              },
              { onConflict: 'listing_id,channel_type' },
            )
            listingCount++
          }
        }

        if (items.length < limit) break
        offset += limit
        if (offset > 10_000) break // safety cap
      }

      await supabase
        .from('channels')
        .update({ metadata: { ...metadata, listings_last_synced_at: now } })
        .eq('user_id', userId)
        .eq('type', 'ebay')

      if (jobId) await markCompleted(jobId, listingCount)
      processed++
    } catch (err: unknown) {
      failure = (err as Error).message
      console.error(`[sync:ebay:listings] ${userId} failed:`, err)
      if (jobId) await markFailed(jobId, failure)
    }

    results.push({ userId, listings: listingCount, error: failure })
  }

  return NextResponse.json({ processed, results })
}

export { GET as POST }
