import { beforeAll, describe, expect, it } from 'vitest'
import { seed, serviceClient, withUserClient } from './_helpers'

/**
 * Validates membership-driven access. Adding user A to org B (as a member)
 * must make B's rows visible to A immediately. Removing them must revoke
 * access on the next query.
 */
describe('organization_members — access flows with membership', () => {
  let fixture: Awaited<ReturnType<typeof seed>>

  beforeAll(async () => {
    fixture = await seed()
  }, 30_000)

  it('user A initially cannot see org B listings', async () => {
    const sb = await withUserClient(fixture.userA.email, fixture.userA.password)
    const { data } = await sb.from('listings').select('id').eq('organization_id', fixture.orgB.id)
    expect(data ?? []).toHaveLength(0)
  })

  it('adding A to org B grants access', async () => {
    const admin = serviceClient()
    await admin.from('organization_members').upsert(
      {
        organization_id: fixture.orgB.id,
        user_id: fixture.userA.id,
        role: 'member',
        accepted_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,user_id' },
    )

    const sb = await withUserClient(fixture.userA.email, fixture.userA.password)
    const { data } = await sb.from('listings').select('id').eq('organization_id', fixture.orgB.id)
    expect((data ?? []).length).toBeGreaterThanOrEqual(1)
  })

  it('removing A from org B revokes access immediately', async () => {
    const admin = serviceClient()
    await admin
      .from('organization_members')
      .delete()
      .eq('organization_id', fixture.orgB.id)
      .eq('user_id', fixture.userA.id)

    const sb = await withUserClient(fixture.userA.email, fixture.userA.password)
    const { data } = await sb.from('listings').select('id').eq('organization_id', fixture.orgB.id)
    expect(data ?? []).toHaveLength(0)
  })
})
