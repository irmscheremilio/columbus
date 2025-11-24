import OpenAI from 'openai'
import type { WebsiteAnalysis } from './website-crawler.js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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
 * Product Analyzer using OpenAI GPT-4o-mini
 * Uses AI to understand what a product does and generate contextual prompts
 */
export class ProductAnalyzerOpenAI {
  /**
   * Analyze a website and understand the product/service
   */
  async analyzeProduct(
    domain: string,
    websiteAnalysis: WebsiteAnalysis,
    businessDescription?: string
  ): Promise<ProductAnalysis> {
    console.log(`[Product Analyzer] Analyzing product for ${domain}`)

    // Build context from website analysis
    const websiteContext = this.buildWebsiteContext(domain, websiteAnalysis)

    // Build the full context including user-provided description
    let contextSection = websiteContext
    if (businessDescription) {
      contextSection = `User-provided description: "${businessDescription}"\n\n${websiteContext}`
    }

    // Use GPT-4o-mini to understand the product
    const prompt = `You are analyzing a website to understand what product or service it offers. Your goal is to deeply understand the business so we can generate relevant search prompts that potential customers might use when searching on AI assistants like ChatGPT, Claude, or Perplexity.

Website: ${domain}

Context:
${contextSection}

Please analyze this website and provide a comprehensive product understanding in JSON format:

{
  "productName": "The main product/service name",
  "productDescription": "A clear 2-3 sentence description of what the product does and who it's for",
  "keyFeatures": ["feature1", "feature2", "feature3", "feature4"],
  "targetAudience": "Who is the primary target audience",
  "useCases": ["use case 1", "use case 2", "use case 3"],
  "differentiators": ["What makes this unique from competitors"],
  "industryCategory": "Industry or category (e.g., 'Marketing SaaS', 'E-commerce', etc.)",
  "promptSuggestions": {
    "level1": ["4-5 broad category queries that someone might search"],
    "level2": ["4-5 more specific use case queries"],
    "level3": ["4-5 highly detailed technical/feature queries"]
  }
}

For the prompt suggestions, follow the granularity pattern:
- **Level 1 (Broad)**: General category questions (e.g., "What tool can I use for mock data")
- **Level 2 (Specific)**: More specific about the use case (e.g., "What tool can I use to generate mock data with AI")
- **Level 3 (Detailed)**: Very specific about implementation/features (e.g., "What tool can I use to generate mock data with AI and directly integrate it into my frontend code")

Important: Make the prompts natural questions that real users would ask. They should reflect how people actually search for solutions like this product.

Respond ONLY with the valid JSON object, no other text or markdown formatting.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      const analysis: ProductAnalysis = JSON.parse(content)

      console.log(`[Product Analyzer] Analysis complete for ${domain}`)
      console.log(`  - Product: ${analysis.productName}`)
      console.log(`  - Generated ${analysis.promptSuggestions.level1.length} L1 prompts`)
      console.log(`  - Generated ${analysis.promptSuggestions.level2.length} L2 prompts`)
      console.log(`  - Generated ${analysis.promptSuggestions.level3.length} L3 prompts`)

      return analysis
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
}
