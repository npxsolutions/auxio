import Link from 'next/link'
import { getSupabaseAdmin } from '../../lib/supabase-admin'
import { ListShell, StatusPill } from '../_components/ListShell'
import { theme } from '../_lib/theme'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  user_id: string
  name: string
  key_prefix: string
  scopes: string[] | null
  active: boolean | null
  last_used_at: string | null
  created_at: string | null
}

export default async function ApiKeysList({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { status, q } = await searchParams
  const admin = getSupabaseAdmin()

  let query = admin
    .from('api_keys')
    .select('id,user_id,name,key_prefix,scopes,active,last_used_at,created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (status === 'active')  query = query.eq('active', true)
  if (status === 'revoked') query = query.eq('active', false)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data, error } = await query
  if (error) console.error('[admin:api-keys] list failed', error.message)
  const rows = (data ?? []) as Row[]

  return (
    <ListShell<Row>
      title="API keys"
      entityPath="/admin/api-keys"
      statuses={['active', 'revoked'] as const}
      currentStatus={status ?? null}
      search={q ?? ''}
      rows={rows}
      totalCount={rows.length}
      columns={[
        { header: 'Name',      render: r => <Link href={`/admin/api-keys/${r.id}`} style={{ color: theme.cobalt, textDecoration: 'none', fontWeight: 500 }}>{r.name}</Link> },
        { header: 'Prefix',    render: r => <code style={{ fontSize: 12 }}>{r.key_prefix}…</code> },
        { header: 'User',      render: r => <code style={{ fontSize: 11, color: theme.inkMuted }}>{r.user_id.slice(0, 8)}…</code> },
        { header: 'Scopes',    render: r => (r.scopes ?? []).join(', ') || '—' },
        { header: 'State',     render: r => <StatusPill value={r.active ? 'active' : 'revoked'} /> },
        { header: 'Last used', render: r => r.last_used_at ? new Date(r.last_used_at).toLocaleDateString('en-GB') : '—' },
        { header: 'Created',   render: r => r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : '—', width: 110 },
      ]}
    />
  )
}
