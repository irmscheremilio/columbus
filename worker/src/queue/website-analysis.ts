import { Queue, Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { WebsiteCrawler } from '../analyzers/website-crawler.js'
import { RecommendationEngine, Recommendation } from '../analyzers/recommendation-engine.js'
import { AIRecommendationEngine, AIRecommendation } from '../analyzers/ai-recommendation-engine.js'
import { PromptGenerator } from '../analyzers/prompt-generator.js'
import { PageDiscovery, DiscoveredPage, PageContent } from '../analyzers/page-discovery.js'
import { sendScanCompletedEmail } from '../services/email.js'
import { createRedisConnection } from '../utils/redis.js'

const redisConnection = createRedisConnection()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
)

/**
 * Progress tracker for realtime updates during website analysis
 */
class AnalysisProgressTracker {
  private progressId: string | null = null
  private jobId: string
  private organizationId: string
  private productId: string | null

  constructor(jobId: string, organizationId: string, productId: string | null) {
    this.jobId = jobId
    this.organizationId = organizationId
    this.productId = productId
  }

  async initialize(): Promise<void> {
    const { data, error } = await supabase
      .from('website_analysis_progress')
      .insert({
        job_id: this.jobId,
        organization_id: this.organizationId,
        product_id: this.productId,
        current_step: 'initializing',
        step_number: 0,
        total_steps: 6,
        progress_percent: 0,
        message: 'Preparing to analyze your website...'
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Progress] Failed to initialize progress tracker:', error)
      return
    }

    this.progressId = data.id
    console.log(`[Progress] Initialized progress tracker: ${this.progressId}`)
  }

  async update(update: {
    step?: string
    stepNumber?: number
    progressPercent?: number
    message?: string
    details?: Record<string, any>
    pagesDiscovered?: number
    pagesAnalyzed?: number
    currentPageUrl?: string
    currentPageTitle?: string
    promptsGenerated?: number
  }): Promise<void> {
    if (!this.progressId) return

    const updateData: Record<string, any> = {}

    if (update.step !== undefined) updateData.current_step = update.step
    if (update.stepNumber !== undefined) updateData.step_number = update.stepNumber
    if (update.progressPercent !== undefined) updateData.progress_percent = update.progressPercent
    if (update.message !== undefined) updateData.message = update.message
    if (update.details !== undefined) updateData.details = update.details
    if (update.pagesDiscovered !== undefined) updateData.pages_discovered = update.pagesDiscovered
    if (update.pagesAnalyzed !== undefined) updateData.pages_analyzed = update.pagesAnalyzed
    if (update.currentPageUrl !== undefined) updateData.current_page_url = update.currentPageUrl
    if (update.currentPageTitle !== undefined) updateData.current_page_title = update.currentPageTitle
    if (update.promptsGenerated !== undefined) updateData.prompts_generated = update.promptsGenerated

    const { error } = await supabase
      .from('website_analysis_progress')
      .update(updateData)
      .eq('id', this.progressId)

    if (error) {
      console.error('[Progress] Failed to update progress:', error)
    }
  }

  async complete(): Promise<void> {
    if (!this.progressId) return

    await supabase
      .from('website_analysis_progress')
      .update({
        current_step: 'completed',
        step_number: 6,
        progress_percent: 100,
        message: 'Analysis complete!',
        completed_at: new Date().toISOString()
      })
      .eq('id', this.progressId)
  }

  async fail(errorMessage: string): Promise<void> {
    if (!this.progressId) return

    await supabase
      .from('website_analysis_progress')
      .update({
        current_step: 'failed',
        message: `Analysis failed: ${errorMessage}`,
        completed_at: new Date().toISOString()
      })
      .eq('id', this.progressId)
  }
}

export interface WebsiteAnalysisJobData {
  organizationId: string
  productId?: string
  domain: string
  includeCompetitorGaps?: boolean
  multiPageAnalysis?: boolean // New option for multi-page crawling
  // NOTE: triggerVisibilityScan is DEPRECATED - visibility scans are now done via browser extension
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
    const { organizationId, productId, domain, includeCompetitorGaps = false, multiPageAnalysis = true } = job.data

    console.log(`[Website Analysis] Starting analysis for ${domain} (productId: ${productId || 'none'}, multiPage: ${multiPageAnalysis})`)

    // Initialize progress tracker if we have a job ID
    const progress = job.data.jobId
      ? new AnalysisProgressTracker(job.data.jobId, organizationId, productId || null)
      : null

    try {
      // Initialize progress tracking
      if (progress) {
        await progress.initialize()
      }

      // 0. Validate organization exists before doing any work
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .single()

      if (orgError || !org) {
        console.error(`[Website Analysis] Organization ${organizationId} not found, skipping job`)
        if (progress) await progress.fail('Organization not found')
        return { skipped: true, reason: 'Organization not found' }
      }

      // 1. Crawl and analyze main website page
      console.log(`[Website Analysis] Crawling main website...`)
      if (progress) {
        await progress.update({
          step: 'crawling',
          stepNumber: 1,
          progressPercent: 5,
          message: `Connecting to ${domain}...`,
          details: { domain }
        })
      }

      const crawler = new WebsiteCrawler()
      const websiteAnalysis = await crawler.analyze(domain)

      if (progress) {
        await progress.update({
          progressPercent: 15,
          message: `Analyzed homepage structure and content`,
          details: {
            domain,
            platform: websiteAnalysis.techStack?.platform,
            hasSchema: websiteAnalysis.schemaMarkup?.length > 0
          }
        })
      }

      // 2. Store website analysis results
      console.log(`[Website Analysis] Storing website analysis...`)
      const { data: analysisRecord, error: analysisError } = await supabase
        .from('website_analyses')
        .insert({
          organization_id: organizationId,
          product_id: productId || null,
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

      // 3. Multi-page discovery and analysis
      let discoveredPages: DiscoveredPage[] = []
      let pageContents: PageContent[] = []
      // Page recommendations are now generated by AI, not rule-based

      if (multiPageAnalysis) {
        console.log(`[Website Analysis] Discovering pages...`)
        if (progress) {
          await progress.update({
            step: 'discovering',
            stepNumber: 2,
            progressPercent: 20,
            message: `Discovering pages on ${domain}...`
          })
        }

        const pageDiscovery = new PageDiscovery()
        discoveredPages = await pageDiscovery.discoverPages(domain)

        if (progress) {
          await progress.update({
            progressPercent: 30,
            message: `Found ${discoveredPages.length} pages to analyze`,
            pagesDiscovered: discoveredPages.length
          })
        }

        // Store discovered pages
        const pagesToStore = discoveredPages.map(page => ({
          organization_id: organizationId,
          product_id: productId || null,
          url: page.url,
          path: page.path,
          title: page.title,
          is_relevant: page.isRelevant,
          relevance_reason: page.relevanceReason,
          content_type: page.contentType,
          last_crawled_at: new Date().toISOString()
        }))

        if (pagesToStore.length > 0) {
          // Upsert crawled pages (update if exists)
          await supabase
            .from('crawled_pages')
            .upsert(pagesToStore, {
              onConflict: 'organization_id,url',
              ignoreDuplicates: false
            })
        }

        // Fetch content from relevant pages
        const relevantPages = discoveredPages.filter(p => p.isRelevant).slice(0, 20) // Limit to 20 pages
        console.log(`[Website Analysis] Fetching content from ${relevantPages.length} relevant pages...`)

        if (progress) {
          await progress.update({
            step: 'analyzing_pages',
            stepNumber: 3,
            progressPercent: 35,
            message: `Fetching content from ${relevantPages.length} relevant pages...`
          })
        }

        pageContents = await pageDiscovery.fetchPageContents(relevantPages)

        // Analyze each page first to get analysis data
        console.log(`[Website Analysis] Analyzing page content...`)
        const pageAnalyses: Array<{
          url: string
          title: string
          contentType: string
          content: string
          analysis: any
        }> = []

        for (let i = 0; i < pageContents.length; i++) {
          const pageContent = pageContents[i]

          // Update progress with current page being analyzed
          if (progress) {
            const pageProgress = 35 + Math.floor((i / pageContents.length) * 20) // 35-55%
            const pagePath = new URL(pageContent.url).pathname || '/'
            await progress.update({
              progressPercent: pageProgress,
              message: `Analyzing "${pageContent.title || pagePath}"`,
              pagesAnalyzed: i + 1,
              currentPageUrl: pageContent.url,
              currentPageTitle: pageContent.title || pagePath
            })
          }

          const pageAnalysis = await crawler.analyzeHtml(pageContent.html, pageContent.url)

          pageAnalyses.push({
            url: pageContent.url,
            title: pageContent.title,
            contentType: pageContent.contentType,
            content: pageContent.textContent,
            analysis: pageAnalysis
          })

          // Update crawled_pages with analysis data
          await supabase
            .from('crawled_pages')
            .update({
              aeo_score: pageAnalysis.aeoReadiness.score,
              word_count: pageAnalysis.contentStructure.wordCount,
              has_schema: pageAnalysis.schemaMarkup.length > 0,
              title: pageContent.title
            })
            .eq('organization_id', organizationId)
            .eq('url', pageContent.url)
        }

        if (progress) {
          await progress.update({
            progressPercent: 55,
            message: `Completed analysis of ${pageContents.length} pages`,
            pagesAnalyzed: pageContents.length
          })
        }

        // Page-specific recommendations will be generated by AI after product analysis
        // Store pageAnalyses for later use
        pageContents = pageContents.map((pc, i) => ({
          ...pc,
          analysis: pageAnalyses[i]?.analysis
        })) as any
      }

      // 4. Generate prompts using AI
      console.log(`[Website Analysis] Generating prompts...`)
      if (progress) {
        await progress.update({
          step: 'understanding_product',
          stepNumber: 4,
          progressPercent: 60,
          message: 'Understanding your product and services...'
        })
      }

      const promptGenerator = new PromptGenerator()

      // First, analyze the product/service
      const productAnalysis = await promptGenerator.analyzeProduct(
        websiteAnalysis,
        websiteAnalysis.textContent
      )

      console.log(`[Website Analysis] Product identified: ${productAnalysis.productName}`)

      if (progress) {
        await progress.update({
          progressPercent: 65,
          message: `Identified product: ${productAnalysis.productName}`,
          details: {
            productName: productAnalysis.productName,
            keyFeatures: productAnalysis.keyFeatures?.slice(0, 3)
          }
        })
      }

      // Store product analysis
      await supabase
        .from('product_analyses')
        .upsert({
          organization_id: organizationId,
          product_id: productId || null,
          domain,
          product_name: productAnalysis.productName,
          product_description: productAnalysis.productDescription,
          key_features: productAnalysis.keyFeatures,
          target_audience: productAnalysis.targetAudience,
          use_cases: productAnalysis.useCases,
          differentiators: productAnalysis.differentiators,
          analyzed_at: new Date().toISOString()
        }, {
          onConflict: productId ? 'product_id' : 'organization_id'
        })

      // Generate prompts (5 topics × 3 granularity levels = 15 prompts)
      if (progress) {
        await progress.update({
          step: 'generating_prompts',
          stepNumber: 5,
          progressPercent: 70,
          message: 'Generating AI visibility prompts...'
        })
      }

      const generatedPrompts = await promptGenerator.generatePrompts(
        productAnalysis,
        websiteAnalysis
      )

      console.log(`[Website Analysis] Generated ${generatedPrompts.length} prompts`)

      if (progress) {
        await progress.update({
          progressPercent: 75,
          message: `Generated ${generatedPrompts.length} visibility prompts`,
          promptsGenerated: generatedPrompts.length
        })
      }

      // Delete existing prompts for this product/organization (to avoid duplicates)
      let deleteQuery = supabase
        .from('prompts')
        .delete()
        .eq('organization_id', organizationId)
        .eq('is_custom', false)

      if (productId) {
        deleteQuery = deleteQuery.eq('product_id', productId)
      }
      await deleteQuery

      // Store generated prompts
      const promptsToInsert = generatedPrompts.map(p => ({
        organization_id: organizationId,
        product_id: productId || null,
        prompt_text: p.promptText,
        category: p.category,
        granularity_level: p.granularityLevel,
        is_custom: false
      }))

      const { error: promptsError } = await supabase
        .from('prompts')
        .insert(promptsToInsert)

      if (promptsError) {
        console.error('[Website Analysis] Error storing prompts:', promptsError)
        // Don't throw - prompts are not critical for completion
      } else {
        console.log(`[Website Analysis] Stored ${promptsToInsert.length} prompts`)
      }

      // 5. Get recent scan results for context
      console.log(`[Website Analysis] Fetching recent scan results...`)
      const { data: scanResults } = await supabase
        .from('prompt_results')
        .select('*')
        .eq('organization_id', organizationId)
        .order('tested_at', { ascending: false })
        .limit(50)

      // 6. Get competitor gaps if requested
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

      // 7. Generate AI-powered recommendations using research knowledge base
      console.log(`[Website Analysis] Generating AI-powered recommendations...`)
      if (progress) {
        await progress.update({
          step: 'generating_recommendations',
          stepNumber: 6,
          progressPercent: 80,
          message: 'Creating personalized optimization recommendations...'
        })
      }

      const aiRecommendationEngine = new AIRecommendationEngine()

      let aiRecommendations: AIRecommendation[] = []
      try {
        aiRecommendations = await aiRecommendationEngine.generateRecommendations(
          websiteAnalysis,
          scanResults || [],
          {
            productName: productAnalysis.productName,
            productDescription: productAnalysis.productDescription,
            targetAudience: productAnalysis.targetAudience
          },
          { maxRecommendations: 10 } // Reduced since we'll add page-specific ones
        )
        console.log(`[Website Analysis] Generated ${aiRecommendations.length} general AI recommendations`)

        if (progress) {
          await progress.update({
            progressPercent: 85,
            message: `Created ${aiRecommendations.length} optimization recommendations`
          })
        }
      } catch (error) {
        console.error('[Website Analysis] AI recommendation generation failed:', error)
      }

      // 8. Generate AI-powered page-specific recommendations (replaces rule-based)
      let aiPageRecommendations = new Map<string, AIRecommendation[]>()
      if (pageContents.length > 0) {
        console.log(`[Website Analysis] Generating AI page-specific recommendations for ${pageContents.length} pages...`)

        if (progress) {
          await progress.update({
            progressPercent: 90,
            message: `Generating page-specific recommendations for ${pageContents.length} pages...`
          })
        }

        try {
          // Prepare page data for AI
          const pagesForAI = pageContents.map((pc: any) => ({
            url: pc.url,
            title: pc.title,
            contentType: pc.contentType,
            content: pc.textContent || '',
            analysis: pc.analysis || websiteAnalysis
          }))

          // Get existing recommendation titles to avoid duplicates
          const existingTitles = aiRecommendations.map(r => r.title)

          aiPageRecommendations = await aiRecommendationEngine.generatePageRecommendations(
            pagesForAI,
            {
              productName: productAnalysis.productName,
              productDescription: productAnalysis.productDescription
            },
            existingTitles
          )
          console.log(`[Website Analysis] Generated AI recommendations for ${aiPageRecommendations.size} pages`)
        } catch (error) {
          console.error('[Website Analysis] AI page recommendations failed:', error)
        }
      }

      // Fallback to rule-based recommendations ONLY if AI completely fails
      const recommendationEngine = new RecommendationEngine()
      let fallbackRecommendations: Recommendation[] = []

      if (aiRecommendations.length === 0 && aiPageRecommendations.size === 0) {
        console.log(`[Website Analysis] Using rule-based recommendations as fallback`)
        fallbackRecommendations = recommendationEngine.generateRecommendations(
          websiteAnalysis,
          scanResults || [],
          competitorGaps
        )
      }

      // 9. Prepare all recommendations for storage
      console.log(`[Website Analysis] Storing recommendations...`)
      if (progress) {
        await progress.update({
          progressPercent: 95,
          message: 'Finalizing analysis results...'
        })
      }

      // Delete existing pending recommendations to avoid duplicates
      let deleteRecsQuery = supabase
        .from('fix_recommendations')
        .delete()
        .eq('organization_id', organizationId)
        .eq('status', 'pending')

      if (productId) {
        deleteRecsQuery = deleteRecsQuery.eq('product_id', productId)
      }
      await deleteRecsQuery

      const allRecommendationsToInsert: any[] = []

      // Add AI-powered general recommendations (primary source)
      for (const rec of aiRecommendations) {
        allRecommendationsToInsert.push({
          organization_id: organizationId,
          product_id: productId || null,
          title: rec.title,
          description: rec.description,
          category: rec.category,
          priority: rec.priority,
          estimated_impact: rec.estimatedImpact,
          implementation_guide: rec.implementationGuide,
          code_snippets: rec.codeSnippets || [],
          estimated_time: rec.estimatedTime,
          difficulty: rec.difficulty,
          status: 'pending',
          page_url: null,
          page_title: rec.aiPlatformSpecific?.length
            ? `Optimized for: ${rec.aiPlatformSpecific.join(', ')}`
            : 'General',
          ai_generated: true,
          research_insight: rec.researchInsight || null
        })
      }

      // Add AI-powered page-specific recommendations
      for (const [pageUrl, recs] of aiPageRecommendations) {
        const pageContent = pageContents.find((p: any) => p.url === pageUrl)
        const pageTitle = pageContent?.title || new URL(pageUrl).pathname

        for (const rec of recs) {
          allRecommendationsToInsert.push({
            organization_id: organizationId,
            product_id: productId || null,
            title: rec.title,
            description: rec.description,
            category: rec.category,
            priority: rec.priority,
            estimated_impact: rec.estimatedImpact,
            implementation_guide: rec.implementationGuide,
            code_snippets: rec.codeSnippets || [],
            estimated_time: rec.estimatedTime,
            difficulty: rec.difficulty,
            status: 'pending',
            page_url: pageUrl,
            page_title: pageTitle,
            ai_generated: true,
            research_insight: rec.researchInsight || null
          })
        }
      }

      // Add rule-based fallback recommendations (only if AI completely failed)
      for (const rec of fallbackRecommendations) {
        allRecommendationsToInsert.push({
          organization_id: organizationId,
          product_id: productId || null,
          title: rec.title,
          description: rec.description,
          category: rec.category,
          priority: rec.priority,
          estimated_impact: rec.estimatedImpact,
          implementation_guide: rec.implementationGuide,
          code_snippets: rec.codeSnippets || [],
          estimated_time: rec.estimatedTime,
          difficulty: rec.difficulty,
          status: 'pending',
          page_url: null,
          page_title: 'Homepage',
          ai_generated: false
        })
      }

      const { error: recsError } = await supabase
        .from('fix_recommendations')
        .insert(allRecommendationsToInsert)

      if (recsError) {
        console.error('[Website Analysis] Error storing recommendations:', recsError)
        throw recsError
      }

      const totalRecommendations = allRecommendationsToInsert.length
      const pagesAnalyzed = pageContents.length + 1 // +1 for homepage

      console.log(`[Website Analysis] Successfully completed analysis for ${domain}`)
      console.log(`[Website Analysis] - Pages analyzed: ${pagesAnalyzed}`)
      console.log(`[Website Analysis] - Recommendations generated: ${totalRecommendations}`)

      // Mark progress as complete
      if (progress) {
        await progress.complete()
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

      // Update product's aeo_score and last_analyzed_at if productId provided
      if (productId) {
        await supabase
          .from('products')
          .update({
            aeo_score: websiteAnalysis.aeoReadiness.score,
            last_analyzed_at: new Date().toISOString()
          })
          .eq('id', productId)
      }

      // NOTE: Visibility scans are now done via the browser extension, not server-side
      // Users should install the Columbus extension to run visibility scans

      return {
        success: true,
        domain,
        productId,
        aeoReadiness: websiteAnalysis.aeoReadiness.score,
        recommendationsCount: totalRecommendations,
        pagesAnalyzed,
        analysisId: analysisRecord.id
      }
    } catch (error) {
      console.error('[Website Analysis] Error:', error)

      // Mark progress as failed
      if (progress) {
        await progress.fail(error instanceof Error ? error.message : 'Unknown error')
      }

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
