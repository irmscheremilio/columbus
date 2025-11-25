import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('should display all navigation items', async ({ page }) => {
    const navItems = ['Dashboard', 'Visibility', 'Recommendations', 'Freshness', 'Reports', 'ROI', 'Settings']

    for (const item of navItems) {
      await expect(page.locator(`nav >> text=${item}`)).toBeVisible()
    }
  })

  test('should navigate to Freshness page', async ({ page }) => {
    await page.click('nav >> text=Freshness')
    await expect(page).toHaveURL('/dashboard/freshness')
    await expect(page.locator('h1:has-text("Content Freshness")')).toBeVisible()
  })

  test('should navigate to Reports page', async ({ page }) => {
    await page.click('nav >> text=Reports')
    await expect(page).toHaveURL('/dashboard/reports')
    await expect(page.locator('h1:has-text("Reports")')).toBeVisible()
  })

  test('should navigate to ROI page', async ({ page }) => {
    await page.click('nav >> text=ROI')
    await expect(page).toHaveURL('/dashboard/roi')
    await expect(page.locator('h1:has-text("ROI Calculator")')).toBeVisible()
  })

  test('should highlight active nav item', async ({ page }) => {
    await page.click('nav >> text=Freshness')

    // The active nav item should have the brand color class
    const freshnessLink = page.locator('nav >> a:has-text("Freshness")')
    await expect(freshnessLink).toHaveClass(/bg-brand/)
  })
})
