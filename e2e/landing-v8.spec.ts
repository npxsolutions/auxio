import { test, expect } from '@playwright/test'

test('landing/v8 renders the LiveMap with at least one hub label', async ({ page }) => {
  await page.goto('/landing/v8')
  // H1 / hero should render.
  await expect(page.locator('h1').first()).toBeVisible()

  // LiveMap is a distinctive feature of v8 — check at least one known hub label.
  // Labels pool includes London, Manchester, Birmingham, New York, Los Angeles, etc.
  const hub = page
    .getByText(/London|Manchester|Birmingham|New York|Los Angeles|Berlin|Paris/i)
    .first()
  await expect(hub).toBeVisible({ timeout: 10_000 })
})
