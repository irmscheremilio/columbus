import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Paid plans that have access to proxy/geo-targeting feature
const PAID_PLANS = ['pro', 'agency', 'enterprise']

interface StaticProxy {
  id: string
  countryCode: string
  countryName: string
  flagEmoji: string | null
  host: string
  port: number
  username: string | null
  password: string | null
  proxyType: string
  priority: number
  weight: number
}

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

    // Fetch all static proxies with country info (supports multiple per country)
    const { data: staticProxies, error: staticError } = await supabaseAdmin
      .from('static_proxies')
      .select(`
        id,
        country_code,
        host,
        port,
        username,
        password,
        proxy_type,
        priority,
        weight,
        proxy_countries (
          name,
          flag_emoji
        )
      `)
      .eq('is_active', true)

    if (staticError) {
      console.error('Failed to fetch static proxies:', staticError)
    }

    // Fetch all available countries (even those without proxies configured)
    const { data: countries, error: countriesError } = await supabaseAdmin
      .from('proxy_countries')
      .select('code, name, flag_emoji, region')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (countriesError) {
      console.error('Failed to fetch countries:', countriesError)
    }

    // Build proxies array with country info
    // Desktop app will receive all proxies and can do local selection
    const proxies: StaticProxy[] = (staticProxies || []).map((p: any) => ({
      id: p.id,
      countryCode: p.country_code,
      countryName: p.proxy_countries?.name || p.country_code.toUpperCase(),
      flagEmoji: p.proxy_countries?.flag_emoji || null,
      host: p.host,
      port: p.port,
      username: p.username,
      password: p.password,
      proxyType: p.proxy_type,
      priority: p.priority,
      weight: p.weight,
    }))

    // Get list of countries that have proxies configured (unique)
    const configuredCountries = [...new Set(proxies.map(p => p.countryCode))]

    // Group proxies by country for the response
    const proxiesByCountry: Record<string, StaticProxy[]> = {}
    for (const proxy of proxies) {
      if (!proxiesByCountry[proxy.countryCode]) {
        proxiesByCountry[proxy.countryCode] = []
      }
      proxiesByCountry[proxy.countryCode].push(proxy)
    }

    // Return static proxies and all available countries
    return new Response(
      JSON.stringify({
        // All proxies (desktop app caches these)
        proxies,
        // Proxies grouped by country (easier for selection)
        proxiesByCountry,
        // All available countries (for UI selection)
        countries: countries || [],
        // Countries that have proxies configured
        configuredCountries,
        // Type of proxy system being used
        proxyType: 'static',
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
