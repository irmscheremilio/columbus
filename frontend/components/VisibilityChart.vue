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
        <!-- Metric Toggle -->
        <select
          v-model="selectedMetric"
          @change="loadData"
          class="text-xs bg-gray-100/80 border-0 rounded-lg pl-2 pr-6 py-1 text-gray-600 cursor-pointer focus:ring-1 focus:ring-brand/30 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.25rem_center] bg-no-repeat"
        >
          <option value="mention_rate">Mention Rate</option>
          <option value="position">Avg Position</option>
        </select>
        <!-- Model Filter (for competitors view) -->
        <select
          v-if="viewMode === 'competitors'"
          v-model="competitorModel"
          @change="loadData"
          class="text-xs bg-gray-100/80 border-0 rounded-lg pl-2 pr-6 py-1 text-gray-600 cursor-pointer focus:ring-1 focus:ring-brand/30 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.25rem_center] bg-no-repeat"
        >
          <option value="overall">All Models</option>
          <option value="chatgpt">ChatGPT</option>
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
          <option value="perplexity">Perplexity</option>
        </select>
        <!-- Grouping Toggle -->
        <select
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
const selectedMetric = ref<'mention_rate' | 'position'>('mention_rate')
const competitorModel = ref<'overall' | 'chatgpt' | 'claude' | 'gemini' | 'perplexity'>('overall')
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
  const metric = selectedMetric.value

  // Get visibility history for mention rate
  const { data: historyData } = await supabase
    .from('visibility_history')
    .select('*')
    .eq('product_id', props.productId)
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: true })

  // Get position data from prompt_results if showing position metric
  let positionData: any[] = []
  if (metric === 'position') {
    const { data } = await supabase
      .from('prompt_results')
      .select('tested_at, position, ai_model')
      .eq('product_id', props.productId)
      .eq('brand_mentioned', true)
      .not('position', 'is', null)
      .gte('tested_at', startDate.toISOString())
      .order('tested_at', { ascending: true })
    positionData = data || []
  }

  const chartData = groupingMode.value === 'session'
    ? processHistoryBySession(historyData || [], positionData, metric)
    : processHistoryByDay(historyData || [], positionData, daysAgo, metric)
  await nextTick()
  renderChart(chartData, metric)
}

const loadCompetitorData = async () => {
  const daysAgo = parseInt(selectedPeriod.value)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysAgo)
  startDate.setHours(0, 0, 0, 0)

  const selectedModel = competitorModel.value
  const metric = selectedMetric.value

  // Build query for brand's visibility history
  let brandQuery = supabase
    .from('visibility_history')
    .select('recorded_at, mention_rate, prompts_tested, prompts_mentioned, ai_model')
    .eq('product_id', props.productId)
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: true })

  // Filter by model if not 'overall'
  if (selectedModel !== 'overall') {
    brandQuery = brandQuery.eq('ai_model', selectedModel)
  }

  const { data: brandHistory } = await brandQuery

  // Also load position data from prompt_results if showing position metric
  let brandPositionData: any[] = []
  if (metric === 'position') {
    let positionQuery = supabase
      .from('prompt_results')
      .select('tested_at, position, ai_model')
      .eq('product_id', props.productId)
      .eq('brand_mentioned', true)
      .not('position', 'is', null)
      .gte('tested_at', startDate.toISOString())
      .order('tested_at', { ascending: true })

    if (selectedModel !== 'overall') {
      positionQuery = positionQuery.eq('ai_model', selectedModel)
    }

    const { data } = await positionQuery
    brandPositionData = data || []
  }

  // Process brand data - aggregate if needed for 'overall'
  let brandData: any[] = []
  if (selectedModel === 'overall' && brandHistory && brandHistory.length > 0) {
    // Aggregate by timestamp
    const aggregated = new Map<string, { tested: number; mentioned: number; positions: number[]; count: number }>()
    for (const entry of brandHistory) {
      const key = entry.recorded_at
      if (!aggregated.has(key)) {
        aggregated.set(key, { tested: 0, mentioned: 0, positions: [], count: 0 })
      }
      const data = aggregated.get(key)!
      data.tested += entry.prompts_tested || 0
      data.mentioned += entry.prompts_mentioned || 0
      data.count++
    }
    brandData = Array.from(aggregated.entries()).map(([recorded_at, data]) => ({
      recorded_at,
      mention_rate: data.tested > 0 ? (data.mentioned / data.tested) * 100 : 0
    }))
  } else {
    brandData = (brandHistory || []).map(entry => ({
      recorded_at: entry.recorded_at,
      mention_rate: entry.prompts_tested > 0
        ? (entry.prompts_mentioned / entry.prompts_tested) * 100
        : (entry.mention_rate || 0)
    }))
  }

  // Load tracking competitors
  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, name')
    .eq('product_id', props.productId)
    .eq('status', 'tracking')
    .limit(5)

  // Load competitor mentions from prompt_results (for both mention rate and position)
  const competitorIds = (competitors || []).map(c => c.id)
  let competitorMentions: any[] = []
  if (competitorIds.length > 0) {
    let mentionsQuery = supabase
      .from('competitor_mentions')
      .select('competitor_id, detected_at, ai_model, prompt_result_id')
      .in('competitor_id', competitorIds)
      .gte('detected_at', startDate.toISOString())
      .order('detected_at', { ascending: true })

    if (selectedModel !== 'overall') {
      mentionsQuery = mentionsQuery.eq('ai_model', selectedModel)
    }

    const { data } = await mentionsQuery
    competitorMentions = data || []
  }

  // Load prompt results count for calculating mention rates
  let totalPromptsByTime: any[] = []
  let promptQuery = supabase
    .from('prompt_results')
    .select('tested_at, ai_model')
    .eq('product_id', props.productId)
    .gte('tested_at', startDate.toISOString())
    .order('tested_at', { ascending: true })

  if (selectedModel !== 'overall') {
    promptQuery = promptQuery.eq('ai_model', selectedModel)
  }

  const { data: promptResults } = await promptQuery
  totalPromptsByTime = promptResults || []

  // Update legend
  competitorLegend.value = (competitors || []).map((c, i) => ({
    name: c.name,
    color: competitorColors[i % competitorColors.length]
  }))

  // Process into chart data based on grouping mode
  const chartData = groupingMode.value === 'session'
    ? processCompetitorDataBySession(brandData, brandPositionData, competitors || [], competitorMentions, totalPromptsByTime, metric)
    : processCompetitorDataByDay(brandData, brandPositionData, competitors || [], competitorMentions, totalPromptsByTime, daysAgo, metric)

  await nextTick()
  renderCompetitorChart(chartData, competitors || [], metric)
}

// Process competitor data grouped by scan session
const processCompetitorDataBySession = (
  brandData: any[],
  brandPositionData: any[],
  competitors: any[],
  competitorMentions: any[],
  totalPrompts: any[],
  metric: 'mention_rate' | 'position'
) => {
  // Group prompts into scan sessions (within 5 minutes of each other)
  const sessions: { timestamp: Date; promptCount: number }[] = []
  let currentSession: { timestamp: Date; promptCount: number } | null = null

  const sortedPrompts = [...totalPrompts].sort((a, b) =>
    new Date(a.tested_at).getTime() - new Date(b.tested_at).getTime()
  )

  for (const prompt of sortedPrompts) {
    const time = new Date(prompt.tested_at)
    if (currentSession && (time.getTime() - currentSession.timestamp.getTime()) < 5 * 60 * 1000) {
      currentSession.promptCount++
    } else {
      if (currentSession) sessions.push(currentSession)
      currentSession = { timestamp: time, promptCount: 1 }
    }
  }
  if (currentSession) sessions.push(currentSession)

  if (sessions.length === 0) {
    return {
      labels: ['No data'],
      brandData: [null],
      competitorData: new Map(competitors.map(c => [c.id, [null]]))
    }
  }

  // Generate labels
  const labels = sessions.map(s => {
    const dateStr = s.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const timeStr = s.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return `${dateStr} ${timeStr}`
  })

  // Calculate brand data per session
  const brandDataArray: (number | null)[] = []
  for (const session of sessions) {
    const sessionEnd = new Date(session.timestamp.getTime() + 5 * 60 * 1000)

    if (metric === 'mention_rate') {
      // Find brand data for this session
      const sessionBrandData = brandData.filter(d => {
        const t = new Date(d.recorded_at)
        return t >= session.timestamp && t < sessionEnd
      })
      if (sessionBrandData.length > 0) {
        const avg = sessionBrandData.reduce((sum, d) => sum + (d.mention_rate || 0), 0) / sessionBrandData.length
        brandDataArray.push(Math.round(avg * 10) / 10)
      } else {
        brandDataArray.push(null)
      }
    } else {
      // Position metric
      const sessionPositions = brandPositionData.filter(d => {
        const t = new Date(d.tested_at)
        return t >= session.timestamp && t < sessionEnd
      })
      if (sessionPositions.length > 0) {
        const avgPos = sessionPositions.reduce((sum, d) => sum + d.position, 0) / sessionPositions.length
        brandDataArray.push(Math.round(avgPos * 10) / 10)
      } else {
        brandDataArray.push(null)
      }
    }
  }

  // Calculate competitor data per session
  const competitorDataArrays = new Map<string, (number | null)[]>()
  for (const c of competitors) {
    const dataArray: (number | null)[] = []
    for (const session of sessions) {
      const sessionEnd = new Date(session.timestamp.getTime() + 5 * 60 * 1000)

      // Count mentions for this competitor in this session
      const sessionMentions = competitorMentions.filter(m => {
        const t = new Date(m.detected_at)
        return m.competitor_id === c.id && t >= session.timestamp && t < sessionEnd
      })

      if (metric === 'mention_rate') {
        // Mention rate = mentions / total prompts in session
        const rate = session.promptCount > 0 ? (sessionMentions.length / session.promptCount) * 100 : 0
        dataArray.push(sessionMentions.length > 0 ? Math.round(rate * 10) / 10 : null)
      } else {
        // For position, we'd need position data from competitor_mentions - for now show null
        // This would require joining with prompt_results to get position
        dataArray.push(null)
      }
    }
    competitorDataArrays.set(c.id, dataArray)
  }

  return { labels, brandData: brandDataArray, competitorData: competitorDataArrays }
}

// Process competitor data grouped by day
const processCompetitorDataByDay = (
  brandData: any[],
  brandPositionData: any[],
  competitors: any[],
  competitorMentions: any[],
  totalPrompts: any[],
  daysAgo: number,
  metric: 'mention_rate' | 'position'
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

  // Count prompts per day
  const promptsPerDay = new Map<string, number>()
  for (const p of totalPrompts) {
    const dateKey = new Date(p.tested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    promptsPerDay.set(dateKey, (promptsPerDay.get(dateKey) || 0) + 1)
  }

  // Initialize data arrays
  const brandDataArray: (number | null)[] = new Array(daysAgo).fill(null)
  const competitorDataArrays = new Map<string, (number | null)[]>()
  for (const c of competitors) {
    competitorDataArrays.set(c.id, new Array(daysAgo).fill(null))
  }

  if (metric === 'mention_rate') {
    // Map brand mention rate by day
    const brandByDay = new Map<string, { total: number; count: number }>()
    for (const entry of brandData) {
      const dateKey = new Date(entry.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!brandByDay.has(dateKey)) {
        brandByDay.set(dateKey, { total: 0, count: 0 })
      }
      const d = brandByDay.get(dateKey)!
      d.total += entry.mention_rate || 0
      d.count++
    }
    labels.forEach((label, i) => {
      const d = brandByDay.get(label)
      if (d && d.count > 0) {
        brandDataArray[i] = Math.round((d.total / d.count) * 10) / 10
      }
    })

    // Map competitor mention rate by day
    const competitorsByDay = new Map<string, Map<string, number>>()
    for (const m of competitorMentions) {
      const dateKey = new Date(m.detected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!competitorsByDay.has(m.competitor_id)) {
        competitorsByDay.set(m.competitor_id, new Map())
      }
      const dayMap = competitorsByDay.get(m.competitor_id)!
      dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + 1)
    }

    for (const c of competitors) {
      const dataArray = competitorDataArrays.get(c.id)!
      const dayData = competitorsByDay.get(c.id)
      if (dayData) {
        labels.forEach((label, i) => {
          const mentions = dayData.get(label) || 0
          const totalForDay = promptsPerDay.get(label) || 0
          if (mentions > 0 && totalForDay > 0) {
            dataArray[i] = Math.round((mentions / totalForDay) * 100 * 10) / 10
          }
        })
      }
    }
  } else {
    // Position metric
    const brandPosByDay = new Map<string, { total: number; count: number }>()
    for (const entry of brandPositionData) {
      const dateKey = new Date(entry.tested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!brandPosByDay.has(dateKey)) {
        brandPosByDay.set(dateKey, { total: 0, count: 0 })
      }
      const d = brandPosByDay.get(dateKey)!
      d.total += entry.position
      d.count++
    }
    labels.forEach((label, i) => {
      const d = brandPosByDay.get(label)
      if (d && d.count > 0) {
        brandDataArray[i] = Math.round((d.total / d.count) * 10) / 10
      }
    })
    // Competitor position data not available directly - would need to extend competitor_mentions table
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
  competitors: any[],
  metric: 'mention_rate' | 'position' = 'mention_rate'
) => {
  if (!chartCanvas.value) return

  if (chart) {
    chart.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  const isPositionMetric = metric === 'position'

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

  // Calculate max position for dynamic Y-axis scaling
  let maxPosition = 10
  if (isPositionMetric) {
    const allValues = [
      ...chartData.brandData.filter(v => v !== null) as number[],
      ...Array.from(chartData.competitorData.values()).flatMap(arr => arr.filter(v => v !== null) as number[])
    ]
    if (allValues.length > 0) {
      maxPosition = Math.max(10, Math.ceil(Math.max(...allValues) / 5) * 5)
    }
  }

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
              if (isPositionMetric) {
                return `${context.dataset.label}: #${value}`
              }
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
          min: isPositionMetric ? 1 : 0,
          max: isPositionMetric ? maxPosition : 100,
          reverse: isPositionMetric, // Lower position = better, so reverse for position metric
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

// Group by scan session - each scan appears as a separate point
const processHistoryBySession = (
  historyData: any[],
  positionData: any[] = [],
  metric: 'mention_rate' | 'position' = 'mention_rate'
) => {
  const isPositionMetric = metric === 'position'
  const sourceData = isPositionMetric ? positionData : historyData

  if (!sourceData || sourceData.length === 0) {
    return generateEmptyChartData()
  }

  // Group entries by timestamp to identify scan sessions
  const scanSessions: { timestamp: Date, platforms: Record<string, { total: number; count: number } | null> }[] = []

  // Sort by timestamp
  const timestampField = isPositionMetric ? 'tested_at' : 'recorded_at'
  const sortedData = [...sourceData].sort((a, b) =>
    new Date(a[timestampField]).getTime() - new Date(b[timestampField]).getTime()
  )

  // Group entries that are within 5 minutes of each other as same scan session
  let currentSession: { timestamp: Date, platforms: Record<string, { total: number; count: number } | null> } | null = null

  for (const entry of sortedData) {
    const entryTime = new Date(entry[timestampField])
    const platform = entry.ai_model?.toLowerCase()

    if (!platform) continue

    // Get the value based on metric type
    let value: number
    if (isPositionMetric) {
      value = entry.position
    } else {
      value = entry.prompts_tested > 0
        ? Math.round((entry.prompts_mentioned / entry.prompts_tested) * 100)
        : (entry.mention_rate ?? entry.score ?? 0)
    }

    if (currentSession && (entryTime.getTime() - currentSession.timestamp.getTime()) < 5 * 60 * 1000) {
      // Add to existing session, accumulating for average
      if (currentSession.platforms[platform]) {
        currentSession.platforms[platform]!.total += value
        currentSession.platforms[platform]!.count++
      } else {
        currentSession.platforms[platform] = { total: value, count: 1 }
      }
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
          [platform]: { total: value, count: 1 }
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

  // Calculate averages for each platform in each session
  const platformData: Record<string, (number | null)[]> = {
    chatgpt: scanSessions.map(s => s.platforms.chatgpt ? Math.round((s.platforms.chatgpt.total / s.platforms.chatgpt.count) * 10) / 10 : null),
    claude: scanSessions.map(s => s.platforms.claude ? Math.round((s.platforms.claude.total / s.platforms.claude.count) * 10) / 10 : null),
    gemini: scanSessions.map(s => s.platforms.gemini ? Math.round((s.platforms.gemini.total / s.platforms.gemini.count) * 10) / 10 : null),
    perplexity: scanSessions.map(s => s.platforms.perplexity ? Math.round((s.platforms.perplexity.total / s.platforms.perplexity.count) * 10) / 10 : null)
  }

  return { labels, platformData }
}

// Group by day - shows average mention rate or position per day per platform
const processHistoryByDay = (
  historyData: any[],
  positionData: any[] = [],
  daysAgo: number,
  metric: 'mention_rate' | 'position' = 'mention_rate'
) => {
  const isPositionMetric = metric === 'position'
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

  if (isPositionMetric) {
    // Group position data by date and platform
    const positionByDayAndPlatform: Record<string, Record<string, { total: number; count: number }>> = {}

    for (const entry of positionData) {
      const entryDate = new Date(entry.tested_at)
      const dateKey = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const platform = entry.ai_model?.toLowerCase()

      if (!platform || !platformData[platform]) continue

      if (!positionByDayAndPlatform[dateKey]) {
        positionByDayAndPlatform[dateKey] = {}
      }

      if (!positionByDayAndPlatform[dateKey][platform]) {
        positionByDayAndPlatform[dateKey][platform] = { total: 0, count: 0 }
      }

      positionByDayAndPlatform[dateKey][platform].total += entry.position
      positionByDayAndPlatform[dateKey][platform].count++
    }

    // Calculate average position per platform per day
    labels.forEach((label, index) => {
      const dayEntries = positionByDayAndPlatform[label]
      if (dayEntries) {
        for (const platform of Object.keys(platformData)) {
          if (dayEntries[platform] && dayEntries[platform].count > 0) {
            const avgPosition = dayEntries[platform].total / dayEntries[platform].count
            platformData[platform][index] = Math.round(avgPosition * 10) / 10
          }
        }
      }
    })
  } else {
    // Group entries by date and platform for mention rate
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

    // Calculate average mention rate
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
  }

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

const renderChart = (
  chartData: { labels: string[], platformData: Record<string, (number | null)[]> },
  metric: 'mention_rate' | 'position' = 'mention_rate'
) => {
  if (!chartCanvas.value) return

  if (chart) {
    chart.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  const isPositionMetric = metric === 'position'

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

  // Calculate max position for dynamic Y-axis scaling
  let maxPosition = 10
  if (isPositionMetric) {
    const allValues = Object.values(chartData.platformData)
      .flatMap(arr => arr.filter(v => v !== null) as number[])
    if (allValues.length > 0) {
      maxPosition = Math.max(10, Math.ceil(Math.max(...allValues) / 5) * 5)
    }
  }

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
              if (isPositionMetric) {
                return `${context.dataset.label}: #${value}`
              }
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
          min: isPositionMetric ? 1 : 0,
          max: isPositionMetric ? maxPosition : 100,
          reverse: isPositionMetric, // Lower position = better, so reverse for position metric
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
