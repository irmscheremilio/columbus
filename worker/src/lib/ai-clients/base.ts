export type AIModel = 'chatgpt' | 'claude' | 'gemini' | 'perplexity'
export type Sentiment = 'positive' | 'neutral' | 'negative'

export interface AIResponse {
  model: AIModel
  responseText: string
  brandMentioned: boolean
  citationPresent: boolean
  position: number | null
  sentiment: Sentiment | null
  competitorMentions: string[]
  competitorDetails: CompetitorMentionData[]
  metadata?: Record<string, any>
}

export interface MentionData {
  mentioned: boolean
  citation: boolean
  position: number | null
  sentiment: Sentiment | null
}

export interface CompetitorMentionData {
  name: string
  mentioned: boolean
  position: number | null
  sentiment: Sentiment | null
}

export abstract class AIClient {
  protected model: AIModel
  protected rateLimit: {
    requests: number
    window: number // in milliseconds
  }

  constructor(model: AIModel, rateLimit: { requests: number; window: number }) {
    this.model = model
    this.rateLimit = rateLimit
  }

  /**
   * Test a prompt against the AI model
   */
  abstract testPrompt(prompt: string): Promise<string>

  /**
   * Extract brand mentions from AI response
   */
  extractMentions(responseText: string, brandName: string, competitors: string[] = []): MentionData & { competitors: string[]; competitorDetails: CompetitorMentionData[] } {
    const lowerResponse = responseText.toLowerCase()
    const lowerBrand = brandName.toLowerCase()

    // Check if brand is mentioned
    const mentioned = lowerResponse.includes(lowerBrand)

    // Check for citation (URLs, references)
    const citation = /https?:\/\//.test(responseText) && mentioned

    // Get all brands to track (product + competitors)
    const allBrands = [
      { name: brandName, isProduct: true },
      ...competitors.map(c => ({ name: c, isProduct: false }))
    ]

    // Find the first occurrence position of each brand in the response
    const brandPositions: { name: string; isProduct: boolean; index: number }[] = []

    for (const brand of allBrands) {
      const index = lowerResponse.indexOf(brand.name.toLowerCase())
      if (index !== -1) {
        brandPositions.push({ name: brand.name, isProduct: brand.isProduct, index })
      }
    }

    // Sort by position in text (first mentioned = lowest index)
    brandPositions.sort((a, b) => a.index - b.index)

    // Calculate position for brand: which brand was mentioned first among all brands
    // Position 1 = mentioned first, Position 2 = mentioned second, etc.
    let position: number | null = null

    if (mentioned) {
      // Find our product's rank (1-indexed)
      const productRank = brandPositions.findIndex(b => b.isProduct)
      if (productRank !== -1) {
        position = productRank + 1
      }
    }

    // Analyze sentiment (basic)
    const sentiment = this.analyzeSentiment(responseText, brandName)

    // Find competitor mentions with position and sentiment
    const competitorMentions: string[] = []
    const competitorDetails: CompetitorMentionData[] = []

    for (const comp of competitors) {
      const compMentioned = lowerResponse.includes(comp.toLowerCase())
      if (compMentioned) {
        competitorMentions.push(comp)

        // Find competitor's position in the sorted brand positions
        const compRank = brandPositions.findIndex(b => b.name.toLowerCase() === comp.toLowerCase())
        const compPosition = compRank !== -1 ? compRank + 1 : null

        // Analyze sentiment for this competitor
        const compSentiment = this.analyzeSentiment(responseText, comp)

        competitorDetails.push({
          name: comp,
          mentioned: true,
          position: compPosition,
          sentiment: compSentiment
        })
      }
    }

    return {
      mentioned,
      citation,
      position,
      sentiment,
      competitors: competitorMentions,
      competitorDetails
    }
  }

  /**
   * Analyze sentiment of brand mention
   */
  protected analyzeSentiment(text: string, brandName: string): Sentiment {
    const lowerText = text.toLowerCase()
    const lowerBrand = brandName.toLowerCase()

    // Find sentences containing the brand
    const sentences = text.split(/[.!?]+/).filter(s =>
      s.toLowerCase().includes(lowerBrand)
    )

    if (sentences.length === 0) return 'neutral'

    const positiveWords = ['best', 'great', 'excellent', 'top', 'leading', 'recommended', 'popular', 'trusted', 'innovative', 'powerful']
    const negativeWords = ['worst', 'bad', 'poor', 'limited', 'expensive', 'difficult', 'complicated', 'lacking']

    let positiveCount = 0
    let negativeCount = 0

    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase()
      positiveWords.forEach(word => {
        if (lowerSentence.includes(word)) positiveCount++
      })
      negativeWords.forEach(word => {
        if (lowerSentence.includes(word)) negativeCount++
      })
    })

    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  /**
   * Format a full AI response
   */
  formatResponse(
    responseText: string,
    brandName: string,
    competitors: string[] = []
  ): AIResponse {
    const mentions = this.extractMentions(responseText, brandName, competitors)

    return {
      model: this.model,
      responseText,
      brandMentioned: mentions.mentioned,
      citationPresent: mentions.citation,
      position: mentions.position,
      sentiment: mentions.sentiment,
      competitorMentions: mentions.competitors,
      competitorDetails: mentions.competitorDetails,
      metadata: {
        responseLength: responseText.length,
        timestamp: new Date().toISOString()
      }
    }
  }
}
