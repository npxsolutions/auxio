import { createHmac } from 'crypto'

/**
 * Verifies a Shopify webhook HMAC-SHA256 signature.
 * Shopify signs the raw request body with your client secret.
 * Must read the body as raw text — do NOT parse as JSON first.
 */
export function verifyShopifyHmac(rawBody: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) return false
  const hash = createHmac('sha256', process.env.SHOPIFY_CLIENT_SECRET!)
    .update(rawBody, 'utf8')
    .digest('base64')
  return hash === hmacHeader
}
