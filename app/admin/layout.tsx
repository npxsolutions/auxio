import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase-server'
import { isAdminEmail } from '../lib/supabase-admin'
import { isOwner } from './_lib/owner'
import { theme } from './_lib/theme'
import Link from 'next/link'

export const metadata = { title: 'Admin — Meridia' }
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Must be signed in at all.
  if (!user) redirect('/login?next=/admin')

  // Defense in depth — layout gate. Owner allowlist (ADMIN_OWNER_EMAILS /
  // ADMIN_OWNER_ID) is primary; legacy ADMIN_EMAILS is honoured as a fallback.
  const allowed = isOwner(user.email, user.id) || isAdminEmail(user.email)
  if (!allowed) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: theme.cream,
          fontFamily: theme.sans,
          color: theme.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <h1 style={{ fontFamily: theme.serif, fontSize: 56, fontWeight: 400, letterSpacing: '-0.02em', margin: 0 }}>
            403
          </h1>
          <p style={{ fontSize: 16, marginTop: 12, color: theme.inkSoft }}>
            You are not an admin.
          </p>
          <p style={{ fontSize: 13, marginTop: 6, color: theme.inkMuted }}>
            Signed in as <code>{user.email}</code>
          </p>
          <form action="/auth/signout" method="post" style={{ marginTop: 24 }}>
            <button
              type="submit"
              style={{
                background: theme.ink,
                color: theme.cream,
                border: 'none',
                padding: '10px 18px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: theme.sans,
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: '/admin',             label: 'Overview' },
    { href: '/admin/partners',    label: 'Partners' },
    { href: '/admin/affiliates',  label: 'Affiliates' },
    { href: '/admin/demos',       label: 'Demos' },
    { href: '/admin/api-keys',    label: 'API keys' },
    { href: '/admin/sync-health', label: 'Sync health' },
    { href: '/admin/users',       label: 'Users' },
    { href: '/admin/metrics',     label: 'Metrics' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: theme.cream,
        color: theme.ink,
        fontFamily: theme.sans,
      }}
    >
      <aside
        style={{
          width: 240,
          background: theme.creamSoft,
          borderRight: `1px solid ${theme.inkFaint}`,
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 0',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 22px 24px', borderBottom: `1px solid ${theme.inkFaint}`, marginBottom: 10 }}>
          <div
            style={{
              fontFamily: theme.serif,
              fontSize: 26,
              fontWeight: 400,
              letterSpacing: '-0.01em',
              color: theme.ink,
            }}
          >
            Meridia
          </div>
          <div style={{ fontSize: 10, color: theme.inkMuted, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>
            Admin
          </div>
        </div>

        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: 'block',
              padding: '9px 22px',
              textDecoration: 'none',
              color: theme.inkSoft,
              fontSize: 13.5,
              fontWeight: 500,
            }}
          >
            {label}
          </Link>
        ))}

        <div style={{ marginTop: 'auto', padding: '18px 22px 0', borderTop: `1px solid ${theme.inkFaint}` }}>
          <Link
            href="/dashboard"
            style={{ display: 'block', textDecoration: 'none', fontSize: 12, color: theme.inkMuted, padding: '6px 0' }}
          >
            ← Back to app
          </Link>
          <div style={{ fontSize: 11, color: theme.inkMuted, marginTop: 6, wordBreak: 'break-all' }}>{user.email}</div>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  )
}
