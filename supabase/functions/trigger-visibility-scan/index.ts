import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Get user's organization
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: 'No organization found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get organization details
    const { data: org } = await supabaseClient
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single()

    if (!org) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get active brand for this organization
    const { data: brand } = await supabaseClient
      .from('brands')
      .select('*')
      .eq('organization_id', org.id)
      .limit(1)
      .single()

    if (!brand) {
      return new Response(
        JSON.stringify({ error: 'No brand found. Please add a brand first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get prompts for this organization
    const { data: prompts } = await supabaseClient
      .from('prompts')
      .select('id')
      .eq('organization_id', org.id)
      .limit(10) // Start with 10 prompts for MVP

    // If no custom prompts, we'll need to create default ones
    let promptIds: string[] = []

    if (!prompts || prompts.length === 0) {
      // Create default prompts based on industry
      const defaultPrompts = getDefaultPrompts(org.industry || 'general', brand.name, org.domain)

      const { data: createdPrompts } = await supabaseClient
        .from('prompts')
        .insert(defaultPrompts.map(p => ({
          organization_id: org.id,
          prompt_text: p,
          category: 'product',
          is_custom: false
        })))
        .select('id')

      promptIds = createdPrompts?.map(p => p.id) || []
    } else {
      promptIds = prompts.map(p => p.id)
    }

    // Get active competitors
    const { data: competitors } = await supabaseClient
      .from('competitors')
      .select('name')
      .eq('organization_id', org.id)
      .eq('is_active', true)

    const competitorNames = competitors?.map(c => c.name) || []

    // Create job record (worker will pick it up via job processor)
    const { data: job } = await supabaseClient
      .from('jobs')
      .insert({
        organization_id: org.id,
        job_type: 'visibility_scan',
        status: 'queued',
        metadata: {
          brandId: brand.id,
          brandName: brand.name,
          domain: org.domain,
          promptIds,
          competitors: competitorNames,
          promptCount: promptIds.length,
          competitorCount: competitorNames.length,
          isScheduled: false
        }
      })
      .select()
      .single()

    if (!job) {
      throw new Error('Failed to create job')
    }

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

/**
 * Generate default prompts based on industry and brand
 */
function getDefaultPrompts(industry: string, brandName: string, domain: string): string[] {
  const prompts = [
    // Generic product queries
    `What are the best tools for ${industry}?`,
    `Top ${industry} solutions in 2025`,
    `${brandName} vs competitors`,
    `Is ${brandName} worth it?`,
    `${brandName} review`,

    // Comparison queries
    `Compare ${brandName} alternatives`,
    `Best ${brandName} alternatives`,

    // How-to queries
    `How to choose the right ${industry} tool?`,
    `What features to look for in ${industry} software?`,

    // Commercial intent
    `Best ${industry} tool for small business`
  ]

  return prompts
}
