import { test, expect } from '@playwright/test'

test.describe('Freshness Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/freshness')
  })

  test('should display page header and stats', async ({ page }) => {
    await expect(page.locator('h1:has-text("Content Freshness")')).toBeVisible()
    await expect(page.locator('text=Avg Freshness')).toBeVisible()
    await expect(page.locator('text=Monitored Pages')).toBeVisible()
    await expect(page.locator('text=Stale Pages')).toBeVisible()
    await expect(page.locator('text=Unread Alerts')).toBeVisible()
  })

  test('should display Add Page button', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Page")')).toBeVisible()
  })

  test('should open add page modal when clicking Add Page', async ({ page }) => {
    await page.click('button:has-text("Add Page")')

    // Modal should appear with URL input
    await expect(page.locator('input[placeholder*="URL"]').or(page.locator('input[placeholder*="url"]'))).toBeVisible({ timeout: 5000 })
  })

  test('should display empty state when no pages monitored', async ({ page }) => {
    // Check for empty state message
    const emptyState = page.locator('text=No pages being monitored').or(page.locator('text=Add your first page'))
    await expect(emptyState).toBeVisible()
  })

  test('should display Check All button', async ({ page }) => {
    await expect(page.locator('button:has-text("Check All")')).toBeVisible()
  })

  test('should add a page and display it in the list', async ({ page }) => {
    // Click Add Page
    await page.click('button:has-text("Add Page")')

    // Fill in URL
    const urlInput = page.locator('input[placeholder*="URL"]').or(page.locator('input[placeholder*="url"]'))
    await urlInput.fill('https://example.com/test-page')

    // Submit
    await page.click('button:has-text("Add")').catch(() => {
      // Try alternative button text
      return page.click('button:has-text("Save")')
    })

    // Verify page appears in list (with some tolerance for API response)
    await expect(page.locator('text=example.com')).toBeVisible({ timeout: 10000 })
  })
})
