import { createClient } from '@supabase/supabase-js'
import { createRedisConnection } from '../utils/redis.js'
import { websiteAnalysisQueue } from './website-analysis.js'
import { competitorAnalysisQueue } from './competitor-analysis.js'
// NOTE: visibilityScanQueue import removed - visibility scanning is now handled by the browser extension
import { freshnessCheckQueue } from './freshness-checker.js'
import { reportGenerationQueue } from './report-generator.js'
import { promptEvaluationQueue } from './prompt-evaluation.js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
)

/**
 * Job Processor
 * Polls the database for queued jobs and dispatches them to appropriate workers
 */
class JobProcessor {
  private isRunning = false
  private pollInterval = 5000 // Poll every 5 seconds

  async start() {
    console.log('[Job Processor] Starting...')
    this.isRunning = true
    this.poll()
  }

  async stop() {
    console.log('[Job Processor] Stopping...')
    this.isRunning = false
  }

  private async poll() {
    while (this.isRunning) {
      try {
        await this.processQueuedJobs()
      } catch (error) {
        console.error('[Job Processor] Error processing jobs:', error)
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, this.pollInterval))
    }
  }

  private async processQueuedJobs() {
    // Fetch queued jobs
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) {
      console.error('[Job Processor] Error fetching jobs:', error)
      return
    }

    if (!jobs || jobs.length === 0) {
      return
    }

    console.log(`[Job Processor] Found ${jobs.length} queued jobs`)

    // Process each job
    for (const job of jobs) {
      try {
        // Mark as processing
        await supabase
          .from('jobs')
          .update({
            status: 'processing',
            started_at: new Date().toISOString()
          })
          .eq('id', job.id)

        // Dispatch to appropriate queue
        await this.dispatchJob(job)
      } catch (error) {
        console.error(`[Job Processor] Error dispatching job ${job.id}:`, error)

        // Mark as failed
        await supabase
          .from('jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', job.id)
      }
    }
  }

  private async dispatchJob(job: any) {
    console.log(`[Job Processor] Dispatching ${job.job_type} job ${job.id}`)

    switch (job.job_type) {
      case 'website_analysis':
        console.log(`[Job Processor] Website analysis job metadata:`, JSON.stringify(job.metadata, null, 2))
        await websiteAnalysisQueue.add('analyze', {
          organizationId: job.organization_id,
          productId: job.metadata.productId || job.product_id,
          domain: job.metadata.domain,
          includeCompetitorGaps: job.metadata.includeCompetitorGaps ?? true,
          language: job.metadata.language || 'en', // Pass language for prompt generation
          jobId: job.id
        })
        break

      case 'competitor_analysis':
        await competitorAnalysisQueue.add('analyze', {
          organizationId: job.organization_id,
          brandName: job.metadata.brandName,
          competitorId: job.metadata.competitorId,
          competitorName: job.metadata.competitorName,
          promptIds: job.metadata.promptIds,
          jobId: job.id
        })
        break

      case 'visibility_scan':
        // DEPRECATED: Server-side visibility scanning has been replaced by the browser extension.
        // Reject any queued visibility_scan jobs with an appropriate message.
        console.log(`[Job Processor] Rejecting deprecated visibility_scan job ${job.id} - use browser extension instead`)
        await supabase
          .from('jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: 'Server-side visibility scanning is deprecated. Please use the Columbus browser extension for visibility scans.'
          })
          .eq('id', job.id)
        return // Don't proceed with dispatching
        break

      case 'freshness_check':
        await freshnessCheckQueue.add('check', {
          pageId: job.metadata.pageId,
          organizationId: job.metadata.organizationId || job.organization_id,
          scheduledCheck: job.metadata.scheduledCheck ?? false
        })
        // Mark as completed immediately since the queue handles the work
        await supabase
          .from('jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id)
        break

      case 'report_generation':
        await reportGenerationQueue.add('generate', {
          organizationId: job.organization_id,
          productId: job.metadata.productId || job.product_id,
          reportType: job.metadata.reportType || 'executive_summary',
          periodDays: job.metadata.periodDays || 30,
          email: job.metadata.email,
          jobId: job.id
        })
        break

      case 'prompt_evaluation':
        await promptEvaluationQueue.add('evaluate', {
          promptResultId: job.metadata.promptResultId,
          jobId: job.id
        })
        break

      default:
        throw new Error(`Unknown job type: ${job.job_type}`)
    }

    console.log(`[Job Processor] Successfully dispatched job ${job.id} to ${job.job_type} queue`)
  }
}

// Create and export singleton instance
export const jobProcessor = new JobProcessor()

// Auto-start when module is imported
jobProcessor.start()

console.log('[Job Processor] Initialized')
