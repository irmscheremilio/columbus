import { Queue, Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { createRedisConnection } from '../utils/redis.js'
import { competitorDetector } from '../services/competitor-detector.js'
import { improvementAnalyzer, type ImprovementSuggestion } from '../services/improvement-analyzer.js'

const redisConnection = createRedisConnection()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface PromptEvaluationJobData {
  promptResultId: string
  jobId?: string
}

export interface CompetitorMention {
  name: string
  position: number | null
  sentiment: 'positive' | 'neutral' | 'negative'
  excerpt: string
}

export interface AIEvaluation {
  brandMentioned: boolean
  position: number | null
  sentiment: 'positive' | 'neutral' | 'negative'
  competitorMentions: string[]
  competitorDetails: CompetitorMention[]
  summary: string
  confidence: number
}

/**
 * Prompt Evaluation Queue
 * Evaluates AI responses using OpenAI to extract brand mention, position, sentiment, etc.
 */
export const promptEvaluationQueue = new Queue<PromptEvaluationJobData>('prompt-evaluation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000
    },
    removeOnComplete: 100,
    removeOnFail: 100
  }
})

/**
 * Prompt Evaluation Worker
 * Processes prompt evaluation jobs
 */
export const promptEvaluationWorker = new Worker<PromptEvaluationJobData>(
  'prompt-evaluation',
  async (job) => {
    const { promptResultId } = job.data

    console.log(`[Prompt Evaluation] Starting evaluation for result ${promptResultId}`)

    try {
      // 1. Fetch the prompt result with related data
      const { data: promptResult, error: fetchError } = await supabase
        .from('prompt_results')
        .select(`
          *,
          products(id, name, domain),
          prompts(prompt_text)
        `)
        .eq('id', promptResultId)
        .single()

      if (fetchError || !promptResult) {
        throw new Error(`Failed to fetch prompt result: ${fetchError?.message || 'Not found'}`)
      }

      // Skip if already evaluated
      if (promptResult.metadata?.aiEvaluated) {
        console.log(`[Prompt Evaluation] Result ${promptResultId} already evaluated, skipping`)
        return { skipped: true, reason: 'Already evaluated' }
      }

      // Skip if no response text
      if (!promptResult.response_text || promptResult.response_text.length < 20) {
        console.log(`[Prompt Evaluation] Result ${promptResultId} has no/short response, skipping`)
        return { skipped: true, reason: 'No response text' }
      }

      const productName = promptResult.products?.name || 'Unknown'
      const productDomain = promptResult.products?.domain || ''

      // 2. Get competitors for this product (only those being actively tracked)
      const { data: competitors } = await supabase
        .from('competitors')
        .select('id, name')
        .eq('product_id', promptResult.product_id)
        .eq('status', 'tracking')

      const competitorNames = competitors?.map(c => c.name) || []

      // 3. Evaluate with OpenAI
      console.log(`[Prompt Evaluation] Evaluating response for product "${productName}"`)
      const evaluation = await evaluateResponseWithAI(
        promptResult.response_text,
        productName,
        productDomain,
        competitorNames,
        promptResult.prompts?.prompt_text || ''
      )

      console.log(`[Prompt Evaluation] Evaluation complete:`, {
        brandMentioned: evaluation.brandMentioned,
        position: evaluation.position,
        sentiment: evaluation.sentiment,
        competitorMentions: evaluation.competitorMentions.length,
        confidence: evaluation.confidence
      })

      // 4. Update the prompt result with evaluation
      const { error: updateError } = await supabase
        .from('prompt_results')
        .update({
          brand_mentioned: evaluation.brandMentioned,
          position: evaluation.position,
          sentiment: evaluation.sentiment,
          competitor_mentions: evaluation.competitorMentions,
          metadata: {
            ...promptResult.metadata,
            aiEvaluated: true,
            evaluatedAt: new Date().toISOString(),
            evaluationSummary: evaluation.summary,
            evaluationConfidence: evaluation.confidence
          }
        })
        .eq('id', promptResultId)

      if (updateError) {
        throw new Error(`Failed to update prompt result: ${updateError.message}`)
      }

      // 5. Insert competitor mentions if found (for tracked competitors)
      if (evaluation.competitorDetails.length > 0 && competitors) {
        // Create a map from competitor name to their details
        const detailsMap = new Map(
          evaluation.competitorDetails.map(cd => [cd.name.toLowerCase(), cd])
        )

        const mentionedCompetitors = competitors.filter(c =>
          detailsMap.has(c.name.toLowerCase())
        )

        if (mentionedCompetitors.length > 0) {
          const mentionsToInsert = mentionedCompetitors.map(competitor => {
            const details = detailsMap.get(competitor.name.toLowerCase())
            // Use AI-generated excerpt if available, fall back to automatic extraction
            const mentionContext = details?.excerpt || extractMentionContext(promptResult.response_text, competitor.name)
            return {
              organization_id: promptResult.organization_id,
              product_id: promptResult.product_id,
              competitor_id: competitor.id,
              prompt_result_id: promptResultId,
              ai_model: promptResult.ai_model,
              position: details?.position || null,
              mention_context: mentionContext,
              sentiment: details?.sentiment || 'neutral',
              detected_at: new Date().toISOString()
            }
          })

          await supabase
            .from('competitor_mentions')
            .insert(mentionsToInsert)
        }
      }

      // 6. AI-powered competitor detection - detect and save new competitors as 'proposed'
      try {
        const detection = await competitorDetector.detectCompetitors(
          promptResult.response_text,
          productName,
          competitorNames // Pass existing tracked competitors for context
        )

        if (detection.competitors.length > 0 && promptResult.product_id) {
          console.log(`[Prompt Evaluation] AI detected ${detection.competitors.length} potential competitors`)
          const { added, updated } = await competitorDetector.saveDetectedCompetitors(
            promptResult.organization_id,
            promptResult.product_id,
            detection.competitors
          )
          if (added > 0) {
            console.log(`[Prompt Evaluation] Added ${added} new proposed competitors`)
          }
        }
      } catch (detectionError) {
        console.error(`[Prompt Evaluation] Competitor detection error:`, detectionError)
        // Don't fail the evaluation for detection errors
      }

      // 7. Detect visibility gaps - opportunities where competitors are favored over brand
      try {
        const gapAnalysis = await improvementAnalyzer.analyzeResponse(
          promptResult.response_text,
          productName,
          evaluation.brandMentioned,
          evaluation.position,
          promptResult.citation_present || false,
          competitorNames
        )

        if (gapAnalysis.suggestions.length > 0) {
          console.log(`[Prompt Evaluation] Detected ${gapAnalysis.suggestions.length} visibility gaps`)

          // Create a map from competitor name to competitor id
          const competitorNameToId = new Map<string, string>()
          if (competitors) {
            for (const c of competitors) {
              competitorNameToId.set(c.name.toLowerCase(), c.id)
            }
          }

          // Insert gaps into visibility_gaps table
          const gapsToInsert = gapAnalysis.suggestions.map(suggestion => {
            const competitorId = suggestion.competitorName
              ? competitorNameToId.get(suggestion.competitorName.toLowerCase())
              : null

            return {
              organization_id: promptResult.organization_id,
              product_id: promptResult.product_id,
              competitor_id: competitorId || null,
              prompt_id: promptResult.prompt_id,
              ai_model: promptResult.ai_model,
              competitor_mentioned: evaluation.competitorMentions.length > 0,
              brand_mentioned: evaluation.brandMentioned,
              gap_type: mapSuggestionToGapType(suggestion.type),
              issue_type: mapSuggestionToIssueType(suggestion.type),
              severity: suggestion.severity,
              ai_analysis: suggestion.description,
              improvement_suggestion: suggestion.recommendedAction || null,
              suggested_action: getSuggestedAction(suggestion.type, suggestion.competitorName),
              response_excerpt: suggestion.context || promptResult.response_text?.substring(0, 500) || null,
              brand_sentiment: evaluation.brandMentioned
                ? (suggestion.type === 'negative_comparison' || suggestion.type === 'pricing_concern' ? 'negative' : 'neutral')
                : null,
              competitor_sentiment: suggestion.competitorName
                ? (suggestion.type === 'competitor_advantage' ? 'positive' : 'neutral')
                : null,
              detected_at: new Date().toISOString()
            }
          })

          // Insert gaps (upsert to avoid duplicates for same prompt/model/type)
          const { error: gapError } = await supabase
            .from('visibility_gaps')
            .insert(gapsToInsert)

          if (gapError) {
            console.error(`[Prompt Evaluation] Error inserting gaps:`, gapError)
          } else {
            console.log(`[Prompt Evaluation] Inserted ${gapsToInsert.length} visibility gaps`)
          }
        }
      } catch (gapError) {
        console.error(`[Prompt Evaluation] Gap detection error:`, gapError)
        // Don't fail the evaluation for gap detection errors
      }

      // Mark job as completed if jobId provided
      if (job.data.jobId) {
        await supabase
          .from('jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', job.data.jobId)
      }

      return {
        success: true,
        promptResultId,
        evaluation: {
          brandMentioned: evaluation.brandMentioned,
          position: evaluation.position,
          sentiment: evaluation.sentiment,
          competitorCount: evaluation.competitorMentions.length
        }
      }
    } catch (error) {
      console.error(`[Prompt Evaluation] Error:`, error)

      // Mark job as failed if jobId provided
      if (job.data.jobId) {
        await supabase
          .from('jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', job.data.jobId)
      }

      throw error
    }
  },
  {
    connection: redisConnection,
    concurrency: 5 // Process 5 evaluations in parallel
  }
)

/**
 * Evaluate AI response using OpenAI
 */
async function evaluateResponseWithAI(
  responseText: string,
  productName: string,
  productDomain: string,
  competitorNames: string[],
  originalPrompt: string
): Promise<AIEvaluation> {
  const prompt = `You are an expert at analyzing AI-generated responses to determine brand visibility and sentiment.

Analyze this AI-generated response and determine:

**Product/Brand to find:** "${productName}"${productDomain ? ` (website: ${productDomain})` : ''}

**Original question asked:** "${originalPrompt}"

**Competitors to check for:** ${competitorNames.length > 0 ? competitorNames.join(', ') : 'None specified'}

**AI Response to analyze:**
"""
${responseText.slice(0, 4000)}
"""

Provide your analysis in the following JSON format:
{
  "brandMentioned": true/false,  // Is "${productName}" (or clear variations/the company behind it) explicitly mentioned?
  "position": number or null,    // In what order is "${productName}" mentioned as a solution? (1 = first brand/product mentioned, 2 = second, etc.). null if not mentioned.
  "sentiment": "positive" | "neutral" | "negative",  // How is "${productName}" portrayed?
  "competitorMentions": ["name1", "name2"],  // Which competitors from the list are mentioned?
  "competitorDetails": [  // Details for each mentioned competitor
    {
      "name": "competitor name",
      "position": number or null,  // In what order is this competitor mentioned? (1 = first brand mentioned, 2 = second, etc.). null if not mentioned as a solution.
      "sentiment": "positive" | "neutral" | "negative",  // How is this competitor portrayed?
      "excerpt": "A brief, meaningful quote from the response about this competitor (max 150 chars)"
    }
  ],
  "summary": "Brief 1-2 sentence summary of how the brand appears in this response",
  "confidence": 0.0-1.0  // How confident are you in this analysis?
}

Important rules:
- brandMentioned should be TRUE only if the product/brand name is explicitly mentioned (not just implied)
- position represents the order in which brands/products are mentioned as solutions in the response. The first brand recommended or mentioned is position 1, the second is position 2, etc. This applies whether the response uses a numbered list, bullet points, or just paragraphs. Count all brands/products mentioned as solutions, not just the tracked ones.
- For sentiment, consider the context around the brand mention - is it recommended, criticized, or just mentioned neutrally?
- Only include competitors that are ACTUALLY mentioned in the response
- For each competitor, determine their position (order of mention among all brands) and sentiment independently
- For the excerpt, extract the most relevant sentence or phrase about the competitor from the response - this should be an actual quote that captures how the competitor is described
- Be precise and conservative in your analysis`

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

    // Parse competitor details
    const competitorDetails: CompetitorMention[] = Array.isArray(parsed.competitorDetails)
      ? parsed.competitorDetails
          .filter((c: any) => c && typeof c.name === 'string')
          .map((c: any) => ({
            name: c.name,
            position: typeof c.position === 'number' && c.position > 0 ? c.position : null,
            sentiment: ['positive', 'negative', 'neutral'].includes(c.sentiment) ? c.sentiment : 'neutral',
            excerpt: typeof c.excerpt === 'string' ? c.excerpt.slice(0, 200) : ''
          }))
      : []

    return {
      brandMentioned: !!parsed.brandMentioned,
      position: typeof parsed.position === 'number' && parsed.position > 0 ? parsed.position : null,
      sentiment: ['positive', 'negative', 'neutral'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'neutral',
      competitorMentions: Array.isArray(parsed.competitorMentions)
        ? parsed.competitorMentions.filter((c: any) => typeof c === 'string')
        : [],
      competitorDetails,
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
    }
  } catch (parseError) {
    console.error('[Prompt Evaluation] Failed to parse AI response:', responseContent)
    // Return conservative defaults
    return {
      brandMentioned: responseText.toLowerCase().includes(productName.toLowerCase()),
      position: null,
      sentiment: 'neutral',
      competitorMentions: [],
      competitorDetails: [],
      summary: 'Failed to parse AI evaluation',
      confidence: 0.1
    }
  }
}

/**
 * Extract context around a mention
 */
function extractMentionContext(text: string, name: string): string {
  const index = text.toLowerCase().indexOf(name.toLowerCase())
  if (index === -1) return ''

  const start = Math.max(0, index - 100)
  const end = Math.min(text.length, index + name.length + 100)
  return text.slice(start, end)
}

/**
 * Map suggestion type to gap type for visibility_gaps table
 */
function mapSuggestionToGapType(suggestionType: string): string {
  const mapping: Record<string, string> = {
    negative_comparison: 'negative_comparison',
    missing_feature: 'missing_feature',
    competitor_advantage: 'competitor_only',
    pricing_concern: 'pricing_concern',
    outdated_info: 'outdated_info',
    missing_mention: 'competitor_only',
    low_position: 'positioning_issue',
    no_citation: 'positioning_issue'
  }
  return mapping[suggestionType] || 'competitor_only'
}

/**
 * Map suggestion type to issue type for visibility_gaps table
 */
function mapSuggestionToIssueType(suggestionType: string): string {
  const mapping: Record<string, string> = {
    negative_comparison: 'negative_sentiment',
    missing_feature: 'feature_gap',
    competitor_advantage: 'recommendation_bias',
    pricing_concern: 'price_comparison',
    outdated_info: 'outdated_info',
    missing_mention: 'missing_mention',
    low_position: 'market_position',
    no_citation: 'missing_mention'
  }
  return mapping[suggestionType] || 'missing_mention'
}

/**
 * Get a suggested action based on the issue type
 */
function getSuggestedAction(suggestionType: string, competitorName?: string): string {
  const actions: Record<string, string> = {
    negative_comparison: 'create_comparison_post',
    missing_feature: 'add_feature_docs',
    competitor_advantage: 'create_differentiator_content',
    pricing_concern: 'update_pricing_page',
    outdated_info: 'update_website_content',
    missing_mention: 'create_comparison_content',
    low_position: 'improve_brand_authority',
    no_citation: 'create_authoritative_content'
  }
  return actions[suggestionType] || 'review_content_strategy'
}

// Event listeners
promptEvaluationWorker.on('completed', (job, result) => {
  if (!result?.skipped) {
    console.log(`[Prompt Evaluation] Job ${job.id} completed successfully`)
  }
})

promptEvaluationWorker.on('failed', (job, err) => {
  console.error(`[Prompt Evaluation] Job ${job?.id} failed:`, err.message)
})

promptEvaluationWorker.on('error', (err) => {
  console.error('[Prompt Evaluation] Worker error:', err)
})

console.log('[Prompt Evaluation] Worker started')
