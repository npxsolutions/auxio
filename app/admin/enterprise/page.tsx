import Link from 'next/link'
import { getSupabaseAdmin } from '../../lib/supabase-admin'
import { ListShell, StatusPill } from '../_components/ListShell'
import { STATUSES, theme } from '../_lib/theme'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  name: string
  work_email: string
  company: string | null
  annual_gmv_band: string | null
  hq_region: string | null
  status: string
  created_at: string
}

export default async function EnterpriseList({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { status, q } = await searchParams
  const admin = getSupabaseAdmin()

  let query = admin
    .from('enterprise_quotes')
    .select('id,name,work_email,company,annual_gmv_band,hq_region,status,created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (status) query = query.eq('status', status)
  if (q) query = query.ilike('work_email', `%${q}%`)

  const { data, error } = await query
  if (error) console.error('[admin:enterprise] list failed', error.message)
  const rows = (data ?? []) as Row[]

  return (
    <ListShell<Row>
      title="Enterprise"
      entityPath="/admin/enterprise"
      statuses={STATUSES.enterprise}
      currentStatus={status ?? null}
      search={q ?? ''}
      rows={rows}
      totalCount={rows.length}
      columns={[
        { header: 'Email',   render: r => <Link href={`/admin/enterprise/${r.id}`} style={{ color: theme.cobalt, textDecoration: 'none', fontWeight: 500 }}>{r.work_email}</Link> },
        { header: 'Name',    render: r => r.name ?? '—' },
        { header: 'Company', render: r => r.company ?? '—' },
        { header: 'GMV',     render: r => r.annual_gmv_band ?? '—' },
        { header: 'Region',  render: r => r.hq_region ?? '—' },
        { header: 'Status',  render: r => <StatusPill value={r.status} /> },
        { header: 'Created', render: r => new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), width: 120 },
      ]}
    />
  )
}
