import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { applyFeedRules, applyFieldMappings } from '@/app/lib/feed-rules'
import { validateForChannel as preflightValidate } from '@/app/lib/feed/validator'
import { mapEbayError } from '@/app/lib/feed/ebay-error-dictionary'
// BUNDLE_C: policies ensure + variant group imports
import { ensureEbayPolicies, EbayPolicyError, type EbayPolicySet } from '@/app/lib/ebay/policies'
import { planVariantGroup, upsertInventoryItemGroup, upsertGroupOffer, type ShopifyProduct } from '@/app/lib/ebay/variants'

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
    if (!listing.images?.length)       errors.push('eBay requires at least one product image')
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

  async function fetchPolicy(url: string) {
    const res = await fetch(url, { headers: h })
    if (!res.ok) throw Object.assign(new Error(`eBay policy fetch failed (${res.status}): ${await res.text()}`), { status: res.status })
    return res.json()
  }

  const [fp, pp, rp] = await Promise.all([
    fetchPolicy('https://api.ebay.com/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_GB'),
    fetchPolicy('https://api.ebay.com/sell/account/v1/payment_policy?marketplace_id=EBAY_GB'),
    fetchPolicy('https://api.ebay.com/sell/account/v1/return_policy?marketplace_id=EBAY_GB'),
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
  const createRes = await fetch(`https://api.ebay.com/sell/inventory/v1/location/${key}`, {
    method: 'POST',
    headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: { address: { country: 'GB' } },
      locationTypes: ['WAREHOUSE'],
      merchantLocationStatus: 'ENABLED',
      name: 'Default',
    }),
  })
  if (!createRes.ok) {
    const body = await createRes.text()
    throw Object.assign(new Error(`eBay location creation failed: ${body}`), { status: createRes.status })
  }
  return key
}

// ── EBAY PUBLISHER ──
async function publishToEbay(listing: any, channel: any, categoryId?: string, aspectValues?: Record<string, string>): Promise<{ id: string; url: string }> {
  console.log(`[ebay:publish] listing=${listing.id} sku=${listing.sku || listing.id} categoryId=${categoryId}`)
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
          // eBay Inventory API requires aspects as Record<string, string[]>
          aspects: Object.fromEntries(
            Object.entries({ ...(listing.attributes || {}), ...(aspectValues || {}) })
              .map(([k, v]) => [k, Array.isArray(v) ? v : [String(v)]])
          ),
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

  const offerBody: Record<string, any> = {
    sku,
    marketplaceId:      'EBAY_GB',
    format:             'FIXED_PRICE',
    availableQuantity:  listing.quantity ?? 1,
    ...(categoryId ? { categoryId } : {}),
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

// ── AMAZON SP-API PUBLISHER ──
async function getAmazonAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     process.env.AMAZON_CLIENT_ID!,
      client_secret: process.env.AMAZON_CLIENT_SECRET!,
    }),
  })
  if (!res.ok) throw Object.assign(new Error(`Amazon token error: ${await res.text()}`), { status: res.status })
  const { access_token } = await res.json()
  return access_token
}

async function publishToAmazon(listing: any, channel: any): Promise<{ id: string; url: string }> {
  if (!process.env.AMAZON_CLIENT_ID || !process.env.AMAZON_CLIENT_SECRET) {
    throw new Error('Amazon SP-API credentials not configured (AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET)')
  }

  const accessToken  = await getAmazonAccessToken(channel.refresh_token)
  const sellerId     = channel.seller_id
  const marketplaceId = channel.marketplace_id || 'A1F83G8C2ARO7P' //  default
  const sku          = listing.sku || listing.id

  const spApiEndpoint = 'https://sellingpartnerapi-eu.amazon.com'

  const body = {
    productType: listing.amazon_product_type || 'PRODUCT',
    requirements: 'LISTING',
    attributes: {
      item_name:       [{ value: listing.title,        language_tag: 'en_GB', marketplace_id: marketplaceId }],
      product_description: listing.description
        ? [{ value: listing.description, language_tag: 'en_GB', marketplace_id: marketplaceId }]
        : undefined,
      brand:           listing.brand    ? [{ value: listing.brand,    language_tag: 'en_GB', marketplace_id: marketplaceId }] : undefined,
      externally_assigned_product_identifier: listing.barcode
        ? [{ type: listing.barcode.length === 13 ? 'ean' : 'upc', value: listing.barcode }]
        : undefined,
      fulfillment_availability: [{
        fulfillment_channel_code: 'DEFAULT',
        quantity: listing.quantity ?? 0,
      }],
      purchasable_offer: [{
        marketplace_id: marketplaceId,
        currency:       'GBP',
        our_price:      [{ schedule: [{ value_with_tax: listing.price }] }],
      }],
      condition_type: [{ value: listing.condition === 'new' ? 'new_new' : 'used_good', marketplace_id: marketplaceId }],
      // Spread any additional channel-specific attributes stored on the listing
      ...(listing.attributes || {}),
    },
  }

  const res = await fetch(
    `${spApiEndpoint}/listings/2021-08-01/items/${sellerId}/${encodeURIComponent(sku)}?marketplaceIds=${marketplaceId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-amz-access-token': accessToken,
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw Object.assign(new Error(`Amazon SP-API error (${res.status}): ${errText}`), { status: res.status })
  }

  const data = await res.json()

  // SP-API PUT returns status 200 for updates, 201 for new listings
  // ASIN is returned in the response for new listings; for updates it may require a separate lookup
  const asin = data.asin || sku

  return {
    id:  asin,
    url: `https://www.amazon.co.uk/dp/${asin}`,
  }
}

// ── MAIN HANDLER ──
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase      = await getSupabase()
    const adminSupabase = getAdminSupabase()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: {
      channels: string[]
      categorySelections?: Record<string, { id: string; name: string } | null>
      aspectValues?: Record<string, string>
    } = await request.json()
    const { channels: requestedChannels, categorySelections = {}, aspectValues = {} } = body
    if (!requestedChannels?.length) {
      return NextResponse.json({ error: 'Specify at least one channel' }, { status: 400 })
    }

    // Load listing
    const { data: listing } = await supabase
      .from('listings').select('*')
      .eq('id', id).eq('user_id', user.id).single()
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // Load connected channels + existing publish state + saved category mappings + feed rules + field mappings
    const [
      { data: connectedChannels },
      { data: existingChannelListings },
      { data: savedMappings },
      { data: feedRules },
      { data: fieldMappings },
    ] = await Promise.all([
      supabase.from('channels').select('*').eq('user_id', user.id).eq('active', true).in('type', requestedChannels),
      supabase.from('listing_channels').select('*').eq('listing_id', id),
      listing.category
        ? supabase.from('category_mappings').select('*').eq('user_id', user.id).eq('source_category', listing.category)
        : Promise.resolve({ data: [] }),
      supabase.from('feed_rules').select('id,name,channel,conditions,actions,active,priority')
        .eq('user_id', user.id).eq('active', true).order('priority', { ascending: true }),
      supabase.from('field_mappings').select('source_field,target_field,transform,template')
        .eq('user_id', user.id),
    ])

    // Merge caller-supplied category selections with saved mappings (caller wins)
    const mergedCategorySelections: Record<string, { id: string; name: string } | null> = {}
    for (const m of savedMappings || []) {
      if (m.channel_cat_id) {
        mergedCategorySelections[m.channel_type] = { id: m.channel_cat_id, name: m.channel_cat_name || '' }
      }
    }
    Object.assign(mergedCategorySelections, categorySelections)

    // If caller provided a new category selection, persist it for future publishes
    for (const [ch, sel] of Object.entries(categorySelections)) {
      if (sel && listing.category) {
        await adminSupabase.from('category_mappings').upsert({
          user_id: user.id, source_category: listing.category, channel_type: ch,
          channel_cat_id: sel.id, channel_cat_name: sel.name,
        }, { onConflict: 'user_id,source_category,channel_type' }).then(() => {}, () => {})
      }
    }

    const results: Record<string, { status: string; error?: string; url?: string; validation_errors?: string[] }> = {}

    // BUNDLE_C: policies ensure — run before pre-flight so EBAY_BUSINESS_POLICIES
    // flips green on first-run sellers. Only fires when eBay is in requestedChannels
    // and an eBay channel is connected. Failures return a typed 502 early.
    let ensuredEbayPolicies: EbayPolicySet | null = null
    if (requestedChannels.includes('ebay')) {
      const ebayChannel = connectedChannels?.find(c => c.type === 'ebay')
      if (ebayChannel) {
        try {
          const res = await ensureEbayPolicies(ebayChannel, adminSupabase)
          ensuredEbayPolicies = {
            paymentPolicyId: res.paymentPolicyId,
            returnPolicyId: res.returnPolicyId,
            fulfillmentPolicyId: res.fulfillmentPolicyId,
          }
          // Re-hydrate the in-memory channel row so the preflight validator reads
          // the freshly persisted metadata without another DB round-trip.
          ebayChannel.metadata = {
            ...(ebayChannel.metadata ?? {}),
            ebay_policies: {
              paymentPolicyId: res.paymentPolicyId, payment_policy_id: res.paymentPolicyId,
              returnPolicyId: res.returnPolicyId,   return_policy_id:  res.returnPolicyId,
              fulfillmentPolicyId: res.fulfillmentPolicyId, fulfillment_policy_id: res.fulfillmentPolicyId,
              provisioned_at: res.provisionedAt,
            },
          }
        } catch (err) {
          const what = err instanceof EbayPolicyError ? `${err.policy} — ${err.cause}` : (err as Error).message
          return NextResponse.json(
            { error: `ebay policies provisioning failed: ${what}` },
            { status: 502 },
          )
        }
      }
    }

    await Promise.all(
      requestedChannels.map(async (channelType) => {
        // Pre-publish validation: framework first (eBay etc.), legacy fallback for others
        if (channelType === 'ebay') {
          const preflight = await preflightValidate(id, 'ebay')
          if (!preflight.passed) {
            const errMsgs = preflight.issues
              .filter(i => i.rule.severity === 'error')
              .map(i => i.rule.message)
            console.warn(`[api/listings/publish] blocked_preflight listing=${id} channel=ebay errors=${errMsgs.length}`)
            results[channelType] = { status: 'failed', validation_errors: errMsgs, error: errMsgs[0] || 'pre-flight failed' }
            await adminSupabase.from('listing_channels').upsert({
              listing_id: id, user_id: user.id, channel_type: channelType,
              status: 'failed', error_message: `Validation: ${errMsgs.join('; ')}`,
            }, { onConflict: 'listing_id,channel_type' })
            await adminSupabase.from('sync_log').insert({
              user_id: user.id, channel: 'ebay', listing_id: id,
              level: 'blocked_preflight',
              message: `pre-flight blocked: ${errMsgs.join('; ')}`,
              metadata: { validation: preflight },
            }).then(() => {}, () => {})
            return
          }
        } else {
          const validationErrors = validateForChannel(listing, channelType)
          if (validationErrors.length) {
            results[channelType] = { status: 'failed', validation_errors: validationErrors, error: validationErrors[0] }
            await adminSupabase.from('listing_channels').upsert({
              listing_id: id, user_id: user.id, channel_type: channelType,
              status: 'failed', error_message: `Validation: ${validationErrors.join('; ')}`,
            }, { onConflict: 'listing_id,channel_type' })
            return
          }
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

          // Apply feed rules (channel-specific first, then 'all'), then field mappings
          const transformed = applyFieldMappings(
            applyFeedRules(listing, (feedRules || []) as any, channelType),
            (fieldMappings || []).filter(m => !('channel_type' in m) || (m as any).channel_type === channelType)
          )

          if (channelType === 'shopify') {
            published = await withRetry(() =>
              publishToShopify(transformed, channel, existingCL?.status === 'published' ? existingCL.channel_listing_id : null)
            )
          } else if (channelType === 'ebay') {
            const ebayCategory = mergedCategorySelections['ebay']
            // BUNDLE_C: variant group branch — when the Shopify product under
            // this listing has >1 distinct-axis variants, publish as one eBay
            // InventoryItemGroup (single listing with variations) instead of
            // the default single-listing path.
            const shopifyProduct = (transformed as { shopify_product?: ShopifyProduct }).shopify_product
            const variantPlan = shopifyProduct ? planVariantGroup(shopifyProduct) : null
            if (variantPlan && ensuredEbayPolicies && ebayCategory?.id) {
              const access_token = await getEbayAccessToken(channel.refresh_token)
              await upsertInventoryItemGroup(access_token, variantPlan)
              const { groupExternalId } = await upsertGroupOffer(
                access_token,
                variantPlan,
                ebayCategory.id,
                ensuredEbayPolicies,
                { marketplaceId: (channel.metadata?.ebay_marketplace as string) || 'EBAY_US' },
              )
              published = {
                id: groupExternalId || variantPlan.groupSku,
                url: `https://www.ebay.com/itm/${groupExternalId || variantPlan.groupSku}`,
              }
              await adminSupabase.from('listing_channel_groups').upsert({
                user_id: user.id,
                listing_id: id,
                channel: 'ebay',
                group_sku: variantPlan.groupSku,
                group_external_id: groupExternalId ?? null,
                variation_axes: variantPlan.variationSpecifics,
                child_skus: variantPlan.items.map(it => it.sku),
                last_published_at: new Date().toISOString(),
              }, { onConflict: 'user_id,listing_id,channel,group_sku' })
              // Mark listing_channel row as group-type downstream
              await adminSupabase.from('listing_channels').upsert({
                listing_id: id, user_id: user.id, channel_type: 'ebay',
                channel_listing_id: published.id, channel_url: published.url,
                status: 'published', published_at: new Date().toISOString(),
                external_type: 'group', external_group_id: variantPlan.groupSku,
              }, { onConflict: 'listing_id,channel_type' }).then(() => {}, () => {})
            } else {
              published = await withRetry(() => publishToEbay(transformed, channel, ebayCategory?.id, aspectValues))
            }
          } else if (channelType === 'amazon') {
            published = await withRetry(() => publishToAmazon(transformed, channel))
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
              ...(categorySelections[channelType] ? {
                category_id:   categorySelections[channelType]!.id,
                category_name: categorySelections[channelType]!.name,
              } : {}),
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
          let surfaced = err.message as string
          if (channelType === 'ebay') {
            const parsed = mapEbayError(String(err.message || ''))
            if (parsed.mapped) {
              surfaced = `${parsed.mapped.plainMessage} — ${parsed.mapped.remediation}`
              console.warn(`[api/listings/publish] ebay_error_mapped code=${parsed.mapped.code} listing=${id}`)
            } else {
              console.warn(`[api/listings/publish] unknown_ebay_error listing=${id} raw=${parsed.raw.slice(0, 200)}`)
              await adminSupabase.from('sync_log').insert({
                user_id: user.id, channel: 'ebay', listing_id: id,
                level: 'unknown_ebay_error',
                message: parsed.raw.slice(0, 1000),
                metadata: { errorId: parsed.errorId },
              }).then(() => {}, () => {})
            }
          }
          results[channelType] = { status: 'failed', error: surfaced }
          await adminSupabase.from('listing_channels').upsert({
            listing_id: id, user_id: user.id, channel_type: channelType,
            status: 'failed', error_message: surfaced,
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
