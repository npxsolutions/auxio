// BUNDLE_C — Shopify variants → eBay inventory_item_group.
//
// Multi-variant Shopify products should map to a single eBay InventoryItemGroup
// with variation options (Size, Color, Material, etc.) rather than splitting
// into N independent listings. planVariantGroup inspects the Shopify product
// and returns a VariantGroupPlan when the product has >1 variant and every
// variant carries distinct option values. Single-variant / default-variant
// products return null so the caller falls back to the existing path.

import { syncFetch } from '../sync/http'
import type { EbayPolicySet } from './policies'

const INVENTORY_BASE = 'https://api.ebay.com/sell/inventory/v1'

// Minimal Shopify product shape — only the fields we touch.
export interface ShopifyVariant {
  id: number | string
  sku?: string | null
  title?: string | null
  price?: string | number | null
  inventory_quantity?: number | null
  option1?: string | null
  option2?: string | null
  option3?: string | null
  image_id?: number | null
}

export interface ShopifyOption {
  name: string
  position?: number
  values?: string[]
}

export interface ShopifyImage {
  id: number | string
  src: string
  variant_ids?: Array<number | string>
}

export interface ShopifyProduct {
  id: number | string
  title: string
  body_html?: string | null
  variants: ShopifyVariant[]
  options?: ShopifyOption[]
  images?: ShopifyImage[]
  image?: ShopifyImage | null
}

export interface VariantGroupItem {
  sku: string
  variationValues: Record<string, string>
  quantity: number
  price: number
  imageUrls: string[]
}

export interface VariantGroupPlan {
  groupSku: string
  groupTitle: string
  variationSpecifics: string[]
  items: VariantGroupItem[]
}

/**
 * Detects whether a Shopify product should become a single eBay
 * InventoryItemGroup. Returns null when the product is single-variant or when
 * no axis is populated (the default-variant case).
 *
 * Rule (per spec):
 *   - variants.length > 1
 *   - every variant has distinct option1/option2/option3 values
 */
export function planVariantGroup(shopifyProduct: ShopifyProduct): VariantGroupPlan | null {
  const variants = shopifyProduct.variants ?? []
  if (variants.length <= 1) return null

  // Determine which axes are in use. An axis is "in use" if >=1 variant has a
  // non-empty, non-"Default Title" value on that axis.
  const axisNames: string[] = []
  const axisPositions: Array<'option1' | 'option2' | 'option3'> = []
  const optionDefs = (shopifyProduct.options ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  const axisActive = (pos: 'option1' | 'option2' | 'option3') =>
    variants.some(v => {
      const val = v[pos]
      return typeof val === 'string' && val.trim() && val.trim().toLowerCase() !== 'default title'
    })

  ;(['option1', 'option2', 'option3'] as const).forEach((pos, i) => {
    if (!axisActive(pos)) return
    const def = optionDefs[i]
    const name = def?.name?.trim() || (['Size', 'Color', 'Material'][i])
    axisNames.push(name)
    axisPositions.push(pos)
  })

  if (axisNames.length === 0) return null

  // Build per-variant items; skip variants missing values on any active axis.
  const items: VariantGroupItem[] = []
  const imagesById = new Map<string, string>()
  for (const img of shopifyProduct.images ?? []) imagesById.set(String(img.id), img.src)
  const productImage = shopifyProduct.image?.src ?? shopifyProduct.images?.[0]?.src ?? null

  for (const v of variants) {
    const values: Record<string, string> = {}
    let skip = false
    axisPositions.forEach((pos, idx) => {
      const raw = v[pos]
      const value = typeof raw === 'string' ? raw.trim() : ''
      if (!value || value.toLowerCase() === 'default title') {
        skip = true
        return
      }
      values[axisNames[idx]] = value
    })
    if (skip) {
      console.warn(`[ebay:variants] skipping variant ${v.id} — missing axis value`)
      continue
    }

    // Image: prefer variant's own image, fall back to product image.
    let imgSrc: string | null = null
    if (v.image_id != null) imgSrc = imagesById.get(String(v.image_id)) ?? null
    const imageUrls = [imgSrc ?? productImage].filter((s): s is string => !!s)

    const priceNum = Number(v.price ?? 0)
    items.push({
      sku: String(v.sku || `${shopifyProduct.id}-${v.id}`),
      variationValues: values,
      quantity: Number(v.inventory_quantity ?? 0),
      price: Number.isFinite(priceNum) ? priceNum : 0,
      imageUrls,
    })
  }

  // Must still have at least 2 usable items after skipping defaults.
  if (items.length < 2) return null

  // Distinct-values check — the combination of axis values must be unique per item.
  const seen = new Set<string>()
  for (const it of items) {
    const key = axisNames.map(n => `${n}=${it.variationValues[n]}`).join('|')
    if (seen.has(key)) {
      console.warn(`[ebay:variants] duplicate axis combo detected for ${shopifyProduct.id}; falling back to single-listing path`)
      return null
    }
    seen.add(key)
  }

  return {
    groupSku: `SHP-${shopifyProduct.id}`,
    groupTitle: shopifyProduct.title,
    variationSpecifics: axisNames,
    items,
  }
}

// ── eBay Inventory API writers ──────────────────────────────────────────────

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Content-Language': 'en-US',
  }
}

/**
 * Upserts every child InventoryItem for the plan (PUT is idempotent per SKU),
 * then upserts the parent InventoryItemGroup linking them by SKU.
 */
export async function upsertInventoryItemGroup(accessToken: string, plan: VariantGroupPlan): Promise<void> {
  // Children first.
  for (const item of plan.items) {
    const body = {
      availability: { shipToLocationAvailability: { quantity: item.quantity } },
      condition: 'NEW',
      product: {
        title: `${plan.groupTitle} — ${Object.values(item.variationValues).join(' / ')}`,
        imageUrls: item.imageUrls,
        aspects: Object.fromEntries(
          Object.entries(item.variationValues).map(([k, v]) => [k, [v]]),
        ),
      },
    }
    const res = await syncFetch(`${INVENTORY_BASE}/inventory_item/${encodeURIComponent(item.sku)}`, {
      method: 'PUT',
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
      label: 'ebay.inventory_item.put',
    })
    if (!res.ok) {
      throw new Error(`eBay inventory_item PUT ${item.sku} failed: ${await res.text().then(t => t.slice(0, 300))}`)
    }
  }

  // Group.
  const groupBody = {
    title: plan.groupTitle,
    aspects: Object.fromEntries(
      plan.variationSpecifics.map(name => [
        name,
        plan.items.map(it => it.variationValues[name]).filter(Boolean),
      ]),
    ),
    variesBy: {
      specifications: plan.variationSpecifics.map(name => ({
        name,
        values: Array.from(new Set(plan.items.map(it => it.variationValues[name]))).filter(Boolean),
      })),
      aspectsImageVariesBy: plan.variationSpecifics.slice(0, 1),
    },
    variantSKUs: plan.items.map(it => it.sku),
    imageUrls: Array.from(new Set(plan.items.flatMap(it => it.imageUrls))).slice(0, 12),
  }
  const res = await syncFetch(`${INVENTORY_BASE}/inventory_item_group/${encodeURIComponent(plan.groupSku)}`, {
    method: 'PUT',
    headers: authHeaders(accessToken),
    body: JSON.stringify(groupBody),
    label: 'ebay.inventory_item_group.put',
  })
  if (!res.ok) {
    throw new Error(`eBay inventory_item_group PUT ${plan.groupSku} failed: ${await res.text().then(t => t.slice(0, 300))}`)
  }
}

/**
 * Creates one offer per child SKU and publishes them together via the
 * publishByInventoryItemGroup endpoint, which produces a single eBay listing
 * with variations. Offers are idempotent per SKU — existing offers are updated.
 */
export async function upsertGroupOffer(
  accessToken: string,
  plan: VariantGroupPlan,
  categoryId: string,
  policies: EbayPolicySet,
  opts: { marketplaceId?: string; currency?: string; merchantLocationKey?: string } = {},
): Promise<{ groupExternalId?: string } > {
  const marketplaceId = opts.marketplaceId ?? 'EBAY_US'
  const currency = opts.currency ?? 'USD'
  const merchantLocationKey = opts.merchantLocationKey ?? 'AUXIO_DEFAULT'

  // One offer per child SKU (upsert semantics via list-by-sku then PUT).
  for (const item of plan.items) {
    const existingRes = await syncFetch(`${INVENTORY_BASE}/offer?sku=${encodeURIComponent(item.sku)}`, {
      headers: authHeaders(accessToken),
      label: 'ebay.offer.list_by_sku',
    })
    const existing = existingRes.ok
      ? ((await existingRes.json().catch(() => ({}))) as { offers?: Array<{ offerId?: string }> })
      : { offers: [] }
    const existingOfferId = existing.offers?.[0]?.offerId

    const offerBody: Record<string, unknown> = {
      sku: item.sku,
      marketplaceId,
      format: 'FIXED_PRICE',
      availableQuantity: item.quantity,
      categoryId,
      pricingSummary: { price: { value: item.price.toString(), currency } },
      merchantLocationKey,
      listingPolicies: {
        paymentPolicyId: policies.paymentPolicyId,
        returnPolicyId: policies.returnPolicyId,
        fulfillmentPolicyId: policies.fulfillmentPolicyId,
      },
    }

    if (existingOfferId) {
      const res = await syncFetch(`${INVENTORY_BASE}/offer/${existingOfferId}`, {
        method: 'PUT',
        headers: authHeaders(accessToken),
        body: JSON.stringify(offerBody),
        label: 'ebay.offer.put',
      })
      if (!res.ok) throw new Error(`eBay offer PUT ${item.sku} failed: ${(await res.text()).slice(0, 300)}`)
    } else {
      const res = await syncFetch(`${INVENTORY_BASE}/offer`, {
        method: 'POST',
        headers: authHeaders(accessToken),
        body: JSON.stringify(offerBody),
        label: 'ebay.offer.post',
      })
      if (!res.ok) throw new Error(`eBay offer POST ${item.sku} failed: ${(await res.text()).slice(0, 300)}`)
    }
  }

  // Publish whole group → single eBay listing with variations.
  const pubRes = await syncFetch(`${INVENTORY_BASE}/offer/publish_by_inventory_item_group`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ inventoryItemGroupKey: plan.groupSku, marketplaceId }),
    label: 'ebay.offer.publish_by_group',
  })
  if (!pubRes.ok) {
    throw new Error(`eBay publish_by_inventory_item_group failed: ${(await pubRes.text()).slice(0, 300)}`)
  }
  const pubJson = (await pubRes.json().catch(() => ({}))) as { listingId?: string }
  return { groupExternalId: pubJson.listingId }
}
