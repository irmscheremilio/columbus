// Columbus Extension Service Worker - Batch Parallel Scanning
import { CONFIG } from '../lib/config.js'
import * as api from '../lib/api-client.js'
import * as storage from '../lib/storage.js'

// Scan state
let currentScan = null
let scanWindowId = null

// Platform URLs for fresh chats
const PLATFORM_URLS = {
  chatgpt: 'https://chatgpt.com/',
  claude: 'https://claude.ai/new',
  gemini: 'https://gemini.google.com/app',
  perplexity: 'https://www.perplexity.ai/'
}

// Max retries per prompt
const MAX_RETRIES = 3

// Time to wait for responses (ms)
const RESPONSE_WAIT_TIME = 45000 // 45 seconds

// Flag to skip waiting
let skipWaiting = false

// Generate UUID for scan sessions
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

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
      return await cancelScan()

    case 'COLLECT_NOW':
      skipWaiting = true
      return { success: true }

    case 'PROMPT_RESULT':
      return { success: true }

    case 'CHECK_LOGIN':
      return { loggedIn: message.loggedIn }

    default:
      return { error: 'Unknown message type' }
  }
}

// Start a new batch parallel scan
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

    // Get samples per prompt setting
    const samplesPerPrompt = await storage.settings.getSamplesPerPrompt()

    // Build platform-specific queues with all prompts
    const platformNames = ['chatgpt', 'claude', 'gemini', 'perplexity']
    const platforms = {}

    for (const platform of platformNames) {
      const queue = []
      for (const prompt of promptData.prompts) {
        for (let sample = 1; sample <= samplesPerPrompt; sample++) {
          queue.push({
            id: `${prompt.id}-${platform}-${sample}`,
            promptId: prompt.id,
            promptText: prompt.text,
            platform,
            category: prompt.category,
            sampleNumber: sample,
            tabId: null,
            status: 'pending', // pending, submitted, collected, failed
            retryCount: 0,
            result: null
          })
        }
      }

      platforms[platform] = {
        queue,
        status: 'pending' // pending, submitting, waiting, collecting, complete, skipped
      }
    }

    const totalPrompts = Object.values(platforms).reduce((sum, p) => sum + p.queue.length, 0)

    currentScan = {
      productId,
      product: promptData.product,
      competitors: promptData.competitors,
      platforms,
      status: 'running',
      phase: 'initializing', // initializing, submitting, waiting, collecting, complete
      startedAt: Date.now(),
      scanSessionId: generateUUID()
    }

    await updateBadge('running')

    // Start the batch scan process
    runBatchScan()

    return { success: true, totalPrompts }
  } catch (error) {
    console.error('Error starting scan:', error)
    return { error: error.message }
  }
}

// Main batch scan orchestrator
async function runBatchScan() {
  if (!currentScan) return

  try {
    // Phase 1: Create window and check logins
    currentScan.phase = 'initializing'
    notifyProgress()
    await createScanWindow()

    // Phase 2: Submit all prompts (open tabs and submit without waiting)
    currentScan.phase = 'submitting'
    notifyProgress()

    for (const platform of ['chatgpt', 'claude', 'gemini', 'perplexity']) {
      if (currentScan.status !== 'running') break
      await submitPlatformPrompts(platform)
    }

    if (currentScan.status !== 'running') return

    // Phase 3: Wait for responses (can be skipped with COLLECT_NOW)
    currentScan.phase = 'waiting'
    skipWaiting = false
    notifyProgress()
    console.log(`Columbus: Waiting ${RESPONSE_WAIT_TIME / 1000}s for responses (or click Collect Now)...`)

    // Wait in small increments so we can check skipWaiting
    const waitStart = Date.now()
    while (Date.now() - waitStart < RESPONSE_WAIT_TIME) {
      if (skipWaiting || currentScan.status !== 'running') break
      await delay(500)
    }
    skipWaiting = false

    if (currentScan.status !== 'running') return

    // Phase 4: Collect all responses
    currentScan.phase = 'collecting'
    notifyProgress()

    for (const platform of ['chatgpt', 'claude', 'gemini', 'perplexity']) {
      if (currentScan.status !== 'running') break
      await collectPlatformResponses(platform)
    }

    // Phase 5: Complete
    await completeScan()

  } catch (error) {
    console.error('Batch scan error:', error)
    currentScan.status = 'error'
    notifyProgress()
  }
}

// Helper to exit any fullscreen state (both window and document level)
async function exitFullscreen() {
  // Exit window-level fullscreen
  try {
    const windows = await chrome.windows.getAll()
    for (const win of windows) {
      if (win.state === 'fullscreen') {
        console.log(`Columbus: Exiting window fullscreen on ${win.id}`)
        await chrome.windows.update(win.id, { state: 'normal' })
      }
    }
  } catch (e) {}

  // Exit document-level fullscreen (from webpages like videos)
  try {
    const tabs = await chrome.tabs.query({ active: true })
    for (const tab of tabs) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {})
            }
          }
        })
      } catch (e) {}
    }
  } catch (e) {}

  await delay(500)
}

// Helper to create a tab with fullscreen retry logic
async function createTabWithRetry(url, windowId, active = false) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const tab = await chrome.tabs.create({
        url,
        windowId,
        active
      })
      return tab
    } catch (tabError) {
      if (tabError.message?.includes('fullscreen') && attempt < 4) {
        console.log(`Columbus: Fullscreen error on tab create, retrying (attempt ${attempt + 1})`)
        await exitFullscreen()
        await delay(500)
        continue
      }
      throw tabError
    }
  }
  throw new Error('Failed to create tab after retries')
}

// Create initial scan window with one tab per platform to check logins
async function createScanWindow() {
  const platformNames = ['chatgpt', 'claude', 'gemini', 'perplexity']

  // Exit any fullscreen state first
  await exitFullscreen()

  // Create window with first platform - explicitly NOT fullscreen
  let newWindow
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      newWindow = await chrome.windows.create({
        url: PLATFORM_URLS[platformNames[0]],
        type: 'normal',
        state: 'normal',
        focused: true,
        width: 1400,
        height: 900
      })
      break
    } catch (winError) {
      if (winError.message?.includes('fullscreen') && attempt < 4) {
        console.log(`Columbus: Fullscreen error on window create, retrying (attempt ${attempt + 1})`)
        await exitFullscreen()
        await delay(1000)
        continue
      }
      throw winError
    }
  }

  if (!newWindow) {
    throw new Error('Failed to create scan window')
  }

  scanWindowId = newWindow.id
  const firstTabId = newWindow.tabs[0].id

  // Wait for first tab to load
  await waitForTabReady(firstTabId)

  // Check login for first platform
  const firstLoginCheck = await sendToTab(firstTabId, { type: 'CHECK_LOGIN' })
  if (!firstLoginCheck?.loggedIn) {
    console.log(`Columbus: Not logged in to ${platformNames[0]}, skipping`)
    currentScan.platforms[platformNames[0]].status = 'skipped'
  }

  // Check logins for other platforms (keep first tab open to prevent window from closing)
  for (let i = 1; i < platformNames.length; i++) {
    const platform = platformNames[i]
    const tab = await createTabWithRetry(PLATFORM_URLS[platform], scanWindowId, false)

    await waitForTabReady(tab.id)

    const loginCheck = await sendToTab(tab.id, { type: 'CHECK_LOGIN' })
    if (!loginCheck?.loggedIn) {
      console.log(`Columbus: Not logged in to ${platform}, skipping`)
      currentScan.platforms[platform].status = 'skipped'
    }

    // Close the tab after checking
    await chrome.tabs.remove(tab.id)
  }

  // Now close the first tab (window stays open because we'll create new tabs in submitPlatformPrompts)
  // Actually, we need to keep at least one tab. Create a blank placeholder first.
  const placeholderTab = await chrome.tabs.create({
    url: 'about:blank',
    windowId: scanWindowId,
    active: false
  })

  // Now we can safely close the first tab
  await chrome.tabs.remove(firstTabId)

  // Store placeholder tab id to close later
  currentScan.placeholderTabId = placeholderTab.id
}

// Submit all prompts for a platform (open tabs and submit without waiting)
async function submitPlatformPrompts(platform) {
  const platformState = currentScan.platforms[platform]

  if (platformState.status === 'skipped') {
    console.log(`Columbus: Skipping ${platform} (not logged in)`)
    return
  }

  platformState.status = 'submitting'
  console.log(`Columbus: Submitting ${platformState.queue.length} prompts to ${platform}...`)

  for (let i = 0; i < platformState.queue.length; i++) {
    if (currentScan.status !== 'running') break

    const item = platformState.queue[i]

    try {
      // Create a new tab for this prompt
      const tab = await createTabWithRetry(PLATFORM_URLS[platform], scanWindowId, false)
      item.tabId = tab.id

      // Close placeholder tab after first real tab is created
      if (currentScan.placeholderTabId) {
        try {
          await chrome.tabs.remove(currentScan.placeholderTabId)
        } catch (e) {}
        currentScan.placeholderTabId = null
      }

      // Wait for tab to load
      await waitForTabReady(tab.id)

      // Focus briefly for submit
      await chrome.tabs.update(tab.id, { active: true })
      await delay(300)

      // Submit the prompt (don't wait for response)
      const submitResult = await sendToTab(tab.id, {
        type: 'SUBMIT_PROMPT',
        prompt: item.promptText
      })

      if (submitResult?.success) {
        item.status = 'submitted'
        console.log(`Columbus: Submitted prompt ${i + 1}/${platformState.queue.length} to ${platform}`)
      } else {
        item.status = 'failed'
        item.error = submitResult?.error || 'Submit failed'
        console.log(`Columbus: Failed to submit prompt ${i + 1} to ${platform}:`, item.error)
      }

    } catch (error) {
      console.error(`Columbus: Error submitting to ${platform}:`, error)
      item.status = 'failed'
      item.error = error.message
    }

    // Notify progress after each submission
    notifyProgress()

    // Small delay between opening tabs to avoid overwhelming the browser
    await delay(500)
  }

  platformState.status = 'waiting'
}

// Collect responses from all tabs for a platform
async function collectPlatformResponses(platform) {
  const platformState = currentScan.platforms[platform]

  if (platformState.status === 'skipped') return

  platformState.status = 'collecting'
  console.log(`Columbus: Collecting responses from ${platform}...`)

  for (let i = 0; i < platformState.queue.length; i++) {
    if (currentScan.status !== 'running') break

    const item = platformState.queue[i]

    if (item.status !== 'submitted' || !item.tabId) {
      continue // Skip failed or non-submitted items
    }

    try {
      // Focus the tab
      await chrome.tabs.update(item.tabId, { active: true })
      await delay(300)

      // Collect the response
      const collectResult = await sendToTab(item.tabId, {
        type: 'COLLECT_RESPONSE',
        brand: currentScan.product.brand,
        competitors: currentScan.competitors
      })

      if (collectResult?.success && collectResult.responseText) {
        item.status = 'collected'
        item.result = collectResult

        // Process and save result
        await processResult(item)
        console.log(`Columbus: Collected response ${i + 1}/${platformState.queue.length} from ${platform}`)
      } else {
        // Retry logic
        if (item.retryCount < MAX_RETRIES) {
          item.retryCount++
          console.log(`Columbus: No response yet for prompt ${i + 1} on ${platform}, retry ${item.retryCount}/${MAX_RETRIES}`)

          // Wait a bit more and try again
          await delay(10000)

          const retryResult = await sendToTab(item.tabId, {
            type: 'COLLECT_RESPONSE',
            brand: currentScan.product.brand,
            competitors: currentScan.competitors
          })

          if (retryResult?.success && retryResult.responseText) {
            item.status = 'collected'
            item.result = retryResult
            await processResult(item)
          } else {
            item.status = 'failed'
            item.error = 'No response received'
          }
        } else {
          item.status = 'failed'
          item.error = collectResult?.error || 'No response received'
        }
      }

      // Close the tab after collecting
      try {
        await chrome.tabs.remove(item.tabId)
      } catch {}

    } catch (error) {
      console.error(`Columbus: Error collecting from ${platform}:`, error)
      item.status = 'failed'
      item.error = error.message
    }

    // Notify progress
    notifyProgress()
  }

  platformState.status = 'complete'
}

// Process a successful prompt result
async function processResult(item) {
  const result = item.result

  const scanResult = {
    productId: currentScan.productId,
    scanSessionId: currentScan.scanSessionId,
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
    await api.submitScanResult(scanResult)
  } catch (error) {
    console.error('Error submitting result:', error)
  }
}

// Notify popup of progress
function notifyProgress() {
  if (!currentScan) return

  const platformProgress = {}
  let totalSubmitted = 0
  let totalCollected = 0
  let totalPrompts = 0

  for (const [platform, state] of Object.entries(currentScan.platforms)) {
    const submitted = state.queue.filter(q => q.status === 'submitted' || q.status === 'collected').length
    const collected = state.queue.filter(q => q.status === 'collected').length
    const failed = state.queue.filter(q => q.status === 'failed').length

    platformProgress[platform] = {
      current: currentScan.phase === 'collecting' ? collected : submitted,
      total: state.queue.length,
      status: state.status,
      submitted,
      collected,
      failed
    }

    totalSubmitted += submitted
    totalCollected += collected
    totalPrompts += state.queue.length
  }

  const current = currentScan.phase === 'collecting' ? totalCollected : totalSubmitted

  notifyPopup({
    type: 'SCAN_PROGRESS',
    current,
    total: totalPrompts,
    phase: currentScan.phase,
    platforms: platformProgress
  })
}

// Complete the scan
async function completeScan() {
  if (!currentScan) return

  currentScan.phase = 'complete'

  // Finalize the scan session
  try {
    await api.finalizeScanSession(currentScan.scanSessionId, currentScan.productId)
  } catch (error) {
    console.error('Error finalizing scan session:', error)
  }

  // Close the scan window
  if (scanWindowId) {
    try {
      await chrome.windows.remove(scanWindowId)
    } catch {}
    scanWindowId = null
  }

  // Calculate stats
  const stats = {
    totalPrompts: 0,
    successfulPrompts: 0,
    mentionRate: 0,
    citationRate: 0,
    byPlatform: {}
  }

  let totalMentioned = 0
  let totalCited = 0

  for (const [platform, state] of Object.entries(currentScan.platforms)) {
    const collected = state.queue.filter(q => q.status === 'collected')
    const mentioned = collected.filter(q => q.result?.brandMentioned)
    const cited = collected.filter(q => q.result?.citations?.length > 0)

    stats.byPlatform[platform] = {
      total: state.queue.length,
      successful: collected.length,
      mentioned: mentioned.length,
      status: state.status
    }

    stats.totalPrompts += state.queue.length
    stats.successfulPrompts += collected.length
    totalMentioned += mentioned.length
    totalCited += cited.length
  }

  if (stats.successfulPrompts > 0) {
    stats.mentionRate = Math.round((totalMentioned / stats.successfulPrompts) * 100)
    stats.citationRate = Math.round((totalCited / stats.successfulPrompts) * 100)
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
async function cancelScan() {
  if (currentScan) {
    currentScan.status = 'cancelled'

    // Close placeholder tab if exists
    if (currentScan.placeholderTabId) {
      try {
        await chrome.tabs.remove(currentScan.placeholderTabId)
      } catch {}
    }

    // Close all tabs
    for (const state of Object.values(currentScan.platforms)) {
      for (const item of state.queue) {
        if (item.tabId) {
          try {
            await chrome.tabs.remove(item.tabId)
          } catch {}
        }
      }
    }

    currentScan = null
    updateBadge('pending')
  }

  // Close the scan window
  if (scanWindowId) {
    try {
      await chrome.windows.remove(scanWindowId)
    } catch {}
    scanWindowId = null
  }

  return { success: true }
}

// Get current scan status
function getScanStatus() {
  if (!currentScan) {
    return { status: 'idle' }
  }

  const platformProgress = {}
  let totalCompleted = 0
  let totalPrompts = 0

  for (const [platform, state] of Object.entries(currentScan.platforms)) {
    const completed = state.queue.filter(q => q.status === 'collected' || q.status === 'failed').length
    platformProgress[platform] = {
      current: completed,
      total: state.queue.length,
      status: state.status
    }
    totalCompleted += completed
    totalPrompts += state.queue.length
  }

  return {
    status: currentScan.status,
    phase: currentScan.phase,
    progress: {
      current: totalCompleted,
      total: totalPrompts,
      percentage: totalPrompts > 0 ? Math.round((totalCompleted / totalPrompts) * 100) : 0
    },
    platforms: platformProgress
  }
}

// Wait for tab to be ready
async function waitForTabReady(tabId, timeout = 30000) {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    try {
      const tab = await chrome.tabs.get(tabId)
      if (tab.status === 'complete') {
        await delay(2000) // Wait for SPA to initialize
        return true
      }
    } catch {
      return false
    }
    await delay(500)
  }

  throw new Error('Tab load timeout')
}

// Send message to content script with retry and injection fallback
async function sendToTab(tabId, message, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(response)
          }
        })
      })
      return response
    } catch (error) {
      console.log(`Columbus: sendToTab attempt ${attempt + 1} failed:`, error.message)

      if (attempt < retries - 1) {
        try {
          const tab = await chrome.tabs.get(tabId)
          const url = new URL(tab.url)

          let scriptFile = null
          if (url.hostname.includes('chatgpt.com') || url.hostname.includes('chat.openai.com')) {
            scriptFile = 'content-scripts/chatgpt.js'
          } else if (url.hostname.includes('claude.ai')) {
            scriptFile = 'content-scripts/claude.js'
          } else if (url.hostname.includes('gemini.google.com')) {
            scriptFile = 'content-scripts/gemini.js'
          } else if (url.hostname.includes('perplexity.ai')) {
            scriptFile = 'content-scripts/perplexity.js'
          }

          if (scriptFile) {
            console.log(`Columbus: Injecting ${scriptFile} into tab ${tabId}`)
            await chrome.scripting.executeScript({
              target: { tabId },
              files: [scriptFile]
            })
            await delay(1000)
          }
        } catch (injectError) {
          console.log('Columbus: Script injection failed:', injectError.message)
        }
      } else {
        throw error
      }
    }
  }
}

// Notify popup
function notifyPopup(message) {
  chrome.runtime.sendMessage(message).catch(() => {})
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
console.log('Columbus Extension Service Worker initialized (batch parallel mode)')
