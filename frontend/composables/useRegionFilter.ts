/**
 * Composable for managing region/country filtering across dashboard pages
 * Loads available regions from static_proxies (configured proxy countries)
 * Provides global state for filtering prompt_results by region
 */

export interface RegionInfo {
  code: string
  name: string
  flag: string
}

// Global state for region filter (persists across page navigation)
const availableRegions = ref<RegionInfo[]>([])
const selectedRegion = ref<string | null>(null) // null = all regions
const loadingRegions = ref(false)
const initialized = ref(false)

export const useRegionFilter = () => {
  const supabase = useSupabaseClient()

  /**
   * Load available regions from static_proxies via RPC function
   * Only shows countries that have proxies configured
   */
  const loadAvailableRegions = async () => {
    if (initialized.value) return // Already loaded

    loadingRegions.value = true
    try {
      // Get countries that have static proxies configured via RPC function
      const { data: configuredCountries, error: proxyError } = await supabase
        .rpc('get_configured_proxy_countries')

      if (proxyError) {
        console.error('Error loading configured proxies:', proxyError)
        return
      }

      // Get unique country codes that have proxies
      const countryCodes = (configuredCountries || []).map((p: { country_code: string }) => p.country_code)

      if (countryCodes.length === 0) {
        // Always include "local" as an option even if no proxies configured
        availableRegions.value = [{
          code: 'local',
          name: 'Local',
          flag: '🏠'
        }]
        initialized.value = true
        return
      }

      // Fetch country details for those countries
      const { data: countries, error } = await supabase
        .from('proxy_countries')
        .select('code, name, flag_emoji')
        .eq('is_active', true)
        .in('code', countryCodes)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error loading countries:', error)
        return
      }

      // Build region list with "Local" first, then configured countries
      const regions: RegionInfo[] = [{
        code: 'local',
        name: 'Local',
        flag: '🏠'
      }]

      for (const country of (countries || [])) {
        regions.push({
          code: country.code,
          name: country.name,
          flag: country.flag_emoji || '🌍'
        })
      }

      availableRegions.value = regions
      initialized.value = true
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
   * Refresh regions (e.g., after proxy config changes)
   */
  const refreshRegions = async () => {
    initialized.value = false
    await loadAvailableRegions()
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
