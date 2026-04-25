/**
 * Seed script for RLS integration tests.
 *
 * Creates two test users (A, B) with a personal org each, plus a distinct
 * `listings` row per org. The seeder is idempotent — re-running overwrites the
 * same fixture set so test files can rely on a stable shape.
 *
 * Requires env:
 *   TEST_SUPABASE_URL             — points at a disposable supabase project
 *   TEST_SUPABASE_SERVICE_KEY     — service role key for that project
 *
 * Usage:
 *   npx tsx scripts/test/seed-two-orgs.ts
 *   (Returns JSON with the seeded ids to stdout.)
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.TEST_SUPABASE_URL
const serviceKey = process.env.TEST_SUPABASE_SERVICE_KEY

if (!url || !serviceKey) {
  console.error('Missing TEST_SUPABASE_URL or TEST_SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export type SeedFixture = {
  userA: { id: string; email: string; password: string }
  userB: { id: string; email: string; password: string }
  orgA: { id: string; slug: string }
  orgB: { id: string; slug: string }
  listingAId: string
  listingBId: string
}

export async function seedTwoOrgs(): Promise<SeedFixture> {
  const password = 'TestPassword123!'
  const emailA = 'rls-test-a@example.com'
  const emailB = 'rls-test-b@example.com'

  // Upsert auth users (idempotent — if they exist, look them up).
  const userA = await ensureAuthUser(emailA, password)
  const userB = await ensureAuthUser(emailB, password)

  const orgA = await ensureOrg(userA.id, `u-${userA.id}`, 'Test Org A')
  const orgB = await ensureOrg(userB.id, `u-${userB.id}`, 'Test Org B')

  await ensureMembership(orgA.id, userA.id, 'owner')
  await ensureMembership(orgB.id, userB.id, 'owner')

  const listingAId = await ensureListing(orgA.id, userA.id, 'Seed listing A')
  const listingBId = await ensureListing(orgB.id, userB.id, 'Seed listing B')

  return {
    userA: { id: userA.id, email: emailA, password },
    userB: { id: userB.id, email: emailB, password },
    orgA,
    orgB,
    listingAId,
    listingBId,
  }
}

async function ensureAuthUser(email: string, password: string): Promise<{ id: string }> {
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const hit = existing?.users.find((u) => u.email === email)
  if (hit) return { id: hit.id }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`createUser failed for ${email}: ${error?.message}`)
  return { id: data.user.id }
}

async function ensureOrg(ownerId: string, slug: string, name: string): Promise<{ id: string; slug: string }> {
  const { data: existing } = await admin
    .from('organizations')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) return existing as any

  const { data, error } = await admin
    .from('organizations')
    .insert({ slug, name, owner_user_id: ownerId, plan: 'trialing', subscription_status: 'trialing' })
    .select('id, slug')
    .single()
  if (error) throw new Error(`org insert failed: ${error.message}`)
  return data as any
}

async function ensureMembership(orgId: string, userId: string, role: 'owner' | 'admin' | 'member' | 'viewer') {
  await admin
    .from('organization_members')
    .upsert({ organization_id: orgId, user_id: userId, role }, { onConflict: 'organization_id,user_id' })
}

async function ensureListing(orgId: string, userId: string, title: string): Promise<string> {
  const { data: existing } = await admin
    .from('channel_listings')
    .select('id')
    .eq('organization_id', orgId)
    .eq('title', title)
    .maybeSingle()
  if (existing) return existing.id as string

  const { data, error } = await admin
    .from('channel_listings')
    .insert({
      organization_id: orgId,
      user_id: userId,
      title,
      price: 19.99,
      quantity: 1,
      status: 'draft',
    })
    .select('id')
    .single()
  if (error) throw new Error(`listing insert failed: ${error.message}`)
  return data.id as string
}

// Allow direct invocation via `tsx scripts/test/seed-two-orgs.ts`
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  seedTwoOrgs()
    .then((f) => {
      console.log(JSON.stringify(f, null, 2))
      process.exit(0)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
