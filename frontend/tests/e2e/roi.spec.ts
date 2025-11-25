import { test, expect } from '@playwright/test'

test.describe('ROI Calculator Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/roi')
  })

  test('should display page header', async ({ page }) => {
    await expect(page.locator('h1:has-text("ROI Calculator")')).toBeVisible()
    await expect(page.locator('text=Track your return on investment')).toBeVisible()
  })

  test('should display all stat cards', async ({ page }) => {
    await expect(page.locator('text=AI Sessions')).toBeVisible()
    await expect(page.locator('text=Conversions')).toBeVisible()
    await expect(page.locator('text=Revenue')).toBeVisible()
    await expect(page.locator('text=ROI')).toBeVisible()
  })

  test('should display Traffic by AI Source section', async ({ page }) => {
    await expect(page.locator('text=Traffic by AI Source')).toBeVisible()
  })

  test('should display Record Conversion form', async ({ page }) => {
    await expect(page.locator('text=Record Conversion')).toBeVisible()
    await expect(page.locator('text=Event Name')).toBeVisible()
    await expect(page.locator('text=AI Source')).toBeVisible()
    await expect(page.locator('text=Value')).toBeVisible()
  })

  test('should display ROI Settings form', async ({ page }) => {
    await expect(page.locator('text=ROI Settings')).toBeVisible()
    await expect(page.locator('text=Conversion Goal')).toBeVisible()
    await expect(page.locator('text=Average Conversion Value')).toBeVisible()
  })

  test('should have AI source dropdown with options', async ({ page }) => {
    const sourceSelect = page.locator('select').first()
    await sourceSelect.click()

    // Check for AI source options
    await expect(page.locator('option:has-text("ChatGPT")')).toBeVisible()
    await expect(page.locator('option:has-text("Claude")')).toBeVisible()
    await expect(page.locator('option:has-text("Gemini")')).toBeVisible()
  })

  test('should record a conversion', async ({ page }) => {
    // Fill in conversion form
    await page.fill('input[placeholder*="purchase"]', 'test_signup')

    const valueInput = page.locator('input[type="number"]').first()
    await valueInput.fill('100')

    // Click Record Conversion
    await page.click('button:has-text("Record Conversion")')

    // Should show success or the conversion in the list
    await page.waitForTimeout(2000) // Wait for API response
  })

  test('should save ROI settings', async ({ page }) => {
    // Find the settings form inputs
    const goalInput = page.locator('input[placeholder*="purchase, signup"]')
    await goalInput.fill('demo_request')

    const valueInputs = page.locator('input[type="number"]')
    const avgValueInput = valueInputs.nth(1) // Second number input should be avg value
    await avgValueInput.fill('250')

    // Click Save Settings
    await page.click('button:has-text("Save Settings")')

    // Wait for response
    await page.waitForTimeout(2000)
  })

  test('should display Recent Conversions section', async ({ page }) => {
    await expect(page.locator('text=Recent Conversions')).toBeVisible()
  })

  test('should change time period filter', async ({ page }) => {
    // Find the period dropdown in Traffic section
    const periodSelect = page.locator('select').last()
    await periodSelect.selectOption('7d').catch(async () => {
      await periodSelect.click()
      await page.click('text=Last 7 days')
    })
  })
})
