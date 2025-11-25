import { Queue, Worker } from 'bullmq'
import { createRedisConnection } from '../utils/redis.js'
import { createClient } from '@supabase/supabase-js'

const redisConnection = createRedisConnection()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
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
          const org = Array.isArray(subscription.organizations)
            ? subscription.organizations[0]
            : subscription.organizations
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
            const hourOfDay = now.getHours()

            // Run website analysis on Sundays at 2 AM
            if (dayOfWeek === 0 && hourOfDay >= 2 && hourOfDay < 8) {
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

            // Generate weekly report on Mondays at 6 AM
            if (dayOfWeek === 1 && hourOfDay >= 6 && hourOfDay < 12) {
              const reportQueue = new Queue('report-generation', {
                connection: redisConnection
              })

              // Check if we already generated a report this week
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              const { count: recentReports } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', subscription.organization_id)
                .eq('report_type', 'executive_summary')
                .gte('created_at', weekAgo.toISOString())

              if (!recentReports || recentReports === 0) {
                await reportQueue.add('generate', {
                  organizationId: subscription.organization_id,
                  reportType: 'executive_summary',
                  periodDays: 7
                })
                console.log(`[Scan Scheduler] Queued weekly report for ${org.name}`)
              }
            }

            // Run competitor analysis twice weekly (Wednesday and Saturday)
            if ((dayOfWeek === 3 || dayOfWeek === 6) && hourOfDay >= 3 && hourOfDay < 9) {
              // Get competitors for this organization
              const { data: competitors } = await supabase
                .from('competitors')
                .select('id, name')
                .eq('organization_id', subscription.organization_id)
                .eq('status', 'active')
                .limit(10)

              if (competitors && competitors.length > 0) {
                const competitorQueue = new Queue('competitor-analysis', {
                  connection: redisConnection
                })

                for (const competitor of competitors) {
                  await competitorQueue.add('analyze', {
                    organizationId: subscription.organization_id,
                    brandName: org.name,
                    competitorId: competitor.id,
                    competitorName: competitor.name,
                    promptIds: prompts.map(p => p.id).slice(0, 5) // Use subset of prompts
                  })
                }
                console.log(`[Scan Scheduler] Queued competitor analysis for ${org.name} (${competitors.length} competitors)`)
              }
            }
          }

          // Queue freshness checks for all active plans (daily at 4 AM)
          const now = new Date()
          const hourOfDay = now.getHours()
          if (hourOfDay >= 4 && hourOfDay < 10) {
            const freshnessQueue = new Queue('freshness-checks', {
              connection: redisConnection
            })

            // Check if we already ran freshness check today
            const today = now.toISOString().split('T')[0]
            const { count: todayChecks } = await supabase
              .from('monitored_pages')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', subscription.organization_id)
              .gte('last_crawled_at', today)

            // Get monitored pages count
            const { count: totalPages } = await supabase
              .from('monitored_pages')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', subscription.organization_id)
              .eq('status', 'active')

            // Only queue if we have pages and haven't checked most of them today
            if (totalPages && totalPages > 0 && (!todayChecks || todayChecks < totalPages / 2)) {
              await freshnessQueue.add('check', {
                organizationId: subscription.organization_id
              })
              console.log(`[Scan Scheduler] Queued freshness check for ${org.name}`)
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
