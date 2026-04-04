import { type NextRequest, NextResponse } from 'next/server'
import { getEbayAppToken } from '@/app/lib/ebay-app-token'

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get('barcode')?.trim()

  if (!barcode || barcode.length < 8) {
    return NextResponse.json({ product: null })
  }

  try {
    const token = await getEbayAppToken()

    const res = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(barcode)}&filter=buyingOptions:{FIXED_PRICE}&limit=3`,
      {
        headers: {
          Authorization:             `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
          'Accept-Language':         'en-GB',
        },
      }
    )

    if (!res.ok) {
      console.error('eBay catalog search failed:', res.status)
      return NextResponse.json({ product: null })
    }

    const data = await res.json()
    const items = data.itemSummaries || []

    if (!items.length) return NextResponse.json({ product: null })

    const item = items[0]
    const product = {
      title:       item.title || '',
      description: item.shortDescription || '',
      images:      [
        item.image?.imageUrl,
        ...(item.additionalImages?.map((img: any) => img.imageUrl) || []),
      ].filter(Boolean).slice(0, 8),
      category: {
        id:   item.categories?.[0]?.categoryId,
        name: item.categories?.[0]?.categoryName,
      },
      condition: item.condition?.toLowerCase().includes('new') ? 'new' : 'used',
      brand:     item.brand || '',
    }

    return NextResponse.json({ product })
  } catch (err: any) {
    console.error('eBay catalog lookup error:', err.message)
    return NextResponse.json({ product: null })
  }
}
