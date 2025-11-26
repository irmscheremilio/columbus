import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Create Product Edge Function
 *
 * Creates a new product for the user's organization.
 * Enforces plan-based limits (Free/Pro: 1 product, Agency: 5 products).
 * Optionally triggers website analysis for the product.
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { name, website, description, industry, triggerAnalysis = true } = await req.json()

    // Validate input
    if (!name || !website) {
      return new Response(
        JSON.stringify({ error: 'Product name and website are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate and normalize website URL
    let websiteUrl = website.trim()
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl
    }

    let domain: string
    try {
      domain = new URL(websiteUrl).hostname
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid website URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with the user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user's organization
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id, active_organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: 'User does not have an organization. Please complete signup first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const organizationId = profile.active_organization_id || profile.organization_id

    // Check product limit using database function
    const { data: slots, error: slotsError } = await supabaseAdmin
      .rpc('get_product_slots', { p_org_id: organizationId })

    if (slotsError) {
      console.error('Error checking product slots:', slotsError)
      throw new Error('Failed to check product limits')
    }

    const { current_count, max_limit, remaining } = slots[0] || { current_count: 0, max_limit: 1, remaining: 1 }

    if (remaining <= 0) {
      // Get plan for error message
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('plan')
        .eq('id', organizationId)
        .single()

      const plan = org?.plan || 'free'
      const upgradeTo = plan === 'free' ? 'Pro' : plan === 'pro' ? 'Agency' : 'Enterprise'

      return new Response(
        JSON.stringify({
          error: `Product limit reached. You have ${current_count}/${max_limit} products on the ${plan} plan. Upgrade to ${upgradeTo} for more products.`,
          code: 'PRODUCT_LIMIT_REACHED',
          current: current_count,
          limit: max_limit
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the product
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert([{
        organization_id: organizationId,
        name: name.trim(),
        website: websiteUrl,
        domain,
        description: description?.trim() || null,
        industry: industry?.trim() || null,
        is_active: true,
      }])
      .select()
      .single()

    if (productError) {
      console.error('Error creating product:', productError)
      throw new Error('Failed to create product')
    }

    // Set as active product if this is the first one
    if (current_count === 0) {
      await supabaseAdmin
        .from('profiles')
        .update({ active_product_id: product.id })
        .eq('id', user.id)
    }

    // Trigger website analysis if requested
    let jobId: string | null = null
    if (triggerAnalysis) {
      // Create a job record
      const { data: job, error: jobError } = await supabaseAdmin
        .from('jobs')
        .insert({
          organization_id: organizationId,
          product_id: product.id,
          job_type: 'website_analysis',
          status: 'queued',
          metadata: { domain, productId: product.id }
        })
        .select()
        .single()

      if (!jobError && job) {
        jobId = job.id

        // Trigger the analysis via the worker API
        const workerUrl = Deno.env.get('WORKER_API_URL')
        if (workerUrl) {
          try {
            await fetch(`${workerUrl}/api/website-analysis`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('WORKER_API_KEY') || ''}`
              },
              body: JSON.stringify({
                organizationId,
                productId: product.id,
                domain,
                jobId: job.id
              })
            })
          } catch (err) {
            console.error('Failed to trigger website analysis worker:', err)
            // Don't fail the request - product was created successfully
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        product,
        jobId,
        slots: {
          current: current_count + 1,
          limit: max_limit,
          remaining: remaining - 1
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Create product error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
