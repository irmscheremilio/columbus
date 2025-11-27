import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'
import { incrementUsage } from '../_shared/plan-limits.ts'

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

interface AIEvaluation {
  brandMentioned: boolean
  position: number | null
  sentiment: 'positive' | 'neutral' | 'negative'
  competitorMentions: string[]
  summary: string
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

    // Get competitors for this product
    const { data: competitors } = await supabaseAdmin
      .from('competitors')
      .select('id, name')
      .eq('product_id', result.productId)
      .eq('is_active', true)

    const competitorNames = competitors?.map(c => c.name) || []

    // Evaluate response with AI
    let aiEvaluation: AIEvaluation | null = null
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (openaiApiKey && result.responseText) {
      try {
        aiEvaluation = await evaluateResponseWithAI(
          result.responseText,
          product.name,
          competitorNames,
          openaiApiKey
        )
        console.log('AI Evaluation result:', aiEvaluation)
      } catch (evalError) {
        console.error('AI evaluation failed, using extension values:', evalError)
      }
    }

    // Use AI evaluation if available, otherwise fall back to extension's analysis
    const brandMentioned = aiEvaluation?.brandMentioned ?? result.brandMentioned
    const position = aiEvaluation?.position ?? result.position
    const sentiment = aiEvaluation?.sentiment ?? result.sentiment
    const competitorMentions = aiEvaluation?.competitorMentions ?? result.competitorMentions

    // Insert prompt result
    const { data: promptResult, error: insertError } = await supabaseAdmin
      .from('prompt_results')
      .insert({
        prompt_id: result.promptId,
        organization_id: organizationId,
        product_id: result.productId,
        scan_session_id: result.scanSessionId || null,
        ai_model: result.platform,
        response_text: result.responseText,
        brand_mentioned: brandMentioned,
        citation_present: result.citationPresent,
        position: position,
        sentiment: sentiment,
        competitor_mentions: competitorMentions,
        metadata: {
          ...result.metadata,
          aiEvaluated: !!aiEvaluation,
          evaluationSummary: aiEvaluation?.summary
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

    // Insert competitor mentions if present
    if (competitorMentions && competitorMentions.length > 0 && competitors) {
      // Get competitor IDs for the mentioned names
      const mentionedCompetitors = competitors.filter(c =>
        competitorMentions.some(m => m.toLowerCase() === c.name.toLowerCase())
      )

      if (mentionedCompetitors.length > 0) {
        const mentionsToInsert = mentionedCompetitors.map(competitor => ({
          organization_id: organizationId,
          product_id: result.productId,
          competitor_id: competitor.id,
          prompt_result_id: promptResult.id,
          ai_model: result.platform,
          mention_context: extractMentionContext(result.responseText, competitor.name),
          sentiment: sentiment,
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
        message: 'Scan result saved successfully',
        evaluation: aiEvaluation ? {
          brandMentioned,
          position,
          sentiment,
          competitorMentions
        } : null
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

function extractMentionContext(text: string, name: string): string {
  const index = text.toLowerCase().indexOf(name.toLowerCase())
  if (index === -1) return ''

  const start = Math.max(0, index - 100)
  const end = Math.min(text.length, index + name.length + 100)
  return text.slice(start, end)
}

/**
 * Evaluate AI response using OpenAI to determine brand mention, position, sentiment, and competitors
 */
async function evaluateResponseWithAI(
  responseText: string,
  productName: string,
  competitorNames: string[],
  apiKey: string
): Promise<AIEvaluation> {
  const openai = new OpenAI({ apiKey })

  const prompt = `Analyze this AI-generated response and determine:

1. **Brand Mentioned**: Is "${productName}" (or clear variations of it) mentioned in the response? Answer true or false.

2. **Position**: If "${productName}" is mentioned in a numbered or bulleted list of recommendations/options, what position is it in? Answer with the number (1, 2, 3, etc.) or null if not in a list.

3. **Sentiment**: What is the overall sentiment toward "${productName}" in this response? Answer: "positive", "negative", or "neutral".

4. **Competitor Mentions**: Which of these competitors are mentioned: ${competitorNames.join(', ')}? List only the ones that are mentioned.

5. **Summary**: Provide a brief (1-2 sentence) summary of how "${productName}" is portrayed in this response.

Response to analyze:
"""
${responseText.slice(0, 3000)}
"""

Respond in this exact JSON format:
{
  "brandMentioned": true/false,
  "position": number or null,
  "sentiment": "positive" | "neutral" | "negative",
  "competitorMentions": ["competitor1", "competitor2"],
  "summary": "Brief summary"
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 500,
    response_format: { type: 'json_object' }
  })

  const responseContent = completion.choices[0]?.message?.content || '{}'

  try {
    const parsed = JSON.parse(responseContent)
    return {
      brandMentioned: !!parsed.brandMentioned,
      position: typeof parsed.position === 'number' ? parsed.position : null,
      sentiment: ['positive', 'negative', 'neutral'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
      competitorMentions: Array.isArray(parsed.competitorMentions) ? parsed.competitorMentions : [],
      summary: parsed.summary || ''
    }
  } catch {
    console.error('Failed to parse AI evaluation response:', responseContent)
    throw new Error('Invalid AI evaluation response')
  }
}
