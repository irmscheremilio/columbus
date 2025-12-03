/**
 * @deprecated This function is deprecated. Gap analysis is now performed automatically
 * during regular visibility scans in the prompt-evaluation worker.
 *
 * Gaps are detected when evaluating AI responses and stored in visibility_gaps table.
 * This manual trigger is no longer needed.
 */
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

  // Return deprecation notice - gaps are now auto-detected during scans
  return new Response(
    JSON.stringify({
      error: 'This endpoint is deprecated',
      message: 'Gap analysis is now performed automatically during visibility scans. Run a scan from the desktop app to detect gaps.',
      deprecated: true
    }),
    {
      status: 410, // Gone
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )

  // Legacy code below - kept for reference but no longer executed
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

    // Get request body
    const { competitorId } = await req.json()

    if (!competitorId) {
      return new Response(
        JSON.stringify({ error: 'competitorId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get competitor details
    const { data: competitor, error: compError } = await supabaseClient
      .from('competitors')
      .select('*')
      .eq('id', competitorId)
      .eq('organization_id', profile.organization_id)
      .single()

    if (compError || !competitor) {
      return new Response(
        JSON.stringify({ error: 'Competitor not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get organization details for brand name
    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single()

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: 'Organization not configured' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get prompts to test
    const { data: prompts, error: promptsError } = await supabaseClient
      .from('prompts')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .limit(20) // Test top 20 prompts

    if (promptsError || !prompts || prompts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No prompts found. Please add prompts first.' }),
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
        job_type: 'competitor_analysis',
        status: 'queued',
        metadata: {
          competitorId: competitor.id,
          competitorName: competitor.name,
          brandName: org.name,
          promptIds: prompts.map(p => p.id)
        }
      })
      .select()
      .single()

    if (jobError) {
      throw jobError
    }

    console.log(`Competitor analysis job created: ${job.id} for ${competitor.name}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Competitor analysis started',
        jobId: job.id,
        competitor: competitor.name,
        promptCount: prompts.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error triggering competitor analysis:', error)
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
