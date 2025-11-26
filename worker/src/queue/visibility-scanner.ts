import { Worker, Queue } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { createAIClient } from '../lib/ai-clients/index.js'
import { checkRateLimit, trackCost, waitForRateLimit } from '../utils/rate-limiter.js'
import { sendScanCompletedEmail } from '../services/email.js'
import { createRedisConnection } from '../utils/redis.js'
import { competitorDetector } from '../services/competitor-detector.js'
import type { AIModel, AIResponse, ScanJobData, ScanJobResult } from '../types/ai.js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const connection = createRedisConnection()

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
    const { organizationId, promptIds, competitors } = job.data
    // Support both product (new) and brand (legacy) naming
    const productId = job.data.productId || job.data.brandId
    const productName = job.data.productName || job.data.brandName || 'Unknown'

    console.log(`[Visibility Scanner] Starting scan for org ${organizationId}, product ${productId}`)

    // Fetch prompts from database
    const { data: prompts, error: promptError } = await supabase
      .from('prompts')
      .select('*')
      .in('id', promptIds)

    if (promptError || !prompts) {
      throw new Error(`Failed to fetch prompts: ${promptError?.message}`)
    }

    // AI models to test with
    const models: AIModel[] = ['chatgpt', 'claude', 'gemini', 'perplexity']

    const allResults: AIResponse[] = []

    // Run prompts across all AI models
    for (const prompt of prompts) {
      console.log(`[Visibility Scanner] Testing prompt: "${prompt.prompt_text}"`)

      // Test with each AI model
      for (const model of models) {
        try {
          // Check rate limit
          await waitForRateLimit(organizationId, model)

          // Get AI client for this model
          const client = createAIClient(model)

          // Get response from AI
          const responseText = await client.testPrompt(prompt.prompt_text)

          // Format into full response with product/brand analysis
          const clientResult = client.formatResponse(responseText, productName, competitors)

          // Construct compatible AIResponse
          const result: AIResponse = {
            model,
            prompt: prompt.prompt_text,
            responseText: clientResult.responseText,
            brandMentioned: clientResult.brandMentioned,
            citationPresent: clientResult.citationPresent,
            position: clientResult.position,
            sentiment: clientResult.sentiment || 'neutral',
            competitorMentions: clientResult.competitorMentions,
            citedSources: [],
            metadata: clientResult.metadata || {},
            testedAt: new Date()
          }
          allResults.push(result)

          // Track cost
          await trackCost(organizationId, model)

          // Store result in database
          const { data: promptResult } = await supabase.from('prompt_results').insert({
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
          }).select('id').single()

          // Auto-detect competitors from response
          try {
            const detection = await competitorDetector.detectCompetitors(
              result.responseText,
              productName,
              competitors
            )

            if (detection.competitors.length > 0) {
              console.log(`[Visibility Scanner] Detected ${detection.competitors.length} potential competitors in ${model} response`)
              await competitorDetector.saveDetectedCompetitors(
                organizationId,
                productName,
                detection.competitors
              )
            }
          } catch (detectionError) {
            console.error(`[Visibility Scanner] Competitor detection error:`, detectionError)
            // Don't fail the scan for detection errors
          }

          console.log(`[Visibility Scanner] ${model} - Brand mentioned: ${result.brandMentioned}`)
        } catch (error) {
          console.error(`[Visibility Scanner] Error testing with ${model}:`, error)
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

    // Store per-model visibility history for trend analysis
    const modelStats = calculatePerModelStats(allResults, models)
    const historyEntries = modelStats.map(stat => ({
      organization_id: organizationId,
      ai_model: stat.model,
      score: stat.score,
      mention_rate: stat.mentionRate,
      citation_rate: stat.citationRate,
      prompts_tested: stat.promptsTested,
      prompts_mentioned: stat.promptsMentioned,
      prompts_cited: stat.promptsCited,
      recorded_at: new Date().toISOString()
    }))

    if (historyEntries.length > 0) {
      const { error: historyError } = await supabase
        .from('visibility_history')
        .insert(historyEntries)

      if (historyError) {
        console.error('[Visibility Scanner] Error storing visibility history:', historyError)
        // Don't throw - history is supplementary
      } else {
        console.log(`[Visibility Scanner] Stored visibility history for ${historyEntries.length} AI models`)
      }
    }

    console.log(`[Visibility Scanner] Scan complete. Visibility score: ${visibilityScore}`)

    return {
      organizationId,
      productId,
      brandId: productId, // backwards compatibility
      results: allResults,
      visibilityScore,
      completedAt: new Date()
    }
  },
  { connection }
)

interface ModelStats {
  model: AIModel
  score: number
  mentionRate: number
  citationRate: number
  promptsTested: number
  promptsMentioned: number
  promptsCited: number
}

/**
 * Calculate per-model statistics for visibility history
 */
function calculatePerModelStats(results: AIResponse[], models: AIModel[]): ModelStats[] {
  return models.map(model => {
    const modelResults = results.filter(r => r.model === model)
    const promptsTested = modelResults.length
    const promptsMentioned = modelResults.filter(r => r.brandMentioned).length
    const promptsCited = modelResults.filter(r => r.citationPresent).length

    const mentionRate = promptsTested > 0 ? (promptsMentioned / promptsTested) * 100 : 0
    const citationRate = promptsTested > 0 ? (promptsCited / promptsTested) * 100 : 0

    // Calculate model-specific score
    const score = calculateVisibilityScore(modelResults)

    return {
      model,
      score,
      mentionRate: Math.round(mentionRate * 100) / 100,
      citationRate: Math.round(citationRate * 100) / 100,
      promptsTested,
      promptsMentioned,
      promptsCited
    }
  })
}

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
visibilityScanWorker.on('completed', async (job, result) => {
  console.log(`[Visibility Scanner] Job ${job.id} completed successfully`)

  try {
    // Mark job as completed in database if jobId is provided
    if (job.data.jobId) {
      await supabase
        .from('jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.data.jobId)
    }

    // Get organization owner's email for notification
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', job.data.organizationId)
      .single()

    if (!org) return

    // Get owner's profile
    const { data: owner } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('organization_id', org.id)
      .eq('role', 'owner')
      .single()

    if (!owner?.email) return

    // Send completion email
    await sendScanCompletedEmail({
      recipientEmail: owner.email,
      recipientName: owner.full_name || 'there',
      brandName: job.data.productName || job.data.brandName || org.name,
      scanType: 'visibility',
      totalScans: result.results.length,
      visibilityScore: result.visibilityScore,
      dashboardUrl: `${process.env.APP_URL || 'https://columbus-aeo.com'}/dashboard`
    })

    console.log(`[Visibility Scanner] Notification email sent to ${owner.email}`)
  } catch (error) {
    console.error('[Visibility Scanner] Error sending completion email:', error)
    // Don't throw - email failure shouldn't affect job completion
  }
})

visibilityScanWorker.on('failed', async (job, err) => {
  console.error(`[Visibility Scanner] Job ${job?.id} failed:`, err)

  // Mark job as failed in database if jobId is provided
  if (job?.data.jobId) {
    try {
      await supabase
        .from('jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: err.message
        })
        .eq('id', job.data.jobId)
    } catch (updateError) {
      console.error('[Visibility Scanner] Error updating job status:', updateError)
    }
  }
})
