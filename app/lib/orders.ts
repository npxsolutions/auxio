import { supabase } from './supabase'

export type Order = {
  id: string
  user_id: string
  sku: string
  title: string
  sale_price: number
  channel_fee: number
  promo_fee: number
  shipping_cost: number
  supplier_cost: number
  profit: number
  margin_pct: number
  order_date: string
}

export async function getOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('order_date', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error.message)
    return []
  }

  return data as Order[]
}

export async function getOrderStats(userId: string) {
  const orders = await getOrders(userId)

  if (orders.length === 0) {
    return {
      totalSales: 0,
      totalProfit: 0,
      totalOrders: 0,
      avgMargin: 0,
    }
  }

  const totalSales = orders.reduce((sum, o) => sum + o.sale_price, 0)
  const totalProfit = orders.reduce((sum, o) => sum + o.profit, 0)
  const avgMargin = orders.reduce((sum, o) => sum + o.margin_pct, 0) / orders.length

  return {
    totalSales: Math.round(totalSales * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalOrders: orders.length,
    avgMargin: Math.round(avgMargin * 10) / 10,
  }
}