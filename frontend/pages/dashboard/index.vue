<template>
  <div class="min-h-screen bg-background">
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
          <div class="card-highlight">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="text-4xl font-bold text-brand">
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
          <div class="card-highlight">
            <dt class="text-sm font-medium text-gray-500 mb-2">ChatGPT</dt>
            <dd class="text-3xl font-bold text-gray-900">
              {{ visibilityScore?.byModel?.chatgpt || 0 }}
            </dd>
          </div>

          <!-- Claude Score -->
          <div class="card-highlight">
            <dt class="text-sm font-medium text-gray-500 mb-2">Claude</dt>
            <dd class="text-3xl font-bold text-gray-900">
              {{ visibilityScore?.byModel?.claude || 0 }}
            </dd>
          </div>

          <!-- Gemini Score -->
          <div class="card-highlight">
            <dt class="text-sm font-medium text-gray-500 mb-2">Gemini</dt>
            <dd class="text-3xl font-bold text-gray-900">
              {{ visibilityScore?.byModel?.gemini || 0 }}
            </dd>
          </div>
        </div>
      </div>

      <!-- Granularity Level Performance -->
      <div class="px-4 py-6 sm:px-0">
        <div class="card-highlight">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Visibility by Prompt Granularity</h2>
            <NuxtLink to="/dashboard/prompts" class="text-sm text-brand hover:opacity-80">
              Manage prompts →
            </NuxtLink>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-green-50 rounded-lg p-4 border border-green-200">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-green-800">Level 1 - Broad</span>
                <span class="px-2 py-0.5 bg-green-500 text-white text-xs rounded font-bold">L1</span>
              </div>
              <div class="text-2xl font-bold text-green-900">{{ granularityStats.level1.citationRate }}%</div>
              <div class="text-xs text-green-600 mt-1">
                {{ granularityStats.level1.prompts }} prompts · {{ granularityStats.level1.citations }} citations
              </div>
            </div>
            <div class="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-yellow-800">Level 2 - Specific</span>
                <span class="px-2 py-0.5 bg-yellow-500 text-white text-xs rounded font-bold">L2</span>
              </div>
              <div class="text-2xl font-bold text-yellow-900">{{ granularityStats.level2.citationRate }}%</div>
              <div class="text-xs text-yellow-600 mt-1">
                {{ granularityStats.level2.prompts }} prompts · {{ granularityStats.level2.citations }} citations
              </div>
            </div>
            <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-orange-800">Level 3 - Detailed</span>
                <span class="px-2 py-0.5 bg-orange-500 text-white text-xs rounded font-bold">L3</span>
              </div>
              <div class="text-2xl font-bold text-orange-900">{{ granularityStats.level3.citationRate }}%</div>
              <div class="text-xs text-orange-600 mt-1">
                {{ granularityStats.level3.prompts }} prompts · {{ granularityStats.level3.citations }} citations
              </div>
            </div>
          </div>
          <div v-if="!granularityStats.hasData" class="text-center py-4 text-sm text-gray-500 mt-4">
            No scan data yet. Run a visibility scan to see performance by granularity level.
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="px-4 py-6 sm:px-0">
        <div class="card-highlight">
          <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
          <div class="flex flex-wrap gap-3">
            <button class="btn-primary" @click="runScan">
              Run New Visibility Scan
            </button>
            <NuxtLink to="/dashboard/recommendations" class="btn-outline">
              View Recommendations
            </NuxtLink>
            <NuxtLink to="/dashboard/competitors" class="btn-outline">
              Manage Competitors
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Recent Scans -->
      <div class="px-4 py-6 sm:px-0">
        <div class="card-highlight">
          <h2 class="text-lg font-semibold mb-4">Recent Scans</h2>
          <div v-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
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
        <div class="card-highlight">
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
                class="btn-outline text-sm"
              >
                View Fix
              </NuxtLink>
            </div>
          </div>
          <div v-if="recommendations.length > 0" class="mt-6 text-center">
            <NuxtLink to="/dashboard/recommendations" class="text-brand hover:opacity-80 font-medium">
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
const granularityStats = ref({
  hasData: false,
  level1: { prompts: 0, citations: 0, citationRate: 0 },
  level2: { prompts: 0, citations: 0, citationRate: 0 },
  level3: { prompts: 0, citations: 0, citationRate: 0 }
})

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

    // Load granularity stats
    await loadGranularityStats(userData.organization_id)
  } catch (error) {
    console.error('Error loading dashboard:', error)
  } finally {
    loading.value = false
  }
}

const loadGranularityStats = async (organizationId: string) => {
  try {
    // Get prompts by granularity level
    const { data: prompts } = await supabase
      .from('prompts')
      .select('id, granularity_level')
      .eq('organization_id', organizationId)

    if (!prompts || prompts.length === 0) {
      return
    }

    // Count prompts by level
    const promptsByLevel = prompts.reduce((acc, p) => {
      const level = p.granularity_level || 1
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    // Get prompt results to calculate citation rates
    const promptIds = prompts.map(p => p.id)
    const { data: results } = await supabase
      .from('prompt_results')
      .select('prompt_id, was_mentioned, prompts!inner(granularity_level)')
      .in('prompt_id', promptIds)

    if (results && results.length > 0) {
      // Calculate stats by level
      const statsByLevel: Record<number, { total: number; cited: number }> = {
        1: { total: 0, cited: 0 },
        2: { total: 0, cited: 0 },
        3: { total: 0, cited: 0 }
      }

      results.forEach((r: any) => {
        const level = r.prompts?.granularity_level || 1
        if (statsByLevel[level]) {
          statsByLevel[level].total++
          if (r.was_mentioned) {
            statsByLevel[level].cited++
          }
        }
      })

      granularityStats.value = {
        hasData: true,
        level1: {
          prompts: promptsByLevel[1] || 0,
          citations: statsByLevel[1].cited,
          citationRate: statsByLevel[1].total > 0
            ? Math.round((statsByLevel[1].cited / statsByLevel[1].total) * 100)
            : 0
        },
        level2: {
          prompts: promptsByLevel[2] || 0,
          citations: statsByLevel[2].cited,
          citationRate: statsByLevel[2].total > 0
            ? Math.round((statsByLevel[2].cited / statsByLevel[2].total) * 100)
            : 0
        },
        level3: {
          prompts: promptsByLevel[3] || 0,
          citations: statsByLevel[3].cited,
          citationRate: statsByLevel[3].total > 0
            ? Math.round((statsByLevel[3].cited / statsByLevel[3].total) * 100)
            : 0
        }
      }
    } else {
      // No results yet, just show prompt counts
      granularityStats.value = {
        hasData: false,
        level1: { prompts: promptsByLevel[1] || 0, citations: 0, citationRate: 0 },
        level2: { prompts: promptsByLevel[2] || 0, citations: 0, citationRate: 0 },
        level3: { prompts: promptsByLevel[3] || 0, citations: 0, citationRate: 0 }
      }
    }
  } catch (error) {
    console.error('Error loading granularity stats:', error)
  }
}

const runScan = async () => {
  if (loading.value) return

  loading.value = true
  try {
    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Not authenticated')
    }

    // Call the edge function to trigger the scan
    const { data, error } = await supabase.functions.invoke('trigger-visibility-scan', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })

    if (error) {
      throw error
    }

    // Show success message
    alert(`Visibility scan started! Testing ${data.promptCount} prompts across 4 AI engines. This will take 5-10 minutes. Refresh the page to see results.`)

    // Reload dashboard data to show the new job
    await loadDashboardData()
  } catch (error: any) {
    console.error('Error starting scan:', error)
    alert(`Failed to start scan: ${error.message}`)
  } finally {
    loading.value = false
  }
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
