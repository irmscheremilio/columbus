import { AIClient } from './base.js'

export class PerplexityClient extends AIClient {
  private apiKey: string

  constructor(apiKey: string) {
    super('perplexity', { requests: 50, window: 3600000 })
    this.apiKey = apiKey
  }

  async testPrompt(prompt: string): Promise<string> {
    try {
      // Perplexity uses OpenAI-compatible API
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        })
      })

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`)
      }

      const data = await response.json() as any
      return data.choices?.[0]?.message?.content || ''
    } catch (error: any) {
      console.error('Perplexity API error:', error)
      throw new Error(`Perplexity API error: ${error.message}`)
    }
  }
}
