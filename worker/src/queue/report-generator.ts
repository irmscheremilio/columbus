import { Queue, Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { createRedisConnection } from '../utils/redis.js'
import { generatePDFReport, type ReportData } from '../services/pdf-report.js'

const redisConnection = createRedisConnection()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
)

export interface ReportGenerationJobData {
  organizationId: string
  productId?: string
  reportType: 'executive_summary' | 'detailed' | 'competitor_analysis'
  periodDays?: number // Default 30 days
  email?: string // Optional: email to send report to
  jobId?: string
}

export interface ReportGenerationResult {
  reportId: string
  downloadUrl: string
  generatedAt: Date
}

/**
 * Report Generation Queue
 */
export const reportGenerationQueue = new Queue<ReportGenerationJobData>('report-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 50,
    removeOnFail: 50
  }
})

/**
 * Gather all data needed for report generation
 */
async function gatherReportData(organizationId: string, productId: string | undefined, periodDays: number): Promise<ReportData> {
  const endDate = new Date()
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

  // Get organization info
  const { data: org } = await supabase
    .from('organizations')
    .select('name, domain')
    .eq('id', organizationId)
    .single()

  // Get product info if productId provided
  let productName = org?.name || 'Unknown Organization'
  if (productId) {
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', productId)
      .single()
    if (product) {
      productName = product.name
    }
  }

  // Build query for visibility scores
  let scoresQuery = supabase
    .from('visibility_scores')
    .select('score, metrics')
    .eq('organization_id', organizationId)
    .order('period_start', { ascending: false })
    .limit(1)

  if (productId) {
    scoresQuery = scoresQuery.eq('product_id', productId)
  }

  const { data: currentScore } = await scoresQuery.single()

  let prevScoresQuery = supabase
    .from('visibility_scores')
    .select('score')
    .eq('organization_id', organizationId)
    .order('period_start', { ascending: false })
    .range(1, 1)

  if (productId) {
    prevScoresQuery = prevScoresQuery.eq('product_id', productId)
  }

  const { data: previousScore } = await prevScoresQuery.single()

  // Build query for prompt results
  let promptResultsQuery = supabase
    .from('prompt_results')
    .select(`
      *,
      prompts(prompt_text, category, granularity_level)
    `)
    .eq('organization_id', organizationId)
    .gte('tested_at', startDate.toISOString())
    .lte('tested_at', endDate.toISOString())

  if (productId) {
    promptResultsQuery = promptResultsQuery.eq('product_id', productId)
  }

  const { data: promptResults } = await promptResultsQuery

  // Calculate AI model breakdown
  const modelStats = new Map<string, { mentions: number; citations: number; positions: number[]; total: number }>()

  for (const result of promptResults || []) {
    const model = result.ai_model
    if (!modelStats.has(model)) {
      modelStats.set(model, { mentions: 0, citations: 0, positions: [], total: 0 })
    }
    const stats = modelStats.get(model)!
    stats.total++
    if (result.brand_mentioned) stats.mentions++
    if (result.citation_present) stats.citations++
    if (result.position) stats.positions.push(result.position)
  }

  const aiModelBreakdown = Array.from(modelStats.entries()).map(([model, stats]) => ({
    model,
    mentionRate: Math.round((stats.mentions / stats.total) * 100),
    citationRate: Math.round((stats.citations / stats.total) * 100),
    avgPosition: stats.positions.length > 0
      ? stats.positions.reduce((a, b) => a + b, 0) / stats.positions.length
      : null
  }))

  // Calculate prompt performance
  const promptStats = new Map<string, { mentions: number; total: number; models: Set<string> }>()

  for (const result of promptResults || []) {
    const promptText = result.prompts?.prompt_text || 'Unknown'
    if (!promptStats.has(promptText)) {
      promptStats.set(promptText, { mentions: 0, total: 0, models: new Set() })
    }
    const stats = promptStats.get(promptText)!
    stats.total++
    if (result.brand_mentioned) {
      stats.mentions++
      stats.models.add(result.ai_model)
    }
  }

  const allPrompts = Array.from(promptStats.entries()).map(([promptText, stats]) => ({
    promptText,
    mentionRate: Math.round((stats.mentions / stats.total) * 100),
    models: Array.from(stats.models)
  }))

  const topPerformingPrompts = [...allPrompts]
    .sort((a, b) => b.mentionRate - a.mentionRate)
    .slice(0, 5)

  const weakestPrompts = [...allPrompts]
    .sort((a, b) => a.mentionRate - b.mentionRate)
    .slice(0, 5)

  // Get competitor data
  let competitorsQuery = supabase
    .from('competitors')
    .select('id, name')
    .eq('organization_id', organizationId)

  if (productId) {
    competitorsQuery = competitorsQuery.eq('product_id', productId)
  }

  const { data: competitors } = await competitorsQuery

  let competitorResultsQuery = supabase
    .from('competitor_results')
    .select('competitor_id, mentioned, position')
    .eq('organization_id', organizationId)
    .gte('tested_at', startDate.toISOString())

  if (productId) {
    competitorResultsQuery = competitorResultsQuery.eq('product_id', productId)
  }

  const { data: competitorResults } = await competitorResultsQuery

  const competitorStats = new Map<string, { mentions: number; positions: number[]; total: number; name: string }>()

  // Add own brand
  const ownMentions = promptResults?.filter(r => r.brand_mentioned).length || 0
  const ownTotal = promptResults?.length || 1
  competitorStats.set('self', {
    mentions: ownMentions,
    positions: [],
    total: ownTotal,
    name: productName
  })

  // Add competitors
  for (const competitor of competitors || []) {
    competitorStats.set(competitor.id, {
      mentions: 0,
      positions: [],
      total: 0,
      name: competitor.name
    })
  }

  for (const result of competitorResults || []) {
    const stats = competitorStats.get(result.competitor_id)
    if (stats) {
      stats.total++
      if (result.mentioned) stats.mentions++
      if (result.position) stats.positions.push(result.position)
    }
  }

  const competitorComparison = Array.from(competitorStats.values())
    .filter(s => s.total > 0)
    .map(stats => ({
      name: stats.name,
      mentionRate: Math.round((stats.mentions / stats.total) * 100),
      avgPosition: stats.positions.length > 0
        ? stats.positions.reduce((a, b) => a + b, 0) / stats.positions.length
        : null
    }))

  // Get recommendations
  let recommendationsQuery = supabase
    .from('fix_recommendations')
    .select('title, description, priority, category')
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .limit(10)

  if (productId) {
    recommendationsQuery = recommendationsQuery.eq('product_id', productId)
  }

  const { data: recommendations } = await recommendationsQuery

  // Get AEO readiness
  let websiteQuery = supabase
    .from('website_analyses')
    .select('aeo_readiness')
    .eq('organization_id', organizationId)
    .order('analyzed_at', { ascending: false })
    .limit(1)

  if (productId) {
    websiteQuery = websiteQuery.eq('product_id', productId)
  }

  const { data: websiteAnalysis } = await websiteQuery.single()

  // Get freshness metrics
  let pagesQuery = supabase
    .from('monitored_pages')
    .select('freshness_score')
    .eq('organization_id', organizationId)

  if (productId) {
    pagesQuery = pagesQuery.eq('product_id', productId)
  }

  const { data: pages } = await pagesQuery

  const freshnessMetrics = pages && pages.length > 0 ? {
    avgFreshnessScore: Math.round(pages.reduce((sum, p) => sum + (p.freshness_score || 50), 0) / pages.length),
    stalePages: pages.filter(p => (p.freshness_score || 50) < 50).length,
    totalMonitoredPages: pages.length
  } : undefined

  // Calculate score trend
  const current = currentScore?.score || 0
  const previous = previousScore?.score || current
  const trend = current > previous ? 'up' : current < previous ? 'down' : 'stable'

  return {
    organizationName: productName,
    domain: org?.domain || '',
    generatedAt: new Date(),
    period: {
      start: startDate,
      end: endDate
    },
    visibilityScore: {
      current,
      previous,
      trend: trend as 'up' | 'down' | 'stable'
    },
    aiModelBreakdown,
    topPerformingPrompts,
    weakestPrompts,
    competitorComparison,
    recommendations: (recommendations || []).map(r => ({
      title: r.title,
      description: r.description,
      priority: r.priority,
      category: r.category
    })),
    freshnessMetrics,
    aeoReadiness: websiteAnalysis?.aeo_readiness ? {
      score: websiteAnalysis.aeo_readiness.score || 0,
      strengths: websiteAnalysis.aeo_readiness.strengths || [],
      weaknesses: websiteAnalysis.aeo_readiness.weaknesses || []
    } : undefined
  }
}

/**
 * Report Generation Worker
 */
export const reportGenerationWorker = new Worker<ReportGenerationJobData, ReportGenerationResult>(
  'report-generation',
  async (job) => {
    const { organizationId, productId, reportType, periodDays = 30, email } = job.data

    console.log(`[Report Generator] Starting ${reportType} report for org ${organizationId}${productId ? ` (product: ${productId})` : ''}`)

    try {
      // Gather data
      console.log('[Report Generator] Gathering report data...')
      const reportData = await gatherReportData(organizationId, productId, periodDays)

      // Generate PDF
      console.log('[Report Generator] Generating PDF...')
      const pdfBuffer = await generatePDFReport(reportData)

      // Store PDF in Supabase storage
      const pathPrefix = productId || organizationId
      const fileName = `reports/${pathPrefix}/${reportType}_${Date.now()}.pdf`

      console.log('[Report Generator] Uploading to storage...')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        })

      if (uploadError) {
        console.error('[Report Generator] Upload error:', uploadError)
        throw uploadError
      }

      // Get signed URL for download (valid for 7 days)
      const { data: signedUrl } = await supabase.storage
        .from('reports')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7) // 7 days

      // Store report record
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          organization_id: organizationId,
          product_id: productId || null,
          report_type: reportType,
          file_path: fileName,
          download_url: signedUrl?.signedUrl,
          period_start: reportData.period.start.toISOString(),
          period_end: reportData.period.end.toISOString(),
          metadata: {
            visibilityScore: reportData.visibilityScore.current,
            promptsAnalyzed: reportData.topPerformingPrompts.length + reportData.weakestPrompts.length,
            competitorsCompared: reportData.competitorComparison.length
          }
        })
        .select()
        .single()

      if (reportError) {
        console.error('[Report Generator] Error storing report record:', reportError)
      }

      console.log(`[Report Generator] Report generated successfully: ${report?.id}`)

      // TODO: Send email with report if email provided
      if (email) {
        console.log(`[Report Generator] Would send report to ${email}`)
        // await sendReportEmail(email, signedUrl?.signedUrl)
      }

      return {
        reportId: report?.id || fileName,
        downloadUrl: signedUrl?.signedUrl || '',
        generatedAt: new Date()
      }
    } catch (error) {
      console.error('[Report Generator] Error:', error)
      throw error
    }
  },
  {
    connection: redisConnection,
    concurrency: 1 // One report at a time to avoid memory issues
  }
)

// Worker event handlers
reportGenerationWorker.on('completed', async (job, result) => {
  console.log(`[Report Generator] Job ${job.id} completed: ${result.reportId}`)

  // Update job status if jobId provided
  if (job.data.jobId) {
    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', job.data.jobId)

    if (error) {
      console.error(`[Report Generator] Failed to update job status:`, error)
    }
  }
})

reportGenerationWorker.on('failed', async (job, err) => {
  console.error(`[Report Generator] Job ${job?.id} failed:`, err.message)

  // Update job status if jobId provided
  if (job?.data.jobId) {
    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: err.message
      })
      .eq('id', job.data.jobId)

    if (error) {
      console.error(`[Report Generator] Failed to update job status:`, error)
    }
  }
})

reportGenerationWorker.on('error', (err) => {
  console.error('[Report Generator] Worker error:', err)
})

console.log('[Report Generator] Worker started')
