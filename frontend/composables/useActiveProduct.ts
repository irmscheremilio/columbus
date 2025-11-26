export interface Product {
  id: string
  name: string
  domain: string
  description: string | null
  aeo_score: number | null
  last_analyzed_at: string | null
  is_active: boolean
}

// Global state for active product
const activeProduct = ref<Product | null>(null)
const products = ref<Product[]>([])
const loading = ref(false)
const initialized = ref(false)

export const useActiveProduct = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const loadProducts = async () => {
    if (!user.value) return

    loading.value = true
    try {
      // Get user's profile to find organization and active product
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, active_organization_id, active_product_id')
        .eq('id', user.value.id)
        .single()

      if (!profile) return

      const orgId = profile.active_organization_id || profile.organization_id

      // Get products for the organization
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, domain, description, aeo_score, last_analyzed_at, is_active')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      products.value = productsData || []

      // Set active product
      if (profile.active_product_id) {
        activeProduct.value = products.value.find(p => p.id === profile.active_product_id) || null
      }

      // Auto-select first product if none selected
      if (!activeProduct.value && products.value.length > 0) {
        await setActiveProduct(products.value[0].id)
      }

      initialized.value = true
    } catch (e) {
      console.error('Failed to load products:', e)
    } finally {
      loading.value = false
    }
  }

  const setActiveProduct = async (productId: string) => {
    if (!user.value) return

    try {
      await supabase
        .from('profiles')
        .update({ active_product_id: productId })
        .eq('id', user.value.id)

      activeProduct.value = products.value.find(p => p.id === productId) || null
    } catch (e) {
      console.error('Failed to set active product:', e)
    }
  }

  const refreshProducts = async () => {
    initialized.value = false
    await loadProducts()
  }

  // Initialize on first use
  if (!initialized.value && user.value) {
    loadProducts()
  }

  return {
    activeProduct: readonly(activeProduct),
    activeProductId: computed(() => activeProduct.value?.id || null),
    products: readonly(products),
    loading: readonly(loading),
    initialized: readonly(initialized),
    loadProducts,
    setActiveProduct,
    refreshProducts
  }
}
