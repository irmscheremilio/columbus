import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkUsageLimit, incrementUsage } from '../_shared/plan-limits.ts'

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

    // Create admin client for usage operations
    const supabaseAdmin = createClient(
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
      .select('organization_id, active_organization_id')
      .eq('id', user.id)
      .single()

    const organizationId = profile?.active_organization_id || profile?.organization_id

    if (profileError || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check plan limits
    const usageCheck = await checkUsageLimit(supabaseAdmin, organizationId, 'websiteAnalyses')
    if (!usageCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Plan limit reached',
          message: usageCheck.message,
          current: usageCheck.current,
          limit: usageCheck.limit,
          upgradeRequired: true
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const body = await req.json().catch(() => ({}))
    let { domain, productId } = body
    const includeCompetitorGaps = body.includeCompetitorGaps ?? true
    const businessDescription = body.businessDescription || ''

    // Use admin client for product lookups
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // If productId is provided, get domain from product
    if (productId) {
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('domain, organization_id')
        .eq('id', productId)
        .eq('organization_id', organizationId)
        .single()

      if (productError || !product) {
        return new Response(
          JSON.stringify({ error: 'Product not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      domain = product.domain
    } else if (!domain) {
      // If no productId and no domain, try to get active product
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('active_product_id')
        .eq('id', user.id)
        .single()

      if (userProfile?.active_product_id) {
        const { data: activeProduct } = await supabaseAdmin
          .from('products')
          .select('id, domain')
          .eq('id', userProfile.active_product_id)
          .single()

        if (activeProduct) {
          productId = activeProduct.id
          domain = activeProduct.domain
        }
      }
    }

    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain or productId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create job record in database for workers to process
    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .insert({
        organization_id: organizationId,
        product_id: productId || null,
        job_type: 'website_analysis',
        status: 'queued',
        metadata: {
          domain: domain,
          productId: productId || null,
          includeCompetitorGaps,
          businessDescription
        }
      })
      .select()
      .single()

    if (jobError) {
      throw jobError
    }

    // Increment usage counter
    await incrementUsage(supabaseAdmin, organizationId, 'website_analyses')

    console.log(`Website analysis job created: ${job.id} for domain: ${domain}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Website analysis started',
        jobId: job.id,
        domain: domain,
        productId: productId || null
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
