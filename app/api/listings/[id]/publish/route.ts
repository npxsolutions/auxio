import { createClient } from '@supabase/supabase-js'
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

const getAdminSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// ── RETRY WRAPPER ──
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 800
): Promise<T> {
  let lastError: Error
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastError = err
      // Don't retry on 4xx errors (bad request, auth, not found — won't succeed on retry)
      const status = err.status || err.statusCode
      if (status && status >= 400 && status < 500) throw err
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt - 1)))
      }
    }
  }
  throw lastError!
}

// ── PRE-PUBLISH VALIDATION ──
function validateForChannel(listing: any, channelType: string): string[] {
  const errors: string[] = []

  if (!listing.title?.trim())           errors.push('Title is required')
  if (!listing.price || listing.price <= 0) errors.push('Price must be greater than 0')
  if (listing.quantity == null || listing.quantity < 0) errors.push('Quantity cannot be negative')

  if (channelType === 'ebay') {
    if (listing.title.length > 80)
      errors.push(`eBay title must be ≤80 characters (currently ${listing.title.length})`)
    if (!listing.description?.trim())  errors.push('eBay requires a description')
    if (!listing.condition)            errors.push('eBay requires a condition')
  }

  if (channelType === 'shopify') {
    if (listing.title.length > 255)
      errors.push(`Shopify title must be ≤255 characters (currently ${listing.title.length})`)
  }

  if (channelType === 'amazon') {
    if (listing.title.length > 200)
      errors.push(`Amazon title must be ≤200 characters (currently ${listing.title.length})`)
    if (!listing.barcode?.trim()) errors.push('Amazon requires a barcode (UPC or EAN)')
    if (!listing.brand?.trim())   errors.push('Amazon requires a brand name')
    if (!listing.description?.trim()) errors.push('Amazon requires a description')
  }

  return errors
}

// ── SHOPIFY PUBLISHER ──
async function publishToShopify(
  listing: any,
  channel: any,
  existingChannelListingId?: string | null
): Promise<{ id: string; url: string }> {
  const product = {
    title:        listing.title,
    body_html:    listing.description || '',
    vendor:       listing.brand || '',
    product_type: listing.category || '',
    status:       'active',
    variants: [{
      price:                listing.price.toString(),
      compare_at_price:     listing.compare_price?.toString(),
      sku:                  listing.sku || '',
      barcode:              listing.barcode || '',
      weight:               listing.weight_grams ? listing.weight_grams / 1000 : undefined,
      weight_unit:          'kg',
      inventory_quantity:   listing.quantity ?? 0,
      inventory_management: 'shopify',
    }],
    images: (listing.images || []).map((url: string) => ({ src: url })),
  }

  // If already published — update instead of create (idempotency)
  if (existingChannelListingId) {
    const res = await fetch(
      `https://${channel.shop_domain}/admin/api/2024-01/products/${existingChannelListingId}.json`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': channel.access_token },
        body: JSON.stringify({ product }),
      }
    )
    if (!res.ok) throw Object.assign(new Error(`Shopify update error: ${await res.text()}`), { status: res.status })
    const { product: updated } = await res.json()
    return { id: updated.id.toString(), url: `https://${channel.shop_domain}/products/${updated.handle}` }
  }

  const res = await fetch(`https://${channel.shop_domain}/admin/api/2024-01/products.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': channel.access_token },
    body: JSON.stringify({ product }),
  })
  if (!res.ok) throw Object.assign(new Error(`Shopify error: ${await res.text()}`), { status: res.status })
  const { product: created } = await res.json()
  return { id: created.id.toString(), url: `https://${channel.shop_domain}/products/${created.handle}` }
}

// ── EBAY HELPERS ──
async function getEbayAccessToken(refreshToken: string): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID!}:${process.env.EBAY_CLIENT_SECRET!}`
  ).toString('base64')
  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${credentials}` },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      scope: [
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
        'https://api.ebay.com/oauth/api_scope/sell.account',
      ].join(' '),
    }),
  })
  if (!res.ok) throw Object.assign(new Error(`eBay token refresh failed: ${await res.text()}`), { status: res.status })
  const { access_token } = await res.json()
  return access_token
}

async function getEbayPolicies(accessToken: string) {
  const h = { Authorization: `Bearer ${accessToken}` }
  const [fp, pp, rp] = await Promise.all([
    fetch('https://api.ebay.com/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_GB', { headers: h }).then(r => r.json()),
    fetch('https://api.ebay.com/sell/account/v1/payment_policy?marketplace_id=EBAY_GB',     { headers: h }).then(r => r.json()),
    fetch('https://api.ebay.com/sell/account/v1/return_policy?marketplace_id=EBAY_GB',      { headers: h }).then(r => r.json()),
  ])
  const fulfillmentPolicyId = fp.fulfillmentPolicies?.[0]?.fulfillmentPolicyId
  const paymentPolicyId     = pp.paymentPolicies?.[0]?.paymentPolicyId
  const returnPolicyId      = rp.returnPolicies?.[0]?.returnPolicyId
  if (!fulfillmentPolicyId || !paymentPolicyId || !returnPolicyId) {
    throw new Error('eBay business policies not set up. Go to My eBay → Account → Business Policies and create Postage, Payment, and Returns policies.')
  }
  return { fulfillmentPolicyId, paymentPolicyId, returnPolicyId }
}

async function getOrCreateEbayLocation(accessToken: string): Promise<string> {
  const h = { Authorization: `Bearer ${accessToken}` }
  const res  = await fetch('https://api.ebay.com/sell/inventory/v1/location', { headers: h })
  const data = await res.json()
  if (data.locations?.length) return data.locations[0].merchantLocationKey
  const key = 'AUXIO_DEFAULT'
  await fetch(`https://api.ebay.com/sell/inventory/v1/location/${key}`, {
    method: 'POST',
    headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: { address: { country: 'GB' } },
      locationTypes: ['WAREHOUSE'],
      merchantLocationStatus: 'ENABLED',
      name: 'Default',
    }),
  })
  return key
}

// ── EBAY PUBLISHER ──
async function publishToEbay(listing: any, channel: any): Promise<{ id: string; url: string }> {
  const access_token = await getEbayAccessToken(channel.refresh_token)

  const [policies, locationKey] = await Promise.all([
    getEbayPolicies(access_token),
    getOrCreateEbayLocation(access_token),
  ])

  const sku = listing.sku || listing.id

  // PUT is idempotent — creates or updates the inventory item by SKU
  const inventoryRes = await fetch(
    `https://api.ebay.com/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Content-Language': 'en-GB', 'Accept-Language': 'en-GB', 'Authorization': `Bearer ${access_token}` },
      body: JSON.stringify({
        availability: { shipToLocationAvailability: { quantity: listing.quantity ?? 1 } },
        condition: listing.condition === 'new' ? 'NEW' : listing.condition === 'used' ? 'USED_EXCELLENT' : 'LIKE_NEW',
        product: {
          title:       listing.title,
          description: listing.description || listing.title,
          imageUrls:   listing.images || [],
          aspects:     listing.attributes || {},
        },
      }),
    }
  )
  if (!inventoryRes.ok) {
    throw Object.assign(new Error(`eBay inventory error: ${await inventoryRes.text()}`), { status: inventoryRes.status })
  }

  // Check if offer already exists for this SKU (idempotency)
  const existingOffersRes = await fetch(
    `https://api.ebay.com/sell/inventory/v1/offer?sku=${encodeURIComponent(sku)}`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  )
  const existingOffers = existingOffersRes.ok ? await existingOffersRes.json() : {}
  const existingOffer  = existingOffers.offers?.[0]

  const offerBody = {
    sku,
    marketplaceId:      'EBAY_GB',
    format:             'FIXED_PRICE',
    availableQuantity:  listing.quantity ?? 1,
    pricingSummary: {
      price: { value: listing.price.toString(), currency: 'GBP' },
    },
    listingDescription:  listing.description || listing.title,
    merchantLocationKey: locationKey,
    listingPolicies: {
      fulfillmentPolicyId: policies.fulfillmentPolicyId,
      paymentPolicyId:     policies.paymentPolicyId,
      returnPolicyId:      policies.returnPolicyId,
    },
  }

  let offerId: string

  if (existingOffer) {
    // Update existing offer
    const updateRes = await fetch(`https://api.ebay.com/sell/inventory/v1/offer/${existingOffer.offerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` },
      body: JSON.stringify(offerBody),
    })
    if (!updateRes.ok) throw Object.assign(new Error(`eBay offer update error: ${await updateRes.text()}`), { status: updateRes.status })
    offerId = existingOffer.offerId
  } else {
    const offerRes = await fetch('https://api.ebay.com/sell/inventory/v1/offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` },
      body: JSON.stringify(offerBody),
    })
    if (!offerRes.ok) throw Object.assign(new Error(`eBay offer error: ${await offerRes.text()}`), { status: offerRes.status })
    const offer = await offerRes.json()
    offerId = offer.offerId
  }

  // Publish offer (idempotent — if already live, eBay returns the same listing ID)
  const publishRes = await fetch(`https://api.ebay.com/sell/inventory/v1/offer/${offerId}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}` },
  })
  if (!publishRes.ok) throw Object.assign(new Error(`eBay publish error: ${await publishRes.text()}`), { status: publishRes.status })
  const published = await publishRes.json()

  return {
    id:  published.listingId,
    url: `https://www.ebay.co.uk/itm/${published.listingId}`,
  }
}

// ── AMAZON PUBLISHER ──
async function publishToAmazon(_listing: any, _channel: any): Promise<{ id: string; url: string }> {
  throw new Error('Amazon listing creation coming soon — SP-API integration in progress')
}

// ── MAIN HANDLER ──
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase      = await getSupabase()
    const adminSupabase = getAdminSupabase()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { channels: requestedChannels }: { channels: string[] } = await request.json()
    if (!requestedChannels?.length) {
      return NextResponse.json({ error: 'Specify at least one channel' }, { status: 400 })
    }

    // Load listing
    const { data: listing } = await supabase
      .from('listings').select('*')
      .eq('id', id).eq('user_id', user.id).single()
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // Load connected channels + existing publish state
    const [{ data: connectedChannels }, { data: existingChannelListings }] = await Promise.all([
      supabase.from('channels').select('*').eq('user_id', user.id).eq('active', true).in('type', requestedChannels),
      supabase.from('listing_channels').select('*').eq('listing_id', id),
    ])

    const results: Record<string, { status: string; error?: string; url?: string; validation_errors?: string[] }> = {}

    await Promise.all(
      requestedChannels.map(async (channelType) => {
        // Pre-publish validation
        const validationErrors = validateForChannel(listing, channelType)
        if (validationErrors.length) {
          results[channelType] = { status: 'failed', validation_errors: validationErrors, error: validationErrors[0] }
          await adminSupabase.from('listing_channels').upsert({
            listing_id: id, user_id: user.id, channel_type: channelType,
            status: 'failed', error_message: `Validation: ${validationErrors.join('; ')}`,
          }, { onConflict: 'listing_id,channel_type' })
          return
        }

        const channel = connectedChannels?.find(c => c.type === channelType)
        if (!channel) {
          results[channelType] = { status: 'failed', error: `${channelType} not connected` }
          await adminSupabase.from('listing_channels').upsert({
            listing_id: id, user_id: user.id, channel_type: channelType,
            status: 'failed', error_message: `${channelType} not connected`,
          }, { onConflict: 'listing_id,channel_type' })
          return
        }

        const existingCL = existingChannelListings?.find(cl => cl.channel_type === channelType)

        try {
          let published: { id: string; url: string }

          if (channelType === 'shopify') {
            published = await withRetry(() =>
              publishToShopify(listing, channel, existingCL?.status === 'published' ? existingCL.channel_listing_id : null)
            )
          } else if (channelType === 'ebay') {
            published = await withRetry(() => publishToEbay(listing, channel))
          } else if (channelType === 'amazon') {
            published = await withRetry(() => publishToAmazon(listing, channel))
          } else {
            throw new Error(`Unknown channel: ${channelType}`)
          }

          results[channelType] = { status: 'published', url: published.url }

          // Update listing_channels and sync state in parallel
          await Promise.all([
            adminSupabase.from('listing_channels').upsert({
              listing_id: id, user_id: user.id, channel_type: channelType,
              channel_listing_id: published.id, channel_url: published.url,
              status: 'published', published_at: new Date().toISOString(),
            }, { onConflict: 'listing_id,channel_type' }),

            adminSupabase.from('channel_sync_state').upsert({
              listing_id:               id,
              user_id:                  user.id,
              channel_type:             channelType,
              last_synced_at:           new Date().toISOString(),
              last_synced_price:        listing.price,
              last_synced_quantity:     listing.quantity,
              last_synced_title:        listing.title,
              last_synced_description:  listing.description,
              last_error:               null,
              sync_attempts:            0,
            }, { onConflict: 'listing_id,channel_type' }),
          ])

        } catch (err: any) {
          results[channelType] = { status: 'failed', error: err.message }
          await adminSupabase.from('listing_channels').upsert({
            listing_id: id, user_id: user.id, channel_type: channelType,
            status: 'failed', error_message: err.message,
          }, { onConflict: 'listing_id,channel_type' })

          await adminSupabase.from('channel_sync_state').upsert({
            listing_id:    id,
            user_id:       user.id,
            channel_type:  channelType,
            last_error:    err.message,
            sync_attempts: (existingCL ? 1 : 0) + 1,
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
