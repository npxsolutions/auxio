// Facebook Commerce Catalog (Graph API v19.0) auth helpers.
//
// Meta long-lived page/system-user tokens do not expire within normal cron
// timescales (60 days for page tokens, ~never for system-user tokens), so we
// use the stored channels.access_token directly without refresh logic.
//
// See: https://developers.facebook.com/docs/marketing-api/reference/product-catalog

export const FACEBOOK_GRAPH_BASE = 'https://graph.facebook.com/v19.0'

export function graphUrl(path: string): string {
  const trimmed = path.startsWith('/') ? path.slice(1) : path
  return `${FACEBOOK_GRAPH_BASE}/${trimmed}`
}

export interface FacebookHeadersInput {
  accessToken: string
}

export function facebookHeaders({ accessToken }: FacebookHeadersInput): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}
