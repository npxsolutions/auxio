'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../lib/supabase-client'
import { Suspense } from 'react'

const INDIGO = '#5b52f5'
const INDIGO_HOVER = '#4a42e5'

const CATEGORIES = [
  'Fragrances & Beauty',
  'Electronics',
  'Clothing & Fashion',
  'Supplements & Health',
  'Home & Garden',
  'Toys & Games',
  'Sports & Outdoors',
  'Other',
]

const CHANNELS = [
  { id: 'shopify',    icon: '🛍️', name: 'Shopify',     desc: 'Connect via OAuth — instant sync',    available: true  },
  { id: 'amazon',    icon: '📦', name: 'Amazon',      desc: 'Enter your SP-API credentials',        available: true  },
  { id: 'ebay',      icon: '🛒', name: 'eBay',        desc: 'Enter your API token',                 available: true  },
  { id: 'tiktok_shop', icon: '📱', name: 'TikTok Shop', desc: 'Coming soon',                       available: false },
  { id: 'etsy',      icon: '🎨', name: 'Etsy',        desc: 'Coming soon',                         available: false },
]

const TOTAL_STEPS = 3

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {Array.from({ length: total }, (_, i) => {
        const s = i + 1
        const done = s < current
        const active = s === current
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: done ? INDIGO : active ? INDIGO : '#e8e5df',
              border: active ? `2px solid ${INDIGO}` : done ? 'none' : '2px solid #e8e5df',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.25s',
              flexShrink: 0,
            }}>
              {done ? (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5l3 3L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 700, color: active ? 'white' : '#9b9ea8' }}>{s}</span>
              )}
            </div>
            {s < total && (
              <div style={{
                width: 48,
                height: 2,
                background: done ? INDIGO : '#e8e5df',
                transition: 'background 0.25s',
              }} />
            )}
          </div>
        )
      })}
      <span style={{ fontSize: 12, color: '#9b9ea8', marginLeft: 12, fontWeight: 500 }}>
        Step {current} of {total}
      </span>
    </div>
  )
}

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${focused ? INDIGO : '#e8e5df'}`,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    color: '#1a1b22',
    outline: 'none',
    boxSizing: 'border-box',
    background: 'white',
    boxShadow: focused ? '0 0 0 3px rgba(91,82,245,0.1)' : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep]                   = useState(1)
  const [category, setCategory]           = useState('')
  const [selectedChannel, setSelectedChannel] = useState('')
  const [shopDomain, setShopDomain]       = useState('')
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')
  const [shopFocus, setShopFocus]         = useState(false)
  const [continueBtnHover, setContinueBtnHover] = useState(false)
  const [dashBtnHover, setDashBtnHover]   = useState(false)
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

  async function skipOnboarding() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.auth.updateUser({ data: { onboarding_complete: true } })
    router.push('/dashboard')
  }

  async function connectShopify() {
    if (!shopDomain.trim()) { setError('Please enter your Shopify store domain'); return }
    const domain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    router.push(`/api/shopify/connect?shop=${domain}`)
  }

  function connectAmazon() {
    router.push('/api/amazon/connect')
  }

  function connectEbay() {
    router.push('/api/ebay/connect')
  }

  function goToDashboard() {
    router.push('/dashboard')
  }

  return (
    <div style={{
      fontFamily: 'Inter, -apple-system, sans-serif',
      minHeight: '100vh',
      background: '#f5f3ef',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      WebkitFontSmoothing: 'antialiased' as any,
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Logo + progress */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 32 }}>
            <div style={{
              width: 30,
              height: 30,
              background: 'linear-gradient(135deg, #5b52f5 0%, #7c75f8 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 14,
              fontWeight: 800,
            }}>A</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1b22', letterSpacing: '-0.02em' }}>Auxio</span>
          </div>
          <StepDots current={step} total={TOTAL_STEPS} />
        </div>

        {/* STEP 1 — About your business */}
        {step === 1 && (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 40,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Welcome to Auxio
            </h1>
            <p style={{ fontSize: 14, color: '#6b6e87', marginBottom: 28, lineHeight: 1.6 }}>
              Tell us about your business so we can tailor your intelligence engine.
            </p>

            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1b22', display: 'block', marginBottom: 12 }}>
                What do you primarily sell?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <div
                    key={cat}
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${category === cat ? INDIGO : '#e8e5df'}`,
                      background: category === cat ? 'rgba(91,82,245,0.05)' : 'white',
                      color: category === cat ? INDIGO : '#1a1b22',
                      fontSize: 13,
                      fontWeight: category === cat ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                      userSelect: 'none',
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
              onMouseEnter={() => setContinueBtnHover(true)}
              onMouseLeave={() => setContinueBtnHover(false)}
              style={{
                width: '100%',
                padding: 13,
                background: category ? (continueBtnHover ? INDIGO_HOVER : INDIGO) : '#e8e5df',
                color: category ? 'white' : '#9b9ea8',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: category ? 'pointer' : 'default',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
            >
              Continue →
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={skipOnboarding}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9b9ea8',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Skip for now → go to dashboard
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Connect channel */}
        {step === 2 && (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 40,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Connect your store
            </h1>
            <p style={{ fontSize: 14, color: '#6b6e87', marginBottom: 28, lineHeight: 1.6 }}>
              Connect at least one channel to start generating intelligence.
            </p>

            {!selectedChannel ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {CHANNELS.map(ch => (
                  <div
                    key={ch.id}
                    onClick={() => ch.available && setSelectedChannel(ch.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: '1px solid #e8e5df',
                      cursor: ch.available ? 'pointer' : 'default',
                      opacity: ch.available ? 1 : 0.5,
                      background: 'white',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (ch.available) {
                        (e.currentTarget as HTMLDivElement).style.borderColor = INDIGO
                        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(91,82,245,0.08)'
                      }
                    }}
                    onMouseLeave={e => {
                      ;(e.currentTarget as HTMLDivElement).style.borderColor = '#e8e5df'
                      ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{ch.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1b22' }}>{ch.name}</div>
                      <div style={{ fontSize: 12, color: '#6b6e87' }}>{ch.desc}</div>
                    </div>
                    {ch.available && <span style={{ fontSize: 12, color: '#9b9ea8' }}>→</span>}
                    {!ch.available && (
                      <span style={{
                        fontSize: 10,
                        color: '#9b9ea8',
                        background: '#f5f3ef',
                        padding: '2px 7px',
                        borderRadius: 4,
                        fontWeight: 600,
                      }}>SOON</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button
                  onClick={() => { setSelectedChannel(''); setError('') }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b6e87',
                    fontSize: 13,
                    cursor: 'pointer',
                    marginBottom: 20,
                    padding: 0,
                    fontFamily: 'inherit',
                  }}
                >
                  ← Back
                </button>

                {error && (
                  <div style={{
                    fontSize: 13,
                    color: '#dc2626',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 18,
                  }}>
                    {error}
                  </div>
                )}

                {/* Shopify */}
                {selectedChannel === 'shopify' && (
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1b22', marginBottom: 4 }}>🛍️ Connect Shopify</div>
                    <p style={{ fontSize: 13, color: '#6b6e87', marginBottom: 20, lineHeight: 1.6 }}>
                      Enter your store domain and we'll connect via Shopify OAuth.
                    </p>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1b22', display: 'block', marginBottom: 6 }}>
                      Store domain
                    </label>
                    <input
                      value={shopDomain}
                      onChange={e => setShopDomain(e.target.value)}
                      placeholder="mystore.myshopify.com"
                      onKeyDown={e => e.key === 'Enter' && connectShopify()}
                      style={{ ...inputStyle(shopFocus), marginBottom: 14 }}
                      onFocus={() => setShopFocus(true)}
                      onBlur={() => setShopFocus(false)}
                    />
                    <button
                      onClick={connectShopify}
                      style={{
                        width: '100%',
                        padding: 13,
                        background: INDIGO,
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        marginBottom: 12,
                      }}
                    >
                      Connect with Shopify →
                    </button>
                    <p style={{ fontSize: 11, color: '#9b9ea8', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                      No Auxio account needed — we'll create one automatically using your Shopify store email.
                    </p>
                  </div>
                )}

                {/* Amazon */}
                {selectedChannel === 'amazon' && (
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1b22', marginBottom: 4 }}>📦 Connect Amazon</div>
                    <p style={{ fontSize: 13, color: '#6b6e87', marginBottom: 24, lineHeight: 1.6 }}>
                      You'll be redirected to Amazon to authorise access to your Advertising account.
                    </p>
                    <button
                      onClick={connectAmazon}
                      style={{
                        width: '100%',
                        padding: 13,
                        background: '#FF9900',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Continue with Amazon →
                    </button>
                  </div>
                )}

                {/* eBay */}
                {selectedChannel === 'ebay' && (
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1b22', marginBottom: 4 }}>🛒 Connect eBay</div>
                    <p style={{ fontSize: 13, color: '#6b6e87', marginBottom: 24, lineHeight: 1.6 }}>
                      You'll be redirected to eBay to authorise access to your seller account.
                    </p>
                    <button
                      onClick={connectEbay}
                      style={{
                        width: '100%',
                        padding: 13,
                        background: '#E53238',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Continue with eBay →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — Intelligence initialising */}
        {step === 3 && (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 40,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
            textAlign: 'center',
          }}>
            {/* Icon */}
            <div style={{
              width: 56,
              height: 56,
              background: 'rgba(91,82,245,0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: 26,
            }}>⚡</div>

            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1b22', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Intelligence engine online
            </h1>
            <p style={{ fontSize: 14, color: '#6b6e87', lineHeight: 1.6, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
              Your channel is connected. Auxio will sync your data tonight and generate your first intelligence report by morning.
            </p>

            <div style={{
              background: '#f5f3ef',
              borderRadius: 12,
              padding: '20px 24px',
              marginBottom: 28,
              textAlign: 'left',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9b9ea8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                What happens next
              </div>
              {([
                ['Tonight at 2am', 'Auxio syncs all your orders and calculates true profit'],
                ['Tomorrow morning', 'Your first AI briefing lands in your dashboard'],
                ['Each week', 'ML models retrain on your data and get sharper'],
              ] as [string, string][]).map(([time, desc]) => (
                <div key={time} style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'rgba(91,82,245,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: INDIGO }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1b22', marginBottom: 2 }}>{time}</div>
                    <div style={{ fontSize: 12, color: '#6b6e87' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={goToDashboard}
              onMouseEnter={() => setDashBtnHover(true)}
              onMouseLeave={() => setDashBtnHover(false)}
              style={{
                width: '100%',
                padding: 13,
                background: dashBtnHover ? INDIGO_HOVER : INDIGO,
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
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
