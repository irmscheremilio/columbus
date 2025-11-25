import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WebsiteCrawler } from '../src/analyzers/website-crawler'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('WebsiteCrawler', () => {
  let crawler: WebsiteCrawler

  beforeEach(() => {
    vi.clearAllMocks()
    crawler = new WebsiteCrawler()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('analyzeHtml', () => {
    it('should analyze HTML content and return website analysis', async () => {
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Test Page</title>
            <script type="application/ld+json">
              {"@context": "https://schema.org", "@type": "Organization", "name": "Test Org"}
            </script>
          </head>
          <body>
            <header><nav></nav></header>
            <main>
              <article>
                <h1>Main Title</h1>
                <section>
                  <h2>What is AEO?</h2>
                  <p>Answer Engine Optimization is the practice of optimizing content for AI responses. This helps brands appear in AI-generated answers to user queries.</p>
                </section>
              </article>
            </main>
          </body>
        </html>
      `

      // Mock sitemap and robots checks
      mockFetch.mockResolvedValue({ ok: false })

      const analysis = await crawler.analyzeHtml(html, 'https://example.com/page')

      expect(analysis.domain).toBe('example.com')
      expect(analysis.contentStructure.hasH1).toBe(true)
      expect(analysis.contentStructure.h1Count).toBe(1)
      expect(analysis.contentStructure.hasSemanticHTML).toBe(true)
      expect(analysis.schemaMarkup.length).toBeGreaterThan(0)
      expect(analysis.schemaMarkup[0].type).toBe('Organization')
      expect(analysis.technicalSEO.mobileResponsive).toBe(true)
    })

    it('should detect WordPress platform', async () => {
      const html = `
        <html>
          <head>
            <link rel="stylesheet" href="/wp-content/themes/theme/style.css">
          </head>
          <body>
            <h1>WordPress Site</h1>
            <script src="/wp-includes/js/jquery.js"></script>
          </body>
        </html>
      `

      mockFetch.mockResolvedValue({ ok: false })

      const analysis = await crawler.analyzeHtml(html, 'https://example.com')

      expect(analysis.techStack.platform).toBe('wordpress')
      expect(analysis.techStack.cms).toBe('WordPress')
    })

    it('should detect Next.js framework', async () => {
      const html = `
        <html>
          <head>
            <script id="__NEXT_DATA__" type="application/json">{"props":{}}</script>
          </head>
          <body>
            <div id="__next">
              <h1>Next.js App</h1>
            </div>
          </body>
        </html>
      `

      mockFetch.mockResolvedValue({ ok: false })

      const analysis = await crawler.analyzeHtml(html, 'https://example.com')

      expect(analysis.techStack.framework).toBe('Next.js')
      expect(analysis.techStack.jsFramework).toBe('React')
      expect(analysis.techStack.hasSSR).toBe(true)
    })

    it('should detect FAQ schema', async () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [{
                  "@type": "Question",
                  "name": "What is AEO?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Answer Engine Optimization"
                  }
                }]
              }
            </script>
          </head>
          <body><h1>FAQ</h1></body>
        </html>
      `

      mockFetch.mockResolvedValue({ ok: false })

      const analysis = await crawler.analyzeHtml(html, 'https://example.com/faq')

      expect(analysis.schemaMarkup.some(s => s.type === 'FAQPage')).toBe(true)
      expect(analysis.aeoReadiness.strengths).toContain('FAQ schema implemented - great for AI answer extraction')
    })

    it('should detect Q&A format in content', async () => {
      const html = `
        <html>
          <body>
            <h1>FAQ Page</h1>
            <h2>What is AEO?</h2>
            <p>AEO stands for Answer Engine Optimization.</p>
            <h2>How does it work?</h2>
            <p>It optimizes content for AI assistants.</p>
            <h2>Why is it important?</h2>
            <p>AI is becoming a major search interface.</p>
          </body>
        </html>
      `

      mockFetch.mockResolvedValue({ ok: false })

      const analysis = await crawler.analyzeHtml(html, 'https://example.com/faq')

      expect(analysis.contentStructure.hasQAFormat).toBe(true)
    })

    it('should calculate AEO readiness score', async () => {
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width">
            <script type="application/ld+json">
              {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": []}
            </script>
          </head>
          <body>
            <main>
              <article>
                <h1>Optimized Page</h1>
                <h2>What is this about?</h2>
                <p>This is a well-optimized page that answers questions directly and clearly for better AI visibility and citations.</p>
              </article>
            </main>
          </body>
        </html>
      `

      mockFetch.mockResolvedValue({ ok: false })

      const analysis = await crawler.analyzeHtml(html, 'https://example.com')

      expect(analysis.aeoReadiness.score).toBeGreaterThan(0)
      expect(analysis.aeoReadiness.score).toBeLessThanOrEqual(100)
      expect(analysis.aeoReadiness.strengths.length).toBeGreaterThan(0)
    })

    it('should detect multiple H1 tags as an issue', async () => {
      const html = `
        <html>
          <body>
            <h1>First Title</h1>
            <h1>Second Title</h1>
            <h1>Third Title</h1>
          </body>
        </html>
      `

      mockFetch.mockResolvedValue({ ok: false })

      const analysis = await crawler.analyzeHtml(html, 'https://example.com')

      expect(analysis.contentStructure.h1Count).toBe(3)
      expect(analysis.aeoReadiness.weaknesses).toContain('Multiple H1 tags found (3)')
    })

    it('should extract text content from main content area', async () => {
      const html = `
        <html>
          <body>
            <nav>Navigation content here</nav>
            <header>Header content</header>
            <main>
              <article>
                <h1>Main Article</h1>
                <p>This is the important content that should be extracted.</p>
              </article>
            </main>
            <aside>Sidebar content</aside>
            <footer>Footer content</footer>
          </body>
        </html>
      `

      mockFetch.mockResolvedValue({ ok: false })

      const analysis = await crawler.analyzeHtml(html, 'https://example.com')

      expect(analysis.textContent).toContain('Main Article')
      expect(analysis.textContent).toContain('important content')
      // Navigation and footer should be removed
      expect(analysis.textContent).not.toContain('Navigation content')
      expect(analysis.textContent).not.toContain('Footer content')
    })

    it('should detect HTTPS', async () => {
      const html = '<html><body><h1>Test</h1></body></html>'

      mockFetch.mockResolvedValue({ ok: false })

      const httpsAnalysis = await crawler.analyzeHtml(html, 'https://example.com')
      const httpAnalysis = await crawler.analyzeHtml(html, 'http://example.com')

      expect(httpsAnalysis.technicalSEO.hasHTTPS).toBe(true)
      expect(httpAnalysis.technicalSEO.hasHTTPS).toBe(false)
    })

    it('should detect client-side rendering frameworks', async () => {
      const html = `
        <html>
          <body>
            <div id="app"></div>
            <script src="vue.js"></script>
          </body>
        </html>
      `

      mockFetch.mockResolvedValue({ ok: false })

      const analysis = await crawler.analyzeHtml(html, 'https://example.com')

      expect(analysis.techStack.jsFramework).toBe('Vue')
      expect(analysis.techStack.hasCSR).toBe(true)
      expect(analysis.techStack.hasSSR).toBe(false)
    })
  })

  describe('analyze (with fetch)', () => {
    it('should fetch and analyze a URL', async () => {
      const mockHtml = `
        <html>
          <head><title>Test Site</title></head>
          <body><h1>Welcome</h1><p>Content here</p></body>
        </html>
      `

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('sitemap') || url.includes('robots')) {
          return Promise.resolve({ ok: false })
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mockHtml)
        })
      })

      const analysis = await crawler.analyze('https://example.com')

      expect(analysis.domain).toBe('example.com')
      expect(analysis.contentStructure.hasH1).toBe(true)
      expect(analysis.textContent).toContain('Content here')
    })

    it('should throw error for failed fetch', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await expect(crawler.analyze('https://example.com')).rejects.toThrow('Failed to fetch')
    })
  })
})
