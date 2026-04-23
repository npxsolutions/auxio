// Facebook Commerce Catalog webhook receiver.
// GET: Meta verification handshake.
// POST: verified catalog change event; dedupe via webhook_events_facebook.
import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header || !appSecret) return false
  const prefix = 'sha256='
  if (!header.startsWith(prefix)) return false
  const received = header.slice(prefix.length)
  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')
  try {
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(received, 'hex')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? '', { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

interface FbWebhookChange {
  field?: string
  value?: Record<string, unknown> & {
    product_id?: string | number
    retailer_id?: string
    event?: string
  }
}
interface FbWebhookEntry {
  id?: string
  time?: number
  changes?: FbWebhookChange[]
}
interface FbWebhookPayload {
  object?: string
  entry?: FbWebhookEntry[]
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const appSecret = process.env.FACEBOOK_APP_SECRET || ''
  const sigHeader = request.headers.get('x-hub-signature-256')

  if (!verifyMetaSignature(rawBody, sigHeader, appSecret)) {
    console.error('[facebook:webhook] signature mismatch')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: FbWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const supabase = getSupabase()
  const now = new Date().toISOString()
  const topic = payload.object ?? 'catalog'

  let handled = 0
  let duplicates = 0

  for (const entry of payload.entry ?? []) {
    const catalogId = entry.id ?? ''
    const receivedId = `${catalogId}:${entry.time ?? ''}`

    const { error: dedupeErr } = await supabase.from('webhook_events_facebook').insert({
      received_id: receivedId,
      topic,
      shop_domain: catalogId,
      raw_body: entry as unknown as object,
    })
    if (dedupeErr && (dedupeErr as { code?: string }).code === '23505') {
      duplicates++
      continue
    }

    // Resolve channel by catalog_id in metadata.
    const { data: channel } = await supabase
      .from('channels')
      .select('user_id, organization_id, metadata')
      .eq('type', 'facebook')
      .contains('metadata', { catalog_id: catalogId })
      .maybeSingle()
    if (!channel) {
      console.error('[facebook:webhook] unknown catalog:', catalogId)
      continue
    }
    const userId = channel.user_id as string
    // orgId available if we need to add it to future INSERTs; facebook webhook
    // currently only UPDATEs existing listing_channels rows (no INSERTs).
    void (channel.organization_id as string)

    for (const change of entry.changes ?? []) {
      const value = change.value ?? {}
      const externalId = String(value.product_id ?? '')
      if (!externalId) continue
      const event = String(value.event ?? '').toLowerCase()

      if (event === 'delete' || event === 'deleted') {
        await supabase
          .from('listing_channels')
          .update({ status: 'unpublished', updated_at: now })
          .eq('user_id', userId)
          .eq('channel_type', 'facebook')
          .eq('channel_listing_id', externalId)
        handled++
        continue
      }

      // For create/update events we touch the existing mapping only; a full
      // refresh of the product payload comes on the next hourly cron.
      const { data: existingLc } = await supabase
        .from('listing_channels')
        .select('listing_id')
        .eq('user_id', userId)
        .eq('channel_type', 'facebook')
        .eq('channel_listing_id', externalId)
        .maybeSingle()
      if (existingLc?.listing_id) {
        await supabase
          .from('listing_channels')
          .update({ status: 'published', updated_at: now })
          .eq('user_id', userId)
          .eq('channel_type', 'facebook')
          .eq('channel_listing_id', externalId)
      }
      handled++
    }
  }

  return NextResponse.json({ ok: true, handled, duplicates })
}
