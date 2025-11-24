/**
 * Product Analyzer Factory
 * Returns the appropriate analyzer based on environment configuration
 */

import { getAIConfig } from '../config/ai.js'
import { ProductAnalyzer } from './product-analyzer.js'
import { ProductAnalyzerOpenAI } from './product-analyzer-openai.js'
import type { WebsiteAnalysis } from './website-crawler.js'

export interface ProductAnalysis {
  productName: string
  productDescription: string
  keyFeatures: string[]
  targetAudience: string
  useCases: string[]
  differentiators: string[]
  industryCategory: string
  promptSuggestions: {
    level1: string[]
    level2: string[]
    level3: string[]
  }
}

export interface IProductAnalyzer {
  analyzeProduct(
    domain: string,
    websiteAnalysis: WebsiteAnalysis,
    businessDescription?: string
  ): Promise<ProductAnalysis>
}

/**
 * Create a product analyzer based on AI configuration
 * Set AI_PROVIDER environment variable to 'openai' or 'anthropic'
 */
export function createProductAnalyzer(): IProductAnalyzer {
  const config = getAIConfig()

  console.log(`[Product Analyzer Factory] Creating analyzer with provider: ${config.provider}, model: ${config.model}`)

  if (config.provider === 'openai') {
    return new ProductAnalyzerOpenAI()
  } else if (config.provider === 'anthropic') {
    return new ProductAnalyzer()
  } else {
    throw new Error(`Unsupported AI provider: ${config.provider}`)
  }
}
