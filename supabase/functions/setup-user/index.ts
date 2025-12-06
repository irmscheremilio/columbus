import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Setup User Edge Function
 *
 * Checks if the user has completed onboarding and returns their status.
 * Does NOT create organizations - that's handled in the onboarding flow.
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

    // Use service role client for queries (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id, active_organization_id, onboarding_complete')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // Profile might not exist yet for brand new users
      console.log(`Profile not found for user ${user.id}, may be new user`)
    }

    // Check if user has an organization
    const organizationId = profile?.active_organization_id || profile?.organization_id

    if (!organizationId) {
      // No organization - user needs to complete onboarding
      return new Response(
        JSON.stringify({
          success: true,
          needsOnboarding: true,
          hasOrganization: false,
          hasProducts: false,
          onboardingComplete: false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify organization exists
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, plan')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      // Stale organization reference - clear it
      await supabaseAdmin
        .from('profiles')
        .update({ organization_id: null, active_organization_id: null })
        .eq('id', user.id)

      return new Response(
        JSON.stringify({
          success: true,
          needsOnboarding: true,
          hasOrganization: false,
          hasProducts: false,
          onboardingComplete: false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has products
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .limit(1)

    const hasProducts = (products?.length || 0) > 0
    const onboardingComplete = profile?.onboarding_complete ?? false

    return new Response(
      JSON.stringify({
        success: true,
        needsOnboarding: !onboardingComplete,
        hasOrganization: true,
        hasProducts,
        onboardingComplete,
        organization: org
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Setup user error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
