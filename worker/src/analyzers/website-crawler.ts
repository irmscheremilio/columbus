import * as cheerio from 'cheerio'

export interface WebsiteAnalysis {
  domain: string
  techStack: TechStack
  schemaMarkup: SchemaMarkup[]
  contentStructure: ContentStructure
  technicalSEO: TechnicalSEO
  aeoReadiness: AEOReadiness
  analyzedAt: Date
  rawHtml: string // For AI analysis
  textContent: string // Extracted text for prompt generation
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
 * Uses simple HTTP fetch + cheerio instead of browser automation
 */
export class WebsiteCrawler {
  async analyze(domain: string): Promise<WebsiteAnalysis> {
    const url = domain.startsWith('http') ? domain : `https://${domain}`

    console.log(`[Website Crawler] Analyzing ${url}...`)

    // Fetch the page and measure load time
    const startTime = Date.now()
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ColumbusAEO/1.0; +https://columbus.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    const loadTime = Date.now() - startTime

    return this.analyzeHtmlWithLoadTime(html, url, loadTime)
  }

  /**
   * Analyze pre-fetched HTML content
   * Useful for analyzing pages that have already been fetched
   */
  async analyzeHtml(html: string, url: string): Promise<WebsiteAnalysis> {
    // Use a default load time since we don't have the actual measurement
    return this.analyzeHtmlWithLoadTime(html, url, 1000)
  }

  /**
   * Internal method to analyze HTML with load time
   */
  private async analyzeHtmlWithLoadTime(html: string, url: string, loadTime: number): Promise<WebsiteAnalysis> {
    const $ = cheerio.load(html)
    const domain = new URL(url).hostname

    // Run all analyses
    const techStack = this.detectTechStack($, html)
    const schemaMarkup = this.extractSchemaMarkup($)
    const contentStructure = this.analyzeContentStructure($)
    const technicalSEO = await this.analyzeTechnicalSEO($, url, loadTime)

    // Calculate AEO readiness score
    const aeoReadiness = this.calculateAEOReadiness({
      techStack,
      schemaMarkup,
      contentStructure,
      technicalSEO,
    })

    // Extract text content for AI analysis
    const textContent = this.extractTextContent($)

    return {
      domain,
      techStack,
      schemaMarkup,
      contentStructure,
      technicalSEO,
      aeoReadiness,
      analyzedAt: new Date(),
      rawHtml: html,
      textContent,
    }
  }

  /**
   * Extract clean text content from HTML for AI analysis
   */
  private extractTextContent($: cheerio.CheerioAPI): string {
    // Remove script, style, and navigation elements
    $('script, style, nav, header, footer, aside, .nav, .menu, .sidebar').remove()

    // Get text from main content areas
    const mainContent = $('main, article, .content, #content, [role="main"]').first()
    let text = ''

    if (mainContent.length > 0) {
      text = mainContent.text()
    } else {
      text = $('body').text()
    }

    // Clean up whitespace
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .substring(0, 15000) // Limit for AI processing
  }

  /**
   * Detect tech stack (WordPress, Shopify, Next.js, etc.)
   */
  private detectTechStack($: cheerio.CheerioAPI, html: string): TechStack {
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

    // Check for Squarespace
    if (html.includes('squarespace') || html.includes('static1.squarespace.com')) {
      platform = 'squarespace'
      cms = 'Squarespace'
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

    // Check for Gatsby
    if (html.includes('___gatsby') || html.includes('gatsby-')) {
      framework = 'Gatsby'
      jsFramework = 'React'
      hasSSR = true // Static generation
    }

    // Check for React (CSR)
    if ((html.includes('react') || html.includes('React')) && !hasSSR) {
      jsFramework = 'React'
      hasCSR = true
    }

    // Check for Vue (CSR)
    if (html.includes('vue') && !hasSSR) {
      jsFramework = 'Vue'
      hasCSR = true
    }

    // Check for Angular
    if (html.includes('ng-version') || html.includes('ng-app')) {
      jsFramework = 'Angular'
      hasCSR = true
    }

    // Check generator meta tag
    const generator = $('meta[name="generator"]').attr('content')
    if (generator) {
      if (generator.includes('WordPress')) {
        platform = 'wordpress'
        cms = 'WordPress'
      } else if (generator.includes('Shopify')) {
        platform = 'shopify'
        cms = 'Shopify'
      } else if (generator.includes('Drupal')) {
        platform = 'drupal'
        cms = 'Drupal'
      }
    }

    return {
      platform,
      framework,
      cms,
      jsFramework,
      hasSSR,
      hasCSR,
    }
  }

  /**
   * Extract and validate schema markup
   */
  private extractSchemaMarkup($: cheerio.CheerioAPI): SchemaMarkup[] {
    const schemas: SchemaMarkup[] = []

    // Find all script tags with type="application/ld+json"
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const content = $(element).html()
        if (!content) return

        const data = JSON.parse(content)

        // Handle arrays of schemas
        const items = Array.isArray(data) ? data : [data]

        for (const item of items) {
          const type = item['@type'] || 'Unknown'
          const isInHead = $(element).parent('head').length > 0

          schemas.push({
            type: Array.isArray(type) ? type.join(', ') : type,
            isValid: true,
            location: isInHead ? 'head' : 'body',
            data: item,
          })
        }
      } catch {
        // Invalid JSON
        schemas.push({
          type: 'Unknown',
          isValid: false,
          location: 'unknown',
          data: null,
        })
      }
    })

    return schemas
  }

  /**
   * Analyze content structure for AEO optimization
   */
  private analyzeContentStructure($: cheerio.CheerioAPI): ContentStructure {
    // H1 analysis
    const h1Elements = $('h1')
    const hasH1 = h1Elements.length > 0
    const h1Count = h1Elements.length
    const h1Text = hasH1 ? h1Elements.first().text().trim() : undefined

    // Semantic HTML check
    const hasArticle = $('article').length > 0
    const hasSection = $('section').length > 0
    const hasHeader = $('header').length > 0
    const hasMain = $('main').length > 0
    const hasSemanticHTML = (hasArticle || hasMain) && (hasSection || hasHeader)

    // Check for Q&A format
    const headings = $('h2, h3')
    let questionHeadings = 0
    headings.each((_, el) => {
      const text = $(el).text().toLowerCase()
      if (
        text.includes('?') ||
        text.startsWith('what') ||
        text.startsWith('how') ||
        text.startsWith('why') ||
        text.startsWith('when') ||
        text.startsWith('where') ||
        text.startsWith('who')
      ) {
        questionHeadings++
      }
    })
    const hasQAFormat = questionHeadings >= 2

    // Word count and paragraph analysis
    const mainContent = $('main, article, .content, #content, body').first()
    const bodyText = mainContent.text().replace(/\s+/g, ' ').trim()
    const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length

    const paragraphs = $('p')
    let totalWords = 0
    paragraphs.each((_, el) => {
      const text = $(el).text().trim()
      totalWords += text.split(/\s+/).filter(w => w.length > 0).length
    })
    const avgParagraphLength = paragraphs.length > 0 ? Math.round(totalWords / paragraphs.length) : 0

    // Check for direct answers (40-60 word summaries after headings)
    let hasDirectAnswers = false
    $('h2, h3').slice(0, 5).each((_, heading) => {
      const nextP = $(heading).next('p')
      if (nextP.length > 0) {
        const words = nextP.text().split(/\s+/).filter(w => w.length > 0).length
        if (words >= 40 && words <= 80) {
          hasDirectAnswers = true
          return false // break
        }
      }
    })

    return {
      hasH1,
      h1Count,
      h1Text,
      hasSemanticHTML,
      hasQAFormat,
      avgParagraphLength,
      wordCount,
      hasDirectAnswers,
    }
  }

  /**
   * Analyze technical SEO factors
   */
  private async analyzeTechnicalSEO(
    $: cheerio.CheerioAPI,
    url: string,
    loadTime: number
  ): Promise<TechnicalSEO> {
    const hasHTTPS = url.startsWith('https://')

    // Check viewport meta tag for mobile responsiveness
    const viewport = $('meta[name="viewport"]').attr('content')
    const mobileResponsive = viewport?.includes('width=device-width') ?? false

    // Check for sitemap and robots.txt
    const domain = new URL(url).origin
    let hasSitemap = false
    let hasRobotsTxt = false

    try {
      const sitemapResponse = await fetch(`${domain}/sitemap.xml`, { method: 'HEAD' })
      hasSitemap = sitemapResponse.ok
    } catch {
      hasSitemap = false
    }

    try {
      const robotsResponse = await fetch(`${domain}/robots.txt`, { method: 'HEAD' })
      hasRobotsTxt = robotsResponse.ok
    } catch {
      hasRobotsTxt = false
    }

    return {
      hasHTTPS,
      loadTime,
      mobileResponsive,
      hasSitemap,
      hasRobotsTxt,
      coreWebVitals: {
        // Cannot measure real CWV without a browser - leave undefined
        lcp: undefined,
        fid: undefined,
        cls: undefined,
      },
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
      score += 5
      criticalIssues.push('Client-side rendering only - AI crawlers may not execute JavaScript')
      recommendations.push('Implement Server-Side Rendering (SSR) or Static Site Generation (SSG)')
    } else {
      score += 15
      strengths.push('Traditional server-rendered HTML')
    }

    // Schema Markup scoring (25 points)
    const hasFAQSchema = analysis.schemaMarkup.some(s =>
      s.type.includes('FAQPage') || s.type.includes('Question'))
    const hasArticleSchema = analysis.schemaMarkup.some(s =>
      s.type.includes('Article') || s.type.includes('BlogPosting') || s.type.includes('NewsArticle'))
    const hasOrgSchema = analysis.schemaMarkup.some(s =>
      s.type.includes('Organization') || s.type.includes('LocalBusiness'))
    const hasProductSchema = analysis.schemaMarkup.some(s => s.type.includes('Product'))
    const hasHowToSchema = analysis.schemaMarkup.some(s => s.type.includes('HowTo'))

    if (hasFAQSchema) {
      score += 10
      strengths.push('FAQ schema implemented - great for AI answer extraction')
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

    if (hasHowToSchema) {
      score += 5
      strengths.push('HowTo schema implemented')
    }

    if (hasProductSchema) {
      score += 5
      strengths.push('Product schema implemented')
    }

    // Content Structure scoring (30 points)
    if (analysis.contentStructure.hasH1 && analysis.contentStructure.h1Count === 1) {
      score += 8
      strengths.push('Proper H1 structure (single H1 per page)')
    } else if (analysis.contentStructure.h1Count > 1) {
      score += 4
      weaknesses.push(`Multiple H1 tags found (${analysis.contentStructure.h1Count})`)
      recommendations.push('Use only one H1 per page')
    } else {
      criticalIssues.push('No H1 tag found')
      recommendations.push('Add an H1 tag to every page')
    }

    if (analysis.contentStructure.hasSemanticHTML) {
      score += 7
      strengths.push('Semantic HTML5 elements used')
    } else {
      weaknesses.push('Limited semantic HTML structure')
      recommendations.push('Use semantic HTML (<article>, <section>, <main>)')
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
      weaknesses.push(`Moderate load time (${analysis.technicalSEO.loadTime}ms)`)
      recommendations.push('Optimize page speed to under 2 seconds')
    } else {
      weaknesses.push(`Slow load time (${analysis.technicalSEO.loadTime}ms)`)
      recommendations.push('Critical: Improve page speed (currently >5s)')
    }

    if (analysis.technicalSEO.mobileResponsive) {
      score += 5
      strengths.push('Mobile viewport meta tag present')
    } else {
      weaknesses.push('Missing mobile viewport configuration')
      recommendations.push('Add viewport meta tag for mobile responsiveness')
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
      recommendations,
    }
  }
}
