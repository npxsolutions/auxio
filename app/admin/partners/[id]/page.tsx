import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'
import { DetailShell } from '../../_components/DetailShell'
import { STATUSES } from '../../_lib/theme'

export const dynamic = 'force-dynamic'

export default async function PartnerDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.from('partner_applications').select('*').eq('id', id).maybeSingle()
  if (error) console.error('[admin:partners] detail fetch failed', error.message)
  if (!data) return notFound()

  const slackUrl = process.env.SLACK_PARTNERS_CHANNEL_URL ?? process.env.SLACK_WORKSPACE_URL ?? null

  return (
    <DetailShell
      title={data.company || data.email}
      backHref="/admin/partners"
      backLabel="All partners"
      row={data as Record<string, unknown>}
      statuses={STATUSES.partners}
      apiPath={`/api/admin/partners/${id}`}
      initialStatus={(data as any).status}
      initialNotes={(data as any).admin_notes ?? ''}
      slackChannelUrl={slackUrl}
    />
  )
}
