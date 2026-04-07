'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase-client'

const PLAN_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  starter:    { bg: '#f1f1ef', text: '#787774', label: 'Starter' },
  growth:     { bg: '#e8f1fb', text: '#2383e2', label: 'Growth' },
  scale:      { bg: '#e8f5f3', text: '#0f7b6c', label: 'Scale' },
  enterprise: { bg: '#fdf3e8', text: '#d9730d', label: 'Enterprise' },
  free:       { bg: '#f1f1ef', text: '#787774', label: 'Free' },
}

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
      } catch {
        // silently ignore — errors endpoint may not exist yet
      }
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
        { href: '/dashboard',  icon: '⚡', label: 'Command Centre' },
        { href: '/listings',   icon: '🏷️', label: 'Listings' },
        { href: '/orders',     icon: '📋', label: 'Orders' },
        { href: '/channels',   icon: '🔗', label: 'Channels' },
        { href: '/errors',     icon: '⚠️', label: 'Errors', badge: errorCount },
        { href: '/inventory',  icon: '📦', label: 'Inventory' },
        { href: '/rules',      icon: '⚙️', label: 'Feed Rules' },
      ],
    },
    {
      label: 'AI',
      items: [
        { href: '/agent', icon: '🤖', label: 'AI Agent', badge: pendingCount },
      ],
    },
    {
      label: 'Account',
      items: [
        { href: '/settings', icon: '⚙️', label: 'Settings' },
        { href: '/billing',  icon: '💳', label: 'Billing' },
      ],
    },
  ]

  return (
    <aside style={{
      width: '220px',
      background: 'white',
      borderRight: '1px solid #e8e8e5',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #e8e8e5', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', background: '#191919', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 700 }}>A</div>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#191919' }}>Auxio</span>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '8px', flex: 1, overflowY: 'auto' }}>
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#9b9b98', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 8px 4px' }}>
                {group.label}
              </div>
            )}
            {group.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 8px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  color: isActive(item.href) ? '#191919' : '#787774',
                  background: isActive(item.href) ? '#f1f1ef' : 'transparent',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '1px',
                }}
              >
                <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {(item as any).badge > 0 && (
                  <span style={{ background: '#c9372c', color: 'white', fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '8px' }}>
                    {(item as any).badge}
                  </span>
                )}
              </Link>
            ))}
            {gi < navGroups.length - 1 && (
              <div style={{ height: '1px', background: '#e8e8e5', margin: '6px 8px' }} />
            )}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px', borderTop: '1px solid #e8e8e5' }}>
        <div style={{ padding: '4px 8px', marginBottom: '6px' }}>
          <span style={{ background: planStyle.bg, color: planStyle.text, fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
            {planStyle.label} Plan
          </span>
        </div>
        <div
          onClick={signOut}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '5px', cursor: 'pointer' }}
        >
          <div style={{ width: '26px', height: '26px', background: '#2383e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#191919', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email?.split('@')[0] || 'User'}
            </div>
            <div style={{ fontSize: '11px', color: '#9b9b98' }}>Sign out</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
