'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase-client'
import AppSidebar from '../components/AppSidebar'

interface Channel {
  id: string
  type: string
  shop_name: string
  active: boolean
  connected_at: string
  last_synced_at?: string
}

interface HealthIssue { type: string; issue: string; message: string }

type ChannelStatus = 'live' | 'beta' | 'soon'

interface ChannelDef {
  id: string
  name: string
  description: string
  color: string        // brand bg
  accent: string       // brand button color
  textColor: string    // text on accent
  status: ChannelStatus
  category: string
  logo: string         // SVG path string or emoji fallback
}

// ── Channel catalog ──────────────────────────────────────────────────────────
const CHANNELS: ChannelDef[] = [
  // ── Marketplaces ────────────────────────────────────────────────────────────
  {
    id: 'ebay', name: 'eBay', category: 'Marketplaces',
    description: 'List, sync, and manage orders across eBay UK, US, and global sites.',
    color: '#fff5f0', accent: '#E53238', textColor: '#fff', status: 'live',
    logo: 'ebay',
  },
  {
    id: 'amazon', name: 'Amazon', category: 'Marketplaces',
    description: 'Connect your Seller Central account to sync inventory and orders.',
    color: '#fff8ed', accent: '#FF9900', textColor: '#fff', status: 'live',
    logo: 'amazon',
  },
  {
    id: 'etsy', name: 'Etsy', category: 'Marketplaces',
    description: 'Sync your Etsy shop listings, orders, and inventory in real time.',
    color: '#fdf6ee', accent: '#F56400', textColor: '#fff', status: 'beta',
    logo: 'etsy',
  },
  {
    id: 'walmart', name: 'Walmart Marketplace', category: 'Marketplaces',
    description: 'Reach millions of Walmart.com shoppers with automated listing and order management.',
    color: '#eff6ff', accent: '#0071CE', textColor: '#fff', status: 'beta',
    logo: 'walmart',
  },
  {
    id: 'onbuy', name: 'OnBuy', category: 'Marketplaces',
    description: 'UK\'s fastest-growing marketplace — list products and sync orders automatically.',
    color: '#fdf4ff', accent: '#6E2EB8', textColor: '#fff', status: 'beta',
    logo: 'onbuy',
  },
  {
    id: 'target_plus', name: 'Target+', category: 'Marketplaces',
    description: 'Sell on Target\'s invite-only marketplace with automated product and order sync.',
    color: '#fff5f5', accent: '#CC0000', textColor: '#fff', status: 'soon',
    logo: 'target',
  },
  {
    id: 'bestbuy', name: 'Best Buy Marketplace', category: 'Marketplaces',
    description: 'Connect to Best Buy\'s third-party marketplace for electronics and tech.',
    color: '#eff6ff', accent: '#003087', textColor: '#fff', status: 'soon',
    logo: 'bestbuy',
  },
  {
    id: 'fruugo', name: 'Fruugo', category: 'Marketplaces',
    description: 'Sell globally across 42+ countries with a single product feed.',
    color: '#f0fdf4', accent: '#16a34a', textColor: '#fff', status: 'soon',
    logo: 'fruugo',
  },
  {
    id: 'bonanza', name: 'Bonanza', category: 'Marketplaces',
    description: 'The fast-growing alternative marketplace for unique and everyday items.',
    color: '#fffbeb', accent: '#d97706', textColor: '#fff', status: 'soon',
    logo: 'bonanza',
  },
  {
    id: 'reverb', name: 'Reverb', category: 'Marketplaces',
    description: 'The leading marketplace for new, used, and vintage musical instruments.',
    color: '#fdf4ff', accent: '#7c3aed', textColor: '#fff', status: 'soon',
    logo: 'reverb',
  },
  {
    id: 'wish', name: 'Wish', category: 'Marketplaces',
    description: 'Reach budget-conscious shoppers across 60+ countries.',
    color: '#fdf4ff', accent: '#2FB7EC', textColor: '#fff', status: 'soon',
    logo: 'wish',
  },
  {
    id: 'asos', name: 'ASOS Marketplace', category: 'Marketplaces',
    description: 'Sell vintage and independent fashion to ASOS\'s global audience.',
    color: '#f8f8f8', accent: '#000000', textColor: '#fff', status: 'soon',
    logo: 'asos',
  },

  // ── Global / Regional ────────────────────────────────────────────────────────
  {
    id: 'zalando', name: 'Zalando', category: 'Global & Regional',
    description: 'Europe\'s leading fashion and lifestyle marketplace — 17 countries.',
    color: '#fff5f0', accent: '#FF6900', textColor: '#fff', status: 'beta',
    logo: 'zalando',
  },
  {
    id: 'allegro', name: 'Allegro', category: 'Global & Regional',
    description: 'Poland\'s dominant marketplace with 20M+ active buyers.',
    color: '#fff5f0', accent: '#FF5A00', textColor: '#fff', status: 'soon',
    logo: 'allegro',
  },
  {
    id: 'mercado_libre', name: 'Mercado Libre', category: 'Global & Regional',
    description: 'Latin America\'s largest marketplace — 18 countries, 148M+ users.',
    color: '#fffbeb', accent: '#FFE600', textColor: '#333', status: 'soon',
    logo: 'mercadolibre',
  },
  {
    id: 'trendyol', name: 'Trendyol', category: 'Global & Regional',
    description: 'Turkey and MENA\'s leading eCommerce platform with 30M+ customers.',
    color: '#fff5f0', accent: '#F27A1A', textColor: '#fff', status: 'soon',
    logo: 'trendyol',
  },
  {
    id: 'shopee', name: 'Shopee', category: 'Global & Regional',
    description: 'Southeast Asia and Taiwan\'s leading marketplace platform.',
    color: '#fff5f0', accent: '#EE4D2D', textColor: '#fff', status: 'soon',
    logo: 'shopee',
  },
  {
    id: 'lazada', name: 'Lazada', category: 'Global & Regional',
    description: 'One of Southeast Asia\'s largest eCommerce platforms.',
    color: '#fff5f5', accent: '#0F146D', textColor: '#fff', status: 'soon',
    logo: 'lazada',
  },
  {
    id: 'aliexpress', name: 'AliExpress', category: 'Global & Regional',
    description: 'Reach global buyers through Alibaba\'s international marketplace.',
    color: '#fff5f0', accent: '#FF4747', textColor: '#fff', status: 'soon',
    logo: 'aliexpress',
  },
  {
    id: 'cdiscount', name: 'Cdiscount', category: 'Global & Regional',
    description: 'France\'s second-largest marketplace with 8M+ active buyers.',
    color: '#eff6ff', accent: '#2563eb', textColor: '#fff', status: 'soon',
    logo: 'cdiscount',
  },
  {
    id: 'bol', name: 'Bol.com', category: 'Global & Regional',
    description: 'Netherlands and Belgium\'s leading online retailer.',
    color: '#eff6ff', accent: '#0057D8', textColor: '#fff', status: 'soon',
    logo: 'bol',
  },

  // ── Social Commerce ──────────────────────────────────────────────────────────
  {
    id: 'tiktok_shop', name: 'TikTok Shop', category: 'Social Commerce',
    description: 'Sell directly within TikTok — sync your product catalog and manage orders.',
    color: '#f0f9f7', accent: '#010101', textColor: '#fff', status: 'beta',
    logo: 'tiktok',
  },
  {
    id: 'facebook_shop', name: 'Facebook & Instagram', category: 'Social Commerce',
    description: 'Sync your catalog to Facebook Shop and Instagram Shopping automatically.',
    color: '#eff6ff', accent: '#1877F2', textColor: '#fff', status: 'beta',
    logo: 'meta',
  },
  {
    id: 'pinterest', name: 'Pinterest Shopping', category: 'Social Commerce',
    description: 'Turn your product catalog into shoppable Pins and reach intent-driven buyers.',
    color: '#fff5f5', accent: '#E60023', textColor: '#fff', status: 'soon',
    logo: 'pinterest',
  },
  {
    id: 'snapchat', name: 'Snapchat', category: 'Social Commerce',
    description: 'Reach Gen Z shoppers through Snapchat\'s dynamic ads and shopping.',
    color: '#fffbeb', accent: '#FFFC00', textColor: '#333', status: 'soon',
    logo: 'snapchat',
  },

  // ── Shopping Feeds & CSE ────────────────────────────────────────────────────
  {
    id: 'google_shopping', name: 'Google Shopping', category: 'Shopping Feeds',
    description: 'Sync your product feed to Google Merchant Center for Shopping and Performance Max ads.',
    color: '#eff6ff', accent: '#4285F4', textColor: '#fff', status: 'beta',
    logo: 'google',
  },
  {
    id: 'bing_shopping', name: 'Microsoft / Bing Shopping', category: 'Shopping Feeds',
    description: 'Reach shoppers on Bing, Yahoo, and MSN through Microsoft Merchant Center.',
    color: '#eff6ff', accent: '#00A4EF', textColor: '#fff', status: 'soon',
    logo: 'microsoft',
  },
  {
    id: 'idealo', name: 'Idealo', category: 'Shopping Feeds',
    description: 'Europe\'s leading price comparison engine — Germany, UK, France, and more.',
    color: '#eff6ff', accent: '#003CFF', textColor: '#fff', status: 'soon',
    logo: 'idealo',
  },
  {
    id: 'kelkoo', name: 'Kelkoo', category: 'Shopping Feeds',
    description: 'Pan-European price comparison and shopping feed network.',
    color: '#fff5f0', accent: '#FF6600', textColor: '#fff', status: 'soon',
    logo: 'kelkoo',
  },
  {
    id: 'pricerunner', name: 'PriceRunner', category: 'Shopping Feeds',
    description: 'Nordic price comparison with 2M+ monthly users in UK, SE, and DK.',
    color: '#fff0f5', accent: '#E40074', textColor: '#fff', status: 'soon',
    logo: 'pricerunner',
  },
  {
    id: 'pricespy', name: 'PriceSpy', category: 'Shopping Feeds',
    description: 'Price comparison and product review platform across 17 countries.',
    color: '#f0fdf4', accent: '#059669', textColor: '#fff', status: 'soon',
    logo: 'pricespy',
  },

  // ── Store Platforms ──────────────────────────────────────────────────────────
  {
    id: 'shopify', name: 'Shopify', category: 'Store Platforms',
    description: 'Connect your Shopify store to sync products, inventory, and orders.',
    color: '#f0f7ee', accent: '#96BF48', textColor: '#fff', status: 'live',
    logo: 'shopify',
  },
  {
    id: 'woocommerce', name: 'WooCommerce', category: 'Store Platforms',
    description: 'Connect your WooCommerce store for bidirectional product and order sync.',
    color: '#fdf4ff', accent: '#7F54B3', textColor: '#fff', status: 'beta',
    logo: 'woocommerce',
  },
  {
    id: 'bigcommerce', name: 'BigCommerce', category: 'Store Platforms',
    description: 'Sync your BigCommerce catalog and orders across all your channels.',
    color: '#eff6ff', accent: '#34313F', textColor: '#fff', status: 'beta',
    logo: 'bigcommerce',
  },
  {
    id: 'magento', name: 'Adobe Commerce / Magento', category: 'Store Platforms',
    description: 'Enterprise-grade integration for Magento 2 and Adobe Commerce stores.',
    color: '#fff5f0', accent: '#EE672D', textColor: '#fff', status: 'soon',
    logo: 'magento',
  },
  {
    id: 'prestashop', name: 'PrestaShop', category: 'Store Platforms',
    description: 'Connect your PrestaShop store for full catalog and order management.',
    color: '#fff5f0', accent: '#DF0067', textColor: '#fff', status: 'soon',
    logo: 'prestashop',
  },
  {
    id: 'wix', name: 'Wix eCommerce', category: 'Store Platforms',
    description: 'Sync your Wix store products and orders across all connected channels.',
    color: '#f0fdf4', accent: '#0C6EFC', textColor: '#fff', status: 'soon',
    logo: 'wix',
  },
  {
    id: 'squarespace', name: 'Squarespace', category: 'Store Platforms',
    description: 'Bridge your Squarespace Commerce store with all your sales channels.',
    color: '#f5f3ef', accent: '#1a1b22', textColor: '#fff', status: 'soon',
    logo: 'squarespace',
  },
]

const CATEGORIES = ['Marketplaces', 'Global & Regional', 'Social Commerce', 'Shopping Feeds', 'Store Platforms']

// Brand SVG logos (simplified mark versions)
function ChannelLogo({ id, size = 24 }: { id: string; size?: number }) {
  const s = size
  const logos: Record<string, React.ReactElement> = {
    ebay: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <text x="0" y="18" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="11" fill="#E53238">e</text>
        <text x="6" y="18" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="11" fill="#0064D2">b</text>
        <text x="11.5" y="18" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="11" fill="#F5AF02">a</text>
        <text x="17" y="18" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="11" fill="#86B817">y</text>
      </svg>
    ),
    amazon: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M14.5 12.5c-1.5 1-4 1.5-6 .5" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M13 14c1 .5 3 .5 4.5-.5" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round"/>
        <text x="2" y="13" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8" fill="#232F3E">amazon</text>
      </svg>
    ),
    shopify: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M15.5 4.5C15.2 4.2 14.7 4 14.2 4c-.1 0-.7.1-.7.1-.1-.3-.3-.6-.5-.9C12.6 2.5 12 2 11.3 2c-.1 0-.1 0-.2.1-.2-.3-.5-.4-.9-.4-2.2 0-3.3 2.8-3.6 4.2-.9.3-1.5.5-1.6.5-.5.1-.5.1-.5.6L4 19l11.5 2L20 20l-4.5-15.5zm-2.5-.5c.5 0 .9.3 1.1.7 0 0-.5.2-1.1.3l-.2-1h.2zM11.3 3c.3 0 .5.2.7.4l-1.8.5C10.5 3.4 10.9 3 11.3 3z" fill="#96BF48"/>
        <path d="M15.5 4.5l-.4-.1-.8 2.5" stroke="#5E8E3E" strokeWidth=".5"/>
      </svg>
    ),
    etsy: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <text x="2" y="18" fontFamily="Georgia, serif" fontWeight="700" fontSize="18" fill="#F56400">E</text>
      </svg>
    ),
    walmart: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="2" fill="#FFC220"/>
        <line x1="12" y1="4" x2="12" y2="8" stroke="#FFC220" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="16" x2="12" y2="20" stroke="#FFC220" strokeWidth="2" strokeLinecap="round"/>
        <line x1="4" y1="12" x2="8" y2="12" stroke="#FFC220" strokeWidth="2" strokeLinecap="round"/>
        <line x1="16" y1="12" x2="20" y2="12" stroke="#FFC220" strokeWidth="2" strokeLinecap="round"/>
        <line x1="6.3" y1="6.3" x2="9.2" y2="9.2" stroke="#FFC220" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14.8" y1="14.8" x2="17.7" y2="17.7" stroke="#FFC220" strokeWidth="2" strokeLinecap="round"/>
        <line x1="17.7" y1="6.3" x2="14.8" y2="9.2" stroke="#FFC220" strokeWidth="2" strokeLinecap="round"/>
        <line x1="9.2" y1="14.8" x2="6.3" y2="17.7" stroke="#FFC220" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    onbuy: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#6E2EB8" strokeWidth="2"/>
        <text x="6.5" y="15.5" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="7" fill="#6E2EB8">ON</text>
      </svg>
    ),
    tiktok: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M19 3h-4v12.5a3.5 3.5 0 11-3.5-3.5c.4 0 .7 0 1 .1V8c-.3 0-.7-.1-1-.1A7.5 7.5 0 1019 15.5V8.5A9.9 9.9 0 0024 10V6a6 6 0 01-5-3z" fill="#010101"/>
        <path d="M18 2h-3v12.5a3.5 3.5 0 11-3.5-3.5c.4 0 .7 0 1 .1V7c-.3 0-.7-.1-1-.1A7.5 7.5 0 1018 14.5V7.5A9.9 9.9 0 0023 9V5a6 6 0 01-5-3z" fill="#FE2C55" opacity="0.8"/>
        <path d="M20 3h-4v12.5a3.5 3.5 0 11-3.5-3.5c.4 0 .7 0 1 .1V8c-.3 0-.7-.1-1-.1A7.5 7.5 0 1020 15.5V8.5A9.9 9.9 0 0025 10V6a6 6 0 01-5-3z" fill="#25F4EE" opacity="0.6"/>
      </svg>
    ),
    meta: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="#1877F2"/>
        <path d="M13 12.5h2l.5-2.5H13V8.5c0-.7.3-1 1-1h1.5V5H14c-2.2 0-3 1-3 3v1.5h-2V12h2V20h2v-7.5z" fill="#1877F2"/>
      </svg>
    ),
    google: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.6c-.2 1.3-1 2.4-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5z" fill="#4285F4"/>
        <path d="M12 22c2.8 0 5.2-.9 7-2.5l-3.3-2.6c-.9.6-2.1 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.4v2.7C4.2 19.8 7.9 22 12 22z" fill="#34A853"/>
        <path d="M5.8 13.4c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2V6.7H2.4A9.9 9.9 0 002 12c0 1.6.4 3.1.4 3.1l3.4-1.7z" fill="#FBBC05"/>
        <path d="M12 5.5c1.6 0 3 .6 4.1 1.5l3.1-3.1C17.2 2.2 14.8 1 12 1 7.9 1 4.2 3.2 2.4 6.7l3.4 2.7C6.7 7.4 9.1 5.5 12 5.5z" fill="#EA4335"/>
      </svg>
    ),
    woocommerce: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="3" fill="#7F54B3"/>
        <path d="M5 10l2 5 2-3.5 2 3.5 2-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="17" cy="12" r="1.5" stroke="white" strokeWidth="1.5"/>
      </svg>
    ),
    bigcommerce: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#34313F"/>
        <text x="5" y="15" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="10" fill="white">BC</text>
      </svg>
    ),
    zalando: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#FF6900"/>
        <text x="6" y="16" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="10" fill="white">Z</text>
      </svg>
    ),
    // Generic fallback for all others — just a coloured initial
  }
  return logos[id] || null
}

function ChannelInitial({ name, accent }: { name: string; accent: string }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 800, color: accent,
      letterSpacing: '-0.03em',
    }}>
      {name.charAt(0)}
    </div>
  )
}

const STATUS_META = {
  live:  { label: 'Live',         bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  beta:  { label: 'Beta',         bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  soon:  { label: 'Coming soon',  bg: '#f5f3ef', color: '#9496b0', border: '#e8e5df' },
}

export default function ChannelsPage() {
  const router = useRouter()
  const [channels, setChannels]         = useState<Channel[]>([])
  const [loading, setLoading]           = useState(true)
  const [syncing, setSyncing]           = useState<string | null>(null)
  const [adding, setAdding]             = useState<string | null>(null)
  const [shopDomain, setShopDomain]     = useState('')
  const [toast, setToast]               = useState('')
  const [toastType, setToastType]       = useState<'success' | 'error'>('success')
  const [healthIssues, setHealthIssues] = useState<HealthIssue[]>([])
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const [search, setSearch]             = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const supabase = createClient()

  useEffect(() => { load() }, [])
  useEffect(() => {
    fetch('/api/channels/health')
      .then(r => r.json())
      .then(d => setHealthIssues(d.issues || []))
      .catch(() => {})
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('connected_at', { ascending: false })
    setChannels(data || [])
    setLoading(false)
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(''), 3500)
  }

  async function syncChannel(channelId: string, channelType: string) {
    setSyncing(channelId)
    try {
      if (channelType === 'shopify') {
        const [ordersRes, productsRes] = await Promise.all([
          fetch('/api/shopify/sync',          { method: 'POST' }).then(r => r.json()),
          fetch('/api/shopify/products/sync', { method: 'POST' }).then(r => r.json()),
        ])
        showToast([ordersRes.message, productsRes.message].filter(Boolean).join(' · ') || 'Shopify sync complete')
      } else if (channelType === 'ebay') {
        const [listingsRes, ordersRes] = await Promise.all([
          fetch('/api/ebay/sync',        { method: 'POST' }).then(r => r.json()),
          fetch('/api/ebay/orders/sync', { method: 'POST' }).then(r => r.json()),
        ])
        showToast([listingsRes.message, ordersRes.message].filter(Boolean).join(' · ') || 'eBay sync complete')
      } else {
        showToast('Sync not yet supported for this channel', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Sync failed', 'error')
    } finally { setSyncing(null) }
  }

  async function disconnectChannel(channelId: string) {
    if (!confirm('Disconnect this channel? Historical data is kept.')) return
    await supabase.from('channels').update({ active: false }).eq('id', channelId)
    setChannels(prev => prev.filter(c => c.id !== channelId))
    showToast('Channel disconnected')
  }

  function handleConnect(ch: ChannelDef) {
    if (ch.status === 'soon') return
    setAdding(adding === ch.id ? null : ch.id)
  }

  async function requestBeta(chId: string, chName: string) {
    showToast(`Beta access requested for ${chName} — we'll be in touch!`, 'success')
    setAdding(null)
  }

  const connectedTypes = new Set(channels.map(c => c.type))

  // Filter
  const filtered = CHANNELS.filter(ch => {
    const matchSearch = ch.name.toLowerCase().includes(search.toLowerCase()) ||
                        ch.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || ch.category === activeCategory
    return matchSearch && matchCat
  })

  const grouped = CATEGORIES
    .map(cat => ({ cat, items: filtered.filter(ch => ch.category === cat) }))
    .filter(g => g.items.length > 0)

  const connectedChannelDefs = CHANNELS.filter(ch => connectedTypes.has(ch.id))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f3ef', fontFamily: 'inherit' }}>
      <div style={{ fontSize: 14, color: '#6b6e87' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', minHeight: '100vh', background: '#f5f3ef', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: 'white', color: '#1a1b22',
          border: '1px solid #e8e5df',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          borderRadius: 10, padding: '14px 18px',
          fontSize: 13, fontWeight: 500, zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 10,
          borderLeft: `3px solid ${toastType === 'success' ? '#059669' : '#dc2626'}`,
        }}>
          <span style={{ color: toastType === 'success' ? '#059669' : '#dc2626' }}>
            {toastType === 'success' ? '✓' : '✕'}
          </span>
          {toast}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px', maxWidth: '1100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1b22', letterSpacing: '-0.03em', margin: 0 }}>Channels</h1>
            <p style={{ fontSize: 14, color: '#6b6e87', margin: '4px 0 0' }}>
              Connect your selling channels — {CHANNELS.filter(c => c.status === 'live').length} live,{' '}
              {CHANNELS.filter(c => c.status === 'beta').length} in beta,{' '}
              {CHANNELS.filter(c => c.status === 'soon').length} coming soon.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              background: '#ecfdf5', color: '#059669',
              border: '1px solid #a7f3d0',
              borderRadius: 8, padding: '6px 12px',
              fontSize: 12, fontWeight: 600,
            }}>
              {channels.length} connected
            </div>
          </div>
        </div>

        {/* Health banners */}
        {healthIssues.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {healthIssues.map(issue => {
              const isError = issue.issue === 'token_expired'
              return (
                <div key={issue.type} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: isError ? '#fef2f2' : '#fffbeb',
                  border: `1px solid ${isError ? '#fecaca' : '#fde68a'}`,
                  borderLeft: `3px solid ${isError ? '#dc2626' : '#d97706'}`,
                  borderRadius: 10, padding: '12px 16px',
                }}>
                  <span style={{ fontSize: 16 }}>{isError ? '🔒' : '⚠️'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isError ? '#dc2626' : '#d97706' }}>{issue.message}</div>
                    {isError && <div style={{ fontSize: 12, color: '#6b6e87', marginTop: 2 }}>Disconnect and reconnect to restore access.</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Connected channels strip */}
        {channels.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Connected ({channels.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {channels.map(ch => {
                const def = CHANNELS.find(c => c.id === ch.type) || {
                  name: ch.type, color: '#f5f3ef', accent: '#5b52f5', textColor: '#fff', logo: ch.type
                } as any
                const logo = <ChannelLogo id={def.logo || ch.type} size={22} />
                return (
                  <div key={ch.id} style={{
                    background: 'white', border: '1px solid #e8e5df', borderLeft: '3px solid #059669',
                    borderRadius: 12, padding: '14px 20px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{
                      width: 38, height: 38, background: def.color || '#f5f3ef',
                      border: '1px solid #e8e5df', borderRadius: 9,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {logo || <ChannelInitial name={def.name} accent={def.accent} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1b22' }}>{ch.shop_name || def.name}</div>
                      <div style={{ fontSize: 12, color: '#9496b0', marginTop: 1 }}>
                        Connected {new Date(ch.connected_at).toLocaleDateString('en-GB')}
                        {ch.last_synced_at && ` · Synced ${new Date(ch.last_synced_at).toLocaleDateString('en-GB')}`}
                      </div>
                    </div>
                    <span style={{
                      background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100,
                    }}>● Active</span>
                    <button
                      onClick={() => syncChannel(ch.id, ch.type)}
                      disabled={syncing === ch.id}
                      style={{
                        background: 'white', color: '#1a1b22', border: '1px solid #e8e5df',
                        borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500,
                        cursor: syncing === ch.id ? 'wait' : 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {syncing === ch.id ? 'Syncing…' : '↻ Sync'}
                    </button>
                    <button
                      onClick={() => disconnectChannel(ch.id)}
                      style={{
                        background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                        borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Search + filter bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9496b0' }}>
              <path d="M10 6.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0zm-.8 3.3l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search channels…"
              onFocus={() => setFocusedInput('search')}
              onBlur={() => setFocusedInput(null)}
              style={{
                width: '100%', padding: '9px 12px 9px 32px',
                border: `1px solid ${focusedInput === 'search' ? '#5b52f5' : '#e8e5df'}`,
                borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
                color: '#1a1b22', outline: 'none', boxSizing: 'border-box',
                boxShadow: focusedInput === 'search' ? '0 0 0 3px rgba(91,82,245,0.1)' : 'none',
                background: 'white',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['All', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '7px 13px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  background: activeCategory === cat ? '#5b52f5' : 'white',
                  color: activeCategory === cat ? 'white' : '#6b6e87',
                  border: activeCategory === cat ? '1px solid #5b52f5' : '1px solid #e8e5df',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Channel groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {grouped.map(({ cat, items }) => (
            <div key={cat}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                {cat}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 10 }}>
                {items.map(ch => {
                  const isConnected = connectedTypes.has(ch.id)
                  const isOpen = adding === ch.id
                  const statusMeta = STATUS_META[ch.status]
                  const logo = <ChannelLogo id={ch.logo} size={22} />

                  return (
                    <div key={ch.id} style={{
                      background: 'white',
                      border: '1px solid #e8e5df',
                      borderRadius: 12,
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      opacity: isConnected ? 0.7 : 1,
                      transition: 'box-shadow 0.15s',
                    }}>
                      {/* Card header */}
                      <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{
                            width: 40, height: 40, background: ch.color,
                            border: '1px solid #e8e5df', borderRadius: 10, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {logo || <ChannelInitial name={ch.name} accent={ch.accent} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1b22' }}>{ch.name}</div>
                              {isConnected ? (
                                <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Connected</span>
                              ) : (
                                <span style={{ background: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.border}`, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{statusMeta.label}</span>
                              )}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#6b6e87', marginTop: 3, lineHeight: 1.45 }}>{ch.description}</div>
                          </div>
                        </div>

                        {/* Action button */}
                        {!isConnected && (
                          <div style={{ marginTop: 12 }}>
                            {ch.status === 'live' && (
                              <button
                                onClick={() => handleConnect(ch)}
                                style={{
                                  background: ch.accent, color: ch.textColor,
                                  border: 'none', borderRadius: 7,
                                  padding: '8px 14px', fontSize: 12, fontWeight: 600,
                                  cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                                }}
                              >
                                {isOpen ? 'Cancel' : `Connect ${ch.name} →`}
                              </button>
                            )}
                            {ch.status === 'beta' && (
                              <button
                                onClick={() => handleConnect(ch)}
                                style={{
                                  background: 'white', color: '#5b52f5',
                                  border: '1px solid #c7c3fb', borderRadius: 7,
                                  padding: '8px 14px', fontSize: 12, fontWeight: 600,
                                  cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                                }}
                              >
                                {isOpen ? 'Cancel' : 'Request beta access'}
                              </button>
                            )}
                            {ch.status === 'soon' && (
                              <button
                                disabled
                                style={{
                                  background: '#f5f3ef', color: '#9496b0',
                                  border: '1px solid #e8e5df', borderRadius: 7,
                                  padding: '8px 14px', fontSize: 12, fontWeight: 500,
                                  cursor: 'not-allowed', fontFamily: 'inherit', width: '100%',
                                }}
                              >
                                Notify me when available
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expanded panel */}
                      {isOpen && (
                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f0ede8' }}>

                          {/* LIVE — Shopify */}
                          {ch.id === 'shopify' && (
                            <div style={{ paddingTop: 14 }}>
                              <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1b22', display: 'block', marginBottom: 6 }}>Store domain</label>
                              <input
                                value={shopDomain}
                                onChange={e => setShopDomain(e.target.value)}
                                placeholder="mystore.myshopify.com"
                                onFocus={() => setFocusedInput('shopify')}
                                onBlur={() => setFocusedInput(null)}
                                style={{
                                  width: '100%', padding: '9px 12px',
                                  border: `1px solid ${focusedInput === 'shopify' ? '#5b52f5' : '#e8e5df'}`,
                                  borderRadius: 7, fontSize: 13, fontFamily: 'inherit',
                                  color: '#1a1b22', outline: 'none', boxSizing: 'border-box', marginBottom: 10,
                                  boxShadow: focusedInput === 'shopify' ? '0 0 0 3px rgba(91,82,245,0.1)' : 'none',
                                }}
                              />
                              <button
                                onClick={() => {
                                  const d = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
                                  router.push(`/api/shopify/connect?shop=${d}`)
                                }}
                                style={{
                                  background: '#96BF48', color: 'white', border: 'none', borderRadius: 7,
                                  padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                                }}
                              >
                                Connect with Shopify →
                              </button>
                            </div>
                          )}

                          {/* LIVE — Amazon */}
                          {ch.id === 'amazon' && (
                            <div style={{ paddingTop: 14 }}>
                              <p style={{ fontSize: 12, color: '#6b6e87', margin: '0 0 12px', lineHeight: 1.6 }}>
                                Connect via Amazon Login with Amazon (LWA) OAuth. You'll be redirected to Amazon to authorise Auxio.
                              </p>
                              <button
                                onClick={() => router.push('/api/amazon/connect')}
                                style={{
                                  background: '#FF9900', color: 'white', border: 'none', borderRadius: 7,
                                  padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                                }}
                              >
                                Connect with Amazon →
                              </button>
                            </div>
                          )}

                          {/* LIVE — eBay */}
                          {ch.id === 'ebay' && (
                            <div style={{ paddingTop: 14 }}>
                              <p style={{ fontSize: 12, color: '#6b6e87', margin: '0 0 12px', lineHeight: 1.6 }}>
                                Connect via eBay OAuth. You'll be redirected to eBay to authorise Auxio to access your seller account.
                              </p>
                              <button
                                onClick={() => router.push('/api/ebay/connect')}
                                style={{
                                  background: '#E53238', color: 'white', border: 'none', borderRadius: 7,
                                  padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                                }}
                              >
                                Connect with eBay →
                              </button>
                            </div>
                          )}

                          {/* BETA channels — generic request form */}
                          {ch.status === 'beta' && ch.id !== 'shopify' && ch.id !== 'amazon' && ch.id !== 'ebay' && (
                            <div style={{ paddingTop: 14 }}>
                              <div style={{
                                background: '#eff6ff', border: '1px solid #bfdbfe',
                                borderRadius: 8, padding: '12px 14px', marginBottom: 12,
                              }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', marginBottom: 4 }}>Beta integration</div>
                                <div style={{ fontSize: 12, color: '#6b6e87', lineHeight: 1.5 }}>
                                  {ch.name} is available in private beta. Join the waitlist and our team will reach out to get you set up.
                                </div>
                              </div>
                              <button
                                onClick={() => requestBeta(ch.id, ch.name)}
                                style={{
                                  background: '#5b52f5', color: 'white', border: 'none', borderRadius: 7,
                                  padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                                }}
                              >
                                Request access to {ch.name} →
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #e8e5df', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#9496b0' }}>
            Don't see a channel you need?{' '}
            <span style={{ color: '#5b52f5', fontWeight: 500, cursor: 'pointer' }}>
              Request an integration →
            </span>
          </div>
        </div>

      </main>
    </div>
  )
}
