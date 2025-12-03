<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Recommendations</h1>
          <p class="text-sm text-gray-500">AEO improvements to boost visibility</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="inline-flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-white/50 text-gray-700 text-sm font-medium rounded-xl shadow-sm hover:bg-white hover:shadow-md transition-all duration-200"
            @click="refreshRecommendations"
            :disabled="loading"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            class="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl shadow-sm shadow-brand/25 hover:shadow-md hover:shadow-brand/30 hover:bg-brand/95 transition-all duration-200 disabled:opacity-50"
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

      <!-- Hero Card -->
      <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
        <div class="px-5 py-4 flex items-center justify-between border-l-4 border-l-brand">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <div class="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">High Impact Actions</div>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-bold text-gray-900">{{ highImpactCount }}</span>
                <span class="text-base font-medium text-gray-400">pending</span>
              </div>
            </div>
          </div>
          <div class="hidden sm:flex items-center gap-3">
            <div class="text-center px-3 py-1.5 bg-amber-50 rounded-lg">
              <div class="text-base font-bold text-amber-600">{{ pendingCount }}</div>
              <div class="text-[10px] text-gray-500">Pending</div>
            </div>
            <div class="text-center px-3 py-1.5 bg-blue-50 rounded-lg">
              <div class="text-base font-bold text-blue-600">{{ inProgressCount }}</div>
              <div class="text-[10px] text-gray-500">In Progress</div>
            </div>
            <div class="text-center px-3 py-1.5 bg-emerald-50 rounded-lg">
              <div class="text-base font-bold text-emerald-600">{{ completedCount }}</div>
              <div class="text-[10px] text-emerald-600">Completed</div>
            </div>
            <div class="text-center px-3 py-1.5 bg-gray-50 rounded-lg">
              <div class="text-base font-bold text-gray-900">{{ uniquePages.length }}</div>
              <div class="text-[10px] text-gray-500">Pages</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters Card -->
      <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div class="px-4 py-3 border-b border-gray-100/80 flex items-center gap-2">
          <div class="w-1 h-4 rounded-full bg-violet-500"></div>
          <div>
            <h2 class="text-sm font-semibold text-gray-900">Filters</h2>
            <p class="text-[10px] text-gray-500 mt-0.5">Narrow down recommendations</p>
          </div>
        </div>
        <div class="p-4">
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-1 bg-gray-100/80 rounded-lg p-0.5">
              <button
                v-for="status in statusOptions"
                :key="status.value"
                @click="filterStatus = status.value"
                class="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
                :class="filterStatus === status.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              >
                {{ status.label }}
              </button>
            </div>
            <div class="flex items-center gap-1 bg-gray-100/80 rounded-lg p-0.5">
              <button
                v-for="impact in impactOptions"
                :key="impact.value"
                @click="filterImpact = impact.value"
                class="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
                :class="filterImpact === impact.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              >
                {{ impact.label }}
              </button>
            </div>
            <div class="flex items-center gap-1 bg-gray-100/80 rounded-lg p-0.5">
              <button
                v-for="cat in categoryOptions"
                :key="cat.value"
                @click="filterCategory = cat.value"
                class="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
                :class="filterCategory === cat.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              >
                {{ cat.label }}
              </button>
            </div>
            <div class="ml-auto text-xs text-gray-500 bg-gray-100/80 px-2 py-1 rounded-md">
              {{ filteredRecommendations.length }} of {{ recommendations.length }}
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations Table -->
      <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-1 h-4 rounded-full bg-brand"></div>
            <div>
              <h2 class="text-sm font-semibold text-gray-900">All Recommendations</h2>
              <p class="text-[10px] text-gray-500 mt-0.5">Click to view details and implementation steps</p>
            </div>
          </div>
        </div>
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
        </div>
        <div v-else-if="!filteredRecommendations.length" class="text-center py-12">
          <div class="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p class="text-sm text-gray-500">
            {{ filterStatus === 'all' && filterCategory === 'all' ? 'No recommendations yet. Run an analysis to get started.' : 'No recommendations match your filters.' }}
          </p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100/80">
                <th class="text-left px-4 py-3 font-medium">Recommendation</th>
                <th class="text-left px-4 py-3 font-medium hidden sm:table-cell">Category</th>
                <th class="text-center px-4 py-3 font-medium">Impact</th>
                <th class="text-center px-4 py-3 font-medium hidden md:table-cell">Effort</th>
                <th class="text-center px-4 py-3 font-medium">Status</th>
                <th class="text-right px-4 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100/80">
              <tr
                v-for="rec in filteredRecommendations"
                :key="rec.id"
                class="text-sm hover:bg-gray-50/80 cursor-pointer transition-colors"
                @click="$router.push(`/dashboard/recommendations/${rec.id}`)"
              >
                <td class="px-4 py-3">
                  <div class="flex items-start gap-3">
                    <span
                      class="flex-shrink-0 w-7 h-7 rounded-lg text-xs font-bold text-white flex items-center justify-center shadow-sm"
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
                  <span class="inline-flex px-2 py-0.5 rounded-md text-xs font-medium" :class="getCategoryClass(rec.category)">
                    {{ formatCategory(rec.category) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-md text-xs font-medium"
                    :class="rec.estimated_impact === 'high' ? 'bg-brand/10 text-brand' : rec.estimated_impact === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'"
                  >
                    {{ rec.estimated_impact }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center hidden md:table-cell">
                  <span class="text-xs text-gray-500">{{ rec.difficulty }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-md text-xs font-medium"
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

      <!-- Category Breakdown -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="cat in categoryStats"
          :key="cat.name"
          class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200"
        >
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="cat.bgClass">
                <svg class="w-4 h-4" :class="cat.iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="cat.icon" />
                </svg>
              </div>
              <span class="font-semibold text-sm text-gray-900">{{ cat.label }}</span>
            </div>
            <span class="text-lg font-bold text-gray-900">{{ cat.count }}</span>
          </div>
          <div class="p-4">
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="text-gray-500">Completion</span>
              <span class="font-semibold text-gray-700">{{ cat.completedPercent }}%</span>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="cat.barClass"
                :style="{ width: `${cat.completedPercent}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between mt-2 text-[10px] text-gray-400">
              <span>{{ cat.completed }} completed</span>
              <span>{{ cat.pending }} pending</span>
            </div>
          </div>
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

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' }
]

const impactOptions = [
  { value: 'all', label: 'All Impact' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
]

const categoryOptions = [
  { value: 'all', label: 'All' },
  { value: 'schema', label: 'Schema' },
  { value: 'content', label: 'Content' },
  { value: 'technical', label: 'Technical' },
  { value: 'authority', label: 'Authority' }
]

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
const highImpactCount = computed(() => recommendations.value.filter(r => r.estimated_impact === 'high' && r.status !== 'completed').length)

const categoryStats = computed(() => {
  const categories = [
    { name: 'schema', label: 'Schema', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', bgClass: 'bg-blue-100', iconClass: 'text-blue-600', barClass: 'bg-blue-500' },
    { name: 'content', label: 'Content', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', bgClass: 'bg-emerald-100', iconClass: 'text-emerald-600', barClass: 'bg-emerald-500' },
    { name: 'technical', label: 'Technical', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', bgClass: 'bg-orange-100', iconClass: 'text-orange-600', barClass: 'bg-orange-500' },
    { name: 'authority', label: 'Authority', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', bgClass: 'bg-violet-100', iconClass: 'text-violet-600', barClass: 'bg-violet-500' }
  ]

  return categories.map(cat => {
    const catRecs = recommendations.value.filter(r => r.category === cat.name)
    const completed = catRecs.filter(r => r.status === 'completed').length
    const pending = catRecs.filter(r => r.status !== 'completed').length
    return {
      ...cat,
      count: catRecs.length,
      completed,
      pending,
      completedPercent: catRecs.length > 0 ? Math.round((completed / catRecs.length) * 100) : 0
    }
  })
})

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
  if (priority >= 5) return 'bg-gradient-to-br from-red-500 to-red-600'
  if (priority >= 4) return 'bg-gradient-to-br from-orange-500 to-orange-600'
  if (priority >= 3) return 'bg-gradient-to-br from-amber-500 to-amber-600'
  return 'bg-gradient-to-br from-blue-500 to-blue-600'
}

const getCategoryClass = (category: string) => {
  switch (category) {
    case 'schema': return 'bg-blue-100 text-blue-700'
    case 'content': return 'bg-emerald-100 text-emerald-700'
    case 'technical': return 'bg-orange-100 text-orange-700'
    case 'authority': return 'bg-violet-100 text-violet-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-emerald-100 text-emerald-700'
    case 'in_progress': return 'bg-blue-100 text-blue-700'
    case 'dismissed': return 'bg-gray-100 text-gray-600'
    default: return 'bg-amber-100 text-amber-700'
  }
}

const formatCategory = (category: string) => {
  return category?.charAt(0).toUpperCase() + category?.slice(1) || 'Other'
}

const formatStatus = (status: string) => {
  return status?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Pending'
}
</script>
