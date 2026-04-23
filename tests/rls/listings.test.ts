/**
 * listings — org-scoped RLS.
 *
 * Proves: user A cannot see org B listings even with identical SELECT shape.
 * Proves: user A cannot INSERT into org B (SHOULD fail with 42501).
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { seed, withUserClient } from './_helpers'

describe('listings org-scoped RLS', () => {
  let fixture: Awaited<ReturnType<typeof seed>>

  beforeAll(async () => {
    fixture = await seed()
  }, 30_000)

  it('user A can read their own listing', async () => {
    const sb = await withUserClient(fixture.userA.email, fixture.userA.password)
    const { data, error } = await sb.from('listings').select('id').eq('id', fixture.listingAId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('user A cannot read user B listings', async () => {
    const sb = await withUserClient(fixture.userA.email, fixture.userA.password)
    const { data } = await sb.from('listings').select('id').eq('id', fixture.listingBId)
    expect(data ?? []).toHaveLength(0) // RLS filters — no error, just empty rows
  })

  it('user A cannot INSERT a listing targeting org B', async () => {
    const sb = await withUserClient(fixture.userA.email, fixture.userA.password)
    const { error } = await sb.from('listings').insert({
      organization_id: fixture.orgB.id,
      user_id: fixture.userA.id,
      title: 'RLS violation attempt',
      price: 1,
      quantity: 1,
      status: 'draft',
    })
    expect(error).not.toBeNull()
    // 42501 = insufficient_privilege (RLS WITH CHECK failed)
    expect(error?.code === '42501' || /row-level security/i.test(error?.message ?? '')).toBe(true)
  })

  it('UPDATE cannot move a listing to org B', async () => {
    const sb = await withUserClient(fixture.userA.email, fixture.userA.password)
    const { error } = await sb
      .from('listings')
      .update({ organization_id: fixture.orgB.id })
      .eq('id', fixture.listingAId)
    // Either blocked at WITH CHECK or the row becomes invisible after the move.
    expect(error).not.toBeNull()
  })
})
