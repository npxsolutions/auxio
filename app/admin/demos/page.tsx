import Link from 'next/link'
import { getSupabaseAdmin } from '../../lib/supabase-admin'
import { ListShell, StatusPill } from '../_components/ListShell'
import { STATUSES, theme } from '../_lib/theme'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  email: string
  name: string | null
  company: string | null
  role: string | null
  monthly_gmv: string | null
  status: string | null
  created_at: string | null
}

export default async function DemosList({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { status, q } = await searchParams
  const admin = getSupabaseAdmin()

  let query = admin
    .from('demo_requests')
    .select('id,email,name,company,role,monthly_gmv,status,created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (status) query = query.eq('status', status)
  if (q) query = query.ilike('email', `%${q}%`)

  const { data, error } = await query
  if (error) console.error('[admin:demos] list failed', error.message)
  const rows = (data ?? []) as Row[]

  return (
    <ListShell<Row>
      title="Demo requests"
      entityPath="/admin/demos"
      statuses={STATUSES.demos}
      currentStatus={status ?? null}
      search={q ?? ''}
      rows={rows}
      totalCount={rows.length}
      columns={[
        { header: 'Email',   render: r => <Link href={`/admin/demos/${r.id}`} style={{ color: theme.cobalt, textDecoration: 'none', fontWeight: 500 }}>{r.email}</Link> },
        { header: 'Name',    render: r => r.name ?? '—' },
        { header: 'Company', render: r => r.company ?? '—' },
        { header: 'Role',    render: r => r.role ?? '—' },
        { header: 'GMV',     render: r => r.monthly_gmv ?? '—' },
        { header: 'Status',  render: r => <StatusPill value={r.status} /> },
        { header: 'Created', render: r => r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—', width: 120 },
      ]}
    />
  )
}
