import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type SuggestionType =
  | 'negative_comparison'
  | 'missing_feature'
  | 'competitor_advantage'
  | 'pricing_concern'
  | 'outdated_info'
  | 'missing_mention'
  | 'low_position'
  | 'no_citation'

export type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface ImprovementSuggestion {
  type: SuggestionType
  severity: Severity
  title: string
  description: string
  context?: string
  recommendedAction?: string
  competitorName?: string
}

export interface AnalysisResult {
  suggestions: ImprovementSuggestion[]
  overallAssessment: string
}

/**
 * AI Improvement Analyzer Service
 * Analyzes AI responses to identify improvement opportunities
 */
export class ImprovementAnalyzer {
  private openai: OpenAI | null = null
  private anthropic: Anthropic | null = null
  private supabase: SupabaseClient

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
    )
  }

  /**
   * Analyze an AI response for improvement opportunities
   */
  async analyzeResponse(
    responseText: string,
    brandName: string,
    brandMentioned: boolean,
    position: number | null,
    citationPresent: boolean,
    competitors: string[]
  ): Promise<AnalysisResult> {
    const suggestions: ImprovementSuggestion[] = []

    // Quick rule-based checks first
    // Do not do rule based checks, they are not helpful
    // this.addQuickChecks(
    //   suggestions,
    //   responseText,
    //   brandName,
    //   brandMentioned,
    //   position,
    //   citationPresent,
    //   competitors
    // )

    // AI-powered deep analysis if available
    if (this.hasAI() && brandMentioned) {
      try {
        const aiSuggestions = await this.aiAnalyze(responseText, brandName, competitors)
        suggestions.push(...aiSuggestions)
      } catch (error) {
        console.error('[Improvement Analyzer] AI analysis error:', error)
      }
    }

    // Deduplicate by type
    const uniqueSuggestions = this.deduplicateSuggestions(suggestions)

    return {
      suggestions: uniqueSuggestions,
      overallAssessment: this.generateAssessment(uniqueSuggestions, brandMentioned)
    }
  }

  /**
   * Quick rule-based checks for common issues
   */
  private addQuickChecks(
    suggestions: ImprovementSuggestion[],
    responseText: string,
    brandName: string,
    brandMentioned: boolean,
    position: number | null,
    citationPresent: boolean,
    competitors: string[]
  ): void {
    const lowerResponse = responseText.toLowerCase()
    const lowerBrand = brandName.toLowerCase()

    // Missing mention - critical issue
    if (!brandMentioned) {
      suggestions.push({
        type: 'missing_mention',
        severity: 'critical',
        title: 'Brand not mentioned in response',
        description: `${brandName} was not mentioned at all in this AI response. This is a significant visibility gap.`,
        recommendedAction: 'Improve your online presence, create more content, and ensure your brand appears in relevant discussions.'
      })
      return // Skip other checks if not mentioned
    }

    // Low position - high severity if mentioned late
    if (position !== null && position > 3) {
      suggestions.push({
        type: 'low_position',
        severity: position > 5 ? 'high' : 'medium',
        title: `Brand mentioned in position ${position}`,
        description: `${brandName} appears at position ${position} in the response, after ${position - 1} other brands/options.`,
        recommendedAction: 'Build more authority and visibility so AI models recommend your brand earlier.'
      })
    }

    // No citation
    if (!citationPresent) {
      suggestions.push({
        type: 'no_citation',
        severity: 'medium',
        title: 'No source citation for your brand',
        description: `The AI mentioned ${brandName} but did not cite your website or any authoritative source.`,
        recommendedAction: 'Increase your domain authority and create more linkable content.'
      })
    }

    // Negative comparison patterns
    const negativePatterns = [
      { pattern: new RegExp(`${this.escapeRegex(brandName)}\\s+is\\s+(?:more\\s+)?expensive`, 'gi'), type: 'pricing_concern' as SuggestionType },
      { pattern: new RegExp(`${this.escapeRegex(brandName)}\\s+(?:lacks?|doesn't have|missing|without)`, 'gi'), type: 'missing_feature' as SuggestionType },
      { pattern: new RegExp(`cheaper\\s+(?:alternative|option)s?\\s+(?:to|than)\\s+${this.escapeRegex(brandName)}`, 'gi'), type: 'pricing_concern' as SuggestionType },
      { pattern: new RegExp(`(?:unlike|compared to|vs\\.?)\\s+${this.escapeRegex(brandName)}.*(?:better|faster|easier|cheaper)`, 'gi'), type: 'competitor_advantage' as SuggestionType },
      { pattern: new RegExp(`${this.escapeRegex(brandName)}.*(?:outdated|old|legacy|deprecated)`, 'gi'), type: 'outdated_info' as SuggestionType }
    ]

    for (const { pattern, type } of negativePatterns) {
      const match = pattern.exec(responseText)
      if (match) {
        const context = this.getContextAround(responseText, match.index, 150)
        suggestions.push({
          type,
          severity: this.getSeverityForType(type),
          title: this.getTitleForType(type),
          description: this.getDescriptionForType(type, brandName),
          context,
          recommendedAction: this.getActionForType(type)
        })
      }
    }

    // Competitor advantages - when competitors get positive mentions
    for (const competitor of competitors) {
      const competitorLower = competitor.toLowerCase()
      if (!lowerResponse.includes(competitorLower)) continue

      // Check if competitor is mentioned more positively
      const competitorAdvantagePatterns = [
        new RegExp(`${this.escapeRegex(competitor)}\\s+(?:is|offers?)\\s+(?:better|best|top|leading|recommended)`, 'gi'),
        new RegExp(`recommend(?:ed)?\\s+${this.escapeRegex(competitor)}`, 'gi'),
        new RegExp(`${this.escapeRegex(competitor)}\\s+(?:stands out|excels|outperforms)`, 'gi')
      ]

      for (const pattern of competitorAdvantagePatterns) {
        const match = pattern.exec(responseText)
        if (match) {
          suggestions.push({
            type: 'competitor_advantage',
            severity: 'high',
            title: `Competitor ${competitor} highlighted positively`,
            description: `The AI response highlights ${competitor} as a preferred or better option.`,
            context: this.getContextAround(responseText, match.index, 150),
            recommendedAction: `Analyze what makes ${competitor} appealing and address those differentiators in your content.`,
            competitorName: competitor
          })
          break
        }
      }
    }
  }

  /**
   * AI-powered deep analysis for nuanced issues
   */
  private async aiAnalyze(
    responseText: string,
    brandName: string,
    competitors: string[]
  ): Promise<ImprovementSuggestion[]> {
    const prompt = `Analyze this AI response about "${brandName}" and identify any issues or opportunities for improvement.

Response:
${responseText.substring(0, 3000)}

Known competitors: ${competitors.join(', ') || 'None'}

Look for:
1. Negative comparisons or positioning of ${brandName}
2. Missing features or capabilities mentioned
3. Pricing/cost concerns raised
4. Outdated or incorrect information about ${brandName}
5. Competitors being positioned more favorably
6. Opportunities to improve brand perception

Return JSON array only (max 5 suggestions):
[{
  "type": "negative_comparison|missing_feature|competitor_advantage|pricing_concern|outdated_info",
  "severity": "low|medium|high|critical",
  "title": "Short issue title",
  "description": "Detailed explanation",
  "context": "Relevant quote from response",
  "recommendedAction": "What should be done",
  "competitorName": "if competitor-related"
}]

Only return actionable insights. Empty array [] if no issues found.`

    try {
      let response: string

      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1500
        })
        response = completion.choices[0]?.message?.content || '[]'
      } else if (this.anthropic) {
        const message = await this.anthropic.messages.create({
          model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }]
        })
        const textBlock = message.content.find(block => block.type === 'text')
        response = textBlock?.type === 'text' ? textBlock.text : '[]'
      } else {
        return []
      }

      // Parse response
      const cleanResponse = response.replace(/```json\n?|```\n?/g, '').trim()
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return []

      const parsed = JSON.parse(jsonMatch[0])
      return (parsed || []).map((s: any) => ({
        type: s.type || 'negative_comparison',
        severity: s.severity || 'medium',
        title: s.title || 'Issue detected',
        description: s.description || '',
        context: s.context,
        recommendedAction: s.recommendedAction,
        competitorName: s.competitorName
      }))
    } catch (error) {
      console.error('[Improvement Analyzer] AI parse error:', error)
      return []
    }
  }

  /**
   * Save suggestions to database
   */
  async saveSuggestions(
    organizationId: string,
    productId: string,
    promptResultId: string,
    aiModel: string,
    suggestions: ImprovementSuggestion[],
    competitorMap: Map<string, string> // name -> competitor_id
  ): Promise<void> {
    if (suggestions.length === 0) return

    const records = suggestions.map(s => ({
      organization_id: organizationId,
      product_id: productId,
      prompt_result_id: promptResultId,
      ai_model: aiModel,
      suggestion_type: s.type,
      severity: s.severity,
      title: s.title,
      description: s.description,
      context: s.context,
      recommended_action: s.recommendedAction,
      competitor_id: s.competitorName ? competitorMap.get(s.competitorName.toLowerCase()) : null,
      is_resolved: false
    }))

    const { error } = await this.supabase
      .from('improvement_suggestions')
      .insert(records)

    if (error) {
      console.error('[Improvement Analyzer] Error saving suggestions:', error)
    }
  }

  // Helper methods
  private hasAI(): boolean {
    return !!this.openai || !!this.anthropic
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private getContextAround(text: string, index: number, chars: number): string {
    const start = Math.max(0, index - chars / 2)
    const end = Math.min(text.length, index + chars / 2)
    return text.substring(start, end).trim()
  }

  private deduplicateSuggestions(suggestions: ImprovementSuggestion[]): ImprovementSuggestion[] {
    const seen = new Map<string, ImprovementSuggestion>()

    for (const s of suggestions) {
      const key = `${s.type}-${s.competitorName || 'none'}`
      const existing = seen.get(key)

      // Keep the one with higher severity
      if (!existing || this.severityRank(s.severity) > this.severityRank(existing.severity)) {
        seen.set(key, s)
      }
    }

    return Array.from(seen.values())
  }

  private severityRank(severity: Severity): number {
    const ranks: Record<Severity, number> = { low: 1, medium: 2, high: 3, critical: 4 }
    return ranks[severity]
  }

  private getSeverityForType(type: SuggestionType): Severity {
    const severities: Record<SuggestionType, Severity> = {
      negative_comparison: 'high',
      missing_feature: 'medium',
      competitor_advantage: 'high',
      pricing_concern: 'medium',
      outdated_info: 'high',
      missing_mention: 'critical',
      low_position: 'medium',
      no_citation: 'low'
    }
    return severities[type]
  }

  private getTitleForType(type: SuggestionType): string {
    const titles: Record<SuggestionType, string> = {
      negative_comparison: 'Negative brand comparison detected',
      missing_feature: 'Missing feature mentioned',
      competitor_advantage: 'Competitor advantage highlighted',
      pricing_concern: 'Pricing concern raised',
      outdated_info: 'Potentially outdated information',
      missing_mention: 'Brand not mentioned',
      low_position: 'Low visibility position',
      no_citation: 'No source citation'
    }
    return titles[type]
  }

  private getDescriptionForType(type: SuggestionType, brandName: string): string {
    const descriptions: Record<SuggestionType, string> = {
      negative_comparison: `The AI response includes a negative comparison involving ${brandName}.`,
      missing_feature: `The AI indicates ${brandName} is missing a feature or capability.`,
      competitor_advantage: `A competitor is positioned as having an advantage over ${brandName}.`,
      pricing_concern: `The AI mentions pricing or cost as a concern for ${brandName}.`,
      outdated_info: `The AI may have outdated or incorrect information about ${brandName}.`,
      missing_mention: `${brandName} was not mentioned in this context.`,
      low_position: `${brandName} appears late in the list of recommendations.`,
      no_citation: `No authoritative source was cited when mentioning ${brandName}.`
    }
    return descriptions[type]
  }

  private getActionForType(type: SuggestionType): string {
    const actions: Record<SuggestionType, string> = {
      negative_comparison: 'Create content addressing this comparison point directly.',
      missing_feature: 'If this feature exists, create documentation. If not, consider adding it.',
      competitor_advantage: 'Analyze competitor strengths and create differentiating content.',
      pricing_concern: 'Create content explaining your value proposition and ROI.',
      outdated_info: 'Update your website and online presence with current information.',
      missing_mention: 'Improve SEO, create more relevant content, and build online authority.',
      low_position: 'Increase brand authority through PR, content marketing, and backlinks.',
      no_citation: 'Improve domain authority and create more authoritative, linkable content.'
    }
    return actions[type]
  }

  private generateAssessment(suggestions: ImprovementSuggestion[], brandMentioned: boolean): string {
    if (!brandMentioned) {
      return 'Critical: Your brand is not being mentioned in AI responses. Focus on building online visibility.'
    }

    const criticalCount = suggestions.filter(s => s.severity === 'critical').length
    const highCount = suggestions.filter(s => s.severity === 'high').length

    if (criticalCount > 0) {
      return `Critical issues detected. Immediate action recommended for ${criticalCount} issue(s).`
    }

    if (highCount > 0) {
      return `${highCount} high-priority improvement(s) identified. Review recommended actions.`
    }

    if (suggestions.length > 0) {
      return `${suggestions.length} improvement opportunity(ies) found. Consider addressing to improve AI visibility.`
    }

    return 'Good visibility. No major issues detected in this response.'
  }
}

export const improvementAnalyzer = new ImprovementAnalyzer()
