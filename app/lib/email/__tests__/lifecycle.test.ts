import { describe, it, expect } from 'vitest'
import {
  welcomeEmail,
  day1NudgeEmail,
  day3NudgeEmail,
  day7ActiveEmail,
  day7DormantEmail,
  LIFECYCLE_TEMPLATES,
} from '../lifecycle'

const user = { id: 'u1', email: 'op@shop.com', firstName: 'Sam' }

function assertShape(r: { subject: string; html: string; text: string }) {
  expect(typeof r.subject).toBe('string')
  expect(r.subject.length).toBeGreaterThan(0)
  expect(r.html).toContain('<!DOCTYPE html>')
  expect(r.html).toContain('Meridia')
  expect(r.text.length).toBeGreaterThan(20)
}

describe('email/lifecycle templates', () => {
  it('welcomeEmail includes first name and onboarding link', () => {
    const r = welcomeEmail(user)
    assertShape(r)
    expect(r.subject).toMatch(/welcome/i)
    expect(r.html).toContain('Sam')
    expect(r.html).toContain('/onboarding')
    expect(r.text).toContain('Sam')
  })

  it('welcomeEmail omits comma when firstName is null', () => {
    const r = welcomeEmail({ id: 'u2', email: 'x@y.com', firstName: null })
    expect(r.html).not.toContain(', Sam')
    expect(r.html).toContain('Welcome to Meridia.')
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

  it('day7ActiveEmail singular when orders7d === 1', () => {
    const r = day7ActiveEmail(user, { orders7d: 1, gmv7d: 10, topChannel: 'eBay' })
    expect(r.html).toContain('1 order')
    expect(r.html).not.toContain('1 orders')
  })

  it('day7DormantEmail nudges to setup call', () => {
    const r = day7DormantEmail(user)
    assertShape(r)
    expect(r.html).toContain('/contact')
  })

  it('LIFECYCLE_TEMPLATES exposes all five templates', () => {
    expect(Object.keys(LIFECYCLE_TEMPLATES).sort()).toEqual(
      ['day1_nudge', 'day3_nudge', 'day7_active', 'day7_dormant', 'welcome'].sort()
    )
  })
})
