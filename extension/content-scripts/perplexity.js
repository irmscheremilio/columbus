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

      // Find search input - Perplexity uses a contenteditable div with id="ask-input"
      console.log('Columbus Perplexity: Looking for input field...')

      let input = await this.waitForElement([
        '#ask-input',                              // Main input field ID
        '[data-lexical-editor="true"]',            // Lexical editor attribute
        '[role="textbox"][contenteditable="true"]', // Textbox role
        '[contenteditable="true"][data-lexical-editor]',
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="ask"]',
        '[data-testid="search-input"]',
        '[data-testid="query-input"]'
      ], 15000)

      if (!input) {
        // Fallback: scan for contenteditable elements
        console.log('Columbus Perplexity: Primary selectors failed, scanning for contenteditable...')
        console.log('Columbus Perplexity: Current URL:', window.location.href)

        const editables = document.querySelectorAll('[contenteditable="true"]')
        console.log('Columbus Perplexity: Found', editables.length, 'contenteditable elements')

        for (const ed of editables) {
          // Look for the input that's visible and has lexical editor or is inside the input area
          if (ed.offsetParent !== null) {
            const isLexical = ed.hasAttribute('data-lexical-editor')
            const hasPlaceholder = ed.getAttribute('aria-placeholder') || ed.closest('[aria-placeholder]')
            console.log('Columbus Perplexity: Contenteditable:', ed.id, 'lexical:', isLexical, 'placeholder:', hasPlaceholder)
            if (isLexical || ed.id === 'ask-input') {
              input = ed
              break
            }
          }
        }

        // Last fallback: any visible contenteditable
        if (!input) {
          for (const ed of editables) {
            if (ed.offsetParent !== null) {
              input = ed
              break
            }
          }
        }
      }

      if (!input) {
        console.log('Columbus Perplexity: Could not find input field')
        throw new Error('Could not find search input')
      }

      console.log('Columbus Perplexity: Found input:', input.tagName, input.id || input.className)

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

      // Perplexity always uses web search, but track if sources were actually found
      const hadWebSearch = true
      const sourcesFound = citations.length

      return {
        responseText,
        brandMentioned,
        citations,
        competitorMentions,
        position,
        sentiment,
        modelUsed: 'Perplexity',
        hadWebSearch,
        sourcesFound, // Additional metric: how many sources were cited
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
    await this.delay(100)

    // Handle Lexical editor (contenteditable with data-lexical-editor)
    if (element.hasAttribute('data-lexical-editor') || element.getAttribute('contenteditable') === 'true') {
      console.log('Columbus Perplexity: Typing into Lexical/contenteditable editor')

      // Clear existing content
      element.innerHTML = ''

      // For Lexical, we need to simulate actual keyboard input
      // First, try setting text content directly
      const p = document.createElement('p')
      p.textContent = text
      element.appendChild(p)

      // Dispatch input event
      element.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
      }))

      // Also try beforeinput for Lexical
      element.dispatchEvent(new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
      }))

      await this.delay(200)

      // If the content didn't stick, try character by character
      if (!element.textContent || element.textContent.trim() === '') {
        console.log('Columbus Perplexity: Direct insert failed, trying character-by-character')
        element.focus()

        for (const char of text) {
          // Simulate keydown, keypress, input, keyup sequence
          element.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }))
          element.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }))
          element.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            inputType: 'insertText',
            data: char
          }))
          element.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }))
          await this.delay(10)
        }
      }

      return
    }

    // Handle regular textarea/input
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      element.value = ''
      element.dispatchEvent(new Event('input', { bubbles: true }))

      // Type with human-like delays
      for (const char of text) {
        element.value += char
        element.dispatchEvent(new Event('input', { bubbles: true }))
        await this.delay(15 + Math.random() * 25)
      }
    }
  }

  async submitSearch(input) {
    // Wait a moment for the submit button to become enabled
    await this.delay(500)

    // Try clicking submit button first
    const submitBtnSelectors = [
      '[data-testid="submit-button"]:not([disabled])',
      'button[aria-label="Submit"]:not([disabled])',
      'button[type="submit"]:not([disabled])'
    ]

    for (const selector of submitBtnSelectors) {
      const btn = document.querySelector(selector)
      if (btn) {
        console.log('Columbus Perplexity: Clicking submit button:', selector)
        btn.click()
        return
      }
    }

    // Check if submit is disabled (need to wait for content)
    const disabledSubmit = document.querySelector('[data-testid="submit-button"]')
    if (disabledSubmit && disabledSubmit.disabled) {
      console.log('Columbus Perplexity: Submit button is disabled, waiting...')
      await this.delay(500)

      // Try again
      const btn = document.querySelector('[data-testid="submit-button"]:not([disabled])')
      if (btn) {
        btn.click()
        return
      }
    }

    // Fallback: Press Enter
    console.log('Columbus Perplexity: Using Enter key to submit')
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true
    }))
  }

  async waitForResponseComplete(timeout = 120000) {
    const start = Date.now()
    let lastTextLength = 0
    let stableCount = 0
    const requiredStableChecks = 3 // Text must be stable for 3 consecutive checks

    // Wait for response to start appearing
    console.log('Columbus Perplexity: Waiting for response to start...')
    await this.delay(3000)

    while (Date.now() - start < timeout) {
      // Check for loading/streaming indicators
      const isLoading = document.querySelector('[data-testid="loading"]') ||
                        document.querySelector('.animate-pulse') ||
                        document.querySelector('[data-loading="true"]') ||
                        document.querySelector('[class*="loading"]') ||
                        document.querySelector('[class*="streaming"]')

      // Check for stop button (visible while generating)
      const stopBtn = document.querySelector('[aria-label="Stop"]') ||
                      document.querySelector('[aria-label="Stop generating"]') ||
                      document.querySelector('button[data-testid="stop-button"]') ||
                      document.querySelector('button[class*="stop"]')

      // Get current response text length
      const currentText = this.getCurrentResponseText()
      const currentLength = currentText.length

      console.log('Columbus Perplexity: Response check - loading:', !!isLoading, 'stopBtn:', !!stopBtn, 'textLength:', currentLength, 'stable:', stableCount)

      // If there's a stop button or loading indicator, response is still generating
      if (stopBtn || isLoading) {
        stableCount = 0
        lastTextLength = currentLength
        await this.delay(1000)
        continue
      }

      // Check if we have content and it's stable
      if (currentLength > 50) {
        if (currentLength === lastTextLength) {
          stableCount++
          console.log('Columbus Perplexity: Text stable, count:', stableCount)

          if (stableCount >= requiredStableChecks) {
            // Text has been stable for multiple checks, response is complete
            console.log('Columbus Perplexity: Response complete, length:', currentLength)
            await this.delay(500) // Final render wait
            return currentText
          }
        } else {
          // Text is still changing
          stableCount = 0
          lastTextLength = currentLength
        }
      }

      await this.delay(1000)
    }

    // Timeout - return whatever we have
    console.log('Columbus Perplexity: Timeout reached, returning current response')
    const finalText = this.getCurrentResponseText()
    if (finalText.length > 50) {
      return finalText
    }

    throw new Error('Response timeout')
  }

  getCurrentResponseText() {
    // Get the current response text for stability checking
    const answerSelectors = [
      '[data-testid="answer-content"]',
      '.prose',
      '.markdown',
      '[class*="answer"]',
      '[class*="response"]'
    ]

    for (const selector of answerSelectors) {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        const answer = elements[elements.length - 1]
        const text = answer.innerText || answer.textContent || ''
        if (text.length > 20) {
          return text
        }
      }
    }

    return ''
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
