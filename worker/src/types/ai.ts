// AI Client Types (shared with frontend)

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

export interface ScanJobData {
  organizationId: string
  brandId: string
  brandName: string
  domain: string
  promptIds: string[]
  competitors: string[]
  isScheduled?: boolean
  jobId?: string
}

export interface ScanJobResult {
  organizationId: string
  brandId: string
  results: AIResponse[]
  visibilityScore: number
  completedAt: Date
}
