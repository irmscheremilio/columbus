// AI Client Types and Interfaces

export type AIModel = 'chatgpt' | 'claude' | 'gemini' | 'perplexity'

export interface AIResponse {
  model: AIModel
  prompt: string
  responseText: string
  brandMentioned: boolean
  citationPresent: boolean
  position: number | null
  sentiment: 'positive' | 'neutral' | 'negative'
  competitorMentions: string[]
  citedSources: CitedSource[]
  metadata: Record<string, any>
  testedAt: Date
}

export interface CitedSource {
  url: string
  title?: string
  position: number
  snippet?: string
}

export interface MentionData {
  mentioned: boolean
  position: number | null
  context: string
  sentiment: 'positive' | 'neutral' | 'negative'
}

export interface PromptTemplate {
  id: string
  category: 'product' | 'comparison' | 'how-to' | 'informational' | 'commercial'
  template: string
  variables: string[]
  industry?: string
}

export interface VisibilityScore {
  overall: number
  byModel: {
    chatgpt: number
    claude: number
    gemini: number
    perplexity: number
  }
  trend: 'up' | 'down' | 'stable'
  percentChange: number
}

export interface RateLimitConfig {
  requests: number
  window: number // in milliseconds
  costPerRequest: number
}

export const AI_RATE_LIMITS: Record<AIModel, RateLimitConfig> = {
  chatgpt: { requests: 100, window: 3600000, costPerRequest: 0.03 },
  claude: { requests: 100, window: 3600000, costPerRequest: 0.04 },
  gemini: { requests: 100, window: 3600000, costPerRequest: 0.02 },
  perplexity: { requests: 50, window: 3600000, costPerRequest: 0.05 }
}

// Base AI Client Interface
export interface AIClient {
  model: AIModel
  testPrompt(prompt: string): Promise<AIResponse>
  extractMentions(response: string, brandName: string): MentionData
  analyzeSentiment(response: string, brandName: string): 'positive' | 'neutral' | 'negative'
  extractCitations(response: string): CitedSource[]
}
