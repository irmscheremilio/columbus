<template>
  <div class="min-h-screen bg-gray-50">
    <div class="p-4 lg:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Recommendations</h1>
          <p class="text-sm text-gray-500">AEO improvements to boost visibility</p>
        </div>
        <div class="flex gap-2">
          <button
            class="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
            @click="refreshRecommendations"
            :disabled="loading"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            class="inline-flex items-center gap-2 px-3 py-1.5 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand/90 transition-colors disabled:opacity-50"
            @click="runWebsiteAnalysis"
            :disabled="analyzing"
          >
            <div v-if="analyzing" class="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            {{ analyzing ? 'Analyzing...' : 'New Analysis' }}
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Pending</div>
          <div class="text-lg font-bold text-yellow-600">{{ pendingCount }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">In Progress</div>
          <div class="text-lg font-bold text-blue-600">{{ inProgressCount }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Completed</div>
          <div class="text-lg font-bold text-green-600">{{ completedCount }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">High Impact</div>
          <div class="text-lg font-bold text-brand">{{ highImpactCount }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Pages</div>
          <div class="text-lg font-bold text-gray-900">{{ uniquePages.length }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg border border-gray-200 p-3 mb-4">
        <div class="flex flex-wrap items-center gap-2">
          <select
            v-model="filterStatus"
            class="pl-2 pr-7 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            v-model="filterImpact"
            class="pl-2 pr-7 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">All Impact</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            v-model="filterCategory"
            class="pl-2 pr-7 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">All Categories</option>
            <option value="schema">Schema</option>
            <option value="content">Content</option>
            <option value="technical">Technical</option>
            <option value="authority">Authority</option>
          </select>
          <button
            v-if="filterStatus !== 'all' || filterImpact !== 'all' || filterCategory !== 'all'"
            @click="filterStatus = 'all'; filterImpact = 'all'; filterCategory = 'all'"
            class="px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Clear
          </button>
          <div class="ml-auto text-xs text-gray-500">{{ filteredRecommendations.length }} of {{ recommendations.length }}</div>
        </div>
      </div>

      <!-- Recommendations Table -->
      <div class="bg-white rounded-lg border border-gray-200">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
        </div>
        <div v-else-if="!filteredRecommendations.length" class="text-center py-12 text-sm text-gray-500">
          {{ filterStatus === 'all' && filterCategory === 'all' ? 'No recommendations yet. Run an analysis to get started.' : 'No recommendations match your filters.' }}
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th class="text-left px-4 py-2 font-medium">Recommendation</th>
                <th class="text-left px-4 py-2 font-medium hidden sm:table-cell">Category</th>
                <th class="text-center px-4 py-2 font-medium">Impact</th>
                <th class="text-center px-4 py-2 font-medium hidden md:table-cell">Effort</th>
                <th class="text-center px-4 py-2 font-medium">Status</th>
                <th class="text-right px-4 py-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="rec in filteredRecommendations"
                :key="rec.id"
                class="text-sm hover:bg-gray-50 cursor-pointer"
                @click="$router.push(`/dashboard/recommendations/${rec.id}`)"
              >
                <td class="px-4 py-3">
                  <div class="flex items-start gap-2">
                    <span
                      class="flex-shrink-0 w-6 h-6 rounded text-[10px] font-bold text-white flex items-center justify-center"
                      :class="getPriorityClass(rec.priority)"
                    >
                      {{ rec.priority }}
                    </span>
                    <div class="min-w-0">
                      <div class="text-gray-900 font-medium truncate">{{ rec.title }}</div>
                      <div class="text-xs text-gray-500 truncate mt-0.5">{{ rec.description }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 hidden sm:table-cell">
                  <span class="inline-flex px-1.5 py-0.5 rounded text-xs font-medium" :class="getCategoryClass(rec.category)">
                    {{ formatCategory(rec.category) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-flex px-1.5 py-0.5 rounded text-xs font-medium"
                    :class="rec.estimated_impact === 'high' ? 'bg-brand/10 text-brand' : rec.estimated_impact === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'"
                  >
                    {{ rec.estimated_impact }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center hidden md:table-cell">
                  <span class="text-xs text-gray-500">{{ rec.difficulty }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-flex px-1.5 py-0.5 rounded text-xs font-medium"
                    :class="getStatusClass(rec.status)"
                  >
                    {{ formatStatus(rec.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
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
const analyzing = ref(false)
const recommendations = ref<any[]>([])
const filterStatus = ref('all')
const filterImpact = ref('all')
const filterCategory = ref('all')

const uniquePages = computed(() => {
  const pages = new Set<string>()
  for (const rec of recommendations.value) {
    if (rec.page_url) pages.add(rec.page_url)
  }
  return Array.from(pages)
})

const filteredRecommendations = computed(() => {
  return recommendations.value.filter(rec => {
    if (filterStatus.value !== 'all' && rec.status !== filterStatus.value) return false
    if (filterImpact.value !== 'all' && rec.estimated_impact !== filterImpact.value) return false
    if (filterCategory.value !== 'all' && rec.category !== filterCategory.value) return false
    return true
  })
})

const pendingCount = computed(() => recommendations.value.filter(r => r.status === 'pending').length)
const inProgressCount = computed(() => recommendations.value.filter(r => r.status === 'in_progress').length)
const completedCount = computed(() => recommendations.value.filter(r => r.status === 'completed').length)
const highImpactCount = computed(() => recommendations.value.filter(r => r.estimated_impact === 'high').length)

watch(activeProductId, async (newProductId) => {
  if (newProductId) await loadRecommendations()
})

onMounted(async () => {
  if (productInitialized.value && activeProductId.value) {
    await loadRecommendations()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadRecommendations()
        unwatch()
      }
    })
  }
})

const loadRecommendations = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const { data } = await supabase
      .from('fix_recommendations')
      .select('*')
      .eq('product_id', productId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    recommendations.value = data || []
  } catch (error) {
    console.error('Error loading recommendations:', error)
  } finally {
    loading.value = false
  }
}

const refreshRecommendations = async () => {
  await loadRecommendations()
}

const runWebsiteAnalysis = async () => {
  if (!activeProductId.value) return

  analyzing.value = true
  try {
    const { error } = await supabase.functions.invoke('trigger-website-analysis', {
      body: { productId: activeProductId.value, includeCompetitorGaps: true, multiPageAnalysis: true }
    })

    if (error) throw error
    alert('Website analysis started! Results will appear shortly.')

    setTimeout(async () => {
      await loadRecommendations()
    }, 180000)
  } catch (error: any) {
    console.error('Error running website analysis:', error)
    alert(`Failed to start analysis: ${error.message || 'Unknown error'}`)
  } finally {
    analyzing.value = false
  }
}

const getPriorityClass = (priority: number) => {
  if (priority >= 5) return 'bg-red-500'
  if (priority >= 4) return 'bg-orange-500'
  if (priority >= 3) return 'bg-yellow-500'
  return 'bg-blue-500'
}

const getCategoryClass = (category: string) => {
  switch (category) {
    case 'schema': return 'bg-blue-100 text-blue-700'
    case 'content': return 'bg-green-100 text-green-700'
    case 'technical': return 'bg-orange-100 text-orange-700'
    case 'authority': return 'bg-purple-100 text-purple-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-700'
    case 'in_progress': return 'bg-blue-100 text-blue-700'
    case 'dismissed': return 'bg-gray-100 text-gray-600'
    default: return 'bg-yellow-100 text-yellow-700'
  }
}

const formatCategory = (category: string) => {
  return category?.charAt(0).toUpperCase() + category?.slice(1) || 'Other'
}

const formatStatus = (status: string) => {
  return status?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Pending'
}
</script>
