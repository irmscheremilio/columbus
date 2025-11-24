import { chromium } from 'playwright'
import { BaseAIClient } from './base.js'
import type { AIModel, AIResponse } from '../types/ai.js'

/**
 * Gemini Client using Playwright for web scraping
 *
 * Key insights:
 * - Does NOT have separate crawler - uses Googlebot
 * - ONLY major LLM with full JavaScript rendering support
 * - Can index React/Vue/Angular apps natively
 * - 206.4M unique visitors (October 2025)
 * - Could also use official Google AI API in future
 */
export class GeminiClient extends BaseAIClient {
  model: AIModel = 'gemini'

  async testPrompt(prompt: string, brandName: string, competitors: string[]): Promise<AIResponse> {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    try {
      // Navigate to Gemini
      await page.goto('https://gemini.google.com/', { waitUntil: 'networkidle' })

      // TODO: Handle authentication if needed
      // Google account login may be required

      // Wait for chat input
      const chatInput = await page.waitForSelector('rich-textarea[placeholder*="Enter a prompt"]', { timeout: 10000 })

      // Type the prompt
      await chatInput.click()
      await page.keyboard.type(prompt)

      // Submit
      await page.keyboard.press('Enter')

      // Wait for response to complete
      await page.waitForTimeout(15000) // Wait for AI to generate response
      // TODO: Better detection of response completion - look for stop button disappearing

      // Extract response text
      // Gemini shows responses in message-content divs
      const responseElements = await page.locator('[data-test-id="model-response"]').last()
      const responseText = await responseElements.innerText()

      // Extract mentions and citations
      const mentionData = this.extractMentions(responseText, brandName)
      const citations = this.extractCitations(responseText)
      const competitorMentions = this.extractCompetitorMentions(responseText, competitors)

      await browser.close()

      return {
        model: this.model,
        prompt,
        responseText,
        brandMentioned: mentionData.mentioned,
        citationPresent: citations.length > 0,
        position: mentionData.position,
        sentiment: mentionData.sentiment,
        competitorMentions,
        citedSources: citations,
        metadata: {
          responseLength: responseText.length,
          citationCount: citations.length,
          context: mentionData.context,
          javascriptAdvantage: true // Gemini can render JS unlike others
        },
        testedAt: new Date()
      }
    } catch (error) {
      await browser.close()
      throw new Error(`Gemini scraping failed: ${error}`)
    }
  }
}
