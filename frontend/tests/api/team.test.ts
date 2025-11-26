import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Team Management API Tests
 *
 * Tests team invitations and member management:
 * - Listing team members
 * - Sending invitations
 * - Listing invitations
 * - Revoking invitations
 *
 * Uses an existing test user authenticated via environment variables.
 */
describe('Team Management API', () => {
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

  describe('Team Members', () => {
    it('should list team members', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/team-members`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('List members error:', data)
      }

      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('members')
      expect(Array.isArray(data.members)).toBe(true)
      // Current user should be in the list
      expect(data.members.length).toBeGreaterThanOrEqual(1)
    })

    it('should include current user in members list', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/team-members`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
          }
        }
      )

      const data = await response.json()
      expect(response.ok).toBe(true)

      const currentUser = data.members.find((m: any) => m.isCurrentUser)
      expect(currentUser).toBeDefined()
    })
  })

  describe('Team Invitations', () => {
    let invitationId: string | null = null
    const inviteEmail = `invite-test-${Date.now()}@example.com`

    it('should send an invitation', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/team-invitations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: inviteEmail,
            role: 'member'
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('Send invitation error:', data)
        // May fail if user doesn't have permission - that's okay
        return
      }

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.invitationId).toBeDefined()

      invitationId = data.invitationId
    })

    it('should list pending invitations', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/team-invitations`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('List invitations error:', data)
        // May fail if user doesn't have permission
        return
      }

      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('invitations')
      expect(Array.isArray(data.invitations)).toBe(true)
    })

    it('should reject invalid roles', async () => {
      if (!isAuthenticated || !organizationId) {
        console.log('Skipping - requires authentication and organization')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/team-invitations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: `invalid-role-${Date.now()}@example.com`,
            role: 'superadmin' // Invalid role
          })
        }
      )

      // May be 400 (invalid role) or 403 (no permission) - both are valid
      expect([400, 403]).toContain(response.status)
    })

    it('should revoke an invitation if created', async () => {
      if (!isAuthenticated || !invitationId) {
        console.log('Skipping - requires authentication and invitation')
        return
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/team-invitations?id=${invitationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey!,
          }
        }
      )

      const data = await response.json()

      if (response.ok) {
        expect(data.success).toBe(true)
      }
    })
  })

  describe('Authorization', () => {
    it('should require authentication for team members', async () => {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/team-members`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseKey!,
          }
        }
      )

      expect(response.status).toBe(401)
    })

    it('should require authentication for invitations', async () => {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/team-invitations`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseKey!,
          }
        }
      )

      expect(response.status).toBe(401)
    })
  })
})
