import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock syncFetch + rate-limit BEFORE importing the module under test.
const fetchMock = vi.fn()
vi.mock('../../sync/http', () => ({
  syncFetch: (url: string, opts?: RequestInit) => fetchMock(url, opts),
  SyncHttpError: class extends Error {},
}))
vi.mock('../../rate-limit/channel', () => ({
  withRateLimit: async (_c: string, _k: string, fn: () => Promise<unknown>) => fn(),
}))

import { ensureEbayPolicies, EbayPolicyError, type EbayChannelRowLike } from '../policies'

type FakeUpdate = { eq: (col: string, val: unknown) => Promise<{ error: null }> }
type FakeFrom = {
  update: (patch: Record<string, unknown>) => FakeUpdate
}

const makeSupabase = (spy: { calls: Array<{ patch: Record<string, unknown> }> }) =>
  ({
    from: (_t: string): FakeFrom => ({
      update(patch) {
        spy.calls.push({ patch })
        return { eq: async () => ({ error: null }) }
      },
    }),
  } as unknown as import('@supabase/supabase-js').SupabaseClient)

const makeOk = (body: Record<string, unknown>) => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify(body),
  json: async () => body,
})

const makeErr = (status: number, text = 'boom') => ({
  ok: false,
  status,
  text: async () => text,
  json: async () => ({}),
})

const baseChannel = (): EbayChannelRowLike => ({
  id: 'chan-1',
  user_id: 'user-1',
  access_token: 'tok',
  metadata: { ebay_marketplace: 'EBAY_US' },
})

describe('ensureEbayPolicies', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('creates all 3 policies when none exist, persists ids to channels.metadata', async () => {
    fetchMock
      .mockResolvedValueOnce(makeOk({ paymentPolicyId: 'PAY-1' }))
      .mockResolvedValueOnce(makeOk({ returnPolicyId: 'RET-1' }))
      .mockResolvedValueOnce(makeOk({ fulfillmentPolicyId: 'FUL-1' }))

    const spy = { calls: [] as Array<{ patch: Record<string, unknown> }> }
    const supabase = makeSupabase(spy)

    const result = await ensureEbayPolicies(baseChannel(), supabase)

    expect(result.paymentPolicyId).toBe('PAY-1')
    expect(result.returnPolicyId).toBe('RET-1')
    expect(result.fulfillmentPolicyId).toBe('FUL-1')
    expect(result.marketplaceId).toBe('EBAY_US')
    expect(result.created).toEqual({ payment: true, return: true, fulfillment: true })

    // 3 POSTs fired
    expect(fetchMock).toHaveBeenCalledTimes(3)
    const urls = fetchMock.mock.calls.map(c => c[0] as string)
    expect(urls[0]).toContain('/payment_policy')
    expect(urls[1]).toContain('/return_policy')
    expect(urls[2]).toContain('/fulfillment_policy')

    // Last DB write contains all 3 ids in both camelCase and snake_case
    const lastPatch = spy.calls.at(-1)!.patch
    const policies = (lastPatch.metadata as any).ebay_policies
    expect(policies.paymentPolicyId).toBe('PAY-1')
    expect(policies.payment_policy_id).toBe('PAY-1')
    expect(policies.returnPolicyId).toBe('RET-1')
    expect(policies.return_policy_id).toBe('RET-1')
    expect(policies.fulfillmentPolicyId).toBe('FUL-1')
    expect(policies.fulfillment_policy_id).toBe('FUL-1')
    expect(policies.provisioned_at).toBeTypeOf('string')
  })

  it('skips creates when metadata already has all 3 ids', async () => {
    const channel: EbayChannelRowLike = {
      id: 'chan-1',
      user_id: 'user-1',
      access_token: 'tok',
      metadata: {
        ebay_marketplace: 'EBAY_GB',
        ebay_policies: {
          paymentPolicyId: 'P-OLD',
          returnPolicyId: 'R-OLD',
          fulfillmentPolicyId: 'F-OLD',
        },
      },
    }
    const spy = { calls: [] as Array<{ patch: Record<string, unknown> }> }
    const result = await ensureEbayPolicies(channel, makeSupabase(spy))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.paymentPolicyId).toBe('P-OLD')
    expect(result.created).toEqual({})
  })

  it('persists partial state and throws EbayPolicyError when 1 of 3 fails', async () => {
    fetchMock
      .mockResolvedValueOnce(makeOk({ paymentPolicyId: 'PAY-2' }))  // payment ok
      .mockResolvedValueOnce(makeOk({ returnPolicyId:  'RET-2' }))  // return ok
      .mockResolvedValueOnce(makeErr(500, 'ebay internal'))          // fulfillment fails
      .mockResolvedValueOnce(makeErr(500, 'list also fails'))        // 409 fallback lookup

    const spy = { calls: [] as Array<{ patch: Record<string, unknown> }> }

    await expect(ensureEbayPolicies(baseChannel(), makeSupabase(spy))).rejects.toBeInstanceOf(EbayPolicyError)

    // Partial state persisted with payment + return ids even though fulfillment failed.
    const partialWrite = spy.calls.at(-1)!.patch
    const policies = (partialWrite.metadata as any).ebay_policies
    expect(policies.paymentPolicyId).toBe('PAY-2')
    expect(policies.returnPolicyId).toBe('RET-2')
    expect(policies.fulfillmentPolicyId).toBeUndefined()
  })

  it('falls back to EBAY_US when marketplace metadata missing or invalid', async () => {
    fetchMock
      .mockResolvedValueOnce(makeOk({ paymentPolicyId: 'PAY-3' }))
      .mockResolvedValueOnce(makeOk({ returnPolicyId: 'RET-3' }))
      .mockResolvedValueOnce(makeOk({ fulfillmentPolicyId: 'FUL-3' }))
    const ch: EbayChannelRowLike = { id: 'c', user_id: 'u', access_token: 't', metadata: { ebay_marketplace: 'nonsense' } }
    const spy = { calls: [] as Array<{ patch: Record<string, unknown> }> }
    const result = await ensureEbayPolicies(ch, makeSupabase(spy))
    expect(result.marketplaceId).toBe('EBAY_US')
  })

  it('throws EbayPolicyError when channel has no access_token', async () => {
    const ch: EbayChannelRowLike = { id: 'c', user_id: 'u', access_token: null, metadata: {} }
    const spy = { calls: [] as Array<{ patch: Record<string, unknown> }> }
    await expect(ensureEbayPolicies(ch, makeSupabase(spy))).rejects.toBeInstanceOf(EbayPolicyError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
