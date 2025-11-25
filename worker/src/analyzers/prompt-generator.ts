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
    const prompt = `Generate search prompts that users might type into AI assistants (ChatGPT, Claude, Perplexity) when looking for a product/service like this:

Product: ${productAnalysis.productName}
Description: ${productAnalysis.productDescription}
Key Features: ${productAnalysis.keyFeatures.join(', ')}
Target Audience: ${productAnalysis.targetAudience}
Use Cases: ${productAnalysis.useCases.join(', ')}
Industry/Category: ${websiteAnalysis.techStack.platform === 'shopify' ? 'E-commerce' : 'SaaS/Service'}

Generate exactly 5 different prompt TOPICS, each with 3 granularity levels:
- Level 1 (Broad): General category questions (e.g., "best project management tools")
- Level 2 (Medium): More specific with context (e.g., "project management software for remote teams")
- Level 3 (Specific): Highly specific with details (e.g., "project management tool with time tracking and Slack integration for startups")

Return a JSON array with exactly 15 objects:
[
  {"promptText": "...", "category": "discovery|comparison|features|pricing|reviews", "granularityLevel": 1},
  {"promptText": "...", "category": "...", "granularityLevel": 2},
  {"promptText": "...", "category": "...", "granularityLevel": 3},
  // ... repeat for 5 topics
]

Categories:
- discovery: Finding solutions to a problem
- comparison: Comparing options/alternatives
- features: Specific feature questions
- pricing: Cost and value questions
- reviews: Reputation and trust questions

Make prompts natural - how real users ask AI assistants. Return ONLY valid JSON array.`

    try {
      const response = await this.callAI(prompt)
      const prompts = JSON.parse(response)

      // Validate and normalize
      return prompts.map((p: any) => ({
        promptText: p.promptText,
        category: this.normalizeCategory(p.category),
        granularityLevel: this.normalizeGranularity(p.granularityLevel)
      }))
    } catch (error) {
      console.error('[Prompt Generator] Error generating prompts:', error)
      return this.getFallbackPrompts(productAnalysis)
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

  private normalizeCategory(category: string): string {
    const validCategories = ['discovery', 'comparison', 'features', 'pricing', 'reviews']
    const lower = category?.toLowerCase() || 'discovery'
    return validCategories.includes(lower) ? lower : 'discovery'
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

  private getFallbackPrompts(productAnalysis: ProductAnalysis): GeneratedPrompt[] {
    const name = productAnalysis.productName
    const category = 'discovery'

    return [
      // Topic 1: Discovery
      { promptText: `best ${name} alternatives`, category, granularityLevel: 1 },
      { promptText: `${name} vs competitors comparison`, category: 'comparison', granularityLevel: 2 },
      { promptText: `is ${name} good for small businesses in 2025`, category: 'comparison', granularityLevel: 3 },
      // Topic 2: Features
      { promptText: `what does ${name} do`, category: 'features', granularityLevel: 1 },
      { promptText: `${name} main features and benefits`, category: 'features', granularityLevel: 2 },
      { promptText: `does ${name} have integrations with other tools`, category: 'features', granularityLevel: 3 },
      // Topic 3: Pricing
      { promptText: `${name} pricing`, category: 'pricing', granularityLevel: 1 },
      { promptText: `how much does ${name} cost per month`, category: 'pricing', granularityLevel: 2 },
      { promptText: `${name} free trial or free plan available`, category: 'pricing', granularityLevel: 3 },
      // Topic 4: Reviews
      { promptText: `${name} reviews`, category: 'reviews', granularityLevel: 1 },
      { promptText: `what do people say about ${name}`, category: 'reviews', granularityLevel: 2 },
      { promptText: `${name} customer testimonials and case studies`, category: 'reviews', granularityLevel: 3 },
      // Topic 5: Use cases
      { promptText: `who uses ${name}`, category: 'discovery', granularityLevel: 1 },
      { promptText: `${name} use cases and examples`, category: 'discovery', granularityLevel: 2 },
      { promptText: `how can ${name} help my business grow`, category: 'discovery', granularityLevel: 3 }
    ]
  }
}
