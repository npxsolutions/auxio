import { type NextRequest, NextResponse } from 'next/server'
import { getEbayAppToken } from '@/app/lib/ebay-app-token'

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get('categoryId')

  if (!categoryId) {
    return NextResponse.json({ aspects: [] })
  }

  try {
    const token = await getEbayAppToken()

    const res = await fetch(
      `https://api.ebay.com/commerce/taxonomy/v1/category_tree/3/get_item_aspects_for_category?category_id=${categoryId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!res.ok) {
      console.error('eBay aspects fetch failed:', res.status)
      return NextResponse.json({ aspects: [] })
    }

    const data = await res.json()

    const aspects = (data.aspects || [])
      .filter((a: any) => a.aspectConstraint?.aspectUsage !== 'OPTIONAL' || a.aspectConstraint?.itemToAspectCardinality === 'SINGLE')
      .map((a: any) => ({
        name:     a.aspectName,
        required: a.aspectConstraint?.aspectRequired === true,
        values:   (a.aspectValues || []).map((v: any) => v.localizedValue).slice(0, 50),
        type:     a.aspectConstraint?.aspectDataType || 'STRING',
      }))
      .sort((a: any, b: any) => (b.required ? 1 : 0) - (a.required ? 1 : 0))
      .slice(0, 20)

    return NextResponse.json({ aspects })
  } catch (err: any) {
    console.error('eBay aspects error:', err.message)
    return NextResponse.json({ aspects: [] })
  }
}
