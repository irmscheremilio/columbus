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

    // Service client for admin operations
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

    // Get user's organization
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('organization_id')
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
    const action = url.searchParams.get('action') || 'summary'

    // Handle different actions
    switch (req.method) {
      case 'GET': {
        switch (action) {
          case 'summary': {
            // Get ROI dashboard summary
            const periodDays = parseInt(url.searchParams.get('days') || '30')
            const endDate = new Date()
            const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

            // Get cached calculation or calculate new
            const { data: cached } = await supabaseClient
              .from('roi_calculations')
              .select('*')
              .eq('organization_id', organizationId)
              .gte('period_start', startDate.toISOString().split('T')[0])
              .lte('period_end', endDate.toISOString().split('T')[0])
              .order('calculated_at', { ascending: false })
              .limit(1)
              .single()

            // Get traffic metrics
            const { data: trafficMetrics } = await supabaseClient
              .from('ai_traffic_metrics')
              .select('*')
              .eq('organization_id', organizationId)
              .gte('date', startDate.toISOString().split('T')[0])
              .order('date', { ascending: true })

            // Get recent conversions
            const { data: recentConversions } = await supabaseClient
              .from('ai_conversion_events')
              .select('*')
              .eq('organization_id', organizationId)
              .order('occurred_at', { ascending: false })
              .limit(10)

            // Get integration status
            const { data: integration } = await supabaseClient
              .from('analytics_integrations')
              .select('*')
              .eq('organization_id', organizationId)
              .single()

            return jsonResponse({
              summary: cached || calculateSummary(trafficMetrics || []),
              trafficTrend: trafficMetrics || [],
              recentConversions: recentConversions || [],
              integration: integration ? {
                isConnected: integration.is_connected,
                provider: integration.provider,
                lastSynced: integration.last_synced_at,
                conversionGoal: integration.conversion_goal,
                avgConversionValue: integration.average_conversion_value
              } : null
            })
          }

          case 'traffic': {
            // Get detailed traffic data
            const periodDays = parseInt(url.searchParams.get('days') || '30')
            const source = url.searchParams.get('source')
            const endDate = new Date()
            const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

            let query = supabaseClient
              .from('ai_traffic_metrics')
              .select('*')
              .eq('organization_id', organizationId)
              .gte('date', startDate.toISOString().split('T')[0])
              .order('date', { ascending: true })

            if (source) {
              query = query.eq('source', source)
            }

            const { data, error } = await query
            if (error) throw error

            return jsonResponse({ traffic: data })
          }

          case 'conversions': {
            // Get conversion events
            const limit = parseInt(url.searchParams.get('limit') || '50')
            const source = url.searchParams.get('source')

            let query = supabaseClient
              .from('ai_conversion_events')
              .select('*')
              .eq('organization_id', organizationId)
              .order('occurred_at', { ascending: false })
              .limit(limit)

            if (source) {
              query = query.eq('source', source)
            }

            const { data, error } = await query
            if (error) throw error

            return jsonResponse({ conversions: data })
          }

          case 'sources': {
            // Get available AI referral sources
            const { data, error } = await supabaseClient
              .from('ai_referral_sources')
              .select('*')
              .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
              .eq('is_active', true)

            if (error) throw error
            return jsonResponse({ sources: data })
          }

          default:
            return jsonResponse({ error: 'Invalid action' }, 400)
        }
      }

      case 'POST': {
        const body = await req.json()

        switch (action) {
          case 'record-traffic': {
            // Record manual traffic data
            const { date, source, sessions, users, pageviews, avgSessionDuration, bounceRate, conversions, conversionValue } = body

            if (!date || !source) {
              return jsonResponse({ error: 'date and source are required' }, 400)
            }

            const { error } = await serviceClient
              .from('ai_traffic_metrics')
              .upsert({
                organization_id: organizationId,
                date,
                source,
                sessions: sessions || 0,
                users: users || 0,
                pageviews: pageviews || 0,
                avg_session_duration: avgSessionDuration || 0,
                bounce_rate: bounceRate || 0,
                conversions: conversions || 0,
                conversion_value: conversionValue || 0
              }, {
                onConflict: 'organization_id,date,source'
              })

            if (error) throw error
            return jsonResponse({ message: 'Traffic data recorded' })
          }

          case 'record-conversion': {
            // Record a conversion event
            const { eventName, source, value, metadata } = body

            if (!eventName || !source) {
              return jsonResponse({ error: 'eventName and source are required' }, 400)
            }

            const { data, error } = await serviceClient
              .from('ai_conversion_events')
              .insert({
                organization_id: organizationId,
                event_name: eventName,
                source,
                value: value || 0,
                metadata: metadata || {}
              })
              .select()
              .single()

            if (error) throw error
            return jsonResponse({ conversion: data })
          }

          case 'save-settings': {
            // Save analytics integration settings
            const { provider, conversionGoal, avgConversionValue, currency } = body

            const { data, error } = await serviceClient
              .from('analytics_integrations')
              .upsert({
                organization_id: organizationId,
                provider: provider || 'manual',
                conversion_goal: conversionGoal,
                average_conversion_value: avgConversionValue || 0,
                currency: currency || 'USD',
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'organization_id'
              })
              .select()
              .single()

            if (error) throw error
            return jsonResponse({ settings: data })
          }

          case 'calculate': {
            // Force recalculation of ROI
            const periodDays = body.periodDays || 30
            const endDate = new Date()
            const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

            // Get all traffic data
            const { data: trafficData } = await supabaseClient
              .from('ai_traffic_metrics')
              .select('*')
              .eq('organization_id', organizationId)
              .gte('date', startDate.toISOString().split('T')[0])

            // Get all conversions
            const { data: conversionData } = await supabaseClient
              .from('ai_conversion_events')
              .select('*')
              .eq('organization_id', organizationId)
              .gte('occurred_at', startDate.toISOString())

            // Get settings
            const { data: settings } = await supabaseClient
              .from('analytics_integrations')
              .select('average_conversion_value')
              .eq('organization_id', organizationId)
              .single()

            // Get subscription cost
            const { data: subscription } = await supabaseClient
              .from('subscriptions')
              .select('price_amount')
              .eq('organization_id', organizationId)
              .eq('status', 'active')
              .single()

            const summary = calculateDetailedROI(
              trafficData || [],
              conversionData || [],
              settings?.average_conversion_value || 0,
              subscription?.price_amount || 0,
              startDate,
              endDate
            )

            // Cache the calculation
            await serviceClient
              .from('roi_calculations')
              .upsert({
                organization_id: organizationId,
                period_start: startDate.toISOString().split('T')[0],
                period_end: endDate.toISOString().split('T')[0],
                ...summary,
                calculated_at: new Date().toISOString()
              }, {
                onConflict: 'organization_id,period_start,period_end'
              })

            return jsonResponse({ roi: summary })
          }

          default:
            return jsonResponse({ error: 'Invalid action' }, 400)
        }
      }

      default:
        return jsonResponse({ error: 'Method not allowed' }, 405)
    }
  } catch (error) {
    console.error('Error in roi-calculator:', error)
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

// Calculate summary from traffic metrics
function calculateSummary(trafficMetrics: any[]) {
  if (!trafficMetrics || trafficMetrics.length === 0) {
    return {
      totalSessions: 0,
      totalUsers: 0,
      totalConversions: 0,
      conversionValue: 0,
      conversionRate: 0,
      topSource: null
    }
  }

  const totalSessions = trafficMetrics.reduce((sum, m) => sum + m.sessions, 0)
  const totalUsers = trafficMetrics.reduce((sum, m) => sum + m.users, 0)
  const totalConversions = trafficMetrics.reduce((sum, m) => sum + m.conversions, 0)
  const conversionValue = trafficMetrics.reduce((sum, m) => sum + parseFloat(m.conversion_value || 0), 0)

  // Find top source
  const bySource = new Map()
  for (const m of trafficMetrics) {
    bySource.set(m.source, (bySource.get(m.source) || 0) + m.sessions)
  }
  const topSource = Array.from(bySource.entries())
    .sort((a, b) => b[1] - a[1])[0]

  return {
    totalSessions,
    totalUsers,
    totalConversions,
    conversionValue,
    conversionRate: totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0,
    topSource: topSource ? { source: topSource[0], sessions: topSource[1] } : null
  }
}

// Calculate detailed ROI
function calculateDetailedROI(
  trafficData: any[],
  conversionData: any[],
  avgConversionValue: number,
  platformCost: number,
  startDate: Date,
  endDate: Date
) {
  const totalSessions = trafficData.reduce((sum, d) => sum + d.sessions, 0)
  const totalUsers = trafficData.reduce((sum, d) => sum + d.users, 0)
  const totalPageviews = trafficData.reduce((sum, d) => sum + d.pageviews, 0)

  const trafficConversions = trafficData.reduce((sum, d) => sum + d.conversions, 0)
  const trafficValue = trafficData.reduce((sum, d) => sum + parseFloat(d.conversion_value || 0), 0)

  const eventConversions = conversionData.length
  const eventValue = conversionData.reduce((sum, d) => sum + parseFloat(d.value || avgConversionValue), 0)

  const totalConversions = trafficConversions + eventConversions
  const totalValue = trafficValue + eventValue

  // Estimate traffic value based on CPC
  const estimatedCPC = 3.00
  const estimatedTrafficValue = totalSessions * estimatedCPC

  const netROI = totalValue + estimatedTrafficValue - platformCost
  const roiPercentage = platformCost > 0 ? (netROI / platformCost) * 100 : 0

  // Breakdown by source
  const bySource: Record<string, any> = {}
  for (const d of trafficData) {
    if (!bySource[d.source]) {
      bySource[d.source] = { sessions: 0, conversions: 0, value: 0 }
    }
    bySource[d.source].sessions += d.sessions
    bySource[d.source].conversions += d.conversions
    bySource[d.source].value += parseFloat(d.conversion_value || 0)
  }

  return {
    total_ai_sessions: totalSessions,
    total_ai_users: totalUsers,
    total_ai_pageviews: totalPageviews,
    total_conversions: totalConversions,
    total_conversion_value: totalValue,
    conversion_rate: totalSessions > 0 ? totalConversions / totalSessions : 0,
    estimated_traffic_value: estimatedTrafficValue,
    platform_cost: platformCost,
    net_roi: netROI,
    roi_percentage: roiPercentage,
    breakdown_by_source: bySource
  }
}
