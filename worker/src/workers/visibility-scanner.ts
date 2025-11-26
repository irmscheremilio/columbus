import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { supabase } from '../lib/supabase.js'
import { createAIClient } from '../lib/ai-clients/index.js'
import type { VisibilityScanJobData } from '../queues/visibility-scan.js'

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null
})

const AI_MODELS = ['chatgpt', 'claude', 'gemini', 'perplexity'] as const

export function startVisibilityScanWorker() {
  const worker = new Worker<VisibilityScanJobData>(
    'visibility-scans',
    async (job) => {
      const { organizationId, productId, promptIds } = job.data

      console.log(`Starting visibility scan for organization: ${organizationId}, product: ${productId || 'all'}`)

      try {
        // Update job status in database
        const { data: dbJob } = await supabase
          .from('jobs')
          .insert({
            organization_id: organizationId,
            product_id: productId || null,
            job_type: 'visibility_scan',
            status: 'processing',
            started_at: new Date().toISOString(),
            metadata: { promptIds, productId }
          })
          .select()
          .single()

        // Get organization details
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single()

        if (!org) {
          throw new Error('Organization not found')
        }

        // Get competitors (filter by product if provided)
        let competitorQuery = supabase
          .from('competitors')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('is_active', true)

        if (productId) {
          competitorQuery = competitorQuery.eq('product_id', productId)
        }

        const { data: competitors } = await competitorQuery

        const competitorNames = competitors?.map(c => c.name) || []

        // Get or create default prompts
        let prompts
        if (promptIds && promptIds.length > 0) {
          const { data } = await supabase
            .from('prompts')
            .select('*')
            .in('id', promptIds)
          prompts = data || []
        } else {
          // Use default prompts for the organization/product
          let promptQuery = supabase
            .from('prompts')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('is_custom', false)

          if (productId) {
            promptQuery = promptQuery.eq('product_id', productId)
          }

          const { data } = await promptQuery
          prompts = data || []

          // If no prompts exist, create default ones
          if (prompts.length === 0) {
            const defaultPrompts = generateDefaultPrompts(org.name, org.industry)
            const { data: newPrompts } = await supabase
              .from('prompts')
              .insert(
                defaultPrompts.map(p => ({
                  organization_id: organizationId,
                  product_id: productId || null,
                  prompt_text: p.text,
                  category: p.category,
                  is_custom: false
                }))
              )
              .select()

            prompts = newPrompts || []
          }
        }

        // Test prompts across all AI models
        const results = []
        const scores: Record<string, number[]> = {
          chatgpt: [],
          claude: [],
          gemini: [],
          perplexity: []
        }

        for (const model of AI_MODELS) {
          const client = createAIClient(model)

          for (const prompt of prompts) {
            try {
              // Test the prompt
              const responseText = await client.testPrompt(prompt.prompt_text)

              // Analyze the response
              const analysis = client.formatResponse(
                responseText,
                org.name,
                competitorNames
              )

              // Store result
              await supabase.from('prompt_results').insert({
                prompt_id: prompt.id,
                organization_id: organizationId,
                product_id: productId || null,
                ai_model: model,
                response_text: responseText,
                brand_mentioned: analysis.brandMentioned,
                citation_present: analysis.citationPresent,
                position: analysis.position,
                sentiment: analysis.sentiment,
                competitor_mentions: analysis.competitorMentions,
                metadata: analysis.metadata,
                tested_at: new Date().toISOString()
              })

              results.push(analysis)

              // Calculate score for this prompt (0-100)
              let promptScore = 0
              if (analysis.brandMentioned) promptScore += 40
              if (analysis.citationPresent) promptScore += 30
              if (analysis.position) {
                // Position scoring: 1st = 30pts, 2nd = 25pts, 3rd = 20pts, etc.
                promptScore += Math.max(0, 30 - (analysis.position - 1) * 5)
              }
              if (analysis.sentiment === 'positive') promptScore += 10

              scores[model].push(promptScore)

              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 1000))
            } catch (error) {
              console.error(`Error testing prompt with ${model}:`, error)
              scores[model].push(0) // Failed test = 0 score
            }
          }
        }

        // Calculate and store visibility scores
        const periodStart = new Date()
        periodStart.setHours(0, 0, 0, 0)
        const periodEnd = new Date()
        periodEnd.setHours(23, 59, 59, 999)

        for (const [model, modelScores] of Object.entries(scores)) {
          const avgScore = modelScores.length > 0
            ? Math.round(modelScores.reduce((a, b) => a + b, 0) / modelScores.length)
            : 0

          await supabase.from('visibility_scores').insert({
            organization_id: organizationId,
            product_id: productId || null,
            ai_model: model,
            score: avgScore,
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
            metrics: {
              totalPrompts: modelScores.length,
              mentionRate: results.filter(r => r.model === model && r.brandMentioned).length / modelScores.length,
              citationRate: results.filter(r => r.model === model && r.citationPresent).length / modelScores.length,
              avgPosition: results
                .filter(r => r.model === model && r.position)
                .reduce((sum, r) => sum + (r.position || 0), 0) /
                results.filter(r => r.model === model && r.position).length || null
            }
          })
        }

        // Mark job as completed
        if (dbJob) {
          await supabase
            .from('jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', dbJob.id)
        }

        console.log(`Visibility scan completed for organization: ${organizationId}`)

        // TODO: Queue recommendation generation job
        // TODO: Send email notification

        return { success: true, results }
      } catch (error: any) {
        console.error('Visibility scan error:', error)
        throw error
      }
    },
    {
      connection,
      concurrency: 2, // Process 2 scans simultaneously
    }
  )

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err)
  })

  return worker
}

function generateDefaultPrompts(companyName: string, industry?: string | null) {
  const basePrompts = [
    {
      text: `What are the best ${industry || 'software'} tools for small businesses?`,
      category: 'comparison'
    },
    {
      text: `Recommend a ${industry || 'software'} solution for my company`,
      category: 'recommendation'
    },
    {
      text: `Compare ${companyName} with its competitors`,
      category: 'comparison'
    },
    {
      text: `What is ${companyName}?`,
      category: 'informational'
    },
    {
      text: `How does ${companyName} work?`,
      category: 'how-to'
    },
    {
      text: `Is ${companyName} worth it?`,
      category: 'evaluation'
    },
    {
      text: `${companyName} pricing and features`,
      category: 'pricing'
    },
    {
      text: `Best alternatives to ${industry || 'software'} for startups`,
      category: 'alternative'
    },
    {
      text: `${industry || 'Software'} recommendations for 2024`,
      category: 'recommendation'
    },
    {
      text: `What are the pros and cons of ${companyName}?`,
      category: 'evaluation'
    },
  ]

  return basePrompts
}
