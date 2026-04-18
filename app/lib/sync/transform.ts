/**
 * Feed transformation pipeline
 *
 * Orchestrates the rules engine during the sync process:
 *   1. Product imported from source (e.g. Shopify) → raw listing
 *   2. Rules engine runs: transformForChannel(listing, 'amazon', userId)
 *   3. Validator runs on transformed listing
 *   4. If valid → push to channel
 *   5. If invalid → surface errors with fix suggestions
 *
 * Log prefix: [sync:transform]
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
  applyRules,
  mergeRulesWithDefaults,
  type FeedRule,
  type Listing,
  type TransformedListing,
} from '@/app/lib/feed/rules-engine'

// Lazy admin client — module-level instantiation breaks Next build per repo rule.
const getAdmin = (): SupabaseClient =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

/**
 * Load user-defined feed rules from the database.
 */
async function loadUserRules(userId: string, channel?: string): Promise<FeedRule[]> {
  const supabase = getAdmin()
  let query = supabase
    .from('feed_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('priority', { ascending: true })

  if (channel && channel !== 'all') {
    query = query.or(`channel.eq.${channel},channel.eq.all,channel.is.null`)
  }

  const { data, error } = await query

  if (error) {
    console.error('[sync:transform] Failed to load user rules:', error.message)
    return []
  }

  // Map DB row shape to FeedRule interface
  return (data ?? []).map((row: any): FeedRule => ({
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    priority: row.priority ?? 100,
    enabled: row.active !== false,
    conditions: row.conditions ?? [],
    conditionLogic: row.combinator ?? row.condition_logic ?? 'AND',
    actions: row.actions ?? [],
    channel: row.channel ?? null,
    rulePhase: row.rule_phase ?? 'business',
    isDefault: row.is_default ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

/**
 * Transform a listing for a specific channel.
 *
 * 1. Load user's rules for this channel
 * 2. Load default rules for this channel
 * 3. Merge (user rules override defaults)
 * 4. Sort by priority
 * 5. Apply in order
 * 6. Return transformed listing
 */
export async function transformForChannel(
  listing: Listing,
  channel: string,
  userId: string
): Promise<TransformedListing> {
  const start = Date.now()

  // 1. Load user rules
  const userRules = await loadUserRules(userId, channel)

  // 2 + 3. Merge with defaults (defaults fill gaps, user rules override)
  const mergedRules = mergeRulesWithDefaults(userRules, channel)

  // 4 + 5. Apply rules (already sorted by mergeRulesWithDefaults)
  const transformed = applyRules(listing, channel, mergedRules)

  console.log(
    `[sync:transform] ${channel}: applied ${mergedRules.length} rules ` +
    `(${userRules.length} user + ${mergedRules.length - userRules.length} default) ` +
    `in ${Date.now() - start}ms`
  )

  return transformed
}

/**
 * Transform a listing for multiple channels in parallel.
 */
export async function transformForAllChannels(
  listing: Listing,
  channels: string[],
  userId: string
): Promise<Record<string, TransformedListing>> {
  const results: Record<string, TransformedListing> = {}

  const transforms = await Promise.all(
    channels.map(async (channel) => {
      const transformed = await transformForChannel(listing, channel, userId)
      return { channel, transformed }
    })
  )

  for (const { channel, transformed } of transforms) {
    results[channel] = transformed
  }

  return results
}

/**
 * Dry-run: preview what rules would produce without persisting.
 * Useful for the UI preview feature.
 */
export async function previewTransform(
  listing: Listing,
  channel: string,
  userId: string
): Promise<{
  original: Listing
  transformed: TransformedListing
  rulesApplied: number
  changedFields: string[]
}> {
  const userRules = await loadUserRules(userId, channel)
  const mergedRules = mergeRulesWithDefaults(userRules, channel)
  const transformed = applyRules(listing, channel, mergedRules)

  const changedFields = Object.keys(transformed).filter(k => {
    if (k.startsWith('__')) return false
    return JSON.stringify(transformed[k]) !== JSON.stringify(listing[k])
  })

  return {
    original: listing,
    transformed,
    rulesApplied: mergedRules.length,
    changedFields,
  }
}
