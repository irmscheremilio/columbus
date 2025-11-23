import OpenAI from 'openai'
import { AIClient } from './base.js'

export class ChatGPTClient extends AIClient {
  private client: OpenAI

  constructor(apiKey: string) {
    super('chatgpt', { requests: 100, window: 3600000 }) // 100 requests per hour
    this.client = new OpenAI({ apiKey })
  }

  async testPrompt(prompt: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini', // Using GPT-4o mini for cost efficiency
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })

      return completion.choices[0]?.message?.content || ''
    } catch (error: any) {
      console.error('ChatGPT API error:', error)
      throw new Error(`ChatGPT API error: ${error.message}`)
    }
  }
}
