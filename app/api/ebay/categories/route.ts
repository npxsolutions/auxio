import { type NextRequest, NextResponse } from 'next/server'
import { getEbayAppToken } from '@/app/lib/ebay-app-token'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ categories: [] })
  }

  try {
    const token = await getEbayAppToken()

    const EBAY_GB_CATEGORY_TREE_ID = '3'

    const res = await fetch(
      `https://api.ebay.com/commerce/taxonomy/v1/category_tree/${EBAY_GB_CATEGORY_TREE_ID}/get_category_suggestions?q=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Bearer ${token}`, 'Accept-Language': 'en-GB' } }
    )

    if (!res.ok) {
      console.error('eBay category search failed:', await res.text())
      return NextResponse.json({ categories: [] })
    }

    const data = await res.json()
    const categories = (data.categorySuggestions || [])
      .slice(0, 10)
      .map((s: any) => ({
        id:   s.category.categoryId,
        name: s.category.categoryName,
        path: s.categoryTreeNodeAncestors
          ?.slice()
          .reverse()
          .map((a: any) => a.categoryName)
          .concat(s.category.categoryName)
          .join(' > ') || s.category.categoryName,
      }))

    return NextResponse.json({ categories })
  } catch (err: any) {
    console.error('eBay category search error:', err.message)
    return NextResponse.json({ categories: [] })
  }
}
