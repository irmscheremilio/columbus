import { Worker, Queue } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { ChatGPTClient } from '../clients/chatgpt.js'
import { ClaudeClient } from '../clients/claude.js'
import { GeminiClient } from '../clients/gemini.js'
import { PerplexityClient } from '../clients/perplexity.js'
import { waitForRateLimit, trackCost } from '../utils/rate-limiter.js'
import type { AIResponse } from '../types/ai.js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
}

interface CompetitorAnalysisJobData {
  organizationId: string
  brandName: string
  competitorId: string
  competitorName: string
  promptIds: string[]
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

    // Initialize AI clients
    const clients = [
      new ChatGPTClient(),
      new ClaudeClient(),
      new GeminiClient(),
      new PerplexityClient()
    ]

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

      for (const client of clients) {
        try {
          // Rate limiting
          await waitForRateLimit(organizationId, client.model)

          // Test prompt
          const result = await client.testPrompt(
            prompt.prompt_text,
            brandName,
            [competitorName]
          )

          // Track cost
          await trackCost(organizationId, client.model)

          // Check if competitor mentioned but brand not
          const competitorMentioned = result.competitorMentions.includes(competitorName)
          const brandMentioned = result.brandMentioned

          if (competitorMentioned && !brandMentioned) {
            // Found a gap!
            console.log(`[Competitor Analysis] GAP FOUND: ${competitorName} mentioned on ${client.model}, but not ${brandName}`)

            gapsFound.push({
              prompt: prompt.prompt_text,
              platform: client.model,
              competitorMentioned: true,
              brandMentioned: false,
              competitorPosition: null, // Would need to extract from response
              brandPosition: null
            })

            // Store gap in database
            await supabase.from('visibility_gaps').insert({
              organization_id: organizationId,
              competitor_id: competitorId,
              prompt_id: prompt.id,
              ai_model: client.model,
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
            ai_model: client.model,
            competitor_mentioned: competitorMentioned,
            brand_mentioned: brandMentioned,
            response_text: result.responseText,
            tested_at: result.testedAt
          })
        } catch (error) {
          console.error(`[Competitor Analysis] Error testing ${client.model}:`, error)
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
competitorAnalysisWorker.on('completed', (job) => {
  console.log(`[Competitor Analysis] Job ${job.id} completed`)
})

competitorAnalysisWorker.on('failed', (job, err) => {
  console.error(`[Competitor Analysis] Job ${job?.id} failed:`, err)
})
