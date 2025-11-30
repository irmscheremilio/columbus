import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScanResult {
  productId: string
  scanSessionId?: string
  platform: 'chatgpt' | 'claude' | 'gemini' | 'perplexity'
  promptId: string
  promptText: string
  responseText: string
  brandMentioned: boolean
  citationPresent: boolean
  position: number | null
  sentiment: 'positive' | 'neutral' | 'negative'
  competitorMentions: string[]
  citations: { url: string; title?: string; position?: number }[]
  metadata: {
    modelUsed?: string
    hadWebSearch?: boolean
    responseTimeMs: number
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role for database operations
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

    // Parse request body
    const result: ScanResult = await req.json()

    // Validate required fields
    if (!result.productId || !result.platform || !result.promptId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: productId, platform, promptId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Skip saving if there's no meaningful response - don't pollute statistics
    if (!result.responseText || result.responseText.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          skipped: true,
          reason: 'No response available - result not saved to preserve statistics accuracy'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify product belongs to user's organization
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, name, domain')
      .eq('id', result.productId)
      .eq('organization_id', organizationId)
      .single()

    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save raw result immediately (no AI evaluation - that's done async by worker)
    // Use extension's basic analysis for now, worker will override with AI evaluation
    const { data: promptResult, error: insertError } = await supabaseAdmin
      .from('prompt_results')
      .insert({
        prompt_id: result.promptId,
        organization_id: organizationId,
        product_id: result.productId,
        scan_session_id: result.scanSessionId || null,
        ai_model: result.platform,
        response_text: result.responseText,
        brand_mentioned: result.brandMentioned,  // Extension's basic detection
        citation_present: result.citationPresent,
        position: result.position,  // Extension's basic detection
        sentiment: result.sentiment,  // Extension's basic detection
        competitor_mentions: result.competitorMentions,
        metadata: {
          ...result.metadata,
          aiEvaluated: false,  // Mark as not yet evaluated by AI
          source: 'extension'
        },
        source: 'extension',
        tested_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting prompt result:', insertError)
      throw new Error(`Failed to save result: ${insertError.message}`)
    }

    // Insert citations if present
    if (result.citations && result.citations.length > 0) {
      const citationsToInsert = result.citations.map((citation, index) => ({
        prompt_result_id: promptResult.id,
        organization_id: organizationId,
        product_id: result.productId,
        url: citation.url,
        source_domain: extractDomain(citation.url),
        source_title: citation.title || null,
        citation_position: citation.position ?? index + 1,
        is_brand_source: isBrandSource(citation.url, product.domain),
        created_at: new Date().toISOString()
      }))

      await supabaseAdmin
        .from('prompt_citations')
        .insert(citationsToInsert)
    }

    // Queue a job for AI evaluation (async processing by worker)
    const { error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        organization_id: organizationId,
        product_id: result.productId,
        job_type: 'prompt_evaluation',
        status: 'queued',
        metadata: {
          promptResultId: promptResult.id
        }
      })

    if (jobError) {
      console.error('Error queueing evaluation job:', jobError)
      // Don't fail the request - result is saved, evaluation can be retried
    }

    // Update extension session's last scan time
    await supabaseAdmin
      .from('extension_sessions')
      .upsert({
        user_id: user.id,
        organization_id: organizationId,
        product_id: result.productId,
        last_scan_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    return new Response(
      JSON.stringify({
        success: true,
        resultId: promptResult.id,
        message: 'Scan result saved, AI evaluation queued',
        queued: !jobError
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing scan result:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper functions
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace('www.', '')
  } catch {
    return url
  }
}

function isBrandSource(url: string, productDomain: string): boolean {
  if (!productDomain) return false
  const citationDomain = extractDomain(url).toLowerCase()
  const brandDomain = productDomain.toLowerCase().replace('www.', '')
  return citationDomain.includes(brandDomain) || brandDomain.includes(citationDomain)
}
