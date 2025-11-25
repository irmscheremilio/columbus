<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardNav />

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Page header -->
      <div class="px-4 py-6 sm:px-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
              <svg class="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Reports</h1>
              <p class="text-gray-500">Generate and download AI visibility reports.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Generate Report Card -->
      <div class="px-4 py-4 sm:px-0">
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900">Generate New Report</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Executive Summary -->
            <div
              class="p-5 border-2 rounded-xl cursor-pointer transition-all"
              :class="selectedReportType === 'executive_summary' ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300'"
              @click="selectedReportType = 'executive_summary'"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div v-if="selectedReportType === 'executive_summary'" class="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                  <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 class="font-semibold text-gray-900 mb-1">Executive Summary</h3>
              <p class="text-sm text-gray-500">High-level overview of your AI visibility performance with key metrics and insights.</p>
            </div>

            <!-- Detailed Report -->
            <div
              class="p-5 border-2 rounded-xl cursor-pointer transition-all"
              :class="selectedReportType === 'detailed' ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300'"
              @click="selectedReportType = 'detailed'"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div v-if="selectedReportType === 'detailed'" class="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                  <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 class="font-semibold text-gray-900 mb-1">Detailed Report</h3>
              <p class="text-sm text-gray-500">Comprehensive analysis including prompt-level performance and recommendations.</p>
            </div>

            <!-- Competitor Analysis -->
            <div
              class="p-5 border-2 rounded-xl cursor-pointer transition-all"
              :class="selectedReportType === 'competitor_analysis' ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300'"
              @click="selectedReportType = 'competitor_analysis'"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg class="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div v-if="selectedReportType === 'competitor_analysis'" class="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                  <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 class="font-semibold text-gray-900 mb-1">Competitor Analysis</h3>
              <p class="text-sm text-gray-500">Compare your visibility against tracked competitors across AI platforms.</p>
            </div>
          </div>

          <div class="mt-6 flex items-center gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
              <select
                v-model="selectedPeriod"
                class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
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
              class="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50"
            >
              <svg v-if="generating" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ generating ? 'Generating...' : 'Generate Report' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Previous Reports -->
      <div class="px-4 py-4 sm:px-0">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900">Previous Reports</h2>
          </div>

          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
          </div>

          <div v-else-if="reports.length === 0" class="text-center py-12">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-500 mb-2">No reports generated yet</p>
            <p class="text-sm text-gray-400">Generate your first report above</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="report in reports"
              :key="report.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg class="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9h4v1h-4v-1zm0 2h4v1h-4v-1zm-2-2h1v1H8v-1zm0 2h1v1H8v-1zm0 2h1v1H8v-1zm2 0h4v1h-4v-1z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="font-medium text-gray-900">{{ formatReportType(report.report_type) }}</h3>
                  <p class="text-sm text-gray-500">
                    {{ formatDateRange(report.period_start, report.period_end) }}
                  </p>
                  <p class="text-xs text-gray-400 mt-0.5">Generated {{ formatDate(report.created_at) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <a
                  v-if="report.download_url"
                  :href="report.download_url"
                  target="_blank"
                  class="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors text-sm"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
                <span v-else class="px-3 py-1.5 bg-amber-100 text-amber-700 rounded text-sm">
                  Processing...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()

const loading = ref(true)
const generating = ref(false)
const reports = ref<any[]>([])
const selectedReportType = ref('executive_summary')
const selectedPeriod = ref(30)

onMounted(async () => {
  await loadReports()
})

const loadReports = async () => {
  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase.functions.invoke('generate-report', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      method: 'GET',
      query: { action: 'list' }
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
  generating.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('generate-report', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: {
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
  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}
</script>
