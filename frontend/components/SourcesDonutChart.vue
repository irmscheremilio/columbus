<template>
  <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-1 h-4 rounded-full bg-violet-500"></div>
        <div>
          <h2 class="text-sm font-semibold text-gray-900">{{ title }}</h2>
          <p class="text-[10px] text-gray-500 mt-0.5">Source breakdown</p>
        </div>
      </div>
      <span v-if="totalCitations > 0" class="text-[10px] text-gray-500 bg-gray-100/80 px-2 py-1 rounded-md font-medium">
        {{ totalCitations }} total
      </span>
    </div>

    <!-- Content -->
    <div class="p-4 flex-1 flex flex-col">
      <div v-if="loading" class="flex items-center justify-center flex-1">
        <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
      </div>

      <div v-else-if="sources.length === 0" class="flex flex-col items-center justify-center flex-1 text-center py-8">
        <svg class="w-10 h-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <p class="text-sm text-gray-500">No citations detected yet</p>
        <p class="text-xs text-gray-400 mt-1">Run a visibility scan to see source data</p>
      </div>

      <div v-else class="flex flex-col gap-4">
        <!-- Top Sources Bar Chart -->
        <div>
          <h4 class="text-xs font-semibold text-gray-700 mb-3">Top Citation Sources</h4>
          <div class="h-40">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </div>

        <!-- All Sources List -->
        <div>
          <h4 class="text-xs font-semibold text-gray-700 mb-3">All Sources</h4>
          <div class="max-h-48 overflow-y-auto space-y-2 pr-1">
            <div
              v-for="(source, idx) in sources"
              :key="source.domain"
              class="flex items-center gap-3"
            >
              <div class="w-28 text-xs font-medium truncate" :class="source.isBrand ? 'text-emerald-600' : 'text-gray-700'">
                {{ source.domain }}
              </div>
              <div class="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="source.isBrand ? 'bg-emerald-500' : 'bg-gray-400'"
                  :style="{ width: `${getPercent(source.count)}%` }"
                ></div>
              </div>
              <div class="w-14 text-right text-xs font-semibold" :class="source.isBrand ? 'text-emerald-600' : 'text-gray-600'">
                {{ getPercent(source.count) }}%
              </div>
            </div>
          </div>
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
const { selectedRegion } = useRegionFilter()

const loading = ref(false)
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

const getPercent = (count: number) => {
  if (totalCitations.value === 0) return 0
  return Math.round((count / totalCitations.value) * 100)
}

const loadData = async () => {
  if (!props.productId) return

  loading.value = true
  try {
    // If region is selected, filter citations by their linked prompt_results
    let filteredResultIds: string[] | null = null
    if (selectedRegion.value) {
      const { data: regionResults } = await supabase
        .from('prompt_results')
        .select('id')
        .eq('product_id', props.productId)
        .ilike('request_country', selectedRegion.value)

      filteredResultIds = (regionResults || []).map(r => r.id)

      if (filteredResultIds.length === 0) {
        sources.value = []
        totalCitations.value = 0
        brandCitations.value = 0
        loading.value = false
        return
      }
    }

    // First get accurate total count
    let countQuery = supabase
      .from('prompt_citations')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', props.productId)

    if (filteredResultIds) {
      countQuery = countQuery.in('prompt_result_id', filteredResultIds)
    }

    const { count: exactCount } = await countQuery

    // Fetch all citations for accurate aggregation
    // Use high limit to override Supabase default of 1000
    let allData: { source_domain: string; is_brand_source: boolean }[] = []
    let offset = 0
    const batchSize = 1000

    // Paginate to get all citations
    while (true) {
      let query = supabase
        .from('prompt_citations')
        .select('source_domain, is_brand_source')
        .eq('product_id', props.productId)
        .range(offset, offset + batchSize - 1)

      if (filteredResultIds) {
        query = query.in('prompt_result_id', filteredResultIds)
      }

      const { data: batchData, error } = await query
      if (error) throw error

      if (!batchData || batchData.length === 0) break

      allData = allData.concat(batchData)
      if (batchData.length < batchSize) break
      offset += batchSize
    }

    const data = allData

    // Aggregate by domain
    const domainCounts: Record<string, { count: number; isBrand: boolean }> = {}
    let brand = 0

    for (const row of data || []) {
      const key = row.source_domain
      if (!domainCounts[key]) {
        domainCounts[key] = { count: 0, isBrand: row.is_brand_source }
      }
      domainCounts[key].count++
      if (row.is_brand_source) brand++
    }

    sources.value = Object.entries(domainCounts)
      .map(([domain, { count, isBrand }]) => ({ domain, count, isBrand }))
      .sort((a, b) => b.count - a.count)

    // Use exact count for accurate total
    totalCitations.value = exactCount || 0
    brandCitations.value = brand

    // Render chart with retry mechanism
    const tryRenderChart = (attempts = 0) => {
      if (attempts > 5) return
      setTimeout(() => {
        if (chartCanvas.value) {
          renderChart()
        } else {
          tryRenderChart(attempts + 1)
        }
      }, 100)
    }

    await nextTick()
    tryRenderChart()
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

  // Take top 6 for chart
  const chartSources = sources.value.slice(0, 6)

  const labels = chartSources.map(s => s.domain)
  const data = chartSources.map(s => getPercent(s.count))
  const backgroundColors = chartSources.map(s => s.isBrand ? '#10B981' : '#D1D5DB')

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderRadius: 4,
        barThickness: 20
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const source = chartSources[context.dataIndex]
              return `${source.count} citations (${context.parsed.x}%)`
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
            font: { size: 10 }
          },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        y: {
          ticks: { font: { size: 10 } },
          grid: { display: false }
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

// Watch for global region filter changes
watch(selectedRegion, () => {
  if (props.productId) {
    loadData()
  }
})

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
