import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'
import { DetailShell } from '../../_components/DetailShell'
import { STATUSES } from '../../_lib/theme'

export const dynamic = 'force-dynamic'

export default async function EnterpriseDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.from('enterprise_quotes').select('*').eq('id', id).maybeSingle()
  if (error) console.error('[admin:enterprise] detail fetch failed', error.message)
  if (!data) return notFound()

  const slackUrl = process.env.SLACK_SALES_CHANNEL_URL ?? process.env.SLACK_WORKSPACE_URL ?? null

  return (
    <DetailShell
      title={(data as any).company || (data as any).work_email}
      backHref="/admin/enterprise"
      backLabel="All enterprise quotes"
      row={data as Record<string, unknown>}
      statuses={STATUSES.enterprise}
      apiPath={`/api/admin/enterprise/${id}`}
      initialStatus={(data as any).status}
      initialNotes={(data as any).admin_notes ?? ''}
      slackChannelUrl={slackUrl}
    />
  )
}
