// Google Merchant Center (Content API for Shopping v2.1) auth helpers.
//
// OAuth2 access tokens expire in ~1h. We cache the current token + expiry on
// channels.metadata.google_access_token / google_token_expires_at and refresh
// via the stored refresh_token when <60s remain.
//
// See: https://developers.google.com/shopping-content/guides/how-tos/authorizing

import type { SupabaseClient } from '@supabase/supabase-js'
import { syncFetch } from '../sync/http'

export const GOOGLE_CONTENT_BASE = 'https://shoppingcontent.googleapis.com/content/v2.1'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export interface GoogleChannelRow {
  user_id: string
  access_token: string | null // stores the refresh_token (long-lived)
  metadata: Record<string, unknown> | null
}

export interface GoogleTokenResult {
  accessToken: string
  expiresAt: number // epoch ms
}

export interface GoogleHeadersInput {
  accessToken: string
}

export function googleHeaders({ accessToken }: GoogleHeadersInput): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

export async function getGoogleAccessToken(
  channel: GoogleChannelRow,
  supabase: SupabaseClient,
): Promise<GoogleTokenResult> {
  const metadata = (channel.metadata as Record<string, unknown> | null) ?? {}
  const now = Date.now()

  const cachedToken = metadata.google_access_token as string | undefined
  const cachedExp = Number(metadata.google_token_expires_at as number | string | undefined)
  if (cachedToken && Number.isFinite(cachedExp) && cachedExp - now > 60_000) {
    return { accessToken: cachedToken, expiresAt: cachedExp }
  }

  const refreshToken =
    (metadata.google_refresh_token as string | undefined) ?? channel.access_token ?? null
  if (!refreshToken) throw new Error('[google:auth] no refresh_token on channel')

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('[google:auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env missing')
  }

  const res = await syncFetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
    label: 'google.token.refresh',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`[google:auth] refresh HTTP ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  const token = json.access_token
  const expiresIn = Number(json.expires_in ?? 3600)
  if (!token) throw new Error('[google:auth] refresh response missing access_token')
  const expiresAt = now + Math.max(60, expiresIn - 30) * 1000

  await supabase
    .from('channels')
    .update({
      metadata: {
        ...metadata,
        google_access_token: token,
        google_token_expires_at: expiresAt,
      },
    })
    .eq('user_id', channel.user_id)
    .eq('type', 'google')

  return { accessToken: token, expiresAt }
}
