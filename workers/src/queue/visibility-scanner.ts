import { Worker, Queue } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { ChatGPTClient } from '../clients/chatgpt.js'
import { ClaudeClient } from '../clients/claude.js'
import { GeminiClient } from '../clients/gemini.js'
import { PerplexityClient } from '../clients/perplexity.js'
import { checkRateLimit, trackCost, waitForRateLimit } from '../utils/rate-limiter.js'
import type { ScanJobData, ScanJobResult, AIResponse } from '../types/ai.js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
}

/**
 * Queue for visibility scan jobs
 */
export const visibilityScanQueue = new Queue<ScanJobData>('visibility-scans', { connection })

/**
 * Worker that processes visibility scan jobs
 */
export const visibilityScanWorker = new Worker<ScanJobData, ScanJobResult>(
  'visibility-scans',
  async (job) => {
    const { organizationId, brandId, brandName, promptIds, competitors } = job.data

    console.log(`[Visibility Scanner] Starting scan for org ${organizationId}, brand ${brandId}`)

    // Fetch prompts from database
    const { data: prompts, error: promptError } = await supabase
      .from('prompts')
      .select('*')
      .in('id', promptIds)

    if (promptError || !prompts) {
      throw new Error(`Failed to fetch prompts: ${promptError?.message}`)
    }

    // Initialize all AI clients
    const clients = [
      new ChatGPTClient(),
      new ClaudeClient(),
      new GeminiClient(),
      new PerplexityClient()
    ]

    const allResults: AIResponse[] = []

    // Run prompts across all AI models
    for (const prompt of prompts) {
      console.log(`[Visibility Scanner] Testing prompt: "${prompt.prompt_text}"`)

      // Test with each AI model
      for (const client of clients) {
        try {
          // Check rate limit
          await waitForRateLimit(organizationId, client.model)

          const result = await client.testPrompt(prompt.prompt_text, brandName, competitors)
          allResults.push(result)

          // Track cost
          await trackCost(organizationId, client.model)

          // Store result in database
          await supabase.from('prompt_results').insert({
            prompt_id: prompt.id,
            organization_id: organizationId,
            ai_model: result.model,
            response_text: result.responseText,
            brand_mentioned: result.brandMentioned,
            citation_present: result.citationPresent,
            position: result.position,
            sentiment: result.sentiment,
            competitor_mentions: result.competitorMentions,
            metadata: result.metadata,
            tested_at: result.testedAt
          })

          console.log(`[Visibility Scanner] ${client.model} - Brand mentioned: ${result.brandMentioned}`)
        } catch (error) {
          console.error(`[Visibility Scanner] Error testing with ${client.model}:`, error)
          // Continue with next model
        }
      }

      // Add delay between prompts to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // Calculate visibility score
    const visibilityScore = calculateVisibilityScore(allResults)

    // Store overall score
    await supabase.from('visibility_scores').insert({
      organization_id: organizationId,
      score: visibilityScore,
      ai_model: 'overall',
      period_start: new Date(),
      period_end: new Date(),
      metrics: {
        totalPrompts: prompts.length,
        totalResults: allResults.length,
        mentionRate: allResults.filter(r => r.brandMentioned).length / allResults.length,
        citationRate: allResults.filter(r => r.citationPresent).length / allResults.length
      }
    })

    console.log(`[Visibility Scanner] Scan complete. Visibility score: ${visibilityScore}`)

    return {
      organizationId,
      brandId,
      results: allResults,
      visibilityScore,
      completedAt: new Date()
    }
  },
  { connection }
)

/**
 * Calculate overall visibility score (0-100)
 */
function calculateVisibilityScore(results: AIResponse[]): number {
  if (results.length === 0) return 0

  let score = 0

  for (const result of results) {
    // Brand mentioned: +50 points
    if (result.brandMentioned) {
      score += 50

      // Positive sentiment: +20 points
      if (result.sentiment === 'positive') {
        score += 20
      } else if (result.sentiment === 'neutral') {
        score += 10
      }

      // Early position: +30 points (decreases with position)
      if (result.position !== null && result.position <= 3) {
        score += 30 - (result.position * 5)
      }
    }

    // Citation present: +20 points
    if (result.citationPresent) {
      score += 20
    }
  }

  // Average across all results
  const avgScore = score / results.length

  // Cap at 100
  return Math.min(100, Math.round(avgScore))
}

// Handle worker events
visibilityScanWorker.on('completed', (job) => {
  console.log(`[Visibility Scanner] Job ${job.id} completed successfully`)
})

visibilityScanWorker.on('failed', (job, err) => {
  console.error(`[Visibility Scanner] Job ${job?.id} failed:`, err)
})
