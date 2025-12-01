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
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
          </svg>
          Get Desktop App
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

        <!-- Platform Cards -->
        <a
          v-for="platform in platforms"
          :key="platform.id"
          :href="platform.website_url"
          target="_blank"
          class="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-200 px-4 py-3 border border-white/50 group hover:border-gray-200"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-50 group-hover:bg-gray-100 transition-colors">
              <img
                :src="platform.logo_url"
                :alt="platform.name"
                class="w-6 h-6 object-contain"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-baseline gap-1.5">
                <span class="text-xl font-bold text-gray-900">{{ visibilityScore?.byModel?.[platform.id] || 0 }}%</span>
              </div>
              <div class="text-[10px] text-gray-500 truncate">Visibility on {{ platform.name }}</div>
            </div>
          </div>
        </a>

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
          <VisibilityChart :product-id="activeProductId" title="Visibility Over Time" @period-change="onPeriodChange" />
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
const selectedPeriodDays = ref(30) // Default to 30 days, synced with chart

// Platform data from database
interface Platform {
  id: string
  name: string
  logo_url: string
  color: string
  description: string
  website_url: string
}
const platforms = ref<Platform[]>([
  // Default fallback data in case DB fetch fails
  { id: 'chatgpt', name: 'ChatGPT', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', color: '#10a37f', description: 'OpenAI\'s conversational AI', website_url: 'https://chat.openai.com' },
  { id: 'claude', name: 'Claude', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg', color: '#d97757', description: 'Anthropic\'s AI assistant', website_url: 'https://claude.ai' },
  { id: 'gemini', name: 'Gemini', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg', color: '#4285f4', description: 'Google\'s AI model', website_url: 'https://gemini.google.com' },
  { id: 'perplexity', name: 'Perplexity', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Perplexity_AI_logo.svg', color: '#20b8cd', description: 'AI search engine', website_url: 'https://perplexity.ai' }
])

const onPeriodChange = (days: number) => {
  selectedPeriodDays.value = days
  // Reload stats with new date range
  if (activeProductId.value) {
    loadVisibilityScore(activeProductId.value)
    loadGranularityStats(activeProductId.value)
    loadModelStats(activeProductId.value)
  }
}

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

const loadVisibilityScore = async (productId: string) => {
  try {
    // Calculate date range based on selected period
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - selectedPeriodDays.value)
    startDate.setHours(0, 0, 0, 0)

    // Get visibility history data within date range
    const { data: historyData } = await supabase
      .from('visibility_history')
      .select('ai_model, prompts_tested, prompts_mentioned')
      .eq('product_id', productId)
      .gte('recorded_at', startDate.toISOString())

    if (!historyData || historyData.length === 0) {
      visibilityScore.value = null
      return
    }

    // Aggregate by platform
    const platformTotals: Record<string, { tested: number; mentioned: number }> = {
      chatgpt: { tested: 0, mentioned: 0 },
      claude: { tested: 0, mentioned: 0 },
      gemini: { tested: 0, mentioned: 0 },
      perplexity: { tested: 0, mentioned: 0 }
    }

    for (const entry of historyData) {
      const platform = entry.ai_model?.toLowerCase()
      if (platformTotals[platform]) {
        platformTotals[platform].tested += entry.prompts_tested || 0
        platformTotals[platform].mentioned += entry.prompts_mentioned || 0
      }
    }

    // Calculate mention rates
    const chatgptRate = platformTotals.chatgpt.tested > 0
      ? Math.round((platformTotals.chatgpt.mentioned / platformTotals.chatgpt.tested) * 100) : 0
    const claudeRate = platformTotals.claude.tested > 0
      ? Math.round((platformTotals.claude.mentioned / platformTotals.claude.tested) * 100) : 0
    const geminiRate = platformTotals.gemini.tested > 0
      ? Math.round((platformTotals.gemini.mentioned / platformTotals.gemini.tested) * 100) : 0
    const perplexityRate = platformTotals.perplexity.tested > 0
      ? Math.round((platformTotals.perplexity.mentioned / platformTotals.perplexity.tested) * 100) : 0

    // Overall = average of all platforms with data
    const totalTested = platformTotals.chatgpt.tested + platformTotals.claude.tested +
      platformTotals.gemini.tested + platformTotals.perplexity.tested
    const totalMentioned = platformTotals.chatgpt.mentioned + platformTotals.claude.mentioned +
      platformTotals.gemini.mentioned + platformTotals.perplexity.mentioned
    const overall = totalTested > 0 ? Math.round((totalMentioned / totalTested) * 100) : 0

    visibilityScore.value = {
      overall,
      byModel: {
        chatgpt: chatgptRate,
        claude: claudeRate,
        gemini: geminiRate,
        perplexity: perplexityRate,
      },
      trend: 'stable',
      percentChange: 0,
    }
  } catch (error) {
    console.error('Error loading visibility score:', error)
  }
}

const loadPlatforms = async () => {
  try {
    const { data } = await supabase
      .from('ai_platforms')
      .select('*')
      .order('id')

    if (data && data.length > 0) {
      platforms.value = data
    }
  } catch (error) {
    console.error('Error loading platforms:', error)
    // Keep default fallback data
  }
}

const loadDashboardData = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    // Load platforms from database
    await loadPlatforms()

    // Load visibility score from history filtered by date range
    await loadVisibilityScore(productId)

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
    // Calculate date range based on selected period
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - selectedPeriodDays.value)
    startDate.setHours(0, 0, 0, 0)

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
    // Filter by date range
    const { data: results } = await supabase
      .from('prompt_results')
      .select('prompt_id, brand_mentioned')
      .in('prompt_id', promptIds)
      .gte('tested_at', startDate.toISOString())

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

      // Calculate average mention rate per granularity level
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
    // Calculate date range based on selected period
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - selectedPeriodDays.value)
    startDate.setHours(0, 0, 0, 0)

    // Filter by date range
    const { data: results } = await supabase
      .from('prompt_results')
      .select('ai_model, brand_mentioned')
      .eq('product_id', productId)
      .gte('tested_at', startDate.toISOString())

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
