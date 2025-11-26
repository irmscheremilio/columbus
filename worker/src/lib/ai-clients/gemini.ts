import { AIClient } from './base.js'

export class GeminiClient extends AIClient {
  private apiKey: string

  constructor(apiKey: string) {
    super('gemini', { requests: 100, window: 3600000 })
    this.apiKey = apiKey
  }

  async testPrompt(prompt: string): Promise<string> {
    try {
      // Try gemini-2.0-flash first, fallback to gemini-1.5-flash-latest
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash']

      for (const model of models) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
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

          if (response.ok) {
            const data = await response.json() as any
            return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          }

          // If 404 Not Found, try next model
          if (response.status === 404) {
            console.warn(`Gemini model ${model} not found, trying next...`)
            continue
          }

          // Other errors, throw
          const errorBody = await response.text()
          throw new Error(`Gemini API error (${response.status}): ${errorBody}`)
        } catch (err: any) {
          if (err.message?.includes('not found') || err.message?.includes('404')) {
            continue
          }
          throw err
        }
      }

      throw new Error('No available Gemini model found')
    } catch (error: any) {
      console.error('Gemini API error:', error)
      throw new Error(`Gemini API error: ${error.message}`)
    }
  }
}
