import Link from 'next/link'
import { getSupabaseAdmin } from '../../lib/supabase-admin'
import { ListShell, StatusPill } from '../_components/ListShell'
import { STATUSES, theme } from '../_lib/theme'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  email: string
  name: string | null
  audience_type: string | null
  audience_size: number | null
  status: string
  country: string | null
  created_at: string
}

export default async function AffiliatesList({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { status, q } = await searchParams
  const admin = getSupabaseAdmin()

  let query = admin
    .from('affiliate_applications')
    .select('id,email,name,audience_type,audience_size,status,country,created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (status) query = query.eq('status', status)
  if (q) query = query.ilike('email', `%${q}%`)

  const { data, error } = await query
  if (error) console.error('[admin:affiliates] list failed', error.message)
  const rows = (data ?? []) as Row[]

  return (
    <ListShell<Row>
      title="Affiliates"
      entityPath="/admin/affiliates"
      statuses={STATUSES.affiliates}
      currentStatus={status ?? null}
      search={q ?? ''}
      rows={rows}
      totalCount={rows.length}
      columns={[
        { header: 'Email',    render: r => <Link href={`/admin/affiliates/${r.id}`} style={{ color: theme.cobalt, textDecoration: 'none', fontWeight: 500 }}>{r.email}</Link> },
        { header: 'Name',     render: r => r.name ?? '—' },
        { header: 'Audience', render: r => r.audience_type ?? '—' },
        { header: 'Size',     render: r => r.audience_size ?? '—' },
        { header: 'Country',  render: r => r.country ?? '—' },
        { header: 'Status',   render: r => <StatusPill value={r.status} /> },
        { header: 'Created',  render: r => new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), width: 120 },
      ]}
    />
  )
}
