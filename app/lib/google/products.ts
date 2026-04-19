/**
 * Google Merchant Center (Content API for Shopping v2.1) product push.
 *
 * One function per publish direction:
 *   - publishToGoogle(listing, channel) — insert or update a product on the
 *     merchant account. Returns { id, url } matching the shape used by
 *     publishToEbay / publishToAmazon in app/api/listings/[id]/publish/route.ts.
 *
 * Idempotency: Content API uses the composite offerId (`{channel}:{content_language}:{feedLabel}:{offerId}`)
 * as the primary key. Calling products.insert with the same offerId updates
 * the existing product in place — no explicit upsert endpoint.
 *
 * Log prefix: [google:products]
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  GOOGLE_CONTENT_BASE,
  getGoogleAccessToken,
  googleHeaders,
  type GoogleChannelRow,
} from './auth'
import { withRateLimit } from '../rate-limit/channel'
import { syncFetch } from '../sync/http'
import { matchGoogleCategory } from '../feed/seed-google-product-categories'

// ── Types ─────────────────────────────────────────────────────────────────

export interface GooglePushListing {
  id: string
  title: string
  description: string
  price: number
  quantity: number
  sku: string | null
  condition?: string | null
  images: string[]
  brand?: string | null
  barcode?: string | null
  mpn?: string | null
  product_url?: string | null
  shopify_handle?: string | null
  product_type?: string | null
  google_product_category?: string | null
  attributes?: Record<string, unknown>
}

export interface GooglePushChannel extends GoogleChannelRow {
  shop_domain: string | null
  /** Overrides: defaults to 'US' / 'en' / 'USD' when absent. */
  feed_label?: string | null
  content_language?: string | null
  currency?: string | null
}

export interface GooglePushResult {
  id: string
  url: string
  externalOfferId: string
}

// ── Helpers ───────────────────────────────────────────────────────────────

function mapCondition(c: string | null | undefined): 'new' | 'refurbished' | 'used' {
  const v = String(c ?? '').toLowerCase()
  if (v === 'refurbished' || v === 'renewed') return 'refurbished'
  if (v === 'used' || v.startsWith('used_') || v === 'pre-owned') return 'used'
  return 'new'
}

function deriveAvailability(quantity: number): 'in_stock' | 'out_of_stock' {
  return quantity > 0 ? 'in_stock' : 'out_of_stock'
}

function resolveGoogleCategory(listing: GooglePushListing): string | undefined {
  if (listing.google_product_category) return String(listing.google_product_category)
  const match = matchGoogleCategory(listing.product_type)
  return match?.googleCategoryId
}

function buildProductResource(
  listing: GooglePushListing,
  channel: GooglePushChannel,
): { resource: Record<string, unknown>; offerId: string } {
  const feedLabel       = channel.feed_label       ?? 'US'
  const contentLanguage = channel.content_language ?? 'en'
  const currency        = channel.currency         ?? 'USD'
  const offerId         = listing.sku || listing.id

  const images = Array.isArray(listing.images) ? listing.images.filter(Boolean) : []
  const additionalImages = images.slice(1, 11) // Google caps additionalImageLinks at 10

  const categoryId = resolveGoogleCategory(listing)

  const resource: Record<string, unknown> = {
    offerId,
    channel: 'online',
    contentLanguage,
    feedLabel,
    title:         listing.title,
    description:   listing.description,
    link:          listing.product_url ?? '',
    imageLink:     images[0] ?? '',
    availability:  deriveAvailability(listing.quantity),
    condition:     mapCondition(listing.condition),
    price: {
      value:    listing.price.toFixed(2),
      currency,
    },
    ...(additionalImages.length > 0 ? { additionalImageLinks: additionalImages } : {}),
    ...(listing.brand              ? { brand: listing.brand }                   : {}),
    ...(listing.barcode            ? { gtin:  listing.barcode }                 : {}),
    ...(listing.mpn                ? { mpn:   listing.mpn }                     : (listing.sku ? { mpn: listing.sku } : {})),
    ...(categoryId                 ? { googleProductCategory: categoryId }      : {}),
    ...(listing.product_type       ? { productTypes: [listing.product_type] }   : {}),
    ...(listing.attributes         ? listing.attributes                         : {}),
  }

  return { resource, offerId }
}

// ── Main push function ────────────────────────────────────────────────────

export async function publishToGoogle(
  listing: GooglePushListing,
  channel: GooglePushChannel,
  supabase: SupabaseClient,
): Promise<GooglePushResult> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)')
  }

  const metadata   = (channel.metadata as Record<string, unknown> | null) ?? {}
  const merchantId = (metadata.merchant_id as string | undefined) ?? channel.shop_domain ?? ''
  if (!merchantId) {
    throw new Error('[google:products] missing merchant_id on channel — reconnect Google Merchant Center')
  }

  const { accessToken } = await getGoogleAccessToken(channel, supabase)

  const { resource, offerId } = buildProductResource(listing, channel)
  const externalOfferId = `online:${channel.content_language ?? 'en'}:${channel.feed_label ?? 'US'}:${offerId}`

  const url = `${GOOGLE_CONTENT_BASE}/${encodeURIComponent(merchantId)}/products`

  console.log(`[google:products] publish merchant=${merchantId} offer=${offerId}`)

  const res = await withRateLimit('google', merchantId, () =>
    syncFetch(url, {
      method:  'POST',
      headers: googleHeaders({ accessToken }),
      body:    JSON.stringify(resource),
      label:   `google.products.insert:${merchantId}`,
    }),
  )

  if (!res.ok) {
    const errText = await res.text()
    throw Object.assign(
      new Error(`Google Content API error (${res.status}): ${errText}`),
      { status: res.status },
    )
  }

  const data = (await res.json()) as { id?: string; offerId?: string; link?: string }
  const productId = data.id ?? externalOfferId

  return {
    id:  productId,
    url: data.link ?? listing.product_url ?? '',
    externalOfferId: productId,
  }
}
