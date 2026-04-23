import { beforeAll, describe, expect, it } from 'vitest'
import { seed, serviceClient, withUserClient } from './_helpers'

describe('channels org-scoped RLS', () => {
  let fixture: Awaited<ReturnType<typeof seed>>
  let channelAId: string

  beforeAll(async () => {
    fixture = await seed()
    const admin = serviceClient()
    const { data, error } = await admin
      .from('channels')
      .upsert(
        {
          organization_id: fixture.orgA.id,
          user_id: fixture.userA.id,
          type: 'shopify',
          shop_domain: 'rls-test-a.myshopify.com',
          shop_name: 'RLS Test Shop A',
          active: true,
        },
        { onConflict: 'user_id,type' },
      )
      .select('id')
      .single()
    if (error) throw error
    channelAId = data.id as string
  }, 30_000)

  it('user A sees their channel', async () => {
    const sb = await withUserClient(fixture.userA.email, fixture.userA.password)
    const { data } = await sb.from('channels').select('id').eq('id', channelAId)
    expect(data ?? []).toHaveLength(1)
  })

  it('user B does NOT see A\'s channel', async () => {
    const sb = await withUserClient(fixture.userB.email, fixture.userB.password)
    const { data } = await sb.from('channels').select('id').eq('id', channelAId)
    expect(data ?? []).toHaveLength(0)
  })
})
