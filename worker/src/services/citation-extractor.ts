import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface ExtractedCitation {
  url: string
  domain: string
  title?: string
  text?: string
  position: number
  isBrandSource: boolean
}

export interface CitationExtractionResult {
  citations: ExtractedCitation[]
  totalCount: number
  brandSourceCount: number
}

/**
 * Citation Extractor Service
 * Extracts and analyzes URLs/sources cited in AI responses
 */
export class CitationExtractor {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
    )
  }

  /**
   * Extract all citations from an AI response
   */
  extractCitations(responseText: string, brandDomain?: string): CitationExtractionResult {
    const citations: ExtractedCitation[] = []

    // Pattern for URLs - supports various formats
    const urlPatterns = [
      // Standard URLs
      /https?:\/\/(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+)(?:\/[^\s\)\]\}\"\'<>]*)?/gi,
      // Markdown links [text](url)
      /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/gi,
      // HTML links <a href="url">
      /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([^<]*)<\/a>/gi
    ]

    let position = 0
    const seenUrls = new Set<string>()

    // Extract standard URLs
    const standardUrlRegex = /https?:\/\/(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+)(?:\/[^\s\)\]\}\"\'<>]*)?/gi
    let match
    while ((match = standardUrlRegex.exec(responseText)) !== null) {
      const url = match[0].replace(/[.,;:!?)}\]]+$/, '') // Clean trailing punctuation
      if (seenUrls.has(url.toLowerCase())) continue
      seenUrls.add(url.toLowerCase())

      const domain = this.extractDomain(url)
      const isBrandSource = brandDomain ? this.isDomainMatch(domain, brandDomain) : false

      position++
      citations.push({
        url,
        domain,
        text: this.getContextAround(responseText, match.index, 100),
        position,
        isBrandSource
      })
    }

    // Extract markdown links with titles
    const markdownRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/gi
    while ((match = markdownRegex.exec(responseText)) !== null) {
      const title = match[1]
      const url = match[2].replace(/[.,;:!?)}\]]+$/, '')

      // Update existing citation with title if found
      const existing = citations.find(c => c.url.toLowerCase() === url.toLowerCase())
      if (existing) {
        existing.title = title
      }
    }

    return {
      citations,
      totalCount: citations.length,
      brandSourceCount: citations.filter(c => c.isBrandSource).length
    }
  }

  /**
   * Save extracted citations to database
   */
  async saveCitations(
    promptResultId: string,
    organizationId: string,
    productId: string,
    citations: ExtractedCitation[]
  ): Promise<void> {
    if (citations.length === 0) return

    const records = citations.map(c => ({
      prompt_result_id: promptResultId,
      organization_id: organizationId,
      product_id: productId,
      url: c.url,
      source_domain: c.domain,
      source_title: c.title,
      citation_text: c.text,
      citation_position: c.position,
      is_brand_source: c.isBrandSource
    }))

    const { error } = await this.supabase
      .from('prompt_citations')
      .insert(records)

    if (error) {
      console.error('[Citation Extractor] Error saving citations:', error)
    }
  }

  /**
   * Get aggregated source statistics for a product
   */
  async getSourceStats(productId: string): Promise<{
    domains: { domain: string; count: number; isBrand: boolean }[]
    totalCitations: number
    brandCitations: number
  }> {
    const { data, error } = await this.supabase
      .from('prompt_citations')
      .select('source_domain, is_brand_source')
      .eq('product_id', productId)

    if (error || !data) {
      return { domains: [], totalCitations: 0, brandCitations: 0 }
    }

    // Aggregate by domain
    const domainCounts: Record<string, { count: number; isBrand: boolean }> = {}
    for (const row of data) {
      const key = row.source_domain
      if (!domainCounts[key]) {
        domainCounts[key] = { count: 0, isBrand: row.is_brand_source }
      }
      domainCounts[key].count++
    }

    const domains = Object.entries(domainCounts)
      .map(([domain, { count, isBrand }]) => ({ domain, count, isBrand }))
      .sort((a, b) => b.count - a.count)

    return {
      domains,
      totalCitations: data.length,
      brandCitations: data.filter(d => d.is_brand_source).length
    }
  }

  // Helper methods
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace(/^www\./, '')
    } catch {
      // Fallback regex extraction
      const match = url.match(/https?:\/\/(?:www\.)?([^\/\s]+)/)
      return match ? match[1] : url
    }
  }

  private isDomainMatch(domain1: string, domain2: string): boolean {
    const normalize = (d: string) => d.toLowerCase().replace(/^www\./, '')
    return normalize(domain1) === normalize(domain2)
  }

  private getContextAround(text: string, index: number, chars: number): string {
    const start = Math.max(0, index - chars)
    const end = Math.min(text.length, index + chars)
    return text.substring(start, end).trim()
  }
}

export const citationExtractor = new CitationExtractor()
