import { describe, it, expect } from 'vitest'
import {
  welcomeEmail,
  day1NudgeEmail,
  day3NudgeEmail,
  day7ActiveEmail,
  day7DormantEmail,
  confirmationEmail,
  passwordResetEmail,
  trialEndingEmail,
  trialExpiredEmail,
  invoiceEmail,
  feedHealthDigest,
  LIFECYCLE_TEMPLATES,
} from '../lifecycle'

const user = { id: 'u1', email: 'op@shop.com', firstName: 'Sam' }

function assertShape(r: { subject: string; html: string; text: string }) {
  expect(typeof r.subject).toBe('string')
  expect(r.subject.length).toBeGreaterThan(0)
  expect(r.html).toContain('<!DOCTYPE html>')
  expect(r.html).toContain('Palvento')
  expect(r.text.length).toBeGreaterThan(20)
}

describe('email/lifecycle templates', () => {
  it('welcomeEmail includes first name and onboarding link', () => {
    const r = welcomeEmail(user)
    assertShape(r)
    expect(r.html).toContain('Sam')
    expect(r.html).toContain('/onboarding')
    expect(r.text).toContain('Sam')
  })

  it('welcomeEmail omits comma when firstName is null', () => {
    const r = welcomeEmail({ id: 'u2', email: 'x@y.com', firstName: null })
    expect(r.html).not.toContain(', Sam')
    expect(r.html).toContain('Your account is ready.')
  })

  it('day1NudgeEmail returns subject/html/text and links onboarding', () => {
    const r = day1NudgeEmail(user)
    assertShape(r)
    expect(r.html).toContain('/onboarding')
  })

  it('day3NudgeEmail references dashboard', () => {
    const r = day3NudgeEmail(user)
    assertShape(r)
    expect(r.html).toContain('/dashboard')
  })

  it('day7ActiveEmail substitutes orders / gmv / topChannel', () => {
    const r = day7ActiveEmail(user, { orders7d: 37, gmv7d: 12450, topChannel: 'Shopify' })
    assertShape(r)
    expect(r.html).toContain('37')
    expect(r.html).toContain('Shopify')
    // formatted GBP thousand-separator
    expect(r.html).toMatch(/12,450/)
    expect(r.text).toContain('37')
  })

  it('day7DormantEmail nudges to setup call', () => {
    const r = day7DormantEmail(user)
    assertShape(r)
    expect(r.html).toContain('/contact')
  })

  it('confirmationEmail includes confirm link', () => {
    const r = confirmationEmail(user)
    assertShape(r)
    expect(r.subject).toBe('Confirm your email')
    expect(r.html).toContain('/auth/confirm')
  })

  it('passwordResetEmail includes reset link', () => {
    const r = passwordResetEmail(user)
    assertShape(r)
    expect(r.subject).toBe('Reset your password')
    expect(r.html).toContain('/auth/reset-password')
  })

  it('trialEndingEmail shows days remaining', () => {
    const r = trialEndingEmail(user, { trialDaysLeft: 3 })
    assertShape(r)
    expect(r.subject).toContain('3 days')
    expect(r.html).toContain('/settings/billing')
  })

  it('trialExpiredEmail links to billing', () => {
    const r = trialExpiredEmail(user)
    assertShape(r)
    expect(r.subject).toBe('Your trial has ended')
    expect(r.html).toContain('/settings/billing')
  })

  it('invoiceEmail shows amount and plan', () => {
    const r = invoiceEmail(user, {
      invoiceAmount: 49,
      planName: 'Pro',
      invoicePeriodStart: '1 Mar 2026',
      invoicePeriodEnd: '31 Mar 2026',
      invoiceNumber: 'INV-001',
    })
    assertShape(r)
    expect(r.html).toContain('49.00')
    expect(r.html).toContain('Pro')
    expect(r.html).toContain('INV-001')
  })

  it('feedHealthDigest shows score and listings', () => {
    const r = feedHealthDigest(user, {
      feedHealthScore: 92,
      totalListings: 1400,
      errorsCaught: 3,
      optimizationTips: ['Update 12 stale titles', 'Fix missing images on 4 listings'],
    })
    assertShape(r)
    expect(r.html).toContain('92/100')
    expect(r.html).toContain('1,400')
    expect(r.html).toContain('Update 12 stale titles')
  })

  it('LIFECYCLE_TEMPLATES exposes all templates', () => {
    expect(Object.keys(LIFECYCLE_TEMPLATES).sort()).toEqual(
      [
        'confirmation',
        'day1_nudge',
        'day3_nudge',
        'day7_active',
        'day7_dormant',
        'feed_health_digest',
        'invoice',
        'password_reset',
        'trial_ending',
        'trial_expired',
        'welcome',
      ].sort()
    )
  })
})
