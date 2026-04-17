import { describe, it, expect } from 'vitest'
import { AMAZON_RULES, evaluateRules, validateContext } from '../validator'

const baseListing = {
  id: 'l1',
  user_id: 'u1',
  title: 'A Perfectly Valid Amazon Product Title',
  description: 'A plain text description with no HTML tags.',
  price: 29.99,
  quantity: 10,
  brand: 'Acme',
  barcode: '0123456789012',
  images: ['https://cdn/main.jpg'],
  bullet_points: ['Point one', 'Point two', 'Point three', 'Point four', 'Point five'],
  search_terms: 'widget gadget tool',
  weight_grams: 500,
}

const baseListingChannel = { external_category_id: 'node_123' }

describe('Amazon validator rules', () => {
  it('valid listing passes all rules', async () => {
    const ctx = { listing: baseListing, channelRow: null, listingChannel: baseListingChannel }
    const out = await validateContext('amazon', ctx)
    expect(out.passed).toBe(true)
    expect(out.healthScore).toBe(100)
  })

  it('AMAZON_ASIN_FORMAT — invalid ASIN triggers warning', async () => {
    const ctx = {
      listing: { ...baseListing, asin: 'INVALID' },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    expect(issues.find(i => i.rule.id === 'AMAZON_ASIN_FORMAT')).toBeTruthy()
  })

  it('AMAZON_ASIN_FORMAT — valid ASIN passes', async () => {
    const ctx = {
      listing: { ...baseListing, asin: 'B0ABCDEF12' },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    expect(issues.find(i => i.rule.id === 'AMAZON_ASIN_FORMAT')).toBeFalsy()
  })

  it('AMAZON_TITLE_LENGTH — title > 200 chars triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, title: 'x'.repeat(250) },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    const titleIssue = issues.find(i => i.rule.id === 'AMAZON_TITLE_LENGTH')
    expect(titleIssue).toBeTruthy()
    expect(titleIssue!.rule.severity).toBe('error')
  })

  it('AMAZON_TITLE_NO_ALL_CAPS — ALL CAPS title triggers warning', async () => {
    const ctx = {
      listing: { ...baseListing, title: 'AMAZING PRODUCT FOR SALE' },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    expect(issues.find(i => i.rule.id === 'AMAZON_TITLE_NO_ALL_CAPS')).toBeTruthy()
  })

  it('AMAZON_BULLET_POINTS — fewer than 5 bullets triggers warning', async () => {
    const ctx = {
      listing: { ...baseListing, bullet_points: ['One', 'Two'] },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    expect(issues.find(i => i.rule.id === 'AMAZON_BULLET_POINTS')).toBeTruthy()
  })

  it('AMAZON_BULLET_POINT_LENGTH — bullet > 500 chars triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, bullet_points: ['x'.repeat(600)] },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    expect(issues.find(i => i.rule.id === 'AMAZON_BULLET_POINT_LENGTH')).toBeTruthy()
  })

  it('AMAZON_MAIN_IMAGE — no images triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, images: [] },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    expect(issues.find(i => i.rule.id === 'AMAZON_MAIN_IMAGE')).toBeTruthy()
  })

  it('AMAZON_PRICE_POSITIVE — zero price triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, price: 0 },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    expect(issues.find(i => i.rule.id === 'AMAZON_PRICE_POSITIVE')).toBeTruthy()
  })

  it('AMAZON_BRAND_REQUIRED — empty brand triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, brand: '' },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    expect(issues.find(i => i.rule.id === 'AMAZON_BRAND_REQUIRED')).toBeTruthy()
  })

  it('AMAZON_CATEGORY_REQUIRED — missing category triggers error', async () => {
    const ctx = {
      listing: baseListing,
      channelRow: null,
      listingChannel: null,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    expect(issues.find(i => i.rule.id === 'AMAZON_CATEGORY_REQUIRED')).toBeTruthy()
  })

  it('AMAZON_GTIN_REQUIRED — missing barcode triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, barcode: null, gtin: null },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    expect(issues.find(i => i.rule.id === 'AMAZON_GTIN_REQUIRED')).toBeTruthy()
  })

  it('AMAZON_GTIN_REQUIRED — gtin_exempt skips the check', async () => {
    const ctx = {
      listing: { ...baseListing, barcode: null, gtin: null, gtin_exempt: true },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    expect(issues.find(i => i.rule.id === 'AMAZON_GTIN_REQUIRED')).toBeFalsy()
  })

  it('AMAZON_DESCRIPTION_NO_HTML — HTML in description triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, description: '<p>Hello</p>' },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    expect(issues.find(i => i.rule.id === 'AMAZON_DESCRIPTION_NO_HTML')).toBeTruthy()
  })

  it('AMAZON_SEARCH_TERMS_LENGTH — terms > 250 bytes triggers warning', async () => {
    const ctx = {
      listing: { ...baseListing, search_terms: 'a'.repeat(300) },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    expect(issues.find(i => i.rule.id === 'AMAZON_SEARCH_TERMS_LENGTH')).toBeTruthy()
  })

  it('AMAZON_VARIATION_THEME — child without theme triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, parent_sku: 'PARENT-1', variation_theme: '' },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, AMAZON_RULES)
    expect(issues.find(i => i.rule.id === 'AMAZON_VARIATION_THEME')).toBeTruthy()
  })
})
