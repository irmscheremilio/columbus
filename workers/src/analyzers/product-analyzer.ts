import Anthropic from '@anthropic-ai/sdk'
import type { WebsiteAnalysis } from './website-crawler.js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export interface ProductAnalysis {
  productName: string
  productDescription: string
  keyFeatures: string[]
  targetAudience: string
  useCases: string[]
  differentiators: string[]
  industryCategory: string
  promptSuggestions: {
    level1: string[]  // Broad category queries
    level2: string[]  // Specific use case queries
    level3: string[]  // Detailed technical queries
  }
}

/**
 * Product Analyzer
 * Uses AI to understand what a product does and generate contextual prompts
 */
export class ProductAnalyzer {
  /**
   * Analyze a website and understand the product/service
   */
  async analyzeProduct(domain: string, websiteAnalysis: WebsiteAnalysis): Promise<ProductAnalysis> {
    console.log(`[Product Analyzer] Analyzing product for ${domain}`)

    // Build context from website analysis
    const context = this.buildWebsiteContext(domain, websiteAnalysis)

    // Use Claude to understand the product
    const prompt = `You are analyzing a website to understand what product or service it offers. Your goal is to deeply understand the business so we can generate relevant search prompts that potential customers might use.

Website: ${domain}

Context from website analysis:
${context}

Please analyze this website and provide a comprehensive product understanding in JSON format:

{
  "productName": "The main product/service name",
  "productDescription": "A clear 2-3 sentence description of what the product does and who it's for",
  "keyFeatures": ["feature1", "feature2", "feature3"],
  "targetAudience": "Who is the primary target audience",
  "useCases": ["use case 1", "use case 2", "use case 3"],
  "differentiators": ["What makes this unique from competitors"],
  "industryCategory": "Industry or category (e.g., 'Marketing SaaS', 'E-commerce', etc.)",
  "promptSuggestions": {
    "level1": ["3-5 broad category queries that someone might search"],
    "level2": ["3-5 more specific use case queries"],
    "level3": ["3-5 highly detailed technical/feature queries"]
  }
}

For the prompt suggestions:
- Level 1: Broad questions about the general category (e.g., "What tool can I use for mock data")
- Level 2: More specific about the use case (e.g., "What tool can I use to generate mock data with AI")
- Level 3: Very specific about implementation (e.g., "What tool can I use to generate mock data with AI and directly integrate it")

Make the prompts natural questions that real users would ask AI assistants like ChatGPT or Claude.

Respond ONLY with the JSON object, no other text.`

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        // Parse the JSON response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('Could not parse JSON from Claude response')
        }

        const analysis: ProductAnalysis = JSON.parse(jsonMatch[0])

        console.log(`[Product Analyzer] Analysis complete for ${domain}`)
        console.log(`  - Product: ${analysis.productName}`)
        console.log(`  - Generated ${analysis.promptSuggestions.level1.length} L1 prompts`)
        console.log(`  - Generated ${analysis.promptSuggestions.level2.length} L2 prompts`)
        console.log(`  - Generated ${analysis.promptSuggestions.level3.length} L3 prompts`)

        return analysis
      }

      throw new Error('Unexpected response format from Claude')
    } catch (error) {
      console.error('[Product Analyzer] Error:', error)
      throw error
    }
  }

  /**
   * Build context string from website analysis
   */
  private buildWebsiteContext(domain: string, analysis: WebsiteAnalysis): string {
    const parts: string[] = []

    // Add tech stack info
    if (analysis.techStack.length > 0) {
      parts.push(`Technologies: ${analysis.techStack.join(', ')}`)
    }

    // Add schema markup (structured data about the business)
    if (analysis.schemaMarkup.length > 0) {
      const schemas = analysis.schemaMarkup.map((s: any) => s['@type']).join(', ')
      parts.push(`Structured data types: ${schemas}`)
    }

    // Add content structure
    if (analysis.contentStructure.headings.length > 0) {
      parts.push(`Main headings: ${analysis.contentStructure.headings.slice(0, 5).join(', ')}`)
    }

    // Add meta description if available
    if (analysis.technicalSEO.metaDescription) {
      parts.push(`Meta description: ${analysis.technicalSEO.metaDescription}`)
    }

    // Add title if available
    if (analysis.technicalSEO.title) {
      parts.push(`Page title: ${analysis.technicalSEO.title}`)
    }

    return parts.join('\n')
  }

  /**
   * Generate prompts at specific granularity level based on product
   */
  generatePromptsForLevel(
    productAnalysis: ProductAnalysis,
    level: 1 | 2 | 3,
    parentPrompt?: string
  ): string[] {
    switch (level) {
      case 1:
        return productAnalysis.promptSuggestions.level1
      case 2:
        return productAnalysis.promptSuggestions.level2
      case 3:
        return productAnalysis.promptSuggestions.level3
      default:
        return []
    }
  }
}
