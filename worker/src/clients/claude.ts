import { chromium } from 'playwright'
import { BaseAIClient } from './base.js'
import type { AIModel, AIResponse } from '../types/ai.js'

/**
 * Claude Client using Playwright for web scraping
 *
 * Key insights:
 * - Launched web search March 2025
 * - Uses ClaudeBot for indexing, Claude-User for real-time retrieval
 * - Does NOT execute JavaScript
 * - Less data available on citation preferences vs ChatGPT/Perplexity
 */
export class ClaudeClient extends BaseAIClient {
  model: AIModel = 'claude'

  async testPrompt(prompt: string, brandName: string, competitors: string[]): Promise<AIResponse> {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    try {
      // Navigate to Claude
      await page.goto('https://claude.ai/', { waitUntil: 'networkidle' })

      // TODO: Handle authentication if needed
      // For now, assume we can access without login or use a session

      // Look for the chat input
      const chatInput = await page.waitForSelector('div[contenteditable="true"]', { timeout: 10000 })

      // Type the prompt
      await chatInput.click()
      await chatInput.fill(prompt)

      // Submit (Enter key)
      await page.keyboard.press('Enter')

      // Wait for response to complete
      // Claude shows a "Stop" button while generating, we can wait for it to disappear
      await page.waitForTimeout(20000) // Wait for AI to generate response
      // TODO: Better detection of response completion

      // Extract response text
      // Claude's structure: look for assistant messages
      const responseElements = await page.locator('[data-test-render-count]').last()
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
      throw new Error(`Claude scraping failed: ${error}`)
    }
  }
}
