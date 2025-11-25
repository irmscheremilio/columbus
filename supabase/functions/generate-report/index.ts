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

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'generate'

    if (req.method === 'GET' && action === 'list') {
      // List existing reports
      const { data: reports, error } = await supabaseClient
        .from('reports')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      return new Response(
        JSON.stringify({ reports }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    if (req.method === 'POST') {
      // Parse request body
      const body = await req.json().catch(() => ({}))
      const reportType = body.reportType || 'executive_summary'
      const periodDays = body.periodDays || 30
      const sendEmail = body.sendEmail ?? false

      // Validate report type
      if (!['executive_summary', 'detailed', 'competitor_analysis'].includes(reportType)) {
        return new Response(
          JSON.stringify({ error: 'Invalid report type' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Create job record in database for workers to process
      const { data: job, error: jobError } = await supabaseClient
        .from('jobs')
        .insert({
          organization_id: profile.organization_id,
          job_type: 'report_generation',
          status: 'queued',
          metadata: {
            reportType,
            periodDays,
            email: sendEmail ? user.email : null
          }
        })
        .select()
        .single()

      if (jobError) {
        throw jobError
      }

      console.log(`Report generation job created: ${job.id}`)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Report generation started',
          jobId: job.id,
          reportType,
          periodDays
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in generate-report:', error)
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
