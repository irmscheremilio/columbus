import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PageDiscovery } from '../src/analyzers/page-discovery'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify([
                  { path: '/blog', isRelevant: true, contentType: 'blog', reason: 'Blog content is great for AEO' },
                  { path: '/faq', isRelevant: true, contentType: 'faq', reason: 'FAQ pages are ideal for AEO' },
                  { path: '/about', isRelevant: true, contentType: 'about', reason: 'About page establishes authority' },
                  { path: '/login', isRelevant: false, contentType: 'other', reason: 'Login page has no content value' },
                ])
              }
            }]
          })
        }
      }
    }))
  }
})

describe('PageDiscovery', () => {
  let pageDiscovery: PageDiscovery

  beforeEach(() => {
    vi.clearAllMocks()
    pageDiscovery = new PageDiscovery()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('discoverPages', () => {
    it('should discover pages from sitemap', async () => {
      // Mock sitemap response
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('sitemap.xml')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(`<?xml version="1.0" encoding="UTF-8"?>
              <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                <url><loc>https://example.com/</loc></url>
                <url><loc>https://example.com/blog</loc></url>
                <url><loc>https://example.com/faq</loc></url>
                <url><loc>https://example.com/about</loc></url>
                <url><loc>https://example.com/login</loc></url>
              </urlset>`)
          })
        }
        // Homepage response
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<html><body><a href="/blog">Blog</a></body></html>')
        })
      })

      const pages = await pageDiscovery.discoverPages('example.com')

      expect(pages.length).toBeGreaterThan(0)
      expect(pages.some(p => p.path === '/blog')).toBe(true)
      expect(pages.some(p => p.path === '/faq')).toBe(true)
    })

    it('should discover pages from homepage links when sitemap unavailable', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('sitemap')) {
          return Promise.resolve({ ok: false, status: 404 })
        }
        // Homepage response with internal links
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(`
            <html>
              <body>
                <a href="/blog">Blog</a>
                <a href="/products">Products</a>
                <a href="/about">About</a>
                <a href="https://external.com">External</a>
              </body>
            </html>
          `)
        })
      })

      const pages = await pageDiscovery.discoverPages('https://example.com')

      expect(pages.length).toBeGreaterThan(0)
      // Should include internal links but not external
      const urls = pages.map(p => p.url)
      expect(urls.some(u => u.includes('/blog'))).toBe(true)
      expect(urls.every(u => !u.includes('external.com'))).toBe(true)
    })

    it('should filter out non-page URLs', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('sitemap.xml')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(`<?xml version="1.0" encoding="UTF-8"?>
              <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                <url><loc>https://example.com/page.html</loc></url>
                <url><loc>https://example.com/image.jpg</loc></url>
                <url><loc>https://example.com/style.css</loc></url>
                <url><loc>https://example.com/wp-admin/</loc></url>
                <url><loc>https://example.com/blog</loc></url>
              </urlset>`)
          })
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<html><body></body></html>')
        })
      })

      const pages = await pageDiscovery.discoverPages('example.com')

      const urls = pages.map(p => p.url)
      expect(urls.every(u => !u.endsWith('.jpg'))).toBe(true)
      expect(urls.every(u => !u.endsWith('.css'))).toBe(true)
      expect(urls.every(u => !u.includes('wp-admin'))).toBe(true)
    })

    it('should mark pages as relevant based on AI analysis', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('sitemap.xml')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(`<?xml version="1.0" encoding="UTF-8"?>
              <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                <url><loc>https://example.com/blog</loc></url>
                <url><loc>https://example.com/faq</loc></url>
                <url><loc>https://example.com/login</loc></url>
              </urlset>`)
          })
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<html><body></body></html>')
        })
      })

      const pages = await pageDiscovery.discoverPages('example.com')

      const blogPage = pages.find(p => p.path === '/blog')
      const loginPage = pages.find(p => p.path === '/login')

      expect(blogPage?.isRelevant).toBe(true)
      expect(blogPage?.contentType).toBe('blog')
      expect(loginPage?.isRelevant).toBe(false)
    })
  })

  describe('fetchPageContents', () => {
    it('should fetch content from relevant pages only', async () => {
      const pages = [
        { url: 'https://example.com/blog', path: '/blog', isRelevant: true, contentType: 'blog' as const },
        { url: 'https://example.com/faq', path: '/faq', isRelevant: true, contentType: 'faq' as const },
        { url: 'https://example.com/login', path: '/login', isRelevant: false, contentType: 'other' as const },
      ]

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/blog')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<html><head><title>Blog Title</title></head><body><main>Blog content here</main></body></html>')
          })
        }
        if (url.includes('/faq')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<html><head><title>FAQ</title></head><body><main>FAQ content here</main></body></html>')
          })
        }
        return Promise.resolve({ ok: false, status: 404 })
      })

      const contents = await pageDiscovery.fetchPageContents(pages)

      // Should only fetch relevant pages (2 out of 3)
      expect(contents.length).toBe(2)
      expect(contents.some(c => c.url.includes('/blog'))).toBe(true)
      expect(contents.some(c => c.url.includes('/faq'))).toBe(true)
      expect(contents.every(c => !c.url.includes('/login'))).toBe(true)
    })

    it('should extract title and text content from pages', async () => {
      const pages = [
        { url: 'https://example.com/blog', path: '/blog', isRelevant: true, contentType: 'blog' as const },
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head><title>My Blog Post</title></head>
            <body>
              <nav>Navigation</nav>
              <main>
                <h1>Blog Title</h1>
                <p>This is the main content of the blog post.</p>
              </main>
              <footer>Footer</footer>
            </body>
          </html>
        `)
      })

      const contents = await pageDiscovery.fetchPageContents(pages)

      expect(contents.length).toBe(1)
      expect(contents[0].title).toBe('My Blog Post')
      expect(contents[0].textContent).toContain('Blog Title')
      expect(contents[0].textContent).toContain('main content')
      // Should not include nav/footer
      expect(contents[0].textContent).not.toContain('Navigation')
      expect(contents[0].textContent).not.toContain('Footer')
    })

    it('should handle fetch failures gracefully', async () => {
      const pages = [
        { url: 'https://example.com/blog', path: '/blog', isRelevant: true, contentType: 'blog' as const },
        { url: 'https://example.com/faq', path: '/faq', isRelevant: true, contentType: 'faq' as const },
      ]

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/blog')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<html><head><title>Blog</title></head><body>Content</body></html>')
          })
        }
        // FAQ fails
        return Promise.resolve({ ok: false, status: 500 })
      })

      const contents = await pageDiscovery.fetchPageContents(pages)

      // Should still return successful fetches
      expect(contents.length).toBe(1)
      expect(contents[0].url).toContain('/blog')
    })

    it('should limit concurrent fetches', async () => {
      const pages = Array.from({ length: 10 }, (_, i) => ({
        url: `https://example.com/page-${i}`,
        path: `/page-${i}`,
        isRelevant: true,
        contentType: 'other' as const,
      }))

      let concurrentFetches = 0
      let maxConcurrent = 0

      mockFetch.mockImplementation(async () => {
        concurrentFetches++
        maxConcurrent = Math.max(maxConcurrent, concurrentFetches)

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 10))

        concurrentFetches--
        return {
          ok: true,
          text: () => Promise.resolve('<html><head><title>Page</title></head><body>Content</body></html>')
        }
      })

      await pageDiscovery.fetchPageContents(pages)

      // Should respect concurrency limit of 5
      expect(maxConcurrent).toBeLessThanOrEqual(5)
    })
  })

  describe('URL filtering', () => {
    it('should filter asset URLs', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('sitemap.xml')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(`<?xml version="1.0" encoding="UTF-8"?>
              <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                <url><loc>https://example.com/page</loc></url>
                <url><loc>https://example.com/image.png</loc></url>
                <url><loc>https://example.com/doc.pdf</loc></url>
                <url><loc>https://example.com/script.js</loc></url>
              </urlset>`)
          })
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<html><body></body></html>')
        })
      })

      const pages = await pageDiscovery.discoverPages('example.com')

      const urls = pages.map(p => p.url)
      expect(urls.some(u => u.endsWith('/page'))).toBe(true)
      expect(urls.every(u => !u.endsWith('.png'))).toBe(true)
      expect(urls.every(u => !u.endsWith('.pdf'))).toBe(true)
      expect(urls.every(u => !u.endsWith('.js'))).toBe(true)
    })

    it('should filter admin and API URLs', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('sitemap.xml')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(`<?xml version="1.0" encoding="UTF-8"?>
              <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                <url><loc>https://example.com/blog</loc></url>
                <url><loc>https://example.com/admin/dashboard</loc></url>
                <url><loc>https://example.com/api/users</loc></url>
                <url><loc>https://example.com/wp-admin/</loc></url>
              </urlset>`)
          })
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<html><body></body></html>')
        })
      })

      const pages = await pageDiscovery.discoverPages('example.com')

      const urls = pages.map(p => p.url)
      expect(urls.some(u => u.includes('/blog'))).toBe(true)
      expect(urls.every(u => !u.includes('/admin/'))).toBe(true)
      expect(urls.every(u => !u.includes('/api/'))).toBe(true)
      expect(urls.every(u => !u.includes('/wp-admin/'))).toBe(true)
    })
  })
})
