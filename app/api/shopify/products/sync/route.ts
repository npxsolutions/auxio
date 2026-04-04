import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

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
      .select('access_token, shop_domain, shop_name')
      .eq('user_id', user.id)
      .eq('type', 'shopify')
      .eq('active', true)
      .single()

    if (!channel?.access_token) {
      return NextResponse.json({ error: 'No Shopify channel connected' }, { status: 400 })
    }

    const { access_token, shop_domain } = channel

    // Build set of already-imported Shopify product/variant IDs
    const { data: existingChannels } = await getAdmin()
      .from('listing_channels')
      .select('channel_listing_id')
      .eq('user_id', user.id)
      .eq('channel_type', 'shopify')
      .not('channel_listing_id', 'is', null)

    const existingIds = new Set((existingChannels || []).map(r => r.channel_listing_id as string))

    let imported = 0
    let skipped  = 0
    let pageInfo: string | null = null

    // Paginate through all products using cursor-based pagination
    while (true) {
      const url = pageInfo
        ? `https://${shop_domain}/admin/api/2024-01/products.json?limit=250&page_info=${pageInfo}&fields=id,title,body_html,variants,images,product_type,vendor,tags,status`
        : `https://${shop_domain}/admin/api/2024-01/products.json?limit=250&fields=id,title,body_html,variants,images,product_type,vendor,tags,status`

      const res = await fetch(url, {
        headers: { 'X-Shopify-Access-Token': access_token },
      })

      if (!res.ok) {
        console.error('[shopify:products:sync] fetch failed:', res.status, await res.text())
        break
      }

      const { products } = await res.json()
      if (!products?.length) break

      for (const product of products) {
        // Each Shopify product can have multiple variants — import each as a separate listing
        for (const variant of product.variants || [{ id: product.id, price: '0', sku: '', inventory_quantity: 0 }]) {
          const listingId = `${product.id}-${variant.id}`

          if (existingIds.has(listingId)) { skipped++; continue }

          // Build title: product title + variant title if not "Default Title"
          const variantSuffix = variant.title && variant.title !== 'Default Title' ? ` — ${variant.title}` : ''
          const title = `${product.title}${variantSuffix}`

          // Images: product-level + first available
          const images = (product.images || []).map((img: any) => img.src).filter(Boolean).slice(0, 8)

          const { data: newListing, error } = await getAdmin().from('listings').insert({
            user_id:     user.id,
            title,
            description: product.body_html || '',
            price:       parseFloat(variant.price || '0'),
            sku:         variant.sku || '',
            brand:       product.vendor || '',
            category:    product.product_type || '',
            condition:   'new',
            quantity:    variant.inventory_quantity ?? 0,
            images,
            attributes:  variant.option1 || variant.option2 || variant.option3
              ? {
                  option1: variant.option1 || undefined,
                  option2: variant.option2 || undefined,
                  option3: variant.option3 || undefined,
                }
              : {},
            status:      product.status === 'active' ? 'published' : 'draft',
          }).select('id').single()

          if (!error && newListing) {
            await getAdmin().from('listing_channels').insert({
              listing_id:         newListing.id,
              user_id:            user.id,
              channel_type:       'shopify',
              channel_listing_id: listingId,
              channel_url:        `https://${shop_domain}/products/${product.handle}`,
              status:             product.status === 'active' ? 'published' : 'draft',
              published_at:       product.published_at || null,
            })
            existingIds.add(listingId)
            imported++
          } else if (error) {
            console.warn('[shopify:products:sync] insert error:', error.message, title)
          }
        }
      }

      // Shopify cursor pagination via Link header
      const linkHeader = res.headers.get('Link') || ''
      const nextMatch  = linkHeader.match(/<[^>]*page_info=([^>&"]+)[^>]*>;\s*rel="next"/)
      if (nextMatch) {
        pageInfo = nextMatch[1]
      } else {
        break
      }
    }

    // Update last_synced_at
    await getAdmin()
      .from('channels')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('type', 'shopify')

    console.log(`[shopify:products:sync] user=${user.id} imported=${imported} skipped=${skipped}`)

    return NextResponse.json({
      imported,
      skipped,
      message: imported > 0
        ? `Imported ${imported} product${imported !== 1 ? 's' : ''} from Shopify`
        : skipped > 0
          ? `All ${skipped} Shopify products already imported`
          : 'No Shopify products found',
    })
  } catch (err: any) {
    console.error('[shopify:products:sync] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
