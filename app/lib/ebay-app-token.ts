// Shared eBay application token (client_credentials flow)
// Used by taxonomy, browse, and other public eBay API calls.
// In-memory cache is effective for warm serverless instances;
// cold starts just incur one extra token fetch (tokens last ~2h).

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getEbayAppToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token

  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID!}:${process.env.EBAY_CLIENT_SECRET!}`
  ).toString('base64')

  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope:      'https://api.ebay.com/oauth/api_scope',
    }),
  })

  if (!res.ok) throw new Error(`eBay app token failed: ${res.status} ${await res.text()}`)

  const { access_token, expires_in } = await res.json()
  cachedToken = { token: access_token, expiresAt: Date.now() + expires_in * 1000 }
  return access_token
}
