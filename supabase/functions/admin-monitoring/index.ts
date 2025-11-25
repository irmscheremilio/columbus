import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Service client for admin operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user is admin (you can define admin logic here)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    // For now, allow owners to access admin stats for their org
    const isAdmin = profile?.role === 'owner' || profile?.role === 'admin'

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const organizationId = profile.organization_id
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'overview'

    switch (action) {
      case 'overview': {
        // Get overall system stats for the organization
        const [jobStats, scanStats, userStats, usageStats] = await Promise.all([
          getJobStats(serviceClient, organizationId),
          getScanStats(serviceClient, organizationId),
          getUserStats(serviceClient, organizationId),
          getUsageStats(serviceClient, organizationId)
        ])

        return jsonResponse({
          jobs: jobStats,
          scans: scanStats,
          users: userStats,
          usage: usageStats,
          generatedAt: new Date().toISOString()
        })
      }

      case 'jobs': {
        // Get detailed job statistics
        const days = parseInt(url.searchParams.get('days') || '7')
        const stats = await getDetailedJobStats(serviceClient, organizationId, days)
        return jsonResponse(stats)
      }

      case 'health': {
        // Get system health status
        const health = await getSystemHealth(serviceClient, organizationId)
        return jsonResponse(health)
      }

      case 'usage': {
        // Get usage metrics
        const days = parseInt(url.searchParams.get('days') || '30')
        const usage = await getDetailedUsageStats(serviceClient, organizationId, days)
        return jsonResponse(usage)
      }

      case 'activity': {
        // Get recent activity log
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const activity = await getRecentActivity(serviceClient, organizationId, limit)
        return jsonResponse({ activity })
      }

      case 'alerts': {
        // Get system alerts
        const alerts = await getSystemAlerts(serviceClient, organizationId)
        return jsonResponse({ alerts })
      }

      default:
        return jsonResponse({ error: 'Invalid action' }, 400)
    }
  } catch (error) {
    console.error('Error in admin-monitoring:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Helper functions

function jsonResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function getJobStats(client: any, organizationId: string) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Get job counts by status
  const { data: jobs } = await client
    .from('jobs')
    .select('status, created_at')
    .eq('organization_id', organizationId)
    .gte('created_at', weekAgo)

  const statusCounts: Record<string, number> = {
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0
  }

  const todayJobs = { total: 0, completed: 0, failed: 0 }

  for (const job of jobs || []) {
    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1
    if (job.created_at.startsWith(today)) {
      todayJobs.total++
      if (job.status === 'completed') todayJobs.completed++
      if (job.status === 'failed') todayJobs.failed++
    }
  }

  const total = jobs?.length || 0
  const successRate = total > 0 ? ((statusCounts.completed / total) * 100).toFixed(1) : '0'

  return {
    total,
    byStatus: statusCounts,
    today: todayJobs,
    successRate: parseFloat(successRate),
    queuedNow: statusCounts.queued,
    processingNow: statusCounts.processing
  }
}

async function getScanStats(client: any, organizationId: string) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get prompt results count
  const { count: scanCount } = await client
    .from('prompt_results')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('tested_at', weekAgo)

  // Get visibility scores
  const { data: scores } = await client
    .from('visibility_scores')
    .select('score, period_start')
    .eq('organization_id', organizationId)
    .order('period_start', { ascending: false })
    .limit(2)

  const currentScore = scores?.[0]?.score || 0
  const previousScore = scores?.[1]?.score || currentScore
  const scoreTrend = currentScore - previousScore

  // Get prompts count
  const { count: promptCount } = await client
    .from('prompts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  return {
    scansThisWeek: scanCount || 0,
    currentVisibilityScore: currentScore,
    scoreTrend,
    totalPrompts: promptCount || 0
  }
}

async function getUserStats(client: any, organizationId: string) {
  // Get user count
  const { count: userCount } = await client
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  // Get recent logins (approximated by profile updates)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: activeUsers } = await client
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('updated_at', weekAgo)

  return {
    totalUsers: userCount || 0,
    activeThisWeek: activeUsers || 0
  }
}

async function getUsageStats(client: any, organizationId: string) {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  // Get this month's API calls (approximated by prompt results)
  const { count: apiCalls } = await client
    .from('prompt_results')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('tested_at', monthStart.toISOString())

  // Get website analyses
  const { count: analysisCount } = await client
    .from('website_analyses')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('analyzed_at', monthStart.toISOString())

  // Get competitor analyses
  const { count: competitorScans } = await client
    .from('competitor_results')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('tested_at', monthStart.toISOString())

  return {
    apiCallsThisMonth: apiCalls || 0,
    websiteAnalysesThisMonth: analysisCount || 0,
    competitorScansThisMonth: competitorScans || 0
  }
}

async function getDetailedJobStats(client: any, organizationId: string, days: number) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: jobs } = await client
    .from('jobs')
    .select('job_type, status, created_at, completed_at, error_message')
    .eq('organization_id', organizationId)
    .gte('created_at', startDate)
    .order('created_at', { ascending: false })

  // Group by type
  const byType: Record<string, { total: number; completed: number; failed: number; avgDuration: number[] }> = {}

  for (const job of jobs || []) {
    if (!byType[job.job_type]) {
      byType[job.job_type] = { total: 0, completed: 0, failed: 0, avgDuration: [] }
    }

    byType[job.job_type].total++
    if (job.status === 'completed') {
      byType[job.job_type].completed++
      if (job.completed_at) {
        const duration = new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()
        byType[job.job_type].avgDuration.push(duration)
      }
    }
    if (job.status === 'failed') byType[job.job_type].failed++
  }

  // Calculate averages
  const typeStats = Object.entries(byType).map(([type, stats]) => ({
    type,
    total: stats.total,
    completed: stats.completed,
    failed: stats.failed,
    successRate: stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0',
    avgDurationMs: stats.avgDuration.length > 0
      ? Math.round(stats.avgDuration.reduce((a, b) => a + b, 0) / stats.avgDuration.length)
      : null
  }))

  // Get daily breakdown
  const dailyStats: Record<string, { total: number; completed: number; failed: number }> = {}
  for (const job of jobs || []) {
    const day = job.created_at.split('T')[0]
    if (!dailyStats[day]) {
      dailyStats[day] = { total: 0, completed: 0, failed: 0 }
    }
    dailyStats[day].total++
    if (job.status === 'completed') dailyStats[day].completed++
    if (job.status === 'failed') dailyStats[day].failed++
  }

  // Get recent failures
  const recentFailures = (jobs || [])
    .filter(j => j.status === 'failed')
    .slice(0, 10)
    .map(j => ({
      type: j.job_type,
      error: j.error_message,
      failedAt: j.completed_at || j.created_at
    }))

  return {
    byType: typeStats,
    daily: Object.entries(dailyStats)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, stats]) => ({ date, ...stats })),
    recentFailures,
    totalJobs: jobs?.length || 0
  }
}

async function getSystemHealth(client: any, organizationId: string) {
  const checks: Array<{ name: string; status: 'healthy' | 'warning' | 'error'; message: string }> = []

  // Check for stuck jobs (processing for > 1 hour)
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: stuckJobs } = await client
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'processing')
    .lt('started_at', hourAgo)

  checks.push({
    name: 'Job Processing',
    status: (stuckJobs || 0) > 0 ? 'warning' : 'healthy',
    message: (stuckJobs || 0) > 0 ? `${stuckJobs} jobs stuck in processing` : 'All jobs processing normally'
  })

  // Check for high failure rate (> 20% in last 24h)
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recentJobs } = await client
    .from('jobs')
    .select('status')
    .eq('organization_id', organizationId)
    .gte('created_at', dayAgo)

  const totalRecent = recentJobs?.length || 0
  const failedRecent = recentJobs?.filter(j => j.status === 'failed').length || 0
  const failureRate = totalRecent > 0 ? (failedRecent / totalRecent) * 100 : 0

  checks.push({
    name: 'Job Success Rate',
    status: failureRate > 20 ? 'error' : failureRate > 10 ? 'warning' : 'healthy',
    message: `${(100 - failureRate).toFixed(1)}% success rate in last 24h`
  })

  // Check freshness alerts
  const { count: criticalAlerts } = await client
    .from('freshness_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('severity', 'critical')
    .eq('is_dismissed', false)
    .eq('is_read', false)

  checks.push({
    name: 'Content Freshness',
    status: (criticalAlerts || 0) > 0 ? 'warning' : 'healthy',
    message: (criticalAlerts || 0) > 0 ? `${criticalAlerts} critical freshness alerts` : 'Content freshness is good'
  })

  // Check visibility score trend
  const { data: scores } = await client
    .from('visibility_scores')
    .select('score')
    .eq('organization_id', organizationId)
    .order('period_start', { ascending: false })
    .limit(2)

  const currentScore = scores?.[0]?.score || 0
  const previousScore = scores?.[1]?.score || currentScore
  const scoreDiff = currentScore - previousScore

  checks.push({
    name: 'Visibility Score',
    status: scoreDiff < -10 ? 'warning' : currentScore < 30 ? 'warning' : 'healthy',
    message: `Score: ${currentScore} (${scoreDiff >= 0 ? '+' : ''}${scoreDiff} change)`
  })

  const overallStatus = checks.some(c => c.status === 'error') ? 'error'
    : checks.some(c => c.status === 'warning') ? 'warning'
      : 'healthy'

  return {
    status: overallStatus,
    checks,
    lastChecked: new Date().toISOString()
  }
}

async function getDetailedUsageStats(client: any, organizationId: string, days: number) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // Daily API usage
  const { data: results } = await client
    .from('prompt_results')
    .select('ai_model, tested_at')
    .eq('organization_id', organizationId)
    .gte('tested_at', startDate)

  const dailyUsage: Record<string, Record<string, number>> = {}
  for (const result of results || []) {
    const day = result.tested_at.split('T')[0]
    if (!dailyUsage[day]) dailyUsage[day] = {}
    dailyUsage[day][result.ai_model] = (dailyUsage[day][result.ai_model] || 0) + 1
  }

  // Model usage breakdown
  const modelUsage: Record<string, number> = {}
  for (const result of results || []) {
    modelUsage[result.ai_model] = (modelUsage[result.ai_model] || 0) + 1
  }

  return {
    totalApiCalls: results?.length || 0,
    byModel: Object.entries(modelUsage).map(([model, count]) => ({ model, count })),
    daily: Object.entries(dailyUsage)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, models]) => ({ date, ...models, total: Object.values(models).reduce((a, b) => a + b, 0) }))
  }
}

async function getRecentActivity(client: any, organizationId: string, limit: number) {
  // Get recent jobs
  const { data: jobs } = await client
    .from('jobs')
    .select('id, job_type, status, created_at, completed_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  // Get recent alerts
  const { data: alerts } = await client
    .from('freshness_alerts')
    .select('id, alert_type, severity, title, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Combine and sort by date
  const activity = [
    ...(jobs || []).map(j => ({
      type: 'job',
      action: j.status,
      description: `${j.job_type} job ${j.status}`,
      timestamp: j.completed_at || j.created_at,
      metadata: { jobType: j.job_type }
    })),
    ...(alerts || []).map(a => ({
      type: 'alert',
      action: a.alert_type,
      description: a.title,
      timestamp: a.created_at,
      metadata: { severity: a.severity }
    }))
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)

  return activity
}

async function getSystemAlerts(client: any, organizationId: string) {
  const alerts: Array<{ type: string; severity: string; message: string; action?: string }> = []

  // Check for failed jobs in last hour
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentFailures } = await client
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'failed')
    .gte('completed_at', hourAgo)

  if ((recentFailures || 0) > 0) {
    alerts.push({
      type: 'job_failures',
      severity: 'warning',
      message: `${recentFailures} job(s) failed in the last hour`,
      action: 'Review job logs for details'
    })
  }

  // Check for low visibility score
  const { data: latestScore } = await client
    .from('visibility_scores')
    .select('score')
    .eq('organization_id', organizationId)
    .order('period_start', { ascending: false })
    .limit(1)
    .single()

  if (latestScore && latestScore.score < 30) {
    alerts.push({
      type: 'low_visibility',
      severity: 'critical',
      message: `Visibility score is critically low at ${latestScore.score}`,
      action: 'Review recommendations and optimize content'
    })
  }

  // Check for stale prompts (no scans in last week)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: recentScans } = await client
    .from('prompt_results')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('tested_at', weekAgo)

  if ((recentScans || 0) === 0) {
    alerts.push({
      type: 'no_recent_scans',
      severity: 'info',
      message: 'No visibility scans in the last 7 days',
      action: 'Run a visibility scan to get updated metrics'
    })
  }

  // Check for unaddressed freshness alerts
  const { count: unreadAlerts } = await client
    .from('freshness_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_read', false)
    .eq('is_dismissed', false)

  if ((unreadAlerts || 0) > 5) {
    alerts.push({
      type: 'unread_alerts',
      severity: 'warning',
      message: `${unreadAlerts} unread freshness alerts`,
      action: 'Review and address freshness alerts'
    })
  }

  return alerts
}
