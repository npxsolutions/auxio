import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Ensure no Redis env — withRateLimit should fail-open on reservations
// so we can test the retry loop deterministically.
beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
  vi.resetModules()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('rate-limit/channel withRateLimit', () => {
  it('returns fn result on first success', async () => {
    const { withRateLimit } = await import('../channel')
    const fn = vi.fn(async () => 'ok')
    const out = await withRateLimit('shopify', 'shop.myshopify.com', fn)
    expect(out).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on 429 and succeeds', async () => {
    const { withRateLimit } = await import('../channel')
    let n = 0
    const fn = vi.fn(async () => {
      n++
      if (n < 2) {
        const err = new Error('rate limited') as Error & { status: number }
        err.status = 429
        throw err
      }
      return 'after-retry'
    })
    const out = await withRateLimit('ebay', 'user-1', fn, { maxRetries: 3, baseDelayMs: 1 })
    expect(out).toBe('after-retry')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retries on 5xx then surfaces last error when retries exhausted', async () => {
    const { withRateLimit } = await import('../channel')
    const fn = vi.fn(async () => {
      const err = new Error('upstream down') as Error & { status: number }
      err.status = 503
      throw err
    })
    await expect(
      withRateLimit('shopify', 'shop.myshopify.com', fn, { maxRetries: 2, baseDelayMs: 1 })
    ).rejects.toThrow('upstream down')
    // initial + 2 retries
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does NOT retry on 4xx non-429 errors', async () => {
    const { withRateLimit } = await import('../channel')
    const fn = vi.fn(async () => {
      const err = new Error('bad request') as Error & { status: number }
      err.status = 400
      throw err
    })
    await expect(
      withRateLimit('amazon', 'u1', fn, { maxRetries: 5, baseDelayMs: 1 })
    ).rejects.toThrow('bad request')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('rate-limit/channel reserveChannelCall', () => {
  it('fails open when Redis env is missing', async () => {
    const { reserveChannelCall } = await import('../channel')
    const res = await reserveChannelCall('shopify', 'shop-a')
    expect(res.ok).toBe(true)
  })
})
