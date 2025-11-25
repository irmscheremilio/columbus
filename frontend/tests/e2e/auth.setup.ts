import { test as setup, expect } from '@playwright/test'

const authFile = 'tests/e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login')

  // Fill in credentials from environment variables
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set')
  }

  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard')
  await expect(page.locator('text=Dashboard')).toBeVisible()

  // Save signed-in state
  await page.context().storageState({ path: authFile })
})
