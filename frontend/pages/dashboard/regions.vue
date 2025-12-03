<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Regional Analysis</h1>
          <p class="text-sm text-gray-500">Compare AI visibility across different regions</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-xl p-0.5 shadow-sm border border-white/50">
            <button
              v-for="period in periods"
              :key="period.value"
              @click="selectedPeriod = period.value"
              class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200"
              :class="selectedPeriod === period.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            >
              {{ period.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 animate-spin rounded-full border-2 border-brand border-t-transparent"></div>
      </div>

      <!-- No Data State -->
      <div v-else-if="regionStats.length === 0" class="text-center py-20 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <svg class="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No regional data yet</h3>
        <p class="text-gray-500 mb-6 max-w-sm mx-auto">
          Run scans from different regions to see comparative statistics here.
        </p>
      </div>

      <template v-else>
        <!-- Hero Card - Best Performing Region -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div class="px-5 py-4 flex items-center justify-between border-l-4 border-l-brand">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <span class="text-2xl">{{ getCountryFlag(bestRegion?.region || 'local') }}</span>
              </div>
              <div>
                <div class="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Best Performing Region</div>
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-bold text-gray-900">{{ bestRegion?.mentionRate || 0 }}</span>
                  <span class="text-lg font-medium text-gray-400">%</span>
                </div>
                <div class="text-xs text-gray-500 mt-0.5">{{ getCountryName(bestRegion?.region || 'local') }}</div>
              </div>
            </div>
            <div class="hidden sm:flex items-center gap-3">
              <div class="text-center px-3 py-1.5 bg-gray-50 rounded-lg">
                <div class="text-base font-bold text-gray-900">{{ regionStats.length }}</div>
                <div class="text-[10px] text-gray-500">Regions</div>
              </div>
              <div class="text-center px-3 py-1.5 bg-gray-50 rounded-lg">
                <div class="text-base font-bold text-gray-900">{{ totalTests }}</div>
                <div class="text-[10px] text-gray-500">Total Tests</div>
              </div>
              <div class="text-center px-3 py-1.5 bg-gray-50 rounded-lg">
                <div class="text-base font-bold text-gray-900">{{ avgMentionRate }}%</div>
                <div class="text-[10px] text-gray-500">Avg Rate</div>
              </div>
              <div class="text-center px-3 py-1.5 bg-amber-50 rounded-lg">
                <div class="text-base font-bold text-amber-600">{{ variancePercent }}%</div>
                <div class="text-[10px] text-amber-600">Variance</div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Main Bar Chart -->
          <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-1 h-4 rounded-full bg-brand"></div>
                <div>
                  <h2 class="text-sm font-semibold text-gray-900">Mention Rate by Region</h2>
                  <p class="text-[10px] text-gray-500 mt-0.5">Regional performance comparison</p>
                </div>
              </div>
              <div class="flex items-center gap-1 bg-gray-100/80 rounded-lg p-0.5">
                <button
                  v-for="metric in metrics"
                  :key="metric.value"
                  @click="selectedMetric = metric.value"
                  class="px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200"
                  :class="selectedMetric === metric.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                >
                  {{ metric.label }}
                </button>
              </div>
            </div>
            <div class="p-4">
              <div class="h-64">
                <canvas ref="chartCanvas"></canvas>
              </div>
            </div>
          </div>

          <!-- Region Ranking List -->
          <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div class="px-4 py-3 border-b border-gray-100/80 flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-emerald-500"></div>
              <div>
                <h2 class="text-sm font-semibold text-gray-900">Region Rankings</h2>
                <p class="text-[10px] text-gray-500 mt-0.5">Sorted by mention rate</p>
              </div>
            </div>
            <div class="p-4">
              <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
                <div
                  v-for="(stat, idx) in regionStats"
                  :key="stat.region"
                  class="flex items-center gap-3"
                >
                  <span class="text-xs text-gray-400 w-4 font-medium flex-shrink-0">{{ idx + 1 }}</span>
                  <span class="text-xl flex-shrink-0">{{ getCountryFlag(stat.region) }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                      <div class="flex items-center gap-1.5">
                        <span class="font-medium text-sm text-gray-900">{{ getCountryName(stat.region) }}</span>
                        <span
                          v-if="idx === 0"
                          class="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded-full"
                        >
                          Best
                        </span>
                      </div>
                      <span class="text-sm font-semibold text-gray-900">{{ stat.mentionRate }}%</span>
                    </div>
                    <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :class="idx === 0 ? 'bg-gradient-to-r from-brand to-amber-400' : 'bg-gray-400'"
                        :style="{ width: `${stat.mentionRate}%` }"
                      ></div>
                    </div>
                    <div class="text-[10px] text-gray-400 mt-0.5">{{ stat.total }} tests · {{ stat.citationRate }}% cited</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Platform x Region Comparison -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-violet-500"></div>
              <div>
                <h2 class="text-sm font-semibold text-gray-900">Platform Performance by Region</h2>
                <p class="text-[10px] text-gray-500 mt-0.5">Mention rates for each AI platform across regions</p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-emerald-100"></span> ≥50%</span>
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-amber-100"></span> 25-49%</span>
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-red-100"></span> &lt;25%</span>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100/80">
                  <th class="text-left px-4 py-3 font-medium bg-gray-50/50">Platform</th>
                  <th
                    v-for="stat in regionStats"
                    :key="stat.region"
                    class="text-center px-4 py-3 font-medium"
                  >
                    <div class="flex flex-col items-center gap-0.5">
                      <span class="text-base">{{ getCountryFlag(stat.region) }}</span>
                      <span class="text-[10px] text-gray-400 normal-case">{{ getCountryName(stat.region) }}</span>
                    </div>
                  </th>
                  <th class="text-center px-4 py-3 font-medium bg-gray-50/50">Average</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100/50">
                <tr v-for="platform in matrixPlatforms" :key="platform" class="hover:bg-gray-50/50 transition-colors">
                  <td class="px-4 py-3 bg-gray-50/30">
                    <div class="flex items-center gap-2">
                      <img
                        :src="getPlatformLogo(platform)"
                        :alt="platform"
                        class="w-5 h-5 rounded"
                        @error="($event.target as HTMLImageElement).style.display = 'none'"
                      />
                      <span class="font-medium text-sm text-gray-900">{{ formatModelName(platform) }}</span>
                    </div>
                  </td>
                  <td
                    v-for="stat in regionStats"
                    :key="`${platform}-${stat.region}`"
                    class="px-4 py-3 text-center"
                  >
                    <span
                      class="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold min-w-[3rem] justify-center"
                      :class="getMatrixCellClass(getPlatformRegionRate(platform, stat.region))"
                    >
                      {{ getPlatformRegionRate(platform, stat.region) !== null ? `${getPlatformRegionRate(platform, stat.region)}%` : '—' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center bg-gray-50/30">
                    <span class="text-sm font-semibold text-gray-700">
                      {{ getPlatformAverage(platform) }}%
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot class="border-t border-gray-200">
                <tr class="bg-gray-50/50">
                  <td class="px-4 py-3 font-medium text-sm text-gray-700">Region Average</td>
                  <td
                    v-for="stat in regionStats"
                    :key="`avg-${stat.region}`"
                    class="px-4 py-3 text-center"
                  >
                    <span class="text-sm font-semibold text-gray-700">{{ stat.mentionRate }}%</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="text-sm font-bold text-brand">{{ avgMentionRate }}%</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Detailed Platform Charts per Region -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(stat, idx) in regionStats"
            :key="stat.region"
            class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ getCountryFlag(stat.region) }}</span>
                <div>
                  <h3 class="font-semibold text-gray-900 text-sm">{{ getCountryName(stat.region) }}</h3>
                  <p class="text-[10px] text-gray-500">{{ stat.total }} tests</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-lg font-bold" :class="idx === 0 ? 'text-brand' : 'text-gray-900'">{{ stat.mentionRate }}%</div>
                <div class="text-[10px] text-gray-400">mention rate</div>
              </div>
            </div>
            <div class="p-4">
              <!-- Platform breakdown bars -->
              <div class="space-y-2.5">
                <div
                  v-for="ps in stat.platformStats"
                  :key="ps.platform"
                  class="group"
                >
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                      <img
                        :src="getPlatformLogo(ps.platform)"
                        :alt="ps.platform"
                        class="w-4 h-4 rounded"
                        @error="($event.target as HTMLImageElement).style.display = 'none'"
                      />
                      <span class="text-xs text-gray-600">{{ formatModelName(ps.platform) }}</span>
                    </div>
                    <span class="text-xs font-semibold text-gray-900">{{ ps.mentionRate }}%</span>
                  </div>
                  <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="ps.mentionRate >= 50 ? 'bg-emerald-500' : ps.mentionRate >= 25 ? 'bg-amber-500' : 'bg-red-400'"
                      :style="{ width: `${ps.mentionRate}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Brand cited rate footer -->
              <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span class="text-gray-500">Brand Cited Rate</span>
                <span class="font-semibold text-gray-700">{{ stat.citationRate }}%</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import Chart from 'chart.js/auto'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const supabase = useSupabaseClient()
const { activeProductId, initialized: productInitialized } = useActiveProduct()
const { getCountryFlag, getCountryName } = useRegionFilter()
const { formatModelName, platforms: aiPlatforms } = useAIPlatforms()

const loading = ref(true)
const selectedPeriod = ref('30')
const selectedMetric = ref<'mention' | 'citation'>('mention')
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const periods = [
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' }
]

interface PlatformStat {
  platform: string
  total: number
  mentioned: number
  mentionRate: number
}

interface RegionStat {
  region: string
  total: number
  mentioned: number
  cited: number
  mentionRate: number
  citationRate: number
  platformStats: PlatformStat[]
}

const regionStats = ref<RegionStat[]>([])
const platformRegionMatrix = ref<Map<string, Map<string, { total: number; mentioned: number }>>>(new Map())

const metrics = [
  { value: 'mention', label: 'Mentions' },
  { value: 'citation', label: 'Cited' }
]

const totalTests = computed(() => regionStats.value.reduce((sum, s) => sum + s.total, 0))

const bestRegion = computed(() => regionStats.value[0] || null)

const avgMentionRate = computed(() => {
  if (regionStats.value.length === 0) return 0
  const sum = regionStats.value.reduce((acc, s) => acc + s.mentionRate, 0)
  return Math.round(sum / regionStats.value.length)
})

const variancePercent = computed(() => {
  if (regionStats.value.length < 2) return 0
  const rates = regionStats.value.map(s => s.mentionRate)
  const max = Math.max(...rates)
  const min = Math.min(...rates)
  return max - min
})

const matrixPlatforms = computed(() => {
  const platforms = new Set<string>()
  for (const stat of regionStats.value) {
    for (const ps of stat.platformStats) {
      platforms.add(ps.platform)
    }
  }
  return Array.from(platforms).sort()
})

const getPlatformLogo = (platformId: string): string => {
  const platform = aiPlatforms.value.find(p => p.id.toLowerCase() === platformId.toLowerCase())
  return platform?.logo_url || ''
}

const getPlatformRegionRate = (platform: string, region: string): number | null => {
  const regionData = platformRegionMatrix.value.get(region)
  if (!regionData) return null
  const platformData = regionData.get(platform)
  if (!platformData || platformData.total === 0) return null
  return Math.round((platformData.mentioned / platformData.total) * 100)
}

const getPlatformAverage = (platform: string): number => {
  let total = 0
  let mentioned = 0
  for (const [, regionData] of platformRegionMatrix.value) {
    const platformData = regionData.get(platform)
    if (platformData) {
      total += platformData.total
      mentioned += platformData.mentioned
    }
  }
  return total > 0 ? Math.round((mentioned / total) * 100) : 0
}

const getMatrixCellClass = (rate: number | null) => {
  if (rate === null) return 'bg-gray-100 text-gray-400'
  if (rate >= 50) return 'bg-emerald-100 text-emerald-700'
  if (rate >= 25) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

watch(activeProductId, async (newProductId) => {
  if (newProductId) {
    await loadRegionStats()
  }
})

watch(selectedPeriod, async () => {
  if (activeProductId.value) {
    await loadRegionStats()
  }
})

watch(selectedMetric, () => {
  renderChart()
})

onMounted(async () => {
  if (productInitialized.value && activeProductId.value) {
    await loadRegionStats()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadRegionStats()
        unwatch()
      }
    })
  }
})

const loadRegionStats = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const daysAgo = parseInt(selectedPeriod.value)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    const { data } = await supabase
      .from('prompt_results')
      .select('request_country, ai_model, brand_mentioned, citation_present')
      .eq('product_id', productId)
      .gte('tested_at', startDate.toISOString())

    if (!data || data.length === 0) {
      regionStats.value = []
      platformRegionMatrix.value = new Map()
      loading.value = false
      return
    }

    // Aggregate by region
    const regionMap = new Map<string, {
      total: number
      mentioned: number
      cited: number
      platformStats: Map<string, { total: number; mentioned: number }>
    }>()

    // Also build platform x region matrix
    const matrix = new Map<string, Map<string, { total: number; mentioned: number }>>()

    for (const row of data) {
      const region = row.request_country || 'local'
      const platform = row.ai_model?.toLowerCase() || 'unknown'

      // Region stats
      if (!regionMap.has(region)) {
        regionMap.set(region, {
          total: 0,
          mentioned: 0,
          cited: 0,
          platformStats: new Map()
        })
      }

      const regionData = regionMap.get(region)!
      regionData.total++
      if (row.brand_mentioned) regionData.mentioned++
      if (row.citation_present) regionData.cited++

      // Platform stats within region
      if (!regionData.platformStats.has(platform)) {
        regionData.platformStats.set(platform, { total: 0, mentioned: 0 })
      }
      const platformData = regionData.platformStats.get(platform)!
      platformData.total++
      if (row.brand_mentioned) platformData.mentioned++

      // Matrix
      if (!matrix.has(region)) {
        matrix.set(region, new Map())
      }
      const matrixRegion = matrix.get(region)!
      if (!matrixRegion.has(platform)) {
        matrixRegion.set(platform, { total: 0, mentioned: 0 })
      }
      const matrixPlatform = matrixRegion.get(platform)!
      matrixPlatform.total++
      if (row.brand_mentioned) matrixPlatform.mentioned++
    }

    // Convert to array and sort by mention rate
    regionStats.value = Array.from(regionMap.entries())
      .map(([region, data]) => ({
        region,
        total: data.total,
        mentioned: data.mentioned,
        cited: data.cited,
        mentionRate: data.total > 0 ? Math.round((data.mentioned / data.total) * 100) : 0,
        citationRate: data.total > 0 ? Math.round((data.cited / data.total) * 100) : 0,
        platformStats: Array.from(data.platformStats.entries())
          .map(([platform, ps]) => ({
            platform,
            total: ps.total,
            mentioned: ps.mentioned,
            mentionRate: ps.total > 0 ? Math.round((ps.mentioned / ps.total) * 100) : 0
          }))
          .sort((a, b) => b.mentionRate - a.mentionRate)
      }))
      .sort((a, b) => b.mentionRate - a.mentionRate)

    platformRegionMatrix.value = matrix
  } catch (error) {
    console.error('Error loading region stats:', error)
  } finally {
    loading.value = false
    // Render chart after loading is complete and DOM is updated
    await nextTick()

    // Retry mechanism for chart rendering
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
    tryRenderChart()
  }
}

const renderChart = () => {
  if (!chartCanvas.value || regionStats.value.length === 0) return

  if (chart) {
    chart.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  const labels = regionStats.value.map(s => getCountryName(s.region))
  const data = selectedMetric.value === 'mention'
    ? regionStats.value.map(s => s.mentionRate)
    : regionStats.value.map(s => s.citationRate)

  // Softer color palette based on performance
  const colors = data.map(rate => {
    if (rate >= 50) return '#10b981' // emerald-500
    if (rate >= 25) return '#f59e0b' // amber-500
    return '#ef4444' // red-500
  })

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: selectedMetric.value === 'mention' ? 'Mention Rate' : 'Brand Cited Rate',
        data,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y}%`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: '#6b7280' }
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: '#f3f4f6' },
          ticks: {
            font: { size: 11 },
            color: '#9ca3af',
            callback: (v) => `${v}%`
          }
        }
      }
    }
  })
}

onUnmounted(() => {
  if (chart) {
    chart.destroy()
  }
})
</script>
