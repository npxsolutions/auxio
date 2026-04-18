/**
 * eBay push — takes an internal listing and pushes it to eBay via the
 * Inventory API (create/update inventory item + create/update offer + publish).
 *
 * Extracted from app/api/listings/[id]/publish/route.ts so it can be called
 * from the sync engine, webhooks, and the manual publish flow.
 *
 * Supports:
 *   - Single-variant listings (inventory_item + offer)
 *   - Multi-variant listings via InventoryItemGroup (delegated to ebay/variants.ts)
 *   - Auto-provisioning of eBay business policies
 *   - Aspect enrichment from listing attributes
 *   - Retry with exponential backoff on 5xx / network errors
 *
 * Log prefix: [sync:ebay-push]
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getEbayAccessToken, ebayHeaders, type EbayChannelRow } from '@/app/lib/ebay/auth'
import { ensureEbayPolicies, type EbayPolicySet, resolveMarketplaceId } from '@/app/lib/ebay/policies'
import { withRateLimit } from '@/app/lib/rate-limit/channel'
import { syncFetch } from './http'
import { recordDeadLetter } from './jobs'

const INVENTORY_BASE = 'https://api.ebay.com/sell/inventory/v1'

const getAdmin = (): SupabaseClient =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

// ── Types ──────────────────────────────────────────────────────────────────

export interface EbayPushListing {
  id: string
  title: string
  description: string
  price: number
  quantity: number
  sku: string
  condition: string
  images: string[]
  brand?: string
  attributes?: Record<string, unknown>
  weight_grams?: number | null
  barcode?: string | null
}

export interface EbayPushOptions {
  userId: string
  listing: EbayPushListing
  /** eBay leaf category ID. If missing, push will fail validation. */
  categoryId?: string
  /** Additional aspect key/value pairs merged onto the listing. */
  aspectValues?: Record<string, string>
  /** eBay marketplace ID — defaults to EBAY_GB. */
  marketplaceId?: string
  /** Currency — defaults to GBP. */
  currency?: string
}

export interface EbayPushResult {
  success: boolean
  listingId?: string
  offerId?: string
  url?: string
  error?: string
}

// ── Main push function ─────────────────────────────────────────────────────

export async function pushListingToEbay(opts: EbayPushOptions): Promise<EbayPushResult> {
  const supabase = getAdmin()
  const { userId, listing, categoryId, aspectValues = {} } = opts
  const marketplaceId = opts.marketplaceId ?? 'EBAY_GB'
  const currency = opts.currency ?? 'GBP'
  const sku = listing.sku || listing.id

  console.log(`[sync:ebay-push] listing=${listing.id} sku=${sku} category=${categoryId}`)

  try {
    // 1. Get eBay channel credentials
    const { data: channel } = await supabase
      .from('channels')
      .select('id, user_id, access_token, refresh_token, metadata')
      .eq('user_id', userId)
      .eq('type', 'ebay')
      .eq('active', true)
      .single()

    if (!channel?.access_token) {
      return { success: false, error: 'No active eBay channel connected' }
    }

    // 2. Get valid access token (refresh if needed)
    const tokenResult = await getEbayAccessToken(
      channel as unknown as EbayChannelRow,
      supabase,
    )
    if (!tokenResult) {
      return { success: false, error: 'eBay token refresh failed — reconnect eBay' }
    }
    const accessToken = tokenResult.accessToken

    // 3. Ensure business policies exist
    let policies: EbayPolicySet
    try {
      const result = await ensureEbayPolicies(
        channel as unknown as { id: string; user_id: string; access_token: string | null; metadata: Record<string, unknown> | null },
        supabase,
      )
      policies = {
        paymentPolicyId: result.paymentPolicyId,
        returnPolicyId: result.returnPolicyId,
        fulfillmentPolicyId: result.fulfillmentPolicyId,
      }
    } catch (err) {
      return { success: false, error: `eBay policy setup failed: ${(err as Error).message}` }
    }

    // 4. Get or create merchant location
    const locationKey = await withRateLimit('ebay', userId, () =>
      getOrCreateLocation(accessToken),
    )

    // 5. Build and PUT inventory item
    const conditionMap: Record<string, string> = {
      new: 'NEW',
      used: 'USED_EXCELLENT',
      refurbished: 'SELLER_REFURBISHED',
      'like new': 'LIKE_NEW',
      'for parts': 'FOR_PARTS_OR_NOT_WORKING',
    }
    const ebayCondition = conditionMap[listing.condition?.toLowerCase() ?? ''] ?? 'NEW'

    // Merge listing attributes with explicit aspect values (explicit wins)
    const mergedAspects: Record<string, string[]> = {}
    const rawAttrs = { ...(listing.attributes ?? {}), ...aspectValues }
    if (listing.brand) rawAttrs['Brand'] = listing.brand
    for (const [k, v] of Object.entries(rawAttrs)) {
      if (v == null || String(v).trim() === '') continue
      mergedAspects[k] = Array.isArray(v) ? v.map(String) : [String(v)]
    }

    const inventoryBody = {
      availability: { shipToLocationAvailability: { quantity: listing.quantity } },
      condition: ebayCondition,
      product: {
        title: listing.title.slice(0, 80), // eBay 80-char limit
        description: listing.description || listing.title,
        imageUrls: listing.images.slice(0, 12),
        aspects: mergedAspects,
        ...(listing.barcode ? { ean: [listing.barcode] } : {}),
      },
      ...(listing.weight_grams ? {
        packageWeightAndSize: {
          weight: {
            value: listing.weight_grams,
            unit: 'GRAM',
          },
        },
      } : {}),
    }

    const inventoryRes = await withRateLimit('ebay', userId, () =>
      syncFetch(`${INVENTORY_BASE}/inventory_item/${encodeURIComponent(sku)}`, {
        method: 'PUT',
        headers: ebayHeaders({ accessToken, contentLanguage: 'en-GB' }),
        body: JSON.stringify(inventoryBody),
        label: 'ebay-push.inventory_item',
      }),
    )

    if (!inventoryRes.ok) {
      const errText = await inventoryRes.text()
      throw new Error(`inventory_item PUT failed (${inventoryRes.status}): ${errText.slice(0, 400)}`)
    }

    // 6. Create or update offer
    const existingOffersRes = await withRateLimit('ebay', userId, () =>
      syncFetch(`${INVENTORY_BASE}/offer?sku=${encodeURIComponent(sku)}`, {
        headers: ebayHeaders({ accessToken }),
        label: 'ebay-push.offer.list',
      }),
    )
    const existingOffers = existingOffersRes.ok
      ? (await existingOffersRes.json()) as { offers?: Array<{ offerId?: string }> }
      : { offers: [] }
    const existingOfferId = existingOffers.offers?.[0]?.offerId

    const offerBody: Record<string, unknown> = {
      sku,
      marketplaceId,
      format: 'FIXED_PRICE',
      availableQuantity: listing.quantity,
      ...(categoryId ? { categoryId } : {}),
      pricingSummary: {
        price: { value: listing.price.toString(), currency },
      },
      listingDescription: listing.description || listing.title,
      merchantLocationKey: locationKey,
      listingPolicies: {
        fulfillmentPolicyId: policies.fulfillmentPolicyId,
        paymentPolicyId: policies.paymentPolicyId,
        returnPolicyId: policies.returnPolicyId,
      },
    }

    let offerId: string

    if (existingOfferId) {
      const res = await withRateLimit('ebay', userId, () =>
        syncFetch(`${INVENTORY_BASE}/offer/${existingOfferId}`, {
          method: 'PUT',
          headers: ebayHeaders({ accessToken }),
          body: JSON.stringify(offerBody),
          label: 'ebay-push.offer.put',
        }),
      )
      if (!res.ok) {
        throw new Error(`offer PUT failed (${res.status}): ${(await res.text()).slice(0, 400)}`)
      }
      offerId = existingOfferId
    } else {
      const res = await withRateLimit('ebay', userId, () =>
        syncFetch(`${INVENTORY_BASE}/offer`, {
          method: 'POST',
          headers: ebayHeaders({ accessToken }),
          body: JSON.stringify(offerBody),
          label: 'ebay-push.offer.post',
        }),
      )
      if (!res.ok) {
        throw new Error(`offer POST failed (${res.status}): ${(await res.text()).slice(0, 400)}`)
      }
      const created = (await res.json()) as { offerId?: string }
      offerId = created.offerId ?? ''
    }

    // 7. Publish offer
    const publishRes = await withRateLimit('ebay', userId, () =>
      syncFetch(`${INVENTORY_BASE}/offer/${offerId}/publish`, {
        method: 'POST',
        headers: ebayHeaders({ accessToken }),
        label: 'ebay-push.offer.publish',
      }),
    )
    if (!publishRes.ok) {
      throw new Error(`offer publish failed (${publishRes.status}): ${(await publishRes.text()).slice(0, 400)}`)
    }
    const published = (await publishRes.json()) as { listingId?: string }
    const ebayListingId = published.listingId ?? ''
    const url = `https://www.ebay.co.uk/itm/${ebayListingId}`

    // 8. Update sync state in DB
    await Promise.all([
      supabase.from('listing_channels').upsert(
        {
          listing_id: listing.id,
          user_id: userId,
          channel_type: 'ebay',
          channel_listing_id: ebayListingId,
          channel_url: url,
          status: 'published',
          published_at: new Date().toISOString(),
          ...(categoryId ? { category_id: categoryId } : {}),
        },
        { onConflict: 'listing_id,channel_type' },
      ),
      supabase.from('channel_sync_state').upsert(
        {
          listing_id: listing.id,
          user_id: userId,
          channel_type: 'ebay',
          last_synced_at: new Date().toISOString(),
          last_synced_price: listing.price,
          last_synced_quantity: listing.quantity,
          last_synced_title: listing.title,
          last_synced_description: listing.description,
          sync_attempts: 0,
          last_error: null,
        },
        { onConflict: 'listing_id,channel_type' },
      ),
    ])

    console.log(`[sync:ebay-push] success listing=${listing.id} ebayId=${ebayListingId}`)
    return { success: true, listingId: ebayListingId, offerId, url }
  } catch (err) {
    const errMsg = (err as Error).message
    console.error(`[sync:ebay-push] failed listing=${listing.id}: ${errMsg}`)

    // Record the error on channel_sync_state
    await supabase.from('channel_sync_state').upsert(
      {
        listing_id: listing.id,
        user_id: userId,
        channel_type: 'ebay',
        last_error: errMsg.slice(0, 2000),
        sync_attempts: 1, // will be incremented by the drift cron if it retries
      },
      { onConflict: 'listing_id,channel_type' },
    )

    return { success: false, error: errMsg }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function getOrCreateLocation(accessToken: string): Promise<string> {
  const h = ebayHeaders({ accessToken })
  const res = await syncFetch(`${INVENTORY_BASE}/location`, {
    headers: h,
    label: 'ebay-push.location.list',
  })
  if (res.ok) {
    const data = (await res.json()) as { locations?: Array<{ merchantLocationKey?: string }> }
    if (data.locations?.length) return data.locations[0].merchantLocationKey!
  }
  // Create default location
  const key = 'AUXIO_DEFAULT'
  const createRes = await syncFetch(`${INVENTORY_BASE}/location/${key}`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      location: { address: { country: 'GB' } },
      locationTypes: ['WAREHOUSE'],
      merchantLocationStatus: 'ENABLED',
      name: 'Default',
    }),
    label: 'ebay-push.location.create',
  })
  if (!createRes.ok && createRes.status !== 409) {
    throw new Error(`location creation failed: ${(await createRes.text()).slice(0, 300)}`)
  }
  return key
}

/**
 * Batch-push multiple listings to eBay. Used by the sync engine for initial
 * cross-channel publish or bulk re-sync.
 */
export async function pushBatchToEbay(
  userId: string,
  listings: EbayPushListing[],
  opts: { categoryId?: string; marketplaceId?: string; currency?: string } = {},
): Promise<{ results: Array<{ listingId: string; result: EbayPushResult }> }> {
  const results: Array<{ listingId: string; result: EbayPushResult }> = []

  for (const listing of listings) {
    const result = await pushListingToEbay({
      userId,
      listing,
      categoryId: opts.categoryId,
      marketplaceId: opts.marketplaceId,
      currency: opts.currency,
    })
    results.push({ listingId: listing.id, result })

    // If 5 consecutive failures, stop — likely an auth or account-level issue
    const lastFive = results.slice(-5)
    if (lastFive.length === 5 && lastFive.every(r => !r.result.success)) {
      console.error(`[sync:ebay-push] batch aborted after 5 consecutive failures`)
      await recordDeadLetter({
        userId,
        channelType: 'ebay',
        jobType: 'ebay.batch_push',
        errorMessage: `Batch aborted: ${lastFive.map(r => r.result.error).join('; ')}`.slice(0, 2000),
      })
      break
    }
  }

  return { results }
}
