import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkUsageLimit, incrementUsage } from '../_shared/plan-limits.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body to get productId
    const body = await req.json().catch(() => ({}))
    const { productId } = body

    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'productId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get product details
    const { data: product } = await supabaseClient
      .from('products')
      .select('*, organizations(*)')
      .eq('id', productId)
      .single()

    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const organizationId = product.organization_id

    // Check plan limits using organization
    const usageCheck = await checkUsageLimit(supabaseClient, organizationId, 'scansPerMonth')
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

    // Check if product has a domain
    if (!product.domain) {
      return new Response(
        JSON.stringify({
          error: 'Product has no domain',
          message: 'Please set a domain for this product first.',
          redirectTo: '/dashboard/products'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get prompts for this product
    const { data: prompts } = await supabaseClient
      .from('prompts')
      .select('id')
      .eq('product_id', productId)

    if (!prompts || prompts.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No prompts found',
          message: 'Please add prompts for this product first.',
          redirectTo: '/dashboard/prompts'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const promptIds = prompts.map(p => p.id)

    // Get active competitors for this product
    const { data: competitors } = await supabaseClient
      .from('competitors')
      .select('name')
      .eq('product_id', productId)
      .eq('is_active', true)

    const competitorNames = competitors?.map(c => c.name) || []

    // Create job record (worker will pick it up via job processor)
    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .insert({
        organization_id: organizationId,
        product_id: productId,
        job_type: 'visibility_scan',
        status: 'queued',
        metadata: {
          productId,
          productName: product.name,
          domain: product.domain,
          promptIds,
          competitors: competitorNames,
          promptCount: promptIds.length,
          competitorCount: competitorNames.length,
          isScheduled: false
        }
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating job:', jobError)
      throw new Error(`Failed to create job: ${jobError.message}`)
    }

    if (!job) {
      throw new Error('Failed to create job')
    }

    // Increment usage counter using organization id
    await incrementUsage(supabaseClient, organizationId, 'scans')

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        message: 'Visibility scan started. This may take 5-10 minutes.',
        promptCount: promptIds.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error triggering scan:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
