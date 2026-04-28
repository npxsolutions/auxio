/**
 * GET /api/channels
 *
 * Returns every channel connection for the active org, plus a catalogue of
 * supported channels even if not yet connected. Used by the publish panel
 * on /listings/[id] so the seller sees all marketplace options (connected
 * + connectable) instead of a hardcoded 4-channel list.
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { requireActiveOrg } from '@/app/lib/org/context'

export const runtime = 'nodejs'

const SUPPORTED_CHANNELS: Array<{
  id: string
  name: string
  icon: string
  colour: string
  /** false until the channel has a real publish pipeline. */
  publish: boolean
  category: 'marketplace' | 'storefront' | 'feed'
}> = [
  { id: 'shopify',     name: 'Shopify',          icon: '🛍️', colour: '#96BF48', publish: true,  category: 'storefront' },
  { id: 'ebay',        name: 'eBay',             icon: '🛒', colour: '#E53238', publish: true,  category: 'marketplace' },
  { id: 'amazon',      name: 'Amazon',           icon: '📦', colour: '#FF9900', publish: false, category: 'marketplace' },
  { id: 'tiktok_shop', name: 'TikTok Shop',      icon: '🎵', colour: '#000000', publish: false, category: 'marketplace' },
  { id: 'etsy',        name: 'Etsy',             icon: '🧶', colour: '#F1641E', publish: false, category: 'marketplace' },
  { id: 'walmart',     name: 'Walmart',          icon: '🏪', colour: '#0071CE', publish: false, category: 'marketplace' },
  { id: 'onbuy',       name: 'OnBuy',            icon: '🛍️', colour: '#FF5C00', publish: false, category: 'marketplace' },
  { id: 'google',      name: 'Google Shopping',  icon: '🔍', colour: '#4285F4', publish: true,  category: 'feed' },
  { id: 'facebook',    name: 'Meta / Facebook',  icon: '📘', colour: '#1877F2', publish: true,  category: 'feed' },
  { id: 'woocommerce', name: 'WooCommerce',      icon: '🟣', colour: '#96588A', publish: true,  category: 'storefront' },
  { id: 'bigcommerce', name: 'BigCommerce',      icon: '🔷', colour: '#34313F', publish: true,  category: 'storefront' },
]

export async function GET() {
  const ctx = await requireActiveOrg().catch(() => null)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )

  const { data: rows, error } = await supabase
    .from('channels')
    .select('type, active, shop_domain, last_synced_at, metadata')
    .eq('organization_id', ctx.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const connected = new Map<string, { active: boolean; shop_domain: string | null; last_synced_at: string | null }>()
  for (const r of rows ?? []) {
    connected.set(r.type as string, {
      active: !!r.active,
      shop_domain: (r.shop_domain as string | null) ?? null,
      last_synced_at: (r.last_synced_at as string | null) ?? null,
    })
  }

  const channels = SUPPORTED_CHANNELS.map((c) => {
    const conn = connected.get(c.id)
    return {
      ...c,
      connected:    !!conn?.active,
      shop_domain:  conn?.shop_domain ?? null,
      last_synced_at: conn?.last_synced_at ?? null,
    }
  })

  return NextResponse.json({ channels })
}
