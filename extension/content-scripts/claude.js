// Columbus Extension - Claude Content Script
// Handles prompt execution and response capture on claude.ai

class ClaudeCapture {
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
    const hasEditor = !!document.querySelector('[contenteditable="true"]') ||
                      !!document.querySelector('.ProseMirror')
    const hasNewChat = !!document.querySelector('[data-testid="new-chat-button"]') ||
                       !!document.querySelector('button[aria-label="New conversation"]')

    return hasEditor || hasNewChat
  }

  async executePrompt(promptText, brand, competitors) {
    if (this.isExecuting) {
      throw new Error('Already executing a prompt')
    }

    this.isExecuting = true
    const startTime = Date.now()

    try {
      // Start a new conversation
      await this.startNewConversation()
      await this.delay(1000)

      // Find input field
      const input = await this.waitForElement([
        '[contenteditable="true"]',
        '.ProseMirror',
        'div[data-placeholder]'
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
        modelUsed: 'Claude',
        hadWebSearch: false, // Claude doesn't have web search
        responseTimeMs
      }
    } finally {
      this.isExecuting = false
    }
  }

  async startNewConversation() {
    const newChatBtn = document.querySelector('[data-testid="new-chat-button"]') ||
                       document.querySelector('button[aria-label="New conversation"]') ||
                       document.querySelector('a[href="/new"]')

    if (newChatBtn) {
      newChatBtn.click()
      await this.delay(1500)
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

    // Clear existing content
    element.innerHTML = ''

    // Create a text node and insert
    const textNode = document.createTextNode(text)
    element.appendChild(textNode)

    // Trigger input events
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))

    // For ProseMirror, we might need to trigger additional events
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text
    })
    element.dispatchEvent(inputEvent)
  }

  async findSendButton() {
    const selectors = [
      'button[aria-label="Send Message"]',
      'button[aria-label="Send"]',
      '[data-testid="send-button"]',
      'button:has(svg[data-testid="send-icon"])'
    ]

    for (const selector of selectors) {
      try {
        const btn = document.querySelector(selector)
        if (btn && !btn.disabled) return btn
      } catch {
        // Selector might not be supported
      }
    }

    // Fallback: find button with send icon
    const buttons = document.querySelectorAll('button')
    for (const btn of buttons) {
      if (btn.innerHTML.includes('send') || btn.innerHTML.includes('arrow')) {
        if (!btn.disabled) return btn
      }
    }

    return null
  }

  async waitForResponseComplete(timeout = 120000) {
    const start = Date.now()

    // Wait for response to start
    await this.delay(2000)

    while (Date.now() - start < timeout) {
      // Check if still generating
      const stopBtn = document.querySelector('[aria-label="Stop response"]') ||
                      document.querySelector('button:has([data-testid="stop-icon"])')

      // Check for typing indicator
      const isTyping = document.querySelector('.typing-indicator') ||
                       document.querySelector('[data-testid="thinking"]')

      if (!stopBtn && !isTyping) {
        // Response might be complete
        await this.delay(1000)

        // Double check
        const stillGenerating = document.querySelector('[aria-label="Stop response"]')
        if (!stillGenerating) {
          return this.extractLatestResponse()
        }
      }

      await this.delay(500)
    }

    throw new Error('Response timeout')
  }

  extractLatestResponse() {
    // Find Claude's response
    const messageSelectors = [
      '[data-testid="message-content"]',
      '.font-claude-message',
      '.message-content.assistant',
      '.prose'
    ]

    for (const selector of messageSelectors) {
      const messages = document.querySelectorAll(selector)
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1]
        return lastMessage.innerText || lastMessage.textContent || ''
      }
    }

    // Fallback: look for any recent message that's not the user's
    const allMessages = document.querySelectorAll('[class*="message"]')
    for (let i = allMessages.length - 1; i >= 0; i--) {
      const msg = allMessages[i]
      if (!msg.classList.toString().includes('user') &&
          !msg.classList.toString().includes('human')) {
        return msg.innerText || msg.textContent || ''
      }
    }

    throw new Error('No response found')
  }

  extractCitations() {
    // Claude typically doesn't include web citations
    // But check for any links in the response
    const citations = []
    const seenUrls = new Set()

    const responseEl = document.querySelector('[data-testid="message-content"]:last-of-type') ||
                       document.querySelector('.font-claude-message:last-of-type')

    if (!responseEl) return citations

    const links = responseEl.querySelectorAll('a[href^="http"]')

    links.forEach((link, index) => {
      const url = link.href
      if (!seenUrls.has(url)) {
        seenUrls.add(url)
        citations.push({
          url,
          title: link.textContent || '',
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

    // Check for numbered lists
    const listPattern = /(\d+)\.\s+([^\n]+)/g
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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Initialize
const claudeCapture = new ClaudeCapture()
console.log('Columbus: Claude content script loaded')
