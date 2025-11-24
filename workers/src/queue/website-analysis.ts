import { Queue, Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { WebsiteCrawler } from '../analyzers/website-crawler.js'
import { ProductAnalyzer } from '../analyzers/product-analyzer.js'
import { RecommendationEngine } from '../analyzers/recommendation-engine.js'
import { sendScanCompletedEmail } from '../services/email.js'
import Redis from 'ioredis'

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface WebsiteAnalysisJobData {
  organizationId: string
  domain: string
  includeCompetitorGaps?: boolean
  jobId?: string
}

/**
 * Website Analysis Queue
 * Crawls website, generates recommendations, stores in database
 */
export const websiteAnalysisQueue = new Queue<WebsiteAnalysisJobData>('website-analysis', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 100,
    removeOnFail: 100
  }
})

/**
 * Website Analysis Worker
 * Processes website analysis jobs
 */
export const websiteAnalysisWorker = new Worker<WebsiteAnalysisJobData>(
  'website-analysis',
  async (job) => {
    const { organizationId, domain, includeCompetitorGaps = false } = job.data

    console.log(`[Website Analysis] Starting analysis for ${domain}`)

    try {
      // 1. Crawl and analyze website
      console.log(`[Website Analysis] Crawling website...`)
      const crawler = new WebsiteCrawler()
      const websiteAnalysis = await crawler.analyze(domain)

      // 2. Analyze product using AI
      console.log(`[Website Analysis] Analyzing product with AI...`)
      const productAnalyzer = new ProductAnalyzer()
      const productAnalysis = await productAnalyzer.analyzeProduct(domain, websiteAnalysis)

      // 3. Store product analysis
      console.log(`[Website Analysis] Storing product analysis...`)
      const { error: productError } = await supabase
        .from('product_analyses')
        .upsert({
          organization_id: organizationId,
          domain,
          product_name: productAnalysis.productName,
          product_description: productAnalysis.productDescription,
          key_features: productAnalysis.keyFeatures,
          target_audience: productAnalysis.targetAudience,
          use_cases: productAnalysis.useCases,
          differentiators: productAnalysis.differentiators,
          analyzed_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id'
        })

      if (productError) {
        console.error('[Website Analysis] Error storing product analysis:', productError)
        // Don't throw - continue even if product analysis fails
      }

      // 4. Generate contextual prompts with granularity levels
      console.log(`[Website Analysis] Generating contextual prompts...`)

      // Delete existing prompts that aren't custom
      await supabase
        .from('prompts')
        .delete()
        .eq('organization_id', organizationId)
        .eq('is_custom', false)

      // Generate Level 1 prompts (broad)
      const level1Prompts = productAnalysis.promptSuggestions.level1.map(text => ({
        organization_id: organizationId,
        prompt_text: text,
        category: productAnalysis.industryCategory,
        granularity_level: 1,
        is_custom: false
      }))

      // Generate Level 2 prompts (specific use cases)
      const level2Prompts = productAnalysis.promptSuggestions.level2.map(text => ({
        organization_id: organizationId,
        prompt_text: text,
        category: productAnalysis.industryCategory,
        granularity_level: 2,
        is_custom: false
      }))

      // Generate Level 3 prompts (detailed technical)
      const level3Prompts = productAnalysis.promptSuggestions.level3.map(text => ({
        organization_id: organizationId,
        prompt_text: text,
        category: productAnalysis.industryCategory,
        granularity_level: 3,
        is_custom: false
      }))

      const allPrompts = [...level1Prompts, ...level2Prompts, ...level3Prompts]

      const { error: promptsError } = await supabase
        .from('prompts')
        .insert(allPrompts)

      if (promptsError) {
        console.error('[Website Analysis] Error storing prompts:', promptsError)
      }

      console.log(`[Website Analysis] Generated ${allPrompts.length} contextual prompts (${level1Prompts.length} L1, ${level2Prompts.length} L2, ${level3Prompts.length} L3)`)

      // 5. Mark organization as analyzed
      await supabase
        .from('organizations')
        .update({
          website_analyzed: true,
          onboarding_completed: true
        })
        .eq('id', organizationId)

      // 6. Store website analysis results
      console.log(`[Website Analysis] Storing website analysis...`)
      const { data: analysisRecord, error: analysisError } = await supabase
        .from('website_analyses')
        .insert({
          organization_id: organizationId,
          domain,
          tech_stack: websiteAnalysis.techStack,
          schema_markup: websiteAnalysis.schemaMarkup,
          content_structure: websiteAnalysis.contentStructure,
          technical_seo: websiteAnalysis.technicalSEO,
          aeo_readiness: websiteAnalysis.aeoReadiness,
          analyzed_at: websiteAnalysis.analyzedAt
        })
        .select()
        .single()

      if (analysisError) {
        console.error('[Website Analysis] Error storing analysis:', analysisError)
        throw analysisError
      }

      // 7. Get recent scan results for context
      console.log(`[Website Analysis] Fetching recent scan results...`)
      const { data: scanResults } = await supabase
        .from('prompt_results')
        .select('*')
        .eq('organization_id', organizationId)
        .order('tested_at', { ascending: false })
        .limit(50)

      // 8. Get competitor gaps if requested
      let competitorGaps: any[] = []
      if (includeCompetitorGaps) {
        console.log(`[Website Analysis] Fetching competitor gaps...`)
        const { data: gaps } = await supabase
          .from('visibility_gaps')
          .select('*, prompts(prompt_text), competitors(name)')
          .eq('organization_id', organizationId)
          .is('resolved_at', null)
          .limit(10)

        competitorGaps = gaps || []
      }

      // 9. Generate recommendations
      console.log(`[Website Analysis] Generating recommendations...`)
      const recommendationEngine = new RecommendationEngine()
      const recommendations = recommendationEngine.generateRecommendations(
        websiteAnalysis,
        scanResults || [],
        competitorGaps
      )

      console.log(`[Website Analysis] Generated ${recommendations.length} recommendations`)

      // 10. Store recommendations
      console.log(`[Website Analysis] Storing recommendations...`)
      const recommendationsToInsert = recommendations.map(rec => ({
        organization_id: organizationId,
        title: rec.title,
        description: rec.description,
        category: rec.category,
        priority: rec.priority,
        estimated_impact: rec.estimatedImpact,
        implementation_guide: rec.implementationGuide,
        code_snippets: rec.codeSnippets || [],
        estimated_time: rec.estimatedTime,
        difficulty: rec.difficulty,
        status: 'pending'
      }))

      // Delete existing pending recommendations to avoid duplicates
      await supabase
        .from('fix_recommendations')
        .delete()
        .eq('organization_id', organizationId)
        .eq('status', 'pending')

      const { error: recsError } = await supabase
        .from('fix_recommendations')
        .insert(recommendationsToInsert)

      if (recsError) {
        console.error('[Website Analysis] Error storing recommendations:', recsError)
        throw recsError
      }

      console.log(`[Website Analysis] Successfully completed analysis for ${domain}`)

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
        domain,
        aeoReadiness: websiteAnalysis.aeoReadiness.score,
        recommendationsCount: recommendations.length,
        analysisId: analysisRecord.id
      }
    } catch (error) {
      console.error('[Website Analysis] Error:', error)

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
    concurrency: 2 // Process 2 analyses at a time
  }
)

// Event listeners
websiteAnalysisWorker.on('completed', async (job, result) => {
  console.log(`[Website Analysis] Job ${job.id} completed successfully`)

  try {
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
      brandName: org.name,
      scanType: 'website',
      totalScans: result.recommendationsCount,
      dashboardUrl: `${process.env.APP_URL || 'https://columbus-aeo.com'}/dashboard/recommendations`
    })

    console.log(`[Website Analysis] Notification email sent to ${owner.email}`)
  } catch (error) {
    console.error('[Website Analysis] Error sending completion email:', error)
    // Don't throw - email failure shouldn't affect job completion
  }
})

websiteAnalysisWorker.on('failed', (job, err) => {
  console.error(`[Website Analysis] Job ${job?.id} failed:`, err.message)
})

websiteAnalysisWorker.on('error', (err) => {
  console.error('[Website Analysis] Worker error:', err)
})

console.log('[Website Analysis] Worker started')
