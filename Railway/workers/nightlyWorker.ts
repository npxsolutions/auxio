/**
 * AUXIO NIGHTLY INTELLIGENCE WORKER
 * Runs on Railway every night at 2am
 * 
 * This is the compounding machine:
 * Every night it processes all transactions
 * Updates all ML models
 * Generates all insights
 * Runs the agent cycle
 * 
 * Gets smarter every single night
 * Like compound interest — never stops
 */

import { createClient } from '@supabase/supabase-js'
import {
  TransactionIntelligenceEngine,
  ValueMultiplier,
  ClaudeIntelligenceLayer,
  AuxioAgent,
  captureTransaction,
} from '../../lib/intelligence/transactionEngine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// ── STEP 1: SYNC ALL CHANNEL DATA ──
async function syncAllChannels(userId: string) {
  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)

  if (!channels?.length) return

  for (const channel of channels) {
    try {
      switch (channel.type) {
        case 'ebay':
          await syncEbayOrders(userId, channel)
          break
        case 'amazon':
          await syncAmazonOrders(userId, channel)
          await syncAmazonPPC(userId, channel)
          break
        case 'shopify':
          await syncShopifyOrders(userId, channel)
          break
      }
      console.log(`Synced ${channel.type} for user ${userId}`)
    } catch (error) {
      console.error(`Failed to sync ${channel.type} for user ${userId}:`, error)
      await logSyncError(userId, channel.type, error)
    }
  }
}

async function syncEbayOrders(userId: string, channel: any) {
  // Call eBay Orders API
  const response = await fetch(
    'https://api.ebay.com/sell/fulfillment/v1/order?filter=orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS}&limit=200',
    {
      headers: {
        'Authorization': `Bearer ${channel.access_token}`,
        'Content-Type': 'application/json',
      }
    }
  )

  if (!response.ok) {
    throw new Error(`eBay API error: ${response.status}`)
  }

  const data = await response.json()
  const orders = data.orders || []

  // Get supplier costs from products table
  const skus = [...new Set(orders.map((o: any) => o.lineItems?.[0]?.sku))]
  const { data: products } = await supabase
    .from('products')
    .select('sku, supplier_cost')
    .eq('user_id', userId)
    .in('sku', skus)

  const costBySku = products?.reduce((acc: any, p: any) => {
    acc[p.sku] = p.supplier_cost
    return acc
  }, {}) || {}

  // Process each order
  for (const order of orders) {
    const lineItem = order.lineItems?.[0]
    if (!lineItem) continue

    const salePrice = parseFloat(order.pricingSummary?.total?.value || 0)
    const ebayFee = salePrice * 0.128
    const promoFee = salePrice * (channel.promo_rate || 0.05)

    await captureTransaction(userId, {
      id: order.orderId,
      orderId: order.orderId,
      sku: lineItem.sku,
      title: lineItem.title,
      category: lineItem.categoryId,
      salePrice,
      supplierCost: costBySku[lineItem.sku] || 0,
      channelFee: ebayFee + promoFee,
      adCost: promoFee,
      shippingCost: parseFloat(order.pricingSummary?.deliveryCost?.value || 3.95),
      orderDate: order.creationDate,
      buyerLocation: order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.countryCode || 'GB',
    }, 'ebay')
  }

  console.log(`Synced ${orders.length} eBay orders for user ${userId}`)
}

async function syncAmazonOrders(userId: string, channel: any) {
  // Call Amazon SP-API Orders endpoint
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const response = await fetch(
    `https://sellingpartnerapi-eu.amazon.com/orders/v0/orders?CreatedAfter=${yesterday}&MarketplaceIds=A1F83G8C2ARO7P`,
    {
      headers: {
        'x-amz-access-token': channel.access_token,
        'x-amz-date': new Date().toISOString(),
      }
    }
  )

  if (!response.ok) throw new Error(`Amazon API error: ${response.status}`)

  const data = await response.json()
  const orders = data.payload?.Orders || []

  for (const order of orders) {
    const salePrice = parseFloat(order.OrderTotal?.Amount || 0)
    const amazonFee = salePrice * 0.15 // approximate — real fees from Finances API

    await captureTransaction(userId, {
      id: order.AmazonOrderId,
      orderId: order.AmazonOrderId,
      sku: order.ASIN || 'unknown',
      title: order.Title || 'Amazon Order',
      category: order.ProductType || 'unknown',
      salePrice,
      supplierCost: 0, // updated separately from product catalogue
      channelFee: amazonFee,
      adCost: 0, // updated from Amazon Ads API
      shippingCost: 0, // FBA handles this
      orderDate: order.PurchaseDate,
      buyerLocation: order.ShipServiceLevel || 'UK',
    }, 'amazon')
  }

  console.log(`Synced ${orders.length} Amazon orders for user ${userId}`)
}

async function syncAmazonPPC(userId: string, channel: any) {
  // Request Search Term Report from Amazon Ads API
  const reportResponse = await fetch(
    'https://advertising-api-eu.amazon.com/reporting/reports',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channel.ads_access_token}`,
        'Amazon-Advertising-API-ClientId': process.env.AMAZON_ADS_CLIENT_ID!,
        'Amazon-Advertising-API-Scope': channel.ads_profile_id,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Weekly Search Terms ${new Date().toISOString()}`,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        configuration: {
          adProduct: 'SPONSORED_PRODUCTS',
          reportTypeId: 'spSearchTerm',
          timeUnit: 'SUMMARY',
          format: 'GZIP_JSON',
          metrics: ['impressions', 'clicks', 'spend', 'sales7d', 'orders7d', 'acos7d', 'keywordBid', 'matchType', 'campaignId', 'adGroupId', 'keywordId', 'keyword']
        }
      })
    }
  )

  if (!reportResponse.ok) {
    console.error('Failed to request Amazon Ads report')
    return
  }

  const { reportId } = await reportResponse.json()

  // Poll until ready (max 10 minutes)
  let attempts = 0
  let downloadUrl = null

  while (attempts < 20 && !downloadUrl) {
    await new Promise(resolve => setTimeout(resolve, 30000)) // wait 30s

    const statusResponse = await fetch(
      `https://advertising-api-eu.amazon.com/reporting/reports/${reportId}`,
      {
        headers: {
          'Authorization': `Bearer ${channel.ads_access_token}`,
          'Amazon-Advertising-API-ClientId': process.env.AMAZON_ADS_CLIENT_ID!,
          'Amazon-Advertising-API-Scope': channel.ads_profile_id,
        }
      }
    )

    const status = await statusResponse.json()
    if (status.status === 'COMPLETED') {
      downloadUrl = status.url
    } else if (status.status === 'FAILED') {
      console.error('Amazon Ads report failed')
      return
    }

    attempts++
  }

  if (!downloadUrl) {
    console.error('Amazon Ads report timed out')
    return
  }

  // Download and process report
  const reportData = await fetch(downloadUrl).then(r => r.json())
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const rows = reportData.map((row: any) => ({
    user_id: userId,
    week_start: weekStart,
    keyword_id: row.keywordId,
    keyword_text: row.keyword,
    match_type: row.matchType,
    campaign_id: row.campaignId,
    ad_group_id: row.adGroupId,
    impressions: row.impressions || 0,
    clicks: row.clicks || 0,
    spend: row.spend || 0,
    revenue: row.sales7d || 0,
    orders: row.orders7d || 0,
    acos: row.acos7d || 0,
    bid: row.keywordBid || 0,
    conversion_rate: row.clicks > 0 ? (row.orders7d / row.clicks) * 100 : 0,
    score: 50, // will be calculated by ML model
    recorded_at: new Date().toISOString(),
  }))

  // Upsert — safe to run twice
  await supabase
    .from('ppc_keyword_performance')
    .upsert(rows, { onConflict: 'user_id,keyword_id,recorded_at' })

  // Clean old data (keep 90 days)
  await supabase
    .from('ppc_keyword_performance')
    .delete()
    .eq('user_id', userId)
    .lt('recorded_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

  console.log(`Synced ${rows.length} Amazon PPC keywords for user ${userId}`)
}

async function syncShopifyOrders(userId: string, channel: any) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const response = await fetch(
    `https://${channel.shop_name}/admin/api/2024-01/orders.json?status=any&created_at_min=${yesterday}&limit=250`,
    {
      headers: {
        'X-Shopify-Access-Token': channel.access_token,
      }
    }
  )

  if (!response.ok) throw new Error(`Shopify API error: ${response.status}`)

  const { orders } = await response.json()

  for (const order of orders) {
    const salePrice = parseFloat(order.total_price)

    await captureTransaction(userId, {
      id: order.id.toString(),
      orderId: order.id.toString(),
      sku: order.line_items?.[0]?.sku || order.name,
      title: order.line_items?.[0]?.title || 'Shopify Order',
      category: 'shopify',
      salePrice,
      supplierCost: 0,
      channelFee: salePrice * 0.02, // Shopify payment processing
      adCost: 0,
      shippingCost: parseFloat(order.shipping_lines?.[0]?.price || 0),
      orderDate: order.created_at,
      buyerLocation: order.shipping_address?.country_code || 'GB',
    }, 'shopify')
  }

  console.log(`Synced ${orders.length} Shopify orders for user ${userId}`)
}

// ── STEP 2: UPDATE ML MODELS ──
async function updateMLModels(userId: string) {
  // Import the ML training function
  const { weeklyModelTraining } = await import('./trainBidModel')

  // Only retrain on Sundays to save compute
  if (new Date().getDay() === 0) {
    await weeklyModelTraining()
    console.log(`ML models updated for user ${userId}`)
  }
}

// ── STEP 3: CALCULATE INTELLIGENCE ──
async function calculateIntelligence(userId: string) {
  const engine = new TransactionIntelligenceEngine()

  const [margins, velocity, pricing] = await Promise.all([
    engine.analyseMargins(userId),
    engine.analyseVelocity(userId),
    engine.analysePricing(userId),
  ])

  // Cache product intelligence
  const productIntelligence = margins.byProduct.map(p => {
    const velocityData = velocity.find(v => v.sku === p.sku)
    const pricingData = pricing.find(pr => pr.sku === p.sku)

    return {
      user_id: userId,
      sku: p.sku,
      avg_margin_90d: p.avgMargin,
      margin_trend: p.marginTrend,
      margin_signal: p.signal,
      vs_network_benchmark: p.vsNetwork,
      velocity_7d: velocityData?.velocity7d || 0,
      velocity_30d: velocityData?.velocity30d || 0,
      days_until_stockout: velocityData?.daysUntilStockout || 999,
      reorder_urgency: velocityData?.urgency || 'ok',
      predicted_30d_units: velocityData?.predicted30d || 0,
      predicted_30d_revenue: velocityData?.predictedRevenue || 0,
      current_price: pricingData?.currentPrice || 0,
      recommended_price: pricingData?.recommendedPrice || 0,
      price_recommendation_reason: pricingData?.recommendationReason || '',
      calculated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    }
  })

  if (productIntelligence.length > 0) {
    await supabase
      .from('product_intelligence')
      .upsert(productIntelligence, { onConflict: 'user_id,sku' })
  }

  console.log(`Intelligence calculated for ${productIntelligence.length} products for user ${userId}`)
}

// ── STEP 4: GENERATE INSIGHTS ──
async function generateInsights(userId: string) {
  const claude = new ClaudeIntelligenceLayer()
  await claude.generateInsights(userId)
  console.log(`Insights generated for user ${userId}`)
}

// ── STEP 5: RUN AGENT ──
async function runAgent(userId: string) {
  const { data: userData } = await supabase
    .from('users')
    .select('agent_mode, plan')
    .eq('id', userId)
    .single()

  // Only run agent for Growth+ plans
  if (!userData || userData.plan === 'starter') return

  const agent = new AuxioAgent()
  const result = await agent.runAgentCycle(
    userId,
    userData.agent_mode || 'copilot'
  )

  console.log(`Agent ran for user ${userId}: ${result.actionsExecuted.length} actions, ${result.pendingApprovals.length} pending`)
}

// ── STEP 6: CALCULATE LEVERAGE RATIO ──
async function calculateLeverage(userId: string) {
  const multiplier = new ValueMultiplier()
  const leverage = await multiplier.calculateLeverageRatio(userId)

  await supabase.from('leverage_analysis').insert({
    user_id: userId,
    subscription_cost: leverage.subscriptionCost,
    margin_optimisation_value: leverage.valueByLayer.marginOptimisation,
    inventory_intelligence_value: leverage.valueByLayer.inventoryIntelligence,
    pricing_optimisation_value: leverage.valueByLayer.pricingOptimisation,
    ppc_optimisation_value: leverage.valueByLayer.ppcOptimisation,
    total_value_created: leverage.totalValueCreated,
    leverage_ratio: leverage.leverageRatio,
    calculated_at: new Date().toISOString(),
  })

  console.log(`Leverage ratio for user ${userId}: ${leverage.leverageRatio}× (${leverage.message})`)
}

// ── HELPER: LOG ERRORS ──
async function logSyncError(userId: string, channel: string, error: any) {
  await supabase.from('sync_jobs').insert({
    user_id: userId,
    job_type: `sync_${channel}`,
    status: 'failed',
    error: error?.message || String(error),
    completed_at: new Date().toISOString(),
  })
}

// ── MAIN: PROCESS ALL USERS ──
async function main() {
  console.log(`\n🚀 Auxio Intelligence Worker Starting — ${new Date().toISOString()}`)
  console.log('The compounding machine is running...\n')

  // Get all active users
  const { data: users } = await supabase
    .from('users')
    .select('id, plan')
    .not('plan', 'is', null)

  if (!users?.length) {
    console.log('No active users found')
    return
  }

  console.log(`Processing ${users.length} users...\n`)

  let processed = 0
  let failed = 0

  for (const user of users) {
    const startTime = Date.now()

    try {
      console.log(`\n━━━ Processing user ${user.id} (${user.plan} plan) ━━━`)

      // Run all 6 steps in sequence
      await syncAllChannels(user.id)
      await updateMLModels(user.id)
      await calculateIntelligence(user.id)
      await generateInsights(user.id)
      await runAgent(user.id)
      await calculateLeverage(user.id)

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`✅ User ${user.id} completed in ${elapsed}s`)
      processed++

    } catch (error) {
      console.error(`❌ User ${user.id} failed:`, error)
      await logSyncError(user.id, 'nightly_worker', error)
      failed++
    }

    // Throttle between users to avoid API rate limits
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`Nightly worker complete`)
  console.log(`✅ Processed: ${processed} users`)
  console.log(`❌ Failed: ${failed} users`)
  console.log(`📊 The machine got smarter tonight`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

// Run
main().catch(error => {
  console.error('Fatal worker error:', error)
  process.exit(1)
})
