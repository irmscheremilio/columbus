// Columbus Extension - Gemini Content Script
// Handles prompt execution and response capture on gemini.google.com

class GeminiCapture {
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
    // Check for presence of chat input
    const hasInput = !!document.querySelector('rich-textarea') ||
                     !!document.querySelector('.ql-editor') ||
                     !!document.querySelector('[contenteditable="true"]') ||
                     !!document.querySelector('textarea')

    // Check for Google account indicator
    const hasAccount = !!document.querySelector('[data-ogsr-up]') ||
                       !!document.querySelector('img[alt*="Google Account"]') ||
                       !!document.querySelector('[aria-label*="Google Account"]')

    return hasInput || hasAccount
  }

  async executePrompt(promptText, brand, competitors) {
    if (this.isExecuting) {
      throw new Error('Already executing a prompt')
    }

    this.isExecuting = true
    const startTime = Date.now()

    try {
      // Start a new chat
      await this.startNewChat()
      await this.delay(1000)

      // Find input field
      const input = await this.waitForElement([
        'rich-textarea',
        '.ql-editor',
        '[contenteditable="true"]',
        'textarea'
      ], 10000)

      if (!input) {
        throw new Error('Could not find input field')
      }

      // Type the prompt
      await this.typeIntoInput(input, promptText)
      await this.delay(500)

      // Submit
      await this.submitPrompt()

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
        modelUsed: 'Gemini',
        hadWebSearch: citations.length > 0,
        responseTimeMs
      }
    } finally {
      this.isExecuting = false
    }
  }

  async startNewChat() {
    // Service worker navigates us to /app, so we should already be on fresh chat
    console.log('Columbus Gemini: Waiting for new chat page to be ready')
    await this.delay(500)

    // If there's an existing conversation, try clicking new chat button
    if (document.querySelector('[data-message-id]') || document.querySelector('message-content')) {
      const newChatSelectors = [
        'button[aria-label="New chat"]',
        'a[href="/app"]',
        '[data-test-id="new-chat-button"]',
        'button[data-test-id="bard-sidenav-new-chat-button"]'
      ]

      for (const selector of newChatSelectors) {
        const btn = document.querySelector(selector)
        if (btn) {
          console.log('Columbus Gemini: Clicking new chat button')
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

    // Handle different input types
    if (element.tagName === 'RICH-TEXTAREA') {
      // Gemini's custom textarea component
      const innerInput = element.querySelector('[contenteditable="true"]') ||
                         element.querySelector('.ql-editor') ||
                         element

      if (innerInput) {
        innerInput.focus()
        innerInput.textContent = text
        innerInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
    } else if (element.getAttribute('contenteditable') === 'true' ||
               element.classList.contains('ql-editor')) {
      element.textContent = text
      element.dispatchEvent(new Event('input', { bubbles: true }))
    } else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      element.value = text
      element.dispatchEvent(new Event('input', { bubbles: true }))
    }

    // Additional event triggers for Gemini's reactive system
    element.dispatchEvent(new Event('change', { bubbles: true }))
    element.dispatchEvent(new Event('blur', { bubbles: true }))
    element.focus()
  }

  async submitPrompt() {
    // Look for send button
    const sendBtnSelectors = [
      'button[aria-label="Send message"]',
      '[data-test-id="send-button"]',
      'button.send-button',
      'button[type="submit"]',
      'mat-icon-button[aria-label*="Send"]'
    ]

    for (const selector of sendBtnSelectors) {
      const btn = document.querySelector(selector)
      if (btn && !btn.disabled) {
        btn.click()
        return
      }
    }

    // Fallback: press Enter
    const input = document.querySelector('rich-textarea') ||
                  document.querySelector('[contenteditable="true"]')

    if (input) {
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

    // Wait for response to start appearing
    await this.delay(2000)

    while (Date.now() - start < timeout) {
      // Check for stop/loading indicators
      const isGenerating = document.querySelector('[data-test-id="stop-button"]') ||
                           document.querySelector('button[aria-label="Stop"]') ||
                           document.querySelector('.loading-dots') ||
                           document.querySelector('[class*="thinking"]')

      if (!isGenerating) {
        // Verify we have a response
        const response = document.querySelector('.model-response-text') ||
                         document.querySelector('message-content') ||
                         document.querySelector('[data-message-id]')

        if (response) {
          await this.delay(1000) // Final render wait
          return this.extractLatestResponse()
        }
      }

      await this.delay(500)
    }

    throw new Error('Response timeout')
  }

  extractLatestResponse() {
    // Find Gemini's response
    const responseSelectors = [
      '.model-response-text',
      'message-content:last-of-type',
      '[data-message-author-role="model"]',
      '.response-content'
    ]

    for (const selector of responseSelectors) {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        const lastResponse = elements[elements.length - 1]
        return lastResponse.innerText || lastResponse.textContent || ''
      }
    }

    // Fallback: look for any model messages
    const messages = document.querySelectorAll('[class*="model"], [class*="response"]')
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      const text = msg.innerText || msg.textContent
      if (text && text.length > 50) { // Likely a real response
        return text
      }
    }

    throw new Error('No response found')
  }

  extractCitations() {
    const citations = []
    const seenUrls = new Set()

    // Find latest response
    const responseEl = document.querySelector('.model-response-text:last-of-type') ||
                       document.querySelector('message-content:last-of-type') ||
                       document.querySelector('[data-message-author-role="model"]:last-of-type')

    if (!responseEl) return citations

    // Find all external links
    const links = responseEl.querySelectorAll('a[href^="http"]')

    links.forEach((link, index) => {
      const url = link.href
      // Exclude Google's own links
      if (!seenUrls.has(url) && !url.includes('google.com/search')) {
        seenUrls.add(url)
        citations.push({
          url,
          title: link.textContent?.trim() || '',
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

    // Check for numbered/bulleted lists
    const listPattern = /(?:^|\n)\s*(?:(\d+)[.\)]\s*|\*\s+|•\s+|[-–]\s+)(.+)/gm
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

    const positiveWords = ['best', 'excellent', 'great', 'recommended', 'popular', 'leading', 'top', 'trusted', 'reliable', 'innovative', 'powerful', 'impressive']
    const negativeWords = ['worst', 'poor', 'bad', 'avoid', 'issue', 'problem', 'expensive', 'limited', 'lacks', 'however', 'although', 'criticism']

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
const geminiCapture = new GeminiCapture()
console.log('Columbus: Gemini content script loaded')
