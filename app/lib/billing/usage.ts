// [lib/billing/usage] — usage-based billing helpers.
// Shared between the `/api/cron/report-usage` cron and the `/billing` UI.
//
// Plan quotas + overage rates are pinned here as the single source of truth.
// If you change them, update `/pricing` copy too.

import { SupabaseClient } from '@supabase/supabase-js'

export type Plan = 'free' | 'starter' | 'growth' | 'scale' | 'enterprise' | 'lifetime_scale'

export interface PlanLimits {
  includedOrders: number
  includedListings: number        // Number.POSITIVE_INFINITY === unlimited
  overagePerOrderCents: number
  overagePerListingCents: number
}

// Overage rates: $0.05/order, $0.005/listing → cents use integer math.
const OVERAGE_PER_ORDER_CENTS   = 5
// $0.005 → store as tenth-of-a-cent then collapse to cents at aggregate level.
// We model it as "50 per 10,000" by working in millicents for listings below.
const OVERAGE_PER_LISTING_MILLICENTS = 500 // 500 millicents == $0.005 == 0.5¢

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free:           { includedOrders: 0,      includedListings: 0,                        overagePerOrderCents: 0, overagePerListingCents: 0 },
  starter:        { includedOrders: 500,    includedListings: 1_000,                    overagePerOrderCents: OVERAGE_PER_ORDER_CENTS, overagePerListingCents: 0 },
  growth:         { includedOrders: 2_000,  includedListings: 10_000,                   overagePerOrderCents: OVERAGE_PER_ORDER_CENTS, overagePerListingCents: 0 },
  scale:          { includedOrders: 10_000, includedListings: Number.POSITIVE_INFINITY, overagePerOrderCents: OVERAGE_PER_ORDER_CENTS, overagePerListingCents: 0 },
  enterprise:     { includedOrders: Number.POSITIVE_INFINITY, includedListings: Number.POSITIVE_INFINITY, overagePerOrderCents: 0, overagePerListingCents: 0 },
  lifetime_scale: { includedOrders: Number.POSITIVE_INFINITY, includedListings: Number.POSITIVE_INFINITY, overagePerOrderCents: 0, overagePerListingCents: 0 },
}

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  const key = (plan || 'free') as Plan
  return PLAN_LIMITS[key] ?? PLAN_LIMITS.free
}

export interface MonthlyUsage {
  periodStart: Date
  periodEnd: Date          // exclusive
  orders: number
  listings: number
}

// Returns the UTC month window that contains `at`. periodEnd is EXCLUSIVE.
export function currentPeriod(at: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1))
  const end   = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 1))
  return { start, end }
}

// Count orders + listings for a user in the given period (UTC month).
// Uses countOnly queries to keep data transfer minimal.
export async function getMonthlyUsage(
  db: SupabaseClient,
  userId: string,
  at: Date = new Date(),
): Promise<MonthlyUsage> {
  const { start, end } = currentPeriod(at)

  // Orders: use order_date which is the authoritative "when the order happened".
  const ordersRes = await db
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('order_date', start.toISOString())
    .lt('order_date', end.toISOString())

  // Listings: use created_at — "listings added this period".
  const listingsRes = await db
    .from('channel_listings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())

  if (ordersRes.error)   console.error('[lib/billing/usage:getMonthlyUsage] orders count failed', ordersRes.error.message)
  if (listingsRes.error) console.error('[lib/billing/usage:getMonthlyUsage] listings count failed', listingsRes.error.message)

  return {
    periodStart: start,
    periodEnd: end,
    orders:   ordersRes.count   ?? 0,
    listings: listingsRes.count ?? 0,
  }
}

/**
 * Org-scoped usage. Listings is already org-scoped (Stage A); orders is still
 * user-scoped (Stage A.1) so we fall back to the owner user's orders count.
 */
export async function getMonthlyOrgUsage(
  db: SupabaseClient,
  orgId: string,
  ownerUserId: string,
  at: Date = new Date(),
): Promise<MonthlyUsage> {
  const { start, end } = currentPeriod(at)

  const ordersRes = await db
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('order_date', start.toISOString())
    .lt('order_date', end.toISOString())

  const listingsRes = await db
    .from('channel_listings')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())

  if (ordersRes.error)   console.error('[lib/billing/usage:getMonthlyOrgUsage] orders count failed', ordersRes.error.message)
  if (listingsRes.error) console.error('[lib/billing/usage:getMonthlyOrgUsage] listings count failed', listingsRes.error.message)

  return {
    periodStart: start,
    periodEnd: end,
    orders:   ordersRes.count   ?? 0,
    listings: listingsRes.count ?? 0,
  }
}

export interface OverageBreakdown {
  ordersOverage: number
  listingsOverage: number
  ordersOverageCents: number
  listingsOverageCents: number
  totalCents: number
}

export function computeOverageCharges(plan: string | null | undefined, usage: { orders: number; listings: number }): OverageBreakdown {
  const limits = getPlanLimits(plan)

  const ordersOverage   = Math.max(0, usage.orders   - (limits.includedOrders   === Number.POSITIVE_INFINITY ? usage.orders   : limits.includedOrders))
  const listingsOverage = Math.max(0, usage.listings - (limits.includedListings === Number.POSITIVE_INFINITY ? usage.listings : limits.includedListings))

  const ordersOverageCents   = ordersOverage * OVERAGE_PER_ORDER_CENTS
  // Listings overage: $0.005 each. Integer-safe: (count * 500) millicents → /100 → cents (round).
  const listingsOverageCents = Math.round((listingsOverage * OVERAGE_PER_LISTING_MILLICENTS) / 100)

  return {
    ordersOverage,
    listingsOverage,
    ordersOverageCents,
    listingsOverageCents,
    totalCents: ordersOverageCents + listingsOverageCents,
  }
}
