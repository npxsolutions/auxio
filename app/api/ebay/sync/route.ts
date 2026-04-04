import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getEbayAppToken } from '@/app/lib/ebay-app-token'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function refreshUserToken(refreshToken: string): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID!}:${process.env.EBAY_CLIENT_SECRET!}`
  ).toString('base64')
  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`)
  const { access_token } = await res.json()
  return access_token
}

// Parse eBay item ID from v1|123456789|0 format
function parseItemId(raw: string): string {
  return raw?.replace(/^v1\|/, '').split('|')[0] || raw
}

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: channel } = await getAdmin()
      .from('channels')
      .select('access_token, refresh_token, shop_name')
      .eq('user_id', user.id)
      .eq('type', 'ebay')
      .eq('active', true)
      .single()

    if (!channel?.access_token) {
      return NextResponse.json({ error: 'No eBay channel connected' }, { status: 400 })
    }

    // Build set of already-imported eBay item IDs so we don't duplicate
    const { data: existingChannels } = await getAdmin()
      .from('listing_channels')
      .select('channel_listing_id')
      .eq('user_id', user.id)
      .eq('channel_type', 'ebay')
      .not('channel_listing_id', 'is', null)

    const existingIds = new Set((existingChannels || []).map(r => r.channel_listing_id as string))

    let userToken = channel.access_token
    let imported = 0
    let skipped  = 0

    // ── STRATEGY 1: Inventory API ────────────────────────────────────────────
    // Fetches items created via the Inventory API (full data: title, description,
    // images, attributes, quantity). Falls through silently if none exist.
    const inventoryItems: any[] = []
    const offersBySku: Record<string, any> = {}

    try {
      // Fetch inventory items
      let offset = 0
      while (true) {
        let res = await fetch(
          `https://api.ebay.com/sell/inventory/v1/inventory_item?limit=100&offset=${offset}`,
          { headers: { Authorization: `Bearer ${userToken}`, 'Content-Language': 'en-GB' } }
        )
        if (res.status === 401 && channel.refresh_token) {
          userToken = await refreshUserToken(channel.refresh_token)
          await getAdmin().from('channels').update({ access_token: userToken }).eq('user_id', user.id).eq('type', 'ebay')
          res = await fetch(
            `https://api.ebay.com/sell/inventory/v1/inventory_item?limit=100&offset=${offset}`,
            { headers: { Authorization: `Bearer ${userToken}`, 'Content-Language': 'en-GB' } }
          )
        }
        if (!res.ok) break
        const data = await res.json()
        const items = data.inventoryItems || []
        inventoryItems.push(...items)
        if (items.length < 100) break
        offset += 100
      }

      // Fetch offers (price + listing ID per SKU)
      let oOffset = 0
      while (true) {
        const res = await fetch(
          `https://api.ebay.com/sell/inventory/v1/offer?format=FIXED_PRICE&limit=100&offset=${oOffset}`,
          { headers: { Authorization: `Bearer ${userToken}` } }
        )
        if (!res.ok) break
        const data = await res.json()
        for (const offer of data.offers || []) {
          offersBySku[offer.sku] = offer
        }
        if ((data.offers || []).length < 100) break
        oOffset += 100
      }
    } catch (err) {
      console.warn('[ebay:sync] Inventory API fetch failed, continuing with Browse API:', err)
    }

    for (const item of inventoryItems) {
      const offer     = offersBySku[item.sku]
      const ebayItemId = offer?.listing?.listingId

      if (ebayItemId && existingIds.has(ebayItemId)) { skipped++; continue }

      const product = item.product || {}
      const avail   = item.availability?.shipToLocationAvailability || {}

      const { data: newListing, error } = await getAdmin().from('listings').insert({
        user_id:     user.id,
        title:       product.title || item.sku || 'Untitled',
        description: product.description || '',
        price:       parseFloat(offer?.pricingSummary?.price?.value || '0'),
        sku:         item.sku,
        brand:       product.brand || '',
        condition:   (item.condition || '').toLowerCase().includes('new') ? 'new' : 'used',
        quantity:    avail.quantity ?? 0,
        images:      (product.imageUrls || []).slice(0, 8),
        attributes:  product.aspects || {},
        status:      offer?.status === 'PUBLISHED' ? 'published' : 'draft',
      }).select('id').single()

      if (!error && newListing) {
        await getAdmin().from('listing_channels').insert({
          listing_id:         newListing.id,
          user_id:            user.id,
          channel_type:       'ebay',
          channel_listing_id: ebayItemId || null,
          channel_url:        ebayItemId ? `https://www.ebay.co.uk/itm/${ebayItemId}` : null,
          status:             offer?.status === 'PUBLISHED' ? 'published' : 'draft',
          published_at:       offer?.listing?.listingStartDate || null,
          category_id:        offer?.categoryId || null,
          category_name:      null,
        })
        if (ebayItemId) existingIds.add(ebayItemId)
        imported++
      }
    }

    // ── STRATEGY 2: Browse API ───────────────────────────────────────────────
    // Fetches ALL active public listings for the seller (including dashboard-
    // created ones that the Inventory API won't return).
    const sellerUsername = channel.shop_name
    if (sellerUsername && sellerUsername !== 'eBay Store') {
      try {
        const appToken = await getEbayAppToken()
        let offset = 0

        while (true) {
          const res = await fetch(
            `https://api.ebay.com/buy/browse/v1/item_summary/search?filter=sellers:{${encodeURIComponent(sellerUsername)}}&limit=200&offset=${offset}`,
            {
              headers: {
                Authorization:             `Bearer ${appToken}`,
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
                'Accept-Language':         'en-GB',
              },
            }
          )
          if (!res.ok) {
            console.warn('[ebay:sync] Browse API failed:', res.status, await res.text())
            break
          }

          const data  = await res.json()
          const items = data.itemSummaries || []

          for (const item of items) {
            const ebayItemId = parseItemId(item.itemId || '')
            if (!ebayItemId || existingIds.has(ebayItemId)) { skipped++; continue }

            const { data: newListing, error } = await getAdmin().from('listings').insert({
              user_id:     user.id,
              title:       item.title || 'Untitled',
              description: item.shortDescription || '',
              price:       parseFloat(item.price?.value || '0'),
              brand:       item.brand || '',
              category:    item.categories?.[0]?.categoryName || '',
              condition:   (item.condition || '').toLowerCase().includes('new') ? 'new' : 'used',
              quantity:    item.estimatedAvailabilities?.[0]?.estimatedAvailableQuantity ?? 1,
              images:      [
                item.image?.imageUrl,
                ...(item.additionalImages?.map((img: any) => img.imageUrl) || []),
              ].filter(Boolean).slice(0, 8),
              attributes:  {},
              status:      'published',
            }).select('id').single()

            if (!error && newListing) {
              await getAdmin().from('listing_channels').insert({
                listing_id:         newListing.id,
                user_id:            user.id,
                channel_type:       'ebay',
                channel_listing_id: ebayItemId,
                channel_url:        item.itemWebUrl || `https://www.ebay.co.uk/itm/${ebayItemId}`,
                status:             'published',
                category_id:        item.categories?.[0]?.categoryId || null,
                category_name:      item.categories?.[0]?.categoryName || null,
                published_at:       new Date().toISOString(),
              })
              existingIds.add(ebayItemId)
              imported++
            }
          }

          if (items.length < 200) break
          offset += 200
        }
      } catch (err) {
        console.warn('[ebay:sync] Browse API error:', err)
      }
    }

    // Update last_synced_at on channel
    await getAdmin()
      .from('channels')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('type', 'ebay')

    return NextResponse.json({
      imported,
      skipped,
      message: imported > 0
        ? `Synced ${imported} listing${imported !== 1 ? 's' : ''} from eBay`
        : skipped > 0
          ? `All ${skipped} eBay listings already imported`
          : 'No active eBay listings found',
    })
  } catch (err: any) {
    console.error('[ebay:sync] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
