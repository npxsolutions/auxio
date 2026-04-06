import { createClient } from '@supabase/supabase-js'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export interface ProfitSettings {
  default_cogs_pct:      number
  ebay_fee_pct:          number
  shopify_fee_pct:       number
  default_shipping_cost: number
}

const DEFAULTS: ProfitSettings = {
  default_cogs_pct:      50,
  ebay_fee_pct:          10.75,
  shopify_fee_pct:       3,
  default_shipping_cost: 3.95,
}

export async function getProfitSettings(userId: string): Promise<ProfitSettings> {
  const { data } = await getAdmin()
    .from('users')
    .select('default_cogs_pct, ebay_fee_pct, shopify_fee_pct, default_shipping_cost')
    .eq('id', userId)
    .single()

  if (!data) return DEFAULTS
  return {
    default_cogs_pct:      data.default_cogs_pct      ?? DEFAULTS.default_cogs_pct,
    ebay_fee_pct:          data.ebay_fee_pct          ?? DEFAULTS.ebay_fee_pct,
    shopify_fee_pct:       data.shopify_fee_pct       ?? DEFAULTS.shopify_fee_pct,
    default_shipping_cost: data.default_shipping_cost ?? DEFAULTS.default_shipping_cost,
  }
}
