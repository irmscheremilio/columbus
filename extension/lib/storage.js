// Chrome Storage Wrapper for Columbus Extension

/**
 * Get values from chrome.storage.local
 * @param {string|string[]} keys - Key(s) to retrieve
 * @returns {Promise<object>} - Retrieved values
 */
export async function get(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve)
  })
}

/**
 * Set values in chrome.storage.local
 * @param {object} items - Key-value pairs to store
 * @returns {Promise<void>}
 */
export async function set(items) {
  return new Promise((resolve) => {
    chrome.storage.local.set(items, resolve)
  })
}

/**
 * Remove values from chrome.storage.local
 * @param {string|string[]} keys - Key(s) to remove
 * @returns {Promise<void>}
 */
export async function remove(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(keys, resolve)
  })
}

/**
 * Clear all chrome.storage.local data
 * @returns {Promise<void>}
 */
export async function clear() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(resolve)
  })
}

// Auth-specific storage helpers
export const auth = {
  async getToken() {
    const { authToken } = await get('authToken')
    return authToken || null
  },

  async setToken(token) {
    await set({ authToken: token })
  },

  async clearToken() {
    await remove('authToken')
  },

  async getSession() {
    const { session } = await get('session')
    return session || null
  },

  async setSession(session) {
    await set({ session })
  },

  async clearSession() {
    await remove(['authToken', 'session'])
  }
}

// Scan state storage helpers
export const scan = {
  async getLastScanDate() {
    const { lastScanDate } = await get('lastScanDate')
    return lastScanDate || null
  },

  async setLastScanDate(date) {
    await set({ lastScanDate: date })
  },

  async getScanState() {
    const { scanState } = await get('scanState')
    return scanState || null
  },

  async setScanState(state) {
    await set({ scanState: state })
  },

  async clearScanState() {
    await remove('scanState')
  }
}

// Settings storage helpers
export const settings = {
  async get() {
    const { settings } = await get('settings')
    return settings || {
      remindersEnabled: true,
      preferredTimeWindow: { start: 9, end: 18 },
      autoStartScan: false,
      samplesPerPrompt: 1 // How many times to run each prompt per scan
    }
  },

  async set(newSettings) {
    const current = await this.get()
    await set({ settings: { ...current, ...newSettings } })
  },

  async getSamplesPerPrompt() {
    const settings = await this.get()
    return settings.samplesPerPrompt || 1
  },

  async setSamplesPerPrompt(count) {
    await this.set({ samplesPerPrompt: Math.max(1, count) }) // Minimum 1, no upper limit
  }
}

// Product storage helpers
export const product = {
  async getActiveProduct() {
    const { activeProduct } = await get('activeProduct')
    return activeProduct || null
  },

  async setActiveProduct(product) {
    await set({ activeProduct: product })
  }
}
