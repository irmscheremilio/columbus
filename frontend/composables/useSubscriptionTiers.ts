export interface SubscriptionTier {
  id: string
  name: string
  description: string
  tagline: string
  icon: string
  is_popular: boolean
  sort_order: number
  monthly_price: number // in cents
  yearly_price: number // in cents
  product_limit: number // -1 = unlimited
  prompts_per_month: number // -1 = unlimited
  competitors_limit: number // -1 = unlimited
  scans_per_month: number // -1 = unlimited
  website_analyses_limit: number // -1 = unlimited
  features: { text: string; included: boolean }[]
  highlight_features: string[]
}

export const useSubscriptionTiers = () => {
  const supabase = useSupabaseClient()
  const tiers = useState<SubscriptionTier[]>('subscription-tiers', () => [])
  const loading = useState<boolean>('subscription-tiers-loading', () => false)
  const error = useState<string | null>('subscription-tiers-error', () => null)

  const fetchTiers = async () => {
    if (tiers.value.length > 0) return tiers.value // Already loaded

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError

      tiers.value = data as SubscriptionTier[]
      return tiers.value
    } catch (e: any) {
      error.value = e.message
      console.error('Failed to fetch subscription tiers:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  const getTierById = (id: string) => {
    return tiers.value.find(t => t.id === id)
  }

  const formatPrice = (priceInCents: number, period: 'monthly' | 'yearly' = 'monthly') => {
    if (priceInCents === 0) return '$0'
    const dollars = priceInCents / 100
    return `$${dollars.toLocaleString()}`
  }

  const getMonthlyEquivalent = (yearlyPriceInCents: number) => {
    if (yearlyPriceInCents === 0) return '$0'
    const monthlyDollars = (yearlyPriceInCents / 100) / 12
    return `$${monthlyDollars.toFixed(2)}`
  }

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'Unlimited'
    return limit.toString()
  }

  // Icon mapping for tier icons
  const getIconSvg = (iconName: string) => {
    const icons: Record<string, string> = {
      'clock': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />`,
      'bolt': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />`,
      'chart-line': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />`,
      'building': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />`,
    }
    return icons[iconName] || icons['clock']
  }

  return {
    tiers,
    loading,
    error,
    fetchTiers,
    getTierById,
    formatPrice,
    getMonthlyEquivalent,
    formatLimit,
    getIconSvg,
  }
}
