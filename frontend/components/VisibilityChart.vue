<template>
  <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4 hover:shadow-md transition-shadow duration-200">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-sm font-semibold text-gray-900">{{ title }}</h2>
      <div class="flex items-center gap-2">
        <!-- View Mode Toggle -->
        <select
          v-model="viewMode"
          @change="loadData"
          class="text-xs bg-gray-100/80 border-0 rounded-lg pl-2 pr-6 py-1 text-gray-600 cursor-pointer focus:ring-1 focus:ring-brand/30 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.25rem_center] bg-no-repeat"
        >
          <option value="platforms">By Platform</option>
          <option value="competitors">vs Competitors</option>
        </select>
        <!-- Grouping Toggle (only for platforms view) -->
        <select
          v-if="viewMode === 'platforms'"
          v-model="groupingMode"
          @change="loadData"
          class="text-xs bg-gray-100/80 border-0 rounded-lg pl-2 pr-6 py-1 text-gray-600 cursor-pointer focus:ring-1 focus:ring-brand/30 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.25rem_center] bg-no-repeat"
        >
          <option value="session">By Scan</option>
          <option value="day">By Day</option>
        </select>
        <!-- Period Toggle -->
        <div class="flex items-center gap-0.5 bg-gray-100/80 rounded-lg p-0.5">
          <button
            v-for="period in periods"
            :key="period.value"
            @click="selectPeriod(period.value)"
            class="px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200"
            :class="selectedPeriod === period.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          >
            {{ period.label }}
          </button>
        </div>
      </div>
    </div>
    <div class="relative" :style="{ height: chartHeight }">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-lg">
        <div class="animate-spin rounded-full h-5 w-5 border-2 border-brand border-t-transparent"></div>
      </div>
      <canvas ref="chartCanvas"></canvas>
    </div>
    <!-- Platform Legend (for platforms view) -->
    <div v-if="viewMode === 'platforms'" class="flex flex-wrap justify-center gap-4 mt-3 pt-3 border-t border-gray-100/80">
      <div v-for="platform in platforms" :key="platform.name" class="flex items-center gap-1.5 group cursor-default">
        <div class="w-2 h-2 rounded-full transition-transform group-hover:scale-125" :style="{ backgroundColor: platform.color }"></div>
        <span class="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">{{ platform.label }}</span>
      </div>
    </div>
    <!-- Competitor Legend (for competitors view) -->
    <div v-else class="flex flex-wrap justify-center gap-4 mt-3 pt-3 border-t border-gray-100/80">
      <div class="flex items-center gap-1.5 group cursor-default">
        <div class="w-2 h-2 rounded-full transition-transform group-hover:scale-125 bg-brand"></div>
        <span class="text-xs text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Your Brand</span>
      </div>
      <div v-for="competitor in competitorLegend" :key="competitor.name" class="flex items-center gap-1.5 group cursor-default">
        <div class="w-2 h-2 rounded-full transition-transform group-hover:scale-125" :style="{ backgroundColor: competitor.color }"></div>
        <span class="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">{{ competitor.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Chart from 'chart.js/auto'

const props = withDefaults(defineProps<{
  title?: string
  productId: string | null
  chartHeight?: string
}>(), {
  title: 'Visibility Over Time',
  chartHeight: '12rem'
})

const emit = defineEmits<{
  (e: 'period-change', days: number): void
}>()

const supabase = useSupabaseClient()

const loading = ref(false)
const selectedPeriod = ref('30')
const viewMode = ref<'platforms' | 'competitors'>('platforms')
const groupingMode = ref<'session' | 'day'>('session')
const chartCanvas = ref<HTMLCanvasElement | null>(null)
const competitorLegend = ref<{ name: string; color: string }[]>([])
let chart: Chart | null = null

const periods = [
  { value: '7', label: '7d' },
  { value: '30', label: '30d' },
  { value: '90', label: '90d' }
]

const platforms = [
  { name: 'chatgpt', label: 'ChatGPT', color: '#10a37f' },
  { name: 'claude', label: 'Claude', color: '#d97757' },
  { name: 'gemini', label: 'Gemini', color: '#4285f4' },
  { name: 'perplexity', label: 'Perplexity', color: '#20b8cd' }
]

const competitorColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#ec4899', // pink
  '#f59e0b', // amber
  '#6366f1', // indigo
]

const loadData = async () => {
  if (!props.productId) return

  loading.value = true
  try {
    if (viewMode.value === 'competitors') {
      await loadCompetitorData()
    } else {
      await loadPlatformData()
    }
  } catch (error) {
    console.error('Error loading data:', error)
    await nextTick()
    renderChart(generateEmptyChartData())
  } finally {
    loading.value = false
  }
}

const loadPlatformData = async () => {
  const daysAgo = parseInt(selectedPeriod.value)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysAgo)
  startDate.setHours(0, 0, 0, 0)

  const { data: historyData } = await supabase
    .from('visibility_history')
    .select('*')
    .eq('product_id', props.productId)
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: true })

  const chartData = groupingMode.value === 'session'
    ? processHistoryBySession(historyData || [])
    : processHistoryByDay(historyData || [], daysAgo)
  await nextTick()
  renderChart(chartData)
}

const loadCompetitorData = async () => {
  const daysAgo = parseInt(selectedPeriod.value)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysAgo)
  startDate.setHours(0, 0, 0, 0)

  // Load your brand's visibility history (overall/aggregated)
  const { data: brandHistory } = await supabase
    .from('visibility_history')
    .select('recorded_at, mention_rate')
    .eq('product_id', props.productId)
    .eq('ai_model', 'overall')
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: true })

  // If no overall, aggregate from per-platform data
  let brandData = brandHistory || []
  if (brandData.length === 0) {
    const { data: platformHistory } = await supabase
      .from('visibility_history')
      .select('recorded_at, mention_rate, prompts_tested, prompts_mentioned')
      .eq('product_id', props.productId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true })

    // Aggregate by timestamp
    const aggregated = new Map<string, { tested: number; mentioned: number }>()
    for (const entry of platformHistory || []) {
      const key = entry.recorded_at
      if (!aggregated.has(key)) {
        aggregated.set(key, { tested: 0, mentioned: 0 })
      }
      const data = aggregated.get(key)!
      data.tested += entry.prompts_tested || 0
      data.mentioned += entry.prompts_mentioned || 0
    }
    brandData = Array.from(aggregated.entries()).map(([recorded_at, data]) => ({
      recorded_at,
      mention_rate: data.tested > 0 ? (data.mentioned / data.tested) * 100 : 0
    }))
  }

  // Load tracking competitors
  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, name')
    .eq('product_id', props.productId)
    .eq('status', 'tracking')
    .limit(5)

  // Load competitor visibility history
  const competitorIds = (competitors || []).map(c => c.id)
  let competitorHistory: any[] = []
  if (competitorIds.length > 0) {
    const { data } = await supabase
      .from('competitor_visibility_history')
      .select('competitor_id, recorded_at, mention_rate')
      .in('competitor_id', competitorIds)
      .eq('ai_model', 'overall')
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true })
    competitorHistory = data || []
  }

  // Update legend
  competitorLegend.value = (competitors || []).map((c, i) => ({
    name: c.name,
    color: competitorColors[i % competitorColors.length]
  }))

  // Process into chart data
  const chartData = processCompetitorData(brandData, competitors || [], competitorHistory, daysAgo)
  await nextTick()
  renderCompetitorChart(chartData, competitors || [])
}

const processCompetitorData = (
  brandData: any[],
  competitors: any[],
  competitorHistory: any[],
  daysAgo: number
) => {
  const labels: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Generate labels for each day
  for (let i = daysAgo - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }

  // Initialize data arrays
  const brandDataArray: (number | null)[] = new Array(daysAgo).fill(null)
  const competitorDataArrays: Map<string, (number | null)[]> = new Map()
  for (const c of competitors) {
    competitorDataArrays.set(c.id, new Array(daysAgo).fill(null))
  }

  // Map brand data to array (keep latest per day)
  const brandByDay = new Map<string, number>()
  for (const entry of brandData) {
    const dateKey = new Date(entry.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    brandByDay.set(dateKey, entry.mention_rate)
  }
  labels.forEach((label, i) => {
    if (brandByDay.has(label)) {
      brandDataArray[i] = Math.round(brandByDay.get(label)! * 10) / 10
    }
  })

  // Map competitor data to arrays
  const competitorByDay = new Map<string, Map<string, number>>()
  for (const entry of competitorHistory) {
    const dateKey = new Date(entry.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!competitorByDay.has(entry.competitor_id)) {
      competitorByDay.set(entry.competitor_id, new Map())
    }
    competitorByDay.get(entry.competitor_id)!.set(dateKey, entry.mention_rate)
  }

  for (const c of competitors) {
    const dataArray = competitorDataArrays.get(c.id)!
    const dayData = competitorByDay.get(c.id)
    if (dayData) {
      labels.forEach((label, i) => {
        if (dayData.has(label)) {
          dataArray[i] = Math.round(dayData.get(label)! * 10) / 10
        }
      })
    }
  }

  // Trim leading empty days
  let firstDataIndex = -1
  for (let i = 0; i < labels.length; i++) {
    if (brandDataArray[i] !== null || Array.from(competitorDataArrays.values()).some(arr => arr[i] !== null)) {
      firstDataIndex = i
      break
    }
  }

  if (firstDataIndex === -1) {
    return {
      labels: [labels[labels.length - 1]],
      brandData: [null],
      competitorData: new Map(competitors.map(c => [c.id, [null]]))
    }
  }

  return {
    labels: labels.slice(firstDataIndex),
    brandData: brandDataArray.slice(firstDataIndex),
    competitorData: new Map(
      competitors.map(c => [c.id, competitorDataArrays.get(c.id)!.slice(firstDataIndex)])
    )
  }
}

const renderCompetitorChart = (
  chartData: { labels: string[]; brandData: (number | null)[]; competitorData: Map<string, (number | null)[]> },
  competitors: any[]
) => {
  if (!chartCanvas.value) return

  if (chart) {
    chart.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  const datasets = [
    {
      label: 'Your Brand',
      data: chartData.brandData,
      borderColor: '#6366f1', // brand color
      backgroundColor: '#6366f120',
      borderWidth: 3,
      fill: false,
      tension: 0.3,
      pointRadius: 2,
      pointHoverRadius: 4,
      pointBackgroundColor: '#6366f1',
      spanGaps: true
    },
    ...competitors.map((c, i) => ({
      label: c.name,
      data: chartData.competitorData.get(c.id) || [],
      borderColor: competitorColors[i % competitorColors.length],
      backgroundColor: competitorColors[i % competitorColors.length] + '20',
      borderWidth: 2,
      fill: false,
      tension: 0.3,
      pointRadius: 1,
      pointHoverRadius: 3,
      pointBackgroundColor: competitorColors[i % competitorColors.length],
      spanGaps: true,
      borderDash: [5, 5]
    }))
  ]

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets
    },
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
              return `${context.dataset.label}: ${value}%`
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#9ca3af', maxTicksLimit: 6 }
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: '#f3f4f6' },
          ticks: { font: { size: 10 }, color: '#9ca3af', callback: (v) => `${v}%` }
        }
      }
    }
  })
}

// Group by scan session - each scan appears as a separate point
const processHistoryBySession = (historyData: any[]) => {
  if (!historyData || historyData.length === 0) {
    return generateEmptyChartData()
  }

  // Group entries by recorded_at timestamp to identify scan sessions
  const scanSessions: { timestamp: Date, platforms: Record<string, number | null> }[] = []

  // Sort by recorded_at
  const sortedData = [...historyData].sort((a, b) =>
    new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  )

  // Group entries that are within 5 minutes of each other as same scan session
  let currentSession: { timestamp: Date, platforms: Record<string, number | null> } | null = null

  for (const entry of sortedData) {
    const entryTime = new Date(entry.recorded_at)
    const platform = entry.ai_model?.toLowerCase()

    if (!platform) continue

    // Check if this belongs to current session (within 5 minutes)
    // Use mention_rate for display (calculated from prompts_mentioned/prompts_tested)
    const mentionRate = entry.prompts_tested > 0
      ? Math.round((entry.prompts_mentioned / entry.prompts_tested) * 100)
      : (entry.mention_rate ?? entry.score ?? 0)

    if (currentSession && (entryTime.getTime() - currentSession.timestamp.getTime()) < 5 * 60 * 1000) {
      currentSession.platforms[platform] = mentionRate
    } else {
      if (currentSession) {
        scanSessions.push(currentSession)
      }
      currentSession = {
        timestamp: entryTime,
        platforms: {
          chatgpt: null,
          claude: null,
          gemini: null,
          perplexity: null,
          [platform]: mentionRate
        }
      }
    }
  }

  if (currentSession) {
    scanSessions.push(currentSession)
  }

  if (scanSessions.length === 0) {
    return generateEmptyChartData()
  }

  const labels = scanSessions.map(session => {
    const date = session.timestamp
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return `${dateStr} ${timeStr}`
  })

  const platformData: Record<string, (number | null)[]> = {
    chatgpt: scanSessions.map(s => s.platforms.chatgpt),
    claude: scanSessions.map(s => s.platforms.claude),
    gemini: scanSessions.map(s => s.platforms.gemini),
    perplexity: scanSessions.map(s => s.platforms.perplexity)
  }

  return { labels, platformData }
}

// Group by day - shows average mention rate per day per platform
const processHistoryByDay = (historyData: any[], daysAgo: number) => {
  const labels: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Generate labels for each day
  for (let i = daysAgo - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }

  // Initialize platform data arrays with nulls
  const platformData: Record<string, (number | null)[]> = {
    chatgpt: new Array(daysAgo).fill(null),
    claude: new Array(daysAgo).fill(null),
    gemini: new Array(daysAgo).fill(null),
    perplexity: new Array(daysAgo).fill(null)
  }

  // Group entries by date and platform, collecting all entries for averaging
  const entriesByDayAndPlatform: Record<string, Record<string, { totalMentioned: number, totalTested: number }>> = {}

  for (const entry of historyData) {
    const entryDate = new Date(entry.recorded_at)
    const dateKey = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const platform = entry.ai_model?.toLowerCase()

    if (!platform || !platformData[platform]) continue

    if (!entriesByDayAndPlatform[dateKey]) {
      entriesByDayAndPlatform[dateKey] = {}
    }

    if (!entriesByDayAndPlatform[dateKey][platform]) {
      entriesByDayAndPlatform[dateKey][platform] = { totalMentioned: 0, totalTested: 0 }
    }

    // Accumulate prompts_mentioned and prompts_tested for averaging
    entriesByDayAndPlatform[dateKey][platform].totalMentioned += entry.prompts_mentioned || 0
    entriesByDayAndPlatform[dateKey][platform].totalTested += entry.prompts_tested || 0
  }

  // Map entries to chart data arrays - calculate average mention rate
  labels.forEach((label, index) => {
    const dayEntries = entriesByDayAndPlatform[label]
    if (dayEntries) {
      for (const platform of Object.keys(platformData)) {
        if (dayEntries[platform] && dayEntries[platform].totalTested > 0) {
          const avgMentionRate = (dayEntries[platform].totalMentioned / dayEntries[platform].totalTested) * 100
          platformData[platform][index] = Math.round(avgMentionRate)
        }
      }
    }
  })

  // Find the first index where at least one platform has data
  let firstDataIndex = -1
  for (let i = 0; i < labels.length; i++) {
    const hasData = Object.values(platformData).some(data => data[i] !== null)
    if (hasData) {
      firstDataIndex = i
      break
    }
  }

  if (firstDataIndex === -1) {
    return {
      labels: [labels[labels.length - 1]],
      platformData: {
        chatgpt: [null],
        claude: [null],
        gemini: [null],
        perplexity: [null]
      }
    }
  }

  // Trim leading days with no data
  const trimmedLabels = labels.slice(firstDataIndex)
  const trimmedPlatformData: Record<string, (number | null)[]> = {}
  for (const platform of Object.keys(platformData)) {
    trimmedPlatformData[platform] = platformData[platform].slice(firstDataIndex)
  }

  return { labels: trimmedLabels, platformData: trimmedPlatformData }
}

const generateEmptyChartData = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayLabel = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // Return minimal chart with just today's date when there's no data
  return {
    labels: [todayLabel],
    platformData: {
      chatgpt: [null],
      claude: [null],
      gemini: [null],
      perplexity: [null]
    }
  }
}

const renderChart = (chartData: { labels: string[], platformData: Record<string, (number | null)[]> }) => {
  if (!chartCanvas.value) return

  if (chart) {
    chart.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  const datasets = platforms.map(platform => ({
    label: platform.label,
    data: chartData.platformData[platform.name] || [],
    borderColor: platform.color,
    backgroundColor: platform.color + '20',
    borderWidth: 2,
    fill: false,
    tension: 0.3,
    pointRadius: 1,
    pointHoverRadius: 3,
    pointBackgroundColor: platform.color,
    spanGaps: true
  }))

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets
    },
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
              return `${context.dataset.label}: ${value}%`
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#9ca3af', maxTicksLimit: 6 }
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: '#f3f4f6' },
          ticks: { font: { size: 10 }, color: '#9ca3af', callback: (v) => `${v}%` }
        }
      }
    }
  })
}

const selectPeriod = (period: string) => {
  selectedPeriod.value = period
  emit('period-change', parseInt(period))
  loadData()
}

watch(() => props.productId, (newProductId) => {
  if (newProductId) {
    loadData()
  }
}, { immediate: true })

onMounted(() => {
  // Emit initial period
  emit('period-change', parseInt(selectedPeriod.value))
  if (props.productId) {
    loadData()
  }
})

onUnmounted(() => {
  if (chart) {
    chart.destroy()
  }
})
</script>
