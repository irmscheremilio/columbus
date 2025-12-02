import { Worker, Queue } from 'bullmq'
import { createRedisConnection } from '../utils/redis.js'
import { createClient } from '@supabase/supabase-js'
import { createAIClient } from '../lib/ai-clients/index.js'
import type { AIModel } from '../lib/ai-clients/base.js'
import { waitForRateLimit, trackCost } from '../utils/rate-limiter.js'
import { sendScanCompletedEmail } from '../services/email.js'
import { improvementAnalyzer, type ImprovementSuggestion, type Severity } from '../services/improvement-analyzer.js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const connection = createRedisConnection()

interface CompetitorAnalysisJobData {
  organizationId: string
  brandName: string
  competitorId: string
  competitorName: string
  promptIds: string[]
  jobId?: string
}

// Map suggestion types to gap types
const suggestionTypeToGapType: Record<string, string> = {
  negative_comparison: 'negative_comparison',
  missing_feature: 'missing_feature',
  competitor_advantage: 'competitor_only',
  pricing_concern: 'pricing_concern',
  outdated_info: 'outdated_info',
  missing_mention: 'competitor_only',
  low_position: 'positioning_issue',
  no_citation: 'positioning_issue'
}

// Map suggestion types to issue types
const suggestionTypeToIssueType: Record<string, string> = {
  negative_comparison: 'negative_sentiment',
  missing_feature: 'feature_gap',
  competitor_advantage: 'recommendation_bias',
  pricing_concern: 'price_comparison',
  outdated_info: 'outdated_info',
  missing_mention: 'missing_mention',
  low_position: 'market_position',
  no_citation: 'missing_mention'
}

/**
 * Queue for competitor analysis jobs
 */
export const competitorAnalysisQueue = new Queue<CompetitorAnalysisJobData>('competitor-analysis', { connection })

/**
 * Worker that processes competitor analysis jobs
 * Uses AI evaluation to detect improvement opportunities in how brands are mentioned
 */
export const competitorAnalysisWorker = new Worker<CompetitorAnalysisJobData>(
  'competitor-analysis',
  async (job) => {
    const { organizationId, brandName, competitorId, competitorName, promptIds } = job.data

    console.log(`[Competitor Analysis] Starting AI-powered analysis for ${competitorName} vs ${brandName}`)

    // Fetch prompts
    const { data: prompts } = await supabase
      .from('prompts')
      .select('*')
      .in('id', promptIds)

    if (!prompts) {
      throw new Error('No prompts found')
    }

    // AI models to test with
    const models: AIModel[] = ['chatgpt', 'claude', 'gemini', 'perplexity']

    const gapsFound: Array<{
      prompt: string
      platform: string
      gapType: string
      severity: string
      suggestion: ImprovementSuggestion
    }> = []

    // Test each prompt
    for (const prompt of prompts) {
      console.log(`[Competitor Analysis] Testing: "${prompt.prompt_text}"`)

      for (const model of models) {
        try {
          // Rate limiting
          await waitForRateLimit(organizationId, model)

          // Get AI client
          const client = createAIClient(model)

          // Get response from AI
          const responseText = await client.testPrompt(prompt.prompt_text)

          // Format into full response with brand analysis
          const result = client.formatResponse(responseText, brandName, [competitorName])

          // Track cost
          await trackCost(organizationId, model)

          const competitorMentioned = result.competitorMentions.includes(competitorName)
          const brandMentioned = result.brandMentioned

          // Use AI to analyze the response for improvement opportunities
          const analysisResult = await improvementAnalyzer.analyzeResponse(
            result.responseText,
            brandName,
            brandMentioned,
            result.position,
            result.citationPresent,
            [competitorName]
          )

          // Create gaps for each improvement suggestion that's relevant to the competitor
          for (const suggestion of analysisResult.suggestions) {
            // Only create gap if competitor is mentioned OR there's a missing mention issue
            if (!competitorMentioned && suggestion.type !== 'missing_mention') {
              continue
            }

            const gapType = suggestionTypeToGapType[suggestion.type] || 'competitor_only'
            const issueType = suggestionTypeToIssueType[suggestion.type] || 'missing_mention'

            console.log(`[Competitor Analysis] GAP FOUND: ${suggestion.type} - ${suggestion.title} (${suggestion.severity})`)

            gapsFound.push({
              prompt: prompt.prompt_text,
              platform: model,
              gapType,
              severity: suggestion.severity,
              suggestion
            })

            // Store enhanced gap in database
            await supabase.from('visibility_gaps').insert({
              organization_id: organizationId,
              competitor_id: competitorId,
              prompt_id: prompt.id,
              ai_model: model,
              competitor_mentioned: competitorMentioned,
              brand_mentioned: brandMentioned,
              gap_type: gapType,
              issue_type: issueType,
              severity: suggestion.severity,
              ai_analysis: suggestion.description,
              improvement_suggestion: suggestion.recommendedAction,
              suggested_action: getSuggestedAction(suggestion.type, competitorName),
              response_excerpt: suggestion.context || result.responseText.substring(0, 500),
              brand_sentiment: brandMentioned ? (suggestion.type === 'negative_comparison' || suggestion.type === 'pricing_concern' ? 'negative' : 'neutral') : null,
              competitor_sentiment: competitorMentioned ? (suggestion.type === 'competitor_advantage' ? 'positive' : 'neutral') : null,
              detected_at: new Date().toISOString()
            })
          }

          // Also create a simple gap if competitor mentioned but brand not (legacy behavior)
          if (competitorMentioned && !brandMentioned && !analysisResult.suggestions.some(s => s.type === 'missing_mention')) {
            console.log(`[Competitor Analysis] GAP FOUND: ${competitorName} mentioned on ${model}, but not ${brandName}`)

            await supabase.from('visibility_gaps').insert({
              organization_id: organizationId,
              competitor_id: competitorId,
              prompt_id: prompt.id,
              ai_model: model,
              competitor_mentioned: true,
              brand_mentioned: false,
              gap_type: 'competitor_only',
              issue_type: 'missing_mention',
              severity: 'high',
              ai_analysis: `${competitorName} is being recommended while ${brandName} is not mentioned at all. This represents a significant visibility gap.`,
              improvement_suggestion: `Create content that positions ${brandName} alongside or as an alternative to ${competitorName} for this use case.`,
              suggested_action: 'create_comparison_content',
              response_excerpt: result.responseText.substring(0, 500),
              competitor_sentiment: 'positive',
              detected_at: new Date().toISOString()
            })

            gapsFound.push({
              prompt: prompt.prompt_text,
              platform: model,
              gapType: 'competitor_only',
              severity: 'high',
              suggestion: {
                type: 'missing_mention',
                severity: 'high',
                title: 'Brand not mentioned',
                description: `${competitorName} mentioned but ${brandName} is not`
              }
            })
          }

          // Store competitive result
          await supabase.from('competitor_results').insert({
            organization_id: organizationId,
            competitor_id: competitorId,
            prompt_id: prompt.id,
            ai_model: model,
            competitor_mentioned: competitorMentioned,
            brand_mentioned: brandMentioned,
            response_text: result.responseText,
            tested_at: new Date()
          })
        } catch (error) {
          console.error(`[Competitor Analysis] Error testing ${model}:`, error)
        }
      }

      // Delay between prompts
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    console.log(`[Competitor Analysis] Complete. Found ${gapsFound.length} visibility gaps with AI analysis.`)

    return {
      organizationId,
      competitorId,
      gapsFound: gapsFound.length,
      completedAt: new Date()
    }
  },
  { connection }
)

/**
 * Get a specific suggested action based on the issue type
 */
function getSuggestedAction(suggestionType: string, competitorName: string): string {
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

// Worker events
competitorAnalysisWorker.on('completed', async (job, result) => {
  console.log(`[Competitor Analysis] Job ${job.id} completed`)

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

    // Get organization and owner for email notification
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', job.data.organizationId)
      .single()

    if (!org) return

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
      brandName: job.data.brandName,
      scanType: 'competitor',
      totalScans: result.gapsFound,
      dashboardUrl: `${process.env.APP_URL || 'https://columbus-aeo.com'}/dashboard/gaps`
    })

    console.log(`[Competitor Analysis] Notification email sent to ${owner.email}`)
  } catch (error) {
    console.error('[Competitor Analysis] Error sending completion email:', error)
    // Don't throw - email failure shouldn't affect job completion
  }
})

competitorAnalysisWorker.on('failed', async (job, err) => {
  console.error(`[Competitor Analysis] Job ${job?.id} failed:`, err)

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
      console.error('[Competitor Analysis] Error updating job status:', updateError)
    }
  }
})
