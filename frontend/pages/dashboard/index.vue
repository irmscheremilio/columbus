<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardNav />

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Page header -->
      <div class="px-4 py-6 sm:px-0">
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="mt-2 text-gray-600">Welcome back! Here's your AEO visibility overview.</p>
      </div>

      <!-- Stats Grid -->
      <div class="px-4 py-6 sm:px-0">
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Overall Visibility Score -->
          <div class="card">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="text-4xl font-bold text-primary-600">
                  {{ visibilityScore?.overall || 0 }}
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Visibility Score
                  </dt>
                  <dd class="flex items-baseline">
                    <div
                      class="text-sm font-semibold"
                      :class="visibilityScore?.trend === 'up' ? 'text-green-600' : visibilityScore?.trend === 'down' ? 'text-red-600' : 'text-gray-600'"
                    >
                      {{ visibilityScore?.trend === 'up' ? '↑' : visibilityScore?.trend === 'down' ? '↓' : '−' }}
                      {{ visibilityScore?.percentChange || 0 }}%
                    </div>
                    <div class="ml-2 text-sm text-gray-500">
                      vs last week
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <!-- ChatGPT Score -->
          <div class="card">
            <dt class="text-sm font-medium text-gray-500 mb-2">ChatGPT</dt>
            <dd class="text-3xl font-bold text-gray-900">
              {{ visibilityScore?.byModel?.chatgpt || 0 }}
            </dd>
          </div>

          <!-- Claude Score -->
          <div class="card">
            <dt class="text-sm font-medium text-gray-500 mb-2">Claude</dt>
            <dd class="text-3xl font-bold text-gray-900">
              {{ visibilityScore?.byModel?.claude || 0 }}
            </dd>
          </div>

          <!-- Gemini Score -->
          <div class="card">
            <dt class="text-sm font-medium text-gray-500 mb-2">Gemini</dt>
            <dd class="text-3xl font-bold text-gray-900">
              {{ visibilityScore?.byModel?.gemini || 0 }}
            </dd>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="px-4 py-6 sm:px-0">
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
          <div class="flex flex-wrap gap-3">
            <button class="btn btn-primary" @click="runScan">
              Run New Visibility Scan
            </button>
            <NuxtLink to="/dashboard/recommendations" class="btn btn-outline">
              View Recommendations
            </NuxtLink>
            <NuxtLink to="/dashboard/competitors" class="btn btn-outline">
              Manage Competitors
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Recent Scans -->
      <div class="px-4 py-6 sm:px-0">
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Recent Scans</h2>
          <div v-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
          <div v-else-if="!jobs.length" class="text-center py-8 text-gray-500">
            No scans yet. Run your first visibility scan to get started!
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="job in jobs"
              :key="job.id"
              class="flex items-center justify-between py-3 border-b last:border-b-0"
            >
              <div>
                <div class="font-medium">{{ formatJobType(job.job_type) }}</div>
                <div class="text-sm text-gray-500">
                  {{ formatDate(job.created_at) }}
                </div>
              </div>
              <div>
                <span
                  class="px-3 py-1 rounded-full text-sm font-medium"
                  :class="getStatusClass(job.status)"
                >
                  {{ job.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Recommendations -->
      <div class="px-4 py-6 sm:px-0">
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Top Recommendations</h2>
          <div v-if="!recommendations.length" class="text-center py-8 text-gray-500">
            No recommendations yet. Run a visibility scan to get personalized recommendations.
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="rec in recommendations.slice(0, 3)"
              :key="rec.id"
              class="flex items-start gap-4 py-3 border-b last:border-b-0"
            >
              <div
                class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                :class="getPriorityColor(rec.priority)"
              >
                {{ rec.priority }}
              </div>
              <div class="flex-1">
                <h3 class="font-medium">{{ rec.title }}</h3>
                <p class="text-sm text-gray-600 mt-1">{{ rec.description }}</p>
                <div class="flex items-center gap-3 mt-2">
                  <span class="text-xs px-2 py-1 bg-gray-100 rounded">
                    {{ rec.category }}
                  </span>
                  <span class="text-xs px-2 py-1 bg-gray-100 rounded">
                    Impact: {{ rec.estimated_impact }}
                  </span>
                </div>
              </div>
              <NuxtLink
                :to="`/dashboard/recommendations/${rec.id}`"
                class="btn btn-outline text-sm"
              >
                View Fix
              </NuxtLink>
            </div>
          </div>
          <div v-if="recommendations.length > 0" class="mt-6 text-center">
            <NuxtLink to="/dashboard/recommendations" class="text-primary-600 hover:text-primary-700 font-medium">
              View all recommendations →
            </NuxtLink>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { VisibilityScore } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(true)
const visibilityScore = ref<VisibilityScore | null>(null)
const jobs = ref<any[]>([])
const recommendations = ref<any[]>([])

onMounted(async () => {
  await loadDashboardData()
})

const loadDashboardData = async () => {
  loading.value = true
  try {
    // Load user's organization
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) return

    // Load latest visibility scores
    const { data: scores } = await supabase
      .from('visibility_scores')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .limit(4)

    // Calculate overall score
    if (scores && scores.length > 0) {
      const latestScores = scores.slice(0, 4)
      const overall = Math.round(
        latestScores.reduce((sum, s) => sum + s.score, 0) / latestScores.length
      )

      visibilityScore.value = {
        overall,
        byModel: {
          chatgpt: latestScores.find(s => s.ai_model === 'chatgpt')?.score || 0,
          claude: latestScores.find(s => s.ai_model === 'claude')?.score || 0,
          gemini: latestScores.find(s => s.ai_model === 'gemini')?.score || 0,
          perplexity: latestScores.find(s => s.ai_model === 'perplexity')?.score || 0,
        },
        trend: 'stable',
        percentChange: 0,
      }
    }

    // Load recent jobs
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .limit(5)

    jobs.value = jobsData || []

    // Load top recommendations
    const { data: recsData } = await supabase
      .from('fix_recommendations')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .limit(3)

    recommendations.value = recsData || []
  } catch (error) {
    console.error('Error loading dashboard:', error)
  } finally {
    loading.value = false
  }
}

const runScan = async () => {
  // TODO: Implement scan trigger
  alert('Visibility scan feature coming soon!')
}

const formatJobType = (type: string) => {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'processing':
      return 'bg-blue-100 text-blue-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getPriorityColor = (priority: number) => {
  if (priority >= 4) return 'bg-red-500'
  if (priority >= 3) return 'bg-orange-500'
  return 'bg-yellow-500'
}
</script>
