import { describe, it, expect } from 'vitest'
import { TIKTOK_RULES, evaluateRules, validateContext } from '../validator'

const baseListing = {
  id: 'l1',
  user_id: 'u1',
  title: 'Trendy Phone Case',
  description: 'A stylish phone case for all models.',
  price: 14.99,
  quantity: 50,
  brand: 'CaseCo',
  images: ['https://cdn/a.jpg', 'https://cdn/b.jpg', 'https://cdn/c.jpg'],
  weight_grams: 120,
  package_dimensions: { length: 20, width: 10, height: 3 },
}

const baseListingChannel = { external_category_id: 'cat_456' }

describe('TikTok Shop validator rules', () => {
  it('valid listing passes all rules', async () => {
    const ctx = { listing: baseListing, channelRow: null, listingChannel: baseListingChannel }
    const out = await validateContext('tiktok', ctx)
    expect(out.passed).toBe(true)
    expect(out.healthScore).toBe(100)
  })

  it('TIKTOK_TITLE_LENGTH — empty title triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, title: '' },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, TIKTOK_RULES)
    expect(issues.find(i => i.rule.id === 'TIKTOK_TITLE_LENGTH')).toBeTruthy()
  })

  it('TIKTOK_TITLE_LENGTH — title > 255 chars triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, title: 'x'.repeat(300) },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, TIKTOK_RULES)
    expect(issues.find(i => i.rule.id === 'TIKTOK_TITLE_LENGTH')).toBeTruthy()
  })

  it('TIKTOK_DESCRIPTION_REQUIRED — empty description triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, description: '' },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, TIKTOK_RULES)
    expect(issues.find(i => i.rule.id === 'TIKTOK_DESCRIPTION_REQUIRED')).toBeTruthy()
  })

  it('TIKTOK_MAIN_IMAGE — no images triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, images: [] },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, TIKTOK_RULES)
    expect(issues.find(i => i.rule.id === 'TIKTOK_MAIN_IMAGE')).toBeTruthy()
  })

  it('TIKTOK_IMAGES_RECOMMENDED — fewer than 3 images triggers warning', async () => {
    const ctx = {
      listing: { ...baseListing, images: ['https://cdn/a.jpg'] },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, TIKTOK_RULES)
    const imgIssue = issues.find(i => i.rule.id === 'TIKTOK_IMAGES_RECOMMENDED')
    expect(imgIssue).toBeTruthy()
    expect(imgIssue!.rule.severity).toBe('warning')
  })

  it('TIKTOK_PRICE_POSITIVE — zero price triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, price: 0 },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, TIKTOK_RULES)
    expect(issues.find(i => i.rule.id === 'TIKTOK_PRICE_POSITIVE')).toBeTruthy()
  })

  it('TIKTOK_INVENTORY_POSITIVE — zero quantity triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, quantity: 0 },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, TIKTOK_RULES)
    expect(issues.find(i => i.rule.id === 'TIKTOK_INVENTORY_POSITIVE')).toBeTruthy()
  })

  it('TIKTOK_CATEGORY_REQUIRED — missing category triggers error', async () => {
    const ctx = {
      listing: baseListing,
      channelRow: null,
      listingChannel: null,
    }
    const issues = await evaluateRules(ctx, TIKTOK_RULES)
    expect(issues.find(i => i.rule.id === 'TIKTOK_CATEGORY_REQUIRED')).toBeTruthy()
  })

  it('TIKTOK_BRAND_REQUIRED — empty brand triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, brand: '' },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, TIKTOK_RULES)
    expect(issues.find(i => i.rule.id === 'TIKTOK_BRAND_REQUIRED')).toBeTruthy()
  })

  it('TIKTOK_PACKAGE_WEIGHT — missing weight triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, weight_grams: 0 },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, TIKTOK_RULES)
    expect(issues.find(i => i.rule.id === 'TIKTOK_PACKAGE_WEIGHT')).toBeTruthy()
  })

  it('TIKTOK_PACKAGE_DIMENSIONS — missing dimensions triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, package_dimensions: undefined },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, TIKTOK_RULES)
    expect(issues.find(i => i.rule.id === 'TIKTOK_PACKAGE_DIMENSIONS')).toBeTruthy()
  })

  it('TIKTOK_PACKAGE_DIMENSIONS — incomplete dimensions triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, package_dimensions: { length: 10, width: 5 } },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, TIKTOK_RULES)
    expect(issues.find(i => i.rule.id === 'TIKTOK_PACKAGE_DIMENSIONS')).toBeTruthy()
  })

  it('TIKTOK_DESCRIPTION_LENGTH — description > 10000 triggers warning', async () => {
    const ctx = {
      listing: { ...baseListing, description: 'a'.repeat(12000) },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, TIKTOK_RULES)
    const descIssue = issues.find(i => i.rule.id === 'TIKTOK_DESCRIPTION_LENGTH')
    expect(descIssue).toBeTruthy()
    expect(descIssue!.rule.severity).toBe('warning')
  })
})
