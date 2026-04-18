/**
 * Sync engine — orchestrates the full Shopify → Palvento → eBay pipeline.
 *
 * Pipeline stages:
 *   1. IMPORT   — Fetch products from Shopify, upsert into listings table
 *   2. VALIDATE — Run feed validator rules per target channel
 *   3. TRANSFORM — Apply feed rules + field mappings
 *   4. PUSH     — Send to eBay via Inventory API
 *
 * Entry points:
 *   - runFullSync()   — full import + push for a user (initial setup)
 *   - syncSingleListing()   — process one listing through validate → push
 *   - onShopifyProductChange() — webhook handler entry: update listing, re-push to eBay if published
 *
 * All operations are idempotent. Errors are tracked per-listing per-channel
 * in channel_sync_state with retry/backoff logic in the sync_jobs table.
 *
 * Log prefix: [sync:engine]
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { importAllShopifyProducts, type ImportOptions } from './shopify-import'
import { pushListingToEbay, type EbayPushListing } from './ebay-push'
import { validateForChannel } from '@/app/lib/feed/validator'
import { enqueueJob, markStarted, markCompleted, markFailed, recordDeadLetter } from './jobs'

const getAdmin = (): SupabaseClient =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

// ── Types ──────────────────────────────────────────────────────────────────

export interface SyncResult {
  stage: 'import' | 'validate' | 'push'
  imported: number
  validated: number
  validationFailed: number
  pushed: number
  pushFailed: number
  errors: Array<{ listingId: string; stage: string; error: string }>
}

export interface SingleSyncResult {
  listingId: string
  validated: boolean
  healthScore: number
  pushed: boolean
  ebayListingId?: string
  ebayUrl?: string
  error?: string
}

// ── Full sync pipeline ─────────────────────────────────────────────────────

/**
 * Runs the complete Shopify → eBay sync pipeline for a user:
 *   1. Import all products from Shopify
 *   2. Validate each listing for eBay
 *   3. Push passing listings to eBay
 *
 * This is the "initial sync" flow after connecting both channels.
 */
export async function runFullSync(opts: {
  userId: string
  shopDomain: string
  shopifyAccessToken: string
  targetChannel?: 'ebay'
  /** Only sync products updated after this date. Null = full sync. */
  updatedSince?: string | null
  /** If true, skip the push step (import + validate only). */
  dryRun?: boolean
}): Promise<SyncResult> {
  const supabase = getAdmin()
  const result: SyncResult = {
    stage: 'import',
    imported: 0,
    validated: 0,
    validationFailed: 0,
    pushed: 0,
    pushFailed: 0,
    errors: [],
  }

  const jobId = await enqueueJob({
    userId: opts.userId,
    jobType: 'sync.full_pipeline',
    channelType: 'ebay',
    payload: { shopDomain: opts.shopDomain, dryRun: opts.dryRun },
  })
  if (jobId) await markStarted(jobId)

  try {
    // ── STAGE 1: Import ────────────────────────────────────────────────────
    console.log(`[sync:engine] stage=import user=${opts.userId}`)
    const importResult = await importAllShopifyProducts({
      userId: opts.userId,
      shopDomain: opts.shopDomain,
      accessToken: opts.shopifyAccessToken,
      updatedSince: opts.updatedSince,
      forceUpdate: true,
    })
    result.imported = importResult.imported + importResult.updated
    result.stage = 'validate'

    // ── STAGE 2: Validate ──────────────────────────────────────────────────
    // Check if eBay channel exists — skip push stages if not connected
    const { data: ebayChannel } = await supabase
      .from('channels')
      .select('id')
      .eq('user_id', opts.userId)
      .eq('type', 'ebay')
      .eq('active', true)
      .maybeSingle()

    if (!ebayChannel || opts.targetChannel !== 'ebay') {
      console.log(`[sync:engine] no eBay channel — stopping after import`)
      if (jobId) await markCompleted(jobId, result.imported)
      return result
    }

    // Get all listings for this user that have a Shopify source
    const { data: listingChannels } = await supabase
      .from('listing_channels')
      .select('listing_id')
      .eq('user_id', opts.userId)
      .eq('channel_type', 'shopify')
      .eq('status', 'published')

    const listingIds = (listingChannels ?? []).map(lc => lc.listing_id as string)
    console.log(`[sync:engine] stage=validate listings=${listingIds.length}`)

    const validListingIds: string[] = []
    for (const listingId of listingIds) {
      try {
        const validationResult = await validateForChannel(listingId, 'ebay')
        if (validationResult.passed) {
          validListingIds.push(listingId)
          result.validated++
        } else {
          result.validationFailed++
          const errMsgs = validationResult.issues
            .filter(i => i.rule.severity === 'error')
            .map(i => i.rule.message)
          result.errors.push({
            listingId,
            stage: 'validate',
            error: errMsgs.join('; '),
          })
        }
      } catch (err) {
        result.validationFailed++
        result.errors.push({ listingId, stage: 'validate', error: (err as Error).message })
      }
    }

    result.stage = 'push'

    if (opts.dryRun) {
      console.log(`[sync:engine] dry-run — skipping push stage`)
      if (jobId) await markCompleted(jobId, result.imported + result.validated)
      return result
    }

    // ── STAGE 3: Push ──────────────────────────────────────────────────────
    console.log(`[sync:engine] stage=push valid=${validListingIds.length}`)

    for (const listingId of validListingIds) {
      try {
        const pushResult = await syncSingleListing({
          userId: opts.userId,
          listingId,
          targetChannel: 'ebay',
        })
        if (pushResult.pushed) {
          result.pushed++
        } else {
          result.pushFailed++
          if (pushResult.error) {
            result.errors.push({ listingId, stage: 'push', error: pushResult.error })
          }
        }
      } catch (err) {
        result.pushFailed++
        result.errors.push({ listingId, stage: 'push', error: (err as Error).message })
      }
    }

    if (jobId) await markCompleted(jobId, result.pushed)
  } catch (err) {
    const msg = (err as Error).message
    console.error(`[sync:engine] pipeline error: ${msg}`)
    if (jobId) await markFailed(jobId, msg)
    result.errors.push({ listingId: '*', stage: result.stage, error: msg })
  }

  console.log(
    `[sync:engine] done user=${opts.userId} imported=${result.imported} validated=${result.validated} pushed=${result.pushed} failed=${result.pushFailed}`,
  )
  return result
}

// ── Single listing sync ────────────────────────────────────────────────────

/**
 * Validate and push a single listing to a target channel.
 * Called by the webhook handler when a Shopify product changes and
 * the listing is already published to eBay.
 */
export async function syncSingleListing(opts: {
  userId: string
  listingId: string
  targetChannel: 'ebay'
}): Promise<SingleSyncResult> {
  const supabase = getAdmin()

  // Load the listing
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', opts.listingId)
    .single()

  if (!listing) {
    return { listingId: opts.listingId, validated: false, healthScore: 0, pushed: false, error: 'Listing not found' }
  }

  // Load existing channel mapping (for category, aspect values, etc.)
  const { data: lc } = await supabase
    .from('listing_channels')
    .select('*')
    .eq('listing_id', opts.listingId)
    .eq('channel_type', opts.targetChannel)
    .maybeSingle()

  // Validate
  const validation = await validateForChannel(opts.listingId, opts.targetChannel)
  if (!validation.passed) {
    return {
      listingId: opts.listingId,
      validated: false,
      healthScore: validation.healthScore,
      pushed: false,
      error: validation.issues
        .filter(i => i.rule.severity === 'error')
        .map(i => i.rule.message)
        .join('; '),
    }
  }

  // Build the push payload
  const pushListing: EbayPushListing = {
    id: listing.id,
    title: listing.title ?? '',
    description: listing.description ?? '',
    price: listing.price ?? 0,
    quantity: listing.quantity ?? 0,
    sku: listing.sku || listing.id,
    condition: listing.condition ?? 'new',
    images: listing.images ?? [],
    brand: listing.brand ?? '',
    attributes: listing.attributes ?? {},
    weight_grams: listing.weight_grams ?? null,
    barcode: listing.barcode ?? null,
  }

  // Use existing category mapping if available
  const categoryId = lc?.category_id ?? lc?.external_category_id ?? undefined

  const pushResult = await pushListingToEbay({
    userId: opts.userId,
    listing: pushListing,
    categoryId: categoryId as string | undefined,
  })

  return {
    listingId: opts.listingId,
    validated: true,
    healthScore: validation.healthScore,
    pushed: pushResult.success,
    ebayListingId: pushResult.listingId,
    ebayUrl: pushResult.url,
    error: pushResult.error,
  }
}

// ── Webhook-driven sync ────────────────────────────────────────────────────

/**
 * Called when a Shopify product webhook fires (create/update). Checks if
 * the listing is already published to eBay and, if so, re-pushes the
 * updated data. This is the "ongoing sync" hot path.
 *
 * Returns null if the listing is not published to eBay (no action needed).
 */
export async function onShopifyProductChange(opts: {
  userId: string
  listingId: string
}): Promise<SingleSyncResult | null> {
  const supabase = getAdmin()

  // Check if this listing is published to eBay
  const { data: ebayLc } = await supabase
    .from('listing_channels')
    .select('status, channel_listing_id, category_id')
    .eq('listing_id', opts.listingId)
    .eq('channel_type', 'ebay')
    .eq('user_id', opts.userId)
    .maybeSingle()

  if (!ebayLc || ebayLc.status !== 'published') {
    console.log(`[sync:engine] listing=${opts.listingId} not published to eBay — skipping re-push`)
    return null
  }

  console.log(`[sync:engine] listing=${opts.listingId} is published to eBay — triggering re-push`)

  return syncSingleListing({
    userId: opts.userId,
    listingId: opts.listingId,
    targetChannel: 'ebay',
  })
}
