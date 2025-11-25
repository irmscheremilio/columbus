import * as cheerio from 'cheerio'
import OpenAI from 'openai'

export interface DiscoveredPage {
  url: string
  path: string
  title?: string
  isRelevant: boolean
  relevanceReason?: string
  contentType?: 'blog' | 'faq' | 'product' | 'landing' | 'about' | 'pricing' | 'docs' | 'other'
}

export interface PageContent {
  url: string
  path: string
  title: string
  html: string
  textContent: string
  contentType: string
}

/**
 * Discovers and analyzes pages on a website for AEO optimization
 */
export class PageDiscovery {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Discover all relevant pages on a website
   * 1. Try to fetch sitemap.xml
   * 2. Crawl homepage for internal links
   * 3. Use AI to determine which pages are relevant for AEO
   */
  async discoverPages(domain: string): Promise<DiscoveredPage[]> {
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`
    const origin = new URL(baseUrl).origin

    console.log(`[Page Discovery] Discovering pages for ${origin}...`)

    const allUrls = new Set<string>()

    // 1. Try sitemap first
    const sitemapUrls = await this.fetchSitemapUrls(origin)
    sitemapUrls.forEach(url => allUrls.add(url))
    console.log(`[Page Discovery] Found ${sitemapUrls.length} URLs from sitemap`)

    // 2. Crawl homepage for additional links
    const homepageLinks = await this.crawlPageLinks(baseUrl, origin)
    homepageLinks.forEach(url => allUrls.add(url))
    console.log(`[Page Discovery] Found ${homepageLinks.length} URLs from homepage`)

    // 3. Deduplicate and filter
    const uniqueUrls = Array.from(allUrls)
      .filter(url => this.isValidPageUrl(url, origin))
      .slice(0, 100) // Limit to 100 pages max

    console.log(`[Page Discovery] ${uniqueUrls.length} unique page URLs found`)

    // 4. Use AI to determine relevance
    const relevantPages = await this.determineRelevance(uniqueUrls, origin)

    console.log(`[Page Discovery] ${relevantPages.filter(p => p.isRelevant).length} relevant pages identified`)

    return relevantPages
  }

  /**
   * Fetch URLs from sitemap.xml
   */
  private async fetchSitemapUrls(origin: string): Promise<string[]> {
    const urls: string[] = []

    try {
      // Try common sitemap locations
      const sitemapLocations = [
        `${origin}/sitemap.xml`,
        `${origin}/sitemap_index.xml`,
        `${origin}/sitemap-index.xml`,
      ]

      for (const sitemapUrl of sitemapLocations) {
        try {
          const response = await fetch(sitemapUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ColumbusAEO/1.0)',
            },
          })

          if (!response.ok) continue

          const xml = await response.text()

          // Check if it's a sitemap index
          if (xml.includes('<sitemapindex')) {
            // Parse sitemap index to get child sitemaps
            const sitemapMatches = xml.matchAll(/<loc>([^<]+)<\/loc>/g)
            for (const match of sitemapMatches) {
              const childSitemapUrl = match[1]
              if (childSitemapUrl.includes('sitemap')) {
                const childUrls = await this.fetchSingleSitemap(childSitemapUrl)
                urls.push(...childUrls)
              }
            }
          } else {
            // Parse regular sitemap
            const pageUrls = await this.fetchSingleSitemap(sitemapUrl)
            urls.push(...pageUrls)
          }

          if (urls.length > 0) break // Found a working sitemap
        } catch {
          // Try next location
        }
      }
    } catch (error) {
      console.log(`[Page Discovery] Could not fetch sitemap: ${error}`)
    }

    return urls
  }

  /**
   * Fetch URLs from a single sitemap file
   */
  private async fetchSingleSitemap(sitemapUrl: string): Promise<string[]> {
    const urls: string[] = []

    try {
      const response = await fetch(sitemapUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ColumbusAEO/1.0)',
        },
      })

      if (!response.ok) return urls

      const xml = await response.text()
      const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g)

      for (const match of matches) {
        const url = match[1].trim()
        if (!url.includes('sitemap')) { // Skip sitemap URLs
          urls.push(url)
        }
      }
    } catch (error) {
      console.log(`[Page Discovery] Error fetching ${sitemapUrl}: ${error}`)
    }

    return urls
  }

  /**
   * Crawl a page for internal links
   */
  private async crawlPageLinks(pageUrl: string, origin: string): Promise<string[]> {
    const urls: string[] = []

    try {
      const response = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ColumbusAEO/1.0)',
          'Accept': 'text/html',
        },
      })

      if (!response.ok) return urls

      const html = await response.text()
      const $ = cheerio.load(html)

      // Find all internal links
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href')
        if (!href) return

        try {
          let fullUrl: string

          if (href.startsWith('http')) {
            fullUrl = href
          } else if (href.startsWith('/')) {
            fullUrl = `${origin}${href}`
          } else if (!href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            fullUrl = `${origin}/${href}`
          } else {
            return
          }

          // Only include same-origin URLs
          if (new URL(fullUrl).origin === origin) {
            urls.push(fullUrl.split('#')[0].split('?')[0]) // Remove hash and query
          }
        } catch {
          // Invalid URL
        }
      })
    } catch (error) {
      console.log(`[Page Discovery] Error crawling ${pageUrl}: ${error}`)
    }

    return urls
  }

  /**
   * Filter valid page URLs (exclude assets, admin, etc.)
   */
  private isValidPageUrl(url: string, origin: string): boolean {
    try {
      const parsed = new URL(url)

      // Must be same origin
      if (parsed.origin !== origin) return false

      const path = parsed.pathname.toLowerCase()

      // Exclude common non-page URLs
      const excludePatterns = [
        /\.(jpg|jpeg|png|gif|svg|webp|ico|pdf|doc|docx|xls|xlsx|zip|rar|mp4|mp3|wav|css|js|json|xml|woff|woff2|ttf|eot)$/i,
        /\/(wp-admin|wp-includes|wp-content\/plugins|wp-json|admin|api|auth|login|logout|signup|register|cart|checkout|account|my-account)\//i,
        /\/(cdn-cgi|_next\/static|_nuxt\/|\.well-known)\//i,
        /\/page\/\d+\/?$/, // Pagination
        /\/tag\/|\/category\/|\/author\//, // Taxonomy pages (often duplicated content)
        /\?/, // Query strings
      ]

      for (const pattern of excludePatterns) {
        if (pattern.test(path) || pattern.test(url)) {
          return false
        }
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Use AI to determine which pages are relevant for AEO optimization
   */
  private async determineRelevance(urls: string[], origin: string): Promise<DiscoveredPage[]> {
    if (urls.length === 0) return []

    // Extract paths for analysis
    const pathsWithUrls = urls.map(url => {
      const parsed = new URL(url)
      return {
        url,
        path: parsed.pathname,
      }
    })

    // Use AI to categorize pages
    const prompt = `Analyze these website paths and determine which are most relevant for AEO (Answer Engine Optimization).

Website: ${origin}

Paths to analyze:
${pathsWithUrls.map(p => p.path).join('\n')}

For each path, determine:
1. Is it relevant for AEO optimization? (true/false)
2. Content type: blog, faq, product, landing, about, pricing, docs, or other
3. Brief reason for relevance (or why not relevant)

Focus on pages that:
- Contain educational/informational content (blogs, guides, tutorials)
- Have FAQ sections
- Describe products/services in detail
- Would benefit from schema markup
- Could appear in AI-generated answers

Skip pages that are:
- User account/login pages
- Cart/checkout pages
- Legal pages (terms, privacy)
- Pagination pages
- Tag/category archives with little unique content

Return JSON array:
[
  {
    "path": "/example",
    "isRelevant": true,
    "contentType": "blog",
    "reason": "Blog posts are prime candidates for AEO optimization"
  }
]

Only include paths from the input list. Return valid JSON array only, no markdown.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert specializing in Answer Engine Optimization. Analyze website structure and identify pages that would benefit most from AEO optimization. Return only valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      })

      const content = response.choices[0]?.message?.content || '[]'

      // Parse JSON response
      let parsed: any[]
      try {
        // Clean up response (remove markdown code blocks if present)
        const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()
        parsed = JSON.parse(cleaned)
      } catch {
        console.error('[Page Discovery] Failed to parse AI response:', content)
        // Fallback: mark all pages as potentially relevant
        return pathsWithUrls.map(p => ({
          url: p.url,
          path: p.path,
          isRelevant: true,
          relevanceReason: 'Could not determine relevance automatically',
          contentType: 'other' as const,
        }))
      }

      // Map back to full URLs
      const pathMap = new Map(pathsWithUrls.map(p => [p.path, p.url]))

      return parsed.map(item => ({
        url: pathMap.get(item.path) || `${origin}${item.path}`,
        path: item.path,
        isRelevant: item.isRelevant ?? true,
        relevanceReason: item.reason,
        contentType: item.contentType || 'other',
      }))
    } catch (error) {
      console.error('[Page Discovery] AI relevance check failed:', error)
      // Fallback
      return pathsWithUrls.map(p => ({
        url: p.url,
        path: p.path,
        isRelevant: true,
        relevanceReason: 'AI check failed, included by default',
        contentType: 'other' as const,
      }))
    }
  }

  /**
   * Fetch content from multiple pages
   */
  async fetchPageContents(pages: DiscoveredPage[]): Promise<PageContent[]> {
    const relevantPages = pages.filter(p => p.isRelevant)
    const contents: PageContent[] = []

    console.log(`[Page Discovery] Fetching content from ${relevantPages.length} relevant pages...`)

    // Fetch pages in parallel with concurrency limit
    const concurrency = 5
    for (let i = 0; i < relevantPages.length; i += concurrency) {
      const batch = relevantPages.slice(i, i + concurrency)

      const results = await Promise.allSettled(
        batch.map(page => this.fetchSinglePageContent(page))
      )

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          contents.push(result.value)
        }
      }

      // Small delay between batches
      if (i + concurrency < relevantPages.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log(`[Page Discovery] Successfully fetched ${contents.length} pages`)

    return contents
  }

  /**
   * Fetch content from a single page
   */
  private async fetchSinglePageContent(page: DiscoveredPage): Promise<PageContent | null> {
    try {
      const response = await fetch(page.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ColumbusAEO/1.0)',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        console.log(`[Page Discovery] Failed to fetch ${page.url}: ${response.status}`)
        return null
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Extract title
      const title = $('title').first().text().trim() ||
                    $('h1').first().text().trim() ||
                    page.path

      // Extract text content
      $('script, style, nav, header, footer, aside, .nav, .menu, .sidebar').remove()
      const mainContent = $('main, article, .content, #content, [role="main"]').first()
      let textContent = ''

      if (mainContent.length > 0) {
        textContent = mainContent.text()
      } else {
        textContent = $('body').text()
      }

      // Clean whitespace
      textContent = textContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim()
        .substring(0, 10000) // Limit for processing

      return {
        url: page.url,
        path: page.path,
        title,
        html,
        textContent,
        contentType: page.contentType || 'other',
      }
    } catch (error) {
      console.log(`[Page Discovery] Error fetching ${page.url}: ${error}`)
      return null
    }
  }
}
