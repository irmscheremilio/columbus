<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Products</h1>
          <p class="text-sm text-gray-500">Manage your products and track their AI visibility</p>
        </div>
        <button
          @click="showAddModal = true"
          :disabled="!canAddProduct"
          class="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg font-medium shadow-sm shadow-brand/25 hover:shadow-md hover:shadow-brand/30 hover:bg-brand/95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      <!-- Product Slots Info -->
      <div v-if="productSlots" class="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="text-sm text-gray-600">
              <span class="font-semibold text-gray-900">{{ productSlots.used }}</span> of
              <span class="font-semibold text-gray-900">{{ productSlots.total }}</span> product slots used
            </div>
            <div class="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-brand to-brand/80 rounded-full transition-all duration-500"
                :style="{ width: `${(productSlots.used / productSlots.total) * 100}%` }"
              ></div>
            </div>
          </div>
          <NuxtLink
            v-if="productSlots.remaining === 0"
            to="/pricing"
            class="text-sm text-brand hover:text-brand/80 font-medium transition-colors"
          >
            Upgrade for more products →
          </NuxtLink>
        </div>
      </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-20">
          <div class="w-8 h-8 animate-spin rounded-full border-2 border-brand border-t-transparent"></div>
        </div>

        <!-- Products Grid -->
        <div v-else-if="products.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="product in products"
            :key="product.id"
            class="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
            :class="{ 'ring-2 ring-brand ring-offset-2': activeProductId === product.id }"
            @click="selectProduct(product.id)"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center text-brand font-semibold shadow-sm">
                  {{ product.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">{{ product.name }}</h3>
                  <a :href="`https://${product.domain}`" target="_blank" class="text-sm text-gray-500 hover:text-brand transition-colors">
                    {{ product.domain }}
                  </a>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span
                  v-if="activeProductId === product.id"
                  class="px-2.5 py-1 bg-brand/10 text-brand text-xs font-medium rounded-full"
                >
                  Active
                </span>
                <button
                  @click.stop="editProduct(product)"
                  class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-lg transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- AEO Score -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-sm text-gray-600">AEO Score</span>
                <span class="text-sm font-semibold" :class="getScoreColor(product.aeo_score)">
                  {{ product.aeo_score ?? '--' }}
                </span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="getScoreBarColor(product.aeo_score)"
                  :style="{ width: `${product.aeo_score ?? 0}%` }"
                ></div>
              </div>
            </div>

            <!-- Last Analyzed -->
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Last analyzed</span>
              <span class="text-gray-700 font-medium">
                {{ product.last_analyzed_at ? formatDate(product.last_analyzed_at) : 'Never' }}
              </span>
            </div>

            <!-- Actions -->
            <div class="mt-4 pt-4 border-t border-gray-100/80 flex gap-2">
              <button
                @click.stop="runAnalysis(product)"
                :disabled="analyzingProductId === product.id"
                class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-brand/10 text-brand rounded-lg text-sm font-medium hover:bg-brand/20 transition-all duration-200 disabled:opacity-50"
              >
                <svg v-if="analyzingProductId === product.id" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {{ analyzingProductId === product.id ? 'Analyzing...' : 'Run Analysis' }}
              </button>
              <button
                @click.stop="confirmDelete(product)"
                class="p-2 text-red-500 hover:text-red-600 hover:bg-red-50/80 rounded-lg transition-all duration-200"
                title="Delete product"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-20 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg class="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
          <p class="text-gray-500 mb-6 max-w-sm mx-auto">
            Add your first product to start tracking its AI visibility and get optimization recommendations.
          </p>
          <button
            @click="showAddModal = true"
            class="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-medium shadow-sm shadow-brand/25 hover:shadow-md hover:shadow-brand/30 hover:bg-brand/95 transition-all duration-200"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Product
          </button>
        </div>
    </div>

    <!-- Add/Edit Product Modal -->
    <Teleport to="body">
      <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" @click.self="closeModals">
        <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 border border-white/50">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            {{ showEditModal ? 'Edit Product' : 'Add New Product' }}
          </h3>
          <form @submit.prevent="showEditModal ? handleUpdateProduct() : handleAddProduct()" class="space-y-4">
            <div v-if="formError" class="p-3 bg-red-50/80 border border-red-200/50 rounded-xl text-sm text-red-700">
              {{ formError }}
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Product Name <span class="text-red-500">*</span></label>
              <input
                v-model="productForm.name"
                type="text"
                class="w-full px-3.5 py-2.5 border border-gray-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-200"
                placeholder="My Product"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Website Domain <span class="text-red-500">*</span></label>
              <input
                v-model="productForm.domain"
                type="text"
                :disabled="showEditModal"
                class="w-full px-3.5 py-2.5 border border-gray-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:bg-gray-100/80 disabled:cursor-not-allowed transition-all duration-200"
                placeholder="example.com"
                required
              />
              <p v-if="showEditModal" class="text-xs text-gray-500 mt-1.5">Domain cannot be changed after creation</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                v-model="productForm.description"
                rows="3"
                class="w-full px-3.5 py-2.5 border border-gray-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none transition-all duration-200"
                placeholder="Brief description of your product..."
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Target Region <span class="text-red-500">*</span>
              </label>
              <select
                v-model="productForm.primaryCountry"
                @change="onRegionChange"
                class="w-full px-3.5 py-2.5 border border-gray-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-200"
                required
              >
                <option value="">Select your primary target region</option>
                <option v-for="region in regions" :key="region.code" :value="region.code">
                  {{ region.name }}
                </option>
              </select>
              <p class="text-xs text-gray-500 mt-1.5">
                Prompts will be generated in the region's language and optimized for local search patterns.
              </p>
            </div>
            <div v-if="!showEditModal" class="flex items-center gap-2.5">
              <input
                id="runAnalysis"
                v-model="productForm.runInitialAnalysis"
                type="checkbox"
                class="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <label for="runAnalysis" class="text-sm text-gray-700">Analyze website & generate recommendations</label>
            </div>
            <div class="flex gap-3 justify-end pt-3 border-t border-gray-100/80">
              <button
                type="button"
                @click="closeModals"
                class="px-4 py-2.5 text-gray-700 hover:bg-gray-100/80 rounded-xl font-medium transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-5 py-2.5 bg-brand text-white rounded-xl font-medium shadow-sm shadow-brand/25 hover:shadow-md hover:shadow-brand/30 hover:bg-brand/95 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
                :disabled="formLoading"
              >
                {{ formLoading ? 'Saving...' : (showEditModal ? 'Save Changes' : 'Add Product') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" @click.self="showDeleteModal = false">
        <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 border border-white/50">
          <div class="w-12 h-12 rounded-xl bg-red-50/80 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
          <p class="text-gray-600 mb-5">
            Are you sure you want to delete <strong class="text-gray-900">{{ productToDelete?.name }}</strong>?
            This will also delete all associated data including visibility scores and recommendations.
          </p>
          <div class="flex gap-3 justify-end pt-3 border-t border-gray-100/80">
            <button
              @click="showDeleteModal = false"
              class="px-4 py-2.5 text-gray-700 hover:bg-gray-100/80 rounded-xl font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              @click="handleDeleteProduct"
              class="px-5 py-2.5 bg-red-500 text-white rounded-xl font-medium shadow-sm shadow-red-500/25 hover:shadow-md hover:shadow-red-500/30 hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
              :disabled="deleteLoading"
            >
              {{ deleteLoading ? 'Deleting...' : 'Delete Product' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

interface Product {
  id: string
  name: string
  domain: string
  description: string | null
  aeo_score: number | null
  last_analyzed_at: string | null
  is_active: boolean
}

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { createProduct, triggerWebsiteAnalysis } = useEdgeFunctions()

const loading = ref(true)
const formLoading = ref(false)
const deleteLoading = ref(false)
const analyzingProductId = ref<string | null>(null)

const products = ref<Product[]>([])
const activeProductId = ref<string | null>(null)
const productSlots = ref<{ used: number; total: number; remaining: number } | null>(null)

const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const productToDelete = ref<Product | null>(null)
const editingProduct = ref<Product | null>(null)
const formError = ref('')

const productForm = ref({
  name: '',
  domain: '',
  description: '',
  primaryLocation: '',
  primaryCountry: '',
  primaryLanguage: 'en',
  runInitialAnalysis: true
})

// Common regions/countries for targeting
const regions = [
  { code: 'US', name: 'United States', language: 'en' },
  { code: 'GB', name: 'United Kingdom', language: 'en' },
  { code: 'CA', name: 'Canada', language: 'en' },
  { code: 'AU', name: 'Australia', language: 'en' },
  { code: 'DE', name: 'Germany', language: 'de' },
  { code: 'FR', name: 'France', language: 'fr' },
  { code: 'ES', name: 'Spain', language: 'es' },
  { code: 'IT', name: 'Italy', language: 'it' },
  { code: 'NL', name: 'Netherlands', language: 'nl' },
  { code: 'BR', name: 'Brazil', language: 'pt' },
  { code: 'MX', name: 'Mexico', language: 'es' },
  { code: 'JP', name: 'Japan', language: 'ja' },
  { code: 'KR', name: 'South Korea', language: 'ko' },
  { code: 'IN', name: 'India', language: 'en' },
  { code: 'SG', name: 'Singapore', language: 'en' },
  { code: 'AE', name: 'UAE', language: 'en' },
  { code: 'GLOBAL', name: 'Global (All regions)', language: 'en' },
]

const canAddProduct = computed(() => {
  return productSlots.value ? productSlots.value.remaining > 0 : false
})

const onRegionChange = () => {
  const region = regions.find(r => r.code === productForm.value.primaryCountry)
  if (region) {
    productForm.value.primaryLanguage = region.language
    productForm.value.primaryLocation = region.name
  }
}

onMounted(async () => {
  await loadProducts()
})

const loadProducts = async () => {
  loading.value = true
  try {
    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, active_organization_id, active_product_id')
      .eq('id', user.value?.id)
      .single()

    if (!profile) return

    const orgId = profile.active_organization_id || profile.organization_id
    activeProductId.value = profile.active_product_id

    // Get products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    products.value = productsData || []

    // Get product slots
    const { data: org } = await supabase
      .from('organizations')
      .select('product_limit')
      .eq('id', orgId)
      .single()

    if (org) {
      productSlots.value = {
        used: products.value.length,
        total: org.product_limit || 1,
        remaining: (org.product_limit || 1) - products.value.length
      }
    }
  } catch (error) {
    console.error('Error loading products:', error)
  } finally {
    loading.value = false
  }
}

const selectProduct = async (productId: string) => {
  try {
    await supabase
      .from('profiles')
      .update({ active_product_id: productId })
      .eq('id', user.value?.id)

    activeProductId.value = productId
  } catch (error) {
    console.error('Error selecting product:', error)
  }
}

const handleAddProduct = async () => {
  formError.value = ''
  formLoading.value = true

  try {
    const result = await createProduct({
      name: productForm.value.name,
      domain: productForm.value.domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      description: productForm.value.description || undefined,
      primaryLocation: productForm.value.primaryLocation || undefined,
      primaryCountry: productForm.value.primaryCountry || undefined,
      primaryLanguage: productForm.value.primaryLanguage || 'en',
      runInitialAnalysis: productForm.value.runInitialAnalysis
    })

    if (result.error) {
      formError.value = result.error
      return
    }

    showAddModal.value = false
    resetForm()
    await loadProducts()

    // Select the new product
    if (result.product?.id) {
      await selectProduct(result.product.id)
    }
  } catch (error: any) {
    formError.value = error.message || 'Failed to create product'
  } finally {
    formLoading.value = false
  }
}

const editProduct = (product: Product) => {
  editingProduct.value = product
  productForm.value = {
    name: product.name,
    domain: product.domain,
    description: product.description || '',
    runInitialAnalysis: false
  }
  showEditModal.value = true
}

const handleUpdateProduct = async () => {
  if (!editingProduct.value) return

  formError.value = ''
  formLoading.value = true

  try {
    const { error } = await supabase
      .from('products')
      .update({
        name: productForm.value.name,
        description: productForm.value.description || null
      })
      .eq('id', editingProduct.value.id)

    if (error) throw error

    showEditModal.value = false
    resetForm()
    await loadProducts()
  } catch (error: any) {
    formError.value = error.message || 'Failed to update product'
  } finally {
    formLoading.value = false
  }
}

const confirmDelete = (product: Product) => {
  productToDelete.value = product
  showDeleteModal.value = true
}

const handleDeleteProduct = async () => {
  if (!productToDelete.value) return

  deleteLoading.value = true

  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productToDelete.value.id)

    if (error) throw error

    showDeleteModal.value = false
    productToDelete.value = null

    // If deleted product was active, clear it
    if (activeProductId.value === productToDelete.value?.id) {
      activeProductId.value = null
      await supabase
        .from('profiles')
        .update({ active_product_id: null })
        .eq('id', user.value?.id)
    }

    await loadProducts()
  } catch (error: any) {
    console.error('Error deleting product:', error)
    alert(error.message || 'Failed to delete product')
  } finally {
    deleteLoading.value = false
  }
}

const runAnalysis = async (product: Product) => {
  analyzingProductId.value = product.id

  try {
    await triggerWebsiteAnalysis({
      productId: product.id,
      includeCompetitorGaps: true
    })

    alert('Analysis started! Results will be available shortly.')
  } catch (error: any) {
    console.error('Error starting analysis:', error)
    alert(error.message || 'Failed to start analysis')
  } finally {
    analyzingProductId.value = null
  }
}

const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  resetForm()
}

const resetForm = () => {
  productForm.value = {
    name: '',
    domain: '',
    description: '',
    primaryLocation: '',
    primaryCountry: '',
    primaryLanguage: 'en',
    runInitialAnalysis: true
  }
  formError.value = ''
  editingProduct.value = null
}

const getScoreColor = (score: number | null) => {
  if (score === null) return 'text-gray-400'
  if (score >= 70) return 'text-green-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-red-600'
}

const getScoreBarColor = (score: number | null) => {
  if (score === null) return 'bg-gray-300'
  if (score >= 70) return 'bg-green-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>
