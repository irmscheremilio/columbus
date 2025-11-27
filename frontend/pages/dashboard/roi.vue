<template>
  <div class="min-h-screen bg-gray-50">
    <div class="p-4 lg:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">ROI Calculator</h1>
          <p class="text-sm text-gray-500">Track return on investment from AI visibility</p>
        </div>
        <select
          v-model="selectedPeriod"
          @change="loadData"
          class="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
        >
          <option :value="7">Last 7 days</option>
          <option :value="14">Last 14 days</option>
          <option :value="30">Last 30 days</option>
          <option :value="90">Last 90 days</option>
        </select>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">AI Sessions</div>
          <div class="text-lg font-bold text-gray-900">{{ formatNumber(summary.totalSessions) }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Conversions</div>
          <div class="text-lg font-bold text-green-600">{{ formatNumber(summary.totalConversions) }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Conv. Rate</div>
          <div class="text-lg font-bold text-blue-600">{{ summary.conversionRate.toFixed(1) }}%</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Revenue</div>
          <div class="text-lg font-bold text-gray-900">${{ formatNumber(summary.conversionValue) }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">ROI</div>
          <div class="text-lg font-bold" :class="summary.roiPercentage >= 0 ? 'text-brand' : 'text-red-600'">
            {{ summary.roiPercentage >= 0 ? '+' : '' }}{{ summary.roiPercentage.toFixed(0) }}%
          </div>
        </div>
      </div>

      <!-- Chart and Sources Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <!-- Trend Chart -->
        <div class="lg:col-span-2 bg-white rounded-lg border border-gray-200">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-900">AI Traffic & Revenue Trends</h2>
            <div class="flex items-center gap-4 text-xs">
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                <span class="text-gray-500">Sessions</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-green-500"></div>
                <span class="text-gray-500">Revenue</span>
              </div>
            </div>
          </div>
          <div class="p-4">
            <div class="relative h-64">
              <div v-if="chartLoading" class="absolute inset-0 flex items-center justify-center">
                <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
              </div>
              <canvas ref="roiChartCanvas"></canvas>
            </div>
            <div v-if="showingDummyData" class="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 flex items-center gap-2">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Showing sample data. Install SDK to track real AI traffic.</span>
            </div>
          </div>
        </div>

        <!-- Traffic by Source -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-900">By AI Source</h2>
          </div>
          <div class="p-4">
            <div v-if="loading" class="flex items-center justify-center py-8">
              <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
            </div>
            <div v-else-if="topSources.length === 0" class="text-center py-8 text-sm text-gray-500">
              No traffic data yet
            </div>
            <div v-else class="space-y-3">
              <div v-for="source in topSources" :key="source.source" class="flex items-center gap-3">
                <div class="w-16 flex-shrink-0">
                  <span class="text-xs font-medium text-gray-900 capitalize">{{ source.source }}</span>
                </div>
                <div class="flex-1">
                  <div class="h-4 bg-gray-100 rounded overflow-hidden">
                    <div
                      class="h-full bg-brand rounded transition-all"
                      :style="{ width: `${(source.sessions / maxSessions) * 100}%` }"
                    ></div>
                  </div>
                </div>
                <div class="w-12 text-right">
                  <span class="text-xs font-medium text-gray-900">{{ formatNumber(source.sessions) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Record Conversion & Settings -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <!-- Record Conversion -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="text-sm font-semibold text-gray-900 mb-3">Record Conversion</h2>
          <form @submit.prevent="recordConversion" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Event Name</label>
                <input
                  v-model="newConversion.eventName"
                  type="text"
                  placeholder="e.g., purchase"
                  required
                  class="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">AI Source</label>
                <select
                  v-model="newConversion.source"
                  required
                  class="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="chatgpt">ChatGPT</option>
                  <option value="claude">Claude</option>
                  <option value="gemini">Gemini</option>
                  <option value="perplexity">Perplexity</option>
                  <option value="copilot">Copilot</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Value ($)</label>
              <input
                v-model.number="newConversion.value"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <button
              type="submit"
              :disabled="recording"
              class="w-full py-1.5 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand/90 transition-colors disabled:opacity-50"
            >
              {{ recording ? 'Recording...' : 'Record Conversion' }}
            </button>
          </form>
        </div>

        <!-- ROI Settings -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="text-sm font-semibold text-gray-900 mb-3">ROI Settings</h2>
          <form @submit.prevent="saveSettings" class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Conversion Goal</label>
              <input
                v-model="settings.conversionGoal"
                type="text"
                placeholder="e.g., purchase, signup"
                class="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Avg Conversion Value ($)</label>
              <input
                v-model.number="settings.avgConversionValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <button
              type="submit"
              :disabled="savingSettings"
              class="w-full py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {{ savingSettings ? 'Saving...' : 'Save Settings' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Recent Conversions Table -->
      <div class="bg-white rounded-lg border border-gray-200">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-900">Recent Conversions</h2>
          <span class="text-xs text-gray-500">{{ recentConversions.length }} conversions</span>
        </div>

        <div v-if="recentConversions.length === 0" class="text-center py-12 text-sm text-gray-500">
          No conversions recorded yet
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th class="text-left px-4 py-2 font-medium">Event</th>
                <th class="text-center px-4 py-2 font-medium">Source</th>
                <th class="text-center px-4 py-2 font-medium hidden sm:table-cell">Date</th>
                <th class="text-right px-4 py-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="conv in recentConversions"
                :key="conv.id"
                class="text-sm hover:bg-gray-50"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                      <svg class="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span class="font-medium text-gray-900">{{ conv.event_name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                    {{ conv.source }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center hidden sm:table-cell">
                  <span class="text-xs text-gray-500">{{ formatDate(conv.occurred_at) }}</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <span class="font-medium text-green-600">${{ conv.value?.toFixed(2) || '0.00' }}</span>
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
import Chart from 'chart.js/auto'
import { useActiveProduct } from '~/composables/useActiveProduct'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const supabase = useSupabaseClient()
const { activeProduct } = useActiveProduct()

const loading = ref(true)
const chartLoading = ref(true)
const recording = ref(false)
const savingSettings = ref(false)
const selectedPeriod = ref(30)

const roiChartCanvas = ref<HTMLCanvasElement | null>(null)
let roiChart: Chart | null = null

const summary = ref({
  totalSessions: 0,
  totalConversions: 0,
  conversionValue: 0,
  conversionRate: 0,
  roiPercentage: 0
})

const topSources = ref<any[]>([])
const recentConversions = ref<any[]>([])
const trafficTrend = ref<any[]>([])
const showingDummyData = ref(false)

const newConversion = ref({
  eventName: '',
  source: 'chatgpt',
  value: 0
})

const settings = ref({
  conversionGoal: '',
  avgConversionValue: 0
})

const maxSessions = computed(() => {
  return Math.max(...topSources.value.map(s => s.sessions), 1)
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const productId = activeProduct.value?.id

    const { data, error } = await supabase.functions.invoke('roi-calculator', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      method: 'GET',
      query: {
        action: 'summary',
        days: selectedPeriod.value.toString(),
        ...(productId && { productId })
      }
    })

    if (error) throw error

    if (data?.summary) {
      summary.value = {
        totalSessions: data.summary.total_ai_sessions || data.summary.totalSessions || 0,
        totalConversions: data.summary.total_conversions || data.summary.totalConversions || 0,
        conversionValue: data.summary.total_conversion_value || data.summary.conversionValue || 0,
        conversionRate: (data.summary.conversion_rate || data.summary.conversionRate || 0) * 100,
        roiPercentage: data.summary.roi_percentage || 0
      }
    }

    trafficTrend.value = data?.trafficTrend || []

    if (data?.trafficTrend && data.trafficTrend.length > 0) {
      const sourceMap = new Map()
      for (const item of data.trafficTrend) {
        const existing = sourceMap.get(item.source) || { sessions: 0, conversions: 0 }
        existing.sessions += item.sessions || 0
        existing.conversions += item.conversions || 0
        sourceMap.set(item.source, existing)
      }
      topSources.value = Array.from(sourceMap.entries())
        .map(([source, data]) => ({ source, ...data }))
        .sort((a, b) => b.sessions - a.sessions)
    }

    nextTick(() => {
      renderChart(trafficTrend.value)
    })

    recentConversions.value = data?.recentConversions || []

    if (data?.integration) {
      settings.value = {
        conversionGoal: data.integration.conversionGoal || '',
        avgConversionValue: data.integration.avgConversionValue || 0
      }
    }
  } catch (error) {
    console.error('Error loading ROI data:', error)
  } finally {
    loading.value = false
  }
}

const recordConversion = async () => {
  recording.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const productId = activeProduct.value?.id

    const { error } = await supabase.functions.invoke('roi-calculator', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: {
        eventName: newConversion.value.eventName,
        source: newConversion.value.source,
        value: newConversion.value.value
      },
      method: 'POST',
      query: {
        action: 'record-conversion',
        ...(productId && { productId })
      }
    })

    if (error) throw error

    newConversion.value = { eventName: '', source: 'chatgpt', value: 0 }
    await loadData()
  } catch (error: any) {
    console.error('Error recording conversion:', error)
    alert(`Failed to record conversion: ${error.message}`)
  } finally {
    recording.value = false
  }
}

const saveSettings = async () => {
  savingSettings.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const productId = activeProduct.value?.id

    const { error } = await supabase.functions.invoke('roi-calculator', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: {
        conversionGoal: settings.value.conversionGoal,
        avgConversionValue: settings.value.avgConversionValue
      },
      method: 'POST',
      query: {
        action: 'save-settings',
        ...(productId && { productId })
      }
    })

    if (error) throw error
    alert('Settings saved!')
  } catch (error: any) {
    console.error('Error saving settings:', error)
    alert(`Failed to save settings: ${error.message}`)
  } finally {
    savingSettings.value = false
  }
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const renderChart = (trafficTrend: any[]) => {
  if (!roiChartCanvas.value) return

  if (roiChart) {
    roiChart.destroy()
  }

  const ctx = roiChartCanvas.value.getContext('2d')
  if (!ctx) return

  const dateMap = new Map<string, { sessions: number, revenue: number }>()

  const today = new Date()
  for (let i = selectedPeriod.value - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    dateMap.set(dateStr, { sessions: 0, revenue: 0 })
  }

  for (const item of trafficTrend || []) {
    const dateStr = item.date
    if (dateMap.has(dateStr)) {
      const existing = dateMap.get(dateStr)!
      existing.sessions += item.sessions || 0
      existing.revenue += item.conversion_value || 0
    }
  }

  const labels: string[] = []
  const sessionsData: number[] = []
  const revenueData: number[] = []

  for (const [dateStr, data] of dateMap) {
    const date = new Date(dateStr)
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    sessionsData.push(data.sessions)
    revenueData.push(data.revenue)
  }

  const hasRealData = sessionsData.some(s => s > 0) || revenueData.some(r => r > 0)
  showingDummyData.value = !hasRealData

  if (!hasRealData) {
    const dummyData = generateDummyChartData()
    sessionsData.length = 0
    revenueData.length = 0
    sessionsData.push(...dummyData.sessions)
    revenueData.push(...dummyData.revenue)
  }

  roiChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'AI Sessions',
          data: sessionsData,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f620',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 4,
          yAxisID: 'y'
        },
        {
          label: 'Revenue ($)',
          data: revenueData,
          borderColor: '#22c55e',
          backgroundColor: '#22c55e20',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 10,
          titleFont: { size: 11 },
          bodyFont: { size: 11 },
          callbacks: {
            label: (context) => {
              const value = context.parsed.y
              if (context.datasetIndex === 0) {
                return `Sessions: ${value.toLocaleString()}`
              }
              return `Revenue: $${value.toLocaleString()}`
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
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: '#f3f4f6' },
          ticks: { font: { size: 10 }, color: '#9ca3af' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { font: { size: 10 }, color: '#9ca3af', callback: (value) => `$${value}` }
        }
      }
    }
  })

  chartLoading.value = false
}

const generateDummyChartData = () => {
  const sessions: number[] = []
  const revenue: number[] = []

  let sessionValue = 50
  let revenueValue = 200

  for (let i = 0; i < selectedPeriod.value; i++) {
    sessionValue += Math.round((Math.random() - 0.4) * 20)
    sessionValue = Math.max(10, sessionValue)
    sessions.push(sessionValue)

    revenueValue += Math.round((Math.random() - 0.4) * 100)
    revenueValue = Math.max(50, revenueValue)
    revenue.push(revenueValue)
  }

  return { sessions, revenue }
}

watch(selectedPeriod, async () => {
  chartLoading.value = true
  await loadData()
})

watch(() => activeProduct.value?.id, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    chartLoading.value = true
    await loadData()
  }
})

onUnmounted(() => {
  if (roiChart) {
    roiChart.destroy()
  }
})
</script>
