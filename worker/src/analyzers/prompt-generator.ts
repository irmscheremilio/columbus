import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import type { WebsiteAnalysis } from './website-crawler.js'

export interface GeneratedPrompt {
  promptText: string
  category: string
  granularityLevel: 1 | 2 | 3
}

export interface ProductAnalysis {
  productName: string
  productDescription: string
  keyFeatures: string[]
  targetAudience: string
  useCases: string[]
  differentiators: string[]
}

/**
 * AI-powered prompt generator
 * Analyzes website content and generates relevant search prompts
 */
export class PromptGenerator {
  private openai: OpenAI | null = null
  private anthropic: Anthropic | null = null
  private preferredModel: 'openai' | 'anthropic'

  constructor() {
    // Initialize available AI clients
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    }

    // Prefer OpenAI for cost efficiency, fallback to Anthropic
    this.preferredModel = this.openai ? 'openai' : 'anthropic'

    if (!this.openai && !this.anthropic) {
      console.warn('[Prompt Generator] No AI API keys configured. Prompt generation will use fallback.')
    }
  }

  /**
   * Analyze website content and extract product/service information
   */
  async analyzeProduct(websiteAnalysis: WebsiteAnalysis, htmlContent: string): Promise<ProductAnalysis> {
    const prompt = `Analyze this website content and extract key information about the product or service.

Website Domain: ${websiteAnalysis.domain}
H1 Title: ${websiteAnalysis.contentStructure.h1Text || 'Not found'}
Tech Stack: ${websiteAnalysis.techStack.platform} ${websiteAnalysis.techStack.cms || ''} ${websiteAnalysis.techStack.framework || ''}

HTML Content (truncated):
${htmlContent.substring(0, 8000)}

Extract and return a JSON object with:
1. productName: The name of the product/service/company
2. productDescription: A 1-2 sentence description of what they offer
3. keyFeatures: Array of 3-5 key features or benefits
4. targetAudience: Who this product/service is for
5. useCases: Array of 3-5 common use cases or problems it solves
6. differentiators: Array of 2-3 things that make this unique

Return ONLY valid JSON, no markdown or explanation.`

    try {
      const response = await this.callAI(prompt)
      return JSON.parse(response)
    } catch (error) {
      console.error('[Prompt Generator] Error analyzing product:', error)
      // Return fallback based on website analysis
      return this.getFallbackProductAnalysis(websiteAnalysis)
    }
  }

  /**
   * Generate prompts based on product analysis
   * Creates 5 prompt topics × 3 granularity levels = 15 prompts
   */
  async generatePrompts(
    productAnalysis: ProductAnalysis,
    websiteAnalysis: WebsiteAnalysis
  ): Promise<GeneratedPrompt[]> {
    const prompt = `You are an expert at understanding how real users search for solutions using AI assistants like ChatGPT, Claude, and Perplexity.

Your task: Generate 15 realistic search prompts that a user might type when looking for a solution that this product provides.

CRITICAL RULES:
1. NEVER include the product name "${productAnalysis.productName}" in any prompt
2. Each prompt must be completely unique - no templates, no patterns, no repeated structures
3. Prompts should sound like real humans typing into ChatGPT - casual, varied, sometimes with typos or informal language
4. Cover DIFFERENT angles, use cases, and user intents - not variations of the same question

Product context (use this to understand what problems to target, but NEVER mention the product):
${productAnalysis.productDescription}

Key capabilities: ${productAnalysis.keyFeatures.join(', ')}
Target users: ${productAnalysis.targetAudience}
Problems it solves: ${productAnalysis.useCases.join(', ')}

Generate 15 prompts across 3 granularity levels (5 prompts per level):

LEVEL 1 - Broad (5 prompts):
User is early in research, asking general questions about a problem space.
Examples of variety: "tools for X", "how do people handle Y", "what's the best way to Z", "I need help with...", "recommendations for..."

LEVEL 2 - Medium (5 prompts):
User knows what they want but exploring options. More specific context.
Examples of variety: asking about specific features, mentioning their tech stack, comparing approaches, asking about workflows

LEVEL 3 - Specific (5 prompts):
User has clear requirements, asking detailed questions that match exactly what this product does.
Examples of variety: mentioning specific integrations, asking about edge cases, technical implementation details, specific use case scenarios

IMPORTANT:
- Make each prompt COMPLETELY DIFFERENT in structure and wording
- Include variety: questions, statements, requests for recommendations, comparisons
- Some can be short and casual, others more detailed
- Think about different personas who might need this solution

Return ONLY a valid JSON array with exactly 15 objects:
[{"promptText": "...", "granularityLevel": 1}, ...]

No markdown, no explanation, just the JSON array.`

    try {
      const response = await this.callAI(prompt)

      // Clean up response - remove markdown code blocks if present
      let cleanResponse = response.trim()
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }

      const prompts = JSON.parse(cleanResponse)

      // Validate and normalize
      return prompts.map((p: any) => ({
        promptText: p.promptText,
        category: 'discovery', // Category determined by granularity for now
        granularityLevel: this.normalizeGranularity(p.granularityLevel)
      }))
    } catch (error) {
      console.error('[Prompt Generator] Error generating prompts:', error)
      // Return empty array - don't use hardcoded fallbacks
      console.error('[Prompt Generator] Falling back to empty prompts - AI generation failed')
      return []
    }
  }

  /**
   * Generate personalized recommendations based on AI analysis
   */
  async generatePersonalizedRecommendations(
    productAnalysis: ProductAnalysis,
    websiteAnalysis: WebsiteAnalysis
  ): Promise<string[]> {
    const prompt = `Based on this website analysis, provide 3 specific, actionable recommendations to improve AI visibility.

Product: ${productAnalysis.productName}
Description: ${productAnalysis.productDescription}
Tech Stack: ${websiteAnalysis.techStack.platform}
AEO Score: ${websiteAnalysis.aeoReadiness.score}/100

Current Issues:
${websiteAnalysis.aeoReadiness.criticalIssues.join('\n')}
${websiteAnalysis.aeoReadiness.weaknesses.join('\n')}

Current Strengths:
${websiteAnalysis.aeoReadiness.strengths.join('\n')}

Provide 3 specific recommendations tailored to ${productAnalysis.productName}. Be specific - reference their actual product and use cases. Focus on quick wins first.

Return a JSON array of 3 strings, each being a specific recommendation. Return ONLY valid JSON array.`

    try {
      const response = await this.callAI(prompt)
      return JSON.parse(response)
    } catch (error) {
      console.error('[Prompt Generator] Error generating recommendations:', error)
      return []
    }
  }

  /**
   * Call the preferred AI model
   */
  private async callAI(prompt: string): Promise<string> {
    if (this.preferredModel === 'openai' && this.openai) {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      })
      return completion.choices[0]?.message?.content || ''
    }

    if (this.anthropic) {
      const message = await this.anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
      const textBlock = message.content.find(block => block.type === 'text')
      return textBlock?.type === 'text' ? textBlock.text : ''
    }

    throw new Error('No AI client available')
  }

  private normalizeGranularity(level: any): 1 | 2 | 3 {
    const num = parseInt(level)
    if (num >= 1 && num <= 3) return num as 1 | 2 | 3
    return 1
  }

  private getFallbackProductAnalysis(websiteAnalysis: WebsiteAnalysis): ProductAnalysis {
    return {
      productName: websiteAnalysis.domain.replace(/^www\./, '').split('.')[0],
      productDescription: websiteAnalysis.contentStructure.h1Text || 'Product or service',
      keyFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
      targetAudience: 'Business professionals',
      useCases: ['Use case 1', 'Use case 2'],
      differentiators: ['Unique aspect 1']
    }
  }

}
