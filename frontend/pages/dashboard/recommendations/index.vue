<template>
  <div class="min-h-screen bg-background">
    <DashboardNav />

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Fix Recommendations</h1>
            <p class="mt-2 text-gray-600">
              Platform-specific guides to improve your AEO visibility
            </p>
          </div>
          <div class="flex gap-3">
            <button class="btn-outline" @click="refreshRecommendations" :disabled="loading">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button class="btn-primary" @click="runWebsiteAnalysis" :disabled="analyzing">
              <svg v-if="!analyzing" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <div v-else class="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              {{ analyzing ? 'Analyzing...' : 'Run New Analysis' }}
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="card-highlight mb-6">
          <div class="flex flex-wrap gap-4">
            <div>
              <label class="label">Status</label>
              <select v-model="filterStatus" class="input w-40">
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label class="label">Category</label>
              <select v-model="filterCategory" class="input w-40">
                <option value="all">All</option>
                <option value="schema">Schema</option>
                <option value="content">Content</option>
                <option value="technical">Technical</option>
                <option value="authority">Authority</option>
              </select>
            </div>
            <div>
              <label class="label">Impact</label>
              <select v-model="filterImpact" class="input w-40">
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Recommendations List -->
        <div v-if="loading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
        </div>

        <div v-else-if="!filteredRecommendations.length" class="card-highlight text-center py-12">
          <p class="text-gray-500">
            {{ filterStatus === 'all' ? 'No recommendations found. Run a visibility scan to get started!' : 'No recommendations match your filters.' }}
          </p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="rec in filteredRecommendations"
            :key="rec.id"
            class="card-highlight hover:shadow-md transition-shadow cursor-pointer"
            @click="$router.push(`/dashboard/recommendations/${rec.id}`)"
          >
            <div class="flex items-start gap-4">
              <!-- Priority Badge -->
              <div
                class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                :class="getPriorityColor(rec.priority)"
              >
                {{ rec.priority }}
              </div>

              <!-- Content -->
              <div class="flex-1">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900">{{ rec.title }}</h3>
                    <p class="text-gray-600 mt-1">{{ rec.description }}</p>
                  </div>
                  <span
                    class="ml-4 px-3 py-1 rounded-full text-sm font-medium"
                    :class="getStatusClass(rec.status)"
                  >
                    {{ formatStatus(rec.status) }}
                  </span>
                </div>

                <div class="flex items-center gap-4 mt-4">
                  <span class="text-sm px-3 py-1 bg-gray-100 rounded-full">
                    {{ rec.category }}
                  </span>
                  <span
                    class="text-sm px-3 py-1 rounded-full"
                    :class="getImpactClass(rec.estimated_impact)"
                  >
                    Impact: {{ rec.estimated_impact }}
                  </span>
                  <span class="text-sm text-gray-500">
                    {{ formatDate(rec.created_at) }}
                  </span>
                </div>
              </div>

              <!-- Arrow -->
              <div class="flex-shrink-0">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    alert(`Website analysis started! We'll analyze your site and generate fresh recommendations. This typically takes 2-3 minutes. Refresh this page in a few minutes to see your new recommendations.`)

    // Refresh after 3 minutes
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

const getPriorityColor = (priority: number) => {
  if (priority >= 4) return 'bg-red-500'
  if (priority >= 3) return 'bg-orange-500'
  return 'bg-yellow-500'
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'dismissed':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-yellow-100 text-yellow-800'
  }
}

const getImpactClass = (impact: string) => {
  switch (impact) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

const formatStatus = (status: string) => {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
</script>
