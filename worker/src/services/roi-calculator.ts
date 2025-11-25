import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface ROIMetrics {
  period: {
    start: Date
    end: Date
  }
  traffic: {
    totalSessions: number
    totalUsers: number
    totalPageviews: number
    avgSessionDuration: number
    avgBounceRate: number
  }
  conversions: {
    total: number
    value: number
    rate: number
  }
  roi: {
    estimatedTrafficValue: number
    platformCost: number
    netROI: number
    roiPercentage: number
  }
  bySource: {
    source: string
    sessions: number
    conversions: number
    value: number
    conversionRate: number
  }[]
  trend: {
    sessionsChange: number
    conversionsChange: number
    roiChange: number
  }
}

export interface TrafficDataPoint {
  date: string
  source: string
  sessions: number
  users: number
  pageviews: number
  avgSessionDuration: number
  bounceRate: number
  conversions: number
  conversionValue: number
}

/**
 * ROI Calculator Service
 * Calculates ROI from AI visibility based on traffic and conversion data
 */
export class ROICalculator {
  private supabase: SupabaseClient

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient(
      supabaseUrl || process.env.SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
    )
  }

  /**
   * Calculate ROI for a given organization and time period
   */
  async calculateROI(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ROIMetrics> {
    // Get traffic metrics for the period
    const { data: trafficData, error: trafficError } = await this.supabase
      .from('ai_traffic_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])

    if (trafficError) {
      console.error('[ROI Calculator] Error fetching traffic data:', trafficError)
      throw trafficError
    }

    // Get conversion events for the period
    const { data: conversionData, error: conversionError } = await this.supabase
      .from('ai_conversion_events')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('occurred_at', startDate.toISOString())
      .lte('occurred_at', endDate.toISOString())

    if (conversionError) {
      console.error('[ROI Calculator] Error fetching conversion data:', conversionError)
      throw conversionError
    }

    // Get analytics integration settings for cost and value assumptions
    const { data: settings } = await this.supabase
      .from('analytics_integrations')
      .select('average_conversion_value, currency')
      .eq('organization_id', organizationId)
      .single()

    // Get organization subscription for platform cost
    const { data: subscription } = await this.supabase
      .from('subscriptions')
      .select('price_amount')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single()

    // Calculate aggregate metrics
    const metrics = this.aggregateMetrics(
      trafficData || [],
      conversionData || [],
      settings?.average_conversion_value || 0,
      subscription?.price_amount || 0,
      startDate,
      endDate
    )

    // Get previous period for trend comparison
    const periodLength = endDate.getTime() - startDate.getTime()
    const previousStart = new Date(startDate.getTime() - periodLength)
    const previousEnd = new Date(startDate.getTime() - 1)

    const { data: previousTraffic } = await this.supabase
      .from('ai_traffic_metrics')
      .select('sessions, conversions')
      .eq('organization_id', organizationId)
      .gte('date', previousStart.toISOString().split('T')[0])
      .lte('date', previousEnd.toISOString().split('T')[0])

    // Calculate trends
    const previousSessions = previousTraffic?.reduce((sum, d) => sum + d.sessions, 0) || 0
    const previousConversions = previousTraffic?.reduce((sum, d) => sum + d.conversions, 0) || 0

    metrics.trend = {
      sessionsChange: previousSessions > 0
        ? ((metrics.traffic.totalSessions - previousSessions) / previousSessions) * 100
        : 0,
      conversionsChange: previousConversions > 0
        ? ((metrics.conversions.total - previousConversions) / previousConversions) * 100
        : 0,
      roiChange: 0 // Would need previous ROI calculation
    }

    // Cache the calculation
    await this.cacheROICalculation(organizationId, metrics)

    return metrics
  }

  /**
   * Aggregate metrics from raw data
   */
  private aggregateMetrics(
    trafficData: any[],
    conversionData: any[],
    avgConversionValue: number,
    platformCost: number,
    startDate: Date,
    endDate: Date
  ): ROIMetrics {
    // Aggregate traffic by source
    const bySource = new Map<string, {
      sessions: number
      users: number
      pageviews: number
      durations: number[]
      bounceRates: number[]
      conversions: number
      value: number
    }>()

    for (const data of trafficData) {
      const existing = bySource.get(data.source) || {
        sessions: 0,
        users: 0,
        pageviews: 0,
        durations: [],
        bounceRates: [],
        conversions: 0,
        value: 0
      }

      existing.sessions += data.sessions
      existing.users += data.users
      existing.pageviews += data.pageviews
      existing.durations.push(data.avg_session_duration)
      existing.bounceRates.push(data.bounce_rate)
      existing.conversions += data.conversions
      existing.value += parseFloat(data.conversion_value) || 0

      bySource.set(data.source, existing)
    }

    // Add conversion events
    for (const conversion of conversionData) {
      const existing = bySource.get(conversion.source)
      if (existing) {
        existing.conversions += 1
        existing.value += parseFloat(conversion.value) || avgConversionValue
      }
    }

    // Calculate totals
    let totalSessions = 0
    let totalUsers = 0
    let totalPageviews = 0
    let totalConversions = 0
    let totalValue = 0
    const allDurations: number[] = []
    const allBounceRates: number[] = []

    for (const data of bySource.values()) {
      totalSessions += data.sessions
      totalUsers += data.users
      totalPageviews += data.pageviews
      totalConversions += data.conversions
      totalValue += data.value
      allDurations.push(...data.durations)
      allBounceRates.push(...data.bounceRates)
    }

    // Calculate averages
    const avgSessionDuration = allDurations.length > 0
      ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length
      : 0

    const avgBounceRate = allBounceRates.length > 0
      ? allBounceRates.reduce((a, b) => a + b, 0) / allBounceRates.length
      : 0

    const conversionRate = totalSessions > 0
      ? (totalConversions / totalSessions) * 100
      : 0

    // Estimate traffic value (based on average CPC for similar keywords - $2-5 per click)
    const estimatedCPC = 3.00 // Average cost per click for business keywords
    const estimatedTrafficValue = totalSessions * estimatedCPC

    // Calculate ROI
    const netROI = totalValue + estimatedTrafficValue - platformCost
    const roiPercentage = platformCost > 0
      ? ((netROI / platformCost) * 100)
      : (netROI > 0 ? 100 : 0)

    // Format by source data
    const bySourceFormatted = Array.from(bySource.entries()).map(([source, data]) => ({
      source,
      sessions: data.sessions,
      conversions: data.conversions,
      value: data.value,
      conversionRate: data.sessions > 0 ? (data.conversions / data.sessions) * 100 : 0
    }))

    return {
      period: {
        start: startDate,
        end: endDate
      },
      traffic: {
        totalSessions,
        totalUsers,
        totalPageviews,
        avgSessionDuration,
        avgBounceRate
      },
      conversions: {
        total: totalConversions,
        value: totalValue,
        rate: conversionRate
      },
      roi: {
        estimatedTrafficValue,
        platformCost,
        netROI,
        roiPercentage
      },
      bySource: bySourceFormatted,
      trend: {
        sessionsChange: 0,
        conversionsChange: 0,
        roiChange: 0
      }
    }
  }

  /**
   * Cache ROI calculation in database
   */
  private async cacheROICalculation(
    organizationId: string,
    metrics: ROIMetrics
  ): Promise<void> {
    await this.supabase
      .from('roi_calculations')
      .upsert({
        organization_id: organizationId,
        period_start: metrics.period.start.toISOString().split('T')[0],
        period_end: metrics.period.end.toISOString().split('T')[0],
        total_ai_sessions: metrics.traffic.totalSessions,
        total_ai_users: metrics.traffic.totalUsers,
        total_ai_pageviews: metrics.traffic.totalPageviews,
        total_conversions: metrics.conversions.total,
        total_conversion_value: metrics.conversions.value,
        conversion_rate: metrics.conversions.rate / 100, // Store as decimal
        estimated_traffic_value: metrics.roi.estimatedTrafficValue,
        platform_cost: metrics.roi.platformCost,
        net_roi: metrics.roi.netROI,
        roi_percentage: metrics.roi.roiPercentage,
        breakdown_by_source: metrics.bySource,
        calculated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,period_start,period_end'
      })
  }

  /**
   * Record manual traffic data (for orgs without GA4)
   */
  async recordManualTraffic(
    organizationId: string,
    data: TrafficDataPoint
  ): Promise<void> {
    await this.supabase
      .from('ai_traffic_metrics')
      .upsert({
        organization_id: organizationId,
        date: data.date,
        source: data.source,
        sessions: data.sessions,
        users: data.users,
        pageviews: data.pageviews,
        avg_session_duration: data.avgSessionDuration,
        bounce_rate: data.bounceRate,
        conversions: data.conversions,
        conversion_value: data.conversionValue
      }, {
        onConflict: 'organization_id,date,source'
      })
  }

  /**
   * Record a conversion event
   */
  async recordConversion(
    organizationId: string,
    eventName: string,
    source: string,
    value: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.supabase
      .from('ai_conversion_events')
      .insert({
        organization_id: organizationId,
        event_name: eventName,
        source,
        value,
        metadata: metadata || {}
      })
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(organizationId: string): Promise<{
    currentPeriod: ROIMetrics | null
    recentConversions: any[]
    topSources: any[]
  }> {
    // Get last 30 days
    const endDate = new Date()
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    let currentPeriod: ROIMetrics | null = null

    try {
      currentPeriod = await this.calculateROI(organizationId, startDate, endDate)
    } catch (error) {
      console.error('[ROI Calculator] Error calculating current period:', error)
    }

    // Get recent conversions
    const { data: recentConversions } = await this.supabase
      .from('ai_conversion_events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('occurred_at', { ascending: false })
      .limit(10)

    // Get top sources by sessions
    const topSources = currentPeriod?.bySource
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5) || []

    return {
      currentPeriod,
      recentConversions: recentConversions || [],
      topSources
    }
  }
}

export const roiCalculator = new ROICalculator()
