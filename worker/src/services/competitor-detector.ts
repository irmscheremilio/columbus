import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface DetectedCompetitor {
  name: string
  confidence: number // 0-100
  context: string // Snippet where mentioned
  domain?: string
  category?: string
}

export interface CompetitorDetectionResult {
  competitors: DetectedCompetitor[]
  brandMentioned: boolean
  brandContext?: string
}

/**
 * Auto-Competitor Detection Service
 * Analyzes AI responses to detect competitor mentions
 */
export class CompetitorDetector {
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
   * Detect competitors from an AI response
   */
  async detectCompetitors(
    responseText: string,
    brandName: string,
    existingCompetitors: string[] = []
  ): Promise<CompetitorDetectionResult> {
    // First, do a quick regex-based detection for common patterns
    const quickResults = this.quickDetect(responseText, brandName, existingCompetitors)

    // If we found competitors with regex, return those
    if (quickResults.competitors.length > 0 || !this.hasAI()) {
      return quickResults
    }

    // Use AI for deeper analysis
    return this.aiDetect(responseText, brandName, existingCompetitors)
  }

  /**
   * Quick regex-based competitor detection
   */
  private quickDetect(
    responseText: string,
    brandName: string,
    existingCompetitors: string[]
  ): CompetitorDetectionResult {
    const competitors: DetectedCompetitor[] = []

    // Check if brand is mentioned
    const brandRegex = new RegExp(`\\b${this.escapeRegex(brandName)}\\b`, 'gi')
    const brandMatches = responseText.match(brandRegex)
    const brandMentioned = !!brandMatches && brandMatches.length > 0

    // Common competitor indicators
    const competitorPatterns = [
      /(?:competitors?|alternatives?|similar (?:to|products?|services?|tools?)|(?:like|such as|including|versus|vs\.?|compared to))\s*[:.]?\s*([A-Z][A-Za-z0-9\s]+(?:,\s*[A-Z][A-Za-z0-9\s]+)*)/gi,
      /(?:options? include|popular (?:choices?|options?)|top (?:\d+\s+)?(?:options?|choices?|tools?|products?))\s*[:.]?\s*([A-Z][A-Za-z0-9\s]+(?:,\s*[A-Z][A-Za-z0-9\s]+)*)/gi,
      /(\d+)\.\s*\*?\*?([A-Z][A-Za-z0-9\s]+)\*?\*?\s*[-:]/gm // Numbered lists
    ]

    for (const pattern of competitorPatterns) {
      let match
      while ((match = pattern.exec(responseText)) !== null) {
        const names = this.extractNames(match[1] || match[2])
        for (const name of names) {
          // Skip if it's our brand or already known
          if (name.toLowerCase() === brandName.toLowerCase()) continue
          if (competitors.some(c => c.name.toLowerCase() === name.toLowerCase())) continue

          // Get surrounding context
          const startIdx = Math.max(0, match.index - 50)
          const endIdx = Math.min(responseText.length, match.index + match[0].length + 50)
          const context = responseText.substring(startIdx, endIdx).trim()

          competitors.push({
            name,
            confidence: 70, // Medium confidence for regex matches
            context,
            category: this.inferCategory(responseText)
          })
        }
      }
    }

    // Also check for existing competitors
    for (const existing of existingCompetitors) {
      const regex = new RegExp(`\\b${this.escapeRegex(existing)}\\b`, 'gi')
      const matches = responseText.match(regex)
      if (matches && !competitors.some(c => c.name.toLowerCase() === existing.toLowerCase())) {
        const idx = responseText.toLowerCase().indexOf(existing.toLowerCase())
        const startIdx = Math.max(0, idx - 50)
        const endIdx = Math.min(responseText.length, idx + existing.length + 50)

        competitors.push({
          name: existing,
          confidence: 90, // High confidence for known competitors
          context: responseText.substring(startIdx, endIdx).trim()
        })
      }
    }

    return {
      competitors,
      brandMentioned,
      brandContext: brandMentioned ? this.getBrandContext(responseText, brandName) : undefined
    }
  }

  /**
   * AI-powered competitor detection for deeper analysis
   */
  private async aiDetect(
    responseText: string,
    brandName: string,
    existingCompetitors: string[]
  ): Promise<CompetitorDetectionResult> {
    const prompt = `Analyze this AI response and identify any companies, products, or services that could be competitors to "${brandName}".

Response text:
${responseText.substring(0, 4000)}

Known competitors to look for: ${existingCompetitors.join(', ') || 'None specified'}

Extract:
1. Any company/product names mentioned that could be alternatives or competitors
2. Whether "${brandName}" was mentioned
3. If "${brandName}" was mentioned, the context/sentiment around it

Return JSON only:
{
  "competitors": [{"name": "string", "confidence": 0-100, "context": "brief quote", "domain": "if known", "category": "product category"}],
  "brandMentioned": true/false,
  "brandContext": "quote where brand is mentioned" or null
}

Only include actual company/product names, not generic terms. Set confidence based on how clearly it's a competitor (direct alternative = 90+, tangentially related = 50-70).`

    try {
      let response: string

      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1000
        })
        response = completion.choices[0]?.message?.content || '{}'
      } else if (this.anthropic) {
        const message = await this.anthropic.messages.create({
          model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
        const textBlock = message.content.find(block => block.type === 'text')
        response = textBlock?.type === 'text' ? textBlock.text : '{}'
      } else {
        throw new Error('No AI client available')
      }

      // Parse response
      const cleanResponse = response.replace(/```json\n?|```\n?/g, '').trim()
      const parsed = JSON.parse(cleanResponse)

      return {
        competitors: (parsed.competitors || []).map((c: any) => ({
          name: c.name,
          confidence: c.confidence || 70,
          context: c.context || '',
          domain: c.domain,
          category: c.category
        })),
        brandMentioned: parsed.brandMentioned || false,
        brandContext: parsed.brandContext
      }
    } catch (error) {
      console.error('[Competitor Detector] AI detection error:', error)
      // Fall back to quick detect
      return this.quickDetect(responseText, brandName, existingCompetitors)
    }
  }

  /**
   * Save detected competitors to database
   */
  async saveDetectedCompetitors(
    organizationId: string,
    brandName: string,
    detectedCompetitors: DetectedCompetitor[]
  ): Promise<{ added: number; updated: number }> {
    let added = 0
    let updated = 0

    for (const competitor of detectedCompetitors) {
      // Skip low confidence detections
      if (competitor.confidence < 50) continue

      // Check if competitor already exists
      const { data: existing } = await this.supabase
        .from('competitors')
        .select('id, detection_count')
        .eq('organization_id', organizationId)
        .ilike('name', competitor.name)
        .single()

      if (existing) {
        // Update detection count
        await this.supabase
          .from('competitors')
          .update({
            detection_count: (existing.detection_count || 0) + 1,
            last_detected_at: new Date().toISOString()
          })
          .eq('id', existing.id)
        updated++
      } else {
        // Insert new competitor as pending (needs manual confirmation for high confidence)
        const { error } = await this.supabase
          .from('competitors')
          .insert({
            organization_id: organizationId,
            name: competitor.name,
            domain: competitor.domain,
            is_auto_detected: true,
            detection_confidence: competitor.confidence,
            detection_context: competitor.context,
            detection_count: 1,
            status: competitor.confidence >= 80 ? 'pending_review' : 'suggested',
            last_detected_at: new Date().toISOString()
          })

        if (!error) added++
      }
    }

    return { added, updated }
  }

  /**
   * Get competitors pending review
   */
  async getPendingCompetitors(organizationId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('competitors')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_auto_detected', true)
      .in('status', ['pending_review', 'suggested'])
      .order('detection_count', { ascending: false })

    return data || []
  }

  /**
   * Approve or reject auto-detected competitor
   */
  async reviewCompetitor(
    competitorId: string,
    approved: boolean
  ): Promise<void> {
    if (approved) {
      await this.supabase
        .from('competitors')
        .update({
          status: 'active',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', competitorId)
    } else {
      // Mark as rejected
      await this.supabase
        .from('competitors')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', competitorId)
    }
  }

  // Helper methods
  private hasAI(): boolean {
    return !!this.openai || !!this.anthropic
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private extractNames(text: string): string[] {
    if (!text) return []

    // Split by common delimiters
    const parts = text.split(/[,;]|(?:\s+and\s+)|(?:\s+or\s+)/gi)

    return parts
      .map(p => p.trim())
      .filter(p => {
        // Filter out common non-company words
        const lower = p.toLowerCase()
        const skipWords = ['the', 'a', 'an', 'and', 'or', 'but', 'with', 'for', 'of', 'to', 'in', 'on', 'at', 'by', 'from', 'many', 'some', 'several', 'various', 'other', 'more', 'others']
        return p.length > 2 && !skipWords.includes(lower) && /^[A-Z]/.test(p)
      })
      .slice(0, 10) // Limit to prevent spam
  }

  private getBrandContext(text: string, brandName: string): string {
    const regex = new RegExp(`(.{0,100}\\b${this.escapeRegex(brandName)}\\b.{0,100})`, 'gi')
    const match = regex.exec(text)
    return match ? match[1].trim() : ''
  }

  private inferCategory(text: string): string {
    const categories: Record<string, string[]> = {
      'SaaS': ['software', 'platform', 'tool', 'app', 'application', 'service', 'solution'],
      'E-commerce': ['shop', 'store', 'buy', 'purchase', 'marketplace', 'retail'],
      'Marketing': ['marketing', 'advertising', 'seo', 'content', 'campaign'],
      'Analytics': ['analytics', 'data', 'insights', 'metrics', 'tracking'],
      'AI/ML': ['ai', 'machine learning', 'artificial intelligence', 'automation'],
      'Developer Tools': ['developer', 'api', 'code', 'programming', 'framework']
    }

    const lower = text.toLowerCase()
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => lower.includes(kw))) {
        return category
      }
    }
    return 'General'
  }
}

export const competitorDetector = new CompetitorDetector()
