'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase-client'

/* ─────────────────────────────────────────
   SVG ICON SET  (15 × 15, stroke-based)
───────────────────────────────────────── */
const Icon = {
  dashboard: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1.25"/>
      <rect x="8.5" y="1.5" width="5" height="5" rx="1.25"/>
      <rect x="1.5" y="8.5" width="5" height="5" rx="1.25"/>
      <rect x="8.5" y="8.5" width="5" height="5" rx="1.25"/>
    </svg>
  ),
  products: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 1L13 4v7L7.5 14 2 11V4L7.5 1Z"/>
      <path d="M7.5 14V7.5"/>
      <path d="M13 4L7.5 7.5 2 4"/>
      <path d="M2 8.5l2.5 1.5M13 8.5l-2.5 1.5"/>
    </svg>
  ),
  returns: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-2"/>
      <path d="M5 1.5h5v3H5V1.5Z"/>
      <path d="M6 8.5l-2 2 2 2"/>
      <path d="M4 10.5h5"/>
    </svg>
  ),
  shipping: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4h9v7H1V4Z"/>
      <path d="M10 6h2.5L14 8.5V11h-4V6Z"/>
      <circle cx="3.5" cy="11.5" r="1.25"/>
      <circle cx="11.5" cy="11.5" r="1.25"/>
    </svg>
  ),
  repricing: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 1.5h5L13 8l-4.5 4.5L2 7V1.5Z"/>
      <circle cx="5" cy="5" r="1"/>
      <path d="M9.5 11l3 2.5"/>
    </svg>
  ),
  analytics: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 13.5V9h2.75v4.5H1.5ZM6.375 13.5V5.5h2.75v8h-2.75ZM11.25 13.5V2h2.75v11.5h-2.75Z"/>
    </svg>
  ),
  buffers: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 1.5L13 4v4c0 3.5-2.5 5.5-5.5 6C4.5 13.5 2 11.5 2 8V4L7.5 1.5Z"/>
      <path d="M5 7.5l2 2 3.5-3"/>
    </svg>
  ),
  listings: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4.5h11M2 7.5h11M2 10.5h6.5"/>
    </svg>
  ),
  orders: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/>
      <path d="M5 5.5h5M5 7.5h5M5 9.5h3"/>
    </svg>
  ),
  channels: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="2" r="1.25"/>
      <circle cx="2" cy="12" r="1.25"/>
      <circle cx="13" cy="12" r="1.25"/>
      <path d="M7.5 3.25v3M6.5 6.5L3 10.8M8.5 6.5L12 10.8"/>
      <path d="M3.25 12h8.5"/>
    </svg>
  ),
  errors: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 1.5L13.5 12H1.5L7.5 1.5Z"/>
      <path d="M7.5 6v3"/>
      <circle cx="7.5" cy="10.5" r="0.6" fill="currentColor" stroke="none"/>
    </svg>
  ),
  inventory: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 1.5L13 4.5v6L7.5 13.5 2 10.5v-6L7.5 1.5Z"/>
      <path d="M7.5 13.5V7.5"/>
      <path d="M13 4.5L7.5 7.5 2 4.5"/>
    </svg>
  ),
  rules: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3.5h11"/>
      <path d="M2 7.5h11"/>
      <path d="M2 11.5h11"/>
      <circle cx="5" cy="3.5" r="1.5" fill="var(--sidebar-bg)" stroke="currentColor"/>
      <circle cx="10" cy="7.5" r="1.5" fill="var(--sidebar-bg)" stroke="currentColor"/>
      <circle cx="6" cy="11.5" r="1.5" fill="var(--sidebar-bg)" stroke="currentColor"/>
    </svg>
  ),
  agent: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 1.5L9 5h3.5L9.5 7.5l1 4L7.5 9.5l-3 2 1-4L2.5 5H6L7.5 1.5Z"/>
    </svg>
  ),
  socialIntel: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="5" r="2.5"/>
      <circle cx="11" cy="4" r="1.5"/>
      <circle cx="10" cy="10.5" r="2"/>
      <path d="M7.5 5h2M6.5 7l2.5 2"/>
    </svg>
  ),
  settings: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="7.5" r="2"/>
      <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3 3l1 1M11 11l1 1M3 12l1-1M11 4l1-1"/>
    </svg>
  ),
  billing: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="3.5" width="12" height="8" rx="1.25"/>
      <path d="M1.5 6.5h12"/>
      <circle cx="4.5" cy="9.5" r="0.75" fill="currentColor" stroke="none"/>
      <path d="M7.5 9.5h3"/>
    </svg>
  ),
  costs: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="7.5" r="5.5"/>
      <path d="M7.5 4.5v1M7.5 9.5v1M5.5 6.5a1.5 1.5 0 0 1 2-1.4 1.5 1.5 0 0 1 0 2.8A1.5 1.5 0 0 0 7.5 9.5"/>
    </svg>
  ),
} as const

/* ─────────────────────────────────────────
   PLAN BADGES
───────────────────────────────────────── */
const PLAN_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  starter:    { bg: 'rgba(255,255,255,0.07)', text: '#7a7d96', label: 'Starter' },
  growth:     { bg: 'rgba(91,82,245,0.2)',    text: '#a89ef8', label: 'Growth' },
  scale:      { bg: 'rgba(5,150,105,0.2)',    text: '#6ee7b7', label: 'Scale' },
  enterprise: { bg: 'rgba(217,119,6,0.2)',    text: '#fcd34d', label: 'Enterprise' },
  free:       { bg: 'rgba(255,255,255,0.07)', text: '#7a7d96', label: 'Free' },
}

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export default function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [plan, setPlan] = useState('growth')
  const [pendingCount, setPendingCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      const [userRow, pendingRow] = await Promise.all([
        supabase.from('users').select('plan').eq('id', user.id).single(),
        supabase.from('agent_pending_actions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending'),
      ])

      if (userRow.data?.plan) setPlan(userRow.data.plan)
      setPendingCount(pendingRow.count || 0)

      try {
        const errRes = await fetch('/api/errors')
        if (errRes.ok) {
          const errJson = await errRes.json()
          setErrorCount(errJson.total || 0)
        }
      } catch { /* silent */ }
    }
    load()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname?.startsWith(href + '/'))

  const planStyle = PLAN_STYLE[plan] || PLAN_STYLE.growth

  const navGroups = [
    {
      items: [
        { href: '/dashboard', icon: Icon.dashboard, label: 'Command Centre' },
        { href: '/listings',  icon: Icon.listings,  label: 'Listings' },
        { href: '/products',  icon: Icon.products,  label: 'Products' },
        { href: '/orders',    icon: Icon.orders,    label: 'Orders' },
        { href: '/returns',   icon: Icon.returns,   label: 'Returns' },
        { href: '/shipping',  icon: Icon.shipping,  label: 'Shipping' },
        { href: '/channels',  icon: Icon.channels,  label: 'Channels' },
        { href: '/errors',    icon: Icon.errors,    label: 'Errors',     badge: errorCount,   badgeColor: '#ef4444' },
        { href: '/inventory', icon: Icon.inventory, label: 'Inventory' },
        { href: '/inventory/buffers', icon: Icon.buffers, label: 'Buffers' },
        { href: '/costs',     icon: Icon.costs,     label: 'Costs & Margins' },
      ],
    },
    {
      label: 'Procurement',
      items: [
        { href: '/suppliers',       icon: Icon.shipping,   label: 'Suppliers' },
        { href: '/purchase-orders', icon: Icon.orders,     label: 'Purchase Orders' },
        { href: '/forecasting',     icon: Icon.analytics,  label: 'Forecasting' },
        { href: '/bundles',         icon: Icon.products,   label: 'Bundles & Kitting' },
      ],
    },
    {
      label: 'Growth',
      items: [
        { href: '/advertising', icon: Icon.repricing, label: 'Advertising & PPC' },
        { href: '/analytics',   icon: Icon.analytics, label: 'Analytics' },
        { href: '/financials',  icon: Icon.billing,   label: 'Financials' },
      ],
    },
    {
      label: 'Automation',
      items: [
        { href: '/rules',         icon: Icon.rules,     label: 'Feed Rules' },
        { href: '/lookup-tables', icon: Icon.costs,     label: 'Lookup Tables' },
        { href: '/repricing',     icon: Icon.repricing, label: 'Repricing' },
      ],
    },
    {
      label: 'AI',
      items: [
        { href: '/agent',        icon: Icon.agent,       label: 'AI Agent',   badge: pendingCount, badgeColor: '#f59e0b' },
        { href: '/social-intel', icon: Icon.socialIntel, label: 'Social Intel' },
      ],
    },
    {
      label: 'Platform',
      items: [
        { href: '/developer', icon: Icon.channels, label: 'Developer & API' },
        { href: '/settings',  icon: Icon.settings, label: 'Settings' },
        { href: '/billing',   icon: Icon.billing,  label: 'Billing' },
      ],
    },
  ]

  const initials = user?.email?.[0]?.toUpperCase() || 'U'
  const username = user?.email?.split('@')[0] || 'User'

  return (
    <aside style={{
      width: '220px',
      background: '#0f1117',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      fontFamily: 'inherit',
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: '20px 16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: '28px', height: '28px',
          background: 'linear-gradient(135deg, #5b52f5 0%, #7c6af7 100%)',
          borderRadius: '7px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '13px', fontWeight: 700,
          letterSpacing: '-0.02em',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(91,82,245,0.4)',
        }}>A</div>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f8', letterSpacing: '-0.01em' }}>
          Fulcra
        </span>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ padding: '10px 8px', flex: 1, overflowY: 'auto' }}>
        {navGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: gi < navGroups.length - 1 ? '4px' : 0 }}>

            {group.label && (
              <div style={{
                fontSize: '10px', fontWeight: 600,
                color: 'rgba(255,255,255,0.2)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '10px 8px 4px',
              }}>
                {group.label}
              </div>
            )}

            {group.items.map(item => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '7px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: active ? '#f0f0f8' : 'rgba(255,255,255,0.45)',
                    background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                    fontSize: '13px',
                    fontWeight: active ? 500 : 400,
                    marginBottom: '1px',
                    transition: 'color 0.15s, background 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.45)'
                  }}
                >
                  {/* Active indicator */}
                  {active && (
                    <div style={{
                      position: 'absolute',
                      left: 0, top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px', height: '16px',
                      background: 'linear-gradient(180deg, #5b52f5, #7c6af7)',
                      borderRadius: '0 2px 2px 0',
                    }}/>
                  )}

                  <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                  </span>

                  <span style={{ flex: 1, lineHeight: 1 }}>{item.label}</span>

                  {(item as any).badge > 0 && (
                    <span style={{
                      background: (item as any).badgeColor || '#ef4444',
                      color: 'white',
                      fontSize: '10px', fontWeight: 600,
                      padding: '1px 5px',
                      borderRadius: '10px',
                      lineHeight: '16px',
                      minWidth: '18px',
                      textAlign: 'center',
                    }}>
                      {(item as any).badge}
                    </span>
                  )}
                </Link>
              )
            })}

            {gi < navGroups.length - 1 && (
              <div style={{
                height: '1px',
                background: 'rgba(255,255,255,0.06)',
                margin: '8px 4px',
              }}/>
            )}
          </div>
        ))}
      </nav>

      {/* ── User footer ── */}
      <div style={{
        padding: '10px 8px 12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Plan badge */}
        <div style={{ padding: '0 4px 8px' }}>
          <span style={{
            background: planStyle.bg,
            color: planStyle.text,
            fontSize: '10px', fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '4px',
            letterSpacing: '0.02em',
          }}>
            {planStyle.label}
          </span>
        </div>

        {/* User row */}
        <div
          onClick={signOut}
          style={{
            display: 'flex', alignItems: 'center', gap: '9px',
            padding: '7px 8px', borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
        >
          <div style={{
            width: '26px', height: '26px',
            background: 'linear-gradient(135deg, #5b52f5, #7c6af7)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '11px', fontWeight: 600,
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: '12px', fontWeight: 500,
              color: 'rgba(255,255,255,0.75)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {username}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
              Sign out
            </div>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6H2M10 4l2 2-2 2M7 2H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h4"/>
          </svg>
        </div>
      </div>
    </aside>
  )
}
