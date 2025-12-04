// AI Client Types and Interfaces

// AIModel is now a string to support dynamic platforms from ai_platforms table
export type AIModel = string

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
  byModel: Record<string, number>  // Dynamic platform IDs from ai_platforms table
  trend: 'up' | 'down' | 'stable'
  percentChange: number
}

export interface RateLimitConfig {
  requests: number
  window: number // in milliseconds
  costPerRequest: number
}

// Default rate limits - can be overridden by database configuration
// These serve as fallbacks for known platforms
export const AI_RATE_LIMITS: Record<string, RateLimitConfig> = {
  chatgpt: { requests: 100, window: 3600000, costPerRequest: 0.03 },
  claude: { requests: 100, window: 3600000, costPerRequest: 0.04 },
  gemini: { requests: 100, window: 3600000, costPerRequest: 0.02 },
  perplexity: { requests: 50, window: 3600000, costPerRequest: 0.05 },
  google_aio: { requests: 100, window: 3600000, costPerRequest: 0.01 }
}

// Default rate limit for unknown platforms
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  requests: 100,
  window: 3600000,
  costPerRequest: 0.02
}

// Base AI Client Interface
export interface AIClient {
  model: AIModel
  testPrompt(prompt: string): Promise<AIResponse>
  extractMentions(response: string, brandName: string): MentionData
  analyzeSentiment(response: string, brandName: string): 'positive' | 'neutral' | 'negative'
  extractCitations(response: string): CitedSource[]
}
