import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase-server'
import { isAdminEmail } from '../lib/supabase-admin'
import Link from 'next/link'

export const metadata = { title: 'Admin — Auxio' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect('/dashboard')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#0f0f17', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            Auxio
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Super Admin
          </div>
        </div>

        {[
          { href: '/admin',         label: 'Overview', icon: '◈' },
          { href: '/admin/users',   label: 'Users',    icon: '◉' },
          { href: '/admin/metrics', label: 'Metrics',  icon: '▲' },
        ].map(({ href, label, icon }) => (
          <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 20px', textDecoration: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 500, transition: 'color 0.15s' }}>
            <span style={{ fontSize: 14, opacity: 0.6 }}>{icon}</span>
            {label}
          </Link>
        ))}

        <div style={{ marginTop: 'auto', padding: '20px 20px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/dashboard" style={{ display: 'block', textDecoration: 'none', fontSize: 12, color: 'rgba(255,255,255,0.25)', padding: '8px 0' }}>
            ← Back to app
          </Link>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 8 }}>
            {user.email}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
