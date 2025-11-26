import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Dashboard API Tests
 *
 * Tests the main dashboard functionality including:
 * - Prompts management
 * - Competitors management
 * - Recommendations
 * - Visibility data
 *
 * Uses an existing test user authenticated via environment variables.
 */
describe('Dashboard API', () => {
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
    // Sign out
    if (isAuthenticated) {
      await supabase.auth.signOut()
    }
  }, 30000)

  describe('Authentication', () => {
    it('should be authenticated with test user', () => {
      if (!isAuthenticated) {
        console.log('Skipping - TEST_USER_EMAIL and TEST_USER_PASSWORD not set')
        return
      }
      expect(testUser).toBeDefined()
      expect(accessToken).toBeDefined()
    })

    it('should have an organization', () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }
      expect(organizationId).toBeDefined()
    })
  })

  describe('Profile Operations', () => {
    it('should read own profile', async () => {
      if (!isAuthenticated || !testUser) {
        console.log('Skipping - requires authentication')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUser.id)
        .single()

      expect(error).toBeNull()
      expect(profile).toBeDefined()
      expect(profile.id).toBe(testUser.id)
    })

    it('should not access other users profiles', async () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }

      // Try to get all profiles - should only return own profile due to RLS
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')

      expect(error).toBeNull()
      expect(profiles?.length).toBeLessThanOrEqual(1)
    })
  })

  describe('Organization Operations', () => {
    it('should read own organization', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

      expect(error).toBeNull()
      expect(org).toBeDefined()
      expect(org.id).toBe(organizationId)
    })
  })

  describe('Prompts Management', () => {
    let promptId: string | null = null

    it('should create a prompt', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const { data: prompt, error } = await supabase
        .from('prompts')
        .insert({
          organization_id: organizationId,
          text: 'What are the best AI tools for marketing?',
          category: 'general',
          granularity_level: 1,
          is_active: true
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(prompt).toBeDefined()
      expect(prompt.text).toBe('What are the best AI tools for marketing?')

      promptId = prompt.id
    })

    it('should list prompts', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const { data: prompts, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('organization_id', organizationId)

      expect(error).toBeNull()
      expect(prompts).toBeDefined()
      expect(prompts!.length).toBeGreaterThan(0)
    })

    it('should update a prompt', async () => {
      if (!isAuthenticated || !promptId) {
        console.log('Skipping - requires authentication and prompt')
        return
      }

      const { error } = await supabase
        .from('prompts')
        .update({ text: 'Updated prompt text' })
        .eq('id', promptId)

      expect(error).toBeNull()

      // Verify update
      const { data: updatedPrompt } = await supabase
        .from('prompts')
        .select('text')
        .eq('id', promptId)
        .single()

      expect(updatedPrompt?.text).toBe('Updated prompt text')
    })

    it('should delete a prompt', async () => {
      if (!isAuthenticated || !promptId) {
        console.log('Skipping - requires authentication and prompt')
        return
      }

      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId)

      expect(error).toBeNull()
    })
  })

  describe('Competitors Management', () => {
    let competitorId: string | null = null

    it('should create a competitor', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const { data: competitor, error } = await supabase
        .from('competitors')
        .insert({
          organization_id: organizationId,
          name: 'Test Competitor',
          website: 'https://competitor.example.com'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(competitor).toBeDefined()
      expect(competitor.name).toBe('Test Competitor')

      competitorId = competitor.id
    })

    it('should list competitors', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const { data: competitors, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('organization_id', organizationId)

      expect(error).toBeNull()
      expect(competitors).toBeDefined()
      expect(competitors!.length).toBeGreaterThan(0)
    })

    it('should update a competitor', async () => {
      if (!isAuthenticated || !competitorId) {
        console.log('Skipping - requires authentication and competitor')
        return
      }

      const { error } = await supabase
        .from('competitors')
        .update({ name: 'Updated Competitor' })
        .eq('id', competitorId)

      expect(error).toBeNull()
    })

    it('should delete a competitor', async () => {
      if (!isAuthenticated || !competitorId) {
        console.log('Skipping - requires authentication and competitor')
        return
      }

      const { error } = await supabase
        .from('competitors')
        .delete()
        .eq('id', competitorId)

      expect(error).toBeNull()
    })
  })

  describe('Recommendations', () => {
    it('should list recommendations (may be empty)', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const { data: recommendations, error } = await supabase
        .from('fix_recommendations')
        .select('*')
        .eq('organization_id', organizationId)

      expect(error).toBeNull()
      expect(Array.isArray(recommendations)).toBe(true)
    })

    it('should create a recommendation', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const { data: recommendation, error } = await supabase
        .from('fix_recommendations')
        .insert({
          organization_id: organizationId,
          title: 'Test Recommendation',
          description: 'This is a test recommendation',
          category: 'schema',
          priority: 'high',
          impact: 'Improves SEO visibility',
          implementation: { steps: ['Step 1', 'Step 2'] }
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(recommendation).toBeDefined()
      expect(recommendation.title).toBe('Test Recommendation')
    })
  })

  describe('Visibility Scans', () => {
    it('should list visibility scans (may be empty)', async () => {
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
  })

  describe('Jobs', () => {
    it('should list jobs (may be empty)', async () => {
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
  })
})
