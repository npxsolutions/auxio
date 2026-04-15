import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('ENABLE_AI_CATEGORY_SUGGEST', '0')
vi.stubEnv('ANTHROPIC_API_KEY', '')

import { extractAspects, aspectMapToPayload } from '../aspects'

describe('aspects enrichment', () => {
  it('deterministic mapping: Shopify vendor + options → Brand/Size/Colour', async () => {
    const map = await extractAspects(
      {
        title: 'Breton Stripe T-Shirt',
        brand: 'Acme',
        vendor: 'Acme',
        options: [
          { name: 'Size', value: 'M' },
          { name: 'Colour', value: 'Navy' },
        ],
      },
      '15687', // Women's T-Shirts
    )
    expect(map.Brand?.value).toBe('Acme')
    expect(map.Brand?.source).toBe('shopify_field')
    expect(map.Size?.value).toBe('M')
    expect(map.Colour?.value).toBe('Navy')
    expect(map.Colour?.source).toBe('shopify_field')
  })

  it('metafield override beats title inference', async () => {
    const map = await extractAspects(
      {
        title: 'Red Linen Dress',   // would infer Red, Linen
        brand: 'Acme',
        metafields: [
          { namespace: 'custom', key: 'color',    value: 'Crimson' },
          { namespace: 'custom', key: 'material', value: 'Silk' },
        ],
        options: [{ name: 'Size', value: '10' }],
      },
      '63861',
    )
    expect(map.Colour?.value).toBe('Crimson')
    expect(map.Colour?.source).toBe('metafield')
    expect(map.Material?.value).toBe('Silk')
    expect(map.Material?.source).toBe('metafield')
  })

  it('missing metafield + no inferable signal → aspect absent (no AI with flag off)', async () => {
    const map = await extractAspects(
      { title: 'Plain item', brand: 'Acme', options: [] },
      '63861',
    )
    // Material cannot be inferred from "Plain item" and there is no metafield
    expect(map.Material).toBeUndefined()
    // Size also absent because no Size option and no metafield
    expect(map.Size).toBeUndefined()
    // Brand still there (from shopify_field)
    expect(map.Brand?.value).toBe('Acme')
  })

  it('Condition defaults to "New" when nothing supplied (generic fallback)', async () => {
    // Unseeded category id → GENERIC_ASPECTS applies, which lists Condition.
    const map = await extractAspects({ title: 'x', brand: 'B' }, '99999999')
    expect(map.Condition?.value).toBe('New')
    expect(map.Condition?.source).toBe('inferred')
  })

  it('aspectMapToPayload flattens to Record<string,string>', async () => {
    const map = await extractAspects(
      { title: 'Red dress', brand: 'Acme', options: [{ name: 'Size', value: 'S' }] },
      '63861',
    )
    const payload = aspectMapToPayload(map)
    expect(payload.Brand).toBe('Acme')
    expect(payload.Size).toBe('S')
    expect(typeof payload.Brand).toBe('string')
  })
})
