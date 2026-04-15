import { describe, it, expect, vi } from 'vitest'

// Ensure AI path never fires in unit tests
vi.stubEnv('ENABLE_AI_CATEGORY_SUGGEST', '0')
vi.stubEnv('ANTHROPIC_API_KEY', '')

import { suggestEbayCategory, __internals } from '../category-suggester'

describe('category-suggester', () => {
  it('exact-map hit: product_type "dress" → Women\'s Dresses 63861', async () => {
    const s = await suggestEbayCategory({ title: 'Floral Summer Dress', product_type: 'Dress' })
    expect(s.length).toBeGreaterThan(0)
    expect(s[0].source).toBe('exact_map')
    expect(s[0].ebayCategoryId).toBe('63861')
    expect(s[0].confidence).toBeGreaterThanOrEqual(0.9)
  })

  it('fuzzy-map fallback: unknown product_type but tokens match a seed', async () => {
    const s = await suggestEbayCategory({
      title: 'Premium Running Sneakers',
      product_type: 'Footwear',
      tags: ['trainers', 'athletic'],
    })
    expect(s.length).toBeGreaterThan(0)
    // Top match should be some shoe/trainer category, sourced from fuzzy matcher
    expect(['fuzzy_map', 'exact_map']).toContain(s[0].source)
    expect(s[0].ebayCategoryPath.toLowerCase()).toMatch(/shoe|trainer/)
  })

  it('unknown input returns empty when AI is disabled', async () => {
    const s = await suggestEbayCategory({ title: 'xyzzy quux frobnicator', product_type: 'gibberish_zzz' })
    expect(s).toEqual([])
  })

  it('tokenize drops stopwords and punctuation', () => {
    const tokens = __internals.tokenize('The Red, Silk Dress for Women!')
    expect(tokens).toContain('red')
    expect(tokens).toContain('silk')
    expect(tokens).toContain('dress')
    expect(tokens).not.toContain('the')
    expect(tokens).not.toContain('for')
  })

  it('hashInput is stable on same input shape', () => {
    const a = __internals.hashInput({ title: 'Red Dress', product_type: 'Dress', brand: 'ACME', tags: ['summer', 'red'] })
    const b = __internals.hashInput({ title: 'red dress', product_type: 'DRESS', brand: 'acme', tags: ['red', 'summer'] })
    expect(a).toBe(b)
  })
})
