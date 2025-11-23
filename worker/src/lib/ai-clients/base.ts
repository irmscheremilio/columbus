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
  metadata?: Record<string, any>
}

export interface MentionData {
  mentioned: boolean
  citation: boolean
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
  extractMentions(responseText: string, brandName: string, competitors: string[] = []): MentionData & { competitors: string[] } {
    const lowerResponse = responseText.toLowerCase()
    const lowerBrand = brandName.toLowerCase()

    // Check if brand is mentioned
    const mentioned = lowerResponse.includes(lowerBrand)

    // Check for citation (URLs, references)
    const citation = /https?:\/\//.test(responseText) && mentioned

    // Try to find position in list
    let position: number | null = null
    const listPatterns = [
      /\d+\.\s+([^\n]+)/g, // Numbered lists
      /[-*]\s+([^\n]+)/g,  // Bullet points
    ]

    for (const pattern of listPatterns) {
      const matches = [...responseText.matchAll(pattern)]
      const brandMatch = matches.findIndex(m =>
        m[1]?.toLowerCase().includes(lowerBrand)
      )
      if (brandMatch !== -1) {
        position = brandMatch + 1
        break
      }
    }

    // Analyze sentiment (basic)
    const sentiment = this.analyzeSentiment(responseText, brandName)

    // Find competitor mentions
    const competitorMentions = competitors.filter(comp =>
      lowerResponse.includes(comp.toLowerCase())
    )

    return {
      mentioned,
      citation,
      position,
      sentiment,
      competitors: competitorMentions
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
      metadata: {
        responseLength: responseText.length,
        timestamp: new Date().toISOString()
      }
    }
  }
}
