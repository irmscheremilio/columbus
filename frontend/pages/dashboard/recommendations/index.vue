<template>
  <div class="min-h-screen bg-gray-50">
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
          <button class="btn btn-primary" @click="refreshRecommendations">
            Refresh
          </button>
        </div>

        <!-- Filters -->
        <div class="card mb-6">
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
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>

        <div v-else-if="!filteredRecommendations.length" class="card text-center py-12">
          <p class="text-gray-500">
            {{ filterStatus === 'all' ? 'No recommendations found. Run a visibility scan to get started!' : 'No recommendations match your filters.' }}
          </p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="rec in filteredRecommendations"
            :key="rec.id"
            class="card hover:shadow-md transition-shadow cursor-pointer"
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
      .from('users')
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
