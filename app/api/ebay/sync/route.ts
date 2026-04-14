import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'
import { getEbayAccessToken } from '../../../lib/ebay/auth'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

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
      .select('access_token, refresh_token, shop_name, metadata')
      .eq('user_id', user.id)
      .eq('type', 'ebay')
      .eq('active', true)
      .single()

    if (!channel?.access_token) {
      return NextResponse.json({ error: 'No eBay channel connected' }, { status: 400 })
    }

    const tokenResult = await getEbayAccessToken(
      {
        user_id: user.id,
        access_token: channel.access_token as string | null,
        refresh_token: (channel.refresh_token as string | null) ?? null,
        metadata: (channel.metadata as Record<string, unknown> | null) ?? {},
      },
      getAdmin(),
    )
    if (!tokenResult) {
      return NextResponse.json({ error: 'eBay token refresh failed — please reconnect' }, { status: 401 })
    }

    // Build set of already-imported eBay item IDs so we don't duplicate
    const { data: existingChannels } = await getAdmin()
      .from('listing_channels')
      .select('channel_listing_id')
      .eq('user_id', user.id)
      .eq('channel_type', 'ebay')
      .not('channel_listing_id', 'is', null)

    const existingIds = new Set((existingChannels || []).map(r => r.channel_listing_id as string))

    let userToken = tokenResult.accessToken
    let imported = 0
    let skipped  = 0

    // Helper to force a fresh token on 401 (e.g. cached token was revoked mid-run)
    const forceRefresh = async (): Promise<string | null> => {
      const { data: fresh } = await getAdmin()
        .from('channels')
        .select('access_token, refresh_token, metadata')
        .eq('user_id', user.id)
        .eq('type', 'ebay')
        .single()
      if (!fresh) return null
      // Invalidate cache so getEbayAccessToken refreshes
      const meta = (fresh.metadata as Record<string, unknown> | null) ?? {}
      const invalid = { ...meta, ebay_token_expires_at: 0 }
      const r = await getEbayAccessToken(
        {
          user_id: user.id,
          access_token: fresh.access_token as string | null,
          refresh_token: (fresh.refresh_token as string | null) ?? null,
          metadata: invalid,
        },
        getAdmin(),
      )
      return r?.accessToken ?? null
    }

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
        if (res.status === 401) {
          const t = await forceRefresh()
          if (!t) break
          userToken = t
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

    // ── STRATEGY 2: Trading API GetMyeBaySelling ────────────────────────────
    // Uses the seller's OAuth token directly — no username needed.
    // Returns ALL active listings including those created via eBay's website.
    try {
      const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '_' })
      let page = 1
      let totalPages = 1

      while (page <= totalPages) {
        const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <ActiveList>
    <Include>true</Include>
    <Pagination>
      <EntriesPerPage>200</EntriesPerPage>
      <PageNumber>${page}</PageNumber>
    </Pagination>
  </ActiveList>
  <DetailLevel>ReturnSummary</DetailLevel>
</GetMyeBaySellingRequest>`

        const res = await fetch('https://api.ebay.com/ws/api.dll', {
          method: 'POST',
          headers: {
            'Content-Type':                    'text/xml',
            'X-EBAY-API-CALL-NAME':            'GetMyeBaySelling',
            'X-EBAY-API-SITEID':               '3',
            'X-EBAY-API-COMPATIBILITY-LEVEL':  '967',
            'X-EBAY-API-IAF-TOKEN':            userToken,
          },
          body: xmlBody,
        })

        if (!res.ok) {
          console.warn('[ebay:sync] Trading API HTTP error:', res.status)
          break
        }

        const xml  = await res.text()
        const doc  = xmlParser.parse(xml)
        const root = doc?.GetMyeBaySellingResponse

        if (!root || root.Ack === 'Failure') {
          console.warn('[ebay:sync] Trading API error:', JSON.stringify(root?.Errors || root?.Ack))
          break
        }

        // Update total pages on first call
        const pagination = root.ActiveList?.PaginationResult
        if (page === 1 && pagination) {
          totalPages = parseInt(pagination.TotalNumberOfPages || '1', 10)
          console.log(`[ebay:sync] Trading API: ${pagination.TotalNumberOfEntries} listings across ${totalPages} pages`)
        }

        // Items may be a single object or an array
        const rawItems = root.ActiveList?.ItemArray?.Item
        const items: any[] = !rawItems ? [] : Array.isArray(rawItems) ? rawItems : [rawItems]

        for (const item of items) {
          const ebayItemId = String(item.ItemID || '')
          if (!ebayItemId || existingIds.has(ebayItemId)) { skipped++; continue }

          const price     = parseFloat(item.SellingStatus?.CurrentPrice?.['#text'] ?? item.SellingStatus?.CurrentPrice ?? '0')
          const gallery   = item.PictureDetails?.GalleryURL || ''
          const condition = (item.ConditionDisplayName || item.ConditionID || '').toString().toLowerCase()

          const { data: newListing, error: insertErr } = await getAdmin().from('listings').insert({
            user_id:     user.id,
            title:       item.Title || 'Untitled',
            description: '',
            price:       isNaN(price) ? 0 : price,
            sku:         item.SKU || '',
            brand:       '',
            category:    item.PrimaryCategory?.CategoryName || '',
            condition:   condition.includes('new') ? 'new' : 'used',
            quantity:    parseInt(item.QuantityAvailable ?? item.Quantity ?? '1', 10),
            images:      gallery ? [gallery] : [],
            attributes:  {},
            status:      'published',
          }).select('id').single()

          if (insertErr) {
            console.warn('[ebay:sync] Insert error for', ebayItemId, insertErr.message)
            continue
          }

          if (newListing) {
            await getAdmin().from('listing_channels').insert({
              listing_id:         newListing.id,
              user_id:            user.id,
              channel_type:       'ebay',
              channel_listing_id: ebayItemId,
              channel_url:        item.ListingDetails?.ViewItemURL || `https://www.ebay.co.uk/itm/${ebayItemId}`,
              status:             'published',
              category_id:        item.PrimaryCategory?.CategoryID ? String(item.PrimaryCategory.CategoryID) : null,
              category_name:      item.PrimaryCategory?.CategoryName || null,
              published_at:       item.ListingDetails?.StartTime || new Date().toISOString(),
            })
            existingIds.add(ebayItemId)
            imported++
          }
        }

        page++
      }
    } catch (err) {
      console.warn('[ebay:sync] Trading API error:', err)
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
