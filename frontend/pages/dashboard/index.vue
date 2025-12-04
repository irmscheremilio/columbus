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

      <!-- Average Mention Rate Hero Card -->
      <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
        <div class="px-5 py-4 flex items-center justify-between border-l-4 border-l-brand">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <div class="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Average Mention Rate</div>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-bold text-gray-900">{{ totalMentionRate }}</span>
                <span class="text-lg font-medium text-gray-400">%</span>
              </div>
            </div>
          </div>
          <div class="text-right hidden sm:block">
            <div class="text-xs text-gray-500 mb-0.5">Across all platforms</div>
            <div class="text-xs text-gray-400">Last {{ selectedPeriodDays }} days</div>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Platform Comparison Table -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center gap-2">
            <div class="w-1 h-4 rounded-full bg-brand"></div>
            <div>
              <h2 class="text-sm font-semibold text-gray-900">Platform Comparison</h2>
              <p class="text-[10px] text-gray-500 mt-0.5">Visibility by AI platform</p>
            </div>
          </div>
          <div class="divide-y divide-gray-100/80">
            <a
              v-for="platform in platforms"
              :key="platform.id"
              :href="platform.website_url"
              target="_blank"
              class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors group"
            >
              <div class="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-100 transition-colors">
                <img
                  :src="platform.logo_url"
                  :alt="platform.name"
                  class="w-5 h-5 object-contain"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-medium text-gray-900">{{ platform.name }}</div>
                <div class="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-brand to-amber-400 transition-all duration-500"
                    :style="{ width: `${visibilityScore?.byModel?.[platform.id] || 0}%` }"
                  ></div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-sm font-bold text-gray-900">{{ visibilityScore?.byModel?.[platform.id] || 0 }}%</div>
                <div class="text-[10px] text-gray-400">mention rate</div>
              </div>
            </a>
          </div>
          <div v-if="!platforms.length" class="px-4 py-8 text-center text-sm text-gray-500">
            No platforms configured
          </div>
        </div>

        <!-- Chart Section -->
        <div class="lg:col-span-2">
          <VisibilityChart :product-id="activeProductId" title="Visibility Over Time" @period-change="onPeriodChange" />
        </div>
      </div>

      <!-- Second Row - 3 Column Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Top Performing Prompts -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-emerald-500"></div>
              <div>
                <h2 class="text-sm font-semibold text-gray-900">Top Performing Prompts</h2>
                <p class="text-[10px] text-gray-500 mt-0.5">Highest mention rates</p>
              </div>
            </div>
            <NuxtLink to="/dashboard/prompts" class="text-xs text-brand hover:text-brand/80 font-medium transition-colors">View all →</NuxtLink>
          </div>
          <div v-if="!topPrompts.length" class="text-center py-8 text-sm text-gray-500">
            No prompt data yet
          </div>
          <div v-else class="divide-y divide-gray-100/80">
            <div v-for="(prompt, idx) in topPrompts" :key="prompt.id" class="px-4 py-3 hover:bg-gray-50/50 transition-colors">
              <div class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                     :class="idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-200 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'">
                  {{ idx + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-medium text-gray-900 truncate">{{ prompt.text }}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] text-gray-500">{{ prompt.totalTests }} tests</span>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-sm font-bold text-emerald-600">{{ prompt.mentionRate }}%</div>
                  <div class="text-[10px] text-gray-400">mention rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Competitor Visibility -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-rose-500"></div>
              <div>
                <h2 class="text-sm font-semibold text-gray-900">Competitor Visibility</h2>
                <p class="text-[10px] text-gray-500 mt-0.5">Top mentioned competitors</p>
              </div>
            </div>
            <NuxtLink to="/dashboard/competitors" class="text-xs text-brand hover:text-brand/80 font-medium transition-colors">View all →</NuxtLink>
          </div>
          <div v-if="!topCompetitors.length" class="text-center py-8 text-sm text-gray-500">
            No competitor data yet
          </div>
          <div v-else class="divide-y divide-gray-100/80">
            <div v-for="comp in topCompetitors" :key="comp.id" class="px-4 py-3 hover:bg-gray-50/50 transition-colors">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-medium text-gray-900">{{ comp.name }}</span>
                <span class="text-xs font-semibold" :class="comp.mentionRate > (visibilityScore?.overall || 0) ? 'text-rose-600' : 'text-gray-600'">
                  {{ comp.mentionRate }}%
                </span>
              </div>
              <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500 ease-out"
                  :class="comp.mentionRate > (visibilityScore?.overall || 0) ? 'bg-gradient-to-r from-rose-400 to-rose-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'"
                  :style="{ width: `${Math.min(comp.mentionRate, 100)}%` }"
                ></div>
              </div>
            </div>
          </div>
          <!-- Your Brand Comparison -->
          <div v-if="topCompetitors.length" class="px-4 py-3 bg-brand/5 border-t border-brand/10">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-semibold text-brand">Your Brand</span>
              <span class="text-xs font-bold text-brand">{{ visibilityScore?.overall || 0 }}%</span>
            </div>
            <div class="h-1.5 bg-brand/20 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-brand to-amber-400 transition-all duration-500 ease-out"
                :style="{ width: `${visibilityScore?.overall || 0}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Visibility Gaps -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-violet-500"></div>
              <div>
                <h2 class="text-sm font-semibold text-gray-900">Visibility Gaps</h2>
                <p class="text-[10px] text-gray-500 mt-0.5">Areas needing attention</p>
              </div>
            </div>
            <NuxtLink to="/dashboard/gaps" class="text-xs text-brand hover:text-brand/80 font-medium transition-colors">View all →</NuxtLink>
          </div>
          <div v-if="!visibilityGaps.length" class="text-center py-8 text-sm text-gray-500">
            No gaps identified yet
          </div>
          <div v-else class="divide-y divide-gray-100/80">
            <div v-for="gap in visibilityGaps" :key="gap.id" class="px-4 py-3 hover:bg-gray-50/50 transition-colors">
              <div class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                     :class="gap.severity === 'high' ? 'bg-rose-100' : gap.severity === 'medium' ? 'bg-amber-100' : 'bg-gray-100'">
                  <svg class="w-3.5 h-3.5" :class="gap.severity === 'high' ? 'text-rose-600' : gap.severity === 'medium' ? 'text-amber-600' : 'text-gray-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-medium text-gray-900 line-clamp-2">{{ gap.prompt_text }}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] px-1.5 py-0.5 rounded-full"
                          :class="gap.severity === 'high' ? 'bg-rose-100 text-rose-700' : gap.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'">
                      {{ gap.severity }}
                    </span>
                    <span class="text-[10px] text-gray-500">{{ gap.ai_model }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="grid grid-cols-1 gap-4">
        <!-- Recommendations Table -->
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-amber-500"></div>
              <h2 class="text-sm font-semibold text-gray-900">Top Recommendations</h2>
            </div>
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
const { platforms, loadPlatforms } = useAIPlatforms()
const { selectedRegion } = useRegionFilter()

const loading = ref(true)
const visibilityScore = ref<VisibilityScore | null>(null)
const recommendations = ref<any[]>([])
const topPrompts = ref<any[]>([])
const topCompetitors = ref<any[]>([])
const visibilityGaps = ref<any[]>([])
const selectedPeriodDays = ref(30) // Default to 30 days, synced with chart

const onPeriodChange = async (days: number) => {
  selectedPeriodDays.value = days
  // Reload stats with new date range
  if (activeProductId.value) {
    await loadVisibilityScore(activeProductId.value)
    await Promise.all([
      loadModelStats(activeProductId.value),
      loadTopPrompts(activeProductId.value),
      loadTopCompetitors(activeProductId.value)
    ])
  }
}


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

// Watch for global region filter changes
watch(selectedRegion, () => {
  if (activeProductId.value) {
    loadDashboardData()
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

    // When a region is selected, query prompt_results directly
    // because visibility_history doesn't have region data
    let platformTotals: Record<string, { tested: number; mentioned: number }> = {
      chatgpt: { tested: 0, mentioned: 0 },
      claude: { tested: 0, mentioned: 0 },
      gemini: { tested: 0, mentioned: 0 },
      perplexity: { tested: 0, mentioned: 0 }
    }

    if (selectedRegion.value) {
      // Query prompt_results directly for region-filtered data
      const { data: results } = await supabase
        .from('prompt_results')
        .select('ai_model, brand_mentioned')
        .eq('product_id', productId)
        .gte('tested_at', startDate.toISOString())
        .ilike('request_country', selectedRegion.value)

      if (!results || results.length === 0) {
        visibilityScore.value = null
        return
      }

      // Aggregate by platform
      for (const entry of results) {
        const platform = entry.ai_model?.toLowerCase()
        if (platformTotals[platform]) {
          platformTotals[platform].tested += 1
          if (entry.brand_mentioned) {
            platformTotals[platform].mentioned += 1
          }
        }
      }
    } else {
      // No region filter - use visibility_history for better performance
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
      for (const entry of historyData) {
        const platform = entry.ai_model?.toLowerCase()
        if (platformTotals[platform]) {
          platformTotals[platform].tested += entry.prompts_tested || 0
          platformTotals[platform].mentioned += entry.prompts_mentioned || 0
        }
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

    const { data: recsData } = await supabase
      .from('fix_recommendations')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .limit(5)

    recommendations.value = recsData || []

    // Load new dashboard sections
    await Promise.all([
      loadModelStats(productId),
      loadTopPrompts(productId),
      loadTopCompetitors(productId),
      loadVisibilityGaps(productId)
    ])
  } catch (error) {
    console.error('Error loading dashboard:', error)
  } finally {
    loading.value = false
  }
}

const loadModelStats = async (productId: string) => {
  try {
    // Calculate date range based on selected period
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - selectedPeriodDays.value)
    startDate.setHours(0, 0, 0, 0)

    // Filter by date range and region
    let query = supabase
      .from('prompt_results')
      .select('ai_model, brand_mentioned')
      .eq('product_id', productId)
      .gte('tested_at', startDate.toISOString())

    if (selectedRegion.value) {
      query = query.ilike('request_country', selectedRegion.value)
    }

    const { data: results } = await query

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

const loadTopPrompts = async (productId: string) => {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - selectedPeriodDays.value)
    startDate.setHours(0, 0, 0, 0)

    // Get prompts for this product
    const { data: prompts } = await supabase
      .from('prompts')
      .select('id, prompt_text')
      .eq('product_id', productId)

    if (!prompts || prompts.length === 0) {
      topPrompts.value = []
      return
    }

    const promptIds = prompts.map(p => p.id)

    // Get results for these prompts
    let query = supabase
      .from('prompt_results')
      .select('prompt_id, brand_mentioned')
      .in('prompt_id', promptIds)
      .gte('tested_at', startDate.toISOString())

    if (selectedRegion.value) {
      query = query.ilike('request_country', selectedRegion.value)
    }

    const { data: results } = await query

    if (!results || results.length === 0) {
      topPrompts.value = []
      return
    }

    // Aggregate by prompt
    const promptStats: Record<string, { total: number; mentioned: number }> = {}
    results.forEach((r: any) => {
      if (!promptStats[r.prompt_id]) {
        promptStats[r.prompt_id] = { total: 0, mentioned: 0 }
      }
      promptStats[r.prompt_id].total++
      if (r.brand_mentioned) promptStats[r.prompt_id].mentioned++
    })

    // Calculate rates and sort
    const promptsWithRates = prompts
      .filter(p => promptStats[p.id])
      .map(p => ({
        id: p.id,
        text: p.prompt_text,
        totalTests: promptStats[p.id].total,
        mentionRate: promptStats[p.id].total > 0
          ? Math.round((promptStats[p.id].mentioned / promptStats[p.id].total) * 100)
          : 0
      }))
      .sort((a, b) => b.mentionRate - a.mentionRate)
      .slice(0, 5)

    topPrompts.value = promptsWithRates
  } catch (error) {
    console.error('Error loading top prompts:', error)
    topPrompts.value = []
  }
}

const loadTopCompetitors = async (productId: string) => {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - selectedPeriodDays.value)
    startDate.setHours(0, 0, 0, 0)

    // Get tracking competitors
    const { data: competitors } = await supabase
      .from('competitors')
      .select('id, name')
      .eq('product_id', productId)
      .eq('status', 'tracking')

    if (!competitors || competitors.length === 0) {
      topCompetitors.value = []
      return
    }

    // Get total prompt results count for calculating mention rate
    // Use direct filter on product_id + date instead of fetching all IDs
    let totalResultsQuery = supabase
      .from('prompt_results')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .gte('tested_at', startDate.toISOString())

    if (selectedRegion.value) {
      totalResultsQuery = totalResultsQuery.ilike('request_country', selectedRegion.value)
    }

    const { count: totalResults } = await totalResultsQuery

    if (!totalResults || totalResults === 0) {
      topCompetitors.value = []
      return
    }

    // Get competitor mentions using direct filters with join for region
    // This avoids passing hundreds of IDs in an IN() clause
    let mentionsQuery = supabase
      .from('competitor_mentions')
      .select('competitor_id, prompt_result_id, prompt_results!inner(request_country)')
      .eq('product_id', productId)
      .in('competitor_id', competitors.map(c => c.id))
      .gte('detected_at', startDate.toISOString())

    if (selectedRegion.value) {
      mentionsQuery = mentionsQuery.ilike('prompt_results.request_country', selectedRegion.value)
    }

    const { data: mentions } = await mentionsQuery

    // Calculate mention rate per competitor
    const competitorsWithRates = competitors.map(c => {
      const competitorMentions = (mentions || []).filter(m => m.competitor_id === c.id)
      // Count unique prompt_result_ids (competitor may appear multiple times in same response)
      const uniqueResultIds = new Set(competitorMentions.map(m => m.prompt_result_id).filter(Boolean))
      const mentionRate = Math.round((uniqueResultIds.size / totalResults) * 100)

      return {
        id: c.id,
        name: c.name,
        mentionRate
      }
    })
      .sort((a, b) => b.mentionRate - a.mentionRate)
      .slice(0, 5)

    topCompetitors.value = competitorsWithRates
  } catch (error) {
    console.error('Error loading top competitors:', error)
    topCompetitors.value = []
  }
}

const loadVisibilityGaps = async (productId: string) => {
  try {
    // Get recent high/medium severity gaps with prompt text
    const { data: gaps } = await supabase
      .from('visibility_gaps')
      .select('id, ai_model, severity, detected_at, prompts(prompt_text)')
      .eq('product_id', productId)
      .in('severity', ['high', 'medium'])
      .is('resolved_at', null)
      .order('detected_at', { ascending: false })
      .limit(5)

    // Map to include prompt_text from join
    visibilityGaps.value = (gaps || []).map(gap => ({
      id: gap.id,
      ai_model: gap.ai_model,
      severity: gap.severity,
      prompt_text: (gap.prompts as any)?.prompt_text || 'Unknown prompt'
    }))
  } catch (error) {
    console.error('Error loading visibility gaps:', error)
    visibilityGaps.value = []
  }
}
</script>
