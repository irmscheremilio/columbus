import Anthropic from '@anthropic-ai/sdk'
import { AIClient } from './base.js'

export class ClaudeClient extends AIClient {
  private client: Anthropic

  constructor(apiKey: string) {
    super('claude', { requests: 100, window: 3600000 }) // 100 requests per hour
    this.client = new Anthropic({ apiKey })
  }

  async testPrompt(prompt: string): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022', // Using Haiku for cost efficiency
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = message.content[0]
      return content.type === 'text' ? content.text : ''
    } catch (error: any) {
      console.error('Claude API error:', error)
      throw new Error(`Claude API error: ${error.message}`)
    }
  }
}
