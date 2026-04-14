// Etsy v3 Open API auth helpers.
//
// Etsy's v3 requests need two headers when acting on behalf of a user:
//   - x-api-key:    "<keystring>:<shared_secret>"  (UTF-8)
//   - Authorization: Bearer <numeric_user_id>.<access_token>
//
// See: https://developers.etsy.com/documentation/essentials/authentication
//
// Keep this file tiny and side-effect-free so it can be imported from both
// server routes and edge contexts. Env reads are lazy per-call.

export function etsyApiKeyHeader(): string {
  const keystring = process.env.ETSY_KEYSTRING
  const shared = process.env.ETSY_SHARED_SECRET
  if (!keystring) throw new Error('[etsy:auth] ETSY_KEYSTRING not set')
  if (!shared)    throw new Error('[etsy:auth] ETSY_SHARED_SECRET not set')
  return `${keystring}:${shared}`
}

export function etsyBearer(userIdNumeric: string | number, accessToken: string): string {
  if (!userIdNumeric) throw new Error('[etsy:auth] missing numeric user id')
  if (!accessToken)   throw new Error('[etsy:auth] missing access token')
  return `${String(userIdNumeric)}.${accessToken}`
}

export interface EtsyHeadersInput {
  userId: string | number
  accessToken: string
}

export function etsyHeaders({ userId, accessToken }: EtsyHeadersInput): Record<string, string> {
  return {
    'x-api-key':     etsyApiKeyHeader(),
    'Authorization': `Bearer ${etsyBearer(userId, accessToken)}`,
    'Accept':        'application/json',
  }
}
