import { Worker, Queue } from 'bullmq'
import { createRedisConnection } from '../utils/redis.js'
import { createClient } from '@supabase/supabase-js'
import { createAIClient } from '../lib/ai-clients/index.js'
import type { AIModel } from '../lib/ai-clients/base.js'
import { waitForRateLimit, trackCost } from '../utils/rate-limiter.js'
import { sendScanCompletedEmail } from '../services/email.js'

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

/**
 * Queue for competitor analysis jobs
 */
export const competitorAnalysisQueue = new Queue<CompetitorAnalysisJobData>('competitor-analysis', { connection })

/**
 * Worker that processes competitor analysis jobs
 * Tests prompts to see where competitors appear but brand doesn't
 */
export const competitorAnalysisWorker = new Worker<CompetitorAnalysisJobData>(
  'competitor-analysis',
  async (job) => {
    const { organizationId, brandName, competitorId, competitorName, promptIds } = job.data

    console.log(`[Competitor Analysis] Starting analysis for ${competitorName} vs ${brandName}`)

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
      competitorMentioned: boolean
      brandMentioned: boolean
      competitorPosition: number | null
      brandPosition: number | null
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

          // Check if competitor mentioned but brand not
          const competitorMentioned = result.competitorMentions.includes(competitorName)
          const brandMentioned = result.brandMentioned

          if (competitorMentioned && !brandMentioned) {
            // Found a gap!
            console.log(`[Competitor Analysis] GAP FOUND: ${competitorName} mentioned on ${model}, but not ${brandName}`)

            gapsFound.push({
              prompt: prompt.prompt_text,
              platform: model,
              competitorMentioned: true,
              brandMentioned: false,
              competitorPosition: null,
              brandPosition: null
            })

            // Store gap in database
            await supabase.from('visibility_gaps').insert({
              organization_id: organizationId,
              competitor_id: competitorId,
              prompt_id: prompt.id,
              ai_model: model,
              competitor_mentioned: true,
              brand_mentioned: false,
              gap_type: 'competitor_only',
              detected_at: new Date().toISOString()
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

    console.log(`[Competitor Analysis] Complete. Found ${gapsFound.length} visibility gaps.`)

    return {
      organizationId,
      competitorId,
      gapsFound: gapsFound.length,
      completedAt: new Date()
    }
  },
  { connection }
)

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
