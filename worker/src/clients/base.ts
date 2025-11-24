import type { AIModel, AIResponse, MentionData, CitedSource } from '../types/ai.js'

/**
 * Base AI Client with common functionality
 * All AI model clients extend this class
 */
export abstract class BaseAIClient {
  abstract model: AIModel

  abstract testPrompt(prompt: string, brandName: string, competitors: string[]): Promise<AIResponse>

  /**
   * Extract brand mentions from AI response
   */
  protected extractMentions(response: string, brandName: string): MentionData {
    const lowerResponse = response.toLowerCase()
    const lowerBrand = brandName.toLowerCase()

    const mentioned = lowerResponse.includes(lowerBrand)

    if (!mentioned) {
      return {
        mentioned: false,
        position: null,
        context: '',
        sentiment: 'neutral'
      }
    }

    // Find position (which paragraph/sentence)
    const sentences = response.split(/[.!?]+/)
    let position = 0
    let context = ''

    for (let i = 0; i < sentences.length; i++) {
      if (sentences[i].toLowerCase().includes(lowerBrand)) {
        position = i + 1
        context = sentences[i].trim()
        break
      }
    }

    return {
      mentioned: true,
      position,
      context,
      sentiment: this.analyzeSentiment(context, brandName)
    }
  }

  /**
   * Analyze sentiment of brand mention
   */
  protected analyzeSentiment(text: string, brandName: string): 'positive' | 'neutral' | 'negative' {
    const lowerText = text.toLowerCase()

    const positiveWords = [
      'best', 'excellent', 'great', 'top', 'leading', 'premier',
      'recommended', 'popular', 'trusted', 'reliable', 'innovative',
      'powerful', 'effective', 'superior', 'outstanding'
    ]

    const negativeWords = [
      'worst', 'poor', 'bad', 'limited', 'lacking', 'expensive',
      'slow', 'difficult', 'complicated', 'unreliable', 'outdated'
    ]

    let positiveScore = 0
    let negativeScore = 0

    for (const word of positiveWords) {
      if (lowerText.includes(word)) positiveScore++
    }

    for (const word of negativeWords) {
      if (lowerText.includes(word)) negativeScore++
    }

    if (positiveScore > negativeScore) return 'positive'
    if (negativeScore > positiveScore) return 'negative'
    return 'neutral'
  }

  /**
   * Extract citations from AI response
   */
  protected extractCitations(response: string): CitedSource[] {
    const citations: CitedSource[] = []

    // Match URLs in markdown link format: [text](url)
    const markdownLinks = response.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)
    let position = 1

    for (const match of markdownLinks) {
      const [, title, url] = match
      citations.push({
        url: url.trim(),
        title: title.trim(),
        position: position++
      })
    }

    // Match plain URLs
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g
    const plainUrls = response.match(urlRegex) || []

    for (const url of plainUrls) {
      if (citations.some(c => c.url === url)) continue

      citations.push({
        url: url.trim(),
        position: position++
      })
    }

    return citations
  }

  /**
   * Extract competitor mentions
   */
  protected extractCompetitorMentions(response: string, competitors: string[]): string[] {
    const mentioned: string[] = []
    const lowerResponse = response.toLowerCase()

    for (const competitor of competitors) {
      if (lowerResponse.includes(competitor.toLowerCase())) {
        mentioned.push(competitor)
      }
    }

    return mentioned
  }
}
