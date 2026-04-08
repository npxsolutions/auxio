import { type NextRequest, NextResponse } from 'next/server'
import { getEbayAppToken } from '@/app/lib/ebay-app-token'

// Fields from UPCitemdb that map cleanly to eBay aspect names
const UPC_FIELD_MAP: Record<string, string[]> = {
  brand:       ['Brand'],
  color:       ['Colour', 'Color'],
  size:        ['Size'],
  weight:      ['Weight'],
  model:       ['Model', 'MPN'],
  category:    [],
  description: [],
}

async function lookupUPCitemdb(barcode: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return {}
    const data = await res.json()
    const item = data.items?.[0]
    if (!item) return {}

    const aspects: Record<string, string> = {}

    if (item.brand)  { for (const k of UPC_FIELD_MAP.brand)  aspects[k] = item.brand }
    if (item.color)  { for (const k of UPC_FIELD_MAP.color)  aspects[k] = item.color }
    if (item.size)   { for (const k of UPC_FIELD_MAP.size)   aspects[k] = item.size  }
    if (item.model)  { for (const k of UPC_FIELD_MAP.model)  aspects[k] = item.model }
    if (item.weight) aspects['Weight'] = `${item.weight}${item.weight_unit || 'g'}`

    // EAN / UPC — useful for item specifics fields
    if (barcode.length === 13) aspects['EAN'] = barcode
    if (barcode.length === 12) aspects['UPC'] = barcode

    return aspects
  } catch {
    return {}
  }
}

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get('barcode')?.trim()

  if (!barcode || barcode.length < 8) {
    return NextResponse.json({ product: null })
  }

  try {
    const token = await getEbayAppToken()

    // ── 1. Search eBay Browse API ──────────────────────────────────────────
    const searchRes = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(barcode)}&filter=buyingOptions:{FIXED_PRICE}&limit=3`,
      {
        headers: {
          Authorization:             `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
          'Accept-Language':         'en-GB',
        },
      }
    )

    if (!searchRes.ok) {
      console.error('eBay catalog search failed:', searchRes.status)
      return NextResponse.json({ product: null })
    }

    const searchData = await searchRes.json()
    const items      = searchData.itemSummaries || []

    if (!items.length) return NextResponse.json({ product: null })

    const summary = items[0]

    // ── 2. Fetch full item detail to get localizedAspects ─────────────────
    let aspectsFromEbay: Record<string, string> = {}
    if (summary.itemId) {
      try {
        const itemRes = await fetch(
          `https://api.ebay.com/buy/browse/v1/item/${encodeURIComponent(summary.itemId)}`,
          {
            headers: {
              Authorization:             `Bearer ${token}`,
              'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
              'Accept-Language':         'en-GB',
            },
            signal: AbortSignal.timeout(5000),
          }
        )
        if (itemRes.ok) {
          const itemData = await itemRes.json()
          // localizedAspects is an array of { name, value }
          for (const a of (itemData.localizedAspects || [])) {
            if (a.name && a.value) {
              aspectsFromEbay[a.name] = Array.isArray(a.value) ? a.value[0] : a.value
            }
          }
          // Also pull from additionalImages if richer
          if (itemData.additionalImages?.length && summary.additionalImages?.length === 0) {
            summary.additionalImages = itemData.additionalImages
          }
        }
      } catch {
        // non-fatal — we still return what we have from the summary
      }
    }

    // ── 3. UPCitemdb supplementary lookup ─────────────────────────────────
    const aspectsFromUPC = await lookupUPCitemdb(barcode)

    // ── 4. Merge: eBay wins over UPCitemdb for overlapping keys ───────────
    const mergedAspects: Record<string, string> = { ...aspectsFromUPC, ...aspectsFromEbay }

    // Always record the barcode itself into the appropriate aspect
    if (barcode.length === 13 && !mergedAspects['EAN']) mergedAspects['EAN'] = barcode
    if (barcode.length === 12 && !mergedAspects['UPC']) mergedAspects['UPC'] = barcode

    // Ensure Brand is set if we know it from the summary
    if (summary.brand && !mergedAspects['Brand']) mergedAspects['Brand'] = summary.brand

    // ── 5. Build product response ─────────────────────────────────────────
    const product = {
      title:       summary.title || '',
      description: summary.shortDescription || '',
      images:      [
        summary.image?.imageUrl,
        ...(summary.additionalImages?.map((img: any) => img.imageUrl) || []),
      ].filter(Boolean).slice(0, 8) as string[],
      category: {
        id:   summary.categories?.[0]?.categoryId  as string | undefined,
        name: summary.categories?.[0]?.categoryName as string | undefined,
      },
      condition: (summary.condition?.toLowerCase().includes('new') ? 'new' : 'used') as string,
      brand:     (summary.brand || mergedAspects['Brand'] || '') as string,
      aspects:   mergedAspects,
    }

    return NextResponse.json({ product })
  } catch (err: any) {
    console.error('eBay catalog lookup error:', err.message)
    return NextResponse.json({ product: null })
  }
}
