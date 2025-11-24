import { chromium } from 'playwright'
import type { Page } from 'playwright'

export interface WebsiteAnalysis {
  domain: string
  techStack: TechStack
  schemaMarkup: SchemaMarkup[]
  contentStructure: ContentStructure
  technicalSEO: TechnicalSEO
  aeoReadiness: AEOReadiness
  analyzedAt: Date
}

export interface TechStack {
  platform: string // 'wordpress', 'shopify', 'webflow', 'custom', 'nextjs', 'nuxt', etc.
  framework?: string
  cms?: string
  jsFramework?: string
  hasSSR: boolean // Server-Side Rendering detected
  hasCSR: boolean // Client-Side Rendering only
}

export interface SchemaMarkup {
  type: string // 'Organization', 'FAQPage', 'HowTo', 'Article', etc.
  isValid: boolean
  location: string // 'head', 'body'
  data: any
}

export interface ContentStructure {
  hasH1: boolean
  h1Count: number
  h1Text?: string
  hasSemanticHTML: boolean // <article>, <section>, <header>, etc.
  hasQAFormat: boolean // Question-based headings with answers
  avgParagraphLength: number
  wordCount: number
  hasDirectAnswers: boolean // 40-60 word summaries detected
}

export interface TechnicalSEO {
  hasHTTPS: boolean
  loadTime: number // in ms
  mobileResponsive: boolean
  hasSitemap: boolean
  hasRobotsTxt: boolean
  coreWebVitals: {
    lcp?: number // Largest Contentful Paint
    fid?: number // First Input Delay
    cls?: number // Cumulative Layout Shift
  }
}

export interface AEOReadiness {
  score: number // 0-100
  strengths: string[]
  weaknesses: string[]
  criticalIssues: string[]
  recommendations: string[]
}

/**
 * Crawl and analyze a website for AEO optimization opportunities
 */
export class WebsiteCrawler {
  async analyze(domain: string): Promise<WebsiteAnalysis> {
    const url = domain.startsWith('http') ? domain : `https://${domain}`

    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    try {
      console.log(`[Website Crawler] Analyzing ${url}...`)

      // Navigate and measure load time
      const startTime = Date.now()
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      const loadTime = Date.now() - startTime

      // Run all analyses in parallel
      const [
        techStack,
        schemaMarkup,
        contentStructure,
        technicalSEO
      ] = await Promise.all([
        this.detectTechStack(page),
        this.extractSchemaMarkup(page),
        this.analyzeContentStructure(page),
        this.analyzeTechnicalSEO(page, url, loadTime)
      ])

      // Calculate AEO readiness score
      const aeoReadiness = this.calculateAEOReadiness({
        techStack,
        schemaMarkup,
        contentStructure,
        technicalSEO
      })

      await browser.close()

      return {
        domain,
        techStack,
        schemaMarkup,
        contentStructure,
        technicalSEO,
        aeoReadiness,
        analyzedAt: new Date()
      }
    } catch (error) {
      await browser.close()
      throw new Error(`Failed to analyze website: ${error}`)
    }
  }

  /**
   * Detect tech stack (WordPress, Shopify, Next.js, etc.)
   */
  private async detectTechStack(page: Page): Promise<TechStack> {
    const html = await page.content()
    const metaTags = await page.locator('meta').all()

    let platform = 'custom'
    let framework: string | undefined
    let cms: string | undefined
    let jsFramework: string | undefined
    let hasSSR = false
    let hasCSR = false

    // Check for WordPress
    if (html.includes('wp-content') || html.includes('wp-includes')) {
      platform = 'wordpress'
      cms = 'WordPress'
    }

    // Check for Shopify
    if (html.includes('Shopify') || html.includes('cdn.shopify.com')) {
      platform = 'shopify'
      cms = 'Shopify'
    }

    // Check for Webflow
    if (html.includes('webflow') || html.includes('wf-page')) {
      platform = 'webflow'
      cms = 'Webflow'
    }

    // Check for Wix
    if (html.includes('wix.com') || html.includes('_wix')) {
      platform = 'wix'
      cms = 'Wix'
    }

    // Check for Next.js
    if (html.includes('__NEXT_DATA__') || html.includes('_next/')) {
      framework = 'Next.js'
      jsFramework = 'React'
      hasSSR = true
    }

    // Check for Nuxt
    if (html.includes('__NUXT__') || html.includes('_nuxt/')) {
      framework = 'Nuxt'
      jsFramework = 'Vue'
      hasSSR = true
    }

    // Check for React (CSR)
    if (html.includes('react') && !hasSSR) {
      jsFramework = 'React'
      hasCSR = true
    }

    // Check for Vue (CSR)
    if (html.includes('vue') && !hasSSR) {
      jsFramework = 'Vue'
      hasCSR = true
    }

    // Check for Angular
    if (html.includes('ng-version')) {
      jsFramework = 'Angular'
      hasCSR = true
    }

    // Check generator meta tag
    for (const meta of metaTags) {
      const name = await meta.getAttribute('name')
      const content = await meta.getAttribute('content')

      if (name === 'generator' && content) {
        if (content.includes('WordPress')) {
          platform = 'wordpress'
          cms = 'WordPress'
        } else if (content.includes('Shopify')) {
          platform = 'shopify'
          cms = 'Shopify'
        }
      }
    }

    return {
      platform,
      framework,
      cms,
      jsFramework,
      hasSSR,
      hasCSR
    }
  }

  /**
   * Extract and validate schema markup
   */
  private async extractSchemaMarkup(page: Page): Promise<SchemaMarkup[]> {
    const schemas: SchemaMarkup[] = []

    // Find all script tags with type="application/ld+json"
    const schemaScripts = await page.locator('script[type="application/ld+json"]').all()

    for (const script of schemaScripts) {
      try {
        const content = await script.innerText()
        const data = JSON.parse(content)

        const type = data['@type'] || 'Unknown'
        const location = await this.getElementLocation(script)

        schemas.push({
          type,
          isValid: true, // Basic validation - could be more thorough
          location,
          data
        })
      } catch (error) {
        // Invalid JSON
        schemas.push({
          type: 'Unknown',
          isValid: false,
          location: 'unknown',
          data: null
        })
      }
    }

    return schemas
  }

  /**
   * Analyze content structure for AEO optimization
   */
  private async analyzeContentStructure(page: Page): Promise<ContentStructure> {
    // H1 analysis
    const h1Elements = await page.locator('h1').all()
    const hasH1 = h1Elements.length > 0
    const h1Count = h1Elements.length
    const h1Text = hasH1 ? await h1Elements[0].innerText() : undefined

    // Semantic HTML check
    const hasArticle = (await page.locator('article').count()) > 0
    const hasSection = (await page.locator('section').count()) > 0
    const hasHeader = (await page.locator('header').count()) > 0
    const hasSemanticHTML = hasArticle && hasSection && hasHeader

    // Check for Q&A format
    const headings = await page.locator('h2, h3').all()
    let questionHeadings = 0
    for (const heading of headings) {
      const text = await heading.innerText()
      if (text.includes('?') || text.toLowerCase().startsWith('what') ||
          text.toLowerCase().startsWith('how') || text.toLowerCase().startsWith('why')) {
        questionHeadings++
      }
    }
    const hasQAFormat = questionHeadings >= 2

    // Word count and paragraph analysis
    const bodyText = await page.locator('main, article, body').first().innerText()
    const wordCount = bodyText.split(/\s+/).length

    const paragraphs = await page.locator('p').all()
    let totalWords = 0
    for (const p of paragraphs) {
      const text = await p.innerText()
      totalWords += text.split(/\s+/).length
    }
    const avgParagraphLength = paragraphs.length > 0 ? Math.round(totalWords / paragraphs.length) : 0

    // Check for direct answers (40-60 word summaries after headings)
    let hasDirectAnswers = false
    for (const heading of headings.slice(0, 5)) { // Check first 5 headings
      try {
        const nextElement = await heading.evaluateHandle(el => el.nextElementSibling)
        const nextText = await nextElement.asElement()?.innerText()
        if (nextText) {
          const words = nextText.split(/\s+/).length
          if (words >= 40 && words <= 80) {
            hasDirectAnswers = true
            break
          }
        }
      } catch (e) {
        // Skip if can't find next element
      }
    }

    return {
      hasH1,
      h1Count,
      h1Text,
      hasSemanticHTML,
      hasQAFormat,
      avgParagraphLength,
      wordCount,
      hasDirectAnswers
    }
  }

  /**
   * Analyze technical SEO factors
   */
  private async analyzeTechnicalSEO(page: Page, url: string, loadTime: number): Promise<TechnicalSEO> {
    const hasHTTPS = url.startsWith('https://')

    // Check mobile responsiveness
    const viewport = page.viewportSize()
    const mobileResponsive = viewport ? viewport.width >= 320 : false

    // Check for sitemap and robots.txt
    const domain = new URL(url).origin
    let hasSitemap = false
    let hasRobotsTxt = false

    try {
      const sitemapResponse = await page.context().request.get(`${domain}/sitemap.xml`)
      hasSitemap = sitemapResponse.ok()
    } catch (e) {
      hasSitemap = false
    }

    try {
      const robotsResponse = await page.context().request.get(`${domain}/robots.txt`)
      hasRobotsTxt = robotsResponse.ok()
    } catch (e) {
      hasRobotsTxt = false
    }

    // Core Web Vitals (basic approximation)
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        lcp: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        fid: 0, // Would need real user interaction to measure
        cls: 0  // Would need layout shift observation
      }
    })

    return {
      hasHTTPS,
      loadTime,
      mobileResponsive,
      hasSitemap,
      hasRobotsTxt,
      coreWebVitals: metrics
    }
  }

  /**
   * Calculate AEO readiness score and generate recommendations
   */
  private calculateAEOReadiness(analysis: {
    techStack: TechStack
    schemaMarkup: SchemaMarkup[]
    contentStructure: ContentStructure
    technicalSEO: TechnicalSEO
  }): AEOReadiness {
    let score = 0
    const strengths: string[] = []
    const weaknesses: string[] = []
    const criticalIssues: string[] = []
    const recommendations: string[] = []

    // Tech Stack scoring (20 points)
    if (analysis.techStack.hasSSR) {
      score += 20
      strengths.push('Server-side rendering detected - excellent for AI crawlers')
    } else if (analysis.techStack.hasCSR) {
      criticalIssues.push('Client-side rendering only - AI crawlers cannot execute JavaScript')
      recommendations.push('Implement Server-Side Rendering (SSR) or Static Site Generation (SSG)')
    } else {
      score += 15
    }

    // Schema Markup scoring (25 points)
    const hasFAQSchema = analysis.schemaMarkup.some(s => s.type === 'FAQPage')
    const hasArticleSchema = analysis.schemaMarkup.some(s => s.type === 'Article' || s.type === 'BlogPosting')
    const hasOrgSchema = analysis.schemaMarkup.some(s => s.type === 'Organization')

    if (hasFAQSchema) {
      score += 10
      strengths.push('FAQ schema implemented')
    } else {
      weaknesses.push('Missing FAQ schema')
      recommendations.push('Add FAQPage schema for Q&A content')
    }

    if (hasArticleSchema) {
      score += 8
      strengths.push('Article schema implemented')
    } else {
      recommendations.push('Add Article/BlogPosting schema to content pages')
    }

    if (hasOrgSchema) {
      score += 7
      strengths.push('Organization schema implemented')
    } else {
      recommendations.push('Add Organization schema to establish brand identity')
    }

    // Content Structure scoring (30 points)
    if (analysis.contentStructure.hasH1 && analysis.contentStructure.h1Count === 1) {
      score += 8
      strengths.push('Proper H1 structure (single H1 per page)')
    } else if (analysis.contentStructure.h1Count > 1) {
      weaknesses.push('Multiple H1 tags found')
      recommendations.push('Use only one H1 per page')
    } else {
      criticalIssues.push('No H1 tag found')
      recommendations.push('Add an H1 tag to every page')
    }

    if (analysis.contentStructure.hasSemanticHTML) {
      score += 7
      strengths.push('Semantic HTML5 elements used')
    } else {
      recommendations.push('Use semantic HTML (<article>, <section>, <header>)')
    }

    if (analysis.contentStructure.hasQAFormat) {
      score += 8
      strengths.push('Question-based content structure detected')
    } else {
      weaknesses.push('No Q&A format detected')
      recommendations.push('Add question-based headings (What, How, Why)')
    }

    if (analysis.contentStructure.hasDirectAnswers) {
      score += 7
      strengths.push('Direct answer format detected (40-60 words)')
    } else {
      recommendations.push('Add concise 40-60 word answers after question headings')
    }

    // Technical SEO scoring (25 points)
    if (analysis.technicalSEO.hasHTTPS) {
      score += 10
      strengths.push('HTTPS enabled')
    } else {
      criticalIssues.push('No HTTPS - security required for AI trust')
      recommendations.push('Enable HTTPS immediately')
    }

    if (analysis.technicalSEO.loadTime < 2000) {
      score += 8
      strengths.push(`Fast load time (${analysis.technicalSEO.loadTime}ms)`)
    } else if (analysis.technicalSEO.loadTime < 5000) {
      score += 4
      weaknesses.push('Moderate load time')
      recommendations.push('Optimize page speed to under 2 seconds')
    } else {
      weaknesses.push('Slow load time')
      recommendations.push('Critical: Improve page speed (currently >5s)')
    }

    if (analysis.technicalSEO.hasSitemap) {
      score += 4
      strengths.push('Sitemap.xml present')
    } else {
      recommendations.push('Add sitemap.xml for better discoverability')
    }

    if (analysis.technicalSEO.hasRobotsTxt) {
      score += 3
      strengths.push('Robots.txt present')
    } else {
      recommendations.push('Add robots.txt to guide AI crawlers')
    }

    return {
      score: Math.min(100, score),
      strengths,
      weaknesses,
      criticalIssues,
      recommendations
    }
  }

  private async getElementLocation(element: any): Promise<string> {
    try {
      const parent = await element.evaluateHandle((el: Element) => el.parentElement?.tagName)
      const parentTag = await parent.jsonValue()
      return parentTag === 'HEAD' ? 'head' : 'body'
    } catch {
      return 'unknown'
    }
  }
}
