<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/dashboard/competitors"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </NuxtLink>
          <div>
            <h1 class="text-xl font-semibold text-gray-900 tracking-tight">{{ competitor?.name || 'Competitor' }}</h1>
            <p class="text-sm text-gray-500">{{ competitor?.domain || 'Competitor analysis' }}</p>
          </div>
        </div>
        <button
          @click="removeCompetitor"
          class="inline-flex items-center gap-2 px-3 py-1.5 text-red-600 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Stop Tracking
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
      </div>

      <template v-else-if="competitor">
        <!-- Comparison Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Your Brand Stats -->
          <div class="bg-brand/5 backdrop-blur-sm rounded-xl shadow-sm border border-brand/20 px-4 py-3">
            <div class="text-[10px] font-medium text-brand uppercase tracking-wide">Your Mention Rate</div>
            <div class="text-2xl font-bold text-brand">{{ brandMetrics.mentionRate }}%</div>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
            <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{{ competitor.name }} Rate</div>
            <div class="text-2xl font-bold" :class="getComparisonColor(competitorMetrics.mentionRate, brandMetrics.mentionRate)">
              {{ competitorMetrics.mentionRate }}%
            </div>
          </div>
          <div class="bg-brand/5 backdrop-blur-sm rounded-xl shadow-sm border border-brand/20 px-4 py-3">
            <div class="text-[10px] font-medium text-brand uppercase tracking-wide">Your Avg Position</div>
            <div class="text-2xl font-bold text-brand">{{ brandMetrics.avgPosition ? `#${brandMetrics.avgPosition}` : '-' }}</div>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
            <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{{ competitor.name }} Position</div>
            <div class="text-2xl font-bold" :class="getPositionComparisonColor(competitorMetrics.avgPosition, brandMetrics.avgPosition)">
              {{ competitorMetrics.avgPosition ? `#${competitorMetrics.avgPosition}` : '-' }}
            </div>
          </div>
        </div>

        <!-- Head to Head Summary -->
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4">
          <h2 class="text-sm font-semibold text-gray-900 mb-4">Head to Head Comparison</h2>
          <div class="space-y-4">
            <!-- Mention Rate Bar -->
            <div>
              <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Mention Rate</span>
                <span>{{ brandMetrics.mentionRate }}% vs {{ competitorMetrics.mentionRate }}%</span>
              </div>
              <div class="flex h-3 rounded-full overflow-hidden bg-gray-100">
                <div
                  class="bg-brand transition-all duration-500"
                  :style="{ width: `${getBarWidth(brandMetrics.mentionRate, competitorMetrics.mentionRate)}%` }"
                ></div>
                <div
                  class="bg-red-400 transition-all duration-500"
                  :style="{ width: `${getBarWidth(competitorMetrics.mentionRate, brandMetrics.mentionRate)}%` }"
                ></div>
              </div>
              <div class="flex justify-between text-[10px] mt-1">
                <span class="text-brand font-medium">Your Brand</span>
                <span class="text-red-500 font-medium">{{ competitor.name }}</span>
              </div>
            </div>

            <!-- Citation Rate Bar -->
            <div>
              <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Citation Rate</span>
                <span>{{ brandMetrics.citationRate }}% vs {{ competitorMetrics.citationRate || 0 }}%</span>
              </div>
              <div class="flex h-3 rounded-full overflow-hidden bg-gray-100">
                <div
                  class="bg-brand transition-all duration-500"
                  :style="{ width: `${getBarWidth(brandMetrics.citationRate, competitorMetrics.citationRate || 0)}%` }"
                ></div>
                <div
                  class="bg-red-400 transition-all duration-500"
                  :style="{ width: `${getBarWidth(competitorMetrics.citationRate || 0, brandMetrics.citationRate)}%` }"
                ></div>
              </div>
              <div class="flex justify-between text-[10px] mt-1">
                <span class="text-brand font-medium">Your Brand</span>
                <span class="text-red-500 font-medium">{{ competitor.name }}</span>
              </div>
            </div>

            <!-- Position Comparison -->
            <div v-if="brandMetrics.avgPosition && competitorMetrics.avgPosition">
              <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Average Position (lower is better)</span>
                <span>#{{ brandMetrics.avgPosition }} vs #{{ competitorMetrics.avgPosition }}</span>
              </div>
              <div class="flex items-center gap-4">
                <div class="flex-1 text-center py-2 rounded-lg" :class="brandMetrics.avgPosition <= competitorMetrics.avgPosition ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'">
                  <div class="text-lg font-bold" :class="brandMetrics.avgPosition <= competitorMetrics.avgPosition ? 'text-emerald-600' : 'text-gray-600'">#{{ brandMetrics.avgPosition }}</div>
                  <div class="text-[10px] text-gray-500">Your Brand</div>
                </div>
                <div class="text-gray-400">vs</div>
                <div class="flex-1 text-center py-2 rounded-lg" :class="competitorMetrics.avgPosition < brandMetrics.avgPosition ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'">
                  <div class="text-lg font-bold" :class="competitorMetrics.avgPosition < brandMetrics.avgPosition ? 'text-red-600' : 'text-gray-600'">#{{ competitorMetrics.avgPosition }}</div>
                  <div class="text-[10px] text-gray-500">{{ competitor.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Trend Comparison Chart -->
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-900">Trend Comparison</h2>
            <div class="flex items-center gap-2">
              <select
                v-model="chartMetric"
                class="text-xs bg-gray-100 border-0 rounded-lg pl-2 pr-6 py-1.5 text-gray-600 cursor-pointer focus:ring-1 focus:ring-brand/30"
              >
                <option value="mention_rate">Mention Rate</option>
                <option value="position">Avg Position</option>
              </select>
              <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  v-for="period in periods"
                  :key="period.value"
                  @click="chartPeriod = period.value"
                  class="px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200"
                  :class="chartPeriod === period.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                >
                  {{ period.label }}
                </button>
              </div>
            </div>
          </div>
          <div class="relative h-64">
            <div v-if="chartLoading" class="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
              <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
            </div>
            <canvas ref="trendChartCanvas"></canvas>
          </div>
          <!-- Legend -->
          <div class="flex justify-center gap-6 mt-3 pt-3 border-t border-gray-100">
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-full bg-brand"></div>
              <span class="text-xs text-gray-700 font-medium">Your Brand</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-full bg-red-400"></div>
              <span class="text-xs text-gray-500">{{ competitor.name }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Mentions -->
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/50 to-transparent">
            <h2 class="text-sm font-semibold text-gray-900">Recent Competitor Mentions</h2>
          </div>
          <div v-if="recentMentions.length === 0" class="text-center py-8 text-sm text-gray-500">
            No recent mentions found
          </div>
          <div v-else class="divide-y divide-gray-100/80">
            <div
              v-for="mention in recentMentions"
              :key="mention.id"
              class="px-4 py-3"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {{ formatModel(mention.ai_model) }}
                    </span>
                    <span v-if="mention.position" class="text-xs text-gray-500">
                      Position #{{ mention.position }}
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded" :class="getSentimentClass(mention.sentiment)">
                      {{ mention.sentiment }}
                    </span>
                  </div>
                  <p v-if="mention.mention_context" class="text-sm text-gray-600 line-clamp-2">
                    "{{ mention.mention_context }}"
                  </p>
                </div>
                <div class="text-xs text-gray-400 flex-shrink-0">
                  {{ formatDate(mention.detected_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Not Found -->
      <div v-else class="text-center py-20">
        <p class="text-gray-500">Competitor not found</p>
        <NuxtLink to="/dashboard/competitors" class="text-brand hover:underline text-sm mt-2 inline-block">
          Back to competitors
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Chart from 'chart.js/auto'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const { activeProductId, initialized: productInitialized } = useActiveProduct()

const competitorId = route.params.id as string

const loading = ref(true)
const chartLoading = ref(false)
const competitor = ref<any>(null)
const recentMentions = ref<any[]>([])

const trendChartCanvas = ref<HTMLCanvasElement | null>(null)
const chartMetric = ref<'mention_rate' | 'position'>('mention_rate')
const chartPeriod = ref('30')
let trendChart: Chart | null = null

const periods = [
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' }
]

// Metrics
const brandMetrics = ref({
  mentionRate: 0,
  citationRate: 0,
  avgPosition: null as number | null
})

const competitorMetrics = ref({
  mentionRate: 0,
  citationRate: null as number | null,
  avgPosition: null as number | null
})

watch([chartMetric, chartPeriod], () => {
  loadChartData()
})

onMounted(async () => {
  if (productInitialized.value && activeProductId.value) {
    await loadCompetitor()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadCompetitor()
        unwatch()
      }
    })
  }
})

onUnmounted(() => {
  if (trendChart) {
    trendChart.destroy()
  }
})

const loadCompetitor = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    // Load competitor
    const { data } = await supabase
      .from('competitors')
      .select('*')
      .eq('id', competitorId)
      .eq('product_id', productId)
      .single()

    if (!data) {
      competitor.value = null
      return
    }

    competitor.value = data

    // Load metrics (but not chart yet - canvas not ready)
    await Promise.all([
      loadBrandMetrics(productId),
      loadCompetitorMetrics(),
      loadRecentMentions()
    ])
  } catch (error) {
    console.error('Error loading competitor:', error)
  } finally {
    loading.value = false
    // Load chart after loading is done and DOM is updated
    await nextTick()
    await loadChartData()
  }
}

const loadBrandMetrics = async (productId: string) => {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const { data: results } = await supabase
    .from('prompt_results')
    .select('brand_mentioned, citation_present, position')
    .eq('product_id', productId)
    .gte('tested_at', startDate.toISOString())

  if (results && results.length > 0) {
    const mentioned = results.filter(r => r.brand_mentioned).length
    brandMetrics.value.mentionRate = Math.round((mentioned / results.length) * 100)

    const cited = results.filter(r => r.citation_present).length
    brandMetrics.value.citationRate = Math.round((cited / results.length) * 100)

    const positions = results.filter(r => r.position !== null).map(r => r.position as number)
    brandMetrics.value.avgPosition = positions.length > 0
      ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
      : null
  }
}

const loadCompetitorMetrics = async () => {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  // Load competitor mentions
  const { data: mentions } = await supabase
    .from('competitor_mentions')
    .select('position, sentiment')
    .eq('competitor_id', competitorId)
    .gte('detected_at', startDate.toISOString())

  // Load total prompt results count
  const { data: promptResults } = await supabase
    .from('prompt_results')
    .select('id')
    .eq('product_id', activeProductId.value)
    .gte('tested_at', startDate.toISOString())

  const totalResults = promptResults?.length || 0
  const mentionCount = mentions?.length || 0

  competitorMetrics.value.mentionRate = totalResults > 0
    ? Math.round((mentionCount / totalResults) * 100)
    : 0

  const positions = (mentions || []).filter(m => m.position !== null).map(m => m.position as number)
  competitorMetrics.value.avgPosition = positions.length > 0
    ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
    : null
}

const loadRecentMentions = async () => {
  const { data } = await supabase
    .from('competitor_mentions')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('detected_at', { ascending: false })
    .limit(10)

  recentMentions.value = data || []
}

const loadChartData = async () => {
  const productId = activeProductId.value
  if (!productId || !competitor.value) return

  chartLoading.value = true

  try {
    const daysAgo = parseInt(chartPeriod.value)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Load brand data
    const { data: brandResults } = await supabase
      .from('prompt_results')
      .select('tested_at, brand_mentioned, position')
      .eq('product_id', productId)
      .gte('tested_at', startDate.toISOString())
      .order('tested_at', { ascending: true })

    // Load competitor mentions
    const { data: competitorMentions } = await supabase
      .from('competitor_mentions')
      .select('detected_at, position')
      .eq('competitor_id', competitorId)
      .gte('detected_at', startDate.toISOString())
      .order('detected_at', { ascending: true })

    // Generate labels and group by day
    const labels: string[] = []
    const dayMap = new Map<string, { brandResults: any[], competitorMentions: any[] }>()

    for (let i = 0; i < daysAgo; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      labels.push(dateKey)
      dayMap.set(dateKey, { brandResults: [], competitorMentions: [] })
    }

    // Group data
    for (const result of brandResults || []) {
      const dateKey = new Date(result.tested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const day = dayMap.get(dateKey)
      if (day) day.brandResults.push(result)
    }

    for (const mention of competitorMentions || []) {
      const dateKey = new Date(mention.detected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const day = dayMap.get(dateKey)
      if (day) day.competitorMentions.push(mention)
    }

    // Calculate metrics
    const brandData: (number | null)[] = []
    const competitorData: (number | null)[] = []

    for (const label of labels) {
      const day = dayMap.get(label)!
      const totalResults = day.brandResults.length

      if (chartMetric.value === 'mention_rate') {
        if (totalResults > 0) {
          const mentioned = day.brandResults.filter(r => r.brand_mentioned).length
          brandData.push(Math.round((mentioned / totalResults) * 100))
          competitorData.push(Math.round((day.competitorMentions.length / totalResults) * 100))
        } else {
          brandData.push(null)
          competitorData.push(null)
        }
      } else {
        // Position
        const brandPositions = day.brandResults.filter(r => r.position !== null).map(r => r.position as number)
        if (brandPositions.length > 0) {
          brandData.push(Math.round((brandPositions.reduce((a, b) => a + b, 0) / brandPositions.length) * 10) / 10)
        } else {
          brandData.push(null)
        }

        const compPositions = day.competitorMentions.filter(m => m.position !== null).map(m => m.position as number)
        if (compPositions.length > 0) {
          competitorData.push(Math.round((compPositions.reduce((a, b) => a + b, 0) / compPositions.length) * 10) / 10)
        } else {
          competitorData.push(null)
        }
      }
    }

    await nextTick()
    renderChart(labels, brandData, competitorData)
  } catch (error) {
    console.error('Error loading chart data:', error)
  } finally {
    chartLoading.value = false
  }
}

const renderChart = (labels: string[], brandData: (number | null)[], competitorData: (number | null)[]) => {
  if (!trendChartCanvas.value) return

  if (trendChart) {
    trendChart.destroy()
  }

  const ctx = trendChartCanvas.value.getContext('2d')
  if (!ctx) return

  const isPositionMetric = chartMetric.value === 'position'

  const datasets = [
    {
      label: 'Your Brand',
      data: brandData,
      borderColor: '#6366f1',
      backgroundColor: '#6366f120',
      borderWidth: 2.5,
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#6366f1',
      spanGaps: true
    },
    {
      label: competitor.value?.name || 'Competitor',
      data: competitorData,
      borderColor: '#f87171',
      backgroundColor: '#f8717120',
      borderWidth: 2.5,
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#f87171',
      spanGaps: true
    }
  ]

  let maxValue = isPositionMetric ? 10 : 100
  if (isPositionMetric) {
    const allValues = [
      ...brandData.filter(v => v !== null) as number[],
      ...competitorData.filter(v => v !== null) as number[]
    ]
    if (allValues.length > 0) {
      maxValue = Math.max(10, Math.ceil(Math.max(...allValues) / 5) * 5)
    }
  }

  trendChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y
              if (value === null) return `${context.dataset.label}: No data`
              if (isPositionMetric) return `${context.dataset.label}: #${value}`
              return `${context.dataset.label}: ${value}%`
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#9ca3af', maxRotation: 0 }
        },
        y: {
          min: isPositionMetric ? 1 : 0,
          max: maxValue,
          reverse: isPositionMetric,
          grid: { color: '#f3f4f6' },
          ticks: {
            font: { size: 10 },
            color: '#9ca3af',
            callback: (v) => isPositionMetric ? `#${v}` : `${v}%`
          }
        }
      }
    }
  })
}

const removeCompetitor = async () => {
  if (!competitor.value) return
  if (!confirm(`Stop tracking ${competitor.value.name}?`)) return

  try {
    await supabase
      .from('competitors')
      .delete()
      .eq('id', competitorId)

    router.push('/dashboard/competitors')
  } catch (error) {
    console.error('Error removing competitor:', error)
    alert('Failed to remove competitor')
  }
}

const getComparisonColor = (competitorRate: number, brandRate: number) => {
  if (competitorRate > brandRate) return 'text-red-600'
  if (competitorRate < brandRate) return 'text-emerald-600'
  return 'text-gray-600'
}

const getPositionComparisonColor = (competitorPos: number | null, brandPos: number | null) => {
  if (!competitorPos || !brandPos) return 'text-gray-600'
  if (competitorPos < brandPos) return 'text-red-600' // Lower position is better
  if (competitorPos > brandPos) return 'text-emerald-600'
  return 'text-gray-600'
}

const getBarWidth = (value: number, otherValue: number) => {
  const total = value + otherValue
  if (total === 0) return 50
  return (value / total) * 100
}

const getSentimentClass = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return 'bg-emerald-50 text-emerald-700'
    case 'negative': return 'bg-red-50 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

const formatModel = (model: string) => {
  switch (model?.toLowerCase()) {
    case 'chatgpt': return 'ChatGPT'
    case 'claude': return 'Claude'
    case 'gemini': return 'Gemini'
    case 'perplexity': return 'Perplexity'
    default: return model
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
</script>
