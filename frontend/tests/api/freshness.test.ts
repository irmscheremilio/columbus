import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

describe('Freshness API', () => {
  let supabase: SupabaseClient
  let isAuthenticated = false

  beforeAll(async () => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    supabase = createClient(supabaseUrl, supabaseKey)

    // Try to authenticate with test user if credentials provided
    const testEmail = process.env.TEST_USER_EMAIL
    const testPassword = process.env.TEST_USER_PASSWORD

    if (testEmail && testPassword) {
      const { error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
      isAuthenticated = !error
      if (error) {
        console.warn('Could not authenticate test user:', error.message)
      }
    }
  })

  describe('manage-freshness edge function', () => {
    it('should return dashboard data', async () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }

      // The edge function expects action as URL param for GET requests
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/manage-freshness?action=dashboard`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '',
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('Dashboard response error:', data)
      }

      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('stats')
      expect(data).toHaveProperty('recentPages')
      expect(data).toHaveProperty('settings')
    })

    it('should add a monitored page', async () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }

      const testUrl = `https://example.com/test-${Date.now()}`
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/manage-freshness?action=add-page`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: testUrl })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('Add page response error:', data)
      }

      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('page')
      expect(data.page.url).toBe(testUrl)
    })

    it('should list monitored pages', async () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/manage-freshness?action=pages`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '',
          }
        }
      )

      const data = await response.json()
      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('pages')
      expect(Array.isArray(data.pages)).toBe(true)
    })

    it('should list alerts', async () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/manage-freshness?action=alerts`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '',
          }
        }
      )

      const data = await response.json()
      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('alerts')
      expect(Array.isArray(data.alerts)).toBe(true)
    })

    it('should get freshness settings', async () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/manage-freshness?action=settings`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '',
          }
        }
      )

      const data = await response.json()
      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('settings')
      expect(data.settings).toHaveProperty('stale_threshold_days')
    })
  })
})
