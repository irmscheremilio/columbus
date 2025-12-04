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
      .select('organization_id, active_organization_id')
      .eq('id', user.id)
      .single()

    console.log('Profile:', profile)

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

    // Use active_organization_id if set, otherwise fall back to organization_id
    const organizationId = profile.active_organization_id || profile.organization_id
    console.log('Organization ID:', organizationId, '(active:', profile.active_organization_id, ', default:', profile.organization_id, ')')

    // Get user's products (only active ones)
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, domain, is_active')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    console.log('Products query result:', { products, error: productsError })

    // Get extension session for this user
    const { data: session } = await supabaseAdmin
      .from('extension_sessions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get available platforms from database
    const { data: platformsData } = await supabaseAdmin
      .from('ai_platforms')
      .select('id, name, website_url')
      .order('name')

    const platforms = platformsData || []
    const platformIds = platforms.map(p => p.id)

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

        // Count results per platform (dynamically based on available platforms)
        const platformCounts: Record<string, number> = {}
        for (const platformId of platformIds) {
          platformCounts[platformId] = 0
        }

        if (todayResults) {
          for (const result of todayResults) {
            if (platformCounts[result.ai_model] !== undefined) {
              platformCounts[result.ai_model]++
            }
          }
        }

        const promptCount = totalPrompts || 0

        // Build today status dynamically
        const todayStatus: Record<string, { tested: number; total: number }> = {}
        for (const platformId of platformIds) {
          todayStatus[platformId] = { tested: platformCounts[platformId] || 0, total: promptCount }
        }

        return {
          id: product.id,
          name: product.name,
          brand: product.name, // Use name as brand since brand_name column doesn't exist
          domain: product.domain,
          isActive: product.is_active,
          promptCount,
          todayStatus,
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
        platforms: platforms.map(p => ({
          id: p.id,
          name: p.name,
          url: p.website_url
        }))
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
