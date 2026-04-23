import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getProfitSettings } from '@/app/lib/profit-settings'
import { getEbayAccessToken } from '@/app/lib/ebay/auth'
import { requireActiveOrg } from '@/app/lib/org/context'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST() {
  try {
    const ctx = await requireActiveOrg().catch(() => null)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // service-role — must filter explicitly
    const { data: channel } = await getAdmin()
      .from('channels')
      .select('access_token, refresh_token, metadata')
      .eq('organization_id', ctx.id)
      .eq('type', 'ebay')
      .eq('active', true)
      .single()

    if (!channel?.access_token) {
      return NextResponse.json({ error: 'No eBay channel connected' }, { status: 400 })
    }

    const tokenResult = await getEbayAccessToken(
      {
        user_id: ctx.user.id,
        access_token: channel.access_token as string | null,
        refresh_token: (channel.refresh_token as string | null) ?? null,
        metadata: (channel.metadata as Record<string, unknown> | null) ?? {},
      },
      getAdmin(),
    )
    if (!tokenResult) {
      return NextResponse.json({ error: 'eBay token refresh failed — please reconnect' }, { status: 401 })
    }
    let userToken = tokenResult.accessToken
    let synced = 0
    let cursor: string | null = null

    // Load user profit settings
    const profitSettings = await getProfitSettings(ctx.user.id)

    // Pre-load cost_price map from listings table (service role — filter by org)
    const { data: costRows } = await getAdmin()
      .from('listings')
      .select('sku, cost_price')
      .eq('organization_id', ctx.id)
      .not('sku', 'is', null)
      .not('cost_price', 'is', null)
    const costBySku: Record<string, number> = {}
    for (const r of costRows || []) {
      if (r.sku) costBySku[r.sku] = r.cost_price
    }

    // Fetch up to 90 days of orders via Fulfillment API
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    while (true) {
      const url = new URL('https://api.ebay.com/sell/fulfillment/v1/order')
      url.searchParams.set('filter', `creationdate:[${since}..]`)
      url.searchParams.set('limit', '200')
      if (cursor) url.searchParams.set('offset', cursor)

      let res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      if (res.status === 401) {
        // Force a refresh (cached token may have been revoked mid-run)
        const { data: fresh } = await getAdmin()
          .from('channels')
          .select('access_token, refresh_token, metadata')
          .eq('organization_id', ctx.id)
          .eq('type', 'ebay')
          .single()
        if (fresh) {
          const meta = (fresh.metadata as Record<string, unknown> | null) ?? {}
          const r = await getEbayAccessToken(
            {
              user_id: ctx.user.id,
              access_token: fresh.access_token as string | null,
              refresh_token: (fresh.refresh_token as string | null) ?? null,
              metadata: { ...meta, ebay_token_expires_at: 0 },
            },
            getAdmin(),
          )
          if (r) {
            userToken = r.accessToken
            res = await fetch(url.toString(), {
              headers: { Authorization: `Bearer ${userToken}` },
            })
          }
        }
      }

      if (!res.ok) {
        console.error('[ebay:orders:sync] fetch failed:', res.status, await res.text())
        break
      }

      const data = await res.json()
      const orders = data.orders || []

      for (const order of orders) {
        for (const item of order.lineItems || []) {
          const qty          = item.quantity || 1
          const salePrice    = parseFloat(item.lineItemCost?.value || '0') * qty
          const channelFee   = salePrice * (profitSettings.ebay_fee_pct / 100)
          const shippingCost = order.fulfillmentStartInstructions?.[0]?.shippingStep?.shippingCarrierCode
            ? profitSettings.default_shipping_cost : 0
          const sku          = item.sku || item.legacyItemId || ''
          // Use real cost if known, fall back to user's default COGS %
          const supplierCost = costBySku[sku] != null
            ? costBySku[sku] * qty
            : salePrice * (profitSettings.default_cogs_pct / 100)
          const trueProfit   = salePrice - supplierCost - channelFee - shippingCost

          await getAdmin().from('transactions').upsert({
            organization_id:  ctx.id,
            user_id:          ctx.user.id,
            channel:          'ebay',
            external_id:      `ebay-${order.orderId}-${item.lineItemId}`,
            sku,
            title:            item.title || 'eBay item',
            category:         '',
            sale_price:       salePrice,
            supplier_cost:    supplierCost,
            channel_fee:      channelFee,
            advertising_cost: 0,
            shipping_cost:    shippingCost,
            return_cost:      0,
            gross_revenue:    salePrice,
            true_profit:      trueProfit,
            true_margin:      salePrice > 0 ? (trueProfit / salePrice) * 100 : 0,
            order_date:       order.creationDate,
            buyer_location:   order.buyer?.buyerRegistrationAddress?.countryCode || 'GB',
          }, { onConflict: 'user_id,external_id,channel' })

          synced++
        }
      }

      // Check for next page
      const nextOffset = data.next
      if (!nextOffset || orders.length < 200) break
      const nextUrl = new URL(nextOffset, 'https://api.ebay.com')
      cursor = nextUrl.searchParams.get('offset')
      if (!cursor) break
    }

    console.log(`[ebay:orders:sync] org=${ctx.id} synced=${synced}`)

    return NextResponse.json({
      synced,
      message: synced > 0
        ? `Synced ${synced} eBay order${synced !== 1 ? 's' : ''}`
        : 'No new eBay orders found',
    })
  } catch (err: any) {
    console.error('[ebay:orders:sync] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
