<template>
  <div class="min-h-screen bg-gray-50">
    <div class="p-4 lg:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p class="text-sm text-gray-500">AI visibility overview</p>
        </div>
        <button
          @click="runScan"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-3 py-1.5 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand/90 disabled:opacity-50 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Run Scan
        </button>
      </div>

      <!-- Stats Row - Compact -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        <!-- Overall Score -->
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-medium text-gray-400 uppercase">Overall</span>
            <span
              v-if="visibilityScore?.trend && visibilityScore?.trend !== 'stable'"
              class="text-[10px] font-medium"
              :class="visibilityScore?.trend === 'up' ? 'text-green-600' : 'text-red-600'"
            >
              {{ visibilityScore?.trend === 'up' ? '+' : '' }}{{ visibilityScore?.percentChange || 0 }}%
            </span>
          </div>
          <div class="text-lg font-bold text-gray-900">{{ visibilityScore?.overall || 0 }}<span class="text-xs font-normal text-gray-400">/100</span></div>
        </div>

        <!-- ChatGPT -->
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">ChatGPT</div>
          <div class="flex items-baseline gap-1">
            <span class="text-lg font-bold text-gray-900">{{ visibilityScore?.byModel?.chatgpt || 0 }}</span>
            <span v-if="modelStats.chatgpt.mentions" class="text-[10px] text-gray-400">{{ modelStats.chatgpt.mentions }} mentions</span>
          </div>
        </div>

        <!-- Claude -->
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Claude</div>
          <div class="flex items-baseline gap-1">
            <span class="text-lg font-bold text-gray-900">{{ visibilityScore?.byModel?.claude || 0 }}</span>
            <span v-if="modelStats.claude.mentions" class="text-[10px] text-gray-400">{{ modelStats.claude.mentions }} mentions</span>
          </div>
        </div>

        <!-- Gemini -->
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Gemini</div>
          <div class="flex items-baseline gap-1">
            <span class="text-lg font-bold text-gray-900">{{ visibilityScore?.byModel?.gemini || 0 }}</span>
            <span v-if="modelStats.gemini.mentions" class="text-[10px] text-gray-400">{{ modelStats.gemini.mentions }} mentions</span>
          </div>
        </div>

        <!-- Perplexity -->
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Perplexity</div>
          <div class="flex items-baseline gap-1">
            <span class="text-lg font-bold text-gray-900">{{ visibilityScore?.byModel?.perplexity || 0 }}</span>
            <span v-if="modelStats.perplexity.mentions" class="text-[10px] text-gray-400">{{ modelStats.perplexity.mentions }} mentions</span>
          </div>
        </div>

        <!-- Mention Rate -->
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Mention Rate</div>
          <div class="text-lg font-bold text-brand">{{ totalMentionRate }}%</div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Chart Section -->
        <div class="lg:col-span-2">
          <VisibilityChart :product-id="activeProductId" title="Visibility Over Time" />
        </div>

        <!-- Granularity Stats -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-900">By Granularity</h2>
            <NuxtLink to="/dashboard/prompts" class="text-xs text-brand hover:underline">Manage</NuxtLink>
          </div>
          <div class="space-y-3">
            <div v-for="(level, idx) in [
              { label: 'Broad', key: 'level1', color: 'bg-green-500' },
              { label: 'Specific', key: 'level2', color: 'bg-yellow-500' },
              { label: 'Detailed', key: 'level3', color: 'bg-orange-500' }
            ]" :key="idx" class="flex items-center gap-3">
              <div class="w-16 text-xs text-gray-600">{{ level.label }}</div>
              <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  :class="level.color"
                  class="h-full rounded-full transition-all"
                  :style="{ width: `${granularityStats[level.key].citationRate}%` }"
                ></div>
              </div>
              <div class="w-10 text-xs font-medium text-gray-900 text-right">{{ granularityStats[level.key].citationRate }}%</div>
            </div>
          </div>
          <div v-if="!granularityStats.hasData" class="mt-3 text-xs text-gray-500 text-center py-2 bg-gray-50 rounded">
            No scan data yet
          </div>
        </div>
      </div>

      <!-- Tables Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <!-- Recent Scans Table -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-900">Recent Scans</h2>
          </div>
          <div v-if="loading" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-5 w-5 border-2 border-brand border-t-transparent"></div>
          </div>
          <div v-else-if="!jobs.length" class="text-center py-8 text-sm text-gray-500">
            No scans yet
          </div>
          <table v-else class="w-full">
            <thead>
              <tr class="text-xs text-gray-500 uppercase tracking-wide">
                <th class="text-left px-4 py-2 font-medium">Type</th>
                <th class="text-left px-4 py-2 font-medium">Date</th>
                <th class="text-right px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="job in jobs" :key="job.id" class="text-sm">
                <td class="px-4 py-2.5 text-gray-900">{{ formatJobType(job.job_type) }}</td>
                <td class="px-4 py-2.5 text-gray-500">{{ formatDate(job.created_at) }}</td>
                <td class="px-4 py-2.5 text-right">
                  <span
                    class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                    :class="getStatusClass(job.status)"
                  >
                    {{ job.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Recommendations Table -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-900">Top Recommendations</h2>
            <NuxtLink v-if="recommendations.length" to="/dashboard/recommendations" class="text-xs text-brand hover:underline">View all</NuxtLink>
          </div>
          <div v-if="!recommendations.length" class="text-center py-8 text-sm text-gray-500">
            No recommendations yet
          </div>
          <table v-else class="w-full">
            <thead>
              <tr class="text-xs text-gray-500 uppercase tracking-wide">
                <th class="text-left px-4 py-2 font-medium">Recommendation</th>
                <th class="text-left px-4 py-2 font-medium">Category</th>
                <th class="text-right px-4 py-2 font-medium">Impact</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="rec in recommendations.slice(0, 5)" :key="rec.id" class="text-sm">
                <td class="px-4 py-2.5">
                  <div class="text-gray-900 truncate max-w-xs">{{ rec.title }}</div>
                </td>
                <td class="px-4 py-2.5">
                  <span class="text-gray-500">{{ rec.category }}</span>
                </td>
                <td class="px-4 py-2.5 text-right">
                  <span
                    class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                    :class="rec.estimated_impact === 'high' ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-600'"
                  >
                    {{ rec.estimated_impact }}
                  </span>
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
import type { VisibilityScore } from '~/types'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const supabase = useSupabaseClient()
const { activeProductId, initialized: productInitialized } = useActiveProduct()

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

const modelStats = ref({
  chatgpt: { mentions: 0, total: 0 },
  claude: { mentions: 0, total: 0 },
  gemini: { mentions: 0, total: 0 },
  perplexity: { mentions: 0, total: 0 }
})

const totalMentionRate = computed(() => {
  const stats = modelStats.value
  const totalMentions = stats.chatgpt.mentions + stats.claude.mentions + stats.gemini.mentions + stats.perplexity.mentions
  const totalTests = stats.chatgpt.total + stats.claude.total + stats.gemini.total + stats.perplexity.total
  return totalTests > 0 ? Math.round((totalMentions / totalTests) * 100) : 0
})

watch(activeProductId, async (newProductId) => {
  if (newProductId) {
    await loadDashboardData()
  }
})

onMounted(async () => {
  if (productInitialized.value && activeProductId.value) {
    await loadDashboardData()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadDashboardData()
        unwatch()
      }
    })
  }
})

const loadDashboardData = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const { data: scores } = await supabase
      .from('visibility_scores')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(10)

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

    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(5)

    jobs.value = jobsData || []

    const { data: recsData } = await supabase
      .from('fix_recommendations')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .limit(5)

    recommendations.value = recsData || []

    await loadGranularityStats(productId)
    await loadModelStats(productId)
  } catch (error) {
    console.error('Error loading dashboard:', error)
  } finally {
    loading.value = false
  }
}

const loadGranularityStats = async (productId: string) => {
  try {
    const { data: prompts } = await supabase
      .from('prompts')
      .select('id, granularity_level')
      .eq('product_id', productId)

    if (!prompts || prompts.length === 0) {
      granularityStats.value = {
        hasData: false,
        level1: { prompts: 0, citations: 0, citationRate: 0 },
        level2: { prompts: 0, citations: 0, citationRate: 0 },
        level3: { prompts: 0, citations: 0, citationRate: 0 }
      }
      return
    }

    const promptGranularityMap = prompts.reduce((acc, p) => {
      acc[p.id] = p.granularity_level || 1
      return acc
    }, {} as Record<string, number>)

    const promptsByLevel = prompts.reduce((acc, p) => {
      const level = p.granularity_level || 1
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const promptIds = prompts.map(p => p.id)
    const { data: results } = await supabase
      .from('prompt_results')
      .select('prompt_id, brand_mentioned')
      .in('prompt_id', promptIds)

    if (results && results.length > 0) {
      const statsByLevel: Record<number, { total: number; cited: number }> = {
        1: { total: 0, cited: 0 },
        2: { total: 0, cited: 0 },
        3: { total: 0, cited: 0 }
      }

      results.forEach((r: any) => {
        const level = promptGranularityMap[r.prompt_id] || 1
        if (statsByLevel[level]) {
          statsByLevel[level].total++
          if (r.brand_mentioned) statsByLevel[level].cited++
        }
      })

      granularityStats.value = {
        hasData: true,
        level1: {
          prompts: promptsByLevel[1] || 0,
          citations: statsByLevel[1].cited,
          citationRate: statsByLevel[1].total > 0 ? Math.round((statsByLevel[1].cited / statsByLevel[1].total) * 100) : 0
        },
        level2: {
          prompts: promptsByLevel[2] || 0,
          citations: statsByLevel[2].cited,
          citationRate: statsByLevel[2].total > 0 ? Math.round((statsByLevel[2].cited / statsByLevel[2].total) * 100) : 0
        },
        level3: {
          prompts: promptsByLevel[3] || 0,
          citations: statsByLevel[3].cited,
          citationRate: statsByLevel[3].total > 0 ? Math.round((statsByLevel[3].cited / statsByLevel[3].total) * 100) : 0
        }
      }
    } else {
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

const loadModelStats = async (productId: string) => {
  try {
    const { data: results } = await supabase
      .from('prompt_results')
      .select('ai_model, brand_mentioned')
      .eq('product_id', productId)

    const stats: Record<string, { mentions: number; total: number }> = {
      chatgpt: { mentions: 0, total: 0 },
      claude: { mentions: 0, total: 0 },
      gemini: { mentions: 0, total: 0 },
      perplexity: { mentions: 0, total: 0 }
    }

    if (results && results.length > 0) {
      results.forEach((r: any) => {
        const model = r.ai_model?.toLowerCase()
        if (stats[model]) {
          stats[model].total++
          if (r.brand_mentioned) stats[model].mentions++
        }
      })
    }

    modelStats.value = stats as any
  } catch (error) {
    console.error('Error loading model stats:', error)
  }
}

const runScan = async () => {
  if (loading.value || !activeProductId.value) return
  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('trigger-visibility-scan', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { productId: activeProductId.value }
    })

    if (error) throw error

    // Handle onboarding redirect response
    if (data?.redirectTo) {
      navigateTo(data.redirectTo)
      return
    }

    alert(`Scan started! Testing ${data.promptCount} prompts.`)
    await loadDashboardData()
  } catch (error: any) {
    console.error('Error starting scan:', error)
    // Check if error response contains redirect info
    if (error?.context?.json?.redirectTo) {
      navigateTo(error.context.json.redirectTo)
      return
    }
    alert(`Failed: ${error.message || 'Unknown error'}`)
  } finally {
    loading.value = false
  }
}

const formatJobType = (type: string) => {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-700'
    case 'processing': return 'bg-blue-100 text-blue-700'
    case 'failed': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}
</script>
