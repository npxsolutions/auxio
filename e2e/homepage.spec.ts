import { test, expect } from '@playwright/test'

test('homepage renders H1 with "operating system" and a primary CTA', async ({ page }) => {
  await page.goto('/')
  const h1 = page.locator('h1').first()
  await expect(h1).toBeVisible()
  await expect(h1).toContainText(/operating system/i)

  // Primary CTA — the homepage ships a "Get started" / "Start" / "Sign up" link.
  const cta = page.getByRole('link', { name: /get started|start free|sign up|start now/i }).first()
  await expect(cta).toBeVisible()
})
