import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Service client for operations that need elevated permissions
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user's organization and active product
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('organization_id, active_product_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const organizationId = profile.organization_id
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'list'

    // Get product ID from query param or use active product
    let productId = url.searchParams.get('productId') || profile.active_product_id

    // If still no product, try to get the first active product
    if (!productId) {
      const { data: firstProduct } = await supabaseClient
        .from('products')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      productId = firstProduct?.id
    }

    // Handle different HTTP methods and actions
    switch (req.method) {
      case 'GET': {
        return await handleGet(supabaseClient, organizationId, productId, action, url.searchParams)
      }
      case 'POST': {
        const body = await req.json()
        return await handlePost(serviceClient, organizationId, productId, action, body)
      }
      case 'PUT': {
        const body = await req.json()
        return await handlePut(serviceClient, organizationId, productId, action, body)
      }
      case 'DELETE': {
        const body = await req.json()
        return await handleDelete(serviceClient, organizationId, productId, action, body)
      }
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
    }
  } catch (error) {
    console.error('Error in manage-freshness:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// GET handler - list pages, alerts, or settings
async function handleGet(client: any, orgId: string, productId: string | null, action: string, params: URLSearchParams) {
  // Build filter based on product or organization
  const buildFilter = (query: any) => {
    if (productId) {
      return query.eq('product_id', productId)
    }
    return query.eq('organization_id', orgId)
  }

  switch (action) {
    case 'pages': {
      let query = client
        .from('monitored_pages')
        .select('*')
        .order('created_at', { ascending: false })

      query = buildFilter(query)
      const { data, error } = await query

      if (error) throw error
      return jsonResponse({ pages: data })
    }

    case 'alerts': {
      const unreadOnly = params.get('unread') === 'true'
      let query = client
        .from('freshness_alerts')
        .select('*, monitored_pages(url, title)')
        .order('created_at', { ascending: false })

      query = buildFilter(query)

      if (unreadOnly) {
        query = query.eq('is_read', false).eq('is_dismissed', false)
      }

      const { data, error } = await query.limit(50)
      if (error) throw error
      return jsonResponse({ alerts: data })
    }

    case 'settings': {
      let query = client
        .from('freshness_settings')
        .select('*')

      query = buildFilter(query)
      const { data, error } = await query.single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
      return jsonResponse({ settings: data || getDefaultSettings(orgId, productId) })
    }

    case 'snapshots': {
      const pageId = params.get('pageId')
      if (!pageId) {
        return jsonResponse({ error: 'pageId required' }, 400)
      }

      const { data, error } = await client
        .from('content_snapshots')
        .select('*')
        .eq('page_id', pageId)
        .order('crawled_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return jsonResponse({ snapshots: data })
    }

    case 'dashboard': {
      // Get overview stats for dashboard
      let pagesQuery = client
        .from('monitored_pages')
        .select('id, url, title, freshness_score, status, last_crawled_at')

      let alertsQuery = client
        .from('freshness_alerts')
        .select('id, alert_type, severity, is_read')
        .eq('is_dismissed', false)

      let settingsQuery = client
        .from('freshness_settings')
        .select('*')

      pagesQuery = buildFilter(pagesQuery)
      alertsQuery = buildFilter(alertsQuery)
      settingsQuery = buildFilter(settingsQuery)

      const [pagesResult, alertsResult, settingsResult] = await Promise.all([
        pagesQuery,
        alertsQuery,
        settingsQuery.single()
      ])

      const pages = pagesResult.data || []
      const alerts = alertsResult.data || []

      // Calculate stats
      const avgFreshness = pages.length > 0
        ? Math.round(pages.reduce((sum: number, p: any) => sum + (p.freshness_score || 50), 0) / pages.length)
        : 0

      const staleCount = pages.filter((p: any) => (p.freshness_score || 50) < 50).length
      const unreadAlerts = alerts.filter((a: any) => !a.is_read).length
      const criticalAlerts = alerts.filter((a: any) => a.severity === 'critical' && !a.is_read).length

      return jsonResponse({
        stats: {
          totalPages: pages.length,
          avgFreshness,
          staleCount,
          unreadAlerts,
          criticalAlerts
        },
        recentPages: pages.slice(0, 5),
        recentAlerts: alerts.slice(0, 5),
        settings: settingsResult.data || getDefaultSettings(orgId, productId)
      })
    }

    default:
      return jsonResponse({ error: 'Invalid action' }, 400)
  }
}

// POST handler - add pages or trigger checks
async function handlePost(client: any, orgId: string, productId: string | null, action: string, body: any) {
  switch (action) {
    case 'add-page': {
      const { url, title, checkFrequencyHours } = body
      if (!url) {
        return jsonResponse({ error: 'URL is required' }, 400)
      }

      if (!productId) {
        return jsonResponse({ error: 'No active product found' }, 400)
      }

      // Validate URL
      try {
        new URL(url)
      } catch {
        return jsonResponse({ error: 'Invalid URL' }, 400)
      }

      // Check if page already exists for this product
      const { data: existing } = await client
        .from('monitored_pages')
        .select('id')
        .eq('product_id', productId)
        .eq('url', url)
        .single()

      if (existing) {
        return jsonResponse({ error: 'Page already being monitored' }, 409)
      }

      const { data, error } = await client
        .from('monitored_pages')
        .insert({
          organization_id: orgId,
          product_id: productId,
          url,
          title: title || null,
          check_frequency_hours: checkFrequencyHours || 72,
          status: 'active',
          next_check_at: new Date().toISOString() // Check immediately
        })
        .select()
        .single()

      if (error) throw error

      // Queue an immediate freshness check by creating a job
      await client.from('jobs').insert({
        organization_id: orgId,
        product_id: productId,
        job_type: 'freshness_check',
        status: 'queued',
        metadata: { pageId: data.id }
      })

      return jsonResponse({ page: data, message: 'Page added and check queued' })
    }

    case 'trigger-check': {
      const { pageId } = body

      if (pageId) {
        // Check single page
        await client.from('jobs').insert({
          organization_id: orgId,
          product_id: productId,
          job_type: 'freshness_check',
          status: 'queued',
          metadata: { pageId }
        })
      } else {
        // Check all pages for product
        await client.from('jobs').insert({
          organization_id: orgId,
          product_id: productId,
          job_type: 'freshness_check',
          status: 'queued',
          metadata: { productId: productId }
        })
      }

      return jsonResponse({ message: 'Freshness check queued' })
    }

    case 'save-settings': {
      const { staleThresholdDays, criticalThresholdDays, autoCheckEnabled, emailAlertsEnabled, slackWebhookUrl } = body

      if (!productId) {
        return jsonResponse({ error: 'No active product found' }, 400)
      }

      const { data, error } = await client
        .from('freshness_settings')
        .upsert({
          organization_id: orgId,
          product_id: productId,
          stale_threshold_days: staleThresholdDays || 30,
          critical_threshold_days: criticalThresholdDays || 90,
          auto_check_enabled: autoCheckEnabled ?? true,
          email_alerts_enabled: emailAlertsEnabled ?? true,
          slack_webhook_url: slackWebhookUrl || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'product_id'
        })
        .select()
        .single()

      if (error) throw error
      return jsonResponse({ settings: data })
    }

    default:
      return jsonResponse({ error: 'Invalid action' }, 400)
  }
}

// PUT handler - update pages or alerts
async function handlePut(client: any, orgId: string, productId: string | null, action: string, body: any) {
  switch (action) {
    case 'update-page': {
      const { pageId, title, checkFrequencyHours, status } = body
      if (!pageId) {
        return jsonResponse({ error: 'pageId is required' }, 400)
      }

      const updates: any = { updated_at: new Date().toISOString() }
      if (title !== undefined) updates.title = title
      if (checkFrequencyHours !== undefined) updates.check_frequency_hours = checkFrequencyHours
      if (status !== undefined) updates.status = status

      // Use product_id if available, otherwise fallback to organization_id
      let query = client
        .from('monitored_pages')
        .update(updates)
        .eq('id', pageId)

      if (productId) {
        query = query.eq('product_id', productId)
      } else {
        query = query.eq('organization_id', orgId)
      }

      const { data, error } = await query.select().single()

      if (error) throw error
      return jsonResponse({ page: data })
    }

    case 'mark-alert-read': {
      const { alertId, alertIds } = body
      const ids = alertIds || [alertId]

      if (!ids || ids.length === 0) {
        return jsonResponse({ error: 'alertId or alertIds required' }, 400)
      }

      let query = client
        .from('freshness_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .in('id', ids)

      if (productId) {
        query = query.eq('product_id', productId)
      } else {
        query = query.eq('organization_id', orgId)
      }

      const { error } = await query

      if (error) throw error
      return jsonResponse({ message: 'Alerts marked as read' })
    }

    case 'dismiss-alert': {
      const { alertId, alertIds } = body
      const ids = alertIds || [alertId]

      if (!ids || ids.length === 0) {
        return jsonResponse({ error: 'alertId or alertIds required' }, 400)
      }

      let query = client
        .from('freshness_alerts')
        .update({
          is_dismissed: true,
          dismissed_at: new Date().toISOString()
        })
        .in('id', ids)

      if (productId) {
        query = query.eq('product_id', productId)
      } else {
        query = query.eq('organization_id', orgId)
      }

      const { error } = await query

      if (error) throw error
      return jsonResponse({ message: 'Alerts dismissed' })
    }

    default:
      return jsonResponse({ error: 'Invalid action' }, 400)
  }
}

// DELETE handler - remove pages
async function handleDelete(client: any, orgId: string, productId: string | null, action: string, body: any) {
  switch (action) {
    case 'remove-page': {
      const { pageId } = body
      if (!pageId) {
        return jsonResponse({ error: 'pageId is required' }, 400)
      }

      // Delete page (cascades to snapshots and alerts)
      let query = client
        .from('monitored_pages')
        .delete()
        .eq('id', pageId)

      if (productId) {
        query = query.eq('product_id', productId)
      } else {
        query = query.eq('organization_id', orgId)
      }

      const { error } = await query

      if (error) throw error
      return jsonResponse({ message: 'Page removed from monitoring' })
    }

    default:
      return jsonResponse({ error: 'Invalid action' }, 400)
  }
}

// Helper to create JSON responses
function jsonResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

// Default settings for new organizations/products
function getDefaultSettings(orgId: string, productId: string | null) {
  return {
    organization_id: orgId,
    product_id: productId,
    stale_threshold_days: 30,
    critical_threshold_days: 90,
    auto_check_enabled: true,
    email_alerts_enabled: true,
    slack_webhook_url: null
  }
}
