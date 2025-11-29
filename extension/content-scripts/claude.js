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

      case 'SUBMIT_PROMPT':
        return await this.submitPromptOnly(message.prompt)

      case 'COLLECT_RESPONSE':
        return await this.collectResponse(message.brand, message.competitors)

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

      // Click send button or use Enter key
      const sendBtn = await this.findSendButton()
      if (sendBtn) {
        sendBtn.click()
      } else {
        // Fallback: try pressing Enter
        console.log('Columbus: Send button not found, trying Enter key')
        input.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true
        }))
      }

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

  // Submit prompt without waiting for response (for batch mode)
  async submitPromptOnly(promptText) {
    try {
      console.log('Columbus Claude: === SUBMIT PROMPT START ===')
      console.log('Columbus Claude: Prompt text length:', promptText.length)

      // Find input field
      const input = await this.waitForElement([
        '[contenteditable="true"]',
        '.ProseMirror',
        'div[data-placeholder]'
      ], 10000)

      if (!input) {
        console.error('Columbus Claude: Could not find input field!')
        return { success: false, error: 'Could not find input field' }
      }
      console.log('Columbus Claude: Found input field:', input.tagName, input.className)

      // Type the prompt
      await this.typeIntoInput(input, promptText)
      console.log('Columbus Claude: Typed prompt into input')
      await this.delay(500)

      // Check input has text
      const inputTextBefore = input.innerText?.trim() || ''
      console.log('Columbus Claude: Input text length after typing:', inputTextBefore.length)

      // Find and click send button
      const sendBtn = await this.findSendButton()
      console.log('Columbus Claude: Send button found:', !!sendBtn)

      if (sendBtn) {
        console.log('Columbus Claude: Send button classes:', sendBtn.className)
        console.log('Columbus Claude: Send button disabled:', sendBtn.disabled)
        console.log('Columbus Claude: Send button aria-label:', sendBtn.getAttribute('aria-label'))

        // Click with multiple methods
        console.log('Columbus Claude: Clicking send button...')
        await this.forceClick(sendBtn)
        console.log('Columbus Claude: forceClick completed')
      } else {
        console.log('Columbus Claude: No send button found, trying Enter key...')
      }

      // Also try keyboard submission as backup
      console.log('Columbus Claude: Also trying keyboard submission...')
      input.focus()
      await this.delay(100)

      // Try Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
        composed: true
      })
      input.dispatchEvent(enterEvent)
      console.log('Columbus Claude: Dispatched Enter keydown')

      // Also try on document
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      }))

      await this.delay(100)

      const keyupEvent = new KeyboardEvent('keyup', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      })
      input.dispatchEvent(keyupEvent)

      // Wait and verify
      await this.delay(1500)

      const inputAfter = document.querySelector('[contenteditable="true"]') ||
                         document.querySelector('.ProseMirror')
      const inputTextAfter = inputAfter?.innerText?.trim() || ''
      console.log('Columbus Claude: Input text length after submit:', inputTextAfter.length)

      // Check for response indicators
      const thinkingIndicator = document.querySelector('[class*="thinking"]') ||
                                document.querySelector('[class*="loading"]') ||
                                document.querySelector('[aria-label*="Stop"]') ||
                                document.querySelector('[aria-label*="Stopp"]') ||
                                document.querySelector('button[aria-label*="top"]')

      console.log('Columbus Claude: Thinking indicator found:', !!thinkingIndicator)

      // If input is cleared or response started, success
      if (inputTextAfter.length === 0 || inputTextAfter.length < inputTextBefore.length * 0.5) {
        console.log('Columbus Claude: SUCCESS - Input was cleared')
        return { success: true }
      }

      if (thinkingIndicator) {
        console.log('Columbus Claude: SUCCESS - Response is being generated')
        return { success: true }
      }

      // Retry clicking button multiple times
      if (sendBtn && !sendBtn.disabled) {
        console.log('Columbus Claude: Retrying button clicks...')
        for (let i = 0; i < 5; i++) {
          await this.forceClick(sendBtn)
          await this.delay(200)

          // Check if it worked
          const currentText = document.querySelector('[contenteditable="true"]')?.innerText?.trim() || ''
          if (currentText.length < inputTextBefore.length * 0.5) {
            console.log('Columbus Claude: SUCCESS on retry', i + 1)
            return { success: true }
          }
        }
      }

      console.log('Columbus Claude: === SUBMIT PROMPT END (may not have worked) ===')
      return { success: true } // Return success anyway, collection phase will verify
    } catch (error) {
      console.error('Columbus Claude: Submit error:', error)
      return { success: false, error: error.message }
    }
  }

  // Force click an element using multiple methods
  async forceClick(element) {
    if (!element) {
      console.log('Columbus Claude: forceClick - no element')
      return
    }

    console.log('Columbus Claude: forceClick - starting')

    // Scroll element into view first
    element.scrollIntoView({ behavior: 'instant', block: 'center' })
    await this.delay(100)

    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    console.log('Columbus Claude: forceClick - element position:', centerX, centerY)

    // Method 1: Focus and regular click
    element.focus()
    element.click()
    console.log('Columbus Claude: forceClick - regular click done')

    await this.delay(50)

    // Method 2: Pointer events (more modern, works better with React)
    const pointerdownEvent = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: centerX,
      clientY: centerY,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true
    })
    element.dispatchEvent(pointerdownEvent)

    await this.delay(30)

    const pointerupEvent = new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: centerX,
      clientY: centerY,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true
    })
    element.dispatchEvent(pointerupEvent)

    // Method 3: Mouse events with all properties
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: centerX,
      screenY: centerY,
      clientX: centerX,
      clientY: centerY,
      button: 0,
      buttons: 1,
      relatedTarget: null
    })
    element.dispatchEvent(mousedownEvent)

    await this.delay(30)

    const mouseupEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: centerX,
      screenY: centerY,
      clientX: centerX,
      clientY: centerY,
      button: 0,
      buttons: 0,
      relatedTarget: null
    })
    element.dispatchEvent(mouseupEvent)

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: centerX,
      screenY: centerY,
      clientX: centerX,
      clientY: centerY,
      button: 0,
      buttons: 0,
      relatedTarget: null
    })
    element.dispatchEvent(clickEvent)

    console.log('Columbus Claude: forceClick - mouse events dispatched')

    // Method 4: Try using the native click directly
    await this.delay(50)
    HTMLElement.prototype.click.call(element)

    // Method 5: If it's a button, try submitting parent form
    if (element.tagName === 'BUTTON') {
      const form = element.closest('form')
      if (form) {
        console.log('Columbus Claude: forceClick - trying form submit')
        try {
          form.requestSubmit(element)
        } catch (e) {
          // requestSubmit might not be supported
        }
      }
    }

    console.log('Columbus Claude: forceClick - complete')
  }

  // Collect response that's already been generated (for batch mode)
  async collectResponse(brand, competitors) {
    try {
      console.log('Columbus Claude: Collecting response (batch mode)')

      // Check if still generating
      const stopBtn = document.querySelector('button[aria-label="Stop"]') ||
                      document.querySelector('[data-testid="stop-button"]')

      if (stopBtn) {
        console.log('Columbus Claude: Still generating, waiting...')
        await this.delay(5000)
      }

      // Get the response text
      const responseText = this.getCurrentResponseText()

      if (!responseText || responseText.length < 50) {
        return { success: false, error: 'No response found or response too short' }
      }

      // Extract data
      const brandMentioned = this.checkBrandMention(responseText, brand)
      const citations = this.extractCitations()
      const competitorMentions = this.findCompetitorMentions(responseText, competitors)
      const position = this.findBrandPosition(responseText, brand)
      const sentiment = this.analyzeSentiment(responseText, brand)

      return {
        success: true,
        responseText,
        brandMentioned,
        citations,
        competitorMentions,
        position,
        sentiment,
        modelUsed: 'Claude',
        hadWebSearch: false
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async startNewConversation() {
    // Service worker navigates us to /new, so we should already be on a fresh chat
    // Just wait for the page to be ready
    console.log('Columbus Claude: Waiting for new conversation page to be ready')
    await this.delay(500)

    // If there's an existing conversation somehow, try clicking new chat button
    if (document.querySelector('[data-message-id]') || document.querySelector('[class*="message"]')) {
      const newChatSelectors = [
        '[data-testid="new-chat-button"]',
        'button[aria-label="New conversation"]',
        'button[aria-label="New chat"]',
        'a[href="/new"]'
      ]

      for (const selector of newChatSelectors) {
        const btn = document.querySelector(selector)
        if (btn) {
          console.log('Columbus Claude: Clicking new chat button')
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
    // Wait briefly for button to become enabled after text input
    await this.delay(300)

    // Direct selectors - including internationalized aria-labels
    const selectors = [
      // English
      'button[aria-label="Send Message"]',
      'button[aria-label="Send message"]',
      'button[aria-label="Send"]',
      // German
      'button[aria-label="Nachricht senden"]',
      'button[aria-label="Senden"]',
      // French
      'button[aria-label="Envoyer le message"]',
      'button[aria-label="Envoyer"]',
      // Spanish
      'button[aria-label="Enviar mensaje"]',
      'button[aria-label="Enviar"]',
      // Claude-specific classes
      'button[class*="Button_claude"]',
      'button[class*="send"]',
      '[data-testid="send-button"]',
      'fieldset button[type="button"]'
    ]

    for (const selector of selectors) {
      try {
        const btn = document.querySelector(selector)
        if (btn && !btn.disabled) {
          console.log('Columbus Claude: Found send button via selector:', selector)
          return btn
        }
      } catch {
        // Selector might not be supported
      }
    }

    // Find button by aria-label containing "send" in any language
    const allButtons = document.querySelectorAll('button[aria-label]')
    for (const btn of allButtons) {
      const label = btn.getAttribute('aria-label')?.toLowerCase() || ''
      // Common "send" translations
      if (label.includes('send') || label.includes('senden') ||
          label.includes('envoyer') || label.includes('enviar') ||
          label.includes('invia') || label.includes('verzenden')) {
        if (!btn.disabled) {
          console.log('Columbus Claude: Found send button via aria-label:', label)
          return btn
        }
      }
    }

    // Fallback: find the button near the input area with an SVG (arrow icon)
    const inputArea = document.querySelector('[contenteditable="true"]') ||
                      document.querySelector('.ProseMirror')
    if (inputArea) {
      // Look up the DOM tree to find container with the button
      let container = inputArea.parentElement
      for (let i = 0; i < 10 && container; i++) {
        const buttons = container.querySelectorAll('button:not([disabled])')
        for (const btn of buttons) {
          // Look for a button with an SVG that has an upward arrow path (send icon)
          const svg = btn.querySelector('svg')
          if (svg) {
            const path = svg.querySelector('path')
            const d = path?.getAttribute('d') || ''
            // Claude's send button has an upward arrow
            if (d.includes('120.49') || d.includes('72-72') || btn.className.includes('claude')) {
              console.log('Columbus Claude: Found send button via SVG arrow pattern')
              return btn
            }
          }
        }
        container = container.parentElement
      }
    }

    // Last resort: find any button with an upward arrow SVG near bottom of page
    const bottomButtons = document.querySelectorAll('button:not([disabled])')
    for (const btn of bottomButtons) {
      const rect = btn.getBoundingClientRect()
      // Button should be in lower part of viewport (input area)
      if (rect.top > window.innerHeight * 0.5) {
        const svg = btn.querySelector('svg')
        if (svg && svg.innerHTML.includes('path')) {
          console.log('Columbus Claude: Found send button via position heuristic')
          return btn
        }
      }
    }

    console.log('Columbus Claude: Could not find send button')
    return null
  }

  async waitForResponseComplete(timeout = 120000) {
    const start = Date.now()
    let lastTextLength = 0
    let stableCount = 0
    const requiredStableChecks = 3

    // Wait for response to start appearing
    console.log('Columbus Claude: Waiting for response to start...')
    await this.delay(3000)

    while (Date.now() - start < timeout) {
      // Check if still generating
      const stopBtn = document.querySelector('[aria-label="Stop response"]') ||
                      document.querySelector('[aria-label="Stop"]') ||
                      document.querySelector('button[class*="stop"]')

      // Check for typing/thinking indicators
      const isTyping = document.querySelector('.typing-indicator') ||
                       document.querySelector('[data-testid="thinking"]') ||
                       document.querySelector('[class*="thinking"]') ||
                       document.querySelector('[class*="typing"]') ||
                       document.querySelector('[class*="loading"]')

      // Get current response text
      const currentText = this.getCurrentResponseText()
      const currentLength = currentText.length

      console.log('Columbus Claude: Response check - stopBtn:', !!stopBtn, 'typing:', !!isTyping, 'textLength:', currentLength, 'stable:', stableCount)

      // If generating indicators present, reset stability
      if (stopBtn || isTyping) {
        stableCount = 0
        lastTextLength = currentLength
        await this.delay(1000)
        continue
      }

      // Check text stability
      if (currentLength > 50) {
        if (currentLength === lastTextLength) {
          stableCount++
          console.log('Columbus Claude: Text stable, count:', stableCount)

          if (stableCount >= requiredStableChecks) {
            console.log('Columbus Claude: Response complete, length:', currentLength)
            await this.delay(500)
            return currentText
          }
        } else {
          stableCount = 0
          lastTextLength = currentLength
        }
      }

      await this.delay(1000)
    }

    // Timeout - return whatever we have
    console.log('Columbus Claude: Timeout reached, returning current response')
    const finalText = this.getCurrentResponseText()
    if (finalText.length > 50) {
      return finalText
    }

    throw new Error('Response timeout')
  }

  getCurrentResponseText() {
    // Get current response text for stability checking
    const messageSelectors = [
      '[data-testid="message-content"]',
      '.font-claude-message',
      '[class*="claude-message"]',
      '[class*="assistant-message"]',
      '.prose',
      'div[class*="markdown"]'
    ]

    for (const selector of messageSelectors) {
      const messages = document.querySelectorAll(selector)
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1]
        const text = lastMessage.innerText || lastMessage.textContent || ''
        if (text.length > 20) {
          return text
        }
      }
    }

    // Fallback: scan for substantial text blocks
    const conversationContainer = document.querySelector('[class*="conversation"]') ||
                                   document.querySelector('[class*="chat"]') ||
                                   document.querySelector('main')

    if (conversationContainer) {
      const textBlocks = conversationContainer.querySelectorAll('div[class]')
      for (const block of textBlocks) {
        const text = block.innerText || ''
        if (text.length > 100 && !block.querySelector('[contenteditable]')) {
          return text
        }
      }
    }

    return ''
  }

  extractLatestResponse() {
    // Find Claude's response - try multiple approaches
    const messageSelectors = [
      '[data-testid="message-content"]',
      '.font-claude-message',
      '.message-content.assistant',
      '.prose',
      // Claude's current UI uses these
      '[class*="claude-message"]',
      '[class*="assistant-message"]',
      '[class*="response"]',
      'div[class*="markdown"]'
    ]

    for (const selector of messageSelectors) {
      const messages = document.querySelectorAll(selector)
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1]
        const text = lastMessage.innerText || lastMessage.textContent || ''
        if (text.length > 20) { // Ensure it's actual content
          console.log('Columbus Claude: Found response with selector:', selector)
          return text
        }
      }
    }

    // Try finding by conversation structure - look for message pairs
    const conversationContainer = document.querySelector('[class*="conversation"]') ||
                                   document.querySelector('[class*="chat"]') ||
                                   document.querySelector('main')

    if (conversationContainer) {
      // Get all text blocks that could be messages
      const textBlocks = conversationContainer.querySelectorAll('div[class]')
      let lastLongText = ''

      for (const block of textBlocks) {
        const text = block.innerText || ''
        // Look for substantial text that's not the input
        if (text.length > 100 && !block.querySelector('[contenteditable]') && !block.querySelector('textarea')) {
          lastLongText = text
        }
      }

      if (lastLongText) {
        console.log('Columbus Claude: Found response via conversation scan')
        return lastLongText
      }
    }

    // Last resort: find any div with substantial text content
    const allDivs = document.querySelectorAll('div')
    let bestMatch = ''
    for (const div of allDivs) {
      const text = div.innerText || ''
      if (text.length > bestMatch.length && text.length > 200 && text.length < 50000) {
        // Exclude input areas
        if (!div.querySelector('[contenteditable]') && !div.closest('[contenteditable]')) {
          bestMatch = text
        }
      }
    }

    if (bestMatch) {
      console.log('Columbus Claude: Found response via fallback scan')
      return bestMatch
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

  // Visibility-aware delay - waits longer if page is hidden (throttled)
  async visibilityAwareDelay(ms) {
    const startTime = Date.now()
    const targetTime = startTime + ms

    while (Date.now() < targetTime) {
      const remaining = targetTime - Date.now()
      if (remaining <= 0) break

      if (document.visibilityState === 'visible') {
        await new Promise(resolve => setTimeout(resolve, Math.min(remaining, 100)))
      } else {
        await new Promise(resolve => setTimeout(resolve, Math.min(remaining, 500)))
      }
    }
  }
}

// Initialize
const claudeCapture = new ClaudeCapture()
console.log('Columbus: Claude content script loaded')
