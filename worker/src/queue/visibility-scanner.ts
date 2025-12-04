import { Worker, Queue } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { createAIClient } from '../lib/ai-clients/index.js'
import { checkRateLimit, trackCost, waitForRateLimit } from '../utils/rate-limiter.js'
import { sendScanCompletedEmail } from '../services/email.js'
import { createRedisConnection } from '../utils/redis.js'
import { competitorDetector } from '../services/competitor-detector.js'
import { citationExtractor } from '../services/citation-extractor.js'
import { improvementAnalyzer } from '../services/improvement-analyzer.js'
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
    const domain = job.data.domain

    console.log(`[Visibility Scanner] Starting scan for org ${organizationId}, product ${productId}`)

    // Validate organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      console.error(`[Visibility Scanner] Organization ${organizationId} not found, skipping job`)
      throw new Error(`Organization ${organizationId} not found`)
    }

    // Validate product exists if provided
    if (productId) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('id', productId)
        .single()

      if (productError || !product) {
        console.error(`[Visibility Scanner] Product ${productId} not found, skipping job`)
        throw new Error(`Product ${productId} not found`)
      }
    }

    // Fetch prompts from database (now with location info)
    const { data: prompts, error: promptError } = await supabase
      .from('prompts')
      .select('*, target_location, target_country, target_language')
      .in('id', promptIds)

    if (promptError || !prompts) {
      throw new Error(`Failed to fetch prompts: ${promptError?.message}`)
    }

    // Fetch current tracking competitors for competitor visibility tracking
    const { data: trackingCompetitors } = await supabase
      .from('competitors')
      .select('id, name')
      .eq('product_id', productId)
      .eq('status', 'tracking')

    const competitorIdMap = new Map<string, string>()
    const trackingCompetitorNames: string[] = []
    if (trackingCompetitors) {
      for (const c of trackingCompetitors) {
        competitorIdMap.set(c.name.toLowerCase(), c.id)
        trackingCompetitorNames.push(c.name)
      }
    }

    // Combine provided competitors with tracking competitors
    const allCompetitors = [...new Set([...competitors, ...trackingCompetitorNames])]

    // Get AI platforms from database
    const { data: platformsData } = await supabase
      .from('ai_platforms')
      .select('id')
      .order('name')

    // Use platforms from database, fallback to defaults if empty
    const models: AIModel[] = platformsData?.map(p => p.id) || ['chatgpt', 'claude', 'gemini', 'perplexity', 'google_aio']

    const allResults: AIResponse[] = []

    // Track competitor visibility data
    const competitorMentionData: Map<string, {
      model: AIModel
      mentioned: number
      tested: number
      positions: number[]
    }[]> = new Map()

    // Initialize competitor tracking for each tracking competitor
    for (const c of trackingCompetitorNames) {
      competitorMentionData.set(c.toLowerCase(), [])
    }

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
          const clientResult = client.formatResponse(responseText, productName, allCompetitors)

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
            product_id: productId,
            ai_model: result.model,
            response_text: result.responseText,
            brand_mentioned: result.brandMentioned,
            citation_present: result.citationPresent,
            position: result.position,
            sentiment: result.sentiment,
            competitor_mentions: result.competitorMentions,
            metadata: result.metadata,
            tested_at: result.testedAt,
            request_location: prompt.target_location,
            request_country: prompt.target_country
          }).select('id').single()

          const promptResultId = promptResult?.id

          // === NEW: Extract and save citations ===
          if (promptResultId) {
            try {
              const citationResult = citationExtractor.extractCitations(result.responseText, domain)
              if (citationResult.citations.length > 0) {
                await citationExtractor.saveCitations(
                  promptResultId,
                  organizationId,
                  productId,
                  citationResult.citations
                )
                console.log(`[Visibility Scanner] Saved ${citationResult.citations.length} citations for ${model}`)
              }
            } catch (citationError) {
              console.error('[Visibility Scanner] Citation extraction error:', citationError)
            }
          }

          // === NEW: Analyze for improvement suggestions ===
          if (promptResultId) {
            try {
              const analysisResult = await improvementAnalyzer.analyzeResponse(
                result.responseText,
                productName,
                result.brandMentioned,
                result.position,
                result.citationPresent,
                allCompetitors
              )
              if (analysisResult.suggestions.length > 0) {
                await improvementAnalyzer.saveSuggestions(
                  organizationId,
                  productId,
                  promptResultId,
                  model,
                  analysisResult.suggestions,
                  competitorIdMap
                )
                console.log(`[Visibility Scanner] Saved ${analysisResult.suggestions.length} improvement suggestions for ${model}`)
              }
            } catch (analysisError) {
              console.error('[Visibility Scanner] Improvement analysis error:', analysisError)
            }
          }

          // === Track competitor visibility ===
          for (const competitorName of trackingCompetitorNames) {
            const key = competitorName.toLowerCase()
            const mentioned = result.competitorMentions.some(
              m => m.toLowerCase() === key
            )

            let modelData = competitorMentionData.get(key)?.find(d => d.model === model)
            if (!modelData) {
              modelData = { model, mentioned: 0, tested: 0, positions: [] }
              competitorMentionData.get(key)?.push(modelData)
            }

            modelData.tested++
            if (mentioned) {
              modelData.mentioned++
              // Calculate competitor position
              const competitorPosition = calculateCompetitorPosition(
                result.responseText,
                competitorName,
                allCompetitors
              )
              if (competitorPosition !== null) {
                modelData.positions.push(competitorPosition)
              }
            }

            // Save competitor mention record
            if (mentioned && promptResultId) {
              const competitorId = competitorIdMap.get(key)
              if (competitorId) {
                await supabase.from('competitor_mentions').insert({
                  organization_id: organizationId,
                  product_id: productId,
                  competitor_id: competitorId,
                  prompt_result_id: promptResultId,
                  ai_model: model,
                  mention_context: getCompetitorContext(result.responseText, competitorName),
                  position: calculateCompetitorPosition(result.responseText, competitorName, allCompetitors),
                  sentiment: analyzeCompetitorSentiment(result.responseText, competitorName),
                  detected_at: new Date().toISOString()
                })
              }
            }
          }

          // Auto-detect competitors from response
          try {
            const detection = await competitorDetector.detectCompetitors(
              result.responseText,
              productName,
              allCompetitors
            )

            if (detection.competitors.length > 0 && productId) {
              console.log(`[Visibility Scanner] Detected ${detection.competitors.length} potential competitors in ${model} response`)
              await competitorDetector.saveDetectedCompetitors(
                organizationId,
                productId,
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
    const scoreInsert: any = {
      organization_id: organizationId,
      product_id: productId,
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
    }

    const { error: scoreError } = await supabase.from('visibility_scores').insert(scoreInsert)
    if (scoreError) {
      console.error('[Visibility Scanner] Error storing visibility score:', scoreError)
    }

    // Store per-model visibility history for trend analysis
    const modelStats = calculatePerModelStats(allResults, models)
    const historyEntries = modelStats.map(stat => ({
      organization_id: organizationId,
      product_id: productId,
      ai_model: stat.model,
      score: stat.score,
      mention_rate: stat.mentionRate,
      citation_rate: stat.citationRate,
      prompts_tested: stat.promptsTested,
      prompts_mentioned: stat.promptsMentioned,
      prompts_cited: stat.promptsCited,
      recorded_at: new Date().toISOString()
    }))

    if (historyEntries.length > 0 && productId) {
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

    // === NEW: Store competitor visibility scores ===
    await storeCompetitorVisibilityScores(
      organizationId,
      productId,
      competitorMentionData,
      competitorIdMap
    )

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

/**
 * Store competitor visibility scores
 */
async function storeCompetitorVisibilityScores(
  organizationId: string,
  productId: string,
  mentionData: Map<string, { model: AIModel; mentioned: number; tested: number; positions: number[] }[]>,
  competitorIdMap: Map<string, string>
): Promise<void> {
  const now = new Date()

  for (const [competitorName, modelDataArray] of mentionData) {
    const competitorId = competitorIdMap.get(competitorName)
    if (!competitorId) continue

    // Calculate overall stats
    let totalMentioned = 0
    let totalTested = 0
    const allPositions: number[] = []

    for (const data of modelDataArray) {
      totalMentioned += data.mentioned
      totalTested += data.tested
      allPositions.push(...data.positions)

      // Store per-model score
      if (data.tested > 0) {
        const mentionRate = (data.mentioned / data.tested) * 100
        const avgPosition = data.positions.length > 0
          ? data.positions.reduce((a, b) => a + b, 0) / data.positions.length
          : null

        const score = calculateCompetitorScore(data.mentioned, data.tested, data.positions)

        await supabase.from('competitor_visibility_scores').upsert({
          organization_id: organizationId,
          product_id: productId,
          competitor_id: competitorId,
          ai_model: data.model,
          score,
          mention_rate: Math.round(mentionRate * 100) / 100,
          avg_position: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
          prompts_tested: data.tested,
          prompts_mentioned: data.mentioned,
          period_start: now,
          period_end: now
        }, {
          onConflict: 'competitor_id,ai_model',
          ignoreDuplicates: false
        })

        // Also store in history for trends
        await supabase.from('competitor_visibility_history').insert({
          organization_id: organizationId,
          product_id: productId,
          competitor_id: competitorId,
          ai_model: data.model,
          score,
          mention_rate: Math.round(mentionRate * 100) / 100,
          avg_position: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
          prompts_tested: data.tested,
          prompts_mentioned: data.mentioned,
          recorded_at: now.toISOString()
        })
      }
    }

    // Store overall score
    if (totalTested > 0) {
      const overallMentionRate = (totalMentioned / totalTested) * 100
      const overallAvgPosition = allPositions.length > 0
        ? allPositions.reduce((a, b) => a + b, 0) / allPositions.length
        : null
      const overallScore = calculateCompetitorScore(totalMentioned, totalTested, allPositions)

      await supabase.from('competitor_visibility_scores').upsert({
        organization_id: organizationId,
        product_id: productId,
        competitor_id: competitorId,
        ai_model: 'overall',
        score: overallScore,
        mention_rate: Math.round(overallMentionRate * 100) / 100,
        avg_position: overallAvgPosition ? Math.round(overallAvgPosition * 10) / 10 : null,
        prompts_tested: totalTested,
        prompts_mentioned: totalMentioned,
        period_start: now,
        period_end: now
      }, {
        onConflict: 'competitor_id,ai_model',
        ignoreDuplicates: false
      })
    }
  }
}

/**
 * Calculate competitor visibility score (0-100)
 */
function calculateCompetitorScore(mentioned: number, tested: number, positions: number[]): number {
  if (tested === 0) return 0

  // Base score from mention rate (0-50 points)
  const mentionRate = mentioned / tested
  let score = mentionRate * 50

  // Bonus for early positions (0-30 points)
  if (positions.length > 0) {
    const avgPosition = positions.reduce((a, b) => a + b, 0) / positions.length
    // Position 1 = 30 points, Position 5+ = 0 points
    const positionBonus = Math.max(0, 30 - (avgPosition - 1) * 7.5)
    score += positionBonus
  }

  // Consistency bonus (0-20 points) - mentioned in multiple tests
  if (tested >= 4) {
    const consistencyBonus = (mentioned / tested) * 20
    score += consistencyBonus
  }

  return Math.min(100, Math.round(score))
}

/**
 * Calculate competitor position in response
 */
function calculateCompetitorPosition(
  responseText: string,
  competitorName: string,
  allBrands: string[]
): number | null {
  const lowerResponse = responseText.toLowerCase()
  const lowerCompetitor = competitorName.toLowerCase()

  if (!lowerResponse.includes(lowerCompetitor)) return null

  // Find positions of all brands
  const brandPositions: { name: string; index: number }[] = []

  for (const brand of allBrands) {
    const index = lowerResponse.indexOf(brand.toLowerCase())
    if (index !== -1) {
      brandPositions.push({ name: brand, index })
    }
  }

  // Sort by position
  brandPositions.sort((a, b) => a.index - b.index)

  // Find competitor's rank
  const rank = brandPositions.findIndex(b => b.name.toLowerCase() === lowerCompetitor)
  return rank !== -1 ? rank + 1 : null
}

/**
 * Get context around competitor mention
 */
function getCompetitorContext(text: string, competitorName: string): string {
  const lowerText = text.toLowerCase()
  const lowerName = competitorName.toLowerCase()
  const index = lowerText.indexOf(lowerName)

  if (index === -1) return ''

  const start = Math.max(0, index - 100)
  const end = Math.min(text.length, index + competitorName.length + 100)
  return text.substring(start, end).trim()
}

/**
 * Analyze sentiment for competitor mention
 */
function analyzeCompetitorSentiment(text: string, competitorName: string): 'positive' | 'neutral' | 'negative' {
  const lowerText = text.toLowerCase()
  const lowerName = competitorName.toLowerCase()

  // Find sentences containing the competitor
  const sentences = text.split(/[.!?]+/).filter(s =>
    s.toLowerCase().includes(lowerName)
  )

  if (sentences.length === 0) return 'neutral'

  const positiveWords = ['best', 'great', 'excellent', 'top', 'leading', 'recommended', 'popular', 'trusted', 'innovative', 'powerful']
  const negativeWords = ['worst', 'bad', 'poor', 'limited', 'expensive', 'difficult', 'complicated', 'lacking']

  let positiveCount = 0
  let negativeCount = 0

  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase()
    positiveWords.forEach(word => {
      if (lowerSentence.includes(word)) positiveCount++
    })
    negativeWords.forEach(word => {
      if (lowerSentence.includes(word)) negativeCount++
    })
  })

  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

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
