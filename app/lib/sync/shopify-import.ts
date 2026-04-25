/**
 * Shopify product import — fetches products from a Shopify store and upserts
 * them into the listings + listing_channels tables.
 *
 * Used by:
 *   - Initial product sync after Shopify OAuth connect
 *   - Cron delta sync (/api/sync/shopify)
 *   - Manual "re-import" from the UI
 *
 * All writes use admin supabase (service key) so RLS is bypassed.
 *
 * Log prefix: [sync:shopify-import]
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { withRateLimit } from '@/app/lib/rate-limit/channel'
import { syncFetch } from './http'

const getAdmin = (): SupabaseClient =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

// ── Types ──────────────────────────────────────────────────────────────────

export interface ShopifyProductVariant {
  id: number | string
  sku?: string | null
  price?: string | number | null
  compare_at_price?: string | null
  inventory_quantity?: number | null
  barcode?: string | null
  weight?: number | null
  weight_unit?: string | null
  grams?: number | null
  option1?: string | null
  option2?: string | null
  option3?: string | null
  title?: string | null
  image_id?: number | null
}

export interface ShopifyProduct {
  id: number | string
  title: string
  body_html?: string | null
  vendor?: string | null
  product_type?: string | null
  status?: string
  tags?: string
  handle?: string
  images?: Array<{ id: number | string; src: string; variant_ids?: Array<number | string> }>
  variants?: ShopifyProductVariant[]
  options?: Array<{ name: string; position?: number; values?: string[] }>
  published_at?: string | null
}

export interface ImportResult {
  imported: number
  updated: number
  skipped: number
  errors: Array<{ productId: string; error: string }>
}

export interface ImportOptions {
  userId: string
  shopDomain: string
  accessToken: string
  /** Only import products updated after this date (ISO string). Null = full import. */
  updatedSince?: string | null
  /** If true, update existing listings even if already imported. */
  forceUpdate?: boolean
}

// ── Core import logic ──────────────────────────────────────────────────────

/**
 * Import/update a single Shopify product into listings + listing_channels.
 * Returns 'imported' | 'updated' | 'skipped'.
 */
export async function importShopifyProduct(
  product: ShopifyProduct,
  userId: string,
  shopDomain: string,
  supabase: SupabaseClient,
  opts: { forceUpdate?: boolean } = {},
): Promise<'imported' | 'updated' | 'skipped'> {
  const externalId = String(product.id)
  const firstVariant = product.variants?.[0]
  const price = firstVariant?.price ? parseFloat(String(firstVariant.price)) : 0
  const compare = firstVariant?.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null
  const qty = firstVariant?.inventory_quantity ?? 0
  const sku = firstVariant?.sku ?? null
  const weight = firstVariant?.grams ?? (firstVariant?.weight != null && firstVariant?.weight_unit === 'g'
    ? firstVariant.weight
    : firstVariant?.weight != null ? (firstVariant.weight as number) * 1000 : null)
  const images = (product.images ?? []).map(i => i.src).filter(Boolean)
  const tags = product.tags
    ? product.tags.split(',').map(t => t.trim()).filter(Boolean)
    : []

  // Check for existing listing_channels row
  const { data: existingLc } = await supabase
    .from('listing_channels')
    .select('listing_id')
    .eq('user_id', userId)
    .eq('channel_type', 'shopify')
    .eq('channel_listing_id', externalId)
    .maybeSingle()

  const listingPayload = {
    user_id: userId,
    title: product.title ?? 'Untitled',
    description: product.body_html ?? '',
    price,
    compare_price: compare,
    sku,
    brand: product.vendor ?? '',
    category: product.product_type ?? '',
    condition: 'new' as const,
    quantity: qty,
    weight_grams: weight,
    images,
    tags,
    attributes: buildAttributes(product),
    status: product.status === 'active' ? 'published' : 'draft',
    image_count: images.length,
    updated_at: new Date().toISOString(),
  }

  let listingId = existingLc?.listing_id as string | undefined

  if (listingId) {
    if (!opts.forceUpdate) return 'skipped'
    // Update existing listing
    const { error } = await supabase.from('channel_listings').update(listingPayload).eq('id', listingId)
    if (error) throw new Error(`listing update failed: ${error.message}`)
  } else {
    // Insert new listing
    const { data: created, error } = await supabase
      .from('channel_listings')
      .insert(listingPayload)
      .select('id')
      .single()
    if (error || !created) throw new Error(`listing insert failed: ${error?.message}`)
    listingId = created.id as string
  }

  // Upsert listing_channels
  await supabase.from('listing_channels').upsert(
    {
      listing_id: listingId,
      user_id: userId,
      channel_type: 'shopify',
      channel_listing_id: externalId,
      channel_url: `https://${shopDomain}/products/${product.handle || externalId}`,
      status: product.status === 'active' ? 'published' : 'draft',
      published_at: product.published_at || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,channel_type,channel_listing_id' },
  )

  // Upsert channel_sync_state
  await supabase.from('channel_sync_state').upsert(
    {
      listing_id: listingId,
      user_id: userId,
      channel_type: 'shopify',
      last_synced_at: new Date().toISOString(),
      last_synced_price: price,
      last_synced_quantity: qty,
      last_synced_title: product.title ?? '',
      last_synced_description: product.body_html ?? '',
      sync_attempts: 0,
      last_error: null,
    },
    { onConflict: 'listing_id,channel_type' },
  )

  return existingLc ? 'updated' : 'imported'
}

/**
 * Full product import — paginates through all Shopify products and imports
 * each into the listings table. Supports delta (updatedSince) and full modes.
 */
export async function importAllShopifyProducts(opts: ImportOptions): Promise<ImportResult> {
  const supabase = getAdmin()
  const result: ImportResult = { imported: 0, updated: 0, skipped: 0, errors: [] }

  let pageInfo: string | null = null
  let pageCount = 0
  const MAX_PAGES = 100 // Safety cap: 250 * 100 = 25,000 products

  while (pageCount < MAX_PAGES) {
    let url: string
    if (pageInfo) {
      url = `https://${opts.shopDomain}/admin/api/2024-01/products.json?limit=250&page_info=${pageInfo}`
    } else {
      const params = new URLSearchParams({ limit: '250' })
      if (opts.updatedSince) params.set('updated_at_min', opts.updatedSince)
      url = `https://${opts.shopDomain}/admin/api/2024-01/products.json?${params}`
    }

    const res = await withRateLimit('shopify', opts.shopDomain, () =>
      syncFetch(url, {
        headers: { 'X-Shopify-Access-Token': opts.accessToken },
        label: `shopify-import:${opts.shopDomain}`,
      }),
    )

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`[sync:shopify-import] fetch failed: ${res.status} ${text.slice(0, 200)}`)
      break
    }

    const { products } = (await res.json()) as { products: ShopifyProduct[] }
    if (!products?.length) break

    for (const product of products) {
      try {
        const outcome = await importShopifyProduct(
          product,
          opts.userId,
          opts.shopDomain,
          supabase,
          { forceUpdate: opts.forceUpdate ?? !!opts.updatedSince },
        )
        result[outcome]++
      } catch (err) {
        const msg = (err as Error).message
        console.error(`[sync:shopify-import] product ${product.id}: ${msg}`)
        result.errors.push({ productId: String(product.id), error: msg })
      }
    }

    // Cursor pagination via Link header
    const linkHeader = res.headers.get('Link') || ''
    const nextMatch = linkHeader.match(/<[^>]*page_info=([^>&"]+)[^>]*>;\s*rel="next"/)
    if (nextMatch) {
      pageInfo = nextMatch[1]
    } else {
      break
    }
    pageCount++
  }

  console.log(
    `[sync:shopify-import] user=${opts.userId} imported=${result.imported} updated=${result.updated} skipped=${result.skipped} errors=${result.errors.length}`,
  )

  return result
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildAttributes(product: ShopifyProduct): Record<string, unknown> {
  const attrs: Record<string, unknown> = {}
  const variants = product.variants ?? []
  if (variants.length > 0) {
    const first = variants[0]
    if (first.option1 && first.option1 !== 'Default Title') attrs.option1 = first.option1
    if (first.option2) attrs.option2 = first.option2
    if (first.option3) attrs.option3 = first.option3
    if (first.barcode) attrs.barcode = first.barcode
  }
  if (product.options?.length) {
    attrs.option_names = product.options.map(o => o.name)
  }
  if (variants.length > 1) {
    attrs.variant_count = variants.length
    attrs.variant_skus = variants.map(v => v.sku).filter(Boolean)
  }
  return attrs
}
