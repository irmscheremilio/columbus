// Plan definitions and limits
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    limits: {
      promptsPerMonth: 5,
      competitors: 1,
      scansPerMonth: 2,
      websiteAnalyses: 1
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    limits: {
      promptsPerMonth: -1, // unlimited
      competitors: 10,
      scansPerMonth: -1, // unlimited
      websiteAnalyses: -1 // unlimited
    }
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    price: 149,
    limits: {
      promptsPerMonth: -1,
      competitors: 50,
      scansPerMonth: -1,
      websiteAnalyses: -1
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    limits: {
      promptsPerMonth: -1,
      competitors: -1,
      scansPerMonth: -1,
      websiteAnalyses: -1
    }
  }
} as const

export type PlanId = keyof typeof PLANS
export type LimitType = 'promptsPerMonth' | 'competitors' | 'scansPerMonth' | 'websiteAnalyses'

export function getPlanLimits(planId: string) {
  const plan = PLANS[planId as PlanId] || PLANS.free
  return plan.limits
}

export interface UsageCheckResult {
  allowed: boolean
  current: number
  limit: number
  message?: string
}

/**
 * Check if an organization can perform an action based on their plan limits
 */
export async function checkUsageLimit(
  supabase: any,
  organizationId: string,
  limitType: LimitType
): Promise<UsageCheckResult> {
  // Get organization's plan
  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', organizationId)
    .single()

  const planId = org?.plan || 'free'
  const limits = getPlanLimits(planId)
  const limit = limits[limitType]

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 }
  }

  // Get current usage
  const monthYear = new Date().toISOString().slice(0, 7) // '2025-01'

  const { data: usage } = await supabase
    .from('monthly_usage')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('month_year', monthYear)
    .single()

  let current = 0
  if (usage) {
    switch (limitType) {
      case 'promptsPerMonth':
        current = usage.prompts_used || 0
        break
      case 'scansPerMonth':
        current = usage.scans_used || 0
        break
      case 'websiteAnalyses':
        current = usage.website_analyses_used || 0
        break
      case 'competitors':
        // For competitors, count actual competitors
        const { count } = await supabase
          .from('competitors')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
        current = count || 0
        break
    }
  }

  if (current >= limit) {
    const limitNames: Record<LimitType, string> = {
      promptsPerMonth: 'prompts this month',
      scansPerMonth: 'scans this month',
      websiteAnalyses: 'website analyses this month',
      competitors: 'competitors'
    }

    return {
      allowed: false,
      current,
      limit,
      message: `You've reached your limit of ${limit} ${limitNames[limitType]}. Please upgrade your plan for more.`
    }
  }

  return { allowed: true, current, limit }
}

/**
 * Increment usage counter after an action is performed
 */
export async function incrementUsage(
  supabase: any,
  organizationId: string,
  usageType: 'prompts' | 'scans' | 'website_analyses'
): Promise<void> {
  const monthYear = new Date().toISOString().slice(0, 7)

  // Upsert usage record
  const { data: existing } = await supabase
    .from('monthly_usage')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('month_year', monthYear)
    .single()

  if (existing) {
    // Update existing
    const columnName = usageType === 'prompts' ? 'prompts_used'
      : usageType === 'scans' ? 'scans_used'
      : 'website_analyses_used'

    await supabase.rpc('increment_usage', {
      p_organization_id: organizationId,
      p_usage_type: usageType
    })
  } else {
    // Insert new with initial count
    const insertData: any = {
      organization_id: organizationId,
      month_year: monthYear
    }

    if (usageType === 'prompts') insertData.prompts_used = 1
    else if (usageType === 'scans') insertData.scans_used = 1
    else insertData.website_analyses_used = 1

    await supabase
      .from('monthly_usage')
      .insert(insertData)
  }
}
