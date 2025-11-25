import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

describe('ROI Calculator API', () => {
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

  describe('roi-calculator edge function', () => {
    it('should return summary data', async () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/roi-calculator?action=summary`,
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
        console.log('Summary response error:', data)
      }

      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('summary')
      expect(data).toHaveProperty('trafficTrend')
      expect(data).toHaveProperty('recentConversions')
    })

    it('should return traffic data', async () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/roi-calculator?action=traffic&days=30`,
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
        console.log('Traffic response error:', data)
      }

      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('traffic')
      expect(Array.isArray(data.traffic)).toBe(true)
    })

    it('should return conversions list', async () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/roi-calculator?action=conversions`,
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
        console.log('Conversions response error:', data)
      }

      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('conversions')
      expect(Array.isArray(data.conversions)).toBe(true)
    })

    it('should record a conversion', async () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/roi-calculator?action=record-conversion`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventName: 'test_purchase',
            source: 'chatgpt',
            value: 99.99
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('Record conversion response error:', data)
      }

      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('conversion')
    })

    it('should record traffic', async () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const today = new Date().toISOString().split('T')[0]

      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/roi-calculator?action=record-traffic`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: today,
            source: 'claude',
            sessions: 10,
            users: 8,
            pageviews: 25
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('Record traffic response error:', data)
      }

      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('message')
    })

    it('should save ROI settings', async () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/roi-calculator?action=save-settings`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversionGoal: 'purchase',
            avgConversionValue: 150
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.log('Save settings response error:', data)
      }

      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('settings')
    })

    it('should reject invalid actions', async () => {
      if (!isAuthenticated) {
        console.log('Skipping - requires authentication')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/roi-calculator?action=invalid_action`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '',
          }
        }
      )

      const data = await response.json()

      // Should return 400 for invalid action
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })
})
