import { chromium } from 'playwright'
import { BaseAIClient } from './base.js'
import type { AIModel, AIResponse } from '../types/ai.js'

/**
 * ChatGPT Client using Playwright for web scraping
 *
 * Key insights:
 * - Extreme recency bias: 76.4% of cited pages updated in last 30 days
 * - Wikipedia dominates at 7.8% of total citations
 * - Average 5 domains cited per response
 * - Does NOT execute JavaScript
 */
export class ChatGPTClient extends BaseAIClient {
  model: AIModel = 'chatgpt'

  async testPrompt(prompt: string, brandName: string, competitors: string[]): Promise<AIResponse> {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    try {
      // Navigate to ChatGPT
      await page.goto('https://chatgpt.com/', { waitUntil: 'networkidle' })

      // TODO: Handle authentication if needed
      // For now, assume we can access without login or use a session

      // Type the prompt
      const textbox = await page.waitForSelector('textarea[placeholder*="Message"]', { timeout: 10000 })
      await textbox.fill(prompt)

      // Submit
      await page.keyboard.press('Enter')

      // Wait for response to complete
      await page.waitForTimeout(15000) // Wait for AI to generate response
      // TODO: Better detection of response completion

      // Extract response text
      const responseElements = await page.locator('[data-message-author-role="assistant"]').last()
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
          context: mentionData.context
        },
        testedAt: new Date()
      }
    } catch (error) {
      await browser.close()
      throw new Error(`ChatGPT scraping failed: ${error}`)
    }
  }
}
