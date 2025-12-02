import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Paid plans that have access to proxy/geo-targeting feature
const PAID_PLANS = ['pro', 'agency', 'enterprise']

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role (to bypass RLS)
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
        JSON.stringify({ error: 'No organization found for user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const organizationId = profile.active_organization_id || profile.organization_id

    // Get organization's plan
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('plan')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const plan = org.plan || 'free'

    // Check if user has a paid plan
    if (!PAID_PLANS.includes(plan)) {
      return new Response(
        JSON.stringify({
          error: 'Geo-targeting requires a paid plan',
          plan: plan,
          requiredPlans: PAID_PLANS
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // User has paid plan - fetch proxy credentials
    const { data: proxyConfig, error: proxyError } = await supabaseAdmin
      .from('proxy_config')
      .select('provider, hostname, port_http, port_socks5, username, password')
      .eq('is_active', true)
      .single()

    if (proxyError || !proxyConfig) {
      console.error('Failed to fetch proxy config:', proxyError)
      return new Response(
        JSON.stringify({ error: 'Proxy configuration not available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch available countries
    const { data: countries, error: countriesError } = await supabaseAdmin
      .from('proxy_countries')
      .select('code, name, flag_emoji, region')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (countriesError) {
      console.error('Failed to fetch countries:', countriesError)
    }

    // Return proxy config and countries
    // The desktop app will construct the full proxy URL with country targeting
    return new Response(
      JSON.stringify({
        proxy: {
          provider: proxyConfig.provider,
          hostname: proxyConfig.hostname,
          portHttp: proxyConfig.port_http,
          portSocks5: proxyConfig.port_socks5,
          username: proxyConfig.username,
          password: proxyConfig.password,
        },
        countries: countries || [],
        // Helper: how to construct proxy URL for IPRoyal
        // Format: http://username:password_country-{code}@hostname:port
        urlTemplate: `http://${proxyConfig.username}:${proxyConfig.password}_country-{countryCode}@${proxyConfig.hostname}:${proxyConfig.port_http}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in proxy-config:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
