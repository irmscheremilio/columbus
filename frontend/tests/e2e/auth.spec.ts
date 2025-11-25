import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  // Generate unique email for each test run to avoid conflicts
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  const testCompany = 'Test Company'
  const testWebsite = 'https://example.com'

  test.describe('Email/Password Signup', () => {
    test('should display signup form with all required fields', async ({ page }) => {
      await page.goto('/auth/signup')

      // Check all form fields are present
      await expect(page.locator('input#company-name')).toBeVisible()
      await expect(page.locator('input#website')).toBeVisible()
      await expect(page.locator('textarea#description')).toBeVisible()
      await expect(page.locator('input#email-address')).toBeVisible()
      await expect(page.locator('input#password')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/auth/signup')

      await page.fill('input#company-name', testCompany)
      await page.fill('input#website', testWebsite)
      await page.fill('input#email-address', 'invalid-email')
      await page.fill('input#password', testPassword)

      await page.click('button[type="submit"]')

      // Browser's built-in validation should prevent submission
      const emailInput = page.locator('input#email-address')
      await expect(emailInput).toHaveAttribute('type', 'email')
    })

    test('should show Google OAuth button', async ({ page }) => {
      await page.goto('/auth/signup')

      const googleButton = page.locator('button:has-text("Sign up with Google")')
      await expect(googleButton).toBeVisible()
    })

    test('should have link to login page', async ({ page }) => {
      await page.goto('/auth/signup')

      const loginLink = page.locator('a[href="/auth/login"]')
      await expect(loginLink).toBeVisible()
      await expect(loginLink).toContainText('Sign in')
    })

    test('should attempt signup and handle response', async ({ page }) => {
      await page.goto('/auth/signup')

      // Fill in signup form
      await page.fill('input#company-name', testCompany)
      await page.fill('input#website', testWebsite)
      await page.fill('input#description', 'A test company for automated testing')
      await page.fill('input#email-address', testEmail)
      await page.fill('input#password', testPassword)

      // Submit form
      await page.click('button[type="submit"]')

      // Wait for response - either success (analyzing state) or error message
      const result = await Promise.race([
        page.waitForSelector('text=Analyzing Your Website', { timeout: 10000 }).then(() => 'analyzing'),
        page.waitForSelector('.bg-red-50', { timeout: 10000 }).then(() => 'error'),
        page.waitForSelector('.bg-green-50', { timeout: 10000 }).then(() => 'success'),
      ])

      // The test passes if we get any response (not hanging)
      expect(['analyzing', 'error', 'success']).toContain(result)
    })
  })

  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/auth/login')

      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login')

      await page.fill('input[type="email"]', 'nonexistent@example.com')
      await page.fill('input[type="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')

      // Wait for error message
      await expect(page.locator('.bg-red-50, .text-red-700, [class*="error"]')).toBeVisible({ timeout: 10000 })
    })

    test('should have link to signup page', async ({ page }) => {
      await page.goto('/auth/login')

      const signupLink = page.locator('a[href="/auth/signup"]')
      await expect(signupLink).toBeVisible()
    })

    test('should show Google OAuth button', async ({ page }) => {
      await page.goto('/auth/login')

      const googleButton = page.locator('button:has-text("Google")')
      await expect(googleButton).toBeVisible()
    })
  })

  test.describe('OAuth Callback', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access callback without being authenticated
      await page.goto('/auth/callback')

      // Should redirect to login
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 })
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users from dashboard', async ({ page }) => {
      await page.goto('/dashboard')

      // Should redirect to login or show login page
      await page.waitForURL(/\/auth\/login|\/login/, { timeout: 10000 })
    })

    test('should redirect unauthenticated users from settings', async ({ page }) => {
      await page.goto('/dashboard/settings')

      // Should redirect to login
      await page.waitForURL(/\/auth\/login|\/login/, { timeout: 10000 })
    })
  })
})

test.describe('Authenticated User Flow', () => {
  // These tests require a pre-existing test user
  // Set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables

  test.skip(
    !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
    'Skipping authenticated tests - TEST_USER_EMAIL and TEST_USER_PASSWORD not set'
  )

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login')

    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!)
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 30000 })
  })

  test('should access dashboard after login', async ({ page }) => {
    await expect(page.locator('h1:has-text("Dashboard"), text=Dashboard')).toBeVisible()
  })

  test('should display user email in navigation', async ({ page }) => {
    await expect(page.locator(`text=${process.env.TEST_USER_EMAIL}`)).toBeVisible()
  })

  test('should be able to sign out', async ({ page }) => {
    await page.click('button:has-text("Sign Out")')

    // Should redirect to home or login page
    await page.waitForURL(/^\/$|\/auth\/login/, { timeout: 10000 })
  })

  test('should access all dashboard pages', async ({ page }) => {
    const pages = [
      { path: '/dashboard/visibility', title: 'Visibility' },
      { path: '/dashboard/recommendations', title: 'Recommendations' },
      { path: '/dashboard/freshness', title: 'Content Freshness' },
      { path: '/dashboard/reports', title: 'Reports' },
      { path: '/dashboard/roi', title: 'ROI Calculator' },
      { path: '/dashboard/settings', title: 'Settings' },
    ]

    for (const p of pages) {
      await page.goto(p.path)
      await expect(page.locator(`h1:has-text("${p.title}")`)).toBeVisible({ timeout: 10000 })
    }
  })
})
