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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's profile to find organization
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('organization_id, active_organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: 'User has no organization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use active_organization_id if set, otherwise fall back to organization_id
    const organizationId = profile.active_organization_id || profile.organization_id

    // Get productId from query params
    const url = new URL(req.url)
    const productId = url.searchParams.get('productId')

    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'productId query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify product belongs to user's organization and get details
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, name, domain')
      .eq('id', productId)
      .eq('organization_id', organizationId)
      .single()

    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get prompts for this product
    const { data: prompts, error: promptsError } = await supabaseAdmin
      .from('prompts')
      .select('id, prompt_text, category')
      .eq('product_id', productId)
      .order('created_at', { ascending: true })

    if (promptsError) {
      throw new Error(`Failed to fetch prompts: ${promptsError.message}`)
    }

    // Get active competitors for this product
    const { data: competitors } = await supabaseAdmin
      .from('competitors')
      .select('id, name, domain')
      .eq('product_id', productId)
      .eq('is_active', true)

    // Check which prompts have already been tested today for each platform
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: todayResults } = await supabaseAdmin
      .from('prompt_results')
      .select('prompt_id, ai_model')
      .eq('product_id', productId)
      .gte('tested_at', today.toISOString())

    // Build a map of what's been tested
    const testedMap: Record<string, Set<string>> = {}
    if (todayResults) {
      for (const result of todayResults) {
        if (!testedMap[result.prompt_id]) {
          testedMap[result.prompt_id] = new Set()
        }
        testedMap[result.prompt_id].add(result.ai_model)
      }
    }

    // Format prompts with testing status
    const formattedPrompts = prompts?.map(prompt => ({
      id: prompt.id,
      text: prompt.prompt_text,
      category: prompt.category,
      testedToday: {
        chatgpt: testedMap[prompt.id]?.has('chatgpt') || false,
        claude: testedMap[prompt.id]?.has('claude') || false,
        gemini: testedMap[prompt.id]?.has('gemini') || false,
        perplexity: testedMap[prompt.id]?.has('perplexity') || false
      }
    })) || []

    return new Response(
      JSON.stringify({
        product: {
          id: product.id,
          name: product.name,
          brand: product.name, // Use name as brand since brand_name column doesn't exist
          domain: product.domain
        },
        prompts: formattedPrompts,
        competitors: competitors?.map(c => c.name) || [],
        totalPrompts: formattedPrompts.length,
        platforms: ['chatgpt', 'claude', 'gemini', 'perplexity']
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching prompts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
