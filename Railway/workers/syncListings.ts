import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const RATE_LIMIT_MS = 400  // delay between API calls per channel
const BATCH_SIZE    = 10   // listings to process in parallel per batch

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

// ── EBAY TOKEN CACHE ──
// Cache tokens per channel ID to avoid refreshing on every listing
const ebayTokenCache = new Map<string, { token: string; expiresAt: number }>()

async function getEbayAccessToken(channel: any): Promise<string> {
  const cached = ebayTokenCache.get(channel.id)
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token

  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID!}:${process.env.EBAY_CLIENT_SECRET!}`
  ).toString('base64')

  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${credentials}` },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: channel.refresh_token,
      scope:         'https://api.ebay.com/oauth/api_scope/sell.inventory',
    }),
  })
  if (!res.ok) throw new Error(`eBay token refresh failed: ${res.status}`)
  const { access_token, expires_in } = await res.json()
  ebayTokenCache.set(channel.id, { token: access_token, expiresAt: Date.now() + (expires_in * 1000) })
  return access_token
}

// ── DETECT CHANGES ──
function detectChanges(listing: any, syncState: any): Record<string, any> | null {
  if (!syncState) {
    // Never synced — sync everything
    return {
      price:       listing.price,
      quantity:    listing.quantity,
      title:       listing.title,
      description: listing.description,
    }
  }

  const changes: Record<string, any> = {}
  if (Number(listing.price)    !== Number(syncState.last_synced_price))    changes.price       = listing.price
  if (listing.quantity         !== syncState.last_synced_quantity)          changes.quantity    = listing.quantity
  if (listing.title            !== syncState.last_synced_title)             changes.title       = listing.title
  if ((listing.description||'') !== (syncState.last_synced_description||'')) changes.description = listing.description

  return Object.keys(changes).length ? changes : null
}

// ── SHOPIFY SYNC ──
async function syncShopifyListing(
  listing: any,
  channelListing: any,
  channel: any,
  changes: Record<string, any>
) {
  const productId = channelListing.channel_listing_id
  if (!productId) return

  // Fetch variant ID (needed for price/quantity updates)
  if ('price' in changes || 'quantity' in changes) {
    const productRes = await fetch(
      `https://${channel.shop_domain}/admin/api/2024-01/products/${productId}.json`,
      { headers: { 'X-Shopify-Access-Token': channel.access_token } }
    )
    if (!productRes.ok) throw new Error(`Shopify fetch failed: ${productRes.status}`)
    const { product } = await productRes.json()
    const variantId = product.variants?.[0]?.id
    if (!variantId) return

    const variantUpdate: any = {}
    if ('price' in changes)    variantUpdate.price              = String(changes.price)
    if ('quantity' in changes) variantUpdate.inventory_quantity = changes.quantity

    await sleep(RATE_LIMIT_MS)
    const varRes = await fetch(
      `https://${channel.shop_domain}/admin/api/2024-01/variants/${variantId}.json`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': channel.access_token },
        body: JSON.stringify({ variant: variantUpdate }),
      }
    )
    if (!varRes.ok) throw new Error(`Shopify variant update failed: ${varRes.status}`)
  }

  // Update title/description if changed
  if ('title' in changes || 'description' in changes) {
    await sleep(RATE_LIMIT_MS)
    const productUpdate: any = {}
    if ('title' in changes)       productUpdate.title     = changes.title
    if ('description' in changes) productUpdate.body_html = changes.description || ''

    const res = await fetch(
      `https://${channel.shop_domain}/admin/api/2024-01/products/${productId}.json`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': channel.access_token },
        body: JSON.stringify({ product: productUpdate }),
      }
    )
    if (!res.ok) throw new Error(`Shopify product update failed: ${res.status}`)
  }
}

// ── EBAY SYNC ──
async function syncEbayListing(
  listing: any,
  channelListing: any,
  channel: any,
  changes: Record<string, any>
) {
  const access_token = await getEbayAccessToken(channel)
  const sku = listing.sku || listing.id

  // Update inventory item (title, description, quantity, condition)
  const needsInventoryUpdate = 'quantity' in changes || 'title' in changes || 'description' in changes
  if (needsInventoryUpdate) {
    await sleep(RATE_LIMIT_MS)
    const body: any = {
      availability: { shipToLocationAvailability: { quantity: listing.quantity ?? 0 } },
      condition: listing.condition === 'new' ? 'NEW' : 'USED_EXCELLENT',
      product: {
        title:       listing.title,
        description: listing.description || listing.title,
        imageUrls:   listing.images || [],
      },
    }
    const res = await fetch(
      `https://api.ebay.com/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` },
        body: JSON.stringify(body),
      }
    )
    if (!res.ok) throw new Error(`eBay inventory update failed: ${res.status}`)
  }

  // Update offer price
  if ('price' in changes) {
    await sleep(RATE_LIMIT_MS)
    const offersRes = await fetch(
      `https://api.ebay.com/sell/inventory/v1/offer?sku=${encodeURIComponent(sku)}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )
    if (offersRes.ok) {
      const { offers } = await offersRes.json()
      const offerId = offers?.[0]?.offerId
      if (offerId) {
        await sleep(RATE_LIMIT_MS)
        await fetch(`https://api.ebay.com/sell/inventory/v1/offer/${offerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` },
          body: JSON.stringify({
            pricingSummary: { price: { value: String(changes.price), currency: 'GBP' } },
          }),
        })
      }
    }
  }
}

// ── SYNC ONE LISTING ──
async function syncListing(
  listing: any,
  channelListings: any[],
  channels: any[],
  syncStates: any[]
) {
  const supabase = getSupabase()
  const results: { channel: string; skipped?: boolean; error?: string }[] = []

  for (const cl of channelListings) {
    const syncState = syncStates.find(s => s.listing_id === listing.id && s.channel_type === cl.channel_type)
    const changes   = detectChanges(listing, syncState)

    // Nothing changed — skip this channel
    if (!changes) {
      results.push({ channel: cl.channel_type, skipped: true })
      continue
    }

    const channel = channels.find(c => c.type === cl.channel_type)
    if (!channel) continue

    try {
      if (cl.channel_type === 'shopify') await syncShopifyListing(listing, cl, channel, changes)
      if (cl.channel_type === 'ebay')    await syncEbayListing(listing, cl, channel, changes)
      // Amazon — stub

      // Update sync state with what we just pushed
      await supabase.from('channel_sync_state').upsert({
        listing_id:              listing.id,
        user_id:                 listing.user_id,
        channel_type:            cl.channel_type,
        last_synced_at:          new Date().toISOString(),
        last_synced_price:       listing.price,
        last_synced_quantity:    listing.quantity,
        last_synced_title:       listing.title,
        last_synced_description: listing.description,
        last_error:              null,
        sync_attempts:           0,
      }, { onConflict: 'listing_id,channel_type' })

      await supabase.from('sync_log').insert({
        listing_id:   listing.id,
        channel_type: cl.channel_type,
        action:       `sync:${Object.keys(changes).join(',')}`,
        status:       'success',
      })

      results.push({ channel: cl.channel_type })
    } catch (err: any) {
      console.error(`Sync failed ${listing.id} → ${cl.channel_type}: ${err.message}`)

      await supabase.from('channel_sync_state').upsert({
        listing_id:    listing.id,
        user_id:       listing.user_id,
        channel_type:  cl.channel_type,
        last_error:    err.message,
        sync_attempts: (syncState?.sync_attempts ?? 0) + 1,
      }, { onConflict: 'listing_id,channel_type' })

      await supabase.from('sync_log').insert({
        listing_id:   listing.id,
        channel_type: cl.channel_type,
        action:       'sync',
        status:       'failed',
        error:        err.message,
      })

      results.push({ channel: cl.channel_type, error: err.message })
    }
  }

  return results
}

// ── MAIN ──
// Runs every 4 hours via Railway cron
// Only syncs listings where price/quantity/title/description changed since last sync
export async function syncAllListings() {
  const startedAt = Date.now()
  console.log('[syncListings] Starting...')
  const supabase = getSupabase()

  // Load all published listings with their channels
  const { data: listings } = await supabase
    .from('channel_listings')
    .select('id, user_id, price, quantity, sku, condition, title, description, images')
    .in('status', ['published', 'partially_published'])

  if (!listings?.length) {
    console.log('[syncListings] No published listings')
    return
  }

  const listingIds = listings.map(l => l.id)
  const userIds    = [...new Set(listings.map(l => l.user_id))]

  // Batch-load all supporting data
  const [
    { data: allChannelListings },
    { data: allChannels },
    { data: allSyncStates },
  ] = await Promise.all([
    supabase.from('listing_channels').select('*').in('listing_id', listingIds).eq('status', 'published'),
    supabase.from('channels').select('*').in('user_id', userIds).eq('active', true),
    supabase.from('channel_sync_state').select('*').in('listing_id', listingIds),
  ])

  let synced = 0, skipped = 0, failed = 0

  // Process in parallel batches
  for (let i = 0; i < listings.length; i += BATCH_SIZE) {
    const batch = listings.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (listing) => {
        const channelListings = allChannelListings?.filter(cl => cl.listing_id === listing.id) ?? []
        const userChannels    = allChannels?.filter(c => c.user_id === listing.user_id) ?? []
        const syncStates      = allSyncStates?.filter(s => s.listing_id === listing.id) ?? []

        if (!channelListings.length) return

        const results = await syncListing(listing, channelListings, userChannels, syncStates)
        for (const r of results) {
          if (r.skipped)   skipped++
          else if (r.error) failed++
          else              synced++
        }
      })
    )
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(`[syncListings] Done in ${elapsed}s — synced: ${synced}, skipped: ${skipped}, failed: ${failed}`)
}
