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
   * Detect competitors from an AI response using AI analysis
   */
  async detectCompetitors(
    responseText: string,
    brandName: string,
    existingCompetitors: string[] = []
  ): Promise<CompetitorDetectionResult> {
    // Always use AI for competitor detection - more accurate than regex
    if (!this.hasAI()) {
      console.warn('[Competitor Detector] No AI client available, skipping detection')
      return {
        competitors: [],
        brandMentioned: responseText.toLowerCase().includes(brandName.toLowerCase()),
        brandContext: undefined
      }
    }

    return this.aiDetect(responseText, brandName, existingCompetitors)
  }

  /**
   * Quick regex-based competitor detection
   * Only detects competitors from explicit competitor/alternative contexts
   * Relies more on AI detection for nuanced competitor identification
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

    // Only match explicit competitor/alternative patterns
    // Removed overly broad patterns like "like", "such as", "including"
    // These patterns must have explicit competitor-related keywords
    const competitorPatterns = [
      // Explicit competitor mentions
      /(?:main |major |key |top |direct |primary )?competitors?\s+(?:include|are|:)\s*([A-Z][A-Za-z0-9]+(?:(?:\s*,\s*|\s+and\s+)[A-Z][A-Za-z0-9]+)*)/gi,
      // Explicit alternative mentions
      /(?:popular |best |top )?alternatives?\s+(?:to\s+\S+\s+)?(?:include|are|:)\s*([A-Z][A-Za-z0-9]+(?:(?:\s*,\s*|\s+and\s+)[A-Z][A-Za-z0-9]+)*)/gi,
      // "versus" or "vs" comparisons (both sides might be competitors)
      /\b([A-Z][A-Za-z0-9]+)\s+(?:vs\.?|versus)\s+([A-Z][A-Za-z0-9]+)/gi
    ]

    for (const pattern of competitorPatterns) {
      let match
      while ((match = pattern.exec(responseText)) !== null) {
        // Get all captured groups
        const groups = match.slice(1).filter(g => g)
        for (const group of groups) {
          const names = this.extractNames(group)
          for (const name of names) {
            // Skip if it's our brand or already known
            if (name.toLowerCase() === brandName.toLowerCase()) continue
            if (competitors.some(c => c.name.toLowerCase() === name.toLowerCase())) continue

            // Additional validation - must look like a company/product name
            if (!this.looksLikeCompanyName(name)) continue

            // Get surrounding context
            const startIdx = Math.max(0, match.index - 50)
            const endIdx = Math.min(responseText.length, match.index + match[0].length + 50)
            const context = responseText.substring(startIdx, endIdx).trim()

            competitors.push({
              name,
              confidence: 60, // Lower confidence for regex matches
              context,
              category: this.inferCategory(responseText)
            })
          }
        }
      }
    }

    // Check for existing competitors (high confidence for known competitors)
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
   * Check if a string looks like a company/product name
   */
  private looksLikeCompanyName(name: string): boolean {
    if (!name || name.length < 2 || name.length > 40) return false

    // Must start with capital letter
    if (!/^[A-Z]/.test(name)) return false

    const words = name.split(/\s+/)
    const lower = name.toLowerCase()

    // Single word names need extra validation
    if (words.length === 1) {
      // Too short single words are likely not companies
      if (name.length < 3) return false

      // Check for indicators of company names:
      // - camelCase or unusual capitalization (HubSpot, GitHub, YouTube)
      // - all caps (IBM, AWS)
      // - has numbers (3M, 7-Eleven)
      // - ends with common startup suffixes
      const hasMixedCase = /[a-z][A-Z]/.test(name) || /[A-Z][a-z]+[A-Z]/.test(name)
      const hasNumbers = /\d/.test(name)
      const isAllCaps = name === name.toUpperCase() && name.length >= 2
      const companySuffixes = ['ly', 'io', 'ai', 'ify', 'hub', 'lab', 'labs', 'base', 'bit', 'box', 'desk', 'flow', 'force', 'grid', 'path', 'stack', 'works', 'ware', 'spot', 'craft', 'bee']
      const hasCompanySuffix = companySuffixes.some(s => lower.endsWith(s))

      // If it's just a normal capitalized word without any company indicators, reject it
      if (!hasMixedCase && !hasNumbers && !isAllCaps && !hasCompanySuffix) {
        return false
      }
    }

    return true
  }

  /**
   * AI-powered competitor detection for deeper analysis
   */
  private async aiDetect(
    responseText: string,
    brandName: string,
    existingCompetitors: string[]
  ): Promise<CompetitorDetectionResult> {
    const prompt = `Analyze this AI response and identify any DIRECT competitors to "${brandName}".

Response text:
${responseText.substring(0, 4000)}

Known competitors to look for: ${existingCompetitors.join(', ') || 'None specified'}

Extract ONLY:
1. Companies/products explicitly mentioned as alternatives or competitors to "${brandName}" or similar products in the same space
2. Whether "${brandName}" was mentioned
3. If "${brandName}" was mentioned, the context/sentiment around it

Return JSON only:
{
  "competitors": [{"name": "string", "confidence": 0-100, "context": "brief quote", "domain": "if known", "category": "product category"}],
  "brandMentioned": true/false,
  "brandContext": "quote where brand is mentioned" or null
}

IMPORTANT RULES:
- Only include REAL company or product names (like "HubSpot", "Salesforce", "Mailchimp")
- Do NOT include generic terms like "Software", "Platform", "Tools", "Solutions", "Services"
- Do NOT include common words that happen to be capitalized
- Do NOT include people's names unless they are clearly a brand/product
- Set confidence HIGH (85+) only for direct competitors explicitly mentioned as alternatives
- Set confidence MEDIUM (60-84) for products in the same category but not explicitly compared
- Do NOT include anything with confidence below 60`

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

      // Parse response - handle potential malformed JSON
      let cleanResponse = response.replace(/```json\n?|```\n?/g, '').trim()

      // Try to extract JSON object if there's extra content
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanResponse = jsonMatch[0]
      }

      // Try to fix common JSON issues (truncated strings, etc.)
      try {
        // First try direct parse
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
      } catch (parseError) {
        // If JSON is truncated, try to salvage what we can
        console.warn('[Competitor Detector] JSON parse failed, attempting to salvage partial data')

        // Try to extract brandMentioned
        const brandMatch = cleanResponse.match(/"brandMentioned"\s*:\s*(true|false)/i)
        const brandMentioned = brandMatch ? brandMatch[1].toLowerCase() === 'true' : false

        // Try to extract competitor names using regex
        const competitorMatches = cleanResponse.matchAll(/"name"\s*:\s*"([^"]+)"/g)
        const competitors = [...competitorMatches].map(m => ({
          name: m[1],
          confidence: 70,
          context: '',
          domain: undefined,
          category: undefined
        }))

        if (competitors.length > 0 || brandMentioned) {
          return { competitors, brandMentioned, brandContext: undefined }
        }

        // If nothing could be salvaged, return empty results
        throw parseError
      }
    } catch (error) {
      console.error('[Competitor Detector] AI detection error:', error)
      // Return empty results on error - no regex fallback
      return {
        competitors: [],
        brandMentioned: responseText.toLowerCase().includes(brandName.toLowerCase()),
        brandContext: undefined
      }
    }
  }

  /**
   * Save detected competitors to database
   * Status values: 'proposed' (auto-detected), 'tracking' (user approved), 'denied' (user rejected)
   */
  async saveDetectedCompetitors(
    organizationId: string,
    productId: string,
    detectedCompetitors: DetectedCompetitor[]
  ): Promise<{ added: number; updated: number }> {
    let added = 0
    let updated = 0

    for (const competitor of detectedCompetitors) {
      // Skip low confidence detections (raised from 50 to 60)
      if (competitor.confidence < 60) continue

      // Check if competitor already exists for this product (by name OR domain, case-insensitive)
      let existing = null

      // First check by name
      const { data: existingByName } = await this.supabase
        .from('competitors')
        .select('id, detection_count, status')
        .eq('product_id', productId)
        .ilike('name', competitor.name)
        .single()

      existing = existingByName

      // If not found by name and we have a domain, check by domain
      if (!existing && competitor.domain) {
        const normalizedDomain = competitor.domain.toLowerCase().replace(/^www\./, '')
        const { data: existingByDomain } = await this.supabase
          .from('competitors')
          .select('id, detection_count, status, domain')
          .eq('product_id', productId)
          .not('domain', 'is', null)

        // Find match by normalized domain
        existing = existingByDomain?.find(c => {
          if (!c.domain) return false
          const existingNormalized = c.domain.toLowerCase().replace(/^www\./, '')
          return existingNormalized === normalizedDomain ||
                 existingNormalized.includes(normalizedDomain) ||
                 normalizedDomain.includes(existingNormalized)
        }) || null
      }

      if (existing) {
        // Only update detection count, don't change status (user may have already reviewed)
        await this.supabase
          .from('competitors')
          .update({
            detection_count: (existing.detection_count || 0) + 1,
            last_detected_at: new Date().toISOString()
          })
          .eq('id', existing.id)
        updated++
      } else {
        // Generate icon URL if domain is available
        const iconUrl = competitor.domain
          ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(competitor.domain)}&sz=64`
          : null

        // Insert new competitor as 'proposed' (auto-detected, pending user review)
        const { error } = await this.supabase
          .from('competitors')
          .insert({
            organization_id: organizationId,
            product_id: productId,
            name: competitor.name,
            domain: competitor.domain,
            icon_url: iconUrl,
            is_auto_detected: true,
            detection_confidence: competitor.confidence,
            detection_context: competitor.context,
            detection_count: 1,
            status: 'proposed',
            last_detected_at: new Date().toISOString()
          })

        if (!error) added++
      }
    }

    return { added, updated }
  }

  /**
   * Get proposed competitors pending review
   */
  async getProposedCompetitors(productId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('competitors')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'proposed')
      .order('detection_count', { ascending: false })

    return data || []
  }

  /**
   * Approve or deny a proposed competitor
   * approved=true -> status='tracking', approved=false -> status='denied'
   */
  async reviewCompetitor(
    competitorId: string,
    approved: boolean
  ): Promise<void> {
    await this.supabase
      .from('competitors')
      .update({
        status: approved ? 'tracking' : 'denied',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', competitorId)
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
        // Filter out common non-company words and generic terms
        const lower = p.toLowerCase()
        const skipWords = [
          // Articles and conjunctions
          'the', 'a', 'an', 'and', 'or', 'but', 'with', 'for', 'of', 'to', 'in', 'on', 'at', 'by', 'from',
          // Quantifiers
          'many', 'some', 'several', 'various', 'other', 'more', 'others', 'all', 'any', 'each', 'every', 'most', 'few',
          // Generic tech/business terms that aren't company names
          'software', 'platform', 'tool', 'tools', 'service', 'services', 'solution', 'solutions',
          'app', 'apps', 'application', 'applications', 'product', 'products', 'system', 'systems',
          'website', 'websites', 'site', 'sites', 'company', 'companies', 'business', 'businesses',
          'enterprise', 'startup', 'startups', 'provider', 'providers', 'vendor', 'vendors',
          'option', 'options', 'choice', 'choices', 'alternative', 'alternatives',
          'feature', 'features', 'benefit', 'benefits', 'advantage', 'advantages',
          'technology', 'technologies', 'tech', 'digital', 'online', 'cloud', 'web',
          'market', 'markets', 'industry', 'industries', 'sector', 'sectors',
          'data', 'analytics', 'ai', 'machine', 'learning', 'automation',
          'marketing', 'sales', 'customer', 'customers', 'user', 'users',
          'free', 'paid', 'premium', 'pro', 'basic', 'standard', 'advanced',
          'small', 'medium', 'large', 'best', 'top', 'popular', 'leading', 'major',
          'new', 'old', 'modern', 'traditional', 'similar', 'different', 'unique',
          'first', 'second', 'third', 'next', 'last', 'another', 'additional',
          // Common sentence starters that get captured
          'here', 'there', 'this', 'that', 'these', 'those', 'which', 'what', 'when', 'where', 'how', 'why',
          'however', 'therefore', 'furthermore', 'moreover', 'additionally', 'alternatively',
          'example', 'examples', 'instance', 'instances', 'case', 'cases',
          'way', 'ways', 'method', 'methods', 'approach', 'approaches',
          'type', 'types', 'kind', 'kinds', 'form', 'forms', 'category', 'categories'
        ]

        // Must start with capital letter, have reasonable length, and not be a skip word
        if (!p || p.length < 3 || p.length > 50) return false
        if (!(/^[A-Z]/.test(p))) return false
        if (skipWords.includes(lower)) return false

        // Filter out strings that are too generic (all lowercase except first letter and just one word)
        const words = p.split(/\s+/)
        if (words.length === 1 && p === p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()) {
          // Single capitalized word - check if it looks like a proper noun (company name)
          // Real company names are often all-caps, camelCase, or have unusual capitalization
          if (lower.length < 4) return false
          // Check if it's a common English word (not a company name)
          const commonWords = ['people', 'things', 'world', 'years', 'times', 'point', 'group', 'number', 'great', 'place', 'right', 'little', 'state', 'government', 'night', 'country', 'story', 'school', 'family', 'water', 'house', 'moment', 'question', 'power', 'money', 'change', 'order', 'program', 'level', 'information', 'support', 'management', 'development', 'control', 'policy', 'research', 'process', 'project']
          if (commonWords.includes(lower)) return false
        }

        return true
      })
      .slice(0, 5) // Limit to prevent spam (reduced from 10)
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
