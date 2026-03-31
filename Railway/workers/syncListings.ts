import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// ── SHOPIFY SYNC ──
async function updateShopifyListing(
  listing: any,
  channelListing: any,
  channel: any,
  changes: Record<string, any>
) {
  const productId = channelListing.channel_listing_id
  if (!productId) return

  const variantUpdate: any = {}
  if ('price' in changes)    variantUpdate.price = String(changes.price)
  if ('quantity' in changes) variantUpdate.inventory_quantity = changes.quantity

  if (Object.keys(variantUpdate).length === 0) return

  // Get variant ID first
  const productRes = await fetch(
    `https://${channel.shop_domain}/admin/api/2024-01/products/${productId}.json`,
    { headers: { 'X-Shopify-Access-Token': channel.access_token } }
  )
  if (!productRes.ok) throw new Error(`Shopify fetch failed: ${productRes.status}`)
  const { product } = await productRes.json()
  const variantId = product.variants?.[0]?.id
  if (!variantId) return

  const updateRes = await fetch(
    `https://${channel.shop_domain}/admin/api/2024-01/variants/${variantId}.json`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': channel.access_token,
      },
      body: JSON.stringify({ variant: variantUpdate }),
    }
  )
  if (!updateRes.ok) throw new Error(`Shopify update failed: ${updateRes.status}`)
}

// ── EBAY SYNC ──
async function updateEbayListing(
  listing: any,
  channelListing: any,
  channel: any,
  changes: Record<string, any>
) {
  // Refresh token
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID!}:${process.env.EBAY_CLIENT_SECRET!}`
  ).toString('base64')

  const tokenRes = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: channel.refresh_token,
      scope: 'https://api.ebay.com/oauth/api_scope/sell.inventory',
    }),
  })
  if (!tokenRes.ok) throw new Error('eBay token refresh failed')
  const { access_token } = await tokenRes.json()

  const sku = listing.sku || listing.id

  // Update quantity
  if ('quantity' in changes) {
    await fetch(`https://api.ebay.com/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` },
      body: JSON.stringify({
        availability: { shipToLocationAvailability: { quantity: changes.quantity } },
        condition: listing.condition === 'new' ? 'NEW' : 'USED_EXCELLENT',
        product: { title: listing.title, description: listing.description || listing.title },
      }),
    })
  }

  // Update price — need offer ID
  if ('price' in changes && channelListing.channel_listing_id) {
    const offersRes = await fetch(
      `https://api.ebay.com/sell/inventory/v1/offer?sku=${encodeURIComponent(sku)}`,
      { headers: { 'Authorization': `Bearer ${access_token}` } }
    )
    if (offersRes.ok) {
      const { offers } = await offersRes.json()
      const offerId = offers?.[0]?.offerId
      if (offerId) {
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

// ── DETECT CHANGES ──
// Compare listing current values against what was last synced
// We use the sync_log to infer last known state — simple approach:
// just always sync price + quantity (idempotent, low API cost)
async function syncListing(listing: any) {
  const supabase = getSupabase()

  const { data: channelListings } = await supabase
    .from('listing_channels')
    .select('*')
    .eq('listing_id', listing.id)
    .eq('status', 'published')

  if (!channelListings?.length) return

  for (const cl of channelListings) {
    try {
      const { data: channel } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', listing.user_id)
        .eq('type', cl.channel_type)
        .eq('active', true)
        .single()

      if (!channel) continue

      const changes = { price: listing.price, quantity: listing.quantity }

      if (cl.channel_type === 'shopify') await updateShopifyListing(listing, cl, channel, changes)
      if (cl.channel_type === 'ebay')    await updateEbayListing(listing, cl, channel, changes)
      // Amazon stub — skip

      await supabase.from('sync_log').insert({
        listing_id:   listing.id,
        channel_type: cl.channel_type,
        action:       'price_update',
        status:       'success',
      })

      console.log(`Synced ${listing.id} → ${cl.channel_type}`)
    } catch (err: any) {
      console.error(`Sync failed ${listing.id} → ${cl.channel_type}:`, err.message)
      await getSupabase().from('sync_log').insert({
        listing_id:   listing.id,
        channel_type: cl.channel_type,
        action:       'price_update',
        status:       'failed',
        error:        err.message,
      })
    }
  }
}

// ── MAIN ──
// Runs every 4 hours via Railway cron
// Syncs price + stock for all published listings
export async function syncAllListings() {
  console.log('Starting listing sync...')
  const supabase = getSupabase()

  const { data: listings } = await supabase
    .from('listings')
    .select('id, user_id, price, quantity, sku, condition, title, description')
    .eq('status', 'published')

  if (!listings?.length) {
    console.log('No published listings to sync')
    return
  }

  console.log(`Syncing ${listings.length} listings...`)
  let synced = 0

  for (const listing of listings) {
    await syncListing(listing)
    synced++
  }

  console.log(`Sync complete — ${synced} listings processed`)
}
