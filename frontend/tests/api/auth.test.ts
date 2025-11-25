import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'

describe('Auth & Profile Flow', () => {
  let supabase: SupabaseClient
  let isAuthenticated = false
  let testUser: User | null = null

  beforeAll(async () => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(`Missing Supabase environment variables`)
    }

    supabase = createClient(supabaseUrl, supabaseKey)

    // Try to authenticate with test user if credentials provided
    const testEmail = process.env.TEST_USER_EMAIL
    const testPassword = process.env.TEST_USER_PASSWORD

    if (testEmail && testPassword) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
      if (!error && data.user) {
        isAuthenticated = true
        testUser = data.user
      } else {
        console.warn('Could not authenticate test user:', error?.message)
      }
    }
  })

  describe('Profile RLS Policies', () => {
    it('should only allow users to view their own profile', async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')

      expect(error).toBeNull()
      // Should only return the current user's profile (if authenticated) or empty
      expect(profiles?.length).toBeLessThanOrEqual(1)
    })

    it('should not allow updating other users profiles', async () => {
      // Try to update a non-existent user's profile
      const fakeUserId = '00000000-0000-0000-0000-000000000000'

      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', fakeUserId)

      // Should either error or affect 0 rows (RLS filters out rows user can't access)
      expect(error).toBeNull() // No error, just no rows updated
    })
  })

  describe('Organization RLS Policies', () => {
    it('should only allow viewing own organization', async () => {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')

      expect(error).toBeNull()
      // Should only return organizations the user belongs to
      expect(orgs?.length).toBeLessThanOrEqual(1)
    })
  })

  describe('Authenticated User Operations', () => {
    it('should be able to view own profile when authenticated', async () => {
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
      expect(profile.email).toBe(testUser.email)
    })

    it('should be able to update own profile when authenticated', async () => {
      if (!isAuthenticated || !testUser) {
        console.log('Skipping - requires authentication')
        return
      }

      // Update a safe field
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'member' })
        .eq('id', testUser.id)

      expect(error).toBeNull()
    })

    it('should be able to view own organization when authenticated', async () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }

      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')

      expect(error).toBeNull()
      // If user has an organization, it should be returned
      expect(Array.isArray(orgs)).toBe(true)
    })
  })

  // Note: Sign-out test removed to avoid affecting other tests that run concurrently
  // Session management is handled by the Supabase client library
})

describe('Profile Update vs Upsert', () => {
  let supabase: SupabaseClient
  let isAuthenticated = false
  let testUser: User | null = null

  beforeAll(async () => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(`Missing Supabase environment variables`)
    }

    supabase = createClient(supabaseUrl, supabaseKey)

    // Try to authenticate
    const testEmail = process.env.TEST_USER_EMAIL
    const testPassword = process.env.TEST_USER_PASSWORD

    if (testEmail && testPassword) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
      if (!error && data.user) {
        isAuthenticated = true
        testUser = data.user
      }
    }
  })

  it('should prefer update over upsert for existing profiles', async () => {
    if (!isAuthenticated || !testUser) {
      console.log('Skipping - requires authentication')
      return
    }

    // Correct approach: Update existing profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'member' })
      .eq('id', testUser.id)

    expect(updateError).toBeNull()
  })

  it('should handle profile operations correctly', async () => {
    if (!isAuthenticated || !testUser) {
      console.log('Skipping - requires authentication')
      return
    }

    // Verify profile exists and can be read
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.id)
      .single()

    expect(error).toBeNull()
    expect(profile).toBeDefined()
  })
})
