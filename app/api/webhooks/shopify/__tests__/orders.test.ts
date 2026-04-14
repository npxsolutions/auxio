import { describe, it, expect, beforeEach } from 'vitest'
import { createHmac } from 'node:crypto'
import { verifyShopifyHmac } from '../../../shopify/webhooks/_verify'

// HMAC verification is the security-critical gate in front of the Shopify
// orders webhook route (app/api/webhooks/shopify/orders/route.ts). If this
// passes, only genuine Shopify deliveries reach the DB write path.

const SECRET = 'test-secret-shhh'

function signBody(raw: string, secret = SECRET): string {
  return createHmac('sha256', secret).update(raw, 'utf8').digest('base64')
}

beforeEach(() => {
  process.env.SHOPIFY_CLIENT_SECRET = SECRET
})

describe('shopify webhook HMAC verification', () => {
  it('accepts a body signed with the correct secret', () => {
    const body = JSON.stringify({ id: 123, total_price: '19.99' })
    const hmac = signBody(body)
    expect(verifyShopifyHmac(body, hmac)).toBe(true)
  })

  it('rejects a tampered body (same hmac, mutated body)', () => {
    const original = JSON.stringify({ id: 123, total_price: '19.99' })
    const hmac = signBody(original)
    const tampered = JSON.stringify({ id: 123, total_price: '0.01' })
    expect(verifyShopifyHmac(tampered, hmac)).toBe(false)
  })

  it('rejects when hmac header is missing/null', () => {
    const body = JSON.stringify({ id: 1 })
    expect(verifyShopifyHmac(body, null)).toBe(false)
  })

  it('rejects when hmac was computed with the wrong secret', () => {
    const body = JSON.stringify({ id: 1 })
    const wrong = signBody(body, 'attacker-secret')
    expect(verifyShopifyHmac(body, wrong)).toBe(false)
  })

  it('rejects garbage hmac header', () => {
    const body = JSON.stringify({ id: 1 })
    expect(verifyShopifyHmac(body, 'not-base64-at-all')).toBe(false)
  })
})
