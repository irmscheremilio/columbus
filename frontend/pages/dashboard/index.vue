<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
          <p class="text-sm text-gray-500">AI visibility overview</p>
        </div>
        <NuxtLink
          to="/dashboard/extension"
          class="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg shadow-sm shadow-brand/25 hover:shadow-md hover:shadow-brand/30 hover:bg-brand/95 transition-all duration-200"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Run Scan via Extension
        </NuxtLink>
      </div>

      <!-- Stats Row - Modern Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <!-- Overall Score - Featured -->
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-3 border border-white/50">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Overall</span>
            <span
              v-if="visibilityScore?.trend && visibilityScore?.trend !== 'stable'"
              class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              :class="visibilityScore?.trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'"
            >
              {{ visibilityScore?.trend === 'up' ? '+' : '' }}{{ visibilityScore?.percentChange || 0 }}%
            </span>
          </div>
          <div class="text-2xl font-bold text-gray-900">{{ visibilityScore?.overall || 0 }}<span class="text-sm font-medium text-gray-300 ml-0.5">/100</span></div>
        </div>

        <!-- ChatGPT -->
        <div class="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-3 border border-white/50 group">
          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full bg-[#10a37f]"></div>
            ChatGPT
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-xl font-bold text-gray-900">{{ visibilityScore?.byModel?.chatgpt || 0 }}</span>
            <span v-if="modelStats.chatgpt.mentions" class="text-[10px] text-gray-400 font-medium">{{ modelStats.chatgpt.mentions }} hits</span>
          </div>
        </div>

        <!-- Claude -->
        <div class="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-3 border border-white/50 group">
          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full bg-[#d97757]"></div>
            Claude
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-xl font-bold text-gray-900">{{ visibilityScore?.byModel?.claude || 0 }}</span>
            <span v-if="modelStats.claude.mentions" class="text-[10px] text-gray-400 font-medium">{{ modelStats.claude.mentions }} hits</span>
          </div>
        </div>

        <!-- Gemini -->
        <div class="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-3 border border-white/50 group">
          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full bg-[#4285f4]"></div>
            Gemini
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-xl font-bold text-gray-900">{{ visibilityScore?.byModel?.gemini || 0 }}</span>
            <span v-if="modelStats.gemini.mentions" class="text-[10px] text-gray-400 font-medium">{{ modelStats.gemini.mentions }} hits</span>
          </div>
        </div>

        <!-- Perplexity -->
        <div class="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-3 border border-white/50 group">
          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full bg-[#20b8cd]"></div>
            Perplexity
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-xl font-bold text-gray-900">{{ visibilityScore?.byModel?.perplexity || 0 }}</span>
            <span v-if="modelStats.perplexity.mentions" class="text-[10px] text-gray-400 font-medium">{{ modelStats.perplexity.mentions }} hits</span>
          </div>
        </div>

        <!-- Mention Rate -->
        <div class="bg-gradient-to-br from-brand/5 to-brand/10 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-3 border border-brand/10">
          <div class="text-[11px] font-semibold text-brand/70 uppercase tracking-wider mb-1">Mention Rate</div>
          <div class="text-2xl font-bold text-brand">{{ totalMentionRate }}%</div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Chart Section -->
        <div class="lg:col-span-2">
          <VisibilityChart :product-id="activeProductId" title="Visibility Over Time" />
        </div>

        <!-- Granularity Stats -->
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-900">By Granularity</h2>
            <NuxtLink to="/dashboard/prompts" class="text-xs text-brand hover:text-brand/80 font-medium transition-colors">Manage →</NuxtLink>
          </div>
          <div class="space-y-4">
            <div v-for="(level, idx) in [
              { label: 'Broad', key: 'level1', color: 'bg-gradient-to-r from-emerald-400 to-emerald-500', dotColor: 'bg-emerald-500' },
              { label: 'Specific', key: 'level2', color: 'bg-gradient-to-r from-amber-400 to-amber-500', dotColor: 'bg-amber-500' },
              { label: 'Detailed', key: 'level3', color: 'bg-gradient-to-r from-orange-400 to-orange-500', dotColor: 'bg-orange-500' }
            ]" :key="idx" class="group">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-2">
                  <div :class="level.dotColor" class="w-2 h-2 rounded-full"></div>
                  <span class="text-xs font-medium text-gray-700">{{ level.label }}</span>
                </div>
                <span class="text-xs font-semibold text-gray-900">{{ granularityStats[level.key].citationRate }}%</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  :class="level.color"
                  class="h-full rounded-full transition-all duration-500 ease-out"
                  :style="{ width: `${granularityStats[level.key].citationRate}%` }"
                ></div>
              </div>
            </div>
          </div>
          <div v-if="!granularityStats.hasData" class="mt-4 text-xs text-gray-500 text-center py-3 bg-gray-50/50 rounded-lg border border-gray-100">
            No scan data yet
          </div>
        </div>
      </div>

      <!-- Tables Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-1">
        <!-- Recent Scans Table -->
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent">
            <h2 class="text-sm font-semibold text-gray-900">Recent Scans</h2>
            <div class="w-2 h-2 rounded-full bg-gray-300 animate-pulse"></div>
          </div>
          <div v-if="loading" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-5 w-5 border-2 border-brand border-t-transparent"></div>
          </div>
          <div v-else-if="!jobs.length" class="text-center py-8 text-sm text-gray-500">
            No scans yet
          </div>
          <div v-else class="divide-y divide-gray-100/80">
            <div v-for="job in jobs" :key="job.id" class="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ formatJobType(job.job_type) }}</div>
                  <div class="text-xs text-gray-500">{{ formatDate(job.created_at) }}</div>
                </div>
              </div>
              <span
                class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                :class="getStatusClass(job.status)"
              >
                {{ job.status }}
              </span>
            </div>
          </div>
        </div>

        <!-- Recommendations Table -->
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent">
            <h2 class="text-sm font-semibold text-gray-900">Top Recommendations</h2>
            <NuxtLink v-if="recommendations.length" to="/dashboard/recommendations" class="text-xs text-brand hover:text-brand/80 font-medium transition-colors">View all →</NuxtLink>
          </div>
          <div v-if="!recommendations.length" class="text-center py-8 text-sm text-gray-500">
            No recommendations yet
          </div>
          <div v-else class="divide-y divide-gray-100/80">
            <div v-for="rec in recommendations.slice(0, 5)" :key="rec.id" class="px-4 py-3 hover:bg-gray-50/50 transition-colors">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-900 truncate">{{ rec.title }}</div>
                  <div class="text-xs text-gray-500 mt-0.5">{{ rec.category }}</div>
                </div>
                <span
                  class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
                  :class="rec.estimated_impact === 'high' ? 'bg-brand/10 text-brand' : rec.estimated_impact === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ rec.estimated_impact }}
                </span>
              </div>
            </div>
          </div>
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

const formatJobType = (type: string) => {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-emerald-50 text-emerald-700'
    case 'processing': return 'bg-blue-50 text-blue-700'
    case 'failed': return 'bg-red-50 text-red-700'
    case 'queued': return 'bg-amber-50 text-amber-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}
</script>
