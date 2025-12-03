<template>
  <div class="min-h-screen bg-gray-50">
    <div class="p-4 lg:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Reports</h1>
          <p class="text-sm text-gray-500">Generate and download AI visibility reports</p>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Total Reports</div>
          <div class="text-lg font-bold text-gray-900">{{ reports.length }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Executive</div>
          <div class="text-lg font-bold text-green-600">{{ reportsByType.executive_summary || 0 }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Detailed</div>
          <div class="text-lg font-bold text-blue-600">{{ reportsByType.detailed || 0 }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Competitor</div>
          <div class="text-lg font-bold text-purple-600">{{ reportsByType.competitor_analysis || 0 }}</div>
        </div>
      </div>

      <!-- Generate Report Card -->
      <div class="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900">Generate New Report</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <!-- Executive Summary -->
          <button
            class="p-3 border-2 rounded-lg text-left transition-all"
            :class="selectedReportType === 'executive_summary' ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300'"
            @click="selectedReportType = 'executive_summary'"
          >
            <div class="flex items-center gap-2 mb-1">
              <div class="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                <svg class="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-900">Executive Summary</span>
              <div v-if="selectedReportType === 'executive_summary'" class="ml-auto w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                <svg class="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p class="text-xs text-gray-500">High-level overview with key metrics</p>
          </button>

          <!-- Detailed Report -->
          <button
            class="p-3 border-2 rounded-lg text-left transition-all"
            :class="selectedReportType === 'detailed' ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300'"
            @click="selectedReportType = 'detailed'"
          >
            <div class="flex items-center gap-2 mb-1">
              <div class="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                <svg class="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-900">Detailed Report</span>
              <div v-if="selectedReportType === 'detailed'" class="ml-auto w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                <svg class="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p class="text-xs text-gray-500">Comprehensive prompt-level analysis</p>
          </button>

          <!-- Competitor Analysis -->
          <button
            class="p-3 border-2 rounded-lg text-left transition-all"
            :class="selectedReportType === 'competitor_analysis' ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300'"
            @click="selectedReportType = 'competitor_analysis'"
          >
            <div class="flex items-center gap-2 mb-1">
              <div class="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                <svg class="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-900">Competitor Analysis</span>
              <div v-if="selectedReportType === 'competitor_analysis'" class="ml-auto w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                <svg class="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p class="text-xs text-gray-500">Compare visibility vs competitors</p>
          </button>
        </div>

        <div class="flex items-center gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Time Period</label>
            <select
              v-model="selectedPeriod"
              class="min-w-[140px] px-3 py-1.5 pr-8 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20fill%3d%22none%22%20viewBox%3d%220%200%2024%2024%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%222%22%3e%3cpath%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%20d%3d%22M19%209l-7%207-7-7%22%2f%3e%3c%2fsvg%3e')] bg-[length:16px_16px] bg-[right_8px_center] bg-no-repeat"
            >
              <option :value="7">Last 7 days</option>
              <option :value="14">Last 14 days</option>
              <option :value="30">Last 30 days</option>
              <option :value="90">Last 90 days</option>
            </select>
          </div>
          <div class="flex-1"></div>
          <button
            @click="generateReport"
            :disabled="generating"
            class="inline-flex items-center gap-2 px-4 py-1.5 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand/90 transition-colors disabled:opacity-50"
          >
            <svg v-if="generating" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ generating ? 'Generating...' : 'Generate Report' }}
          </button>
        </div>
      </div>

      <!-- Previous Reports Table -->
      <div class="bg-white rounded-lg border border-gray-200">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-900">Previous Reports</h2>
          <span class="text-xs text-gray-500">{{ reports.length }} reports</span>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
        </div>

        <div v-else-if="reports.length === 0" class="text-center py-12">
          <p class="text-sm text-gray-500 mb-2">No reports generated yet</p>
          <p class="text-xs text-gray-400">Generate your first report above</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th class="text-left px-4 py-2 font-medium">Report</th>
                <th class="text-left px-4 py-2 font-medium hidden sm:table-cell">Period</th>
                <th class="text-center px-4 py-2 font-medium hidden md:table-cell">Created</th>
                <th class="text-center px-4 py-2 font-medium">Status</th>
                <th class="text-right px-4 py-2 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="report in reports"
                :key="report.id"
                class="text-sm hover:bg-gray-50"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 rounded flex items-center justify-center"
                      :class="getReportTypeColor(report.report_type)"
                    >
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z"/>
                      </svg>
                    </div>
                    <div class="font-medium text-gray-900">{{ formatReportType(report.report_type) }}</div>
                  </div>
                </td>
                <td class="px-4 py-3 hidden sm:table-cell">
                  <span class="text-gray-500 text-xs">{{ formatDateRange(report.period_start, report.period_end) }}</span>
                </td>
                <td class="px-4 py-3 text-center hidden md:table-cell">
                  <span class="text-xs text-gray-500">{{ formatDate(report.created_at) }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    v-if="report.download_url"
                    class="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"
                  >
                    Ready
                  </span>
                  <span v-else class="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                    Processing
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <a
                    v-if="report.download_url"
                    :href="report.download_url"
                    target="_blank"
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-brand hover:text-brand/80 transition-colors"
                  >
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </a>
                  <span v-else class="text-xs text-gray-400">-</span>
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
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const supabase = useSupabaseClient()
const { activeProductId, initialized: productInitialized } = useActiveProduct()

const loading = ref(true)
const generating = ref(false)
const reports = ref<any[]>([])
const selectedReportType = ref('executive_summary')
const selectedPeriod = ref(30)

const reportsByType = computed(() => {
  const counts: Record<string, number> = {}
  reports.value.forEach(r => {
    counts[r.report_type] = (counts[r.report_type] || 0) + 1
  })
  return counts
})

watch(activeProductId, async (newProductId) => {
  if (newProductId) await loadReports()
})

onMounted(async () => {
  if (productInitialized.value && activeProductId.value) {
    await loadReports()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadReports()
        unwatch()
      }
    })
  }
})

const loadReports = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase.functions.invoke(`generate-report?action=list&productId=${productId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      method: 'GET'
    })

    if (error) throw error
    reports.value = data?.reports || []
  } catch (error) {
    console.error('Error loading reports:', error)
  } finally {
    loading.value = false
  }
}

const generateReport = async () => {
  const productId = activeProductId.value
  if (!productId) return

  generating.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { error } = await supabase.functions.invoke('generate-report', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: {
        productId,
        reportType: selectedReportType.value,
        periodDays: selectedPeriod.value
      }
    })

    if (error) throw error

    alert('Report generation started! It will appear in the list below when ready.')
    await loadReports()
  } catch (error: any) {
    console.error('Error generating report:', error)
    alert(`Failed to generate report: ${error.message}`)
  } finally {
    generating.value = false
  }
}

const formatReportType = (type: string) => {
  const types: Record<string, string> = {
    executive_summary: 'Executive Summary',
    detailed: 'Detailed Report',
    competitor_analysis: 'Competitor Analysis'
  }
  return types[type] || type
}

const getReportTypeColor = (type: string) => {
  switch (type) {
    case 'executive_summary': return 'bg-green-100 text-green-600'
    case 'detailed': return 'bg-blue-100 text-blue-600'
    case 'competitor_analysis': return 'bg-purple-100 text-purple-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatDateRange = (start: string, end: string) => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}
</script>
