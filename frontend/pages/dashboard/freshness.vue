<template>
  <div class="min-h-screen bg-gray-50">
    <div class="p-4 lg:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Content Freshness</h1>
          <p class="text-sm text-gray-500">Monitor content freshness for AI visibility</p>
        </div>
        <div class="flex items-center gap-3">
          <RegionFilter v-model="selectedRegion" @change="onRegionChange" />
          <button
            @click="triggerFreshnessCheck"
            :disabled="checkingFreshness"
            class="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg class="w-4 h-4" :class="checkingFreshness ? 'animate-spin' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ checkingFreshness ? 'Checking...' : 'Check All' }}
          </button>
          <button
            @click="showAddPageModal = true"
            class="inline-flex items-center gap-2 px-3 py-1.5 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand/90 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Page
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Avg Freshness</div>
          <div class="text-lg font-bold text-gray-900">{{ stats.avgFreshness }}<span class="text-xs font-normal text-gray-400">%</span></div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Monitored</div>
          <div class="text-lg font-bold text-blue-600">{{ stats.totalPages }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Fresh</div>
          <div class="text-lg font-bold text-green-600">{{ freshCount }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Stale</div>
          <div class="text-lg font-bold text-yellow-600">{{ stats.stalePages }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Alerts</div>
          <div class="text-lg font-bold text-red-600">{{ stats.unreadAlerts }}</div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Pages Table -->
        <div class="lg:col-span-2 bg-white rounded-lg border border-gray-200">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-900">Monitored Pages</h2>
            <span class="text-xs text-gray-500">{{ pages.length }} pages</span>
          </div>

          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
          </div>

          <div v-else-if="pages.length === 0" class="text-center py-12">
            <p class="text-sm text-gray-500 mb-2">No pages being monitored</p>
            <button @click="showAddPageModal = true" class="text-brand font-medium hover:underline text-sm">
              Add your first page
            </button>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th class="text-left px-4 py-2 font-medium">Page</th>
                  <th class="text-center px-4 py-2 font-medium w-20">Score</th>
                  <th class="text-center px-4 py-2 font-medium hidden sm:table-cell">Status</th>
                  <th class="text-center px-4 py-2 font-medium hidden md:table-cell">Last Check</th>
                  <th class="text-right px-4 py-2 font-medium w-16">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="page in pages"
                  :key="page.id"
                  class="text-sm hover:bg-gray-50"
                >
                  <td class="px-4 py-3">
                    <div class="text-gray-900 font-medium truncate max-w-xs">{{ page.title || getPageTitle(page.url) }}</div>
                    <div class="text-xs text-gray-400 truncate max-w-xs">{{ page.url }}</div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span
                      class="inline-flex w-8 h-8 rounded text-xs font-bold text-white items-center justify-center"
                      :class="getFreshnessColorClass(page.freshness_score)"
                    >
                      {{ page.freshness_score || '?' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center hidden sm:table-cell">
                    <span
                      class="inline-flex px-1.5 py-0.5 rounded text-xs font-medium"
                      :class="getStatusBadgeClass(page.status)"
                    >
                      {{ page.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center hidden md:table-cell">
                    <span class="text-xs text-gray-500">{{ page.last_crawled_at ? formatDate(page.last_crawled_at) : '-' }}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button
                      @click="removePage(page.id)"
                      class="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Alerts Sidebar -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-900">Recent Alerts</h2>
            <button
              v-if="alerts.some(a => !a.is_read)"
              @click="markAllAlertsRead"
              class="text-xs text-brand hover:underline font-medium"
            >
              Mark all read
            </button>
          </div>

          <div v-if="alerts.length === 0" class="text-center py-8 text-sm text-gray-500">
            No alerts
          </div>

          <div v-else class="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            <div
              v-for="alert in alerts.slice(0, 10)"
              :key="alert.id"
              class="px-4 py-3 hover:bg-gray-50"
              :class="!alert.is_read ? 'bg-amber-50' : ''"
            >
              <div class="flex items-start gap-2">
                <div
                  class="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center"
                  :class="getSeverityClass(alert.severity)"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-900 truncate">{{ alert.title }}</div>
                  <div class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ alert.description }}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span
                      class="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium uppercase"
                      :class="getSeverityBadgeClass(alert.severity)"
                    >
                      {{ alert.severity }}
                    </span>
                    <span class="text-[10px] text-gray-400">{{ formatDate(alert.created_at) }}</span>
                  </div>
                </div>
                <button
                  v-if="!alert.is_read"
                  @click="markAlertRead(alert.id)"
                  class="flex-shrink-0 p-1 text-gray-400 hover:text-green-600"
                  title="Mark as read"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Page Modal -->
    <Teleport to="body">
      <div
        v-if="showAddPageModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        @click.self="showAddPageModal = false"
      >
        <div class="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold mb-4">Add Page to Monitor</h3>
          <form @submit.prevent="addPage" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Page URL</label>
              <input
                v-model="newPage.url"
                type="url"
                required
                placeholder="https://example.com/page"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Title (optional)</label>
              <input
                v-model="newPage.title"
                type="text"
                placeholder="Page title"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Check Frequency</label>
              <select
                v-model="newPage.checkFrequencyHours"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option :value="24">Daily</option>
                <option :value="72">Every 3 days</option>
                <option :value="168">Weekly</option>
              </select>
            </div>
            <div class="flex gap-2 pt-2">
              <button
                type="button"
                @click="showAddPageModal = false"
                class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="addingPage"
                class="flex-1 px-3 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand/90 transition-colors disabled:opacity-50"
              >
                {{ addingPage ? 'Adding...' : 'Add Page' }}
              </button>
            </div>
          </form>
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

const supabase = useSupabaseClient()
const { activeProductId, initialized: productInitialized } = useActiveProduct()

const loading = ref(true)
const pages = ref<any[]>([])
const alerts = ref<any[]>([])
const stats = ref({
  avgFreshness: 0,
  totalPages: 0,
  stalePages: 0,
  unreadAlerts: 0,
  criticalAlerts: 0
})

const showAddPageModal = ref(false)
const addingPage = ref(false)
const checkingFreshness = ref(false)
const newPage = ref({
  url: '',
  title: '',
  checkFrequencyHours: 72
})

// Region filter
const selectedRegion = ref<string | null>(null)

const onRegionChange = (region: string | null) => {
  selectedRegion.value = region
  if (activeProductId.value) {
    loadData()
  }
}

const freshCount = computed(() => stats.value.totalPages - stats.value.stalePages)

watch(activeProductId, async (newProductId) => {
  if (newProductId) await loadData()
})

onMounted(async () => {
  if (productInitialized.value && activeProductId.value) {
    await loadData()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadData()
        unwatch()
      }
    })
  }
})

const loadData = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase.functions.invoke(`manage-freshness?action=dashboard&productId=${productId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      method: 'GET'
    })

    if (error) throw error

    if (data) {
      if (data.stats) {
        stats.value = {
          avgFreshness: data.stats.avgFreshness || 0,
          totalPages: data.stats.totalPages || 0,
          stalePages: data.stats.staleCount || 0,
          unreadAlerts: data.stats.unreadAlerts || 0,
          criticalAlerts: data.stats.criticalAlerts || 0
        }
      }
      pages.value = data.recentPages || []
      alerts.value = data.recentAlerts || []
    }
  } catch (error) {
    console.error('Error loading freshness data:', error)
  } finally {
    loading.value = false
  }
}

const addPage = async () => {
  const productId = activeProductId.value
  if (!productId) return

  addingPage.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { error } = await supabase.functions.invoke('manage-freshness?action=add-page', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: {
        productId,
        url: newPage.value.url,
        title: newPage.value.title,
        checkFrequencyHours: newPage.value.checkFrequencyHours
      },
      method: 'POST'
    })

    if (error) throw error

    showAddPageModal.value = false
    newPage.value = { url: '', title: '', checkFrequencyHours: 72 }
    await loadData()
  } catch (error: any) {
    console.error('Error adding page:', error)
    alert(`Failed to add page: ${error.message}`)
  } finally {
    addingPage.value = false
  }
}

const removePage = async (pageId: string) => {
  if (!confirm('Remove this page from monitoring?')) return

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    await supabase.functions.invoke('manage-freshness?action=remove-page', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { pageId },
      method: 'DELETE'
    })

    await loadData()
  } catch (error: any) {
    console.error('Error removing page:', error)
    alert(`Failed to remove page: ${error.message}`)
  }
}

const triggerFreshnessCheck = async () => {
  const productId = activeProductId.value
  if (!productId) return

  checkingFreshness.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    await supabase.functions.invoke('manage-freshness?action=trigger-check', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { productId },
      method: 'POST'
    })

    alert('Freshness check started! Results will be available shortly.')
  } catch (error: any) {
    console.error('Error triggering check:', error)
    alert(`Failed to start check: ${error.message}`)
  } finally {
    checkingFreshness.value = false
  }
}

const markAlertRead = async (alertId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.functions.invoke('manage-freshness?action=mark-alert-read', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { alertId },
      method: 'PUT'
    })

    await loadData()
  } catch (error) {
    console.error('Error marking alert read:', error)
  }
}

const markAllAlertsRead = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const alertIds = alerts.value.filter(a => !a.is_read).map(a => a.id)
    if (alertIds.length === 0) return

    await supabase.functions.invoke('manage-freshness?action=mark-alert-read', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { alertIds },
      method: 'PUT'
    })

    await loadData()
  } catch (error) {
    console.error('Error marking alerts read:', error)
  }
}

const getPageTitle = (url: string) => {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname === '/' ? urlObj.hostname : urlObj.pathname.split('/').pop() || urlObj.hostname
  } catch {
    return url
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getFreshnessColorClass = (score: number | null) => {
  if (!score) return 'bg-gray-400'
  if (score >= 70) return 'bg-green-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-600'
    case 'high': return 'bg-orange-100 text-orange-600'
    case 'medium': return 'bg-yellow-100 text-yellow-600'
    default: return 'bg-blue-100 text-blue-600'
  }
}

const getSeverityBadgeClass = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-700'
    case 'high': return 'bg-orange-100 text-orange-700'
    case 'medium': return 'bg-yellow-100 text-yellow-700'
    default: return 'bg-blue-100 text-blue-700'
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700'
    case 'error': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}
</script>
