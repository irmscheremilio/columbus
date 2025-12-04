/**
 * Composable for managing AI platforms data
 * Centralizes platform information to avoid hardcoding throughout the app
 */

export interface AIPlatform {
  id: string
  name: string
  logo_url: string
  color: string
  description: string
  website_url: string
}

// Default fallback platforms in case database is unavailable
const DEFAULT_PLATFORMS: AIPlatform[] = [
  { id: 'chatgpt', name: 'ChatGPT', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', color: '#10a37f', description: 'OpenAI\'s conversational AI assistant', website_url: 'https://chat.openai.com' },
  { id: 'claude', name: 'Claude', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg', color: '#d97757', description: 'Anthropic\'s AI assistant focused on safety', website_url: 'https://claude.ai' },
  { id: 'gemini', name: 'Gemini', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg', color: '#4285f4', description: 'Google\'s multimodal AI model', website_url: 'https://gemini.google.com' },
  { id: 'perplexity', name: 'Perplexity', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Perplexity_AI_logo.svg', color: '#20b8cd', description: 'AI-powered search and answer engine', website_url: 'https://perplexity.ai' },
  { id: 'google_aio', name: 'Google AI Overview', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg', color: '#4285f4', description: 'AI-generated overview at the top of Google search results', website_url: 'https://www.google.com' }
]

// Global state shared across all components
const platforms = ref<AIPlatform[]>([])
const loading = ref(false)
const loaded = ref(false)
const error = ref<string | null>(null)

export function useAIPlatforms() {
  const supabase = useSupabaseClient()

  const loadPlatforms = async (forceReload = false) => {
    // Skip if already loaded and not forcing reload
    if (loaded.value && !forceReload) {
      return platforms.value
    }

    // Skip if currently loading
    if (loading.value) {
      // Wait for existing load to complete
      await new Promise<void>(resolve => {
        const unwatch = watch(loading, (isLoading) => {
          if (!isLoading) {
            unwatch()
            resolve()
          }
        })
      })
      return platforms.value
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('ai_platforms')
        .select('*')
        .order('name')

      if (fetchError) {
        throw fetchError
      }

      if (data && data.length > 0) {
        platforms.value = data
      } else {
        // Use defaults if no data in database
        platforms.value = DEFAULT_PLATFORMS
      }

      loaded.value = true
    } catch (e: any) {
      console.error('Error loading AI platforms:', e)
      error.value = e.message
      // Fall back to defaults on error
      platforms.value = DEFAULT_PLATFORMS
      loaded.value = true
    } finally {
      loading.value = false
    }

    return platforms.value
  }

  // Get platform by ID
  const getPlatform = (id: string): AIPlatform | undefined => {
    return platforms.value.find(p => p.id === id)
  }

  // Get platform name by ID (useful for display)
  const getPlatformName = (id: string): string => {
    const platform = getPlatform(id)
    return platform?.name || id.charAt(0).toUpperCase() + id.slice(1)
  }

  // Get platform color by ID
  const getPlatformColor = (id: string): string => {
    const platform = getPlatform(id)
    return platform?.color || '#6b7280'
  }

  // Get platform logo URL by ID
  const getPlatformLogo = (id: string): string | null => {
    const platform = getPlatform(id)
    return platform?.logo_url || null
  }

  // Get all platform IDs (useful for queries)
  const platformIds = computed(() => platforms.value.map(p => p.id))

  // Format model name from various formats (e.g., 'chatgpt', 'ChatGPT', 'gpt-4' -> 'ChatGPT')
  const formatModelName = (model: string | null | undefined): string => {
    if (!model) return 'Unknown'

    const normalized = model.toLowerCase()

    // Check if it matches a known platform
    const platform = platforms.value.find(p =>
      p.id === normalized ||
      p.name.toLowerCase() === normalized ||
      normalized.includes(p.id)
    )

    if (platform) return platform.name

    // Fallback: capitalize first letter
    return model.charAt(0).toUpperCase() + model.slice(1)
  }

  return {
    platforms: readonly(platforms),
    loading: readonly(loading),
    loaded: readonly(loaded),
    error: readonly(error),
    loadPlatforms,
    getPlatform,
    getPlatformName,
    getPlatformColor,
    getPlatformLogo,
    platformIds,
    formatModelName
  }
}
