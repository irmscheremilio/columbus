import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { incrementUsage } from '../_shared/plan-limits.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScanResult {
  productId: string
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
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: 'User has no organization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const organizationId = profile.organization_id

    // Parse request body
    const result: ScanResult = await req.json()

    // Validate required fields
    if (!result.productId || !result.platform || !result.promptId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: productId, platform, promptId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify product belongs to user's organization
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, name, brand_name')
      .eq('id', result.productId)
      .eq('organization_id', organizationId)
      .single()

    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert prompt result
    const { data: promptResult, error: insertError } = await supabaseAdmin
      .from('prompt_results')
      .insert({
        prompt_id: result.promptId,
        organization_id: organizationId,
        product_id: result.productId,
        ai_model: result.platform,
        response_text: result.responseText,
        brand_mentioned: result.brandMentioned,
        citation_present: result.citationPresent,
        position: result.position,
        sentiment: result.sentiment,
        competitor_mentions: result.competitorMentions,
        metadata: result.metadata,
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
        is_brand_source: isBrandSource(citation.url, product.brand_name),
        created_at: new Date().toISOString()
      }))

      await supabaseAdmin
        .from('prompt_citations')
        .insert(citationsToInsert)
    }

    // Insert competitor mentions if present
    if (result.competitorMentions && result.competitorMentions.length > 0) {
      // Get competitor IDs for the mentioned names
      const { data: competitors } = await supabaseAdmin
        .from('competitors')
        .select('id, name')
        .eq('product_id', result.productId)
        .in('name', result.competitorMentions)

      if (competitors && competitors.length > 0) {
        const mentionsToInsert = competitors.map(competitor => ({
          organization_id: organizationId,
          product_id: result.productId,
          competitor_id: competitor.id,
          prompt_result_id: promptResult.id,
          ai_model: result.platform,
          mention_context: extractMentionContext(result.responseText, competitor.name),
          sentiment: result.sentiment,
          detected_at: new Date().toISOString()
        }))

        await supabaseAdmin
          .from('competitor_mentions')
          .insert(mentionsToInsert)
      }
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
        message: 'Scan result saved successfully'
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

function isBrandSource(url: string, brandName: string): boolean {
  if (!brandName) return false
  const domain = extractDomain(url).toLowerCase()
  const brand = brandName.toLowerCase().replace(/\s+/g, '')
  return domain.includes(brand)
}

function extractMentionContext(text: string, name: string): string {
  const index = text.toLowerCase().indexOf(name.toLowerCase())
  if (index === -1) return ''

  const start = Math.max(0, index - 100)
  const end = Math.min(text.length, index + name.length + 100)
  return text.slice(start, end)
}
