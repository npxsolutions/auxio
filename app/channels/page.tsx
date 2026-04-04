'use client'

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

const CHANNEL_META: Record<string, { icon: string; color: string; name: string }> = {
  ebay:        { icon: '🛒', color: '#fff0e6', name: 'eBay' },
  amazon:      { icon: '📦', color: '#fff3e6', name: 'Amazon' },
  shopify:     { icon: '🛍️', color: '#e8f1fb', name: 'Shopify' },
  tiktok_shop: { icon: '📱', color: '#e8f5f3', name: 'TikTok Shop' },
  etsy:        { icon: '🎨', color: '#fdf3e8', name: 'Etsy' },
}

const AVAILABLE_CHANNELS = [
  { id: 'shopify', oauth: true },
  { id: 'amazon',  oauth: true },
  { id: 'ebay',    oauth: true },
]

export default function ChannelsPage() {
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)
  const [shopDomain, setShopDomain] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const supabase = createClient()

  useEffect(() => { load() }, [])

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

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function syncChannel(channelId: string, channelType: string) {
    setSyncing(channelId)
    try {
      if (channelType === 'shopify') {
        // Sync orders AND products in parallel
        const [ordersRes, productsRes] = await Promise.all([
          fetch('/api/shopify/sync',          { method: 'POST' }).then(r => r.json()),
          fetch('/api/shopify/products/sync', { method: 'POST' }).then(r => r.json()),
        ])
        const msgs = [ordersRes.message, productsRes.message].filter(Boolean).join(' · ')
        showToast(msgs || 'Shopify sync complete')
      } else if (channelType === 'ebay') {
        // Sync listings AND orders in parallel
        const [listingsRes, ordersRes] = await Promise.all([
          fetch('/api/ebay/sync',        { method: 'POST' }).then(r => r.json()),
          fetch('/api/ebay/orders/sync', { method: 'POST' }).then(r => r.json()),
        ])
        const msgs = [listingsRes.message, ordersRes.message].filter(Boolean).join(' · ')
        showToast(msgs || 'eBay sync complete')
      } else {
        showToast('Sync not yet supported for this channel')
      }
    } catch (err: any) {
      showToast(err.message || 'Sync failed — please try again')
    } finally {
      setSyncing(null)
    }
  }

  async function disconnectChannel(channelId: string) {
    if (!confirm('Disconnect this channel? Historical data is kept.')) return
    await supabase.from('channels').update({ active: false }).eq('id', channelId)
    setChannels(prev => prev.filter(c => c.id !== channelId))
    showToast('Channel disconnected')
  }

  const connectedTypes = new Set(channels.map(c => c.type))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f7f5', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: '14px', color: '#787774' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f7f7f5', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#191919', color: 'white', padding: '12px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, zIndex: 200 }}>
          {toast}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: '760px' }}>

          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#191919', letterSpacing: '-0.02em', marginBottom: '4px' }}>Channels</h1>
            <p style={{ fontSize: '14px', color: '#787774' }}>Connect your selling platforms to start syncing orders.</p>
          </div>

          {/* Connected channels */}
          {channels.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Connected</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {channels.map(ch => {
                  const meta = CHANNEL_META[ch.type] || { icon: '🏪', color: '#f1f1ef', name: ch.type }
                  return (
                    <div key={ch.id} style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '36px', height: '36px', background: meta.color, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{meta.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#191919' }}>{ch.shop_name || meta.name}</div>
                        <div style={{ fontSize: '12px', color: '#9b9b98', marginTop: '2px' }}>
                          Connected {new Date(ch.connected_at).toLocaleDateString('en-GB')}
                          {ch.last_synced_at && ` · Last synced ${new Date(ch.last_synced_at).toLocaleDateString('en-GB')}`}
                        </div>
                      </div>
                      <span style={{ background: '#e8f5f3', color: '#0f7b6c', fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px' }}>● Active</span>
                      <button
                        onClick={() => syncChannel(ch.id, ch.type)}
                        disabled={syncing === ch.id}
                        style={{ background: '#f1f1ef', color: '#191919', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 500, cursor: syncing === ch.id ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif' }}
                      >
                        {syncing === ch.id ? 'Syncing...' : '↻ Sync now'}
                      </button>
                      <button
                        onClick={() => disconnectChannel(ch.id)}
                        style={{ background: 'none', color: '#9b9b98', border: '1px solid #e8e8e5', borderRadius: '6px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                      >
                        Disconnect
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add channel section */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              {channels.length > 0 ? 'Add another channel' : 'Connect a channel'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {AVAILABLE_CHANNELS.filter(c => !connectedTypes.has(c.id)).map(ch => {
                const meta = CHANNEL_META[ch.id]
                const isOpen = adding === ch.id
                return (
                  <div key={ch.id} style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', overflow: 'hidden' }}>
                    <div
                      onClick={() => setAdding(isOpen ? null : ch.id)}
                      style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                    >
                      <div style={{ width: '36px', height: '36px', background: meta.color, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{meta.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#191919' }}>{meta.name}</div>
                        <div style={{ fontSize: '12px', color: '#787774' }}>{ch.oauth ? 'Connect via OAuth' : 'Enter API credentials'}</div>
                      </div>
                      <span style={{ color: '#9b9b98', fontSize: '14px' }}>{isOpen ? '▲' : '▼'}</span>
                    </div>

                    {isOpen && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f7f7f5' }}>
                        {error && <div style={{ background: '#fce8e6', color: '#c9372c', padding: '10px 14px', borderRadius: '7px', fontSize: '13px', marginBottom: '12px', marginTop: '12px' }}>{error}</div>}

                        {ch.id === 'shopify' && (
                          <div style={{ paddingTop: '16px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#191919', display: 'block', marginBottom: '6px' }}>Store domain</label>
                            <input value={shopDomain} onChange={e => setShopDomain(e.target.value)} placeholder="mystore.myshopify.com"
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e5', borderRadius: '7px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#191919', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }} />
                            <button onClick={() => { const d = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, ''); router.push(`/api/shopify/connect?shop=${d}`) }}
                              style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '7px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                              Connect with Shopify →
                            </button>
                          </div>
                        )}

                        {ch.id === 'amazon' && (
                          <div style={{ paddingTop: '16px' }}>
                            <p style={{ fontSize: '13px', color: '#787774', margin: '0 0 14px', lineHeight: 1.6 }}>
                              Connect via Amazon Login with Amazon (LWA) OAuth. You'll be redirected to Amazon to authorise Auxio.
                            </p>
                            <button onClick={() => router.push('/api/amazon/connect')}
                              style={{ background: '#FF9900', color: 'white', border: 'none', borderRadius: '7px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                              Connect with Amazon →
                            </button>
                          </div>
                        )}

                        {ch.id === 'ebay' && (
                          <div style={{ paddingTop: '16px' }}>
                            <p style={{ fontSize: '13px', color: '#787774', margin: '0 0 14px', lineHeight: 1.6 }}>
                              Connect via eBay OAuth. You'll be redirected to eBay to authorise Auxio to access your seller account.
                            </p>
                            <button onClick={() => router.push('/api/ebay/connect')}
                              style={{ background: '#E53238', color: 'white', border: 'none', borderRadius: '7px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                              Connect with eBay →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Coming soon */}
              {['tiktok_shop', 'etsy'].map(id => {
                const meta = CHANNEL_META[id]
                return (
                  <div key={id} style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', opacity: 0.5 }}>
                    <div style={{ width: '36px', height: '36px', background: meta.color, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{meta.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#191919' }}>{meta.name}</div>
                      <div style={{ fontSize: '12px', color: '#787774' }}>Coming soon</div>
                    </div>
                    <span style={{ fontSize: '10px', color: '#9b9b98', background: '#f1f1ef', padding: '3px 9px', borderRadius: '4px', fontWeight: 700 }}>SOON</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
