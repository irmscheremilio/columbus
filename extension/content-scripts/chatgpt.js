// Columbus Extension - ChatGPT Content Script
// Handles prompt execution and response capture on chatgpt.com

class ChatGPTCapture {
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
    // Check for presence of chat interface elements
    const hasPromptInput = !!document.querySelector('#prompt-textarea') ||
                           !!document.querySelector('textarea[data-id]') ||
                           !!document.querySelector('[contenteditable="true"]')
    const hasNewChatBtn = !!document.querySelector('[data-testid="new-chat-button"]') ||
                          !!document.querySelector('nav a[href="/"]')

    return hasPromptInput || hasNewChatBtn
  }

  async executePrompt(promptText, brand, competitors) {
    if (this.isExecuting) {
      throw new Error('Already executing a prompt')
    }

    this.isExecuting = true
    const startTime = Date.now()

    try {
      // Start a new chat to ensure clean state
      await this.startNewChat()
      await this.delay(1000)

      // Find and fill input
      const input = await this.waitForElement([
        '#prompt-textarea',
        'textarea[data-id]',
        '[contenteditable="true"][data-placeholder]'
      ], 10000)

      if (!input) {
        throw new Error('Could not find input field')
      }

      // Type the prompt
      await this.typeIntoInput(input, promptText)
      await this.delay(500)

      // Click send button
      const sendBtn = await this.findSendButton()
      if (!sendBtn) {
        throw new Error('Could not find send button')
      }

      sendBtn.click()

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
        modelUsed: this.detectModel(),
        hadWebSearch: citations.length > 0,
        responseTimeMs
      }
    } finally {
      this.isExecuting = false
    }
  }

  async startNewChat() {
    const newChatBtn = document.querySelector('[data-testid="new-chat-button"]') ||
                       document.querySelector('nav a[href="/"]')

    if (newChatBtn) {
      newChatBtn.click()
      await this.delay(1000)
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

    // Handle contenteditable
    if (element.getAttribute('contenteditable') === 'true') {
      element.innerHTML = ''
      element.textContent = text
      element.dispatchEvent(new Event('input', { bubbles: true }))
    } else {
      // Handle textarea
      element.value = ''
      element.dispatchEvent(new Event('input', { bubbles: true }))

      // Type with slight randomization
      for (const char of text) {
        element.value += char
        element.dispatchEvent(new Event('input', { bubbles: true }))
        await this.delay(20 + Math.random() * 30)
      }
    }

    // Trigger any necessary events
    element.dispatchEvent(new Event('change', { bubbles: true }))
  }

  async findSendButton() {
    const selectors = [
      '[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send"]',
      'form button[type="submit"]'
    ]

    for (const selector of selectors) {
      const btn = document.querySelector(selector)
      if (btn && !btn.disabled) return btn
    }

    return null
  }

  async waitForResponseComplete(timeout = 120000) {
    const start = Date.now()

    // Wait for response to start
    await this.delay(2000)

    while (Date.now() - start < timeout) {
      // Check if still generating (stop button visible)
      const stopBtn = document.querySelector('[data-testid="stop-button"]') ||
                      document.querySelector('[aria-label="Stop generating"]')

      if (!stopBtn) {
        // Response might be complete, wait a bit more and verify
        await this.delay(1000)

        const stillGenerating = document.querySelector('[data-testid="stop-button"]') ||
                               document.querySelector('[aria-label="Stop generating"]')

        if (!stillGenerating) {
          return this.extractLatestResponse()
        }
      }

      await this.delay(500)
    }

    throw new Error('Response timeout')
  }

  extractLatestResponse() {
    // Find all assistant messages
    const messageSelectors = [
      '[data-message-author-role="assistant"]',
      '.agent-turn .markdown',
      '.group\\/conversation-turn:last-child .markdown'
    ]

    for (const selector of messageSelectors) {
      const messages = document.querySelectorAll(selector)
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1]
        return lastMessage.innerText || lastMessage.textContent || ''
      }
    }

    throw new Error('No response found')
  }

  extractCitations() {
    const citations = []
    const seenUrls = new Set()

    // Find all links in the latest response
    const responseEl = document.querySelector('[data-message-author-role="assistant"]:last-of-type') ||
                       document.querySelector('.agent-turn:last-child')

    if (!responseEl) return citations

    const links = responseEl.querySelectorAll('a[href^="http"]')

    links.forEach((link, index) => {
      const url = link.href
      if (!seenUrls.has(url)) {
        seenUrls.add(url)
        citations.push({
          url,
          title: link.textContent || link.title || '',
          position: index + 1
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

    const lowerText = text.toLowerCase()
    const lowerBrand = brand.toLowerCase()

    // Check if text contains numbered lists
    const listPattern = /(\d+)\.\s+([^\n]+)/g
    let match
    let position = 0

    while ((match = listPattern.exec(text)) !== null) {
      position++
      if (match[2].toLowerCase().includes(lowerBrand)) {
        return position
      }
    }

    // If brand mentioned but not in list, return null
    if (lowerText.includes(lowerBrand)) {
      return null // Mentioned but not ranked
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

    // Find sentences containing the brand
    const sentences = text.split(/[.!?]+/)
    const brandSentences = sentences.filter(s =>
      s.toLowerCase().includes(lowerBrand)
    )

    const positiveWords = ['best', 'excellent', 'great', 'recommended', 'popular', 'leading', 'top', 'trusted', 'reliable', 'innovative']
    const negativeWords = ['worst', 'poor', 'bad', 'avoid', 'issue', 'problem', 'expensive', 'limited', 'lacks', 'however']

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

  detectModel() {
    // Try to detect which model is being used
    const modelIndicator = document.querySelector('[data-testid="model-selector"]') ||
                           document.querySelector('.model-selector')

    if (modelIndicator) {
      return modelIndicator.textContent?.trim() || 'unknown'
    }

    return 'ChatGPT'
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Initialize
const chatGPTCapture = new ChatGPTCapture()
console.log('Columbus: ChatGPT content script loaded')
