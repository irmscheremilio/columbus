import { Queue, Worker, QueueScheduler } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Scan Scheduler Queue
 * Schedules recurring visibility scans for all organizations
 */
export const scanSchedulerQueue = new Queue('scan-scheduler', {
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
 * Queue Scheduler for recurring jobs
 */
export const scheduler = new QueueScheduler('scan-scheduler', {
  connection: redisConnection
})

/**
 * Scan Scheduler Worker
 * Runs periodically to queue visibility scans for organizations based on their schedule
 */
export const scanSchedulerWorker = new Worker(
  'scan-scheduler',
  async (job) => {
    console.log(`[Scan Scheduler] Running scheduled scan check at ${new Date().toISOString()}`)

    try {
      // Get all organizations with their subscription details
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          organization_id,
          plan_type,
          status,
          organizations (
            id,
            name,
            domain
          )
        `)
        .eq('status', 'active')

      if (subsError) {
        console.error('[Scan Scheduler] Error fetching subscriptions:', subsError)
        throw subsError
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log('[Scan Scheduler] No active subscriptions found')
        return { organizations: 0, scansQueued: 0 }
      }

      console.log(`[Scan Scheduler] Found ${subscriptions.length} active organizations`)

      let scansQueued = 0

      for (const subscription of subscriptions) {
        try {
          const org = subscription.organizations
          if (!org || !org.domain) {
            console.log(`[Scan Scheduler] Skipping org ${subscription.organization_id} - no domain configured`)
            continue
          }

          // Determine scan frequency based on plan
          const shouldScan = await shouldRunScanForOrganization(
            subscription.organization_id,
            subscription.plan_type
          )

          if (!shouldScan) {
            console.log(`[Scan Scheduler] Skipping org ${org.name} - not due for scan yet`)
            continue
          }

          console.log(`[Scan Scheduler] Queueing scan for ${org.name}`)

          // Get prompts for this organization
          const { data: prompts, error: promptsError } = await supabase
            .from('prompts')
            .select('id')
            .eq('organization_id', subscription.organization_id)
            .limit(getPlanPromptLimit(subscription.plan_type))

          if (promptsError || !prompts || prompts.length === 0) {
            console.log(`[Scan Scheduler] No prompts found for ${org.name}`)
            continue
          }

          // Queue visibility scan
          const visibilityScanQueue = new Queue('visibility-scan', {
            connection: redisConnection
          })

          await visibilityScanQueue.add('scan', {
            organizationId: subscription.organization_id,
            brandName: org.name,
            domain: org.domain,
            promptIds: prompts.map(p => p.id),
            isScheduled: true
          })

          // Also queue website analysis for Pro+ plans (weekly)
          if (['pro', 'agency', 'enterprise'].includes(subscription.plan_type)) {
            const now = new Date()
            const dayOfWeek = now.getDay()

            // Run website analysis on Sundays
            if (dayOfWeek === 0) {
              const websiteAnalysisQueue = new Queue('website-analysis', {
                connection: redisConnection
              })

              await websiteAnalysisQueue.add('analyze', {
                organizationId: subscription.organization_id,
                domain: org.domain,
                includeCompetitorGaps: true
              })

              console.log(`[Scan Scheduler] Queued website analysis for ${org.name}`)
            }
          }

          // Record last scan time
          await supabase
            .from('organizations')
            .update({ last_scan_at: new Date().toISOString() })
            .eq('id', subscription.organization_id)

          scansQueued++
        } catch (error) {
          console.error(`[Scan Scheduler] Error processing org ${subscription.organization_id}:`, error)
          // Continue with next organization
        }
      }

      console.log(`[Scan Scheduler] Queued ${scansQueued} scans for ${subscriptions.length} organizations`)

      return {
        organizations: subscriptions.length,
        scansQueued
      }
    } catch (error) {
      console.error('[Scan Scheduler] Error:', error)
      throw error
    }
  },
  {
    connection: redisConnection,
    concurrency: 1 // Only one scheduler should run at a time
  }
)

/**
 * Determine if an organization is due for a scan based on their plan
 */
async function shouldRunScanForOrganization(
  organizationId: string,
  planType: string
): Promise<boolean> {
  const { data: org } = await supabase
    .from('organizations')
    .select('last_scan_at')
    .eq('id', organizationId)
    .single()

  if (!org) return true // First scan

  const lastScan = org.last_scan_at ? new Date(org.last_scan_at) : null
  if (!lastScan) return true // Never scanned

  const now = new Date()
  const hoursSinceLastScan = (now.getTime() - lastScan.getTime()) / (1000 * 60 * 60)

  // Scan frequency by plan:
  // Free: Once per month (720 hours)
  // Pro: Weekly (168 hours)
  // Agency: Every 3 days (72 hours)
  // Enterprise: Daily (24 hours)
  const scanIntervals: Record<string, number> = {
    free: 720,
    pro: 168,
    agency: 72,
    enterprise: 24
  }

  const interval = scanIntervals[planType] || 720
  return hoursSinceLastScan >= interval
}

/**
 * Get prompt limit based on plan
 */
function getPlanPromptLimit(planType: string): number {
  const limits: Record<string, number> = {
    free: 5,
    pro: 20,
    agency: 50,
    enterprise: 100
  }
  return limits[planType] || 5
}

// Schedule recurring job - runs every 6 hours
scanSchedulerQueue.add(
  'check-scans',
  {},
  {
    repeat: {
      every: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
    },
    jobId: 'recurring-scan-check' // Prevent duplicates
  }
)

// Event listeners
scanSchedulerWorker.on('completed', (job, result) => {
  console.log(`[Scan Scheduler] Job ${job.id} completed:`, result)
})

scanSchedulerWorker.on('failed', (job, err) => {
  console.error(`[Scan Scheduler] Job ${job?.id} failed:`, err.message)
})

scanSchedulerWorker.on('error', (err) => {
  console.error('[Scan Scheduler] Worker error:', err)
})

console.log('[Scan Scheduler] Worker started - checks every 6 hours')
