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

const CHANNEL_META: Record<string, { icon: string; bg: string; name: string }> = {
  ebay:        { icon: '🛒', bg: '#fff5f0', name: 'eBay' },
  amazon:      { icon: '📦', bg: '#fff8ed', name: 'Amazon' },
  shopify:     { icon: '🛍️', bg: '#f0f7ee', name: 'Shopify' },
  tiktok_shop: { icon: '📱', bg: '#f0f9f7', name: 'TikTok Shop' },
  etsy:        { icon: '🎨', bg: '#fdf6ee', name: 'Etsy' },
}

const AVAILABLE_CHANNELS = [
  { id: 'shopify', oauth: true },
  { id: 'amazon',  oauth: true },
  { id: 'ebay',    oauth: true },
]

interface HealthIssue { type: string; issue: string; message: string }

export default function ChannelsPage() {
  const router = useRouter()
  const [channels, setChannels]         = useState<Channel[]>([])
  const [loading, setLoading]           = useState(true)
  const [syncing, setSyncing]           = useState<string | null>(null)
  const [adding, setAdding]             = useState<string | null>(null)
  const [shopDomain, setShopDomain]     = useState('')
  const [error, setError]               = useState('')
  const [toast, setToast]               = useState('')
  const [toastType, setToastType]       = useState<'success' | 'error'>('success')
  const [healthIssues, setHealthIssues] = useState<HealthIssue[]>([])
  const [focusedInput, setFocusedInput] = useState(false)
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
    setToast(msg)
    setToastType(type)
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
        const msgs = [ordersRes.message, productsRes.message].filter(Boolean).join(' · ')
        showToast(msgs || 'Shopify sync complete', 'success')
      } else if (channelType === 'ebay') {
        const [listingsRes, ordersRes] = await Promise.all([
          fetch('/api/ebay/sync',        { method: 'POST' }).then(r => r.json()),
          fetch('/api/ebay/orders/sync', { method: 'POST' }).then(r => r.json()),
        ])
        const msgs = [listingsRes.message, ordersRes.message].filter(Boolean).join(' · ')
        showToast(msgs || 'eBay sync complete', 'success')
      } else {
        showToast('Sync not yet supported for this channel', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Sync failed — please try again', 'error')
    } finally {
      setSyncing(null)
    }
  }

  async function disconnectChannel(channelId: string) {
    if (!confirm('Disconnect this channel? Historical data is kept.')) return
    await supabase.from('channels').update({ active: false }).eq('id', channelId)
    setChannels(prev => prev.filter(c => c.id !== channelId))
    showToast('Channel disconnected', 'success')
  }

  const connectedTypes = new Set(channels.map(c => c.type))

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
          boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
          borderRadius: 10, padding: '14px 18px',
          fontSize: 13, fontWeight: 500, zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 10,
          borderLeft: `3px solid ${toastType === 'success' ? '#059669' : '#dc2626'}`,
          fontFamily: 'inherit',
        }}>
          <span style={{ color: toastType === 'success' ? '#059669' : '#dc2626' }}>{toastType === 'success' ? '✓' : '✕'}</span>
          {toast}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: '760px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1b22', letterSpacing: '-0.03em', margin: 0 }}>Channels</h1>
              <p style={{ fontSize: 14, color: '#6b6e87', margin: '4px 0 0' }}>Connect your selling platforms to start syncing orders.</p>
            </div>
          </div>

          {/* Health issue banners */}
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
                      {isError && (
                        <div style={{ fontSize: 12, color: '#6b6e87', marginTop: 2 }}>Disconnect and reconnect to restore access.</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Connected channels */}
          {channels.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Connected</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {channels.map(ch => {
                  const meta = CHANNEL_META[ch.type] || { icon: '🏪', bg: '#f5f3ef', name: ch.type }
                  return (
                    <div key={ch.id} style={{
                      background: 'white',
                      border: '1px solid #e8e5df',
                      borderRadius: 12,
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{
                        width: 40, height: 40,
                        background: meta.bg,
                        borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, flexShrink: 0,
                        border: '1px solid #e8e5df',
                      }}>
                        {meta.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1b22' }}>{ch.shop_name || meta.name}</div>
                        <div style={{ fontSize: 12, color: '#9496b0', marginTop: 2 }}>
                          Connected {new Date(ch.connected_at).toLocaleDateString('en-GB')}
                          {ch.last_synced_at && ` · Last synced ${new Date(ch.last_synced_at).toLocaleDateString('en-GB')}`}
                        </div>
                      </div>
                      {/* Active badge */}
                      <span style={{
                        background: '#ecfdf5', color: '#059669',
                        border: '1px solid #a7f3d0',
                        fontSize: 11, fontWeight: 600,
                        padding: '3px 10px', borderRadius: 100,
                        whiteSpace: 'nowrap',
                      }}>
                        ● Active
                      </span>
                      {/* Sync button */}
                      <button
                        onClick={() => syncChannel(ch.id, ch.type)}
                        disabled={syncing === ch.id}
                        style={{
                          background: 'white', color: '#1a1b22',
                          border: '1px solid #e8e5df',
                          borderRadius: 8, padding: '7px 14px',
                          fontSize: 12, fontWeight: 500,
                          cursor: syncing === ch.id ? 'wait' : 'pointer',
                          fontFamily: 'inherit',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {syncing === ch.id ? 'Syncing…' : '↻ Sync now'}
                      </button>
                      {/* Disconnect button */}
                      <button
                        onClick={() => disconnectChannel(ch.id)}
                        style={{
                          background: '#fef2f2', color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: 8, padding: '7px 12px',
                          fontSize: 12, fontWeight: 500,
                          cursor: 'pointer', fontFamily: 'inherit',
                          whiteSpace: 'nowrap',
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

          {/* Add channel section */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9496b0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              {channels.length > 0 ? 'Add another channel' : 'Connect a channel'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {AVAILABLE_CHANNELS.filter(c => !connectedTypes.has(c.id)).map(ch => {
                const meta = CHANNEL_META[ch.id]
                const isOpen = adding === ch.id
                return (
                  <div key={ch.id} style={{
                    background: 'white',
                    border: '1px solid #e8e5df',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
                  }}>
                    <div
                      onClick={() => setAdding(isOpen ? null : ch.id)}
                      style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                    >
                      <div style={{
                        width: 40, height: 40,
                        background: meta.bg,
                        border: '1px solid #e8e5df',
                        borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, flexShrink: 0,
                      }}>
                        {meta.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1b22' }}>{meta.name}</div>
                        <div style={{ fontSize: 12, color: '#6b6e87' }}>{ch.oauth ? 'Connect via OAuth' : 'Enter API credentials'}</div>
                      </div>
                      <span style={{
                        color: '#9496b0', fontSize: 12,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        display: 'inline-block',
                      }}>▼</span>
                    </div>

                    {isOpen && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f0ede8' }}>
                        {error && (
                          <div style={{
                            background: '#fef2f2', color: '#dc2626',
                            border: '1px solid #fecaca',
                            padding: '10px 14px', borderRadius: 8,
                            fontSize: 13, marginBottom: 12, marginTop: 12,
                          }}>
                            {error}
                          </div>
                        )}

                        {ch.id === 'shopify' && (
                          <div style={{ paddingTop: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1b22', display: 'block', marginBottom: 6 }}>Store domain</label>
                            <input
                              value={shopDomain}
                              onChange={e => setShopDomain(e.target.value)}
                              placeholder="mystore.myshopify.com"
                              onFocus={() => setFocusedInput(true)}
                              onBlur={() => setFocusedInput(false)}
                              style={{
                                width: '100%', padding: '10px 12px',
                                border: `1px solid ${focusedInput ? '#5b52f5' : '#e8e5df'}`,
                                borderRadius: 8, fontSize: 13,
                                fontFamily: 'inherit', color: '#1a1b22',
                                outline: 'none', boxSizing: 'border-box', marginBottom: 12,
                                boxShadow: focusedInput ? '0 0 0 3px rgba(91,82,245,0.12)' : 'none',
                                transition: 'border-color 0.15s, box-shadow 0.15s',
                              }}
                            />
                            <button
                              onClick={() => { const d = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, ''); router.push(`/api/shopify/connect?shop=${d}`) }}
                              style={{
                                background: '#96BF48', color: 'white',
                                border: 'none', borderRadius: 8,
                                padding: '10px 18px', fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'inherit',
                              }}>
                              Connect with Shopify →
                            </button>
                          </div>
                        )}

                        {ch.id === 'amazon' && (
                          <div style={{ paddingTop: 16 }}>
                            <p style={{ fontSize: 13, color: '#6b6e87', margin: '0 0 14px', lineHeight: 1.6 }}>
                              Connect via Amazon Login with Amazon (LWA) OAuth. You'll be redirected to Amazon to authorise Auxio.
                            </p>
                            <button
                              onClick={() => router.push('/api/amazon/connect')}
                              style={{
                                background: '#FF9900', color: 'white',
                                border: 'none', borderRadius: 8,
                                padding: '10px 18px', fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'inherit',
                              }}>
                              Connect with Amazon →
                            </button>
                          </div>
                        )}

                        {ch.id === 'ebay' && (
                          <div style={{ paddingTop: 16 }}>
                            <p style={{ fontSize: 13, color: '#6b6e87', margin: '0 0 14px', lineHeight: 1.6 }}>
                              Connect via eBay OAuth. You'll be redirected to eBay to authorise Auxio to access your seller account.
                            </p>
                            <button
                              onClick={() => router.push('/api/ebay/connect')}
                              style={{
                                background: '#E53238', color: 'white',
                                border: 'none', borderRadius: 8,
                                padding: '10px 18px', fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'inherit',
                              }}>
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
                  <div key={id} style={{
                    background: 'white',
                    border: '1px solid #e8e5df',
                    borderRadius: 12, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    opacity: 0.55,
                  }}>
                    <div style={{
                      width: 40, height: 40, background: meta.bg,
                      border: '1px solid #e8e5df',
                      borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                      {meta.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1b22' }}>{meta.name}</div>
                      <div style={{ fontSize: 12, color: '#6b6e87' }}>Coming soon</div>
                    </div>
                    <span style={{
                      fontSize: 10, color: '#9496b0',
                      background: '#f5f3ef',
                      border: '1px solid #e8e5df',
                      padding: '3px 9px', borderRadius: 6,
                      fontWeight: 700, letterSpacing: '0.06em',
                    }}>
                      SOON
                    </span>
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
