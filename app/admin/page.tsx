import Link from 'next/link'
import { getSupabaseAdmin } from '../lib/supabase-admin'
import { theme } from './_lib/theme'

export const dynamic = 'force-dynamic'

async function getCounts() {
  const admin = getSupabaseAdmin()
  const [partners, affiliates, demos, apiKeys, enterprise] = await Promise.all([
    admin.from('partner_applications').select('id,status', { count: 'exact', head: false }),
    admin.from('affiliate_applications').select('id,status', { count: 'exact', head: false }),
    admin.from('demo_requests').select('id,status', { count: 'exact', head: false }),
    admin.from('api_keys').select('id,active', { count: 'exact', head: false }),
    admin.from('enterprise_quotes').select('id,status', { count: 'exact', head: false }),
  ])

  const openCount = (rows: { status: string | null }[] | null) =>
    (rows ?? []).filter(r => r.status === 'new' || r.status === 'reviewing').length

  return {
    partners:   { total: partners.count   ?? 0, open: openCount(partners.data as any) },
    affiliates: { total: affiliates.count ?? 0, open: openCount(affiliates.data as any) },
    demos:      { total: demos.count      ?? 0, open: (demos.data ?? []).filter((r: any) => r.status === 'new' || r.status === 'scheduled').length },
    apiKeys:    { total: apiKeys.count    ?? 0, active: (apiKeys.data ?? []).filter((r: any) => r.active).length },
    enterprise: { total: enterprise.count ?? 0, open: openCount(enterprise.data as any) },
  }
}

type Tile = { href: string; label: string; sub: string; metric: string }

export default async function AdminHome() {
  let counts: Awaited<ReturnType<typeof getCounts>> | null = null
  let err: string | null = null
  try {
    counts = await getCounts()
  } catch (e) {
    err = (e as Error).message
    console.error('[admin:home] counts failed', err)
  }

  const tiles: Tile[] = counts
    ? [
        { href: '/admin/partners',    label: 'Partners',    sub: `${counts.partners.open} open`,    metric: String(counts.partners.total) },
        { href: '/admin/affiliates',  label: 'Affiliates',  sub: `${counts.affiliates.open} open`,  metric: String(counts.affiliates.total) },
        { href: '/admin/demos',       label: 'Demos',       sub: `${counts.demos.open} open`,       metric: String(counts.demos.total) },
        { href: '/admin/enterprise',  label: 'Enterprise',  sub: `${counts.enterprise.open} open`,  metric: String(counts.enterprise.total) },
        { href: '/admin/api-keys',    label: 'API keys',    sub: `${counts.apiKeys.active} active`, metric: String(counts.apiKeys.total) },
        { href: '/admin/sync-health', label: 'Sync health', sub: 'live status',                     metric: '→' },
        { href: '/api/admin/sync-health', label: 'Sync health (JSON)', sub: 'raw endpoint',         metric: '{ }' },
      ]
    : []

  return (
    <div style={{ padding: '56px 56px 80px', maxWidth: 1120 }}>
      <div style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontFamily: theme.serif,
            fontSize: 56,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
            color: theme.ink,
          }}
        >
          Admin
        </h1>
        <p style={{ fontSize: 15, color: theme.inkSoft, marginTop: 8 }}>
          Operational control — applications, keys, sync health.
        </p>
      </div>

      {err && (
        <div
          style={{
            padding: 16,
            border: `1px solid ${theme.inkFaint}`,
            background: '#fff',
            borderRadius: 8,
            fontSize: 13,
            color: theme.danger,
          }}
        >
          Couldn’t load counts: {err}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {tiles.map(t => (
          <Link
            key={t.href}
            href={t.href}
            style={{
              textDecoration: 'none',
              padding: '22px 22px 20px',
              background: '#fff',
              border: `1px solid ${theme.inkFaint}`,
              borderRadius: 10,
              color: theme.ink,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 128,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: theme.inkMuted,
                fontWeight: 600,
              }}
            >
              {t.label}
            </div>
            <div
              style={{
                fontFamily: theme.serif,
                fontSize: 44,
                fontWeight: 400,
                letterSpacing: '-0.02em',
                color: theme.cobalt,
                lineHeight: 1,
                marginTop: 12,
              }}
            >
              {t.metric}
            </div>
            <div style={{ fontSize: 12.5, color: theme.inkSoft, marginTop: 10 }}>{t.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
