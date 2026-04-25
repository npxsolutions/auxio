import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getProfitSettings } from '@/app/lib/profit-settings'
import { requireActiveOrg } from '@/app/lib/org/context'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: Request) {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get Shopify channel credentials (service role — must filter explicitly)
    const { data: channel } = await getAdmin()
      .from('channels')
      .select('access_token, shop_domain')
      .eq('organization_id', ctx.id)
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

    // Load user profit settings (fee rates, shipping defaults, fallback COGS%)
    const profitSettings = await getProfitSettings(ctx.user.id)

    // Pre-load cost_price map from listings table (service role — filter by org)
    const { data: costRows } = await getAdmin()
      .from('channel_listings')
      .select('sku, cost_price')
      .eq('organization_id', ctx.id)
      .not('sku', 'is', null)
      .not('cost_price', 'is', null)
    const costBySku: Record<string, number> = {}
    for (const r of costRows || []) {
      if (r.sku) costBySku[r.sku] = r.cost_price
    }

    for (const order of orders || []) {
      for (const item of order.line_items || []) {
        const salePrice    = parseFloat(item.price) * item.quantity
        const channelFee   = salePrice * (profitSettings.shopify_fee_pct / 100)
        const shippingCost = profitSettings.default_shipping_cost
        const sku          = item.sku || item.variant_id?.toString() || item.product_id?.toString()
        // Use real cost if known, fall back to user's default COGS %
        const supplierCost = costBySku[sku] != null
          ? costBySku[sku] * item.quantity
          : salePrice * (profitSettings.default_cogs_pct / 100)
        const trueProfit   = salePrice - supplierCost - channelFee - shippingCost

        await getAdmin().from('transactions').upsert({
          organization_id:  ctx.id,
          user_id:          ctx.user.id,
          channel:          'shopify',
          external_id:      `${order.id}-${item.id}`,
          sku,
          title:            item.title,
          category:         'general',
          sale_price:       salePrice,
          supplier_cost:    supplierCost,
          channel_fee:      channelFee,
          advertising_cost: 0,
          shipping_cost:    shippingCost,
          return_cost:      0,
          gross_revenue:    salePrice,
          true_profit:      trueProfit,
          true_margin:      salePrice > 0 ? (trueProfit / salePrice) * 100 : 0,
          order_date:       order.created_at,
          buyer_location:   order.shipping_address?.country_code || 'GB',
        }, { onConflict: 'user_id,external_id,channel' })

        synced++
      }
    }

    // Log the sync
    await getAdmin().from('sync_jobs').insert({
      organization_id: ctx.id,
      user_id:         ctx.user.id,
      job_type:        'shopify_manual_sync',
      status:          'completed',
      rows_processed:  synced,
      completed_at:    new Date().toISOString(),
    })

    return NextResponse.json({ synced, message: `Synced ${synced} line items from ${orders?.length || 0} orders` })
  } catch (error: any) {
    console.error('Shopify sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
