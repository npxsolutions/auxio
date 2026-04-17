import { describe, it, expect } from 'vitest'
import { ETSY_RULES, evaluateRules, validateContext } from '../validator'

const baseListing = {
  id: 'l1',
  user_id: 'u1',
  title: 'Handmade Silver Necklace',
  description: 'A beautiful handmade silver necklace with gemstone pendant.',
  price: 25.00,
  quantity: 3,
  images: ['https://cdn/a.jpg', 'https://cdn/b.jpg'],
  tags: ['necklace', 'silver', 'handmade'],
  who_made: 'i_did',
  when_made: 'made_to_order',
  is_supply: false,
  materials: ['silver', 'gemstone'],
}

const baseListingChannel = {
  external_category_id: 'tax_123',
  shipping_profile_id: 'sp_1',
}

describe('Etsy validator rules', () => {
  it('valid listing passes all rules', async () => {
    const ctx = { listing: baseListing, channelRow: null, listingChannel: baseListingChannel }
    const out = await validateContext('etsy', ctx)
    expect(out.passed).toBe(true)
    expect(out.healthScore).toBe(100)
  })

  it('ETSY_TITLE_LENGTH — title > 140 chars triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, title: 'x'.repeat(150) },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    expect(issues.find(i => i.rule.id === 'ETSY_TITLE_LENGTH')).toBeTruthy()
  })

  it('ETSY_DESCRIPTION_REQUIRED — empty description triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, description: '' },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    expect(issues.find(i => i.rule.id === 'ETSY_DESCRIPTION_REQUIRED')).toBeTruthy()
  })

  it('ETSY_DESCRIPTION_MAX_LENGTH — description > 10000 chars triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, description: 'a'.repeat(11000) },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    expect(issues.find(i => i.rule.id === 'ETSY_DESCRIPTION_MAX_LENGTH')).toBeTruthy()
  })

  it('ETSY_TAGS_MAX_COUNT — more than 13 tags triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, tags: Array.from({ length: 15 }, (_, i) => `tag${i}`) },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    expect(issues.find(i => i.rule.id === 'ETSY_TAGS_MAX_COUNT')).toBeTruthy()
  })

  it('ETSY_TAG_LENGTH — tag > 20 chars triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, tags: ['a'.repeat(25)] },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    expect(issues.find(i => i.rule.id === 'ETSY_TAG_LENGTH')).toBeTruthy()
  })

  it('ETSY_PRICE_MINIMUM — price below $0.20 triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, price: 0.10 },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    expect(issues.find(i => i.rule.id === 'ETSY_PRICE_MINIMUM')).toBeTruthy()
  })

  it('ETSY_QUANTITY_REQUIRED — zero quantity triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, quantity: 0 },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    expect(issues.find(i => i.rule.id === 'ETSY_QUANTITY_REQUIRED')).toBeTruthy()
  })

  it('ETSY_IMAGES_REQUIRED — no images triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, images: [] },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    expect(issues.find(i => i.rule.id === 'ETSY_IMAGES_REQUIRED')).toBeTruthy()
  })

  it('ETSY_IMAGES_REQUIRED — more than 10 images triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, images: Array.from({ length: 12 }, (_, i) => `https://cdn/${i}.jpg`) },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    expect(issues.find(i => i.rule.id === 'ETSY_IMAGES_REQUIRED')).toBeTruthy()
  })

  it('ETSY_TAXONOMY_REQUIRED — missing taxonomy triggers error', async () => {
    const ctx = {
      listing: baseListing,
      channelRow: null,
      listingChannel: null,
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    expect(issues.find(i => i.rule.id === 'ETSY_TAXONOMY_REQUIRED')).toBeTruthy()
  })

  it('ETSY_SHIPPING_PROFILE — missing shipping profile triggers error', async () => {
    const ctx = {
      listing: baseListing,
      channelRow: null,
      listingChannel: { external_category_id: 'tax_123' },
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    expect(issues.find(i => i.rule.id === 'ETSY_SHIPPING_PROFILE')).toBeTruthy()
  })

  it('ETSY_WHO_MADE_REQUIRED — missing who_made triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, who_made: undefined },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    expect(issues.find(i => i.rule.id === 'ETSY_WHO_MADE_REQUIRED')).toBeTruthy()
  })

  it('ETSY_WHEN_MADE_REQUIRED — missing when_made triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, when_made: undefined },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    expect(issues.find(i => i.rule.id === 'ETSY_WHEN_MADE_REQUIRED')).toBeTruthy()
  })

  it('ETSY_IS_SUPPLY_REQUIRED — missing is_supply triggers error', async () => {
    const ctx = {
      listing: { ...baseListing, is_supply: undefined },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    expect(issues.find(i => i.rule.id === 'ETSY_IS_SUPPLY_REQUIRED')).toBeTruthy()
  })

  it('ETSY_MATERIALS_RECOMMENDED — missing materials triggers info', async () => {
    const ctx = {
      listing: { ...baseListing, materials: [] },
      channelRow: null,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, ETSY_RULES)
    const mat = issues.find(i => i.rule.id === 'ETSY_MATERIALS_RECOMMENDED')
    expect(mat).toBeTruthy()
    expect(mat!.rule.severity).toBe('info')
  })
})
