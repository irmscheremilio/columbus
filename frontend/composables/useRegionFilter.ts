/**
 * Composable for managing region/country filtering across dashboard pages
 * Loads available regions from prompt_results for the selected product
 * Provides global state for filtering prompt_results by region
 */

export interface RegionInfo {
  code: string
  name: string
  flag: string
}

const STORAGE_KEY = 'columbus_selected_region'

// Global state for region filter (persists across page navigation)
const availableRegions = ref<RegionInfo[]>([])
const selectedRegion = ref<string | null>(null) // null = all regions
const loadingRegions = ref(false)
const initialized = ref(false)
const currentProductId = ref<string | null>(null)

// Load persisted region from localStorage on initialization
if (import.meta.client) {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    selectedRegion.value = stored === 'null' ? null : stored
  }
}

export const useRegionFilter = () => {
  const supabase = useSupabaseClient()

  /**
   * Load available regions based on prompt_results data for the given product
   * Only shows regions that have actual data for this product
   */
  const loadAvailableRegions = async (productId?: string | null) => {
    // If no product ID provided, try to get it from the active product composable
    const targetProductId = productId ?? null

    // Skip if already loaded for the same product
    if (initialized.value && currentProductId.value === targetProductId) return

    loadingRegions.value = true
    try {
      let regionCodes: string[] = []

      if (targetProductId) {
        // Get distinct request_country values from prompt_results for this product
        const { data: results, error: resultsError } = await supabase
          .from('prompt_results')
          .select('request_country')
          .eq('product_id', targetProductId)
          .not('request_country', 'is', null)

        if (resultsError) {
          console.error('Error loading regions from prompt_results:', resultsError)
          return
        }

        // Get unique region codes
        const uniqueRegions = new Set<string>()
        for (const row of (results || [])) {
          if (row.request_country) {
            uniqueRegions.add(row.request_country.toLowerCase())
          }
        }
        regionCodes = Array.from(uniqueRegions)
      }

      if (regionCodes.length === 0) {
        // No regions found for this product - only show "Local" if we have any results
        // Check if there are any results with null/empty request_country (local)
        if (targetProductId) {
          const { count } = await supabase
            .from('prompt_results')
            .select('id', { count: 'exact', head: true })
            .eq('product_id', targetProductId)
            .or('request_country.is.null,request_country.eq.local')

          if (count && count > 0) {
            availableRegions.value = [{
              code: 'local',
              name: 'Local',
              flag: '🏠'
            }]
          } else {
            availableRegions.value = []
          }
        } else {
          availableRegions.value = []
        }

        initialized.value = true
        currentProductId.value = targetProductId

        // If selected region is no longer available, reset to null
        if (selectedRegion.value && !availableRegions.value.find(r => r.code === selectedRegion.value)) {
          selectedRegion.value = null
          if (import.meta.client) {
            localStorage.setItem(STORAGE_KEY, 'null')
          }
        }
        return
      }

      // Fetch country details for those countries
      const { data: countries, error } = await supabase
        .from('proxy_countries')
        .select('code, name, flag_emoji')
        .eq('is_active', true)
        .in('code', regionCodes)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error loading countries:', error)
        return
      }

      // Build region list - only include regions we have data for
      const regions: RegionInfo[] = []

      // Check if we have "local" data
      if (regionCodes.includes('local')) {
        regions.push({
          code: 'local',
          name: 'Local',
          flag: '🏠'
        })
      }

      // Add countries that have data
      for (const country of (countries || [])) {
        regions.push({
          code: country.code,
          name: country.name,
          flag: country.flag_emoji || '🌍'
        })
      }

      // Handle any region codes that aren't in proxy_countries table
      for (const code of regionCodes) {
        if (code !== 'local' && !regions.find(r => r.code === code)) {
          regions.push({
            code: code,
            name: code.toUpperCase(),
            flag: '🌍'
          })
        }
      }

      availableRegions.value = regions
      initialized.value = true
      currentProductId.value = targetProductId

      // If selected region is no longer available, reset to null
      if (selectedRegion.value && !regions.find(r => r.code === selectedRegion.value)) {
        selectedRegion.value = null
        if (import.meta.client) {
          localStorage.setItem(STORAGE_KEY, 'null')
        }
      }
    } catch (error) {
      console.error('Error loading regions:', error)
    } finally {
      loadingRegions.value = false
    }
  }

  /**
   * Get the display info for the currently selected region
   */
  const selectedRegionInfo = computed(() => {
    if (!selectedRegion.value) return null
    return availableRegions.value.find(r => r.code === selectedRegion.value) || null
  })

  /**
   * Set the selected region filter
   * @param code - Region code or null for "All Regions"
   */
  const setSelectedRegion = (code: string | null) => {
    selectedRegion.value = code
    // Persist to localStorage
    if (import.meta.client) {
      if (code === null) {
        localStorage.setItem(STORAGE_KEY, 'null')
      } else {
        localStorage.setItem(STORAGE_KEY, code)
      }
    }
  }

  /**
   * Get the display label for the current selection
   */
  const selectedRegionLabel = computed(() => {
    if (!selectedRegion.value) return 'All Regions'
    const region = availableRegions.value.find(r => r.code === selectedRegion.value)
    return region ? `${region.flag} ${region.name}` : selectedRegion.value.toUpperCase()
  })

  /**
   * Get country name from code
   */
  const getCountryName = (code: string): string => {
    const region = availableRegions.value.find(r => r.code === code.toLowerCase())
    return region?.name || code.toUpperCase()
  }

  /**
   * Get country flag emoji from code
   */
  const getCountryFlag = (code: string): string => {
    const region = availableRegions.value.find(r => r.code === code.toLowerCase())
    return region?.flag || '🌍'
  }

  /**
   * Build a Supabase query filter for the selected region
   * Use this in queries that fetch prompt_results
   * @param query - Supabase query builder
   * @returns Modified query with region filter applied
   */
  const applyRegionFilter = <T>(query: T): T => {
    if (selectedRegion.value) {
      // @ts-ignore - Query builder typing
      return query.eq('request_country', selectedRegion.value)
    }
    return query
  }

  /**
   * Refresh regions (e.g., after product changes or new scan data)
   */
  const refreshRegions = async (productId?: string | null) => {
    initialized.value = false
    currentProductId.value = null
    await loadAvailableRegions(productId)
  }

  return {
    // State
    availableRegions: readonly(availableRegions),
    selectedRegion: readonly(selectedRegion),
    selectedRegionInfo,
    selectedRegionLabel,
    loadingRegions: readonly(loadingRegions),
    initialized: readonly(initialized),

    // Actions
    loadAvailableRegions,
    setSelectedRegion,
    refreshRegions,
    applyRegionFilter,

    // Helpers
    getCountryName,
    getCountryFlag
  }
}
