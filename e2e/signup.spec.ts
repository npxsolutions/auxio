import { test, expect } from '@playwright/test'

test('signup form renders email + password fields (smoke — does not submit)', async ({ page }) => {
  await page.goto('/signup')

  const email = page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first()
  const password = page.getByLabel(/password/i).or(page.locator('input[type="password"]')).first()

  await expect(email).toBeVisible()
  await expect(password).toBeVisible()
})
