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
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("order_date", { ascending: false })
  if (error) { console.error(error.message); return [] }
  return data as Order[]
}
