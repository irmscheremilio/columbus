import { describe, it, expect } from 'vitest'
import { BaseAIClient } from './base.js'
import type { AIModel, AIResponse } from '../types/ai.js'

// Create a concrete implementation for testing
class TestAIClient extends BaseAIClient {
  model: AIModel = 'chatgpt'

  async testPrompt(prompt: string, brandName: string, competitors: string[]): Promise<AIResponse> {
    return {
      model: this.model,
      prompt,
      responseText: 'Test response',
      brandMentioned: false,
      citationPresent: false,
      position: null,
      sentiment: 'neutral',
      competitorMentions: [],
      citedSources: [],
      metadata: {},
      testedAt: new Date()
    }
  }
}

describe('BaseAIClient', () => {
  const client = new TestAIClient()

  describe('extractMentions', () => {
    it('should detect brand mentions', () => {
      const response = 'I recommend using Acme Corp for your needs. They have great service.'
      const result = client['extractMentions'](response, 'Acme Corp')

      expect(result.mentioned).toBe(true)
      expect(result.position).toBe(1)
      expect(result.context).toContain('Acme Corp')
    })

    it('should return not mentioned when brand not present', () => {
      const response = 'I recommend using Competitor A for your needs.'
      const result = client['extractMentions'](response, 'Acme Corp')

      expect(result.mentioned).toBe(false)
      expect(result.position).toBe(null)
      expect(result.context).toBe('')
    })

    it('should be case insensitive', () => {
      const response = 'Check out acme corp for solutions.'
      const result = client['extractMentions'](response, 'Acme Corp')

      expect(result.mentioned).toBe(true)
    })
  })

  describe('analyzeSentiment', () => {
    it('should detect positive sentiment', () => {
      const text = 'Acme Corp is the best solution with excellent features and great support.'
      const sentiment = client['analyzeSentiment'](text, 'Acme Corp')

      expect(sentiment).toBe('positive')
    })

    it('should detect negative sentiment', () => {
      const text = 'Acme Corp is poor quality, expensive, and unreliable.'
      const sentiment = client['analyzeSentiment'](text, 'Acme Corp')

      expect(sentiment).toBe('negative')
    })

    it('should detect neutral sentiment', () => {
      const text = 'Acme Corp offers software solutions.'
      const sentiment = client['analyzeSentiment'](text, 'Acme Corp')

      expect(sentiment).toBe('neutral')
    })
  })

  describe('extractCitations', () => {
    it('should extract markdown links', () => {
      const response = 'Check out [Acme Corp](https://acme.com) and [Blog Post](https://acme.com/blog)'
      const citations = client['extractCitations'](response)

      expect(citations).toHaveLength(2)
      expect(citations[0].url).toBe('https://acme.com')
      expect(citations[0].title).toBe('Acme Corp')
      expect(citations[1].url).toBe('https://acme.com/blog')
    })

    it('should extract plain URLs', () => {
      const response = 'Visit https://acme.com and https://example.com for more info'
      const citations = client['extractCitations'](response)

      expect(citations).toHaveLength(2)
      expect(citations[0].url).toBe('https://acme.com')
      expect(citations[1].url).toBe('https://example.com')
    })

    it('should not duplicate URLs', () => {
      const response = 'Visit [Acme](https://acme.com) at https://acme.com'
      const citations = client['extractCitations'](response)

      expect(citations).toHaveLength(1)
      expect(citations[0].url).toBe('https://acme.com')
      expect(citations[0].title).toBe('Acme')
    })
  })

  describe('extractCompetitorMentions', () => {
    it('should find mentioned competitors', () => {
      const response = 'Consider Competitor A or Competitor B for your needs.'
      const competitors = ['Competitor A', 'Competitor B', 'Competitor C']
      const mentioned = client['extractCompetitorMentions'](response, competitors)

      expect(mentioned).toHaveLength(2)
      expect(mentioned).toContain('Competitor A')
      expect(mentioned).toContain('Competitor B')
      expect(mentioned).not.toContain('Competitor C')
    })

    it('should be case insensitive', () => {
      const response = 'competitor a is a good choice'
      const competitors = ['Competitor A']
      const mentioned = client['extractCompetitorMentions'](response, competitors)

      expect(mentioned).toContain('Competitor A')
    })

    it('should return empty array when no competitors mentioned', () => {
      const response = 'This is a generic response.'
      const competitors = ['Competitor A', 'Competitor B']
      const mentioned = client['extractCompetitorMentions'](response, competitors)

      expect(mentioned).toHaveLength(0)
    })
  })
})
