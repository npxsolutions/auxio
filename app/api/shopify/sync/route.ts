import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get Shopify channel credentials
    const { data: channel } = await getAdmin()
      .from('channels')
      .select('access_token, shop_domain')
      .eq('user_id', user.id)
      .eq('type', 'shopify')
      .single()

    if (!channel?.access_token) {
      return NextResponse.json({ error: 'No Shopify channel connected' }, { status: 400 })
    }

    const { access_token, shop_domain } = channel

    // Fetch last 90 days of orders
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const ordersRes = await fetch(
      `https://${shop_domain}/admin/api/2024-01/orders.json?status=any&created_at_min=${since}&limit=250&fields=id,order_number,line_items,total_price,created_at,shipping_address`,
      { headers: { 'X-Shopify-Access-Token': access_token } }
    )

    if (!ordersRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch Shopify orders' }, { status: 502 })
    }

    const { orders } = await ordersRes.json()
    let synced = 0

    for (const order of orders || []) {
      for (const item of order.line_items || []) {
        const salePrice = parseFloat(item.price) * item.quantity
        const channelFee = salePrice * 0.03 // Shopify transaction fee ~3%
        const shippingCost = 3.95

        await getAdmin().from('transactions').upsert({
          user_id:          user.id,
          channel:          'shopify',
          external_id:      `${order.id}-${item.id}`,
          sku:              item.sku || item.variant_id?.toString() || item.product_id?.toString(),
          title:            item.title,
          category:         'general',
          sale_price:       salePrice,
          supplier_cost:    salePrice * 0.5, // 50% est until user sets real costs
          channel_fee:      channelFee,
          advertising_cost: 0,
          shipping_cost:    shippingCost,
          return_cost:      0,
          gross_revenue:    salePrice,
          true_profit:      salePrice - (salePrice * 0.5) - channelFee - shippingCost,
          true_margin:      ((salePrice - (salePrice * 0.5) - channelFee - shippingCost) / salePrice) * 100,
          order_date:       order.created_at,
          buyer_location:   order.shipping_address?.country_code || 'GB',
        }, { onConflict: 'user_id,external_id,channel' })

        synced++
      }
    }

    // Log the sync
    await getAdmin().from('sync_jobs').insert({
      user_id:       user.id,
      job_type:      'shopify_manual_sync',
      status:        'completed',
      rows_processed: synced,
      completed_at:  new Date().toISOString(),
    })

    return NextResponse.json({ synced, message: `Synced ${synced} line items from ${orders?.length || 0} orders` })
  } catch (error: any) {
    console.error('Shopify sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
