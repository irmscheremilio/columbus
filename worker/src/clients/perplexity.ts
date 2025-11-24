import { chromium } from 'playwright'
import { BaseAIClient } from './base.js'
import type { AIModel, AIResponse } from '../types/ai.js'

/**
 * Perplexity Client using Playwright for web scraping
 *
 * Key insights:
 * - 6.6% citation share goes to Reddit (#1 source)
 * - Average 5.28 citations per response
 * - 60% overlap with Google top 10 organic results
 * - Transparent citation model - ALWAYS shows source URLs (easiest to scrape)
 * - Only 25% overlap with ChatGPT (distinct optimization opportunities)
 * - Does NOT execute JavaScript
 * - 15+ million monthly active users
 */
export class PerplexityClient extends BaseAIClient {
  model: AIModel = 'perplexity'

  async testPrompt(prompt: string, brandName: string, competitors: string[]): Promise<AIResponse> {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    try {
      // Navigate to Perplexity
      await page.goto('https://www.perplexity.ai/', { waitUntil: 'networkidle' })

      // Perplexity allows searches without login
      // Look for the search input
      const searchInput = await page.waitForSelector('textarea[placeholder*="Ask"]', { timeout: 10000 })

      // Type the prompt
      await searchInput.click()
      await searchInput.fill(prompt)

      // Submit (Enter key)
      await page.keyboard.press('Enter')

      // Wait for response to complete
      // Perplexity shows citations while loading
      await page.waitForTimeout(20000) // Wait for full response
      // TODO: Better detection - wait for "Ask a follow-up" to appear

      // Extract response text
      const responseElement = await page.locator('[class*="answer"]').last()
      const responseText = await responseElement.innerText()

      // Extract citations - Perplexity shows them as numbered references
      const citationElements = await page.locator('[class*="citation"]').all()
      const citations = []

      for (let i = 0; i < citationElements.length; i++) {
        const citation = citationElements[i]
        const url = await citation.getAttribute('href')
        const title = await citation.innerText()

        if (url) {
          citations.push({
            url: url.trim(),
            title: title?.trim(),
            position: i + 1
          })
        }
      }

      // Extract mentions and competitor data
      const mentionData = this.extractMentions(responseText, brandName)
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
          transparentCitations: true // Perplexity always shows sources
        },
        testedAt: new Date()
      }
    } catch (error) {
      await browser.close()
      throw new Error(`Perplexity scraping failed: ${error}`)
    }
  }
}
