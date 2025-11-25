import { Queue, Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { createRedisConnection } from '../utils/redis.js'
import crypto from 'crypto'

const redisConnection = createRedisConnection()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
)

export interface FreshnessCheckJobData {
  pageId?: string // Single page check
  organizationId?: string // Check all pages for an org
  scheduledCheck?: boolean // Is this a scheduled batch check?
}

export interface FreshnessCheckResult {
  pagesChecked: number
  alertsCreated: number
  errors: string[]
}

/**
 * Freshness Check Queue
 * Monitors content freshness and creates alerts for stale content
 */
export const freshnessCheckQueue = new Queue<FreshnessCheckJobData>('freshness-checks', {
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
 * Calculate content hash for change detection
 */
function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

/**
 * Calculate freshness score (0-100) based on content age and update frequency
 */
function calculateFreshnessScore(
  lastModified: Date | null,
  lastCrawled: Date | null,
  staleThresholdDays: number,
  criticalThresholdDays: number
): number {
  if (!lastModified && !lastCrawled) return 50 // Unknown freshness

  const referenceDate = lastModified || lastCrawled!
  const ageInDays = (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)

  if (ageInDays <= 7) return 100 // Very fresh
  if (ageInDays <= staleThresholdDays / 2) return 90
  if (ageInDays <= staleThresholdDays) return 70
  if (ageInDays <= criticalThresholdDays / 2) return 50
  if (ageInDays <= criticalThresholdDays) return 30
  return 10 // Critical - very stale
}

/**
 * Extract metadata from HTML content
 */
function extractMetadata(html: string): {
  h1Text: string | null
  metaDescription: string | null
  wordCount: number
  schemaTypes: string[]
} {
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)

  // Extract text content for word count
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Find schema.org types
  const schemaTypes: string[] = []
  const schemaMatches = html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)
  for (const match of schemaMatches) {
    if (!schemaTypes.includes(match[1])) {
      schemaTypes.push(match[1])
    }
  }

  return {
    h1Text: h1Match ? h1Match[1].trim() : null,
    metaDescription: metaMatch ? metaMatch[1].trim() : null,
    wordCount: textContent.split(/\s+/).filter(w => w.length > 0).length,
    schemaTypes
  }
}

/**
 * Check a single page for freshness
 */
async function checkPageFreshness(
  page: any,
  settings: any
): Promise<{ updated: boolean; alertType?: string; alertSeverity?: string }> {
  console.log(`[Freshness Checker] Checking page: ${page.url}`)

  try {
    // Fetch the page
    const response = await fetch(page.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ColumbusAEO/1.0; +https://columbus-aeo.com)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      redirect: 'follow'
    })

    if (!response.ok) {
      // Page returned error - create alert
      await supabase
        .from('monitored_pages')
        .update({
          status: 'error',
          error_message: `HTTP ${response.status}: ${response.statusText}`,
          last_crawled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', page.id)

      return { updated: false, alertType: 'crawl_error', alertSeverity: 'high' }
    }

    const html = await response.text()
    const contentHash = hashContent(html)
    const metadata = extractMetadata(html)

    // Get Last-Modified header if available
    const lastModifiedHeader = response.headers.get('last-modified')
    const lastModified = lastModifiedHeader ? new Date(lastModifiedHeader) : null

    // Calculate freshness score
    const freshnessScore = calculateFreshnessScore(
      lastModified,
      new Date(),
      settings?.stale_threshold_days || 30,
      settings?.critical_threshold_days || 90
    )

    // Check if content changed
    const contentChanged = page.content_hash && page.content_hash !== contentHash

    // Store content snapshot if content changed or first crawl
    if (contentChanged || !page.content_hash) {
      await supabase
        .from('content_snapshots')
        .insert({
          page_id: page.id,
          content_hash: contentHash,
          word_count: metadata.wordCount,
          h1_text: metadata.h1Text,
          meta_description: metadata.metaDescription,
          schema_types: metadata.schemaTypes,
          last_modified_header: lastModified?.toISOString(),
          crawled_at: new Date().toISOString()
        })
    }

    // Calculate next check time
    const nextCheckAt = new Date(Date.now() + (page.check_frequency_hours || 72) * 60 * 60 * 1000)

    // Update page record
    await supabase
      .from('monitored_pages')
      .update({
        last_crawled_at: new Date().toISOString(),
        last_modified_at: lastModified?.toISOString() || page.last_modified_at,
        content_hash: contentHash,
        word_count: metadata.wordCount,
        freshness_score: freshnessScore,
        status: 'active',
        error_message: null,
        next_check_at: nextCheckAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', page.id)

    // Determine if we need to create alerts
    let alertType: string | undefined
    let alertSeverity: string | undefined

    if (contentChanged) {
      alertType = 'content_changed'
      alertSeverity = 'low' // Content changes are informational
    } else if (freshnessScore <= 30) {
      alertType = 'stale_content'
      alertSeverity = 'critical'
    } else if (freshnessScore <= 50) {
      alertType = 'stale_content'
      alertSeverity = 'high'
    } else if (freshnessScore <= 70) {
      alertType = 'stale_content'
      alertSeverity = 'medium'
    }

    return { updated: contentChanged, alertType, alertSeverity }
  } catch (error) {
    console.error(`[Freshness Checker] Error checking ${page.url}:`, error)

    // Update page with error status
    await supabase
      .from('monitored_pages')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        last_crawled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', page.id)

    return { updated: false, alertType: 'crawl_error', alertSeverity: 'high' }
  }
}

/**
 * Freshness Check Worker
 */
export const freshnessCheckWorker = new Worker<FreshnessCheckJobData, FreshnessCheckResult>(
  'freshness-checks',
  async (job) => {
    const { pageId, organizationId, scheduledCheck } = job.data

    console.log(`[Freshness Checker] Starting freshness check job`)

    const result: FreshnessCheckResult = {
      pagesChecked: 0,
      alertsCreated: 0,
      errors: []
    }

    try {
      let pages: any[] = []

      if (pageId) {
        // Single page check
        const { data, error } = await supabase
          .from('monitored_pages')
          .select('*')
          .eq('id', pageId)
          .single()

        if (error) throw error
        if (data) pages = [data]
      } else if (organizationId) {
        // All pages for an organization
        const { data, error } = await supabase
          .from('monitored_pages')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('status', 'active')

        if (error) throw error
        pages = data || []
      } else if (scheduledCheck) {
        // Scheduled check - get all pages due for checking
        const { data, error } = await supabase
          .from('monitored_pages')
          .select('*')
          .eq('status', 'active')
          .or(`next_check_at.is.null,next_check_at.lte.${new Date().toISOString()}`)
          .limit(50) // Process in batches

        if (error) throw error
        pages = data || []
      }

      console.log(`[Freshness Checker] Checking ${pages.length} pages`)

      // Process each page
      for (const page of pages) {
        try {
          // Get organization settings
          const { data: settings } = await supabase
            .from('freshness_settings')
            .select('*')
            .eq('organization_id', page.organization_id)
            .single()

          const checkResult = await checkPageFreshness(page, settings)
          result.pagesChecked++

          // Create alert if needed
          if (checkResult.alertType) {
            // Check if we already have an unread alert of this type for this page
            const { data: existingAlert } = await supabase
              .from('freshness_alerts')
              .select('id')
              .eq('page_id', page.id)
              .eq('alert_type', checkResult.alertType)
              .eq('is_read', false)
              .eq('is_dismissed', false)
              .single()

            if (!existingAlert) {
              const alertTitle = getAlertTitle(checkResult.alertType, page.title || page.url)
              const alertDescription = getAlertDescription(
                checkResult.alertType,
                page.url,
                page.freshness_score
              )

              await supabase.from('freshness_alerts').insert({
                organization_id: page.organization_id,
                page_id: page.id,
                alert_type: checkResult.alertType,
                severity: checkResult.alertSeverity,
                title: alertTitle,
                description: alertDescription
              })

              result.alertsCreated++
              console.log(`[Freshness Checker] Created ${checkResult.alertType} alert for ${page.url}`)
            }
          }

          // Add small delay between pages to avoid overwhelming servers
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          result.errors.push(`${page.url}: ${errorMsg}`)
          console.error(`[Freshness Checker] Error processing ${page.url}:`, error)
        }
      }

      console.log(`[Freshness Checker] Completed. Checked: ${result.pagesChecked}, Alerts: ${result.alertsCreated}`)

      return result
    } catch (error) {
      console.error('[Freshness Checker] Job error:', error)
      throw error
    }
  },
  {
    connection: redisConnection,
    concurrency: 1 // Process one at a time to avoid rate limiting
  }
)

/**
 * Generate alert title based on type
 */
function getAlertTitle(alertType: string, pageName: string): string {
  switch (alertType) {
    case 'stale_content':
      return `Stale content detected: ${pageName}`
    case 'content_changed':
      return `Content updated: ${pageName}`
    case 'crawl_error':
      return `Crawl error: ${pageName}`
    case 'competitor_updated':
      return `Competitor content updated: ${pageName}`
    default:
      return `Alert: ${pageName}`
  }
}

/**
 * Generate alert description based on type
 */
function getAlertDescription(alertType: string, url: string, freshnessScore?: number): string {
  switch (alertType) {
    case 'stale_content':
      return `The page at ${url} has a freshness score of ${freshnessScore || 'unknown'}. Consider updating the content to maintain AI visibility.`
    case 'content_changed':
      return `Content changes detected on ${url}. Review the changes to ensure they align with your AEO strategy.`
    case 'crawl_error':
      return `Unable to access ${url}. Please check if the page is still available.`
    case 'competitor_updated':
      return `A competitor has updated content at ${url}. Consider reviewing for competitive insights.`
    default:
      return `An issue was detected with ${url}.`
  }
}

/**
 * Schedule a freshness check for a specific page
 */
export async function schedulePageCheck(pageId: string, delay: number = 0): Promise<void> {
  await freshnessCheckQueue.add(
    'check-page',
    { pageId },
    { delay }
  )
}

/**
 * Schedule freshness checks for all pages in an organization
 */
export async function scheduleOrgCheck(organizationId: string): Promise<void> {
  await freshnessCheckQueue.add(
    'check-org',
    { organizationId }
  )
}

/**
 * Schedule the recurring batch check (should be called by cron)
 */
export async function scheduleRecurringCheck(): Promise<void> {
  await freshnessCheckQueue.add(
    'scheduled-batch',
    { scheduledCheck: true },
    {
      repeat: {
        pattern: '0 */6 * * *' // Every 6 hours
      }
    }
  )
}

// Worker event handlers
freshnessCheckWorker.on('completed', (job, result) => {
  console.log(`[Freshness Checker] Job ${job.id} completed: ${result.pagesChecked} pages checked, ${result.alertsCreated} alerts created`)
})

freshnessCheckWorker.on('failed', (job, err) => {
  console.error(`[Freshness Checker] Job ${job?.id} failed:`, err.message)
})

freshnessCheckWorker.on('error', (err) => {
  console.error('[Freshness Checker] Worker error:', err)
})

console.log('[Freshness Checker] Worker started')
