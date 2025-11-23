import { AIClient } from './base.js'

export class GeminiClient extends AIClient {
  private apiKey: string

  constructor(apiKey: string) {
    super('gemini', { requests: 100, window: 3600000 })
    this.apiKey = apiKey
  }

  async testPrompt(prompt: string): Promise<string> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const data = await response.json() as any
      return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } catch (error: any) {
      console.error('Gemini API error:', error)
      throw new Error(`Gemini API error: ${error.message}`)
    }
  }
}
