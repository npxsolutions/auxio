'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../lib/supabase-client'
import { Suspense } from 'react'

const CATEGORIES = ['Fragrances & Beauty', 'Electronics', 'Clothing & Fashion', 'Supplements & Health', 'Home & Garden', 'Toys & Games', 'Sports & Outdoors', 'Other']

const CHANNELS = [
  { id: 'shopify', icon: '🛍️', name: 'Shopify', desc: 'Connect via OAuth — instant sync', available: true },
  { id: 'amazon', icon: '📦', name: 'Amazon', desc: 'Enter your SP-API credentials', available: true },
  { id: 'ebay',   icon: '🛒', name: 'eBay',   desc: 'Enter your API token', available: true },
  { id: 'tiktok_shop', icon: '📱', name: 'TikTok Shop', desc: 'Coming soon', available: false },
  { id: 'etsy',   icon: '🎨', name: 'Etsy',   desc: 'Coming soon', available: false },
]

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('')
  const [shopDomain, setShopDomain] = useState('')
  const [amazonClientId, setAmazonClientId] = useState('')
  const [amazonClientSecret, setAmazonClientSecret] = useState('')
  const [amazonRefreshToken, setAmazonRefreshToken] = useState('')
  const [amazonMarketplace, setAmazonMarketplace] = useState('A1F83G8C2ARO7P')
  const [ebayToken, setEbayToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const stepParam = searchParams.get('step')
    if (stepParam) setStep(parseInt(stepParam))
    checkAlreadyOnboarded()
  }, [])

  async function checkAlreadyOnboarded() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    if (user.user_metadata?.onboarding_complete) { router.push('/dashboard') }
  }

  async function connectShopify() {
    if (!shopDomain.trim()) { setError('Please enter your Shopify store domain'); return }
    const domain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    router.push(`/api/shopify/connect?shop=${domain}`)
  }

  async function connectAmazon() {
    if (!amazonClientId || !amazonClientSecret || !amazonRefreshToken) {
      setError('Please fill in all Amazon credentials'); return
    }
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('channels').upsert({
        user_id: user.id,
        type: 'amazon',
        active: true,
        ads_access_token: amazonClientId,
        access_token: amazonRefreshToken,
        shop_name: `Amazon (${amazonMarketplace})`,
        marketplace_id: amazonMarketplace,
        client_secret: amazonClientSecret,
        connected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,type' })

      await supabase.auth.updateUser({ data: { onboarding_complete: true } })
      setStep(3)
    } catch (err: any) {
      setError(err.message || 'Failed to save credentials')
    } finally {
      setSaving(false)
    }
  }

  async function connectEbay() {
    if (!ebayToken.trim()) { setError('Please enter your eBay API token'); return }
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('channels').upsert({
        user_id: user.id,
        type: 'ebay',
        active: true,
        access_token: ebayToken,
        shop_name: 'eBay Store',
        connected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,type' })

      await supabase.auth.updateUser({ data: { onboarding_complete: true } })
      setStep(3)
    } catch (err: any) {
      setError(err.message || 'Failed to save credentials')
    } finally {
      setSaving(false)
    }
  }

  function goToDashboard() {
    router.push('/dashboard')
  }

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', minHeight: '100vh', background: '#f7f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '40px', height: '40px', background: '#191919', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>A</div>
          <div style={{ fontSize: '13px', color: '#9b9b98' }}>Step {step} of 3</div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '10px' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ width: s <= step ? '24px' : '8px', height: '4px', borderRadius: '2px', background: s <= step ? '#191919' : '#e8e8e5', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>

        {/* Step 1: About your business */}
        {step === 1 && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '32px', border: '1px solid #e8e8e5' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#191919', marginBottom: '6px', letterSpacing: '-0.02em' }}>Welcome to Auxio</h1>
            <p style={{ fontSize: '14px', color: '#787774', marginBottom: '24px' }}>Tell us about your business so we can tailor your intelligence engine.</p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#191919', display: 'block', marginBottom: '8px' }}>What do you primarily sell?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {CATEGORIES.map(cat => (
                  <div
                    key={cat}
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '7px',
                      border: `1px solid ${category === cat ? '#191919' : '#e8e8e5'}`,
                      background: category === cat ? '#191919' : 'white',
                      color: category === cat ? 'white' : '#191919',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => category && setStep(2)}
              disabled={!category}
              style={{ width: '100%', padding: '12px', background: category ? '#191919' : '#e8e8e5', color: category ? 'white' : '#9b9b98', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: category ? 'pointer' : 'default', fontFamily: 'Inter, sans-serif' }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Connect channel */}
        {step === 2 && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '32px', border: '1px solid #e8e8e5' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#191919', marginBottom: '6px', letterSpacing: '-0.02em' }}>Connect your store</h1>
            <p style={{ fontSize: '14px', color: '#787774', marginBottom: '24px' }}>Connect at least one channel to start generating intelligence.</p>

            {!selectedChannel ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {CHANNELS.map(ch => (
                  <div
                    key={ch.id}
                    onClick={() => ch.available && setSelectedChannel(ch.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      borderRadius: '9px',
                      border: '1px solid #e8e8e5',
                      cursor: ch.available ? 'pointer' : 'default',
                      opacity: ch.available ? 1 : 0.5,
                      background: 'white',
                    }}
                  >
                    <span style={{ fontSize: '22px' }}>{ch.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#191919' }}>{ch.name}</div>
                      <div style={{ fontSize: '12px', color: '#787774' }}>{ch.desc}</div>
                    </div>
                    {ch.available && <span style={{ fontSize: '12px', color: '#9b9b98' }}>→</span>}
                    {!ch.available && <span style={{ fontSize: '10px', color: '#9b9b98', background: '#f1f1ef', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>SOON</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button onClick={() => { setSelectedChannel(''); setError('') }} style={{ background: 'none', border: 'none', color: '#787774', fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'Inter, sans-serif' }}>
                  ← Back
                </button>

                {error && (
                  <div style={{ background: '#fce8e6', color: '#c9372c', padding: '10px 14px', borderRadius: '7px', fontSize: '13px', marginBottom: '16px' }}>
                    {error}
                  </div>
                )}

                {/* Shopify */}
                {selectedChannel === 'shopify' && (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#191919', marginBottom: '4px' }}>🛍️ Connect Shopify</div>
                    <p style={{ fontSize: '13px', color: '#787774', marginBottom: '16px' }}>Enter your Shopify store domain to start the OAuth connection.</p>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#191919', display: 'block', marginBottom: '6px' }}>Store domain</label>
                    <input
                      value={shopDomain}
                      onChange={e => setShopDomain(e.target.value)}
                      placeholder="mystore.myshopify.com"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e5', borderRadius: '7px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#191919', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
                    />
                    <button onClick={connectShopify} style={{ width: '100%', padding: '12px', background: '#191919', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      Connect with Shopify →
                    </button>
                  </div>
                )}

                {/* Amazon */}
                {selectedChannel === 'amazon' && (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#191919', marginBottom: '4px' }}>📦 Connect Amazon SP-API</div>
                    <p style={{ fontSize: '13px', color: '#787774', marginBottom: '16px' }}>Enter your Amazon Selling Partner API credentials from Seller Central.</p>

                    {[
                      { label: 'Client ID (LWA App ID)', value: amazonClientId, set: setAmazonClientId, ph: 'amzn1.application-oa2-client.xxx' },
                      { label: 'Client Secret', value: amazonClientSecret, set: setAmazonClientSecret, ph: 'Your LWA client secret' },
                      { label: 'Refresh Token', value: amazonRefreshToken, set: setAmazonRefreshToken, ph: 'Artz|xxx...' },
                    ].map(f => (
                      <div key={f.label} style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#191919', display: 'block', marginBottom: '5px' }}>{f.label}</label>
                        <input
                          value={f.value}
                          onChange={e => f.set(e.target.value)}
                          placeholder={f.ph}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e5', borderRadius: '7px', fontSize: '12px', fontFamily: 'monospace', color: '#191919', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#191919', display: 'block', marginBottom: '5px' }}>Marketplace</label>
                      <select
                        value={amazonMarketplace}
                        onChange={e => setAmazonMarketplace(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e5', borderRadius: '7px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#191919', background: 'white' }}
                      >
                        <option value="A1F83G8C2ARO7P">Amazon UK</option>
                        <option value="A1PA6795UKMFR9">Amazon DE</option>
                        <option value="A13V1IB3VIYZZH">Amazon FR</option>
                        <option value="ATVPDKIKX0DER">Amazon US</option>
                      </select>
                    </div>

                    <button onClick={connectAmazon} disabled={saving} style={{ width: '100%', padding: '12px', background: '#191919', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'Inter, sans-serif' }}>
                      {saving ? 'Saving...' : 'Save credentials →'}
                    </button>
                  </div>
                )}

                {/* eBay */}
                {selectedChannel === 'ebay' && (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#191919', marginBottom: '4px' }}>🛒 Connect eBay</div>
                    <p style={{ fontSize: '13px', color: '#787774', marginBottom: '16px' }}>Enter your eBay User Token from the Developers Program.</p>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#191919', display: 'block', marginBottom: '5px' }}>User Access Token</label>
                    <textarea
                      value={ebayToken}
                      onChange={e => setEbayToken(e.target.value)}
                      placeholder="v^1.1#i^1#f^0#r^0#t^H4sIAA..."
                      rows={4}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8e8e5', borderRadius: '7px', fontSize: '12px', fontFamily: 'monospace', color: '#191919', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
                    />
                    <button onClick={connectEbay} disabled={saving} style={{ width: '100%', padding: '12px', background: '#191919', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'Inter, sans-serif' }}>
                      {saving ? 'Saving...' : 'Save token →'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Intelligence initialising */}
        {step === 3 && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '40px 32px', border: '1px solid #e8e8e5', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#191919', marginBottom: '8px', letterSpacing: '-0.02em' }}>Intelligence engine online</h1>
            <p style={{ fontSize: '14px', color: '#787774', lineHeight: 1.6, marginBottom: '32px' }}>
              Your channel is connected. Auxio will sync your data tonight and generate your first intelligence report by morning.
            </p>

            <div style={{ background: '#f7f7f5', borderRadius: '10px', padding: '20px', marginBottom: '28px', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#9b9b98', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>What happens next</div>
              {[
                ['Tonight at 2am', 'Auxio syncs all your orders and calculates true profit'],
                ['Tomorrow morning', 'Your first AI briefing lands in your dashboard'],
                ['Each week', 'ML models retrain on your data and get sharper'],
              ].map(([time, desc]) => (
                <div key={time} style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0f7b6c', marginTop: '5px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#191919' }}>{time}</div>
                    <div style={{ fontSize: '12px', color: '#787774' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={goToDashboard}
              style={{ width: '100%', padding: '14px', background: '#191919', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              Go to Command Centre →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  )
}
