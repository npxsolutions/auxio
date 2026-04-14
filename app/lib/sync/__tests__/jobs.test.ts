import { describe, it, expect, vi, beforeEach } from 'vitest'

// Fluent mock builder — each method returns the builder; terminal methods
// (single, maybeSingle, .then via insert/update/select) return a Promise-like
// or an object we inspect in tests.
type Call = { op: string; args: unknown[] }

function createMockSupabase() {
  const calls: Call[] = []
  const responses: Record<string, unknown> = {}

  const builder: Record<string, any> = {}
  const chain = (op: string, args: unknown[] = []) => {
    calls.push({ op, args })
    return builder
  }
  builder.from = (t: string) => chain('from', [t])
  builder.insert = (v: unknown) => ({
    ...builder,
    select: (c: string) => ({
      single: async () => (responses.insertSingle ?? { data: { id: 'new-id' }, error: null }),
      maybeSingle: async () => (responses.insertSingle ?? { data: { id: 'new-id' }, error: null }),
    }),
    // bare insert awaited
    then: (res: any) => Promise.resolve(responses.insert ?? { error: null }).then(res),
  })
  builder.update = (v: unknown) => {
    calls.push({ op: 'update', args: [v] })
    const eqChain: any = {
      eq: (..._a: unknown[]) => eqChain,
      select: (_c?: string) => ({
        maybeSingle: async () => (responses.updateMaybe ?? { data: { id: 'x', user_id: 'u', payload: null, channel_type: null }, error: null }),
        single: async () => (responses.updateSingle ?? { data: null, error: null }),
      }),
      then: (res: any) => Promise.resolve(responses.update ?? { error: null }).then(res),
    }
    return eqChain
  }
  builder.select = (_c?: string) => builder
  builder.eq = (..._a: unknown[]) => builder
  builder.lte = (..._a: unknown[]) => builder
  builder.is = (..._a: unknown[]) => builder
  builder.order = (..._a: unknown[]) => builder
  builder.limit = (..._a: unknown[]) => builder
  builder.maybeSingle = async () => (responses.maybeSingle ?? { data: null, error: null })
  builder.single = async () => (responses.single ?? { data: null, error: null })

  return { builder, calls, responses }
}

const mockState = { current: createMockSupabase() }

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockState.current.builder,
}))

beforeEach(() => {
  mockState.current = createMockSupabase()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  process.env.SUPABASE_SERVICE_KEY = 'service-key'
})

describe('sync/jobs', () => {
  it('enqueueJob returns new id from inserted row', async () => {
    mockState.current.responses.insertSingle = { data: { id: 'job-42' }, error: null }
    const { enqueueJob } = await import('../jobs')
    const id = await enqueueJob({ userId: 'u1', jobType: 'sync_orders', channelType: 'shopify', payload: { foo: 1 } })
    expect(id).toBe('job-42')
    const fromCall = mockState.current.calls.find(c => c.op === 'from')
    expect(fromCall?.args[0]).toBe('sync_jobs')
  })

  it('enqueueJob returns null on error', async () => {
    mockState.current.responses.insertSingle = { data: null, error: { message: 'boom' } }
    const { enqueueJob } = await import('../jobs')
    const id = await enqueueJob({ userId: 'u1', jobType: 'sync_orders' })
    expect(id).toBeNull()
  })

  it('markCompleted updates job with completed status', async () => {
    const { markCompleted } = await import('../jobs')
    await markCompleted('job-1', 42)
    const updateCall = mockState.current.calls.find(c => c.op === 'update')
    const payload = updateCall?.args[0] as Record<string, unknown>
    expect(payload.status).toBe('completed')
    expect(payload.rows_processed).toBe(42)
    expect(typeof payload.completed_at).toBe('string')
  })

  it('markFailed retries (status=queued) when attempts < 5', async () => {
    mockState.current.responses.maybeSingle = { data: { attempts: 2 }, error: null }
    const { markFailed } = await import('../jobs')
    await markFailed('job-1', 'temporary glitch')
    const updateCall = mockState.current.calls.find(c => c.op === 'update')
    const payload = updateCall?.args[0] as Record<string, unknown>
    expect(payload.status).toBe('queued')
    expect(payload.attempts).toBe(3)
    expect(payload.error_message).toBe('temporary glitch')
  })

  it('markFailed terminates (status=failed) once attempts >= 5', async () => {
    mockState.current.responses.maybeSingle = { data: { attempts: 4 }, error: null }
    const { markFailed } = await import('../jobs')
    await markFailed('job-1', 'final')
    const updateCall = mockState.current.calls.find(c => c.op === 'update')
    const payload = updateCall?.args[0] as Record<string, unknown>
    expect(payload.status).toBe('failed')
    expect(payload.attempts).toBe(5)
    expect(payload.completed_at).toEqual(expect.any(String))
  })

  it('markFailed truncates long error messages to 2000 chars', async () => {
    mockState.current.responses.maybeSingle = { data: { attempts: 0 }, error: null }
    const { markFailed } = await import('../jobs')
    const long = 'x'.repeat(5000)
    await markFailed('job-1', long)
    const updateCall = mockState.current.calls.find(c => c.op === 'update')
    const payload = updateCall?.args[0] as Record<string, unknown>
    expect((payload.error_message as string).length).toBe(2000)
  })

  it('recordDeadLetter inserts a new failure row when none exists', async () => {
    mockState.current.responses.maybeSingle = { data: null, error: null }
    const { recordDeadLetter } = await import('../jobs')
    await recordDeadLetter({
      userId: 'u1',
      channelType: 'shopify',
      jobType: 'sync_orders',
      errorMessage: 'x',
    })
    const fromCalls = mockState.current.calls.filter(c => c.op === 'from')
    expect(fromCalls.some(c => c.args[0] === 'sync_failures')).toBe(true)
  })

  it('recordDeadLetter increments attempts when existing row present', async () => {
    mockState.current.responses.maybeSingle = { data: { id: 'f1', attempts: 2 }, error: null }
    const { recordDeadLetter } = await import('../jobs')
    await recordDeadLetter({
      userId: 'u1',
      channelType: 'shopify',
      jobType: 'sync_orders',
      errorMessage: 'still broken',
    })
    const updateCall = mockState.current.calls.find(c => c.op === 'update')
    const payload = updateCall?.args[0] as Record<string, unknown>
    expect(payload.attempts).toBe(3)
    expect(payload.error_message).toBe('still broken')
  })
})
