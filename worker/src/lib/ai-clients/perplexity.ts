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
      // Try current model names (as of 2025)
      const models = ['sonar', 'sonar-pro', 'llama-3.1-sonar-small-128k-online']

      for (const model of models) {
        try {
          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
              model,
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

          if (response.ok) {
            const data = await response.json() as any
            return data.choices?.[0]?.message?.content || ''
          }

          // If model not found (400 Bad Request often means invalid model), try next
          if (response.status === 400) {
            const errorBody = await response.text()
            if (errorBody.includes('model') || errorBody.includes('invalid')) {
              console.warn(`Perplexity model ${model} failed, trying next...`)
              continue
            }
          }

          const errorBody = await response.text()
          throw new Error(`Perplexity API error (${response.status}): ${errorBody}`)
        } catch (err: any) {
          if (err.message?.includes('model') || err.message?.includes('invalid')) {
            continue
          }
          throw err
        }
      }

      throw new Error('No available Perplexity model found')
    } catch (error: any) {
      console.error('Perplexity API error:', error)
      throw new Error(`Perplexity API error: ${error.message}`)
    }
  }
}
