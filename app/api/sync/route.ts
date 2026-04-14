import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { withRateLimit, type ChannelKey } from '../../lib/rate-limit/channel'
import { recordDeadLetter } from '../../lib/sync/jobs'

// Runs on a schedule — detects listing drift vs last-synced channel state and re-publishes
// TODO(metrics-daily): no aggregation cron found in the codebase that writes to
// public.metrics_daily. The 6 seed rows (product_id A1/B1) were cleaned; a real
// aggregation job (rollup of orders -> daily revenue/orders per product_id) is
// still needed. Candidate home: new app/api/metrics/aggregate/route.ts running
// nightly under CRON_SECRET, grouped by user_id + product_id + date.

const getAdminSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = getAdminSupabase()

  // Fetch all channel_sync_state records alongside current listing values
  const { data: syncStates, error } = await adminSupabase
    .from('channel_sync_state')
    .select(`
      listing_id,
      user_id,
      channel_type,
      last_synced_price,
      last_synced_quantity,
      last_synced_title,
      last_synced_description,
      sync_attempts,
      listings (
        id, title, description, price, quantity, status
      )
    `)
    // Only check listings that are actively published (skip drafts)
    .not('last_synced_at', 'is', null)
    // Don't retry states that have failed more than 5 times (manual intervention needed)
    .lt('sync_attempts', 5)

  if (error) {
    console.error('[sync:cron] Failed to fetch sync states', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!syncStates?.length) {
    return NextResponse.json({ synced: 0, skipped: 0 })
  }

  let synced = 0
  let skipped = 0

  const drifted = syncStates.filter(state => {
    const listing = (state as any).listings
    if (!listing) return false
    // Skip if listing is no longer published
    if (!['published', 'partially_published'].includes(listing.status)) return false

    return (
      listing.price        !== state.last_synced_price        ||
      listing.quantity     !== state.last_synced_quantity      ||
      listing.title        !== state.last_synced_title         ||
      listing.description  !== state.last_synced_description
    )
  })

  console.log(`[sync:cron] ${syncStates.length} states checked, ${drifted.length} drifted`)

  // Re-publish drifted listings per channel via internal publish endpoint
  // Group by listing_id to batch channel calls; track attempts per state for error handling
  const byListing = new Map<string, { userId: string; channels: string[]; attempts: Record<string, number> }>()
  for (const state of drifted) {
    const existing = byListing.get(state.listing_id)
    if (existing) {
      existing.channels.push(state.channel_type)
      existing.attempts[state.channel_type] = state.sync_attempts ?? 0
    } else {
      byListing.set(state.listing_id, {
        userId: state.user_id,
        channels: [state.channel_type],
        attempts: { [state.channel_type]: state.sync_attempts ?? 0 },
      })
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  await Promise.allSettled(
    Array.from(byListing.entries()).map(async ([listingId, { userId, channels, attempts }]) => {
      try {
        // Reserve a rate-limit slot per target channel (uses userId as scope;
        // for shopify we don't know the shop here so userId is a safe proxy).
        for (const ch of channels) {
          await withRateLimit(ch as ChannelKey, userId, async () => undefined)
        }
        const res = await fetch(`${baseUrl}/api/listings/${listingId}/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Pass CRON_SECRET so the publish endpoint can trust this internal call
            'x-sync-secret': process.env.CRON_SECRET || '',
          },
          body: JSON.stringify({ channels }),
        })

        if (res.ok) {
          synced += channels.length
          console.log(`[sync:cron] Re-published listing ${listingId} to [${channels.join(', ')}]`)
        } else {
          const body = await res.json().catch(() => ({}))
          console.error(`[sync:cron] Publish failed for ${listingId}:`, body)
          skipped += channels.length

          // Increment sync_attempts per channel so we don't loop forever on broken listings
          await Promise.all(channels.map(async ch => {
            const nextAttempts = (attempts[ch] ?? 0) + 1
            await adminSupabase.from('channel_sync_state')
              .update({ last_error: body.error || 'Sync re-publish failed', sync_attempts: nextAttempts })
              .eq('listing_id', listingId)
              .eq('channel_type', ch)
            if (nextAttempts >= 5) {
              await recordDeadLetter({
                userId,
                channelType: ch,
                jobType: 'drift.republish',
                errorMessage: body.error || 'Sync re-publish failed',
                payload: { listing_id: listingId },
              })
            }
          }))
        }
      } catch (err: any) {
        console.error(`[sync:cron] Exception re-publishing ${listingId}:`, err)
        skipped += channels.length
        await Promise.all(channels.map(async ch => {
          const nextAttempts = (attempts[ch] ?? 0) + 1
          await adminSupabase.from('channel_sync_state')
            .update({ last_error: err.message, sync_attempts: nextAttempts })
            .eq('listing_id', listingId)
            .eq('channel_type', ch)
          if (nextAttempts >= 5) {
            await recordDeadLetter({
              userId,
              channelType: ch,
              jobType: 'drift.republish',
              errorMessage: err.message,
              payload: { listing_id: listingId },
            })
          }
        }))
      }
    })
  )

  return NextResponse.json({ synced, skipped, checked: syncStates.length, drifted: drifted.length })
}

// Also allow POST (manual trigger from admin panel)
export { GET as POST }
