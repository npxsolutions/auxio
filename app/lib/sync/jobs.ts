import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy admin client — module-level instantiation breaks Next build per repo rule.
const getAdmin = (): SupabaseClient =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

export interface EnqueueOptions {
  userId: string
  jobType: string
  channelType?: string
  payload?: Record<string, unknown>
  scheduledFor?: Date
  priority?: number
}

export async function enqueueJob(opts: EnqueueOptions): Promise<string | null> {
  const supabase = getAdmin()
  const { data, error } = await supabase
    .from('sync_jobs')
    .insert({
      user_id: opts.userId,
      job_type: opts.jobType,
      channel_type: opts.channelType ?? null,
      status: 'queued',
      payload: opts.payload ?? null,
      priority: opts.priority ?? 100,
      scheduled_for: (opts.scheduledFor ?? new Date()).toISOString(),
    })
    .select('id')
    .single()
  if (error) {
    console.error('[sync:jobs] enqueue failed:', error)
    return null
  }
  return data?.id ?? null
}

export async function markStarted(id: string): Promise<void> {
  const supabase = getAdmin()
  const { error } = await supabase
    .from('sync_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', id)
  if (error) console.error('[sync:jobs] markStarted:', error)
}

export async function markCompleted(id: string, rowsProcessed: number): Promise<void> {
  const supabase = getAdmin()
  const { error } = await supabase
    .from('sync_jobs')
    .update({
      status: 'completed',
      rows_processed: rowsProcessed,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) console.error('[sync:jobs] markCompleted:', error)
}

export async function markFailed(id: string, errorMessage: string): Promise<void> {
  const supabase = getAdmin()
  // Increment attempts and record error; do not move to failed until attempts >= 5.
  const { data: existing } = await supabase
    .from('sync_jobs')
    .select('attempts')
    .eq('id', id)
    .maybeSingle()
  const attempts = (existing?.attempts ?? 0) + 1
  const terminal = attempts >= 5
  const backoffMinutes = Math.min(60, Math.pow(2, attempts))
  const { error } = await supabase
    .from('sync_jobs')
    .update({
      status: terminal ? 'failed' : 'queued',
      attempts,
      error_message: errorMessage.slice(0, 2000),
      backoff_until: new Date(Date.now() + backoffMinutes * 60_000).toISOString(),
      completed_at: terminal ? new Date().toISOString() : null,
    })
    .eq('id', id)
  if (error) console.error('[sync:jobs] markFailed:', error)
}

/**
 * Claim the next queued job of a given type. Uses a conditional UPDATE to
 * atomically flip status=queued → running, avoiding double-claims across
 * concurrent workers. Returns null when no job is available.
 */
export async function claimNextJob(jobType: string): Promise<
  | { id: string; userId: string; payload: Record<string, unknown> | null; channelType: string | null }
  | null
> {
  const supabase = getAdmin()
  const { data: candidate } = await supabase
    .from('sync_jobs')
    .select('id, user_id, payload, channel_type')
    .eq('job_type', jobType)
    .eq('status', 'queued')
    .lte('scheduled_for', new Date().toISOString())
    .order('priority', { ascending: true })
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!candidate) return null

  const { data: claimed, error } = await supabase
    .from('sync_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', candidate.id)
    .eq('status', 'queued') // conditional — only if still queued
    .select('id, user_id, payload, channel_type')
    .maybeSingle()
  if (error || !claimed) return null

  return {
    id: claimed.id as string,
    userId: claimed.user_id as string,
    payload: (claimed.payload as Record<string, unknown> | null) ?? null,
    channelType: (claimed.channel_type as string | null) ?? null,
  }
}

/**
 * Record a dead-letter entry after a job has exhausted its retries or a
 * channel_sync_state row has failed 5+ times. Upserts on (user, channel, job_type)
 * so repeat failures accumulate instead of creating a flood of rows.
 */
export async function recordDeadLetter(params: {
  userId: string
  channelType: string
  jobType: string
  errorMessage: string
  payload?: Record<string, unknown>
}): Promise<void> {
  const supabase = getAdmin()
  const { data: existing } = await supabase
    .from('sync_failures')
    .select('id, attempts')
    .eq('user_id', params.userId)
    .eq('channel_type', params.channelType)
    .eq('job_type', params.jobType)
    .is('resolved_at', null)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('sync_failures')
      .update({
        attempts: (existing.attempts ?? 1) + 1,
        last_failed_at: new Date().toISOString(),
        error_message: params.errorMessage.slice(0, 2000),
        payload: params.payload ?? null,
      })
      .eq('id', existing.id)
    return
  }

  await supabase.from('sync_failures').insert({
    user_id: params.userId,
    channel_type: params.channelType,
    job_type: params.jobType,
    error_message: params.errorMessage.slice(0, 2000),
    payload: params.payload ?? null,
  })
}
