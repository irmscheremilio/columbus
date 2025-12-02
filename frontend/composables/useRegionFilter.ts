/**
 * Composable for managing region/country filtering across dashboard pages
 * Loads available regions from scanned data and provides filtering state
 */

interface RegionInfo {
  code: string
  name: string
  flag: string
}

// Map of country codes to names and flags
const COUNTRY_DATA: Record<string, { name: string; flag: string }> = {
  us: { name: 'United States', flag: '🇺🇸' },
  uk: { name: 'United Kingdom', flag: '🇬🇧' },
  gb: { name: 'United Kingdom', flag: '🇬🇧' },
  de: { name: 'Germany', flag: '🇩🇪' },
  fr: { name: 'France', flag: '🇫🇷' },
  es: { name: 'Spain', flag: '🇪🇸' },
  it: { name: 'Italy', flag: '🇮🇹' },
  nl: { name: 'Netherlands', flag: '🇳🇱' },
  be: { name: 'Belgium', flag: '🇧🇪' },
  at: { name: 'Austria', flag: '🇦🇹' },
  ch: { name: 'Switzerland', flag: '🇨🇭' },
  pl: { name: 'Poland', flag: '🇵🇱' },
  se: { name: 'Sweden', flag: '🇸🇪' },
  no: { name: 'Norway', flag: '🇳🇴' },
  dk: { name: 'Denmark', flag: '🇩🇰' },
  fi: { name: 'Finland', flag: '🇫🇮' },
  pt: { name: 'Portugal', flag: '🇵🇹' },
  ie: { name: 'Ireland', flag: '🇮🇪' },
  ca: { name: 'Canada', flag: '🇨🇦' },
  au: { name: 'Australia', flag: '🇦🇺' },
  nz: { name: 'New Zealand', flag: '🇳🇿' },
  jp: { name: 'Japan', flag: '🇯🇵' },
  kr: { name: 'South Korea', flag: '🇰🇷' },
  sg: { name: 'Singapore', flag: '🇸🇬' },
  hk: { name: 'Hong Kong', flag: '🇭🇰' },
  in: { name: 'India', flag: '🇮🇳' },
  br: { name: 'Brazil', flag: '🇧🇷' },
  mx: { name: 'Mexico', flag: '🇲🇽' },
  ar: { name: 'Argentina', flag: '🇦🇷' },
  za: { name: 'South Africa', flag: '🇿🇦' },
  local: { name: 'Local', flag: '🏠' }
}

export const useRegionFilter = () => {
  const supabase = useSupabaseClient()
  const { activeProductId } = useActiveProduct()

  // Available regions (loaded from scan data)
  const availableRegions = ref<RegionInfo[]>([])

  // Currently selected region (null = all regions)
  const selectedRegion = ref<string | null>(null)

  // Loading state
  const loadingRegions = ref(false)

  /**
   * Load available regions from the product's scan data
   */
  const loadAvailableRegions = async () => {
    const productId = activeProductId.value
    if (!productId) {
      availableRegions.value = []
      return
    }

    loadingRegions.value = true
    try {
      // Get distinct request_country values from prompt_results for this product
      const { data, error } = await supabase
        .from('prompt_results')
        .select('request_country')
        .eq('product_id', productId)
        .not('request_country', 'is', null)

      if (error) {
        console.error('Error loading regions:', error)
        return
      }

      // Get unique country codes
      const uniqueCodes = [...new Set(data?.map(r => r.request_country?.toLowerCase()).filter(Boolean))]

      // Map to region info
      availableRegions.value = uniqueCodes.map(code => {
        const countryData = COUNTRY_DATA[code] || { name: code.toUpperCase(), flag: '🌍' }
        return {
          code,
          name: countryData.name,
          flag: countryData.flag
        }
      }).sort((a, b) => a.name.localeCompare(b.name))

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
   * Set the selected region
   */
  const setSelectedRegion = (code: string | null) => {
    selectedRegion.value = code
  }

  /**
   * Get country name from code
   */
  const getCountryName = (code: string): string => {
    return COUNTRY_DATA[code.toLowerCase()]?.name || code.toUpperCase()
  }

  /**
   * Get country flag emoji from code
   */
  const getCountryFlag = (code: string): string => {
    return COUNTRY_DATA[code.toLowerCase()]?.flag || '🌍'
  }

  // Reload regions when product changes
  watch(activeProductId, () => {
    selectedRegion.value = null
    loadAvailableRegions()
  })

  return {
    availableRegions,
    selectedRegion,
    selectedRegionInfo,
    loadingRegions,
    loadAvailableRegions,
    setSelectedRegion,
    getCountryName,
    getCountryFlag
  }
}
