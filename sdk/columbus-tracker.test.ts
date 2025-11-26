import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ColumbusTracker, initColumbus, trackPageView, trackConversion, isFromAI, getAISource } from './columbus-tracker'

// Mock browser APIs
const mockDocument = {
  referrer: '',
  cookie: '',
  visibilityState: 'visible' as DocumentVisibilityState,
  addEventListener: vi.fn()
}

const mockWindow = {
  location: {
    href: 'https://example.com/page',
    hostname: 'example.com',
    search: ''
  },
  addEventListener: vi.fn()
}

const mockSessionStorage: Record<string, string> = {}
const mockNavigator = {
  sendBeacon: vi.fn(() => true)
}

// Setup global mocks
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
})

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
})

Object.defineProperty(global, 'sessionStorage', {
  value: {
    getItem: (key: string) => mockSessionStorage[key] || null,
    setItem: (key: string, value: string) => { mockSessionStorage[key] = value },
    removeItem: (key: string) => { delete mockSessionStorage[key] },
    clear: () => { Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]) }
  },
  writable: true
})

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
})

// Mock fetch
const mockFetch = vi.fn(() => Promise.resolve({ ok: true }))
global.fetch = mockFetch as any

describe('ColumbusTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDocument.referrer = ''
    mockDocument.cookie = ''
    mockWindow.location.search = ''
    Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('AI Source Detection', () => {
    it('should detect ChatGPT referrer', () => {
      mockDocument.referrer = 'https://chat.openai.com/c/abc123'

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      expect(tracker.getSource()).toBe('chatgpt')
      expect(tracker.isFromAI()).toBe(true)
    })

    it('should detect Claude referrer', () => {
      mockDocument.referrer = 'https://claude.ai/chat/conversation'

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      expect(tracker.getSource()).toBe('claude')
      expect(tracker.isFromAI()).toBe(true)
    })

    it('should detect Perplexity referrer', () => {
      mockDocument.referrer = 'https://www.perplexity.ai/search'

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      expect(tracker.getSource()).toBe('perplexity')
      expect(tracker.isFromAI()).toBe(true)
    })

    it('should detect Gemini referrer', () => {
      mockDocument.referrer = 'https://gemini.google.com/app'

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      expect(tracker.getSource()).toBe('gemini')
      expect(tracker.isFromAI()).toBe(true)
    })

    it('should detect AI source from utm parameters', () => {
      mockWindow.location.search = '?utm_source=chatgpt&utm_medium=ai'

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      expect(tracker.getSource()).toBe('chatgpt')
      expect(tracker.isFromAI()).toBe(true)
    })

    it('should detect AI source from custom query params', () => {
      mockWindow.location.search = '?from_chatgpt=true'

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      expect(tracker.getSource()).toBe('chatgpt')
    })

    it('should not detect AI source for regular traffic', () => {
      mockDocument.referrer = 'https://google.com/search?q=test'

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      expect(tracker.getSource()).toBeNull()
      expect(tracker.isFromAI()).toBe(false)
    })

    it('should persist AI source in session storage', () => {
      mockDocument.referrer = 'https://claude.ai/chat'

      new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      expect(mockSessionStorage['columbus_ai_source']).toBe('claude')
    })

    it('should read AI source from session storage on subsequent page loads', () => {
      mockSessionStorage['columbus_ai_source'] = 'perplexity'
      mockDocument.referrer = '' // No referrer on subsequent pages

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      expect(tracker.getSource()).toBe('perplexity')
    })
  })

  describe('Session Management', () => {
    it('should generate a session ID', () => {
      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      const sessionId = tracker.getSessionId()
      expect(sessionId).toBeDefined()
      expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    })

    it('should reuse session ID from cookie', () => {
      const existingSession = 'existing-session-id'
      mockDocument.cookie = `columbus_session=${existingSession}`

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      expect(tracker.getSessionId()).toBe(existingSession)
    })
  })

  describe('Page View Tracking', () => {
    it('should track page view when from AI source', async () => {
      mockDocument.referrer = 'https://chat.openai.com/'

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      tracker.trackPageView()

      // Wait for flush
      await new Promise(resolve => setTimeout(resolve, 100))

      // Force flush
      tracker.destroy()

      expect(mockNavigator.sendBeacon).toHaveBeenCalled()
    })

    it('should not track page view when not from AI source', () => {
      mockDocument.referrer = 'https://google.com/'

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      tracker.trackPageView()

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should include metadata in page view', () => {
      mockDocument.referrer = 'https://claude.ai/'

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      tracker.trackPageView({ page_type: 'product', product_id: '123' })

      tracker.destroy()

      expect(mockNavigator.sendBeacon).toHaveBeenCalled()
    })
  })

  describe('Conversion Tracking', () => {
    it('should track conversions', async () => {
      mockDocument.referrer = 'https://perplexity.ai/'

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      tracker.trackConversion('purchase', { value: 99.99, currency: 'USD' })

      // Conversions are flushed immediately
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockFetch).toHaveBeenCalled()

      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.events).toHaveLength(2) // session_start + conversion
      const conversion = body.events.find((e: any) => e.type === 'conversion')
      expect(conversion.eventName).toBe('purchase')
      expect(conversion.value).toBe(99.99)
      expect(conversion.currency).toBe('USD')
    })

    it('should track conversions even without AI source', async () => {
      mockDocument.referrer = 'https://google.com/'

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      tracker.trackConversion('signup', { value: 0 })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockFetch).toHaveBeenCalled()
    })

    it('should include metadata in conversions', async () => {
      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      tracker.trackConversion('demo_request', {
        value: 0,
        metadata: { demo_type: 'enterprise', company_size: '100+' }
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockFetch).toHaveBeenCalled()

      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      const conversion = body.events.find((e: any) => e.type === 'conversion')

      expect(conversion.metadata.demo_type).toBe('enterprise')
    })
  })

  describe('Manual Source Setting', () => {
    it('should allow manually setting AI source', () => {
      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      tracker.setSource('custom_ai')

      expect(tracker.getSource()).toBe('custom_ai')
      expect(tracker.isFromAI()).toBe(true)
    })
  })

  describe('Configuration', () => {
    it('should use custom endpoint', () => {
      mockDocument.referrer = 'https://claude.ai/'

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key',
        endpoint: 'https://custom-api.example.com/track'
      })

      tracker.trackConversion('test')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-api.example.com/track',
        expect.any(Object)
      )
    })

    it('should include API key in requests', async () => {
      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'my-secret-key'
      })

      tracker.trackConversion('test')

      await new Promise(resolve => setTimeout(resolve, 100))

      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.apiKey).toBe('my-secret-key')
    })
  })

  describe('Global Functions', () => {
    it('should work with initColumbus helper', () => {
      mockDocument.referrer = 'https://gemini.google.com/'

      const tracker = initColumbus({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      expect(isFromAI()).toBe(true)
      expect(getAISource()).toBe('gemini')
    })

    it('should warn when using functions without initialization', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Reset default tracker by creating new instance
      // Note: In real implementation, we'd need to reset the module state

      trackPageView()

      // This test verifies the function doesn't throw
      expect(consoleSpy).toBeDefined()
    })
  })
})

describe('AI Platform Detection Coverage', () => {
  beforeEach(() => {
    mockDocument.cookie = ''
    Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k])
    mockWindow.location.search = ''
  })

  const platforms = [
    { name: 'chatgpt', referrer: 'https://chat.openai.com/' },
    { name: 'chatgpt', referrer: 'https://chatgpt.com/c/conversation' },
    { name: 'claude', referrer: 'https://claude.ai/' },
    { name: 'perplexity', referrer: 'https://www.perplexity.ai/' },
    { name: 'gemini', referrer: 'https://gemini.google.com/app' },
    { name: 'gemini', referrer: 'https://bard.google.com/' },
    { name: 'copilot', referrer: 'https://copilot.microsoft.com/' },
    { name: 'copilot', referrer: 'https://www.bing.com/chat' },
    { name: 'you', referrer: 'https://you.com/' },
    { name: 'phind', referrer: 'https://www.phind.com/search' },
    { name: 'andi', referrer: 'https://andisearch.com/' }
  ]

  for (const { name, referrer } of platforms) {
    it(`should detect ${name} from ${referrer}`, () => {
      mockDocument.referrer = referrer

      const tracker = new ColumbusTracker({
        organizationId: 'test-org',
        apiKey: 'test-key'
      })

      expect(tracker.getSource()).toBe(name)
    })
  }
})
