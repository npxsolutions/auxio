'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../lib/supabase-client'
import AppSidebar from '../components/AppSidebar'
import { CancelSurveyModal } from '../components/CancelSurveyModal'
import { AnnualUpsell } from '../components/AnnualUpsell'
import { LifetimeOffer } from '../components/LifetimeOffer'
import { UsageCard } from '../components/UsageCard'
import { Suspense } from 'react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 79.99,
    description: 'For solo sellers just getting started',
    features: ['Up to 500 orders/mo', 'Margin & velocity intelligence', 'AI insights (daily)', 'eBay + 1 other channel', 'Email support'],
    dark: false,
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 199,
    description: 'For scaling sellers who want the edge',
    features: ['Up to 5,000 orders/mo', 'Everything in Starter', 'AI Agent (copilot mode)', 'PPC intelligence & bid optimisation', 'All channels', 'Priority support'],
    dark: true,
    popular: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 599,
    description: 'For serious operations building a brand',
    features: ['Unlimited orders', 'Everything in Growth', 'AI Agent (autopilot mode)', 'Network benchmark data', 'Custom margin targets', 'Dedicated account manager'],
    dark: false,
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 1500,
    description: 'For high-volume operations & agencies',
    features: ['Everything in Scale', 'Multi-account dashboard', 'Custom AI model training', 'API access', 'SLA guarantee', 'Onboarding & setup service'],
    dark: false,
    popular: false,
  },
]

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser]                   = useState<any>(null)
  const [currentPlan, setCurrentPlan]     = useState<string>('free')
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('')
  const [loading, setLoading]             = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [unappliedCents, setUnappliedCents] = useState<number>(0)
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

    // Read billing state from /api/org/list which returns the active org.
    try {
      const res = await fetch('/api/org/list')
      if (res.ok) {
        const json = await res.json()
        const billing = json.billing as null | { plan: string | null; subscription_status: string | null }
        setCurrentPlan(billing?.plan || 'free')
        setSubscriptionStatus(billing?.subscription_status || '')
      }
    } catch { /* silent */ }

    // Load unapplied credits total.
    const { data: credits } = await supabase
      .from('user_credits')
      .select('amount_cents')
      .eq('user_id', user.id)
      .eq('applied', false)
    const total = (credits || []).reduce((s: number, c: any) => s + (c.amount_cents || 0), 0)
    setUnappliedCents(total)

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8f4ec' }}>
      <div style={{ fontSize: 14, color: '#6b6e87', fontFamily: 'inherit' }}>Loading...</div>
    </div>
  )

  const hasPaidPlan = currentPlan && currentPlan !== 'free'

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', minHeight: '100vh', background: '#f8f4ec', WebkitFontSmoothing: 'antialiased' }}>
      <AppSidebar />
      <CancelSurveyModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={() => { setCancelModalOpen(false); openPortal() }}
      />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: 'white', color: '#1a1b22',
          border: '1px solid #e8e5df',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
          borderRadius: 10, padding: '14px 18px',
          fontSize: 13, fontWeight: 500, zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 10,
          borderLeft: `3px solid ${toast.type === 'success' ? '#059669' : '#dc2626'}`,
          fontFamily: 'inherit',
        }}>
          <span style={{ color: toast.type === 'success' ? '#059669' : '#dc2626' }}>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.msg}
        </div>
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 40px' }}>
        <div style={{ maxWidth: '960px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1b22', letterSpacing: '-0.03em', margin: 0 }}>Billing & Plans</h1>
              <p style={{ fontSize: 14, color: '#6b6e87', margin: '4px 0 0' }}>
                {hasPaidPlan
                  ? `You're on the ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan${subscriptionStatus === 'past_due' ? ' — payment overdue' : ''}`
                  : 'Choose a plan to unlock your intelligence engine'}
              </p>
            </div>
          </div>

          {/* Usage, annual upsell, lifetime offer — render only for authenticated users on paid plans */}
          {hasPaidPlan && <UsageCard />}
          {hasPaidPlan && <AnnualUpsell />}
          {hasPaidPlan && <LifetimeOffer />}

          {/* Credits banner */}
          {unappliedCents > 0 && (
            <div style={{
              background: 'white',
              border: '1px solid #e8e5df',
              borderLeft: '3px solid #e8863f',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              color: '#2c3142',
            }}>
              <div>
                <strong style={{ color: '#0b0f1a' }}>${(unappliedCents / 100).toFixed(0)} in credits available.</strong>
                <span style={{ marginLeft: 6, color: '#5a6171' }}>Credits apply to your next invoice.</span>
              </div>
              <a href="/settings/referral" style={{ fontSize: 12, color: '#e8863f', textDecoration: 'none', fontWeight: 600 }}>Refer more →</a>
            </div>
          )}

          {/* Manage billing card for paid plans */}
          {hasPaidPlan && (
            <div style={{
              background: 'white',
              border: '1px solid #e8e5df',
              borderLeft: '3px solid #e8863f',
              borderRadius: 12,
              padding: '20px 24px',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1b22', marginBottom: 4 }}>Current subscription</div>
                <div style={{ fontSize: 13, color: '#6b6e87' }}>
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
                  {subscriptionStatus && ` · ${subscriptionStatus}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  style={{
                    background: '#e8863f', color: 'white',
                    border: 'none', borderRadius: 8,
                    padding: '10px 18px',
                    fontSize: 13, fontWeight: 600,
                    cursor: portalLoading ? 'wait' : 'pointer',
                    opacity: portalLoading ? 0.7 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {portalLoading ? 'Opening…' : 'Manage billing →'}
                </button>
                <button
                  onClick={() => setCancelModalOpen(true)}
                  style={{
                    background: 'transparent', color: '#6b6e87',
                    border: '1px solid #e8e5df', borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 13, fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Cancel subscription
                </button>
              </div>
            </div>
          )}

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {PLANS.map(plan => {
              const isCurrent = currentPlan === plan.id
              const isLoading = checkoutLoading === plan.id
              const isDark = plan.dark && !isCurrent

              return (
                <div
                  key={plan.id}
                  style={{
                    background: isDark ? '#0f1117' : 'white',
                    border: isCurrent
                      ? '2px solid #e8863f'
                      : isDark
                        ? '1px solid #1e2130'
                        : '1px solid #e8e5df',
                    borderRadius: 12,
                    padding: '24px 20px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isCurrent
                      ? '0 0 0 4px rgba(232,134,63,$1)'
                      : isDark
                        ? '0 4px 16px rgba(0,0,0,0.2)'
                        : '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Badge: Current or Most Popular */}
                  {isCurrent && (
                    <div style={{
                      position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                      background: '#e8863f', color: 'white',
                      fontSize: 10, fontWeight: 700,
                      padding: '3px 12px', borderRadius: 100,
                      whiteSpace: 'nowrap', letterSpacing: '0.04em',
                    }}>
                      CURRENT PLAN
                    </div>
                  )}
                  {plan.popular && !isCurrent && (
                    <div style={{
                      position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #e8863f 0%, #7c75f7 100%)', color: 'white',
                      fontSize: 10, fontWeight: 700,
                      padding: '3px 12px', borderRadius: 100,
                      whiteSpace: 'nowrap', letterSpacing: '0.04em',
                    }}>
                      MOST POPULAR
                    </div>
                  )}

                  {/* Plan name badge */}
                  <div style={{ marginBottom: 16 }}>
                    <span style={{
                      background: isDark ? 'rgba(232,134,63,$1)' : isCurrent ? 'rgba(232,134,63,$1)' : '#f8f4ec',
                      color: isDark ? '#a5a0fb' : isCurrent ? '#e8863f' : '#6b6e87',
                      fontSize: 11, fontWeight: 700,
                      padding: '3px 9px', borderRadius: 6,
                      letterSpacing: '0.04em',
                    }}>
                      {plan.name}
                    </span>
                  </div>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 36, fontWeight: 800,
                      color: isDark ? 'white' : '#1a1b22',
                      letterSpacing: '-0.03em',
                      fontFamily: 'var(--font-mono), ui-monospace, monospace',
                    }}>
                      £{plan.price}
                    </span>
                    <span style={{ fontSize: 13, color: isDark ? '#6b7280' : '#9496b0' }}>/mo</span>
                  </div>

                  <p style={{
                    fontSize: 12,
                    color: isDark ? '#9ca3af' : '#6b6e87',
                    marginBottom: 20, lineHeight: 1.5,
                  }}>
                    {plan.description}
                  </p>

                  {/* Feature list */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: isDark ? '#d1d5db' : '#1a1b22', marginBottom: 8, lineHeight: 1.4 }}>
                        <span style={{ color: isDark ? '#a5a0fb' : '#059669', fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA button */}
                  <button
                    onClick={() => !isCurrent && startCheckout(plan.id)}
                    disabled={isCurrent || isLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 8,
                      border: isCurrent ? '2px solid #e8863f' : 'none',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: isCurrent ? 'default' : isLoading ? 'wait' : 'pointer',
                      background: isCurrent
                        ? 'transparent'
                        : isDark
                          ? '#e8863f'
                          : '#e8863f',
                      color: isCurrent ? '#e8863f' : 'white',
                      opacity: isLoading ? 0.7 : 1,
                      fontFamily: 'inherit',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {isLoading ? 'Redirecting…' : isCurrent ? 'Current plan' : hasPaidPlan ? 'Switch plan' : 'Start now'}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Footer note */}
          <p style={{ fontSize: 12, color: '#9496b0', textAlign: 'center', marginTop: 24 }}>
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
