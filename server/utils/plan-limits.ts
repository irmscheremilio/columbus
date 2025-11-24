import { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { PLANS, type PlanId } from './stripe'

export interface PlanLimits {
  promptsPerMonth: number
  competitors: number
  scansPerMonth: number
  websiteAnalyses: number
}

export interface UsageStats {
  promptsThisMonth: number
  competitors: number
  scansThisMonth: number
  websiteAnalysesThisMonth: number
}

/**
 * Get the current plan for an organization
 */
export async function getOrganizationPlan(event: H3Event, organizationId: string): Promise<PlanId> {
  const client = await serverSupabaseClient(event)

  const { data: subscription } = await client
    .from('subscriptions')
    .select('plan_type, status')
    .eq('organization_id', organizationId)
    .single()

  // If no subscription or inactive, default to FREE
  if (!subscription || subscription.status !== 'active') {
    return 'FREE'
  }

  return subscription.plan_type.toUpperCase() as PlanId
}

/**
 * Get plan limits for an organization
 */
export async function getPlanLimits(event: H3Event, organizationId: string): Promise<PlanLimits> {
  const planId = await getOrganizationPlan(event, organizationId)
  return PLANS[planId].limits
}

/**
 * Get current usage stats for an organization
 */
export async function getUsageStats(event: H3Event, organizationId: string): Promise<UsageStats> {
  const client = await serverSupabaseClient(event)

  // Get start of current month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Count prompts created this month
  const { count: promptsCount } = await client
    .from('prompts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', monthStart.toISOString())

  // Count competitors
  const { count: competitorsCount } = await client
    .from('competitors')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true)

  // Count scans this month
  const { count: scansCount } = await client
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('job_type', 'visibility_scan')
    .gte('created_at', monthStart.toISOString())

  // Count website analyses this month
  const { count: analysesCount } = await client
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('job_type', 'website_analysis')
    .gte('created_at', monthStart.toISOString())

  return {
    promptsThisMonth: promptsCount || 0,
    competitors: competitorsCount || 0,
    scansThisMonth: scansCount || 0,
    websiteAnalysesThisMonth: analysesCount || 0
  }
}

/**
 * Check if an action is allowed under the current plan
 */
export async function checkLimit(
  event: H3Event,
  organizationId: string,
  limitType: keyof PlanLimits
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = await getPlanLimits(event, organizationId)
  const usage = await getUsageStats(event, organizationId)

  const limitValue = limits[limitType]
  let currentValue: number

  switch (limitType) {
    case 'promptsPerMonth':
      currentValue = usage.promptsThisMonth
      break
    case 'competitors':
      currentValue = usage.competitors
      break
    case 'scansPerMonth':
      currentValue = usage.scansThisMonth
      break
    case 'websiteAnalyses':
      currentValue = usage.websiteAnalysesThisMonth
      break
    default:
      currentValue = 0
  }

  // -1 means unlimited
  const allowed = limitValue === -1 || currentValue < limitValue

  return {
    allowed,
    current: currentValue,
    limit: limitValue
  }
}

/**
 * Enforce a limit - throws error if exceeded
 */
export async function enforceLimit(
  event: H3Event,
  organizationId: string,
  limitType: keyof PlanLimits,
  action: string
) {
  const check = await checkLimit(event, organizationId, limitType)

  if (!check.allowed) {
    const limitText = check.limit === -1 ? 'unlimited' : check.limit.toString()
    throw createError({
      statusCode: 403,
      message: `Plan limit exceeded: ${action}. Current: ${check.current}/${limitText}. Please upgrade your plan.`
    })
  }
}
