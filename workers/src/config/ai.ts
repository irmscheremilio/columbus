/**
 * AI Model Configuration
 * Allows switching between different AI providers via environment variables
 */

export type AIProvider = 'openai' | 'anthropic'
export type AIModel = 'gpt-4o-mini' | 'gpt-4o' | 'claude-sonnet-4' | 'claude-opus-4'

export interface AIConfig {
  provider: AIProvider
  model: AIModel
  apiKey: string
}

/**
 * Get AI configuration from environment variables
 */
export function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase() as AIProvider
  const defaultModel = provider === 'openai' ? 'gpt-4o-mini' : 'claude-sonnet-4'
  const model = (process.env.AI_MODEL || defaultModel) as AIModel

  let apiKey: string
  if (provider === 'openai') {
    apiKey = process.env.OPENAI_API_KEY || ''
  } else if (provider === 'anthropic') {
    apiKey = process.env.ANTHROPIC_API_KEY || ''
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`)
  }

  if (!apiKey) {
    throw new Error(`Missing API key for ${provider}. Set ${provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'}`)
  }

  return {
    provider,
    model,
    apiKey
  }
}

/**
 * Validate AI configuration on startup
 */
export function validateAIConfig(): void {
  try {
    const config = getAIConfig()
    console.log(`[AI Config] Using provider: ${config.provider}, model: ${config.model}`)
  } catch (error) {
    console.error('[AI Config] Configuration error:', error)
    throw error
  }
}
