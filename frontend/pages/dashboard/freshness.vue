<template>
  <div>
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <!-- Page header -->
      <div class="px-4 py-6 sm:px-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
              <svg class="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Content Freshness</h1>
              <p class="text-gray-500">Monitor and track your content's freshness for AI visibility.</p>
            </div>
          </div>
          <button
            @click="showAddPageModal = true"
            class="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Page
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="px-4 py-4 sm:px-0">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Average Freshness -->
          <div class="bg-white rounded-xl p-5 border border-gray-200">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-600">Avg Freshness</span>
            </div>
            <div class="text-4xl font-bold text-gray-900 mb-1">{{ stats.avgFreshness }}%</div>
            <div class="text-sm text-gray-400">across all pages</div>
          </div>

          <!-- Monitored Pages -->
          <div class="bg-white rounded-xl p-5 border border-gray-200">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-600">Monitored Pages</span>
            </div>
            <div class="text-4xl font-bold text-gray-900 mb-1">{{ stats.totalPages }}</div>
            <div class="text-sm text-gray-400">being tracked</div>
          </div>

          <!-- Stale Pages -->
          <div class="bg-white rounded-xl p-5 border border-gray-200">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-600">Stale Pages</span>
            </div>
            <div class="text-4xl font-bold text-gray-900 mb-1">{{ stats.stalePages }}</div>
            <div class="text-sm text-gray-400">need attention</div>
          </div>

          <!-- Unread Alerts -->
          <div class="bg-white rounded-xl p-5 border border-gray-200">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-600">Unread Alerts</span>
            </div>
            <div class="text-4xl font-bold text-gray-900 mb-1">{{ stats.unreadAlerts }}</div>
            <div class="text-sm text-gray-400">{{ stats.criticalAlerts }} critical</div>
          </div>
        </div>
      </div>

      <!-- Alerts Section -->
      <div v-if="alerts.length > 0" class="px-4 py-4 sm:px-0">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900">Recent Alerts</h2>
            </div>
            <button
              @click="markAllAlertsRead"
              class="text-sm text-brand hover:underline font-medium"
            >
              Mark all as read
            </button>
          </div>
          <div class="space-y-3">
            <div
              v-for="alert in alerts.slice(0, 5)"
              :key="alert.id"
              class="flex items-start gap-3 p-3 rounded-lg"
              :class="alert.is_read ? 'bg-gray-50' : 'bg-amber-50 border border-amber-200'"
            >
              <div
                class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                :class="getSeverityClass(alert.severity)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 text-sm">{{ alert.title }}</h3>
                <p class="text-xs text-gray-500 mt-0.5">{{ alert.description }}</p>
                <div class="flex items-center gap-2 mt-2">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="getSeverityBadgeClass(alert.severity)"
                  >
                    {{ alert.severity }}
                  </span>
                  <span class="text-xs text-gray-400">{{ formatDate(alert.created_at) }}</span>
                </div>
              </div>
              <button
                v-if="!alert.is_read"
                @click="markAlertRead(alert.id)"
                class="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Monitored Pages -->
      <div class="px-4 py-4 sm:px-0">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900">Monitored Pages</h2>
            </div>
            <button
              @click="triggerFreshnessCheck"
              :disabled="checkingFreshness"
              class="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg class="w-4 h-4" :class="checkingFreshness ? 'animate-spin' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ checkingFreshness ? 'Checking...' : 'Check All' }}
            </button>
          </div>

          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
          </div>

          <div v-else-if="pages.length === 0" class="text-center py-12">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-500 mb-2">No pages being monitored</p>
            <button @click="showAddPageModal = true" class="text-brand font-medium hover:underline text-sm">
              Add your first page →
            </button>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="page in pages"
              :key="page.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-4 flex-1 min-w-0">
                <div
                  class="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  :class="getFreshnessColorClass(page.freshness_score)"
                >
                  {{ page.freshness_score || '?' }}
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-medium text-gray-900 truncate">{{ page.title || page.url }}</h3>
                  <p class="text-sm text-gray-500 truncate">{{ page.url }}</p>
                  <div class="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span v-if="page.last_crawled_at">Last checked: {{ formatDate(page.last_crawled_at) }}</span>
                    <span v-if="page.word_count">{{ page.word_count }} words</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="getStatusBadgeClass(page.status)"
                >
                  {{ page.status }}
                </span>
                <button
                  @click="removePage(page.id)"
                  class="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Page Modal -->
      <div v-if="showAddPageModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Add Page to Monitor</h3>
          <form @submit.prevent="addPage">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Page URL</label>
                <input
                  v-model="newPage.url"
                  type="url"
                  required
                  placeholder="https://example.com/page"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input
                  v-model="newPage.title"
                  type="text"
                  placeholder="Page title"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Check Frequency</label>
                <select
                  v-model="newPage.checkFrequencyHours"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                >
                  <option :value="24">Daily</option>
                  <option :value="72">Every 3 days</option>
                  <option :value="168">Weekly</option>
                </select>
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button
                type="button"
                @click="showAddPageModal = false"
                class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="addingPage"
                class="px-4 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50"
              >
                {{ addingPage ? 'Adding...' : 'Add Page' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

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

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Load all data from edge function in a single GET call
    const { data, error } = await supabase.functions.invoke('manage-freshness?action=dashboard', {
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
  addingPage.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('manage-freshness?action=add-page', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: {
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
  if (!confirm('Are you sure you want to remove this page from monitoring?')) return

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
  checkingFreshness.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    await supabase.functions.invoke('manage-freshness?action=trigger-check', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: {},
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
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-600'
    case 'high': return 'bg-amber-100 text-amber-600'
    case 'medium': return 'bg-yellow-100 text-yellow-600'
    default: return 'bg-blue-100 text-blue-600'
  }
}

const getSeverityBadgeClass = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-700'
    case 'high': return 'bg-amber-100 text-amber-700'
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
