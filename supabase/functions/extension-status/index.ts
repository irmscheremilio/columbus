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
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    // If user has no organization, create one automatically
    // This handles users who signed up before the trigger existed
    // or any edge case where the trigger didn't fire
    if (!profile?.organization_id) {
      console.log('User has no organization, creating one automatically...')

      // Call the setup function to create organization
      const { data: setupResult, error: setupError } = await supabaseAdmin
        .rpc('setup_user_organization', { user_id: user.id })

      if (setupError) {
        console.error('Failed to setup user organization:', setupError)
        return new Response(
          JSON.stringify({ error: 'Failed to setup user account. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Re-fetch profile with new organization
      const { data: updatedProfile } = await supabaseAdmin
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      profile = updatedProfile

      if (!profile?.organization_id) {
        return new Response(
          JSON.stringify({ error: 'Failed to create organization for user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const organizationId = profile.organization_id

    // Get user's products
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, brand_name, domain, is_active')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    // Get extension session for this user
    const { data: session } = await supabaseAdmin
      .from('extension_sessions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Calculate today's scan status per product
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const productStatuses = await Promise.all(
      (products || []).map(async (product) => {
        // Count today's results per platform
        const { data: todayResults } = await supabaseAdmin
          .from('prompt_results')
          .select('ai_model')
          .eq('product_id', product.id)
          .gte('tested_at', today.toISOString())

        // Get total prompts for this product
        const { count: totalPrompts } = await supabaseAdmin
          .from('prompts')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', product.id)

        // Count results per platform
        const platformCounts: Record<string, number> = {
          chatgpt: 0,
          claude: 0,
          gemini: 0,
          perplexity: 0
        }

        if (todayResults) {
          for (const result of todayResults) {
            if (platformCounts[result.ai_model] !== undefined) {
              platformCounts[result.ai_model]++
            }
          }
        }

        const promptCount = totalPrompts || 0

        return {
          id: product.id,
          name: product.name,
          brand: product.brand_name,
          domain: product.domain,
          isActive: product.is_active,
          promptCount,
          todayStatus: {
            chatgpt: { tested: platformCounts.chatgpt, total: promptCount },
            claude: { tested: platformCounts.claude, total: promptCount },
            gemini: { tested: platformCounts.gemini, total: promptCount },
            perplexity: { tested: platformCounts.perplexity, total: promptCount }
          },
          todayComplete: Object.values(platformCounts).every(count => count >= promptCount) && promptCount > 0
        }
      })
    )

    // Find active product (first one with is_active or just first one)
    const activeProduct = productStatuses.find(p => p.isActive) || productStatuses[0] || null

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email
        },
        organizationId,
        products: productStatuses,
        activeProduct,
        session: session ? {
          lastScanAt: session.last_scan_at,
          platformsConnected: session.platforms_connected || {},
          scanPreferences: session.scan_preferences || {},
          extensionVersion: session.extension_version
        } : null,
        platforms: [
          { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com' },
          { id: 'claude', name: 'Claude', url: 'https://claude.ai' },
          { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com' },
          { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai' }
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error getting extension status:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
