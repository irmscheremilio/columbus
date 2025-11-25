<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardNav />

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Page Header -->
        <div class="flex justify-between items-start mb-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
              <svg class="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Fix Recommendations</h1>
              <p class="text-gray-500">Platform-specific guides to improve your AEO visibility</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              @click="refreshRecommendations"
              :disabled="loading"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              class="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
              @click="runWebsiteAnalysis"
              :disabled="analyzing"
            >
              <svg v-if="!analyzing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <div v-else class="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              {{ analyzing ? 'Analyzing...' : 'Run New Analysis' }}
            </button>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ pendingCount }}</div>
            <div class="text-sm text-gray-500">Pending</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ inProgressCount }}</div>
            <div class="text-sm text-gray-500">In Progress</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ completedCount }}</div>
            <div class="text-sm text-gray-500">Completed</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ highImpactCount }}</div>
            <div class="text-sm text-gray-500">High Impact</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div class="flex flex-wrap gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select v-model="filterStatus" class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select v-model="filterCategory" class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                <option value="all">All Categories</option>
                <option value="schema">Schema</option>
                <option value="content">Content</option>
                <option value="technical">Technical</option>
                <option value="authority">Authority</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Impact</label>
              <select v-model="filterImpact" class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                <option value="all">All Impact</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Recommendations List -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
        </div>

        <div v-else-if="!filteredRecommendations.length" class="bg-white rounded-xl border border-gray-200 text-center py-12">
          <p class="text-gray-500 mb-1">
            {{ filterStatus === 'all' ? 'No recommendations found' : 'No recommendations match your filters' }}
          </p>
          <p class="text-sm text-gray-400">
            {{ filterStatus === 'all' ? 'Run a visibility scan to get personalized recommendations' : 'Try adjusting your filters' }}
          </p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="rec in filteredRecommendations"
            :key="rec.id"
            class="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer"
            @click="$router.push(`/dashboard/recommendations/${rec.id}`)"
          >
            <div class="flex items-start gap-4">
              <!-- Priority Badge -->
              <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand text-white flex items-center justify-center font-bold text-sm">
                P{{ rec.priority }}
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-4">
                  <h3 class="font-semibold text-gray-900">{{ rec.title }}</h3>
                  <span
                    class="flex-shrink-0 px-2 py-1 rounded text-xs font-medium"
                    :class="getStatusClass(rec.status)"
                  >
                    {{ formatStatus(rec.status) }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ rec.description }}</p>

                <div class="flex items-center flex-wrap gap-2 mt-3">
                  <span class="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                    {{ rec.category }}
                  </span>
                  <span
                    class="px-2 py-0.5 text-xs font-medium rounded"
                    :class="rec.estimated_impact === 'high' ? 'bg-brand/10 text-brand' : 'bg-gray-200 text-gray-600'"
                  >
                    {{ rec.estimated_impact }} impact
                  </span>
                  <span class="text-xs text-gray-400">
                    {{ formatDate(rec.created_at) }}
                  </span>
                </div>
              </div>

              <!-- Arrow -->
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(true)
const analyzing = ref(false)
const recommendations = ref<any[]>([])
const filterStatus = ref('all')
const filterCategory = ref('all')
const filterImpact = ref('all')

const filteredRecommendations = computed(() => {
  return recommendations.value.filter(rec => {
    if (filterStatus.value !== 'all' && rec.status !== filterStatus.value) return false
    if (filterCategory.value !== 'all' && rec.category !== filterCategory.value) return false
    if (filterImpact.value !== 'all' && rec.estimated_impact !== filterImpact.value) return false
    return true
  })
})

const pendingCount = computed(() => recommendations.value.filter(r => r.status === 'pending').length)
const inProgressCount = computed(() => recommendations.value.filter(r => r.status === 'in_progress').length)
const completedCount = computed(() => recommendations.value.filter(r => r.status === 'completed').length)
const highImpactCount = computed(() => recommendations.value.filter(r => r.estimated_impact === 'high').length)

onMounted(async () => {
  await loadRecommendations()
})

const loadRecommendations = async () => {
  loading.value = true
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) return

    const { data } = await supabase
      .from('fix_recommendations')
      .select('*')
      .eq('organization_id', userData.organization_id)
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
  analyzing.value = true
  try {
    const { data, error } = await supabase.functions.invoke('trigger-website-analysis', {
      body: { includeCompetitorGaps: true }
    })

    if (error) throw error

    alert(`Website analysis started! We'll analyze your site and generate fresh recommendations.`)

    setTimeout(async () => {
      await loadRecommendations()
    }, 180000)
  } catch (error: any) {
    console.error('Error running website analysis:', error)
    alert(`Failed to start website analysis: ${error.message || 'Unknown error'}`)
  } finally {
    analyzing.value = false
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-700'
    case 'in_progress': return 'bg-blue-100 text-blue-700'
    case 'dismissed': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

const formatStatus = (status: string) => {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>
