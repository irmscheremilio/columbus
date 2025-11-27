<template>
  <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4 hover:shadow-md transition-shadow duration-200">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-sm font-semibold text-gray-900">{{ title }}</h2>
      <span v-if="totalCitations > 0" class="text-xs text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-full">
        {{ totalCitations }} citations
      </span>
    </div>

    <div v-if="loading" class="flex items-center justify-center h-48">
      <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
    </div>

    <div v-else-if="sources.length === 0" class="flex flex-col items-center justify-center h-48 text-center">
      <svg class="w-10 h-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      <p class="text-sm text-gray-500">No citations detected yet</p>
      <p class="text-xs text-gray-400 mt-1">Run a visibility scan to see source data</p>
    </div>

    <div v-else class="flex flex-col lg:flex-row items-center gap-4">
      <!-- Donut Chart -->
      <div class="relative w-40 h-40 flex-shrink-0">
        <canvas ref="chartCanvas"></canvas>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-2xl font-bold text-gray-900">{{ brandSourcePercent }}%</span>
          <span class="text-xs text-gray-500">Your site</span>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex-1 w-full">
        <div class="space-y-2 max-h-40 overflow-y-auto">
          <div
            v-for="(source, idx) in topSources"
            :key="source.domain"
            class="flex items-center justify-between text-sm p-1.5 rounded-lg hover:bg-gray-50/80 transition-colors"
          >
            <div class="flex items-center gap-2 min-w-0">
              <div
                class="w-3 h-3 rounded-full flex-shrink-0"
                :style="{ backgroundColor: getColor(idx, source.isBrand) }"
              ></div>
              <span class="truncate" :class="source.isBrand ? 'font-medium text-brand' : 'text-gray-600'">
                {{ source.domain }}
              </span>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0 ml-2">
              <span class="text-gray-900 font-semibold">{{ source.count }}</span>
              <span class="text-gray-400 text-xs">({{ getPercent(source.count) }}%)</span>
            </div>
          </div>
        </div>
        <div v-if="sources.length > 5" class="mt-2 pt-2 border-t border-gray-100/80">
          <button
            @click="showAll = !showAll"
            class="text-xs text-brand hover:text-brand/80 font-medium transition-colors"
          >
            {{ showAll ? 'Show less' : `+${sources.length - 5} more sources` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Chart from 'chart.js/auto'

const props = withDefaults(defineProps<{
  title?: string
  productId: string | null
}>(), {
  title: 'Citation Sources'
})

const supabase = useSupabaseClient()

const loading = ref(false)
const showAll = ref(false)
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

interface SourceData {
  domain: string
  count: number
  isBrand: boolean
}

const sources = ref<SourceData[]>([])
const totalCitations = ref(0)
const brandCitations = ref(0)

const topSources = computed(() => {
  return showAll.value ? sources.value : sources.value.slice(0, 5)
})

const brandSourcePercent = computed(() => {
  if (totalCitations.value === 0) return 0
  return Math.round((brandCitations.value / totalCitations.value) * 100)
})

const getPercent = (count: number) => {
  if (totalCitations.value === 0) return 0
  return Math.round((count / totalCitations.value) * 100)
}

const colors = [
  '#10b981', // emerald (brand)
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
]

const getColor = (index: number, isBrand: boolean) => {
  if (isBrand) return '#10b981' // Brand color (emerald)
  return colors[(index % (colors.length - 1)) + 1]
}

const loadData = async () => {
  if (!props.productId) return

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('prompt_citations')
      .select('source_domain, is_brand_source')
      .eq('product_id', props.productId)

    if (error) throw error

    // Aggregate by domain
    const domainCounts: Record<string, { count: number; isBrand: boolean }> = {}
    let total = 0
    let brand = 0

    for (const row of data || []) {
      const key = row.source_domain
      if (!domainCounts[key]) {
        domainCounts[key] = { count: 0, isBrand: row.is_brand_source }
      }
      domainCounts[key].count++
      total++
      if (row.is_brand_source) brand++
    }

    sources.value = Object.entries(domainCounts)
      .map(([domain, { count, isBrand }]) => ({ domain, count, isBrand }))
      .sort((a, b) => {
        // Brand sources first, then by count
        if (a.isBrand && !b.isBrand) return -1
        if (!a.isBrand && b.isBrand) return 1
        return b.count - a.count
      })

    totalCitations.value = total
    brandCitations.value = brand

    await nextTick()
    renderChart()
  } catch (error) {
    console.error('Error loading citations:', error)
  } finally {
    loading.value = false
  }
}

const renderChart = () => {
  if (!chartCanvas.value || sources.value.length === 0) return

  if (chart) {
    chart.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  // Take top 5 for chart, rest in "Other"
  const chartSources = sources.value.slice(0, 5)
  const otherCount = sources.value.slice(5).reduce((sum, s) => sum + s.count, 0)

  const labels = chartSources.map(s => s.domain)
  const data = chartSources.map(s => s.count)
  const backgroundColors = chartSources.map((s, i) => getColor(i, s.isBrand))

  if (otherCount > 0) {
    labels.push('Other')
    data.push(otherCount)
    backgroundColors.push('#9ca3af')
  }

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed
              const percent = Math.round((value / totalCitations.value) * 100)
              return `${context.label}: ${value} (${percent}%)`
            }
          }
        }
      }
    }
  })
}

watch(() => props.productId, (newProductId) => {
  if (newProductId) {
    loadData()
  }
}, { immediate: true })

onMounted(() => {
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
