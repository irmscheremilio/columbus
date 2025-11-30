<template>
  <div>
    <!-- Mobile header bar -->
    <div class="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-gray-200/50 z-50 lg:hidden flex items-center justify-between px-4">
      <NuxtLink to="/dashboard" class="flex items-center">
        <img src="/brand/logo_text.png" alt="Columbus" class="h-8" />
      </NuxtLink>
      <button
        @click="mobileMenuOpen = !mobileMenuOpen"
        class="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200"
      >
        <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile menu backdrop -->
    <Transition
      enter-active-class="transition-opacity ease-linear duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-linear duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
        @click="mobileMenuOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-md border-r border-gray-200/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        'top-16 lg:top-0',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <div class="flex flex-col h-full">
        <!-- Logo (hidden on mobile, visible on desktop) -->
        <div class="hidden lg:flex items-center h-16 px-6 border-b border-gray-200/50">
          <NuxtLink to="/dashboard" class="flex items-center gap-2">
            <img src="/brand/logo_text.png" alt="Columbus" class="h-8" />
          </NuxtLink>
        </div>

        <!-- Organization Switcher -->
        <div v-if="organizations.length > 1" class="px-3 py-3 border-b border-gray-200/50" data-org-switcher>
          <div class="relative">
            <button
              @click.stop="showOrgSwitcher = !showOrgSwitcher"
              class="w-full flex items-center justify-between px-3 py-2 bg-gray-50/80 rounded-xl hover:bg-gray-100/80 transition-all duration-200"
            >
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <span class="text-sm font-semibold text-brand">
                    {{ currentOrg?.name?.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <span class="text-sm font-medium text-gray-900 truncate">{{ currentOrg?.name }}</span>
              </div>
              <svg
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform"
                :class="showOrgSwitcher && 'rotate-180'"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown -->
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showOrgSwitcher"
                class="absolute left-0 right-0 mt-1 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200/50 shadow-lg py-1 z-10"
              >
                <button
                  v-for="org in organizations"
                  :key="org.organization_id"
                  @click="switchOrganization(org.organization_id)"
                  class="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                  :class="org.is_active && 'bg-brand/5'"
                >
                  <div class="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <span class="text-sm font-semibold text-brand">
                      {{ org.organization_name?.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0 text-left">
                    <div class="text-sm font-medium text-gray-900 truncate">{{ org.organization_name }}</div>
                    <div class="text-xs text-gray-500">{{ org.user_role }}</div>
                  </div>
                  <svg
                    v-if="org.is_active"
                    class="w-4 h-4 text-brand flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Product Selector - Always show when there's at least one product -->
        <div v-if="products.length > 0" class="px-3 py-3 border-b border-gray-200/50" data-product-switcher>
          <div class="relative">
            <button
              @click.stop="showProductSwitcher = !showProductSwitcher"
              class="w-full flex items-center justify-between px-3 py-2 bg-gray-50/80 rounded-xl hover:bg-gray-100/80 transition-all duration-200"
            >
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-7 h-7 rounded bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0 text-left">
                  <span class="text-sm font-medium text-gray-900 truncate block">
                    {{ currentProduct?.name || 'Select Product' }}
                  </span>
                  <span v-if="currentProduct" class="text-xs text-gray-500 truncate block">
                    {{ currentProduct.domain }}
                  </span>
                </div>
              </div>
              <svg
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform"
                :class="showProductSwitcher && 'rotate-180'"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown -->
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showProductSwitcher"
                class="absolute left-0 right-0 mt-1 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200/50 shadow-lg py-1 z-10 max-h-64 overflow-y-auto"
              >
                <button
                  v-for="product in products"
                  :key="product.id"
                  @click="switchProduct(product.id)"
                  class="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                  :class="activeProductId === product.id && 'bg-brand/5'"
                >
                  <div class="w-7 h-7 rounded bg-brand/10 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-brand">
                    {{ product.name?.charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex-1 min-w-0 text-left">
                    <div class="text-sm font-medium text-gray-900 truncate">{{ product.name }}</div>
                    <div class="text-xs text-gray-500 truncate">{{ product.domain }}</div>
                  </div>
                  <svg
                    v-if="activeProductId === product.id"
                    class="w-4 h-4 text-brand flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <NuxtLink
                  to="/dashboard/products"
                  @click="showProductSwitcher = false"
                  class="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors border-t border-gray-100 text-brand"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span class="text-sm font-medium">Manage Products</span>
                </NuxtLink>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group"
            :class="isActive(item.path)
              ? 'bg-brand/10 text-brand shadow-sm'
              : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'"
            @click="mobileMenuOpen = false"
          >
            <component
              :is="item.icon"
              class="w-5 h-5 flex-shrink-0 transition-colors"
              :class="isActive(item.path) ? 'text-brand' : 'text-gray-400 group-hover:text-gray-600'"
            />
            <span>{{ item.name }}</span>
            <span
              v-if="item.badge"
              class="ml-auto px-2 py-0.5 text-xs font-medium rounded-full"
              :class="item.badgeClass || 'bg-brand/10 text-brand'"
            >
              {{ item.badge }}
            </span>
          </NuxtLink>
        </nav>

        <!-- User section -->
        <div class="border-t border-gray-200/50 p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center">
              <span class="text-sm font-semibold text-brand">
                {{ userInitials }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ user?.email }}</p>
              <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span class="text-xs text-gray-500">Online</span>
              </div>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100/80 rounded-xl hover:bg-gray-200/80 hover:text-gray-900 transition-all duration-200"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { products, activeProductId, activeProduct, setActiveProduct, loadProducts } = useActiveProduct()

const mobileMenuOpen = ref(false)
const showOrgSwitcher = ref(false)
const showProductSwitcher = ref(false)
const organizations = ref<any[]>([])

// Close mobile menu and switchers on route change
watch(() => route.path, () => {
  mobileMenuOpen.value = false
  showOrgSwitcher.value = false
  showProductSwitcher.value = false
})

// Close switchers when clicking outside
onMounted(async () => {
  await Promise.all([loadOrganizations(), loadProducts()])

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('[data-org-switcher]')) {
      showOrgSwitcher.value = false
    }
    if (!target.closest('[data-product-switcher]')) {
      showProductSwitcher.value = false
    }
  })
})

const loadOrganizations = async () => {
  if (!user.value) return

  try {
    const { data, error } = await supabase.rpc('get_user_organizations')
    if (!error && data) {
      organizations.value = data
    }
  } catch (e) {
    console.error('Failed to load organizations:', e)
  }
}

const currentProduct = computed(() => {
  return activeProduct.value || products.value[0]
})

const switchProduct = async (productId: string) => {
  await setActiveProduct(productId)
  showProductSwitcher.value = false
  // Reload the page to refresh all data with new product context
  window.location.reload()
}

const currentOrg = computed(() => {
  return organizations.value.find(org => org.is_active) || organizations.value[0]
})

const switchOrganization = async (organizationId: string) => {
  try {
    const { data, error } = await supabase.rpc('switch_organization', {
      p_organization_id: organizationId
    })

    if (error) throw error

    // Reload the page to refresh all data
    window.location.reload()
  } catch (e: any) {
    console.error('Failed to switch organization:', e)
    alert(e.message || 'Failed to switch organization')
  }
}

// Navigation icons as functional components
const HomeIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' })
])

const ChartIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
])

const LightbulbIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' })
])

const CogIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }),
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' })
])

const ClockIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })
])

const DocumentIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
])

const CurrencyIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
])

const UsersIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' })
])

const ChatIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' })
])

const ProductIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' })
])

const LinkIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' })
])

const DesktopIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25' })
])

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Products', path: '/dashboard/products', icon: ProductIcon },
  { name: 'Visibility', path: '/dashboard/visibility', icon: ChartIcon },
  { name: 'Sources', path: '/dashboard/sources', icon: LinkIcon },
  { name: 'Recommendations', path: '/dashboard/recommendations', icon: LightbulbIcon },
  { name: 'Freshness', path: '/dashboard/freshness', icon: ClockIcon },
  { name: 'Competitors', path: '/dashboard/competitors', icon: UsersIcon },
  { name: 'Prompts', path: '/dashboard/prompts', icon: ChatIcon },
  { name: 'Reports', path: '/dashboard/reports', icon: DocumentIcon },
  { name: 'ROI', path: '/dashboard/roi', icon: CurrencyIcon },
  { name: 'Desktop App', path: '/dashboard/extension', icon: DesktopIcon, badge: 'New', badgeClass: 'bg-green-100 text-green-700' },
  { name: 'Settings', path: '/dashboard/settings', icon: CogIcon },
]

const userInitials = computed(() => {
  const email = user.value?.email || ''
  return email.charAt(0).toUpperCase()
})

const isActive = (path: string) => {
  if (path === '/dashboard') {
    return route.path === '/dashboard'
  }
  return route.path.startsWith(path)
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  await router.push('/')
}
</script>
