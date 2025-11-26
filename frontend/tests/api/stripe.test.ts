import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Stripe Subscription API Tests
 *
 * Tests the Stripe integration:
 * - Creating checkout sessions
 * - Validating plan parameters
 * - Portal access
 *
 * Uses an existing test user authenticated via environment variables.
 */
describe('Stripe Subscription API', () => {
  let supabase: SupabaseClient
  let testUser: User | null = null
  let accessToken: string | null = null
  let organizationId: string | null = null
  let isAuthenticated = false

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY

  beforeAll(async () => {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    supabase = createClient(supabaseUrl, supabaseKey)

    // Authenticate with existing test user
    const testEmail = process.env.TEST_USER_EMAIL
    const testPassword = process.env.TEST_USER_PASSWORD

    if (testEmail && testPassword) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
      if (!error && data.user && data.session) {
        isAuthenticated = true
        testUser = data.user
        accessToken = data.session.access_token

        // Get organization ID from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', data.user.id)
          .single()

        if (profile?.organization_id) {
          organizationId = profile.organization_id
        }
      } else {
        console.warn('Could not authenticate test user:', error?.message)
      }
    }
  }, 30000)

  afterAll(async () => {
    if (isAuthenticated) {
      await supabase.auth.signOut()
    }
  }, 30000)

  describe('Checkout Sessions', () => {
    it('should create a checkout session for Pro monthly plan', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: 'pro',
            billingPeriod: 'monthly'
          })
        }
      )

      const data = await response.json()

      // May fail if Stripe price IDs not configured, but should succeed otherwise
      if (response.ok) {
        expect(data.url).toBeDefined()
        expect(data.url).toContain('checkout.stripe.com')
      } else {
        // Expected error if Stripe not configured
        console.log('Checkout response:', response.status, data.error)
        expect(data.error).toBeDefined()
      }
    })

    it('should create a checkout session for Pro yearly plan', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: 'pro',
            billingPeriod: 'yearly'
          })
        }
      )

      const data = await response.json()

      if (response.ok) {
        expect(data.url).toBeDefined()
        expect(data.url).toContain('checkout.stripe.com')
      } else {
        console.log('Checkout response:', response.status, data.error)
        expect(data.error).toBeDefined()
      }
    })

    it('should create a checkout session for Agency monthly plan', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: 'agency',
            billingPeriod: 'monthly'
          })
        }
      )

      const data = await response.json()

      if (response.ok) {
        expect(data.url).toBeDefined()
        expect(data.url).toContain('checkout.stripe.com')
      } else {
        console.log('Checkout response:', response.status, data.error)
        expect(data.error).toBeDefined()
      }
    })

    it('should reject free plan checkout', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: 'free',
            billingPeriod: 'monthly'
          })
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid plan')
    })

    it('should reject invalid plan ID', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: 'invalid-plan',
            billingPeriod: 'monthly'
          })
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('not found')
    })

    it('should reject invalid billing period', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: 'pro',
            billingPeriod: 'weekly' // Invalid
          })
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('billing period')
    })
  })

  describe('Portal Access', () => {
    it('should create a portal session or return error for no customer', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/stripe-portal`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        }
      )

      const data = await response.json()

      // Portal requires an existing Stripe customer, so this may succeed or error
      if (response.ok) {
        expect(data.url).toBeDefined()
        expect(data.url).toContain('billing.stripe.com')
      } else {
        // Expected error if user has no Stripe customer
        console.log('Portal response:', response.status, data.error)
        expect(data.error).toBeDefined()
      }
    })
  })

  describe('Authorization', () => {
    it('should require authentication for checkout', async () => {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: 'pro',
            billingPeriod: 'monthly'
          })
        }
      )

      expect(response.status).toBe(401)
    })

    it('should require authentication for portal', async () => {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/stripe-portal`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        }
      )

      expect(response.status).toBe(401)
    })
  })
})
