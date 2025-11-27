// Columbus Extension - Perplexity Content Script
// Handles prompt execution and response capture on perplexity.ai

class PerplexityCapture {
  constructor() {
    this.isExecuting = false
    this.setupMessageListener()
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message).then(sendResponse).catch(err => {
        sendResponse({ error: err.message })
      })
      return true // Async response
    })
  }

  async handleMessage(message) {
    switch (message.type) {
      case 'CHECK_LOGIN':
        return { loggedIn: this.isLoggedIn() }

      case 'EXECUTE_PROMPT':
        return await this.executePrompt(message.prompt, message.brand, message.competitors)

      default:
        return { error: 'Unknown message type' }
    }
  }

  isLoggedIn() {
    // Multiple ways to detect if user is logged in to Perplexity

    // Check for any textarea (main search input)
    const hasTextarea = !!document.querySelector('textarea')

    // Check for search/input area
    const hasSearchInput = !!document.querySelector('textarea[placeholder*="Ask"]') ||
                           !!document.querySelector('textarea[placeholder*="ask"]') ||
                           !!document.querySelector('input[placeholder*="Ask"]') ||
                           !!document.querySelector('[data-testid="search-input"]') ||
                           !!document.querySelector('[contenteditable="true"]')

    // Check for user profile/avatar indicators (logged in users see their profile)
    const hasUserIndicator = !!document.querySelector('[data-testid="user-menu"]') ||
                             !!document.querySelector('[aria-label="User menu"]') ||
                             !!document.querySelector('img[alt*="profile"]') ||
                             !!document.querySelector('img[alt*="avatar"]') ||
                             !!document.querySelector('[class*="avatar"]') ||
                             !!document.querySelector('[class*="profile"]')

    // Check for navigation elements that only appear when logged in
    const hasNavigation = !!document.querySelector('nav') ||
                          !!document.querySelector('[class*="sidebar"]')

    // If there's a textarea or search input, assume we can use it
    // Perplexity allows some use without login, so just check for the UI elements
    return hasTextarea || hasSearchInput || hasUserIndicator
  }

  async executePrompt(promptText, brand, competitors) {
    if (this.isExecuting) {
      throw new Error('Already executing a prompt')
    }

    this.isExecuting = true
    const startTime = Date.now()

    try {
      // Start a new search
      await this.startNewSearch()
      await this.delay(1000)

      // Wait a bit longer for Perplexity to fully load
      await this.delay(2000)

      // Find search input - try multiple selectors
      console.log('Columbus Perplexity: Looking for input field...')

      let input = await this.waitForElement([
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="ask"]',
        'textarea[placeholder*="anything"]',
        'textarea[placeholder*="Search"]',
        'textarea[placeholder*="search"]',
        'input[placeholder*="Ask"]',
        '[data-testid="search-input"]',
        '[data-testid="query-input"]',
        'textarea[class*="search"]',
        'textarea[class*="input"]',
        'textarea[rows]',
        'textarea'
      ], 15000)

      if (!input) {
        // Try to find any textarea on the page
        console.log('Columbus Perplexity: Primary selectors failed, scanning page...')
        console.log('Columbus Perplexity: Current URL:', window.location.href)
        console.log('Columbus Perplexity: Page title:', document.title)

        // Log what elements exist
        const textareas = document.querySelectorAll('textarea')
        console.log('Columbus Perplexity: Found', textareas.length, 'textarea elements')

        const inputs = document.querySelectorAll('input[type="text"], input:not([type])')
        console.log('Columbus Perplexity: Found', inputs.length, 'text input elements')

        // Try textareas
        for (const ta of textareas) {
          console.log('Columbus Perplexity: Textarea:', ta.placeholder, ta.className, 'visible:', ta.offsetParent !== null)
          if (ta.offsetParent !== null) {
            input = ta
            break
          }
        }

        // Try contenteditable
        if (!input) {
          const editables = document.querySelectorAll('[contenteditable="true"]')
          console.log('Columbus Perplexity: Found', editables.length, 'contenteditable elements')
          for (const ed of editables) {
            if (ed.offsetParent !== null) {
              input = ed
              break
            }
          }
        }
      }

      if (!input) {
        // Last resort: screenshot the page state for debugging
        console.log('Columbus Perplexity: Page HTML preview:', document.body.innerHTML.substring(0, 2000))
        throw new Error('Could not find search input')
      }

      console.log('Columbus Perplexity: Found input:', input.tagName, input.placeholder || input.className)

      // Type the prompt
      await this.typeIntoInput(input, promptText)
      await this.delay(500)

      // Submit (press Enter or click button)
      await this.submitSearch(input)

      // Wait for response to complete
      const responseText = await this.waitForResponseComplete()

      // Extract data from response
      const responseTimeMs = Date.now() - startTime
      const brandMentioned = this.checkBrandMention(responseText, brand)
      const citations = this.extractCitations()
      const competitorMentions = this.findCompetitorMentions(responseText, competitors)
      const position = this.findBrandPosition(responseText, brand)
      const sentiment = this.analyzeSentiment(responseText, brand)

      return {
        responseText,
        brandMentioned,
        citations,
        competitorMentions,
        position,
        sentiment,
        modelUsed: 'Perplexity',
        hadWebSearch: true, // Perplexity always uses web search
        responseTimeMs
      }
    } finally {
      this.isExecuting = false
    }
  }

  async startNewSearch() {
    // Service worker navigates us to home page, so we should already be on fresh search
    console.log('Columbus Perplexity: Waiting for search page to be ready')
    await this.delay(500)

    // If there's an existing answer, try clicking new thread button
    const hasExistingAnswer = document.querySelector('[class*="answer"]') ||
                              document.querySelector('[class*="prose"]') ||
                              document.querySelector('[class*="response"]')

    if (hasExistingAnswer) {
      const newSearchSelectors = [
        '[data-testid="new-thread-button"]',
        'button[aria-label="New thread"]',
        'button[aria-label="New search"]',
        'a[href="/"]',
        '[class*="new-thread"]'
      ]

      for (const selector of newSearchSelectors) {
        const btn = document.querySelector(selector)
        if (btn) {
          console.log('Columbus Perplexity: Clicking new thread button')
          btn.click()
          await this.delay(2000)
          return
        }
      }
    }
  }

  async waitForElement(selectors, timeout = 10000) {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors]
    const start = Date.now()

    while (Date.now() - start < timeout) {
      for (const selector of selectorList) {
        const el = document.querySelector(selector)
        if (el) return el
      }
      await this.delay(200)
    }

    return null
  }

  async typeIntoInput(element, text) {
    element.focus()

    // Clear existing
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      element.value = ''
      element.dispatchEvent(new Event('input', { bubbles: true }))

      // Type with human-like delays
      for (const char of text) {
        element.value += char
        element.dispatchEvent(new Event('input', { bubbles: true }))
        await this.delay(15 + Math.random() * 25)
      }
    } else {
      // Contenteditable
      element.textContent = text
      element.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  async submitSearch(input) {
    // Try clicking submit button first
    const submitBtn = document.querySelector('[data-testid="submit-button"]') ||
                      document.querySelector('button[aria-label="Submit"]') ||
                      document.querySelector('button[type="submit"]')

    if (submitBtn && !submitBtn.disabled) {
      submitBtn.click()
    } else {
      // Press Enter
      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      }))
    }
  }

  async waitForResponseComplete(timeout = 120000) {
    const start = Date.now()

    // Wait for response to start
    await this.delay(3000)

    while (Date.now() - start < timeout) {
      // Check for loading/streaming indicators
      const isLoading = document.querySelector('[data-testid="loading"]') ||
                        document.querySelector('.animate-pulse') ||
                        document.querySelector('[data-loading="true"]')

      // Check for stop button
      const stopBtn = document.querySelector('[aria-label="Stop"]') ||
                      document.querySelector('button[data-testid="stop-button"]')

      if (!isLoading && !stopBtn) {
        // Check if we have content
        const hasContent = document.querySelector('.prose') ||
                           document.querySelector('[data-testid="answer-content"]')

        if (hasContent) {
          await this.delay(1000) // Wait for any final rendering
          return this.extractLatestResponse()
        }
      }

      await this.delay(500)
    }

    throw new Error('Response timeout')
  }

  extractLatestResponse() {
    // Find the main answer content
    const answerSelectors = [
      '[data-testid="answer-content"]',
      '.prose',
      '.markdown',
      '[class*="answer"]'
    ]

    for (const selector of answerSelectors) {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        // Get the last/main answer
        const answer = elements[elements.length - 1]
        return answer.innerText || answer.textContent || ''
      }
    }

    throw new Error('No response found')
  }

  extractCitations() {
    const citations = []
    const seenUrls = new Set()

    // Perplexity shows numbered citations
    const citationSelectors = [
      '.citation-link',
      '[data-testid="citation"]',
      'a[href^="http"]:not([href*="perplexity"])',
      '.source-link'
    ]

    for (const selector of citationSelectors) {
      const links = document.querySelectorAll(selector)
      links.forEach((link, index) => {
        const url = link.href
        if (url && !seenUrls.has(url) && !url.includes('perplexity.ai')) {
          seenUrls.add(url)
          citations.push({
            url,
            title: link.textContent?.trim() || link.title || '',
            position: citations.length + 1
          })
        }
      })
    }

    // Also look for numbered source indicators
    const sourceNumbers = document.querySelectorAll('[class*="source-number"], [class*="citation-number"]')
    sourceNumbers.forEach((numEl) => {
      const parentLink = numEl.closest('a')
      if (parentLink && parentLink.href && !seenUrls.has(parentLink.href)) {
        seenUrls.add(parentLink.href)
        citations.push({
          url: parentLink.href,
          title: parentLink.title || '',
          position: citations.length + 1
        })
      }
    })

    return citations
  }

  checkBrandMention(text, brand) {
    if (!brand) return false
    const lowerText = text.toLowerCase()
    const lowerBrand = brand.toLowerCase()
    return lowerText.includes(lowerBrand)
  }

  findCompetitorMentions(text, competitors) {
    if (!competitors || !Array.isArray(competitors)) return []

    const lowerText = text.toLowerCase()
    return competitors.filter(comp =>
      lowerText.includes(comp.toLowerCase())
    )
  }

  findBrandPosition(text, brand) {
    if (!brand) return null

    const lowerBrand = brand.toLowerCase()

    // Check for numbered lists
    const listPattern = /(\d+)\.\s+\*?\*?([^\n*]+)/g
    let match
    let position = 0

    while ((match = listPattern.exec(text)) !== null) {
      position++
      if (match[2].toLowerCase().includes(lowerBrand)) {
        return position
      }
    }

    return null
  }

  analyzeSentiment(text, brand) {
    if (!brand) return 'neutral'

    const lowerText = text.toLowerCase()
    const lowerBrand = brand.toLowerCase()

    if (!lowerText.includes(lowerBrand)) {
      return 'neutral'
    }

    const sentences = text.split(/[.!?]+/)
    const brandSentences = sentences.filter(s =>
      s.toLowerCase().includes(lowerBrand)
    )

    const positiveWords = ['best', 'excellent', 'great', 'recommended', 'popular', 'leading', 'top', 'trusted', 'reliable', 'innovative', 'powerful']
    const negativeWords = ['worst', 'poor', 'bad', 'avoid', 'issue', 'problem', 'expensive', 'limited', 'lacks', 'however', 'although']

    let positiveCount = 0
    let negativeCount = 0

    brandSentences.forEach(sentence => {
      const lower = sentence.toLowerCase()
      positiveWords.forEach(word => {
        if (lower.includes(word)) positiveCount++
      })
      negativeWords.forEach(word => {
        if (lower.includes(word)) negativeCount++
      })
    })

    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Initialize
const perplexityCapture = new PerplexityCapture()
console.log('Columbus: Perplexity content script loaded')
