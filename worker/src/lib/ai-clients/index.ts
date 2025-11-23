import { ChatGPTClient } from './chatgpt.js'
import { ClaudeClient } from './claude.js'
import { GeminiClient } from './gemini.js'
import { PerplexityClient } from './perplexity.js'
import type { AIClient } from './base.js'
import type { AIModel } from './base.js'

export * from './base.js'
export { ChatGPTClient, ClaudeClient, GeminiClient, PerplexityClient }

export function createAIClient(model: AIModel): AIClient {
  switch (model) {
    case 'chatgpt':
      return new ChatGPTClient(process.env.OPENAI_API_KEY!)
    case 'claude':
      return new ClaudeClient(process.env.ANTHROPIC_API_KEY!)
    case 'gemini':
      return new GeminiClient(process.env.GOOGLE_AI_API_KEY!)
    case 'perplexity':
      return new PerplexityClient(process.env.PERPLEXITY_API_KEY!)
    default:
      throw new Error(`Unsupported AI model: ${model}`)
  }
}
