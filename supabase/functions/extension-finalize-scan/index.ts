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

    // Get user's profile
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

    const organizationId = profile.active_organization_id || profile.organization_id

    // Parse request body
    const { scanSessionId, productId } = await req.json()

    if (!scanSessionId || !productId) {
      return new Response(
        JSON.stringify({ error: 'Missing scanSessionId or productId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get aggregated stats for this scan session
    const { data: sessionResults, error: resultsError } = await supabaseAdmin
      .from('prompt_results')
      .select('ai_model, brand_mentioned, citation_present, position')
      .eq('scan_session_id', scanSessionId)
      .eq('product_id', productId)
      .eq('organization_id', organizationId)

    if (resultsError) {
      throw new Error(`Failed to fetch session results: ${resultsError.message}`)
    }

    if (!sessionResults || sessionResults.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No results found for this scan session' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Aggregate by platform
    const platformStats = new Map<string, {
      total: number
      mentioned: number
      cited: number
      positions: number[]
    }>()

    for (const result of sessionResults) {
      const platform = result.ai_model
      if (!platformStats.has(platform)) {
        platformStats.set(platform, { total: 0, mentioned: 0, cited: 0, positions: [] })
      }
      const stats = platformStats.get(platform)!
      stats.total++
      if (result.brand_mentioned) stats.mentioned++
      if (result.citation_present) stats.cited++
      if (result.position) stats.positions.push(result.position)
    }

    // Insert visibility history entries for each platform
    const historyEntries = []
    for (const [platform, stats] of platformStats) {
      const mentionRate = stats.total > 0 ? (stats.mentioned / stats.total) * 100 : 0
      const citationRate = stats.total > 0 ? (stats.cited / stats.total) * 100 : 0
      // Score = mention rate (primary visibility metric)
      const score = Math.round(mentionRate)

      historyEntries.push({
        organization_id: organizationId,
        product_id: productId,
        ai_model: platform,
        score: Math.min(100, score),
        mention_rate: Math.round(mentionRate * 10) / 10,
        citation_rate: Math.round(citationRate * 10) / 10,
        prompts_tested: stats.total,
        prompts_mentioned: stats.mentioned,
        prompts_cited: stats.cited,
        recorded_at: new Date().toISOString()
      })
    }

    if (historyEntries.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('visibility_history')
        .insert(historyEntries)

      if (insertError) {
        console.error('Error inserting visibility history:', insertError)
        // Don't throw - history is supplementary
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scan session finalized',
        stats: {
          totalResults: sessionResults.length,
          platformsUpdated: historyEntries.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error finalizing scan session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
