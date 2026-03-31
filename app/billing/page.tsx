'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../lib/supabase-client'
import AppSidebar from '../components/AppSidebar'
import { Suspense } from 'react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 79.99,
    description: 'For solo sellers just getting started',
    features: ['Up to 500 orders/mo', 'Margin & velocity intelligence', 'AI insights (daily)', 'eBay + 1 other channel', 'Email support'],
    color: '#f1f1ef',
    textColor: '#787774',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 199,
    description: 'For scaling sellers who want the edge',
    features: ['Up to 5,000 orders/mo', 'Everything in Starter', 'AI Agent (copilot mode)', 'PPC intelligence & bid optimisation', 'All channels', 'Priority support'],
    color: '#e8f1fb',
    textColor: '#2383e2',
    popular: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 599,
    description: 'For serious operations building a brand',
    features: ['Unlimited orders', 'Everything in Growth', 'AI Agent (autopilot mode)', 'Network benchmark data', 'Custom margin targets', 'Dedicated account manager'],
    color: '#e8f5f3',
    textColor: '#0f7b6c',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 1500,
    description: 'For high-volume operations & agencies',
    features: ['Everything in Scale', 'Multi-account dashboard', 'Custom AI model training', 'API access', 'SLA guarantee', 'Onboarding & setup service'],
    color: '#fdf3e8',
    textColor: '#d9730d',
  },
]

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    load()
    if (searchParams.get('success') === 'true') {
      showToast('Subscription activated! Welcome to your new plan.', 'success')
    } else if (searchParams.get('cancelled') === 'true') {
      showToast('Checkout cancelled — no charge was made.', 'error')
    }
  }, [])

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    const { data } = await supabase
      .from('users')
      .select('plan, subscription_status')
      .eq('id', user.id)
      .single()

    setCurrentPlan(data?.plan || 'free')
    setSubscriptionStatus(data?.subscription_status || '')
    setLoading(false)
  }

  async function startCheckout(planId: string) {
    setCheckoutLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const { url, error } = await res.json()
      if (error) { showToast(error, 'error'); return }
      window.location.href = url
    } catch {
      showToast('Failed to start checkout. Please try again.', 'error')
    } finally {
      setCheckoutLoading(null)
    }
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) { showToast(error, 'error'); return }
      window.location.href = url
    } catch {
      showToast('Failed to open billing portal.', 'error')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f7f5' }}>
      <div style={{ fontSize: '14px', color: '#787774', fontFamily: 'Inter, sans-serif' }}>Loading...</div>
    </div>
  )

  const hasPaidPlan = currentPlan && currentPlan !== 'free'

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', minHeight: '100vh', background: '#f7f7f5', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: toast.type === 'success' ? '#0f7b6c' : '#c9372c', color: 'white', padding: '12px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, zIndex: 200, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.msg}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: '960px' }}>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#191919', letterSpacing: '-0.02em', marginBottom: '6px' }}>Billing & Plans</h1>
            <p style={{ fontSize: '14px', color: '#787774' }}>
              {hasPaidPlan
                ? `You're on the ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan${subscriptionStatus === 'past_due' ? ' — payment overdue' : ''}`
                : 'Choose a plan to unlock your intelligence engine'}
            </p>
          </div>

          {/* Manage billing button for paid plans */}
          {hasPaidPlan && (
            <div style={{ background: 'white', border: '1px solid #e8e8e5', borderRadius: '10px', padding: '20px 24px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#191919', marginBottom: '4px' }}>Current subscription</div>
                <div style={{ fontSize: '13px', color: '#787774' }}>
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
                  {subscriptionStatus && ` · ${subscriptionStatus}`}
                </div>
              </div>
              <button
                onClick={openPortal}
                disabled={portalLoading}
                style={{ background: '#191919', color: 'white', border: 'none', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 500, cursor: portalLoading ? 'wait' : 'pointer', opacity: portalLoading ? 0.7 : 1 }}
              >
                {portalLoading ? 'Opening...' : 'Manage billing →'}
              </button>
            </div>
          )}

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {PLANS.map(plan => {
              const isCurrent = currentPlan === plan.id
              const isLoading = checkoutLoading === plan.id
              return (
                <div
                  key={plan.id}
                  style={{
                    background: 'white',
                    border: isCurrent ? `2px solid ${plan.textColor}` : '1px solid #e8e8e5',
                    borderRadius: '12px',
                    padding: '24px 20px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {plan.popular && !isCurrent && (
                    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#2383e2', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', whiteSpace: 'nowrap' }}>
                      MOST POPULAR
                    </div>
                  )}
                  {isCurrent && (
                    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: plan.textColor, color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', whiteSpace: 'nowrap' }}>
                      CURRENT PLAN
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ background: plan.color, color: plan.textColor, fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '4px' }}>{plan.name}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '30px', fontWeight: 800, color: '#191919', letterSpacing: '-0.03em' }}>£{plan.price}</span>
                    <span style={{ fontSize: '13px', color: '#9b9b98' }}>/mo</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#787774', marginBottom: '20px', lineHeight: 1.5 }}>{plan.description}</p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#191919', marginBottom: '8px', lineHeight: 1.4 }}>
                        <span style={{ color: plan.textColor, fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => !isCurrent && startCheckout(plan.id)}
                    disabled={isCurrent || isLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '7px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isCurrent ? 'default' : isLoading ? 'wait' : 'pointer',
                      background: isCurrent ? plan.color : '#191919',
                      color: isCurrent ? plan.textColor : 'white',
                      opacity: isLoading ? 0.7 : 1,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {isLoading ? 'Redirecting...' : isCurrent ? 'Current plan' : hasPaidPlan ? 'Switch plan' : 'Start now'}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Footer note */}
          <p style={{ fontSize: '12px', color: '#9b9b98', textAlign: 'center', marginTop: '24px' }}>
            All plans billed monthly. Cancel anytime. Prices in GBP (£) excluding VAT.
          </p>
        </div>
      </main>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingContent />
    </Suspense>
  )
}
