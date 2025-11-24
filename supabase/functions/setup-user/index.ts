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

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { organizationName, brandName, website } = await req.json()

    // Validate input
    if (!organizationName || !brandName) {
      return new Response(
        JSON.stringify({ error: 'Organization name and brand name are required' }),
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

    // Use service role client for inserts (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert([{
        name: organizationName,
        plan: 'free',
      }])
      .select()
      .single()

    if (orgError) {
      throw orgError
    }

    // 2. Create brand
    const { data: brand, error: brandError } = await supabaseAdmin
      .from('brands')
      .insert([{
        organization_id: org.id,
        name: brandName,
        website,
        is_active: true,
      }])
      .select()
      .single()

    if (brandError) {
      throw brandError
    }

    // 3. Update user with organization_id
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ organization_id: org.id })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    // Note: Prompts are NOT created here
    // The website-analysis worker generates contextual prompts after analyzing the website
    // This is triggered via the trigger-website-analysis edge function

    return new Response(
      JSON.stringify({
        success: true,
        organization: org,
        brand,
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
