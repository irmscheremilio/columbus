// Columbus Extension Service Worker
import { CONFIG } from '../lib/config.js'
import * as api from '../lib/api-client.js'
import * as storage from '../lib/storage.js'

// Scan state
let currentScan = null

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    sendResponse({ error: err.message })
  })
  return true // Async response
})

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'START_SCAN':
      return await startScan(message.productId)

    case 'GET_SCAN_STATUS':
      return getScanStatus()

    case 'CANCEL_SCAN':
      return cancelScan()

    case 'PROMPT_RESULT':
      return await handlePromptResult(message.result, sender.tab?.id)

    case 'CHECK_LOGIN':
      return { loggedIn: message.loggedIn }

    default:
      return { error: 'Unknown message type' }
  }
}

// Start a new scan
async function startScan(productId) {
  if (currentScan) {
    return { error: 'Scan already in progress' }
  }

  try {
    // Fetch prompts from backend
    const promptData = await api.getPrompts(productId)

    if (!promptData.prompts || promptData.prompts.length === 0) {
      return { error: 'No prompts found for this product' }
    }

    // Build scan queue - each prompt for each platform
    const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity']
    const queue = []

    for (const prompt of promptData.prompts) {
      for (const platform of platforms) {
        // Skip if already tested today
        if (!prompt.testedToday || !prompt.testedToday[platform]) {
          queue.push({
            promptId: prompt.id,
            promptText: prompt.text,
            platform,
            category: prompt.category
          })
        }
      }
    }

    if (queue.length === 0) {
      return { error: 'All prompts have been tested today' }
    }

    currentScan = {
      productId,
      product: promptData.product,
      competitors: promptData.competitors,
      queue,
      results: [],
      currentIndex: 0,
      status: 'running',
      startedAt: Date.now()
    }

    await updateBadge('running')

    // Start executing prompts
    executeNextPrompt()

    return { success: true, totalPrompts: queue.length }
  } catch (error) {
    console.error('Error starting scan:', error)
    return { error: error.message }
  }
}

// Execute the next prompt in the queue
async function executeNextPrompt() {
  if (!currentScan || currentScan.status !== 'running') {
    return
  }

  if (currentScan.currentIndex >= currentScan.queue.length) {
    await completeScan()
    return
  }

  const item = currentScan.queue[currentScan.currentIndex]

  // Notify popup of progress
  notifyPopup({
    type: 'SCAN_PROGRESS',
    current: currentScan.currentIndex,
    total: currentScan.queue.length,
    platform: CONFIG.PLATFORMS[item.platform]?.name || item.platform,
    prompt: item.promptText
  })

  try {
    // Find or open tab for this platform
    const tab = await getOrCreatePlatformTab(item.platform)

    if (!tab) {
      throw new Error(`Could not open ${item.platform} tab`)
    }

    // Wait for tab to be ready
    await waitForTabReady(tab.id)

    // Check if logged in
    const loginCheck = await sendToTab(tab.id, { type: 'CHECK_LOGIN' })

    if (!loginCheck?.loggedIn) {
      // User not logged in - skip this platform
      console.log(`User not logged in to ${item.platform}, skipping`)
      currentScan.results.push({
        ...item,
        success: false,
        error: 'Not logged in',
        skipped: true
      })
      currentScan.currentIndex++
      await delay(1000)
      executeNextPrompt()
      return
    }

    // Execute the prompt
    const result = await sendToTab(tab.id, {
      type: 'EXECUTE_PROMPT',
      prompt: item.promptText,
      brand: currentScan.product.brand,
      competitors: currentScan.competitors
    })

    if (result?.error) {
      throw new Error(result.error)
    }

    // Process and save result
    await processResult(item, result)

  } catch (error) {
    console.error(`Error executing prompt on ${item.platform}:`, error)
    currentScan.results.push({
      ...item,
      success: false,
      error: error.message
    })
  }

  currentScan.currentIndex++

  // Delay before next prompt
  const nextItem = currentScan.queue[currentScan.currentIndex]
  const delayMs = nextItem && nextItem.platform !== item.platform
    ? CONFIG.SCAN.DELAY_BETWEEN_PLATFORMS_MS
    : CONFIG.SCAN.DELAY_BETWEEN_PROMPTS_MS

  await delay(delayMs)
  executeNextPrompt()
}

// Process a successful prompt result
async function processResult(item, result) {
  const scanResult = {
    productId: currentScan.productId,
    platform: item.platform,
    promptId: item.promptId,
    promptText: item.promptText,
    responseText: result.responseText,
    brandMentioned: result.brandMentioned,
    citationPresent: result.citations?.length > 0,
    position: result.position,
    sentiment: result.sentiment || 'neutral',
    competitorMentions: result.competitorMentions || [],
    citations: result.citations || [],
    metadata: {
      modelUsed: result.modelUsed,
      hadWebSearch: result.hadWebSearch,
      responseTimeMs: result.responseTimeMs
    }
  }

  try {
    // Submit to backend
    await api.submitScanResult(scanResult)

    currentScan.results.push({
      ...item,
      success: true,
      brandMentioned: result.brandMentioned,
      citationPresent: result.citations?.length > 0
    })

    // Notify popup
    notifyPopup({
      type: 'SCAN_RESULT',
      result: {
        platform: item.platform,
        success: true,
        brandMentioned: result.brandMentioned
      }
    })
  } catch (error) {
    console.error('Error submitting result:', error)
    currentScan.results.push({
      ...item,
      success: false,
      error: 'Failed to save result'
    })
  }
}

// Complete the scan
async function completeScan() {
  if (!currentScan) return

  const results = currentScan.results
  const successful = results.filter(r => r.success)
  const mentioned = successful.filter(r => r.brandMentioned)
  const cited = successful.filter(r => r.citationPresent)

  const stats = {
    totalPrompts: results.length,
    successfulPrompts: successful.length,
    mentionRate: successful.length > 0 ? Math.round((mentioned.length / successful.length) * 100) : 0,
    citationRate: successful.length > 0 ? Math.round((cited.length / successful.length) * 100) : 0
  }

  // Save last scan date
  await storage.scan.setLastScanDate(new Date().toISOString())

  // Update badge
  await updateBadge('complete')

  // Notify popup
  notifyPopup({
    type: 'SCAN_COMPLETE',
    stats
  })

  // Show notification
  chrome.notifications.create('scanComplete', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('assets/icon-128.png'),
    title: 'Columbus: Scan Complete',
    message: `Brand mentioned in ${stats.mentionRate}% of responses`
  })

  currentScan = null
}

// Cancel the current scan
function cancelScan() {
  if (currentScan) {
    currentScan.status = 'cancelled'
    currentScan = null
    updateBadge('pending')
  }
  return { success: true }
}

// Get current scan status
function getScanStatus() {
  if (!currentScan) {
    return { status: 'idle' }
  }

  return {
    status: currentScan.status,
    progress: {
      current: currentScan.currentIndex,
      total: currentScan.queue.length,
      percentage: Math.round((currentScan.currentIndex / currentScan.queue.length) * 100)
    }
  }
}

// Get or create a tab for the given platform
async function getOrCreatePlatformTab(platform) {
  const platformConfig = CONFIG.PLATFORMS[platform]
  if (!platformConfig) return null

  const url = platformConfig.url

  // Check for existing tab
  const tabs = await chrome.tabs.query({ url: `${url}/*` })
  if (tabs.length > 0) {
    // Activate existing tab
    await chrome.tabs.update(tabs[0].id, { active: false })
    return tabs[0]
  }

  // Create new tab (in background)
  return await chrome.tabs.create({ url, active: false })
}

// Wait for tab to be ready
async function waitForTabReady(tabId, timeout = 30000) {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    try {
      const tab = await chrome.tabs.get(tabId)
      if (tab.status === 'complete') {
        // Additional wait for page scripts to load
        await delay(1000)
        return true
      }
    } catch {
      return false
    }
    await delay(500)
  }

  throw new Error('Tab load timeout')
}

// Send message to content script
async function sendToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve(response)
      }
    })
  })
}

// Notify popup
function notifyPopup(message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Popup might be closed, ignore error
  })
}

// Update extension badge
async function updateBadge(status) {
  const badges = {
    pending: { text: '', color: '#3B82F6' },
    running: { text: '...', color: '#F59E0B' },
    complete: { text: '✓', color: '#10B981' },
    error: { text: '!', color: '#EF4444' }
  }

  const badge = badges[status] || badges.pending
  await chrome.action.setBadgeText({ text: badge.text })
  await chrome.action.setBadgeBackgroundColor({ color: badge.color })
}

// Utility: delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Initialize
console.log('Columbus Extension Service Worker initialized')
