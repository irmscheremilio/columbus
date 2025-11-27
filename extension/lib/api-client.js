// Columbus API Client for Extension
import { CONFIG, apiUrl } from './config.js'
import * as storage from './storage.js'

/**
 * Make authenticated API request to Columbus backend
 */
async function apiRequest(endpoint, options = {}) {
  const token = await storage.auth.getToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const url = apiUrl(endpoint)
  console.log('[Columbus API] Request:', url)

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  const data = await response.json()
  console.log('[Columbus API] Response:', response.status, data)

  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status}`)
  }

  return data
}

/**
 * Get extension status and user info
 */
export async function getStatus() {
  return apiRequest(CONFIG.API.STATUS)
}

/**
 * Get prompts for a product
 * @param {string} productId - Product UUID
 */
export async function getPrompts(productId) {
  return apiRequest(`${CONFIG.API.PROMPTS}?productId=${productId}`)
}

/**
 * Submit scan result to backend
 * @param {object} result - Scan result data
 */
export async function submitScanResult(result) {
  return apiRequest(CONFIG.API.SCAN_RESULTS, {
    method: 'POST',
    body: JSON.stringify(result)
  })
}

/**
 * Finalize a scan session to trigger visibility history update
 * @param {string} scanSessionId - UUID of the scan session
 * @param {string} productId - UUID of the product
 */
export async function finalizeScanSession(scanSessionId, productId) {
  return apiRequest(CONFIG.API.FINALIZE_SCAN, {
    method: 'POST',
    body: JSON.stringify({ scanSessionId, productId })
  })
}

/**
 * Authenticate with Supabase using email/password
 * @param {string} email
 * @param {string} password
 */
export async function login(email, password) {
  const url = `${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error_description || data.msg || 'Login failed')
  }

  // Store the access token
  await storage.auth.setToken(data.access_token)
  await storage.auth.setSession({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
    user: data.user
  })

  return data.user
}

/**
 * Sign in with Google using launchWebAuthFlow
 * This opens a popup window for Supabase Google OAuth and handles the redirect
 * Works regardless of extension ID (no manifest oauth2 section needed)
 */
export async function loginWithGoogle() {
  return new Promise((resolve, reject) => {
    const redirectUri = chrome.identity.getRedirectURL()
    const supabaseUrl = CONFIG.SUPABASE_URL

    // Log the redirect URI - user needs to add this to Supabase Dashboard
    console.log('=== Columbus Extension OAuth ===')
    console.log('Extension Redirect URI:', redirectUri)
    console.log('Add this URL to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs')
    console.log('================================')

    // Build Supabase OAuth URL for Google
    const authUrl = new URL(`${supabaseUrl}/auth/v1/authorize`)
    authUrl.searchParams.set('provider', 'google')
    authUrl.searchParams.set('redirect_to', redirectUri)
    authUrl.searchParams.set('scopes', 'email profile')

    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: true
      },
      async (redirectUrl) => {
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message || 'Google sign-in cancelled'
          // Provide helpful message if redirect failed
          if (errorMsg.includes('did not approve') || errorMsg.includes('cancelled')) {
            console.error('OAuth redirect failed. Make sure this URL is in Supabase Redirect URLs:', redirectUri)
            reject(new Error(`Sign-in failed. Please ensure "${redirectUri}" is added to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs`))
          } else {
            reject(new Error(errorMsg))
          }
          return
        }

        if (!redirectUrl) {
          reject(new Error('No redirect URL received'))
          return
        }

        try {
          // Parse the redirect URL to get the tokens
          const url = new URL(redirectUrl)
          const hashParams = new URLSearchParams(url.hash.substring(1))
          const queryParams = new URLSearchParams(url.search)

          // Tokens might be in hash or query params
          const accessToken = hashParams.get('access_token') || queryParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token')
          const expiresIn = hashParams.get('expires_in') || queryParams.get('expires_in')

          if (!accessToken) {
            // Check for error
            const error = hashParams.get('error_description') || queryParams.get('error_description')
            reject(new Error(error || 'No access token in redirect'))
            return
          }

          // Get user info from Supabase
          const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'apikey': CONFIG.SUPABASE_ANON_KEY
            }
          })

          if (!userResponse.ok) {
            throw new Error('Failed to get user info')
          }

          const user = await userResponse.json()

          // Store the session
          await storage.auth.setToken(accessToken)
          await storage.auth.setSession({
            accessToken,
            refreshToken,
            expiresAt: Date.now() + ((parseInt(expiresIn) || 3600) * 1000),
            user
          })

          resolve(user)
        } catch (error) {
          reject(error)
        }
      }
    )
  })
}

/**
 * Refresh the access token
 */
export async function refreshToken() {
  const session = await storage.auth.getSession()

  if (!session?.refreshToken) {
    throw new Error('No refresh token available')
  }

  const url = `${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refresh_token: session.refreshToken })
  })

  const data = await response.json()

  if (!response.ok) {
    // Clear invalid session
    await storage.auth.clearSession()
    throw new Error('Session expired. Please login again.')
  }

  // Update stored tokens
  await storage.auth.setToken(data.access_token)
  await storage.auth.setSession({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
    user: data.user
  })

  return data
}

/**
 * Logout - clear stored credentials
 */
export async function logout() {
  await storage.auth.clearSession()
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await storage.auth.getSession()

  if (!session?.accessToken) {
    return false
  }

  // Check if token is expired
  if (session.expiresAt && session.expiresAt < Date.now()) {
    try {
      await refreshToken()
      return true
    } catch {
      return false
    }
  }

  return true
}

/**
 * Get current user from stored session
 */
export async function getCurrentUser() {
  const session = await storage.auth.getSession()
  return session?.user || null
}
