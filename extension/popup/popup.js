// Columbus Extension Popup Script
import * as api from '../lib/api-client.js'
import * as storage from '../lib/storage.js'

// DOM Elements
const views = {
  login: document.getElementById('loginView'),
  main: document.getElementById('mainView'),
  scanning: document.getElementById('scanningView'),
  complete: document.getElementById('completeView')
}

const elements = {
  // Login
  loginForm: document.getElementById('loginForm'),
  emailInput: document.getElementById('email'),
  passwordInput: document.getElementById('password'),
  loginBtn: document.getElementById('loginBtn'),
  googleLoginBtn: document.getElementById('googleLoginBtn'),
  loginError: document.getElementById('loginError'),

  // Main
  userEmail: document.getElementById('userEmail'),
  logoutBtn: document.getElementById('logoutBtn'),
  productSelect: document.getElementById('productSelect'),
  platformsGrid: document.getElementById('platformsGrid'),
  scanBtn: document.getElementById('scanBtn'),
  scanInfo: document.getElementById('scanInfo'),
  lastScanTime: document.getElementById('lastScanTime'),

  // Scanning
  cancelScanBtn: document.getElementById('cancelScanBtn'),
  progressFill: document.getElementById('progressFill'),
  progressText: document.getElementById('progressText'),
  scanningPlatform: document.getElementById('scanningPlatform'),
  scanningPrompt: document.getElementById('scanningPrompt'),
  scanningResults: document.getElementById('scanningResults'),

  // Complete
  completeStats: document.getElementById('completeStats'),
  viewResultsBtn: document.getElementById('viewResultsBtn'),
  newScanBtn: document.getElementById('newScanBtn')
}

// State
let currentState = {
  user: null,
  products: [],
  activeProduct: null,
  isScanning: false,
  scanResults: []
}

// Initialize popup
async function init() {
  try {
    const isAuth = await api.isAuthenticated()

    if (isAuth) {
      await loadUserData()

      // Check if there's an ongoing scan
      const scanStatus = await getScanStatus()
      if (scanStatus && scanStatus.status === 'running') {
        // Restore scanning view
        currentState.isScanning = true
        showView('scanning')
        restoreScanProgress(scanStatus.progress)
      } else {
        showView('main')
      }
    } else {
      showView('login')
    }
  } catch (error) {
    console.error('Init error:', error)
    showView('login')
  }

  setupEventListeners()
}

// Get scan status from service worker
function getScanStatus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_SCAN_STATUS' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null)
      } else {
        resolve(response)
      }
    })
  })
}

// Restore scan progress UI when popup reopens
function restoreScanProgress(progress) {
  if (!progress) return

  const { current, total, percentage } = progress
  elements.progressFill.style.width = `${percentage}%`
  elements.progressText.textContent = `${percentage}%`
  elements.scanningPlatform.textContent = `Scanning in progress...`
  elements.scanningPrompt.textContent = `${current} of ${total} prompts`
  elements.scanningResults.innerHTML = ''
}

// Show a specific view
function showView(viewName) {
  Object.values(views).forEach(view => view.classList.add('hidden'))
  if (views[viewName]) {
    views[viewName].classList.remove('hidden')
  }
}

// Setup event listeners
function setupEventListeners() {
  // Login form
  elements.loginForm.addEventListener('submit', handleLogin)

  // Google login
  elements.googleLoginBtn.addEventListener('click', handleGoogleLogin)

  // Logout
  elements.logoutBtn.addEventListener('click', handleLogout)

  // Product selection
  elements.productSelect.addEventListener('change', handleProductChange)

  // Scan button
  elements.scanBtn.addEventListener('click', handleStartScan)

  // Cancel scan
  elements.cancelScanBtn.addEventListener('click', handleCancelScan)

  // View results
  elements.viewResultsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://columbus.app/dashboard/visibility' })
  })

  // New scan
  elements.newScanBtn.addEventListener('click', () => {
    showView('main')
    updateUI()
  })
}

// Handle login
async function handleLogin(e) {
  e.preventDefault()

  const email = elements.emailInput.value.trim()
  const password = elements.passwordInput.value

  if (!email || !password) {
    showLoginError('Please enter email and password')
    return
  }

  setLoginLoading(true)
  hideLoginError()

  try {
    await api.login(email, password)
    await loadUserData()
    showView('main')
  } catch (error) {
    showLoginError(error.message)
  } finally {
    setLoginLoading(false)
  }
}

// Handle Google login
async function handleGoogleLogin() {
  setGoogleLoginLoading(true)
  hideLoginError()

  try {
    await api.loginWithGoogle()
    await loadUserData()
    showView('main')
  } catch (error) {
    showLoginError(error.message)
  } finally {
    setGoogleLoginLoading(false)
  }
}

// Handle logout
async function handleLogout() {
  await api.logout()
  currentState = {
    user: null,
    products: [],
    activeProduct: null,
    isScanning: false,
    scanResults: []
  }
  showView('login')
}

// Load user data from API
async function loadUserData() {
  try {
    const status = await api.getStatus()

    currentState.user = status.user
    currentState.products = status.products || []

    // Set active product
    const savedProduct = await storage.product.getActiveProduct()
    if (savedProduct && status.products.find(p => p.id === savedProduct.id)) {
      currentState.activeProduct = status.products.find(p => p.id === savedProduct.id)
    } else if (status.activeProduct) {
      currentState.activeProduct = status.activeProduct
    }

    updateUI()
  } catch (error) {
    console.error('Error loading user data:', error)
    // If unauthorized, show login
    if (error.message.includes('Unauthorized') || error.message.includes('Not authenticated')) {
      await api.logout()
      showView('login')
    }
  }
}

// Update UI based on current state
function updateUI() {
  // User email
  if (currentState.user) {
    elements.userEmail.textContent = currentState.user.email
  }

  // Product selector
  elements.productSelect.innerHTML = '<option value="">Select a product...</option>'
  currentState.products.forEach(product => {
    const option = document.createElement('option')
    option.value = product.id
    option.textContent = product.name
    if (currentState.activeProduct && product.id === currentState.activeProduct.id) {
      option.selected = true
    }
    elements.productSelect.appendChild(option)
  })

  // Update platform status
  if (currentState.activeProduct) {
    const status = currentState.activeProduct.todayStatus
    const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity']

    platforms.forEach(platform => {
      const statusEl = document.getElementById(`status-${platform}`)
      if (statusEl && status && status[platform]) {
        const { tested, total } = status[platform]
        statusEl.textContent = `${tested}/${total}`
        statusEl.className = `platform-status ${tested >= total && total > 0 ? 'complete' : tested > 0 ? 'pending' : ''}`
      } else {
        statusEl.textContent = '—'
        statusEl.className = 'platform-status'
      }
    })

    // Scan button
    elements.scanBtn.disabled = false
    elements.scanInfo.textContent = `${currentState.activeProduct.promptCount} prompts across 4 platforms`

    // Last scan
    if (currentState.activeProduct.todayComplete) {
      elements.lastScanTime.textContent = 'Today (complete)'
    } else {
      const session = currentState.products[0]?.lastScanAt
      elements.lastScanTime.textContent = session ? formatRelativeTime(new Date(session)) : 'Never'
    }
  } else {
    // No product selected
    elements.scanBtn.disabled = true
    elements.scanInfo.textContent = 'Select a product to start scanning'

    // Reset platform status
    const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity']
    platforms.forEach(platform => {
      const statusEl = document.getElementById(`status-${platform}`)
      if (statusEl) {
        statusEl.textContent = '—'
        statusEl.className = 'platform-status'
      }
    })
  }
}

// Handle product selection change
async function handleProductChange(e) {
  const productId = e.target.value

  if (productId) {
    currentState.activeProduct = currentState.products.find(p => p.id === productId)
    await storage.product.setActiveProduct(currentState.activeProduct)
  } else {
    currentState.activeProduct = null
    await storage.product.setActiveProduct(null)
  }

  updateUI()
}

// Handle start scan
async function handleStartScan() {
  if (!currentState.activeProduct) {
    return
  }

  currentState.isScanning = true
  currentState.scanResults = []
  showView('scanning')

  // Reset progress
  elements.progressFill.style.width = '0%'
  elements.progressText.textContent = '0%'
  elements.scanningResults.innerHTML = ''

  try {
    // Send message to service worker to start scan
    chrome.runtime.sendMessage({
      type: 'START_SCAN',
      productId: currentState.activeProduct.id
    }, (response) => {
      if (response?.error) {
        console.error('Scan error:', response.error)
        showView('main')
        alert('Failed to start scan: ' + response.error)
      }
    })
  } catch (error) {
    console.error('Error starting scan:', error)
    showView('main')
  }
}

// Handle cancel scan
function handleCancelScan() {
  chrome.runtime.sendMessage({ type: 'CANCEL_SCAN' })
  currentState.isScanning = false
  showView('main')
}

// Listen for messages from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SCAN_PROGRESS':
      updateScanProgress(message)
      break

    case 'SCAN_RESULT':
      addScanResult(message.result)
      break

    case 'SCAN_COMPLETE':
      handleScanComplete(message)
      break

    case 'SCAN_ERROR':
      handleScanError(message.error)
      break
  }
})

// Update scan progress
function updateScanProgress(data) {
  const { current, total, platform, prompt } = data
  const percentage = Math.round((current / total) * 100)

  elements.progressFill.style.width = `${percentage}%`
  elements.progressText.textContent = `${percentage}%`
  elements.scanningPlatform.textContent = `Testing on ${platform}...`
  elements.scanningPrompt.textContent = prompt ? `"${truncate(prompt, 50)}"` : ''
}

// Add scan result to UI
function addScanResult(result) {
  currentState.scanResults.push(result)

  const resultEl = document.createElement('div')
  resultEl.className = `result-item ${result.success ? 'success' : 'error'}`
  resultEl.innerHTML = `
    <span>${result.platform}</span>
    <span>${result.success ? '✓' : '✗'}</span>
    <span>${result.brandMentioned ? 'Mentioned' : 'Not mentioned'}</span>
  `
  elements.scanningResults.appendChild(resultEl)
}

// Handle scan complete
function handleScanComplete(data) {
  currentState.isScanning = false

  // Show stats
  const stats = data.stats || {}
  elements.completeStats.innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${stats.totalPrompts || 0}</div>
      <div class="stat-label">Prompts Tested</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats.mentionRate || 0}%</div>
      <div class="stat-label">Mention Rate</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats.citationRate || 0}%</div>
      <div class="stat-label">Citation Rate</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats.avgPosition || '—'}</div>
      <div class="stat-label">Avg Position</div>
    </div>
  `

  showView('complete')
}

// Handle scan error
function handleScanError(error) {
  currentState.isScanning = false
  showView('main')
  alert('Scan failed: ' + error)
}

// Helper functions
function showLoginError(message) {
  elements.loginError.textContent = message
  elements.loginError.classList.remove('hidden')
}

function hideLoginError() {
  elements.loginError.classList.add('hidden')
}

function setLoginLoading(loading) {
  elements.loginBtn.disabled = loading
  elements.loginBtn.querySelector('.btn-text').classList.toggle('hidden', loading)
  elements.loginBtn.querySelector('.btn-loading').classList.toggle('hidden', !loading)
}

function setGoogleLoginLoading(loading) {
  elements.googleLoginBtn.disabled = loading
  elements.googleLoginBtn.querySelector('.btn-text').classList.toggle('hidden', loading)
  elements.googleLoginBtn.querySelector('.btn-loading').classList.toggle('hidden', !loading)
}

function formatRelativeTime(date) {
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return date.toLocaleDateString()
}

function truncate(str, length) {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init)
