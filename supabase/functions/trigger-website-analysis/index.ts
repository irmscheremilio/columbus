import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Queue } from 'https://esm.sh/bullmq@5'
import { Redis } from 'https://deno.land/x/upstash_redis@v1.22.1/mod.ts'

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

    // Get organization details
    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .select('domain')
      .eq('id', profile.organization_id)
      .single()

    if (orgError || !org?.domain) {
      return new Response(
        JSON.stringify({ error: 'Organization domain not configured' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get request body (optional parameters)
    const body = await req.json().catch(() => ({}))
    const includeCompetitorGaps = body.includeCompetitorGaps ?? true

    // Connect to Redis and enqueue job
    console.log('Connecting to Redis...')
    const redisUrl = Deno.env.get('REDIS_URL') || 'redis://localhost:6379'

    // Create BullMQ queue
    const redis = Redis.fromEnv()
    const websiteAnalysisQueue = new Queue('website-analysis', {
      connection: redis
    })

    // Add job to queue
    const job = await websiteAnalysisQueue.add('analyze', {
      organizationId: profile.organization_id,
      domain: org.domain,
      includeCompetitorGaps
    })

    console.log(`Website analysis job queued: ${job.id} for domain: ${org.domain}`)

    // Create job tracking record
    await supabaseClient
      .from('jobs')
      .insert({
        organization_id: profile.organization_id,
        job_type: 'website_analysis',
        status: 'queued',
        metadata: { domain: org.domain, jobId: job.id }
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Website analysis started',
        jobId: job.id,
        domain: org.domain
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error triggering website analysis:', error)
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
