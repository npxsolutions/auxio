import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { ebayHeaders, getEbayAccessToken } from '../../../../lib/ebay/auth'
import { withRateLimit } from '../../../../lib/rate-limit/channel'
import { syncFetch } from '../../../../lib/sync/http'
import { enqueueJob, markCompleted, markFailed, markStarted } from '../../../../lib/sync/jobs'

const getAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdmin()
  const { data: channels } = await supabase
    .from('channels')
    .select('user_id, organization_id, access_token, refresh_token, metadata')
    .eq('type', 'ebay')
    .eq('active', true)

  if (!channels?.length) return NextResponse.json({ processed: 0 })

  let processed = 0
  const results: Array<{ userId: string; listings: number; error?: string }> = []

  for (const ch of channels) {
    const userId = ch.user_id as string
    const orgId  = ch.organization_id as string
    const metadata = (ch.metadata as Record<string, unknown> | null) ?? {}

    const tokenResult = await getEbayAccessToken(
      {
        user_id: userId,
        access_token: ch.access_token as string | null,
        refresh_token: ch.refresh_token as string | null,
        metadata,
      },
      supabase,
    )
    if (!tokenResult) {
      console.warn(`[sync:ebay:listings] skip user=${userId} — token refresh failed`)
      results.push({ userId, listings: 0, error: 'token_refresh_failed' })
      continue
    }
    const token = tokenResult.accessToken

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
        const res = await withRateLimit('ebay', userId, async () =>
          syncFetch(url, {
            headers: ebayHeaders({ accessToken: token, contentLanguage: 'en-GB' }),
            label: `ebay.listings:${userId}`,
          }),
        )
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
            .eq('organization_id', orgId)
            .eq('sku', item.sku)
            .maybeSingle()

          const listingPayload = {
            organization_id: orgId,
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
                organization_id: orgId,
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
        .eq('organization_id', orgId)
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
