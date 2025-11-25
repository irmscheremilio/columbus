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
    const prompt = `You are generating search prompts that users would type into AI assistants (ChatGPT, Claude, Perplexity) when looking for a SOLUTION to their problem.

IMPORTANT: These prompts must NOT contain the product name "${productAnalysis.productName}".
The goal is to see if AI recommends this product when users search for solutions - not when they search for the product directly.

Product being analyzed (DO NOT include this name in prompts):
- Name: ${productAnalysis.productName}
- What it does: ${productAnalysis.productDescription}
- Key Features: ${productAnalysis.keyFeatures.join(', ')}
- Target Audience: ${productAnalysis.targetAudience}
- Problems it solves: ${productAnalysis.useCases.join(', ')}

Generate exactly 5 different problem/solution TOPICS that this product addresses. For each topic, create 3 prompts at different granularity levels:

- Level 1 (Broad): General problem question without specifics
  Example: "What can I use for mock data?"

- Level 2 (Medium): More specific, adding one key qualifier
  Example: "What can I use for AI generated mock data?"

- Level 3 (Specific): Highly specific with multiple details matching the product's features
  Example: "What can I use for AI generated mock data that I can integrate into my frontend code?"

The prompts should sound like real questions people ask AI assistants:
- Start with "What", "How", "Best", "Is there", "What's a good", etc.
- Focus on the PROBLEM the user is trying to solve
- NEVER mention the product name "${productAnalysis.productName}"
- Each level should add more specificity that matches the product's actual features

Return a JSON array with exactly 15 objects:
[
  {"promptText": "...", "category": "discovery", "granularityLevel": 1},
  {"promptText": "...", "category": "discovery", "granularityLevel": 2},
  {"promptText": "...", "category": "discovery", "granularityLevel": 3},
  // ... repeat for 5 topics
]

Categories to use:
- discovery: Finding solutions to a problem
- comparison: Comparing approaches or tools
- howto: How to accomplish something
- recommendation: Asking for recommendations
- technical: Technical implementation questions

Return ONLY valid JSON array, no explanation.`

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
    const validCategories = ['discovery', 'comparison', 'howto', 'recommendation', 'technical']
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
    // Extract key terms from product description for generic fallback
    const description = productAnalysis.productDescription.toLowerCase()
    const useCases = productAnalysis.useCases

    // Try to identify the core problem/solution from the product
    const primaryUseCase = useCases[0] || 'this problem'
    const secondaryUseCase = useCases[1] || 'similar tasks'

    return [
      // Topic 1: General solution discovery
      { promptText: `What tools can help with ${primaryUseCase}`, category: 'discovery', granularityLevel: 1 },
      { promptText: `Best solutions for ${primaryUseCase} in 2025`, category: 'discovery', granularityLevel: 2 },
      { promptText: `What's the best way to handle ${primaryUseCase} for ${productAnalysis.targetAudience}`, category: 'discovery', granularityLevel: 3 },
      // Topic 2: How-to questions
      { promptText: `How do I ${primaryUseCase}`, category: 'howto', granularityLevel: 1 },
      { promptText: `How to automate ${primaryUseCase}`, category: 'howto', granularityLevel: 2 },
      { promptText: `Step by step guide to ${primaryUseCase} efficiently`, category: 'howto', granularityLevel: 3 },
      // Topic 3: Recommendations
      { promptText: `What do you recommend for ${secondaryUseCase}`, category: 'recommendation', granularityLevel: 1 },
      { promptText: `Best tools for ${secondaryUseCase}`, category: 'recommendation', granularityLevel: 2 },
      { promptText: `What's a good solution for ${secondaryUseCase} that's easy to use`, category: 'recommendation', granularityLevel: 3 },
      // Topic 4: Comparison
      { promptText: `What are my options for ${primaryUseCase}`, category: 'comparison', granularityLevel: 1 },
      { promptText: `Compare different approaches to ${primaryUseCase}`, category: 'comparison', granularityLevel: 2 },
      { promptText: `What's better for ${primaryUseCase}: manual approach or using a tool`, category: 'comparison', granularityLevel: 3 },
      // Topic 5: Technical
      { promptText: `Is there a tool for ${primaryUseCase}`, category: 'technical', granularityLevel: 1 },
      { promptText: `Software that helps with ${primaryUseCase}`, category: 'technical', granularityLevel: 2 },
      { promptText: `What tool integrates well for ${primaryUseCase} in my workflow`, category: 'technical', granularityLevel: 3 }
    ]
  }
}
