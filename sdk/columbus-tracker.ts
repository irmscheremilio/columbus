/**
 * Columbus AI Traffic Tracking SDK
 *
 * This SDK tracks visitors coming from AI platforms (ChatGPT, Claude, Gemini, Perplexity)
 * and conversion events to help measure ROI from AI visibility.
 *
 * Usage:
 * ```javascript
 * import { ColumbusTracker } from '@columbus/tracker';
 *
 * const tracker = new ColumbusTracker({
 *   organizationId: 'your-org-id',
 *   apiKey: 'your-api-key',
 *   debug: false
 * });
 *
 * // Track page view (auto-detects AI referrer)
 * tracker.trackPageView();
 *
 * // Track conversion
 * tracker.trackConversion('purchase', { value: 99.99, currency: 'USD' });
 * ```
 */

export interface ColumbusConfig {
  organizationId: string
  apiKey: string
  endpoint?: string
  debug?: boolean
  cookieDomain?: string
  sessionDuration?: number // minutes
}

export interface TrackingEvent {
  type: 'pageview' | 'conversion' | 'session_start' | 'session_end'
  organizationId: string
  timestamp: string
  sessionId: string
  source?: string
  referrer?: string
  landingPage?: string
  currentPage?: string
  eventName?: string
  value?: number
  currency?: string
  metadata?: Record<string, any>
}

export interface ConversionOptions {
  value?: number
  currency?: string
  metadata?: Record<string, any>
}

// AI platform referrer patterns
const AI_REFERRER_PATTERNS = [
  { name: 'chatgpt', patterns: ['chat.openai.com', 'chatgpt.com'] },
  { name: 'claude', patterns: ['claude.ai'] },
  { name: 'perplexity', patterns: ['perplexity.ai'] },
  { name: 'gemini', patterns: ['gemini.google.com', 'bard.google.com'] },
  { name: 'copilot', patterns: ['copilot.microsoft.com', 'bing.com/chat'] },
  { name: 'you', patterns: ['you.com'] },
  { name: 'phind', patterns: ['phind.com'] },
  { name: 'andi', patterns: ['andisearch.com'] }
]

/**
 * Columbus AI Traffic Tracker
 */
export class ColumbusTracker {
  private config: Required<ColumbusConfig>
  private sessionId: string
  private aiSource: string | null = null
  private isInitialized = false
  private eventQueue: TrackingEvent[] = []
  private flushInterval: ReturnType<typeof setInterval> | null = null

  constructor(config: ColumbusConfig) {
    this.config = {
      organizationId: config.organizationId,
      apiKey: config.apiKey,
      endpoint: config.endpoint || 'https://api.columbus-aeo.com/v1/track',
      debug: config.debug || false,
      cookieDomain: config.cookieDomain || this.getCurrentDomain(),
      sessionDuration: config.sessionDuration || 30
    }

    this.sessionId = this.getOrCreateSession()
    this.detectAISource()
    this.init()
  }

  /**
   * Initialize the tracker
   */
  private init(): void {
    if (this.isInitialized) return

    // Track session start if from AI source
    if (this.aiSource) {
      this.trackSessionStart()
    }

    // Set up flush interval (every 10 seconds)
    this.flushInterval = setInterval(() => this.flush(), 10000)

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true) // sync flush
      })

      // Track visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush(true)
        }
      })
    }

    this.isInitialized = true
    this.log('Columbus Tracker initialized', { sessionId: this.sessionId, source: this.aiSource })
  }

  /**
   * Detect if visitor came from an AI platform
   */
  private detectAISource(): void {
    if (typeof document === 'undefined') return

    const referrer = document.referrer.toLowerCase()

    // Check if already has AI source in session
    const storedSource = this.getSessionStorage('columbus_ai_source')
    if (storedSource) {
      this.aiSource = storedSource
      return
    }

    // Detect from referrer
    for (const platform of AI_REFERRER_PATTERNS) {
      for (const pattern of platform.patterns) {
        if (referrer.includes(pattern.toLowerCase())) {
          this.aiSource = platform.name
          this.setSessionStorage('columbus_ai_source', platform.name)
          this.setSessionStorage('columbus_landing_page', window.location.href)
          this.log(`Detected AI source: ${platform.name}`)
          return
        }
      }
    }

    // Check URL parameters (some AI platforms add utm parameters)
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source')?.toLowerCase()
    const utmMedium = urlParams.get('utm_medium')?.toLowerCase()

    if (utmMedium === 'ai' || utmMedium === 'llm' || utmMedium === 'chatbot') {
      this.aiSource = utmSource || 'ai_unknown'
      this.setSessionStorage('columbus_ai_source', this.aiSource)
      this.setSessionStorage('columbus_landing_page', window.location.href)
    }

    // Check for AI-specific query parameters
    const aiParams = ['from_chatgpt', 'from_claude', 'from_perplexity', 'ai_ref']
    for (const param of aiParams) {
      if (urlParams.has(param)) {
        const value = urlParams.get(param)
        // If value is 'true' or empty, extract source from param name
        if (!value || value === 'true' || value === '1') {
          this.aiSource = param.replace('from_', '')
        } else {
          this.aiSource = value
        }
        this.setSessionStorage('columbus_ai_source', this.aiSource)
        this.setSessionStorage('columbus_landing_page', window.location.href)
        break
      }
    }
  }

  /**
   * Get or create session ID
   */
  private getOrCreateSession(): string {
    const existingSession = this.getCookie('columbus_session')
    if (existingSession) {
      return existingSession
    }

    const newSession = this.generateId()
    this.setCookie('columbus_session', newSession, this.config.sessionDuration)
    return newSession
  }

  /**
   * Track a page view
   */
  trackPageView(metadata?: Record<string, any>): void {
    // Only track if from AI source (to avoid noise)
    if (!this.aiSource) {
      this.log('Skipping pageview - not from AI source')
      return
    }

    const event: TrackingEvent = {
      type: 'pageview',
      organizationId: this.config.organizationId,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      source: this.aiSource,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      landingPage: this.getSessionStorage('columbus_landing_page'),
      currentPage: typeof window !== 'undefined' ? window.location.href : undefined,
      metadata
    }

    this.queueEvent(event)
  }

  /**
   * Track a conversion event
   */
  trackConversion(eventName: string, options?: ConversionOptions): void {
    // Track conversions even if not from AI source (attribution can be done server-side)
    const event: TrackingEvent = {
      type: 'conversion',
      organizationId: this.config.organizationId,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      source: this.aiSource || undefined,
      landingPage: this.getSessionStorage('columbus_landing_page'),
      currentPage: typeof window !== 'undefined' ? window.location.href : undefined,
      eventName,
      value: options?.value,
      currency: options?.currency || 'USD',
      metadata: options?.metadata
    }

    this.queueEvent(event)

    // Flush immediately for conversions
    this.flush()
  }

  /**
   * Track session start
   */
  private trackSessionStart(): void {
    const event: TrackingEvent = {
      type: 'session_start',
      organizationId: this.config.organizationId,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      source: this.aiSource || undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      landingPage: typeof window !== 'undefined' ? window.location.href : undefined
    }

    this.queueEvent(event)
  }

  /**
   * Get the detected AI source
   */
  getSource(): string | null {
    return this.aiSource
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Check if visitor came from AI platform
   */
  isFromAI(): boolean {
    return this.aiSource !== null
  }

  /**
   * Manually set AI source (useful for server-side detection)
   */
  setSource(source: string): void {
    this.aiSource = source
    this.setSessionStorage('columbus_ai_source', source)
  }

  /**
   * Queue an event for sending
   */
  private queueEvent(event: TrackingEvent): void {
    this.eventQueue.push(event)
    this.log('Event queued', event)
  }

  /**
   * Flush queued events to server
   */
  private async flush(sync = false): Promise<void> {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    const payload = {
      events,
      apiKey: this.config.apiKey
    }

    if (sync && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      // Use sendBeacon for sync flush (page unload)
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
      navigator.sendBeacon(this.config.endpoint, blob)
      this.log('Events flushed (beacon)', events.length)
    } else {
      // Use fetch for async flush
      try {
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          keepalive: true
        })
        this.log('Events flushed (fetch)', events.length)
      } catch (error) {
        // Re-queue events on failure
        this.eventQueue = [...events, ...this.eventQueue]
        this.log('Flush failed, re-queued events', error)
      }
    }
  }

  /**
   * Destroy the tracker
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush(true)
    this.isInitialized = false
  }

  // Helper methods

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  private getCurrentDomain(): string {
    if (typeof window === 'undefined') return ''
    return window.location.hostname
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? match[2] : null
  }

  private setCookie(name: string, value: string, minutes: number): void {
    if (typeof document === 'undefined') return
    const expires = new Date()
    expires.setTime(expires.getTime() + minutes * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;domain=${this.config.cookieDomain};SameSite=Lax`
  }

  private getSessionStorage(key: string): string | null {
    if (typeof sessionStorage === 'undefined') return null
    return sessionStorage.getItem(key)
  }

  private setSessionStorage(key: string, value: string): void {
    if (typeof sessionStorage === 'undefined') return
    sessionStorage.setItem(key, value)
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[Columbus]', ...args)
    }
  }
}

// Export singleton for simple usage
let defaultTracker: ColumbusTracker | null = null

export function initColumbus(config: ColumbusConfig): ColumbusTracker {
  defaultTracker = new ColumbusTracker(config)
  return defaultTracker
}

export function trackPageView(metadata?: Record<string, any>): void {
  if (defaultTracker) {
    defaultTracker.trackPageView(metadata)
  } else {
    console.warn('[Columbus] Tracker not initialized. Call initColumbus() first.')
  }
}

export function trackConversion(eventName: string, options?: ConversionOptions): void {
  if (defaultTracker) {
    defaultTracker.trackConversion(eventName, options)
  } else {
    console.warn('[Columbus] Tracker not initialized. Call initColumbus() first.')
  }
}

export function isFromAI(): boolean {
  return defaultTracker?.isFromAI() || false
}

export function getAISource(): string | null {
  return defaultTracker?.getSource() || null
}

export default ColumbusTracker
