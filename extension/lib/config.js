// Columbus Extension Configuration
// Update SUPABASE_URL and SUPABASE_ANON_KEY for production

export const CONFIG = {
  // Supabase configuration
  SUPABASE_URL: 'https://yvhzxuoqodutmllfhcsa.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2aHp4dW9xb2R1dG1sbGZoY3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDMwOTIsImV4cCI6MjA3OTQ3OTA5Mn0.UxDcyOAGSGKBW26ElQXAyiVC6GRicphIVcrMs8tdkRI',

  // API endpoints
  API: {
    SCAN_RESULTS: '/functions/v1/extension-scan-results',
    PROMPTS: '/functions/v1/extension-prompts',
    STATUS: '/functions/v1/extension-status'
  },

  // Platform configurations
  PLATFORMS: {
    chatgpt: {
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chatgpt.com',
      color: '#10a37f'
    },
    claude: {
      id: 'claude',
      name: 'Claude',
      url: 'https://claude.ai',
      color: '#d97757'
    },
    gemini: {
      id: 'gemini',
      name: 'Gemini',
      url: 'https://gemini.google.com',
      color: '#4285f4'
    },
    perplexity: {
      id: 'perplexity',
      name: 'Perplexity',
      url: 'https://www.perplexity.ai',
      color: '#20b8cd'
    }
  },

  // Scan settings
  SCAN: {
    DELAY_BETWEEN_PROMPTS_MS: 3000,  // 3 seconds between prompts
    DELAY_BETWEEN_PLATFORMS_MS: 5000, // 5 seconds between platforms
    RESPONSE_TIMEOUT_MS: 120000,      // 2 minutes max wait for response
    MAX_RETRIES: 2
  },

  // Reminder settings
  REMINDERS: {
    CHECK_INTERVAL_MINUTES: 30,
    MAX_REMINDERS_PER_DAY: 3,
    DEFAULT_TIME_WINDOW: { start: 9, end: 18 } // 9am - 6pm
  }
}

// Helper to build API URLs
export function apiUrl(endpoint) {
  return `${CONFIG.SUPABASE_URL}${endpoint}`
}
