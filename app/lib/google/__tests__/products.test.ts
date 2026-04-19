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
vi.mock('../auth', () => ({
  GOOGLE_CONTENT_BASE: 'https://shoppingcontent.googleapis.com/content/v2.1',
  googleHeaders: ({ accessToken }: { accessToken: string }) => ({
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }),
  getGoogleAccessToken: async () => ({ accessToken: 'fake-token', expiresAt: Date.now() + 3600_000 }),
}))

import { publishToGoogle, type GooglePushChannel, type GooglePushListing } from '../products'

const OK = (body: Record<string, unknown>) => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify(body),
  json: async () => body,
})

const ERR = (status: number, text: string) => ({
  ok: false,
  status,
  text: async () => text,
  json: async () => JSON.parse(text),
})

const supabaseStub = {} as unknown as import('@supabase/supabase-js').SupabaseClient

const baseListing: GooglePushListing = {
  id:           'lst-1',
  title:        'Test Product',
  description:  'A lovely test product that meets the description requirement.',
  price:        19.99,
  quantity:     5,
  sku:          'SKU-123',
  condition:    'new',
  images:       ['https://cdn.example.com/main.jpg', 'https://cdn.example.com/alt.jpg'],
  brand:        'TestBrand',
  barcode:      '1234567890123',
  mpn:          null,
  product_url:  'https://shop.example.com/products/test',
  shopify_handle: 'test',
  product_type: 't-shirt',
}

const baseChannel: GooglePushChannel = {
  user_id:      'user-1',
  access_token: 'refresh-token-long-lived',
  metadata:     { merchant_id: '999888777' },
  shop_domain:  '999888777',
}

describe('publishToGoogle', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    process.env.GOOGLE_CLIENT_ID     = 'client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret'
  })

  it('inserts a product on the merchant account and returns { id, url }', async () => {
    fetchMock.mockResolvedValueOnce(OK({
      id:   'online:en:US:SKU-123',
      link: 'https://shop.example.com/products/test',
    }))

    const result = await publishToGoogle(baseListing, baseChannel, supabaseStub)

    expect(result.id).toBe('online:en:US:SKU-123')
    expect(result.url).toBe('https://shop.example.com/products/test')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('https://shoppingcontent.googleapis.com/content/v2.1/999888777/products')
    expect(opts.method).toBe('POST')
    const body = JSON.parse(opts.body as string)
    expect(body.offerId).toBe('SKU-123')
    expect(body.title).toBe('Test Product')
    expect(body.price).toEqual({ value: '19.99', currency: 'USD' })
    expect(body.availability).toBe('in_stock')
    expect(body.imageLink).toBe('https://cdn.example.com/main.jpg')
    expect(body.additionalImageLinks).toEqual(['https://cdn.example.com/alt.jpg'])
    expect(body.gtin).toBe('1234567890123')
    expect(body.googleProductCategory).toBe('212') // t-shirt → Shirts & Tops
  })

  it('derives out_of_stock when quantity is 0', async () => {
    fetchMock.mockResolvedValueOnce(OK({ id: 'x', link: 'y' }))
    await publishToGoogle({ ...baseListing, quantity: 0 }, baseChannel, supabaseStub)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.availability).toBe('out_of_stock')
  })

  it('falls back to MPN-from-SKU when no GTIN is present', async () => {
    fetchMock.mockResolvedValueOnce(OK({ id: 'x', link: 'y' }))
    await publishToGoogle({ ...baseListing, barcode: null, mpn: null }, baseChannel, supabaseStub)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.gtin).toBeUndefined()
    expect(body.mpn).toBe('SKU-123')
  })

  it('throws with status on 4xx Content API error (no retry)', async () => {
    fetchMock.mockResolvedValueOnce(ERR(400, JSON.stringify({
      error: { errors: [{ reason: 'invalid_image_link', message: 'bad image' }] },
    })))

    await expect(publishToGoogle(baseListing, baseChannel, supabaseStub))
      .rejects.toMatchObject({ status: 400 })
  })

  it('throws when merchant_id is missing on the channel', async () => {
    const brokenChannel = { ...baseChannel, metadata: {}, shop_domain: null } as GooglePushChannel
    await expect(publishToGoogle(baseListing, brokenChannel, supabaseStub))
      .rejects.toThrow(/merchant_id/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws when GOOGLE_CLIENT_ID/SECRET env vars are missing', async () => {
    delete process.env.GOOGLE_CLIENT_ID
    await expect(publishToGoogle(baseListing, baseChannel, supabaseStub))
      .rejects.toThrow(/Google OAuth credentials not configured/)
  })
})
