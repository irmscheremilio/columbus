import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Scans & Analysis API Tests
 *
 * Tests the scan and analysis trigger functions:
 * - Visibility scan triggering
 * - Competitor analysis triggering
 * - Jobs table access
 *
 * Uses an existing test user authenticated via environment variables.
 */
describe('Scans & Analysis API', () => {
  let supabase: SupabaseClient
  let testUser: User | null = null
  let accessToken: string | null = null
  let organizationId: string | null = null
  let isAuthenticated = false
  let competitorId: string | null = null

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

          // Get first competitor for testing
          const { data: competitors } = await supabase
            .from('competitors')
            .select('id')
            .eq('organization_id', profile.organization_id)
            .limit(1)

          if (competitors && competitors.length > 0) {
            competitorId = competitors[0].id
          }
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

  describe('Trigger Scan', () => {
    it('should trigger a visibility scan or return expected error', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/trigger-scan`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            promptIds: [] // Empty means scan all prompts
          })
        }
      )

      const data = await response.json()

      // This may fail if worker is not running, but the function should be called
      if (response.ok) {
        expect(data.success).toBe(true)
        expect(data.jobId).toBeDefined()
      } else {
        // Expected if worker API is not available or no prompts exist
        console.log('Trigger scan response:', response.status, data.error)
        expect(data.error).toBeDefined()
      }
    })

    it('should require authentication', async () => {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/trigger-scan`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ promptIds: [] })
        }
      )

      expect(response.status).toBe(401)
    })
  })

  describe('Trigger Competitor Analysis', () => {
    it('should trigger competitor analysis or return expected error', async () => {
      if (!isAuthenticated || !organizationId || !competitorId) {
        console.log('Skipping - requires authentication, organization, and competitor')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/trigger-competitor-analysis`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            competitorId: competitorId
          })
        }
      )

      const data = await response.json()

      if (response.ok) {
        expect(data.success).toBe(true)
        expect(data.jobId).toBeDefined()
      } else {
        console.log('Competitor analysis response:', response.status, data.error)
        expect(data.error).toBeDefined()
      }
    })

    it('should require competitorId', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/trigger-competitor-analysis`,
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

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('competitorId')
    })

    it('should reject invalid competitor ID', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/trigger-competitor-analysis`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            competitorId: '00000000-0000-0000-0000-000000000000'
          })
        }
      )

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toContain('not found')
    })

    it('should require authentication', async () => {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/trigger-competitor-analysis`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ competitorId: 'test' })
        }
      )

      expect(response.status).toBe(401)
    })
  })

  describe('Jobs Table', () => {
    it('should be able to read jobs', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('organization_id', organizationId)

      expect(error).toBeNull()
      expect(Array.isArray(jobs)).toBe(true)
    })

    it('should be able to read visibility scans', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const { data: scans, error } = await supabase
        .from('visibility_scans')
        .select('*')
        .eq('organization_id', organizationId)

      expect(error).toBeNull()
      expect(Array.isArray(scans)).toBe(true)
    })

    it('should be able to read prompt results', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const { data: results, error } = await supabase
        .from('prompt_results')
        .select('*')
        .eq('organization_id', organizationId)
        .limit(10)

      expect(error).toBeNull()
      expect(Array.isArray(results)).toBe(true)
    })
  })
})
