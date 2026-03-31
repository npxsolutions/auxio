import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const getSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

// ── SHOPIFY PUBLISHER ──
async function publishToShopify(listing: any, channel: any): Promise<{ id: string; url: string }> {
  const product = {
    title:        listing.title,
    body_html:    listing.description || '',
    vendor:       listing.brand || '',
    product_type: listing.category || '',
    status:       'active',
    variants: [{
      price:            listing.price.toString(),
      compare_at_price: listing.compare_price?.toString(),
      sku:              listing.sku || '',
      barcode:          listing.barcode || '',
      weight:           listing.weight_grams ? listing.weight_grams / 1000 : undefined,
      weight_unit:      'kg',
      inventory_quantity: listing.quantity,
      inventory_management: 'shopify',
    }],
    images: (listing.images || []).map((url: string) => ({ src: url })),
  }

  const res = await fetch(`https://${channel.shop_domain}/admin/api/2024-01/products.json`, {
    method: 'POST',
    headers: {
      'Content-Type':          'application/json',
      'X-Shopify-Access-Token': channel.access_token,
    },
    body: JSON.stringify({ product }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Shopify error: ${err}`)
  }

  const { product: created } = await res.json()
  return {
    id:  created.id.toString(),
    url: `https://${channel.shop_domain}/products/${created.handle}`,
  }
}

// ── EBAY PUBLISHER ──
async function publishToEbay(listing: any, channel: any): Promise<{ id: string; url: string }> {
  // Refresh eBay token if needed
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID!}:${process.env.EBAY_CLIENT_SECRET!}`
  ).toString('base64')

  const tokenRes = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: channel.refresh_token,
      scope:         'https://api.ebay.com/oauth/api_scope/sell.inventory',
    }),
  })

  if (!tokenRes.ok) throw new Error('eBay token refresh failed')
  const { access_token } = await tokenRes.json()

  const sku = listing.sku || listing.id

  // Create inventory item
  const inventoryRes = await fetch(`https://api.ebay.com/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
    method: 'PUT',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      availability: { shipToLocationAvailability: { quantity: listing.quantity } },
      condition: listing.condition === 'new' ? 'NEW' : listing.condition === 'used' ? 'USED_EXCELLENT' : 'LIKE_NEW',
      product: {
        title:       listing.title,
        description: listing.description || listing.title,
        imageUrls:   listing.images || [],
        aspects:     listing.attributes || {},
      },
    }),
  })

  if (!inventoryRes.ok) throw new Error(`eBay inventory error: ${await inventoryRes.text()}`)

  // Create offer
  const offerRes = await fetch('https://api.ebay.com/sell/inventory/v1/offer', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      sku,
      marketplaceId:    'EBAY_GB',
      format:           'FIXED_PRICE',
      availableQuantity: listing.quantity,
      pricingSummary: {
        price: { value: listing.price.toString(), currency: 'GBP' },
      },
      listingDescription: listing.description || listing.title,
      merchantLocationKey: 'default',
    }),
  })

  if (!offerRes.ok) throw new Error(`eBay offer error: ${await offerRes.text()}`)
  const offer = await offerRes.json()

  // Publish offer
  const publishRes = await fetch(`https://api.ebay.com/sell/inventory/v1/offer/${offer.offerId}/publish`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${access_token}` },
  })

  if (!publishRes.ok) throw new Error(`eBay publish error: ${await publishRes.text()}`)
  const published = await publishRes.json()

  return {
    id:  published.listingId,
    url: `https://www.ebay.co.uk/itm/${published.listingId}`,
  }
}

// ── AMAZON PUBLISHER (STUB) ──
async function publishToAmazon(_listing: any, _channel: any): Promise<{ id: string; url: string }> {
  // Amazon SP-API listing creation requires a registered SP-API app and seller account.
  // Stub: returns a pending state. Full implementation requires:
  //   PUT /listings/2021-08-01/items/{sellerId}/{sku}
  //   with product type attributes from the Amazon Product Type Definitions API.
  throw new Error('Amazon listing creation coming soon — SP-API integration in progress')
}

// ── MAIN PUBLISH HANDLER ──
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { channels: requestedChannels }: { channels: string[] } = await request.json()
    if (!requestedChannels?.length) {
      return NextResponse.json({ error: 'Specify at least one channel' }, { status: 400 })
    }

    // Load listing
    const { data: listing } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // Load user's connected channels
    const { data: connectedChannels } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .in('type', requestedChannels)

    const results: Record<string, { status: string; error?: string; url?: string }> = {}

    await Promise.all(
      requestedChannels.map(async (channelType) => {
        const channel = connectedChannels?.find(c => c.type === channelType)

        if (!channel) {
          results[channelType] = { status: 'failed', error: `${channelType} not connected` }
          await supabase.from('listing_channels').upsert({
            listing_id: id, user_id: user.id, channel_type: channelType,
            status: 'failed', error_message: `${channelType} not connected`,
          }, { onConflict: 'listing_id,channel_type' })
          return
        }

        try {
          let published: { id: string; url: string }

          if (channelType === 'shopify') published = await publishToShopify(listing, channel)
          else if (channelType === 'ebay')  published = await publishToEbay(listing, channel)
          else if (channelType === 'amazon') published = await publishToAmazon(listing, channel)
          else throw new Error(`Unknown channel: ${channelType}`)

          results[channelType] = { status: 'published', url: published.url }

          await supabase.from('listing_channels').upsert({
            listing_id: id, user_id: user.id, channel_type: channelType,
            channel_listing_id: published.id, channel_url: published.url,
            status: 'published', published_at: new Date().toISOString(),
          }, { onConflict: 'listing_id,channel_type' })

        } catch (err: any) {
          results[channelType] = { status: 'failed', error: err.message }
          await supabase.from('listing_channels').upsert({
            listing_id: id, user_id: user.id, channel_type: channelType,
            status: 'failed', error_message: err.message,
          }, { onConflict: 'listing_id,channel_type' })
        }
      })
    )

    // Update listing status
    const allPublished  = requestedChannels.every(c => results[c]?.status === 'published')
    const anyPublished  = requestedChannels.some(c => results[c]?.status === 'published')
    const listingStatus = allPublished ? 'published' : anyPublished ? 'partially_published' : 'draft'
    await supabase.from('listings').update({ status: listingStatus }).eq('id', id)

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
