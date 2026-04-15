import { describe, it, expect } from 'vitest'
import { deriveCategoryBucket, gmvBand, PRIVACY_FLOOR_K } from '../category-buckets'

describe('deriveCategoryBucket', () => {
  it('maps a women-apparel category name to apparel-womens', () => {
    expect(
      deriveCategoryBucket({
        channel: 'ebay',
        externalCategoryId: '15687',
        categoryName: "Clothing, Shoes & Accessories > Women > Women's Clothing > Dresses",
      }),
    ).toBe('apparel-womens')
  })

  it('maps an unrecognised category to unknown', () => {
    expect(
      deriveCategoryBucket({
        channel: 'ebay',
        externalCategoryId: '99999999',
        categoryName: 'Miscellaneous whatsits and thingumabobs',
      }),
    ).toBe('unknown')
  })

  it('returns unknown on broken input', () => {
    expect(deriveCategoryBucket(null)).toBe('unknown')
    expect(deriveCategoryBucket(undefined)).toBe('unknown')
    // @ts-expect-error intentionally invalid shape
    expect(deriveCategoryBucket('just a string')).toBe('unknown')
    expect(deriveCategoryBucket({ externalCategoryId: null, categoryName: null })).toBe('unknown')
  })

  it('bands GMV correctly', () => {
    expect(gmvBand(0)).toBe('under_10k')
    expect(gmvBand(9_999)).toBe('under_10k')
    expect(gmvBand(10_000)).toBe('10k_100k')
    expect(gmvBand(250_000)).toBe('100k_500k')
    expect(gmvBand(2_000_000)).toBe('500k_plus')
    expect(gmvBand(null)).toBe('under_10k')
    expect(gmvBand(undefined)).toBe('under_10k')
  })

  it('privacy floor is 10 (k-anonymity)', () => {
    expect(PRIVACY_FLOOR_K).toBe(10)
  })
})
