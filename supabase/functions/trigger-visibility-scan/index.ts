import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * DEPRECATED: Server-side visibility scanning has been replaced by the browser extension.
 *
 * This endpoint now returns a deprecation notice directing users to install the
 * Columbus AEO Monitor Chrome extension for visibility scanning.
 *
 * The extension approach is:
 * - 100% ToS compliant (uses user's own AI platform sessions)
 * - More reliable (no rate limiting or bot detection)
 * - Higher quality results (authentic responses)
 */
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

    // Return deprecation notice
    return new Response(
      JSON.stringify({
        deprecated: true,
        error: 'Server-side scanning has been replaced',
        message: 'Visibility scanning is now performed via the Columbus browser extension. This provides more reliable, ToS-compliant scans using your own AI platform sessions.',
        action: 'install_extension',
        redirectTo: '/dashboard/extension',
        extensionUrl: 'https://chrome.google.com/webstore/detail/columbus-aeo-monitor',
        benefits: [
          '100% ToS compliant - uses your own browser sessions',
          'No rate limiting or bot detection issues',
          'Higher quality, authentic AI responses',
          'Real-time scanning from your browser'
        ]
      }),
      {
        status: 410, // Gone - indicates resource is no longer available
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
