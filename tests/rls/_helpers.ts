/**
 * Shared helpers for RLS integration tests.
 *
 * Every test file imports `withUserClient(userEmail)` which returns a
 * Supabase client authenticated as that user (using the seeded password).
 * RLS is enforced on those clients — which is the whole point.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { seedTwoOrgs, type SeedFixture } from '../../scripts/test/seed-two-orgs'

const url = process.env.TEST_SUPABASE_URL
const serviceKey = process.env.TEST_SUPABASE_SERVICE_KEY
const anonKey = process.env.TEST_SUPABASE_ANON_KEY

if (!url || !serviceKey || !anonKey) {
  throw new Error(
    'RLS tests require TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_KEY, and TEST_SUPABASE_ANON_KEY',
  )
}

export async function withUserClient(email: string, password: string): Promise<SupabaseClient> {
  const sb = createClient(url!, anonKey!, { auth: { persistSession: false } })
  const { error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`)
  return sb
}

export function serviceClient(): SupabaseClient {
  return createClient(url!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function seed(): Promise<SeedFixture> {
  return await seedTwoOrgs()
}
