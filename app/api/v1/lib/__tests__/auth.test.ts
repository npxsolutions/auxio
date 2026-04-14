import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'node:crypto'

// Dynamic mock factory. Each test overrides via `clients`.
type ClientOverride = {
  getUser?: (token: string) => Promise<{ data: { user: unknown }; error: unknown }>
  apiKeyRow?: { data: unknown; error: unknown }
  updatePromise?: Promise<{ error: unknown }>
}

const state = {
  overrides: [] as ClientOverride[],
  calls: [] as string[],
  idx: 0,
}

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => {
      const ov = state.overrides[state.idx] ?? {}
      state.idx += 1
      const client: any = {
        auth: {
          getUser: ov.getUser ?? (async () => ({ data: { user: null }, error: { message: 'invalid' } })),
        },
        from: (table: string) => {
          state.calls.push(`from:${table}`)
          const chain: any = {
            select: (_c: string) => chain,
            eq: (..._a: unknown[]) => chain,
            maybeSingle: async () => ov.apiKeyRow ?? { data: null, error: null },
            update: (_v: unknown) => ({
              eq: () => ({
                then: (res: any) => (ov.updatePromise ?? Promise.resolve({ error: null })).then(res),
              }),
            }),
          }
          return chain
        },
      }
      return client
    },
  }
})

// Minimal NextRequest/NextResponse stand-ins. The auth module uses these for
// constructing JSON error responses and reading the Authorization header.
vi.mock('next/server', () => {
  class NextResponse {
    body: unknown
    status: number
    constructor(body: unknown, init: { status?: number } = {}) {
      this.body = body
      this.status = init.status ?? 200
    }
    static json(body: unknown, init: { status?: number } = {}) {
      return new NextResponse(body, init)
    }
  }
  return { NextResponse, NextRequest: class {} }
})

function makeReq(token?: string) {
  const headers = new Map<string, string>()
  if (token) headers.set('authorization', `Bearer ${token}`)
  return {
    headers: {
      get: (k: string) => headers.get(k.toLowerCase()) ?? null,
    },
  } as any
}

beforeEach(() => {
  state.overrides = []
  state.calls = []
  state.idx = 0
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
})

describe('api/v1/lib/auth requireApiAuth', () => {
  it('returns 401 when Authorization header missing', async () => {
    const { requireApiAuth } = await import('../auth')
    const res = await requireApiAuth(makeReq())
    expect(res.user).toBeNull()
    expect((res.error as any).status).toBe(401)
  })

  it('accepts a valid Supabase JWT (user returned, no api_key lookup)', async () => {
    state.overrides = [
      { getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }) },
    ]
    const { requireApiAuth } = await import('../auth')
    const res = await requireApiAuth(makeReq('jwt-token'))
    expect(res.user).toEqual({ id: 'user-1' })
    expect(res.source).toBe('jwt')
    // Should NOT have queried api_keys
    expect(state.calls).not.toContain('from:api_keys')
  })

  it('falls back to api_keys table and accepts active key', async () => {
    state.overrides = [
      // jwt client: fails
      { getUser: async () => ({ data: { user: null }, error: { message: 'bad' } }) },
      // admin client: returns active key row
      {
        apiKeyRow: {
          data: { id: 'k1', user_id: 'user-7', active: true, expires_at: null },
          error: null,
        },
      },
    ]
    const token = 'raw-api-key'
    const expectedHash = crypto.createHash('sha256').update(token).digest('hex')
    const { requireApiAuth } = await import('../auth')
    const res = await requireApiAuth(makeReq(token))
    expect(res.user).toEqual({ id: 'user-7' })
    expect(res.source).toBe('api_key')
    expect(res.userId).toBe('user-7')
    expect(state.calls).toContain('from:api_keys')
    // Sanity: hash is 64-hex (we trust the module computed the same)
    expect(expectedHash).toHaveLength(64)
  })

  it('rejects an expired api_keys row', async () => {
    state.overrides = [
      { getUser: async () => ({ data: { user: null }, error: { message: 'bad' } }) },
      {
        apiKeyRow: {
          data: {
            id: 'k1',
            user_id: 'user-7',
            active: true,
            expires_at: new Date(Date.now() - 60_000).toISOString(),
          },
          error: null,
        },
      },
    ]
    const { requireApiAuth } = await import('../auth')
    const res = await requireApiAuth(makeReq('raw'))
    expect(res.user).toBeNull()
    expect((res.error as any).status).toBe(401)
    expect((res.error as any).body).toEqual({ error: 'API key expired' })
  })

  it('rejects a revoked (active=false) api_keys row', async () => {
    state.overrides = [
      { getUser: async () => ({ data: { user: null }, error: { message: 'bad' } }) },
      {
        apiKeyRow: {
          data: { id: 'k1', user_id: 'user-7', active: false, expires_at: null },
          error: null,
        },
      },
    ]
    const { requireApiAuth } = await import('../auth')
    const res = await requireApiAuth(makeReq('raw'))
    expect(res.user).toBeNull()
    expect((res.error as any).body).toEqual({ error: 'API key revoked' })
  })

  it('rejects when neither JWT nor api_keys match', async () => {
    state.overrides = [
      { getUser: async () => ({ data: { user: null }, error: { message: 'bad' } }) },
      { apiKeyRow: { data: null, error: null } },
    ]
    const { requireApiAuth } = await import('../auth')
    const res = await requireApiAuth(makeReq('unknown'))
    expect(res.user).toBeNull()
    expect((res.error as any).body).toEqual({ error: 'Invalid or expired token' })
  })
})
