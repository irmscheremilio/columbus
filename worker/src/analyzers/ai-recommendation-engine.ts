import OpenAI from 'openai'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { WebsiteAnalysis } from './website-crawler.js'
import type { AIResponse } from '../types/ai.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface AIRecommendation {
  title: string
  description: string
  category: 'schema' | 'content' | 'technical' | 'authority'
  priority: number // 1-5 (5 = highest)
  estimatedImpact: 'low' | 'medium' | 'high'
  implementationGuide: PlatformGuide[]
  codeSnippets?: CodeSnippet[]
  estimatedTime: string
  difficulty: 'easy' | 'medium' | 'hard'
  aiPlatformSpecific?: string[] // Which AI platforms this recommendation targets
}

export interface PlatformGuide {
  platform: string
  steps: string[]
  pluginsOrTools?: string[]
}

export interface CodeSnippet {
  language: string
  code: string
  description: string
  filename?: string
}

interface KnowledgeBase {
  general: string
  chatgpt: string
  gemini: string
  claude: string
  perplexity: string
}

/**
 * AI-Powered Recommendation Engine
 * Uses OpenAI + AEO research knowledge base to generate personalized recommendations
 */
export class AIRecommendationEngine {
  private openai: OpenAI
  private knowledgeBase: KnowledgeBase

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    this.knowledgeBase = this.loadKnowledgeBase()
  }

  /**
   * Load all knowledge markdown files
   */
  private loadKnowledgeBase(): KnowledgeBase {
    const knowledgePath = join(__dirname, '..', 'knowledge')

    const loadFile = (filename: string): string => {
      const filePath = join(knowledgePath, filename)
      if (existsSync(filePath)) {
        return readFileSync(filePath, 'utf-8')
      }
      console.warn(`Knowledge file not found: ${filePath}`)
      return ''
    }

    return {
      general: loadFile('aeo-general.md'),
      chatgpt: loadFile('aeo-chatgpt.md'),
      gemini: loadFile('aeo-gemini.md'),
      claude: loadFile('aeo-claude.md'),
      perplexity: loadFile('aeo-perplexity.md')
    }
  }

  /**
   * Generate AI-powered recommendations based on website analysis
   */
  async generateRecommendations(
    websiteAnalysis: WebsiteAnalysis,
    scanResults: AIResponse[],
    productInfo?: {
      productName: string
      productDescription: string
      industry?: string
      targetAudience?: string[]
    },
    options?: {
      maxRecommendations?: number
      targetPlatforms?: ('chatgpt' | 'gemini' | 'claude' | 'perplexity')[]
    }
  ): Promise<AIRecommendation[]> {
    const maxRecs = options?.maxRecommendations || 10
    const targetPlatforms = options?.targetPlatforms || ['chatgpt', 'gemini', 'claude', 'perplexity']

    // Build context from website analysis
    const websiteContext = this.buildWebsiteContext(websiteAnalysis)
    const scanContext = this.buildScanContext(scanResults)

    // Select relevant knowledge based on target platforms
    const relevantKnowledge = this.selectRelevantKnowledge(targetPlatforms)

    const systemPrompt = `You are an expert AEO (Answer Engine Optimization) consultant with deep knowledge of how AI platforms like ChatGPT, Claude, Gemini, and Perplexity select and cite sources.

Your task is to analyze a website and generate specific, actionable recommendations to improve its visibility in AI-generated responses.

## AEO KNOWLEDGE BASE

${relevantKnowledge}

## IMPORTANT RULES

1. Generate SPECIFIC recommendations based on the actual website analysis data
2. Each recommendation must be actionable with clear implementation steps
3. Prioritize recommendations by potential impact (freshness, schema, content structure are highest impact)
4. Consider the website's tech stack when providing implementation guides
5. Focus on issues that actually exist in the website - don't make generic recommendations
6. If the site is JavaScript-heavy without SSR, this is CRITICAL (most AI crawlers can't execute JS)
7. Personalize recommendations based on the product/industry when provided
8. Target specific AI platforms when relevant (e.g., "Gemini can execute JS but others can't")

## OUTPUT FORMAT

Return a JSON array of recommendations with this structure:
{
  "recommendations": [
    {
      "title": "Short, actionable title",
      "description": "Detailed explanation of why this matters and what it achieves",
      "category": "schema|content|technical|authority",
      "priority": 5, // 1-5, where 5 is highest
      "estimatedImpact": "low|medium|high",
      "implementationGuide": [
        {
          "platform": "wordpress|shopify|nextjs|nuxt|custom",
          "steps": ["Step 1...", "Step 2..."],
          "pluginsOrTools": ["Tool 1", "Tool 2"]
        }
      ],
      "codeSnippets": [
        {
          "language": "json|html|javascript",
          "code": "actual code here",
          "description": "What this code does"
        }
      ],
      "estimatedTime": "15 minutes|1-2 hours|1-2 days",
      "difficulty": "easy|medium|hard",
      "aiPlatformSpecific": ["chatgpt", "perplexity"] // which platforms this targets, omit if all
    }
  ]
}`

    const userPrompt = `## WEBSITE ANALYSIS

${websiteContext}

${productInfo ? `## PRODUCT/BUSINESS INFORMATION
- Product Name: ${productInfo.productName}
- Description: ${productInfo.productDescription}
${productInfo.industry ? `- Industry: ${productInfo.industry}` : ''}
${productInfo.targetAudience ? `- Target Audience: ${productInfo.targetAudience.join(', ')}` : ''}
` : ''}

${scanContext ? `## CURRENT AI VISIBILITY SCAN RESULTS
${scanContext}
` : ''}

## TASK

Generate ${maxRecs} specific, prioritized recommendations to improve this website's AEO performance.
Focus on the most impactful changes first based on the actual issues found in the analysis.

Return ONLY valid JSON matching the schema above.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        console.error('[AIRecommendationEngine] Empty response from OpenAI')
        return []
      }

      const parsed = JSON.parse(content)
      const recommendations = parsed.recommendations || []

      // Validate and clean recommendations
      return recommendations.map((rec: any) => this.validateRecommendation(rec)).filter(Boolean)

    } catch (error) {
      console.error('[AIRecommendationEngine] Error generating recommendations:', error)
      // Return empty array on error - fallback to rule-based engine
      return []
    }
  }

  /**
   * Generate platform-specific recommendations
   */
  async generatePlatformSpecificRecommendations(
    websiteAnalysis: WebsiteAnalysis,
    platform: 'chatgpt' | 'gemini' | 'claude' | 'perplexity'
  ): Promise<AIRecommendation[]> {
    const platformKnowledge = {
      chatgpt: this.knowledgeBase.chatgpt,
      gemini: this.knowledgeBase.gemini,
      claude: this.knowledgeBase.claude,
      perplexity: this.knowledgeBase.perplexity
    }

    const systemPrompt = `You are an AEO expert specializing in ${platform.toUpperCase()} optimization.

## ${platform.toUpperCase()} SPECIFIC KNOWLEDGE

${platformKnowledge[platform]}

## GENERAL AEO KNOWLEDGE

${this.knowledgeBase.general}

Based on this knowledge, generate 3-5 specific recommendations for improving visibility in ${platform} responses.
Focus on ${platform}-specific optimizations (e.g., Gemini can execute JavaScript, ChatGPT prefers recent content).

Return JSON array with recommendations following the standard schema.`

    const websiteContext = this.buildWebsiteContext(websiteAnalysis)

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this website for ${platform} optimization:\n\n${websiteContext}\n\nReturn JSON with recommendations.` }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (!content) return []

      const parsed = JSON.parse(content)
      const recs = parsed.recommendations || []

      return recs.map((rec: any) => ({
        ...this.validateRecommendation(rec),
        aiPlatformSpecific: [platform]
      })).filter(Boolean)

    } catch (error) {
      console.error(`[AIRecommendationEngine] Error generating ${platform} recommendations:`, error)
      return []
    }
  }

  /**
   * Build website context string for AI prompt
   */
  private buildWebsiteContext(analysis: WebsiteAnalysis): string {
    const { techStack, schemaMarkup, contentStructure, technicalSEO, aeoReadiness, domain } = analysis

    return `### Domain: ${domain}

### Tech Stack
- Platform: ${techStack.platform || 'Unknown'}
- CMS: ${techStack.cms || 'None detected'}
- Framework: ${techStack.framework || 'None detected'}
- JS Framework: ${techStack.jsFramework || 'None detected'}
- Has SSR: ${techStack.hasSSR ? 'Yes' : 'No'}
- Has CSR: ${techStack.hasCSR ? 'Yes' : 'No'}

### Schema Markup
${schemaMarkup.length > 0
  ? schemaMarkup.map(s => `- ${s.type}`).join('\n')
  : '- No schema markup detected'}

### Content Structure
- Has H1: ${contentStructure.hasH1 ? 'Yes' : 'No'}
- H1 Count: ${contentStructure.h1Count}
- Has Semantic HTML: ${contentStructure.hasSemanticHTML ? 'Yes' : 'No'}
- Has Q&A Format: ${contentStructure.hasQAFormat ? 'Yes' : 'No'}
- Has Direct Answers: ${contentStructure.hasDirectAnswers ? 'Yes' : 'No'}
- Word Count: ${contentStructure.wordCount || 'Unknown'}

### Technical SEO
- HTTPS: ${technicalSEO.hasHTTPS ? 'Yes' : 'No'}
- Mobile Responsive: ${technicalSEO.mobileResponsive ? 'Yes' : 'No'}
- Has Sitemap: ${technicalSEO.hasSitemap ? 'Yes' : 'No'}
- Load Time: ${technicalSEO.loadTime ? `${technicalSEO.loadTime}ms` : 'Unknown'}

### AEO Readiness Score: ${aeoReadiness.score}/100

### Current Strengths
${aeoReadiness.strengths.map(s => `- ${s}`).join('\n') || '- None identified'}

### Current Weaknesses
${aeoReadiness.weaknesses.map(w => `- ${w}`).join('\n') || '- None identified'}`
  }

  /**
   * Build scan results context
   */
  private buildScanContext(scanResults: AIResponse[]): string {
    if (!scanResults || scanResults.length === 0) return ''

    const platformStats = {
      chatgpt: { mentions: 0, citations: 0, total: 0 },
      claude: { mentions: 0, citations: 0, total: 0 },
      gemini: { mentions: 0, citations: 0, total: 0 },
      perplexity: { mentions: 0, citations: 0, total: 0 }
    }

    for (const result of scanResults) {
      const platform = result.aiModel as keyof typeof platformStats
      if (platformStats[platform]) {
        platformStats[platform].total++
        if (result.brandMentioned) platformStats[platform].mentions++
        if (result.citationPresent) platformStats[platform].citations++
      }
    }

    let context = '### Visibility by Platform\n'
    for (const [platform, stats] of Object.entries(platformStats)) {
      if (stats.total > 0) {
        const mentionRate = Math.round((stats.mentions / stats.total) * 100)
        const citationRate = Math.round((stats.citations / stats.total) * 100)
        context += `- ${platform}: ${mentionRate}% mention rate, ${citationRate}% citation rate (${stats.total} tests)\n`
      }
    }

    return context
  }

  /**
   * Select relevant knowledge based on target platforms
   */
  private selectRelevantKnowledge(platforms: string[]): string {
    let knowledge = '### General AEO Best Practices\n\n'
    knowledge += this.knowledgeBase.general + '\n\n'

    if (platforms.includes('chatgpt')) {
      knowledge += '### ChatGPT/SearchGPT Specific\n\n'
      knowledge += this.knowledgeBase.chatgpt + '\n\n'
    }
    if (platforms.includes('gemini')) {
      knowledge += '### Google Gemini Specific\n\n'
      knowledge += this.knowledgeBase.gemini + '\n\n'
    }
    if (platforms.includes('claude')) {
      knowledge += '### Anthropic Claude Specific\n\n'
      knowledge += this.knowledgeBase.claude + '\n\n'
    }
    if (platforms.includes('perplexity')) {
      knowledge += '### Perplexity Specific\n\n'
      knowledge += this.knowledgeBase.perplexity + '\n\n'
    }

    return knowledge
  }

  /**
   * Validate and clean a recommendation object
   */
  private validateRecommendation(rec: any): AIRecommendation | null {
    if (!rec || !rec.title || !rec.description) {
      return null
    }

    return {
      title: String(rec.title),
      description: String(rec.description),
      category: ['schema', 'content', 'technical', 'authority'].includes(rec.category)
        ? rec.category
        : 'content',
      priority: Math.min(5, Math.max(1, parseInt(rec.priority) || 3)),
      estimatedImpact: ['low', 'medium', 'high'].includes(rec.estimatedImpact)
        ? rec.estimatedImpact
        : 'medium',
      implementationGuide: Array.isArray(rec.implementationGuide)
        ? rec.implementationGuide.map((guide: any) => ({
            platform: String(guide.platform || 'custom'),
            steps: Array.isArray(guide.steps) ? guide.steps.map(String) : [],
            pluginsOrTools: Array.isArray(guide.pluginsOrTools) ? guide.pluginsOrTools.map(String) : undefined
          }))
        : [],
      codeSnippets: Array.isArray(rec.codeSnippets)
        ? rec.codeSnippets.map((snippet: any) => ({
            language: String(snippet.language || 'text'),
            code: String(snippet.code || ''),
            description: String(snippet.description || '')
          }))
        : undefined,
      estimatedTime: String(rec.estimatedTime || '1-2 hours'),
      difficulty: ['easy', 'medium', 'hard'].includes(rec.difficulty)
        ? rec.difficulty
        : 'medium',
      aiPlatformSpecific: Array.isArray(rec.aiPlatformSpecific)
        ? rec.aiPlatformSpecific
        : undefined
    }
  }
}
