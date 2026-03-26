export type OrderInput = {
  sale_price: number
  ebay_fee_pct?: number
  promo_fee_pct?: number
  shipping_cost?: number
  supplier_cost: number
}

export type ProfitResult = {
  ebay_fee: number
  promo_fee: number
  shipping_cost: number
  total_costs: number
  profit: number
  margin_pct: number
  margin_label: 'good' | 'warning' | 'danger'
}

export function calculateProfit(order: OrderInput): ProfitResult {
  const ebay_fee_pct = order.ebay_fee_pct ?? 0.128
  const promo_fee_pct = order.promo_fee_pct ?? 0.10
  const shipping_cost = order.shipping_cost ?? 3.95

  const ebay_fee = order.sale_price * ebay_fee_pct
  const promo_fee = order.sale_price * promo_fee_pct
  const total_costs = ebay_fee + promo_fee + shipping_cost + order.supplier_cost

  const profit = order.sale_price - total_costs
  const margin_pct = Math.round((profit / order.sale_price) * 1000) / 10

  let margin_label: 'good' | 'warning' | 'danger' = 'good'
  if (margin_pct < 10) margin_label = 'danger'
  else if (margin_pct < 20) margin_label = 'warning'

  return {
    ebay_fee: Math.round(ebay_fee * 100) / 100,
    promo_fee: Math.round(promo_fee * 100) / 100,
    shipping_cost: Math.round(shipping_cost * 100) / 100,
    total_costs: Math.round(total_costs * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    margin_pct,
    margin_label,
  }
}

export function calculateProfitBatch(orders: OrderInput[]): ProfitResult[] {
  return orders.map(calculateProfit)
}