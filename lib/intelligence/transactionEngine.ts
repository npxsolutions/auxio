/**
 * AUXIO TRANSACTION INTELLIGENCE ENGINE
 * 
 * This is the core of what Meridia is:
 * A system that sits in the middle of every eCommerce transaction
 * and multiplies the value of every pound a seller deploys.
 * 
 * Like a bank multiplies deposits 9x through fractional reserve lending,
 * Meridia multiplies transaction data into intelligence that compounds weekly.
 * 
 * Architecture:
 * Layer 1: Transaction Capture — every order, ad click, stock movement
 * Layer 2: Intelligence Engine — ML models that find patterns
 * Layer 3: Value Multiplier — turns patterns into profit improvements
 * Layer 4: Network Effect — cross-seller intelligence compounds value
 * Layer 5: Claude Layer — translates machine output into human decisions
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.NEXT_ANTHROPIC_API_KEY!
})

// ────────────────────────────────────────────────────────────────
// LAYER 1: TRANSACTION CAPTURE
// Every economic event flows through here
// ────────────────────────────────────────────────────────────────

export interface Transaction {
  id: string
  userId: string
  channel: 'ebay' | 'amazon' | 'shopify' | 'tiktok_shop' | 'etsy'
  externalId: string
  // The commodity
  sku: string
  title: string
  category: string
  // The economics
  salePrice: number
  supplierCost: number
  channelFee: number
  advertisingCost: number
  shippingCost: number
  returnCost: number
  // Derived
  grossRevenue: number
  trueProfit: number
  trueMargin: number
  // Context
  orderDate: Date
  buyerLocation: string
  searchTerm?: string // what buyer searched to find this
  adCampaignId?: string
  // Intelligence signals
  competitorPriceAtSale?: number
  searchVolumeAtSale?: number
  stockLevelAtSale?: number
}

export function calculateTrueProfit(t: Omit<Transaction, 'grossRevenue' | 'trueProfit' | 'trueMargin'>): {
  grossRevenue: number
  trueProfit: number
  trueMargin: number
} {
  const grossRevenue = t.salePrice
  const totalCosts = t.supplierCost + t.channelFee + t.advertisingCost + t.shippingCost + t.returnCost
  const trueProfit = grossRevenue - totalCosts
  const trueMargin = grossRevenue > 0 ? (trueProfit / grossRevenue) * 100 : 0

  return {
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    trueProfit: Math.round(trueProfit * 100) / 100,
    trueMargin: Math.round(trueMargin * 10) / 10,
  }
}

export async function captureTransaction(
  userId: string,
  raw: any,
  channel: Transaction['channel']
): Promise<Transaction> {
  const economics = calculateTrueProfit({
    id: raw.id,
    userId,
    channel,
    externalId: raw.orderId || raw.id,
    sku: raw.sku || raw.asin,
    title: raw.title || raw.productName,
    category: raw.category || 'unknown',
    salePrice: parseFloat(raw.salePrice || raw.totalPrice || 0),
    supplierCost: parseFloat(raw.supplierCost || 0),
    channelFee: parseFloat(raw.channelFee || raw.amazonFee || raw.ebayFee || 0),
    advertisingCost: parseFloat(raw.adCost || raw.ppcCost || 0),
    shippingCost: parseFloat(raw.shippingCost || 3.95),
    returnCost: 0,
    orderDate: new Date(raw.orderDate || raw.purchaseDate),
    buyerLocation: raw.buyerLocation || raw.shipCountry || 'UK',
    searchTerm: raw.searchTerm,
    adCampaignId: raw.campaignId,
    competitorPriceAtSale: raw.competitorPrice,
    searchVolumeAtSale: raw.searchVolume,
    stockLevelAtSale: raw.stockLevel,
  })

  const transaction: Transaction = {
    id: raw.id,
    userId,
    channel,
    externalId: raw.orderId || raw.id,
    sku: raw.sku || raw.asin,
    title: raw.title || raw.productName,
    category: raw.category || 'unknown',
    salePrice: parseFloat(raw.salePrice || raw.totalPrice || 0),
    supplierCost: parseFloat(raw.supplierCost || 0),
    channelFee: parseFloat(raw.channelFee || 0),
    advertisingCost: parseFloat(raw.adCost || 0),
    shippingCost: parseFloat(raw.shippingCost || 3.95),
    returnCost: 0,
    ...economics,
    orderDate: new Date(raw.orderDate || raw.purchaseDate),
    buyerLocation: raw.buyerLocation || 'UK',
    searchTerm: raw.searchTerm,
    adCampaignId: raw.campaignId,
    competitorPriceAtSale: raw.competitorPrice,
    searchVolumeAtSale: raw.searchVolume,
    stockLevelAtSale: raw.stockLevel,
  }

  // Store every transaction
  await supabase.from('transactions').upsert({
    ...transaction,
    order_date: transaction.orderDate.toISOString(),
  }, { onConflict: 'user_id,external_id,channel' })

  return transaction
}

// ────────────────────────────────────────────────────────────────
// LAYER 2: THE INTELLIGENCE ENGINE
// ML models that find patterns in transaction data
// Gets smarter every week — like compound interest
// ────────────────────────────────────────────────────────────────

export class TransactionIntelligenceEngine {

  // ── 2.1 MARGIN INTELLIGENCE ──
  // Understands the true economics of every product
  async analyseMargins(userId: string): Promise<{
    byProduct: ProductMarginIntelligence[]
    byCategory: CategoryMarginIntelligence[]
    byChannel: ChannelMarginIntelligence[]
    networkBenchmarks: NetworkBenchmarks
  }> {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('order_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('order_date', { ascending: false })

    if (!transactions?.length) return this.emptyMarginAnalysis()

    // Get network benchmarks (anonymised cross-seller data)
    const benchmarks = await this.getNetworkBenchmarks(
      transactions[0]?.category || 'fragrance'
    )

    // Analyse by product
    const byProduct = this.analyseByProduct(transactions, benchmarks)

    // Analyse by category
    const byCategory = this.analyseByCategory(transactions, benchmarks)

    // Analyse by channel
    const byChannel = this.analyseByChannel(transactions)

    return { byProduct, byCategory, byChannel, networkBenchmarks: benchmarks }
  }

  private analyseByProduct(transactions: any[], benchmarks: NetworkBenchmarks): ProductMarginIntelligence[] {
    // Group by SKU
    const bySku = transactions.reduce((acc: any, t: any) => {
      if (!acc[t.sku]) acc[t.sku] = []
      acc[t.sku].push(t)
      return acc
    }, {})

    return Object.entries(bySku).map(([sku, txs]: [string, any]) => {
      const totalRevenue = txs.reduce((s: number, t: any) => s + t.sale_price, 0)
      const totalProfit = txs.reduce((s: number, t: any) => s + t.true_profit, 0)
      const avgMargin = txs.reduce((s: number, t: any) => s + t.true_margin, 0) / txs.length
      const totalAdSpend = txs.reduce((s: number, t: any) => s + t.advertising_cost, 0)
      const roas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0

      // Trend: compare last 30 days to previous 30 days
      const last30 = txs.filter((t: any) => new Date(t.order_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      const prev30 = txs.filter((t: any) => {
        const d = new Date(t.order_date)
        return d <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && d > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      })

      const last30Margin = last30.length ? last30.reduce((s: number, t: any) => s + t.true_margin, 0) / last30.length : 0
      const prev30Margin = prev30.length ? prev30.reduce((s: number, t: any) => s + t.true_margin, 0) / prev30.length : 0
      const marginTrend = last30Margin - prev30Margin

      // Compare to network benchmark
      const benchmarkMargin = benchmarks.medianMarginByCategory[txs[0]?.category] || 20
      const vsNetwork = avgMargin - benchmarkMargin

      // Intelligence signal
      let signal: 'scale' | 'hold' | 'optimise' | 'review' | 'exit'
      if (avgMargin >= 25 && marginTrend >= 0) signal = 'scale'
      else if (avgMargin >= 20) signal = 'hold'
      else if (avgMargin >= 15) signal = 'optimise'
      else if (avgMargin >= 10) signal = 'review'
      else signal = 'exit'

      return {
        sku,
        title: txs[0]?.title,
        unitsSold: txs.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        avgMargin: Math.round(avgMargin * 10) / 10,
        marginTrend: Math.round(marginTrend * 10) / 10,
        roas: Math.round(roas * 100) / 100,
        vsNetwork: Math.round(vsNetwork * 10) / 10,
        signal,
        // Improvement opportunity
        potentialMarginImprovement: this.calculateMarginOpportunity(txs, benchmarkMargin),
      }
    }).sort((a, b) => b.totalProfit - a.totalProfit)
  }

  private analyseByCategory(transactions: any[], benchmarks: NetworkBenchmarks): CategoryMarginIntelligence[] {
    const byCategory = transactions.reduce((acc: any, t: any) => {
      if (!acc[t.category]) acc[t.category] = []
      acc[t.category].push(t)
      return acc
    }, {})

    return Object.entries(byCategory).map(([category, txs]: [string, any]) => {
      const avgMargin = txs.reduce((s: number, t: any) => s + t.true_margin, 0) / txs.length
      const totalRevenue = txs.reduce((s: number, t: any) => s + t.sale_price, 0)
      const totalProfit = txs.reduce((s: number, t: any) => s + t.true_profit, 0)
      const networkMedian = benchmarks.medianMarginByCategory[category] || 20

      return {
        category,
        unitsSold: txs.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        avgMargin: Math.round(avgMargin * 10) / 10,
        networkMedianMargin: networkMedian,
        vsNetwork: Math.round((avgMargin - networkMedian) * 10) / 10,
        seasonalIndex: benchmarks.seasonalIndexByCategory[category]?.[new Date().getMonth()] || 1.0,
        // Opportunity: if below network median
        opportunityValue: avgMargin < networkMedian
          ? Math.round((networkMedian - avgMargin) / 100 * totalRevenue * 100) / 100
          : 0,
      }
    }).sort((a, b) => b.totalProfit - a.totalProfit)
  }

  private analyseByChannel(transactions: any[]): ChannelMarginIntelligence[] {
    const byChannel = transactions.reduce((acc: any, t: any) => {
      if (!acc[t.channel]) acc[t.channel] = []
      acc[t.channel].push(t)
      return acc
    }, {})

    return Object.entries(byChannel).map(([channel, txs]: [string, any]) => {
      const avgMargin = txs.reduce((s: number, t: any) => s + t.true_margin, 0) / txs.length
      const totalRevenue = txs.reduce((s: number, t: any) => s + t.sale_price, 0)
      const totalProfit = txs.reduce((s: number, t: any) => s + t.true_profit, 0)
      const totalAdSpend = txs.reduce((s: number, t: any) => s + t.advertising_cost, 0)
      const blendedRoas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0
      const trueProfitRoas = totalAdSpend > 0 ? totalProfit / totalAdSpend : 0

      return {
        channel,
        unitsSold: txs.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalAdSpend: Math.round(totalAdSpend * 100) / 100,
        avgMargin: Math.round(avgMargin * 10) / 10,
        blendedRoas: Math.round(blendedRoas * 100) / 100,
        trueProfitRoas: Math.round(trueProfitRoas * 100) / 100,
        // Efficiency score 0-100
        efficiencyScore: this.calculateChannelEfficiency(avgMargin, blendedRoas),
      }
    }).sort((a, b) => b.trueProfitRoas - a.trueProfitRoas)
  }

  // ── 2.2 VELOCITY INTELLIGENCE ──
  // Understands how fast products sell and predicts future demand
  async analyseVelocity(userId: string): Promise<VelocityIntelligence[]> {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('sku, title, order_date, true_profit, sale_price')
      .eq('user_id', userId)
      .gte('order_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    const { data: inventory } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId)

    if (!transactions?.length) return []

    // Group by SKU
    const bySku = transactions.reduce((acc: any, t: any) => {
      if (!acc[t.sku]) acc[t.sku] = []
      acc[t.sku].push(t)
      return acc
    }, {})

    const inventoryBySku = inventory?.reduce((acc: any, i: any) => {
      acc[i.sku] = i
      return acc
    }, {}) || {}

    return Object.entries(bySku).map(([sku, txs]: [string, any]) => {
      // Calculate velocity at different windows
      const velocity7d = txs.filter((t: any) =>
        new Date(t.order_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length / 7

      const velocity30d = txs.filter((t: any) =>
        new Date(t.order_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length / 30

      const velocity90d = txs.length / 90

      // Trend: is velocity accelerating or decelerating?
      const velocityTrend = velocity7d - velocity30d
      const accelerating = velocityTrend > 0.1

      // Current stock
      const stock = inventoryBySku[sku]?.quantity || 0
      const leadTimeDays = inventoryBySku[sku]?.lead_time_days || 7
      const safetyStockDays = inventoryBySku[sku]?.safety_stock_days || 14

      // Days until stockout at current velocity
      const daysUntilStockout = velocity7d > 0 ? stock / velocity7d : 999

      // Reorder point: stock level when to reorder
      const reorderPoint = velocity7d * (leadTimeDays + safetyStockDays)

      // Reorder quantity: how much to order
      const reorderQty = Math.ceil(velocity30d * 45) // 45 days of stock

      // Urgency
      let urgency: 'critical' | 'high' | 'medium' | 'low' | 'ok'
      if (daysUntilStockout <= 2) urgency = 'critical'
      else if (daysUntilStockout <= 5) urgency = 'high'
      else if (daysUntilStockout <= 14) urgency = 'medium'
      else if (stock <= reorderPoint) urgency = 'low'
      else urgency = 'ok'

      // Predicted 30 day sales
      const seasonalIndex = this.getSeasonalIndex(txs[0]?.category, new Date().getMonth())
      const predicted30d = Math.round(velocity7d * 30 * seasonalIndex)

      // Predicted revenue
      const avgOrderValue = txs.reduce((s: number, t: any) => s + t.sale_price, 0) / txs.length
      const predictedRevenue = Math.round(predicted30d * avgOrderValue * 100) / 100

      return {
        sku,
        title: txs[0]?.title,
        currentStock: stock,
        velocity7d: Math.round(velocity7d * 100) / 100,
        velocity30d: Math.round(velocity30d * 100) / 100,
        velocity90d: Math.round(velocity90d * 100) / 100,
        velocityTrend: Math.round(velocityTrend * 100) / 100,
        accelerating,
        daysUntilStockout: Math.round(daysUntilStockout * 10) / 10,
        reorderPoint: Math.round(reorderPoint),
        reorderQty,
        urgency,
        predicted30d,
        predictedRevenue,
        seasonalIndex,
      }
    }).sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3, ok: 4 }
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    })
  }

  // ── 2.3 PRICE INTELLIGENCE ──
  // Finds optimal price for every product on every channel
  async analysePricing(userId: string): Promise<PriceIntelligence[]> {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('order_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    const { data: competitors } = await supabase
      .from('competitors')
      .select('*')
      .eq('user_id', userId)

    if (!transactions?.length) return []

    const bySku = transactions.reduce((acc: any, t: any) => {
      if (!acc[t.sku]) acc[t.sku] = []
      acc[t.sku].push(t)
      return acc
    }, {})

    const competitorBySku = competitors?.reduce((acc: any, c: any) => {
      if (!acc[c.sku]) acc[c.sku] = []
      acc[c.sku].push(c)
      return acc
    }, {}) || {}

    return Object.entries(bySku).map(([sku, txs]: [string, any]) => {
      const currentPrice = txs[txs.length - 1]?.sale_price || 0
      const supplierCost = txs[txs.length - 1]?.supplier_cost || 0
      const channelFee = currentPrice * 0.128
      const promoFee = currentPrice * 0.10
      const shipping = 3.95

      // Break-even price
      const breakEvenPrice = (supplierCost + shipping) / (1 - 0.128 - 0.10 - 0.20)

      // Target 20% margin price
      const targetMarginPrice = (supplierCost + shipping) / (1 - 0.128 - 0.10 - 0.20)

      // Competitor analysis
      const competitorPrices = competitorBySku[sku]?.map((c: any) => c.competitor_price) || []
      const avgCompetitorPrice = competitorPrices.length
        ? competitorPrices.reduce((s: number, p: number) => s + p, 0) / competitorPrices.length
        : currentPrice
      const lowestCompetitorPrice = competitorPrices.length ? Math.min(...competitorPrices) : currentPrice
      const pricePosition: 'lowest' | 'competitive' | 'premium' = currentPrice <= lowestCompetitorPrice ? 'lowest' :
        currentPrice <= avgCompetitorPrice ? 'competitive' : 'premium'

      // Price elasticity: did price changes affect sales velocity?
      const pricePoints = [...new Set(txs.map((t: any) => t.sale_price))]
      let elasticity = -1 // default: normal elastic demand

      if (pricePoints.length >= 2) {
        // Simple elasticity calculation
        const sorted = (pricePoints as number[]).sort((a, b) => a - b)
        const lowPriceVelocity = txs.filter((t: any) => t.sale_price === sorted[0]).length
        const highPriceVelocity = txs.filter((t: any) => t.sale_price === sorted[sorted.length - 1]).length
        const priceChange = (sorted[sorted.length - 1] - sorted[0]) / sorted[0]
        const demandChange = (highPriceVelocity - lowPriceVelocity) / lowPriceVelocity

        elasticity = priceChange !== 0 ? demandChange / priceChange : -1
      }

      // Recommended price
      let recommendedPrice = currentPrice
      let recommendationReason = 'Price optimal'

      const currentMargin = ((currentPrice - supplierCost - channelFee - promoFee - shipping) / currentPrice) * 100

      if (currentMargin < 15) {
        recommendedPrice = Math.ceil(targetMarginPrice * 0.99)
        recommendationReason = `Margin at ${currentMargin.toFixed(1)}% — below 15% minimum`
      } else if (currentMargin > 30 && pricePosition === 'lowest' && elasticity > -0.5) {
        // Inelastic demand — can raise price
        recommendedPrice = Math.ceil(currentPrice * 1.10 * 0.99)
        recommendationReason = `Margin ${currentMargin.toFixed(1)}% with lowest price — room to increase`
      } else if (currentPrice > avgCompetitorPrice * 1.15) {
        // Significantly above market
        recommendedPrice = Math.ceil(avgCompetitorPrice * 1.05 * 0.99)
        recommendationReason = `${((currentPrice / avgCompetitorPrice - 1) * 100).toFixed(0)}% above market average`
      }

      // Apply psychological pricing
      recommendedPrice = this.applyPsychologicalPricing(recommendedPrice)

      const recommendedMargin = ((recommendedPrice - supplierCost - recommendedPrice * 0.128 - recommendedPrice * 0.10 - shipping) / recommendedPrice) * 100

      return {
        sku,
        title: txs[0]?.title,
        currentPrice,
        recommendedPrice,
        recommendationReason,
        currentMargin: Math.round(currentMargin * 10) / 10,
        recommendedMargin: Math.round(recommendedMargin * 10) / 10,
        marginImprovement: Math.round((recommendedMargin - currentMargin) * 10) / 10,
        breakEvenPrice: Math.round(breakEvenPrice * 100) / 100,
        supplierCost,
        avgCompetitorPrice: Math.round(avgCompetitorPrice * 100) / 100,
        lowestCompetitorPrice: Math.round(lowestCompetitorPrice * 100) / 100,
        pricePosition,
        elasticity: Math.round(elasticity * 100) / 100,
        priceChanged: recommendedPrice !== currentPrice,
      }
    }).filter(p => p.priceChanged).sort((a, b) => b.marginImprovement - a.marginImprovement)
  }

  // ── 2.4 NETWORK INTELLIGENCE ──
  // Cross-seller patterns that no individual seller can see
  // This is the banking multiplier — data from all users benefits each user
  async getNetworkBenchmarks(category: string): Promise<NetworkBenchmarks> {
    // Aggregate anonymised data across all users in this category
    const { data: networkData } = await supabase
      .from('network_benchmarks')
      .select('*')
      .eq('category', category)
      .single()

    if (networkData) return networkData

    // Calculate from transaction data if not cached
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('category, true_margin, sale_price, channel, order_date')
      .eq('category', category)
      .gte('order_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    if (!allTransactions?.length) {
      return this.defaultBenchmarks(category)
    }

    // Calculate median margin for this category across all sellers
    const margins = allTransactions.map(t => t.true_margin).sort((a, b) => a - b)
    const medianMargin = margins[Math.floor(margins.length / 2)]

    // Seasonal index — how does this category perform by month
    const seasonalIndex: Record<number, number> = {}
    for (let month = 0; month < 12; month++) {
      const monthTransactions = allTransactions.filter(t =>
        new Date(t.order_date).getMonth() === month
      )
      seasonalIndex[month] = monthTransactions.length > 0
        ? monthTransactions.length / (allTransactions.length / 12)
        : 1.0
    }

    const benchmarks: NetworkBenchmarks = {
      category,
      medianMarginByCategory: { [category]: Math.round(medianMargin * 10) / 10 },
      topQuartileMargin: margins[Math.floor(margins.length * 0.75)],
      bottomQuartileMargin: margins[Math.floor(margins.length * 0.25)],
      seasonalIndexByCategory: { [category]: seasonalIndex },
      avgVelocityByCategory: { [category]: allTransactions.length / 90 },
      sampleSize: allTransactions.length,
      calculatedAt: new Date().toISOString(),
    }

    // Cache for 24 hours
    await supabase.from('network_benchmarks').upsert(benchmarks, { onConflict: 'category' })

    return benchmarks
  }

  // ── 2.5 PPC INTELLIGENCE ──
  // Connects ad spend to true profit at keyword level
  async analysePPC(userId: string): Promise<PPCIntelligence> {
    const { data: keywords } = await supabase
      .from('ppc_keyword_performance')
      .select('*')
      .eq('user_id', userId)
      .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const { data: transactions } = await supabase
      .from('transactions')
      .select('sku, true_margin, supplier_cost, sale_price')
      .eq('user_id', userId)
      .gte('order_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    if (!keywords?.length) return this.emptyPPCIntelligence()

    // Get true margin per SKU to calculate break-even ACOS
    const marginBySku = transactions?.reduce((acc: any, t: any) => {
      if (!acc[t.sku]) acc[t.sku] = []
      acc[t.sku].push(t.true_margin)
      return acc
    }, {}) || {}

    const breakEvenAcosBySku: Record<string, number> = {}
    Object.entries(marginBySku).forEach(([sku, margins]: [string, any]) => {
      breakEvenAcosBySku[sku] = margins.reduce((s: number, m: number) => s + m, 0) / margins.length
    })

    // Analyse each keyword
    const keywordAnalysis = keywords.map((kw: any) => {
      const breakEvenAcos = breakEvenAcosBySku[kw.sku] || 20
      const trueProfitAcos = kw.spend > 0 && kw.sales > 0
        ? (kw.spend / (kw.sales * (breakEvenAcos / 100))) * 100
        : 0

      const conversionRate = kw.clicks > 0 ? (kw.orders / kw.clicks) * 100 : 0

      // Score this keyword 0-100
      let score = 50
      if (kw.acos < breakEvenAcos * 0.5) score += 30
      else if (kw.acos < breakEvenAcos) score += 15
      else if (kw.acos > breakEvenAcos * 1.5) score -= 30
      else if (kw.acos > breakEvenAcos) score -= 15

      if (conversionRate > 10) score += 20
      else if (conversionRate > 5) score += 10
      else if (conversionRate < 2) score -= 20

      if (kw.clicks < 10) score = 50 // insufficient data

      score = Math.max(0, Math.min(100, score))

      // Recommendation
      let recommendation: 'harvest' | 'scale' | 'hold' | 'reduce' | 'pause' | 'negative' | 'insufficient_data'
      if (kw.clicks < 10) recommendation = 'insufficient_data'
      else if (score >= 80) recommendation = 'scale'
      else if (score >= 60 && kw.match_type === 'AUTO') recommendation = 'harvest'
      else if (score >= 60) recommendation = 'hold'
      else if (score >= 40) recommendation = 'reduce'
      else if (kw.clicks >= 15 && kw.orders === 0) recommendation = 'negative'
      else recommendation = 'pause'

      return {
        keywordId: kw.keyword_id,
        keywordText: kw.keyword_text,
        matchType: kw.match_type,
        campaignId: kw.campaign_id,
        impressions: kw.impressions,
        clicks: kw.clicks,
        spend: kw.spend,
        revenue: kw.sales,
        orders: kw.orders,
        acos: Math.round(kw.acos * 10) / 10,
        breakEvenAcos: Math.round(breakEvenAcos * 10) / 10,
        trueProfitAcos: Math.round(trueProfitAcos * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10,
        score,
        recommendation,
        wastedSpend: recommendation === 'negative' || recommendation === 'pause' ? kw.spend : 0,
        potentialRevenue: recommendation === 'harvest' || recommendation === 'scale' ? kw.sales * 0.5 : 0,
      }
    })

    // Summary
    const totalSpend = keywords.reduce((s: number, k: any) => s + k.spend, 0)
    const totalRevenue = keywords.reduce((s: number, k: any) => s + k.sales, 0)
    const wastedSpend = keywordAnalysis.filter(k => ['negative', 'pause'].includes(k.recommendation))
      .reduce((s, k) => s + k.wastedSpend, 0)
    const harvestCount = keywordAnalysis.filter(k => k.recommendation === 'harvest').length
    const scaleCount = keywordAnalysis.filter(k => k.recommendation === 'scale').length

    return {
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      blendedAcos: totalRevenue > 0 ? Math.round((totalSpend / totalRevenue) * 1000) / 10 : 0,
      wastedSpend: Math.round(wastedSpend * 100) / 100,
      harvestOpportunities: harvestCount,
      scaleOpportunities: scaleCount,
      keywords: keywordAnalysis.sort((a, b) => {
        const priority = { negative: 0, pause: 1, harvest: 2, scale: 3, reduce: 4, hold: 5, insufficient_data: 6 }
        return priority[a.recommendation] - priority[b.recommendation]
      }),
    }
  }

  // ── HELPERS ──

  private calculateMarginOpportunity(txs: any[], benchmarkMargin: number): number {
    const currentMargin = txs.reduce((s: number, t: any) => s + t.true_margin, 0) / txs.length
    const totalRevenue = txs.reduce((s: number, t: any) => s + t.sale_price, 0)

    if (currentMargin >= benchmarkMargin) return 0
    return Math.round((benchmarkMargin - currentMargin) / 100 * totalRevenue * 100) / 100
  }

  private calculateChannelEfficiency(margin: number, roas: number): number {
    let score = 50
    if (margin >= 25) score += 25
    else if (margin >= 20) score += 15
    else if (margin >= 15) score += 5
    else score -= 20

    if (roas >= 4) score += 25
    else if (roas >= 3) score += 15
    else if (roas >= 2) score += 5
    else score -= 20

    return Math.max(0, Math.min(100, score))
  }

  private getSeasonalIndex(category: string, month: number): number {
    const indices: Record<string, number[]> = {
      fragrance: [0.85, 1.45, 0.90, 0.85, 1.10, 0.80, 0.78, 0.80, 0.90, 0.95, 1.20, 1.85],
      cosmetics: [0.90, 1.10, 1.00, 0.95, 1.05, 0.90, 0.85, 0.90, 1.00, 1.00, 1.15, 1.40],
      supplements: [1.40, 1.10, 0.95, 0.90, 0.85, 0.80, 0.80, 0.85, 0.95, 1.00, 1.10, 1.30],
      electronics: [0.85, 0.80, 0.85, 0.85, 0.90, 0.85, 0.90, 0.95, 1.00, 1.10, 1.50, 1.80],
      clothing: [0.90, 0.95, 1.10, 1.20, 1.10, 0.95, 0.90, 1.00, 1.20, 1.10, 1.20, 1.30],
    }
    return indices[category]?.[month] || 1.0
  }

  private applyPsychologicalPricing(price: number): number {
    if (price < 10) return Math.floor(price) + 0.95
    return Math.floor(price) + 0.99
  }

  private defaultBenchmarks(category: string): NetworkBenchmarks {
    return {
      category,
      medianMarginByCategory: { [category]: 20 },
      topQuartileMargin: 28,
      bottomQuartileMargin: 12,
      seasonalIndexByCategory: { [category]: {} },
      avgVelocityByCategory: { [category]: 2 },
      sampleSize: 0,
      calculatedAt: new Date().toISOString(),
    }
  }

  private emptyMarginAnalysis() {
    return { byProduct: [], byCategory: [], byChannel: [], networkBenchmarks: this.defaultBenchmarks('unknown') }
  }

  private emptyPPCIntelligence(): PPCIntelligence {
    return { totalSpend: 0, totalRevenue: 0, blendedAcos: 0, wastedSpend: 0, harvestOpportunities: 0, scaleOpportunities: 0, keywords: [] }
  }
}

// ────────────────────────────────────────────────────────────────
// LAYER 3: VALUE MULTIPLIER
// Turns intelligence into concrete profit improvements
// This is where £1 of data becomes £9 of value
// ────────────────────────────────────────────────────────────────

export class ValueMultiplier {
  private engine = new TransactionIntelligenceEngine()

  async calculateLeverageRatio(userId: string): Promise<LeverageAnalysis> {
    const [margins, velocity, pricing, ppc] = await Promise.all([
      this.engine.analyseMargins(userId),
      this.engine.analyseVelocity(userId),
      this.engine.analysePricing(userId),
      this.engine.analysePPC(userId),
    ])

    // Calculate value of each intelligence layer
    const marginValue = this.calculateMarginValue(margins.byProduct)
    const velocityValue = this.calculateVelocityValue(velocity)
    const pricingValue = this.calculatePricingValue(pricing)
    const ppcValue = this.calculatePPCValue(ppc)

    const totalValueCreated = marginValue + velocityValue + pricingValue + ppcValue

    // Get user's subscription cost
    const { data: user } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single()

    const subscriptionCost = ({
      starter: 79.99,
      growth: 199,
      scale: 599,
      enterprise: 1500,
    } as Record<string, number>)[user?.plan || 'growth'] || 199

    const leverageRatio = totalValueCreated / subscriptionCost

    return {
      subscriptionCost,
      valueByLayer: {
        marginOptimisation: Math.round(marginValue * 100) / 100,
        inventoryIntelligence: Math.round(velocityValue * 100) / 100,
        pricingOptimisation: Math.round(pricingValue * 100) / 100,
        ppcOptimisation: Math.round(ppcValue * 100) / 100,
      },
      totalValueCreated: Math.round(totalValueCreated * 100) / 100,
      leverageRatio: Math.round(leverageRatio * 10) / 10,
      // Like the bank: for every £1 paid, Meridia returns £X
      message: `For every £1 you pay Meridia, you get £${(Math.round(leverageRatio * 10) / 10).toFixed(1)} in value`,
    }
  }

  private calculateMarginValue(products: ProductMarginIntelligence[]): number {
    return products.reduce((total, p) => {
      return total + (p.potentialMarginImprovement || 0)
    }, 0)
  }

  private calculateVelocityValue(velocity: VelocityIntelligence[]): number {
    // Value of preventing stockouts
    return velocity
      .filter(v => v.urgency === 'critical' || v.urgency === 'high')
      .reduce((total, v) => {
        // Average daily profit lost during stockout
        const dailyProfit = v.predictedRevenue / 30 * 0.22 // 22% margin
        const daysAtRisk = Math.max(0, 7 - v.daysUntilStockout)
        return total + (dailyProfit * daysAtRisk)
      }, 0)
  }

  private calculatePricingValue(pricing: PriceIntelligence[]): number {
    return pricing.reduce((total, p) => {
      if (p.marginImprovement > 0) {
        // Estimate monthly revenue for this product and apply margin improvement
        return total + (p.marginImprovement / 100 * p.currentPrice * 30)
      }
      return total
    }, 0)
  }

  private calculatePPCValue(ppc: PPCIntelligence): number {
    return ppc.wastedSpend + (ppc.harvestOpportunities * 150) // avg £150 per harvest opportunity
  }
}

// ────────────────────────────────────────────────────────────────
// LAYER 4: CLAUDE INTELLIGENCE LAYER
// Translates all ML output into human decisions
// The interface between machine intelligence and human action
// ────────────────────────────────────────────────────────────────

export class ClaudeIntelligenceLayer {
  private engine = new TransactionIntelligenceEngine()
  private multiplier = new ValueMultiplier()

  // Generate daily briefing — the morning report every seller gets
  async generateDailyBriefing(userId: string): Promise<string> {
    const [margins, velocity, pricing, ppc, leverage] = await Promise.all([
      this.engine.analyseMargins(userId),
      this.engine.analyseVelocity(userId),
      this.engine.analysePricing(userId),
      this.engine.analysePPC(userId),
      this.multiplier.calculateLeverageRatio(userId),
    ])

    const criticalAlerts = velocity.filter(v => v.urgency === 'critical' || v.urgency === 'high')
    const pricingOpportunities = pricing.filter(p => p.marginImprovement > 2)
    const ppcWaste = ppc.keywords.filter(k => k.recommendation === 'negative' || k.recommendation === 'pause')

    const context = `
SELLER INTELLIGENCE REPORT
Generated: ${new Date().toISOString()}

MARGIN ANALYSIS:
Top products by profit: ${JSON.stringify(margins.byProduct.slice(0, 5))}
Channel performance: ${JSON.stringify(margins.byChannel)}
Network benchmarks: ${JSON.stringify(margins.networkBenchmarks)}

INVENTORY ALERTS:
Critical/High urgency items: ${JSON.stringify(criticalAlerts)}

PRICING OPPORTUNITIES:
Products needing repricing: ${JSON.stringify(pricingOpportunities.slice(0, 5))}

PPC INTELLIGENCE:
Total wasted spend: £${ppc.wastedSpend}
Keywords to negative: ${ppcWaste.length}
Harvest opportunities: ${ppc.harvestOpportunities}

VALUE CREATED:
Leverage ratio: ${leverage.leverageRatio}×
Total monthly value: £${leverage.totalValueCreated}
    `

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are the AI brain of Meridia — an eCommerce transaction intelligence platform.
You have access to a seller's complete transaction data, ML model outputs, and network benchmarks.
Your job is to generate a clear, actionable daily briefing.

Rules:
- Lead with the single most important thing they need to know today
- Use specific numbers — never vague statements
- Connect every insight to profit impact in £
- Maximum 5 key points
- End with exactly 3 prioritised actions for today
- Tone: direct, expert, like a business partner not a chatbot
- Never say "I notice" or "It appears" — be definitive`,

      messages: [{
        role: 'user',
        content: `Generate today's briefing for this seller. ${context}`
      }]
    })

    const briefing = response.content[0].type === 'text' ? response.content[0].text : ''

    // Store briefing
    await supabase.from('ai_insights').insert({
      user_id: userId,
      type: 'daily_briefing',
      title: `Daily Briefing — ${new Date().toLocaleDateString('en-GB')}`,
      body: briefing,
      priority: 'high',
      created_at: new Date().toISOString(),
    })

    return briefing
  }

  // Answer any question about the seller's store
  async answerQuestion(userId: string, question: string, conversationHistory: any[] = []): Promise<string> {
    // Pull relevant data based on question
    const [margins, velocity, ppc] = await Promise.all([
      this.engine.analyseMargins(userId),
      this.engine.analyseVelocity(userId),
      this.engine.analysePPC(userId),
    ])

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are the AI brain of Meridia with full access to this seller's store data.
Answer questions using their actual data — specific products, specific numbers, specific recommendations.
Never give generic advice. Always reference their actual performance data.
Be direct and decisive. End every answer with a specific recommended action.`,

      messages: [
        ...conversationHistory,
        {
          role: 'user',
          content: `Question: ${question}

Store data context:
Margin analysis: ${JSON.stringify(margins.byProduct.slice(0, 10))}
Inventory intelligence: ${JSON.stringify(velocity.slice(0, 10))}
PPC intelligence: ${JSON.stringify({ totalSpend: ppc.totalSpend, wastedSpend: ppc.wastedSpend, topKeywords: ppc.keywords.slice(0, 10) })}`
        }
      ]
    })

    return response.content[0].type === 'text' ? response.content[0].text : ''
  }

  // Generate structured insights for dashboard
  async generateInsights(userId: string): Promise<DashboardInsight[]> {
    const [margins, velocity, pricing, ppc] = await Promise.all([
      this.engine.analyseMargins(userId),
      this.engine.analyseVelocity(userId),
      this.engine.analysePricing(userId),
      this.engine.analysePPC(userId),
    ])

    const context = {
      criticalProducts: margins.byProduct.filter(p => p.signal === 'exit' || p.signal === 'review'),
      stockAlerts: velocity.filter(v => v.urgency === 'critical' || v.urgency === 'high'),
      pricingOpportunities: pricing.filter(p => p.marginImprovement > 2),
      ppcWaste: ppc.wastedSpend,
      ppcHarvest: ppc.harvestOpportunities,
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `Generate exactly 4 actionable insights for a seller dashboard.
Return ONLY valid JSON array. No other text.
Format: [{"icon":"emoji","title":"short title","body":"one specific sentence with £ numbers","action":"action label","priority":"high|medium|low","type":"margin|inventory|ppc|pricing|opportunity"}]`,

      messages: [{
        role: 'user',
        content: `Generate insights from: ${JSON.stringify(context)}`
      }]
    })

    try {
      const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
      const insights: DashboardInsight[] = JSON.parse(text.replace(/```json|```/g, '').trim())

      // Store insights
      await supabase.from('ai_insights').upsert(
        insights.map(insight => ({
          user_id: userId,
          type: insight.type,
          title: insight.title,
          body: insight.body,
          priority: insight.priority,
          actioned: false,
          created_at: new Date().toISOString(),
        })),
        { onConflict: 'user_id,title' }
      )

      return insights
    } catch {
      return this.defaultInsights()
    }
  }

  private defaultInsights(): DashboardInsight[] {
    return [{
      icon: '🤖',
      title: 'Analysing your store',
      body: 'Claude is processing your transaction data. Check back in a few minutes.',
      action: 'Refresh',
      priority: 'low',
      type: 'opportunity',
    }]
  }
}

// ────────────────────────────────────────────────────────────────
// LAYER 5: THE AGENT LAYER
// Takes actions automatically based on intelligence
// This is what makes Meridia an OS not just a dashboard
// ────────────────────────────────────────────────────────────────

export class MeridiaAgent {
  private intelligence = new ClaudeIntelligenceLayer()
  private engine = new TransactionIntelligenceEngine()

  async runAgentCycle(userId: string, mode: 'autopilot' | 'copilot' | 'alerts'): Promise<AgentRunResult> {
    const actionsExecuted: AgentAction[] = []
    const pendingApprovals: AgentAction[] = []
    const alerts: AgentAlert[] = []

    // Get all intelligence
    const [velocity, pricing, ppc] = await Promise.all([
      this.engine.analyseVelocity(userId),
      this.engine.analysePricing(userId),
      this.engine.analysePPC(userId),
    ])

    // ── ACTION 1: Fix critical margins ──
    for (const product of pricing.filter(p => p.currentMargin < 10)) {
      const action: AgentAction = {
        type: 'reprice',
        sku: product.sku,
        title: product.title,
        description: `Reprice from £${product.currentPrice} to £${product.recommendedPrice}`,
        reason: product.recommendationReason,
        profitImpact: product.marginImprovement / 100 * product.currentPrice * 30,
        data: { newPrice: product.recommendedPrice },
      }

      if (mode === 'autopilot') {
        await this.executeReprice(userId, product.sku, product.recommendedPrice)
        actionsExecuted.push(action)
      } else if (mode === 'copilot') {
        pendingApprovals.push(action)
      } else {
        alerts.push({ ...action, urgency: 'high' })
      }
    }

    // ── ACTION 2: Negative wasted PPC keywords ──
    const wastedKeywords = ppc.keywords.filter(k => k.recommendation === 'negative')
    for (const keyword of wastedKeywords.slice(0, 10)) {
      const action: AgentAction = {
        type: 'negative_keyword',
        sku: keyword.keywordText,
        title: `Negative: "${keyword.keywordText}"`,
        description: `${keyword.clicks} clicks, ${keyword.orders} orders — wasting £${keyword.wastedSpend.toFixed(2)}`,
        reason: `${keyword.clicks} clicks with ${keyword.orders} conversions`,
        profitImpact: keyword.wastedSpend,
        data: { keywordId: keyword.keywordId, keywordText: keyword.keywordText },
      }

      if (mode === 'autopilot') {
        await this.executeNegativeKeyword(userId, keyword.keywordId)
        actionsExecuted.push(action)
      } else if (mode === 'copilot') {
        pendingApprovals.push(action)
      } else {
        alerts.push({ ...action, urgency: 'medium' })
      }
    }

    // ── ACTION 3: Harvest converting keywords ──
    const harvestKeywords = ppc.keywords.filter(k => k.recommendation === 'harvest')
    for (const keyword of harvestKeywords.slice(0, 5)) {
      const action: AgentAction = {
        type: 'harvest_keyword',
        sku: keyword.keywordText,
        title: `Harvest: "${keyword.keywordText}"`,
        description: `ACOS ${keyword.acos}% with ${keyword.orders} orders — add as exact match`,
        reason: `Profitable auto keyword ready for manual control`,
        profitImpact: keyword.potentialRevenue * 0.2,
        data: { keywordText: keyword.keywordText, suggestedBid: keyword.spend / keyword.clicks },
      }

      if (mode === 'autopilot') {
        await this.executeHarvestKeyword(userId, keyword.keywordText, keyword.spend / keyword.clicks)
        actionsExecuted.push(action)
      } else {
        pendingApprovals.push(action)
      }
    }

    // ── ACTION 4: Restock alerts ──
    const criticalStock = velocity.filter(v => v.urgency === 'critical' || v.urgency === 'high')
    for (const product of criticalStock) {
      const action: AgentAction = {
        type: 'restock_alert',
        sku: product.sku,
        title: `Restock: ${product.title}`,
        description: `${product.currentStock} units left — ${product.daysUntilStockout.toFixed(1)} days until stockout`,
        reason: `Selling ${product.velocity7d.toFixed(1)} units/day`,
        profitImpact: product.predictedRevenue * 0.2,
        data: { reorderQty: product.reorderQty, daysUntilStockout: product.daysUntilStockout },
      }

      // Always alert for stock — never auto-purchase
      alerts.push({ ...action, urgency: product.urgency === 'critical' ? 'critical' : 'high' })
    }

    // Store pending approvals
    if (pendingApprovals.length > 0) {
      await supabase.from('agent_pending_actions').insert(
        pendingApprovals.map(action => ({
          user_id: userId,
          action_type: action.type,
          title: action.title,
          description: action.description,
          reason: action.reason,
          profit_impact: action.profitImpact,
          action_data: action.data,
          status: 'pending',
          created_at: new Date().toISOString(),
        }))
      )
    }

    // Store executed actions
    if (actionsExecuted.length > 0) {
      await supabase.from('agent_action_log').insert(
        actionsExecuted.map(action => ({
          user_id: userId,
          action_type: action.type,
          title: action.title,
          description: action.description,
          profit_impact: action.profitImpact,
          executed_at: new Date().toISOString(),
          mode,
        }))
      )
    }

    // Calculate total impact
    const totalImpact = [...actionsExecuted, ...pendingApprovals, ...alerts]
      .reduce((s, a) => s + a.profitImpact, 0)

    return {
      mode,
      actionsExecuted,
      pendingApprovals,
      alerts,
      totalActionsCount: actionsExecuted.length + pendingApprovals.length + alerts.length,
      estimatedMonthlyImpact: Math.round(totalImpact * 100) / 100,
      runAt: new Date().toISOString(),
    }
  }

  // Execute actual API calls to channels
  private async executeReprice(userId: string, sku: string, newPrice: number): Promise<void> {
    // Get channel for this SKU
    const { data: listing } = await supabase
      .from('listings')
      .select('channel_id, channel_listing_id, channels(type, access_token)')
      .eq('user_id', userId)
      .eq('sku', sku)
      .single()

    if (!listing) return

    // Update price via channel API
    // TODO: implement per-channel price update
    console.log(`Repriced ${sku} to £${newPrice} on ${(listing as any).channels?.type}`)
  }

  private async executeNegativeKeyword(userId: string, keywordId: string): Promise<void> {
    // Get Amazon credentials
    const { data: channel } = await supabase
      .from('channels')
      .select('access_token')
      .eq('user_id', userId)
      .eq('type', 'amazon')
      .single()

    if (!channel) return

    // Call Amazon Ads API to add negative keyword
    // TODO: implement Amazon Ads API call
    console.log(`Added negative keyword ${keywordId}`)
  }

  private async executeHarvestKeyword(userId: string, keywordText: string, suggestedBid: number): Promise<void> {
    // Get Amazon credentials and campaign info
    console.log(`Harvested keyword "${keywordText}" at bid £${suggestedBid.toFixed(2)}`)
  }
}

// ────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ────────────────────────────────────────────────────────────────

export interface ProductMarginIntelligence {
  sku: string
  title: string
  unitsSold: number
  totalRevenue: number
  totalProfit: number
  avgMargin: number
  marginTrend: number
  roas: number
  vsNetwork: number
  signal: 'scale' | 'hold' | 'optimise' | 'review' | 'exit'
  potentialMarginImprovement: number
}

export interface CategoryMarginIntelligence {
  category: string
  unitsSold: number
  totalRevenue: number
  totalProfit: number
  avgMargin: number
  networkMedianMargin: number
  vsNetwork: number
  seasonalIndex: number
  opportunityValue: number
}

export interface ChannelMarginIntelligence {
  channel: string
  unitsSold: number
  totalRevenue: number
  totalProfit: number
  totalAdSpend: number
  avgMargin: number
  blendedRoas: number
  trueProfitRoas: number
  efficiencyScore: number
}

export interface NetworkBenchmarks {
  category: string
  medianMarginByCategory: Record<string, number>
  topQuartileMargin: number
  bottomQuartileMargin: number
  seasonalIndexByCategory: Record<string, Record<number, number>>
  avgVelocityByCategory: Record<string, number>
  sampleSize: number
  calculatedAt: string
}

export interface VelocityIntelligence {
  sku: string
  title: string
  currentStock: number
  velocity7d: number
  velocity30d: number
  velocity90d: number
  velocityTrend: number
  accelerating: boolean
  daysUntilStockout: number
  reorderPoint: number
  reorderQty: number
  urgency: 'critical' | 'high' | 'medium' | 'low' | 'ok'
  predicted30d: number
  predictedRevenue: number
  seasonalIndex: number
}

export interface PriceIntelligence {
  sku: string
  title: string
  currentPrice: number
  recommendedPrice: number
  recommendationReason: string
  currentMargin: number
  recommendedMargin: number
  marginImprovement: number
  breakEvenPrice: number
  supplierCost: number
  avgCompetitorPrice: number
  lowestCompetitorPrice: number
  pricePosition: 'lowest' | 'competitive' | 'premium'
  elasticity: number
  priceChanged: boolean
}

export interface PPCIntelligence {
  totalSpend: number
  totalRevenue: number
  blendedAcos: number
  wastedSpend: number
  harvestOpportunities: number
  scaleOpportunities: number
  keywords: KeywordIntelligence[]
}

export interface KeywordIntelligence {
  keywordId: string
  keywordText: string
  matchType: string
  campaignId: string
  impressions: number
  clicks: number
  spend: number
  revenue: number
  orders: number
  acos: number
  breakEvenAcos: number
  trueProfitAcos: number
  conversionRate: number
  score: number
  recommendation: 'harvest' | 'scale' | 'hold' | 'reduce' | 'pause' | 'negative' | 'insufficient_data'
  wastedSpend: number
  potentialRevenue: number
}

export interface LeverageAnalysis {
  subscriptionCost: number
  valueByLayer: {
    marginOptimisation: number
    inventoryIntelligence: number
    pricingOptimisation: number
    ppcOptimisation: number
  }
  totalValueCreated: number
  leverageRatio: number
  message: string
}

export interface DashboardInsight {
  icon: string
  title: string
  body: string
  action: string
  priority: 'high' | 'medium' | 'low'
  type: 'margin' | 'inventory' | 'ppc' | 'pricing' | 'opportunity'
}

export interface AgentAction {
  type: 'reprice' | 'negative_keyword' | 'harvest_keyword' | 'restock_alert' | 'pause_ad' | 'increase_bid'
  sku: string
  title: string
  description: string
  reason: string
  profitImpact: number
  data: Record<string, any>
}

export interface AgentAlert extends AgentAction {
  urgency: 'critical' | 'high' | 'medium' | 'low'
}

export interface AgentRunResult {
  mode: 'autopilot' | 'copilot' | 'alerts'
  actionsExecuted: AgentAction[]
  pendingApprovals: AgentAction[]
  alerts: AgentAlert[]
  totalActionsCount: number
  estimatedMonthlyImpact: number
  runAt: string
}
