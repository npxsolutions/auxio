import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'
import { DetailShell } from '../../_components/DetailShell'

export const dynamic = 'force-dynamic'

export default async function ApiKeyDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.from('api_keys').select('*').eq('id', id).maybeSingle()
  if (error) console.error('[admin:api-keys] detail fetch failed', error.message)
  if (!data) return notFound()

  // Strip the hash from the detail view — never show secrets.
  const safe = { ...(data as Record<string, unknown>) }
  delete safe.key_hash

  return (
    <DetailShell
      title={(data as any).name}
      backHref="/admin/api-keys"
      backLabel="All API keys"
      row={safe}
      statuses={['active', 'revoked'] as const}
      apiPath={`/api/admin/api-keys/${id}`}
      initialStatus={(data as any).active ? 'active' : 'revoked'}
      hideNotes
    />
  )
}
