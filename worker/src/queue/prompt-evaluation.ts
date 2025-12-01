import { Queue, Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { createRedisConnection } from '../utils/redis.js'
import { competitorDetector } from '../services/competitor-detector.js'

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
            return {
              organization_id: promptResult.organization_id,
              product_id: promptResult.product_id,
              competitor_id: competitor.id,
              prompt_result_id: promptResultId,
              ai_model: promptResult.ai_model,
              position: details?.position || null,
              mention_context: extractMentionContext(promptResult.response_text, competitor.name),
              sentiment: details?.sentiment || 'neutral',
              detected_at: new Date().toISOString()
            }
          })

          await supabase
            .from('competitor_mentions')
            .insert(mentionsToInsert)
        }
      }

      // 6. Auto-detect new competitors from response and save as 'proposed'
      try {
        const detection = await competitorDetector.detectCompetitors(
          promptResult.response_text,
          productName,
          competitorNames // Pass existing tracked competitors to avoid duplicates
        )

        if (detection.competitors.length > 0 && promptResult.product_id) {
          console.log(`[Prompt Evaluation] Detected ${detection.competitors.length} potential new competitors`)
          const { added, updated } = await competitorDetector.saveDetectedCompetitors(
            promptResult.organization_id,
            promptResult.product_id,
            detection.competitors
          )
          if (added > 0 || updated > 0) {
            console.log(`[Prompt Evaluation] Auto-detected competitors: ${added} new, ${updated} updated`)
          }
        }
      } catch (detectionError) {
        console.error(`[Prompt Evaluation] Competitor auto-detection error:`, detectionError)
        // Don't fail the evaluation for detection errors
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
  "position": number or null,    // If products are listed/ranked, what position is "${productName}"? (1 = first, null if not in a list)
  "sentiment": "positive" | "neutral" | "negative",  // How is "${productName}" portrayed?
  "competitorMentions": ["name1", "name2"],  // Which competitors from the list are mentioned?
  "competitorDetails": [  // Details for each mentioned competitor
    {
      "name": "competitor name",
      "position": number or null,  // Position in list if ranked (1 = first, null if not in a list)
      "sentiment": "positive" | "neutral" | "negative"  // How is this competitor portrayed?
    }
  ],
  "summary": "Brief 1-2 sentence summary of how the brand appears in this response",
  "confidence": 0.0-1.0  // How confident are you in this analysis?
}

Important rules:
- brandMentioned should be TRUE only if the product/brand name is explicitly mentioned (not just implied)
- position should reflect the actual ranking if there's a numbered or bulleted list of recommendations
- For sentiment, consider the context around the brand mention - is it recommended, criticized, or just mentioned neutrally?
- Only include competitors that are ACTUALLY mentioned in the response
- For each competitor, determine their position in the ranking (if any) and sentiment independently
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
            sentiment: ['positive', 'negative', 'neutral'].includes(c.sentiment) ? c.sentiment : 'neutral'
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
