export type CookieConsentType = 'all' | 'essential' | 'none' | null

export interface CookiePreferences {
  essential: boolean // Always true - required for site functionality
  analytics: boolean
  marketing: boolean
}

export const useCookieConsent = () => {
  const consent = useState<CookieConsentType>('cookie-consent', () => null)
  const showBanner = useState<boolean>('cookie-banner-visible', () => false)

  // Initialize from localStorage on client-side
  const initConsent = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem('cookie-consent')
      if (stored) {
        consent.value = stored as CookieConsentType
        showBanner.value = false
      } else {
        showBanner.value = true
      }
    }
  }

  const acceptAll = () => {
    consent.value = 'all'
    if (import.meta.client) {
      localStorage.setItem('cookie-consent', 'all')
    }
    showBanner.value = false
  }

  const acceptEssential = () => {
    consent.value = 'essential'
    if (import.meta.client) {
      localStorage.setItem('cookie-consent', 'essential')
    }
    showBanner.value = false
  }

  const declineAll = () => {
    consent.value = 'none'
    if (import.meta.client) {
      localStorage.setItem('cookie-consent', 'none')
    }
    showBanner.value = false
  }

  const resetConsent = () => {
    consent.value = null
    if (import.meta.client) {
      localStorage.removeItem('cookie-consent')
    }
    showBanner.value = true
  }

  const getPreferences = (): CookiePreferences => {
    return {
      essential: true, // Always enabled
      analytics: consent.value === 'all',
      marketing: consent.value === 'all',
    }
  }

  const hasConsent = computed(() => consent.value !== null)
  const hasAnalyticsConsent = computed(() => consent.value === 'all')
  const hasMarketingConsent = computed(() => consent.value === 'all')

  return {
    consent,
    showBanner,
    initConsent,
    acceptAll,
    acceptEssential,
    declineAll,
    resetConsent,
    getPreferences,
    hasConsent,
    hasAnalyticsConsent,
    hasMarketingConsent,
  }
}
