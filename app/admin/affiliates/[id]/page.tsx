import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'
import { DetailShell } from '../../_components/DetailShell'
import { STATUSES } from '../../_lib/theme'

export const dynamic = 'force-dynamic'

export default async function AffiliateDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.from('affiliate_applications').select('*').eq('id', id).maybeSingle()
  if (error) console.error('[admin:affiliates] detail fetch failed', error.message)
  if (!data) return notFound()

  const slackUrl = process.env.SLACK_AFFILIATES_CHANNEL_URL ?? process.env.SLACK_WORKSPACE_URL ?? null

  return (
    <DetailShell
      title={(data as any).name || (data as any).email}
      backHref="/admin/affiliates"
      backLabel="All affiliates"
      row={data as Record<string, unknown>}
      statuses={STATUSES.affiliates}
      apiPath={`/api/admin/affiliates/${id}`}
      initialStatus={(data as any).status}
      initialNotes={(data as any).admin_notes ?? ''}
      slackChannelUrl={slackUrl}
    />
  )
}
