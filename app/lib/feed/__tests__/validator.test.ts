import { describe, it, expect } from 'vitest'
import {
  EBAY_RULES,
  evaluateRules,
  computeHealthScore,
  validateContext,
  registerChannelValidator,
  getChannelValidator,
} from '../validator'

const baseListing = {
  id: 'l1',
  user_id: 'u1',
  title: 'A perfectly valid eBay listing title',
  description: 'A clean description with no script tags.',
  price: 19.99,
  quantity: 5,
  condition: 'new',
  brand: 'Acme',
  weight_grams: 250,
  images: ['https://cdn/a.jpg', 'https://cdn/b.jpg', 'https://cdn/c.jpg', 'https://cdn/d.jpg'],
  barcode: '0123456789012',
}

const baseChannelRow = {
  metadata: {
    ebay_policies: {
      payment_policy_id: 'P1', return_policy_id: 'R1', fulfillment_policy_id: 'F1',
    },
  },
}

const baseListingChannel = { external_category_id: '12345' }

describe('validator framework', () => {
  it('listing with no images returns ERROR (EBAY_IMAGES_REQUIRED)', async () => {
    const ctx = {
      listing: { ...baseListing, images: [] },
      channelRow: baseChannelRow,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, EBAY_RULES)
    const ids = issues.map(i => i.rule.id)
    expect(ids).toContain('EBAY_IMAGES_REQUIRED')
    const errIssue = issues.find(i => i.rule.id === 'EBAY_IMAGES_REQUIRED')!
    expect(errIssue.rule.severity).toBe('error')
  })

  it('listing with title > 80 chars returns ERROR (EBAY_TITLE_LENGTH)', async () => {
    const ctx = {
      listing: { ...baseListing, title: 'x'.repeat(120) },
      channelRow: baseChannelRow,
      listingChannel: baseListingChannel,
    }
    const issues = await evaluateRules(ctx, EBAY_RULES)
    const titleIssue = issues.find(i => i.rule.id === 'EBAY_TITLE_LENGTH')
    expect(titleIssue).toBeTruthy()
    expect(titleIssue!.rule.severity).toBe('error')
    expect(titleIssue!.detail).toMatch(/120/)
  })

  it('listing with all requirements met passes with score 100', async () => {
    const ctx = {
      listing: baseListing,
      channelRow: baseChannelRow,
      listingChannel: baseListingChannel,
    }
    const out = await validateContext('ebay', ctx)
    expect(out.passed).toBe(true)
    expect(out.healthScore).toBe(100)
    expect(out.issues.length).toBe(0)
  })

  it('health score formula deducts 15 per error and 5 per warning', () => {
    const score = computeHealthScore([
      { rule: { id: 'a', severity: 'error', channel: 'ebay', message: '', remediation: '', autoFixable: false } },
      { rule: { id: 'b', severity: 'warning', channel: 'ebay', message: '', remediation: '', autoFixable: false } },
      { rule: { id: 'c', severity: 'warning', channel: 'ebay', message: '', remediation: '', autoFixable: false } },
    ])
    expect(score).toBe(100 - 15 - 5 - 5)
  })

  it('channel adapters can register dynamically (Amazon plugin pattern)', async () => {
    registerChannelValidator('amazon', {
      channel: 'amazon',
      rules: [{
        id: 'AMZ_TEST', severity: 'error', channel: 'amazon',
        message: '', remediation: '', autoFixable: false,
        evaluate: () => ({ pass: false }),
      }],
    })
    expect(getChannelValidator('amazon')).toBeTruthy()
    const out = await validateContext('amazon', { listing: {}, channelRow: null, listingChannel: null })
    expect(out.passed).toBe(false)
    expect(out.issues[0].rule.id).toBe('AMZ_TEST')
  })

  it('is idempotent — same input yields same score', async () => {
    const ctx = {
      listing: { ...baseListing, images: [] },
      channelRow: baseChannelRow,
      listingChannel: baseListingChannel,
    }
    const a = await validateContext('ebay', ctx)
    const b = await validateContext('ebay', ctx)
    expect(a.healthScore).toBe(b.healthScore)
    expect(a.issues.map(i => i.rule.id).sort()).toEqual(b.issues.map(i => i.rule.id).sort())
  })
})
