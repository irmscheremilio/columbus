<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Scan History</h1>
          <p class="text-sm text-gray-500">View all scan sessions and their results</p>
        </div>
        <NuxtLink
          to="/dashboard/visibility"
          class="inline-flex items-center gap-2 px-4 py-2 text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Visibility
        </NuxtLink>
      </div>

      <!-- Scan Sessions List -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/50 to-transparent">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-900">Recent Scans</h2>
            <span class="text-xs text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-full">
              {{ totalScans }} total
            </span>
          </div>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
        </div>

        <div v-else-if="!scanSessions.length" class="text-center py-12 text-sm text-gray-500">
          <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          No scan sessions yet. Run a visibility scan to see history here.
        </div>

        <div v-else>
          <!-- Session Cards -->
          <div class="divide-y divide-gray-100/80">
            <div
              v-for="session in scanSessions"
              :key="session.scan_session_id"
              class="p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
              @click="toggleSession(session.scan_session_id)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      Scan {{ formatDate(session.started_at) }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ session.total_prompts }} prompts across {{ session.platforms?.length || 1 }} platform(s)
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <div class="hidden sm:flex items-center gap-3">
                    <div class="text-center">
                      <div class="text-xs font-medium text-emerald-600">{{ session.mention_rate }}%</div>
                      <div class="text-[10px] text-gray-400">Mentions</div>
                    </div>
                    <div class="text-center">
                      <div class="text-xs font-medium text-brand">{{ session.citation_rate }}%</div>
                      <div class="text-[10px] text-gray-400">Citations</div>
                    </div>
                  </div>
                  <svg
                    class="w-5 h-5 text-gray-400 transition-transform duration-200"
                    :class="{ 'rotate-180': expandedSession === session.scan_session_id }"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <!-- Expanded Session Results -->
              <div
                v-if="expandedSession === session.scan_session_id"
                class="mt-4 pt-4 border-t border-gray-100"
                @click.stop
              >
                <div v-if="loadingResults" class="flex items-center justify-center py-6">
                  <div class="animate-spin rounded-full h-5 w-5 border-2 border-brand border-t-transparent"></div>
                </div>
                <div v-else-if="sessionResults.length === 0" class="text-center py-6 text-sm text-gray-500">
                  No results found for this scan session.
                </div>
                <div v-else class="space-y-4">
                  <!-- Sources Donut Chart -->
                  <div v-if="sessionSources.length > 0" class="bg-gray-50/80 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Citation Sources</h3>
                      <span class="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                        {{ totalSessionCitations }} citations
                      </span>
                    </div>
                    <div class="flex flex-col sm:flex-row items-center gap-4">
                      <!-- Donut Chart -->
                      <div class="relative w-28 h-28 flex-shrink-0">
                        <canvas :id="`sources-chart-${session.scan_session_id}`"></canvas>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                          <span class="text-lg font-bold text-gray-900">{{ brandSourcePercent }}%</span>
                          <span class="text-[9px] text-gray-500">Your site</span>
                        </div>
                      </div>
                      <!-- Legend -->
                      <div class="flex-1 w-full">
                        <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div
                            v-for="(source, idx) in topSources"
                            :key="source.domain"
                            class="flex items-center justify-between text-xs py-1"
                          >
                            <div class="flex items-center gap-1.5 min-w-0">
                              <div
                                class="w-2 h-2 rounded-full flex-shrink-0"
                                :style="{ backgroundColor: getSourceColor(idx, source.isBrand) }"
                              ></div>
                              <span class="truncate" :class="source.isBrand ? 'font-medium text-emerald-600' : 'text-gray-600'">
                                {{ source.domain }}
                              </span>
                            </div>
                            <span class="text-gray-900 font-medium ml-1">{{ source.count }}</span>
                          </div>
                        </div>
                        <div v-if="sessionSources.length > 5" class="mt-1 text-[10px] text-gray-400">
                          +{{ sessionSources.length - 5 }} more sources
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="bg-gray-50/80 rounded-xl p-4 text-center">
                    <p class="text-xs text-gray-500">No citations detected in this scan</p>
                  </div>

                  <!-- Results Table -->
                  <div class="overflow-x-auto -mx-4">
                  <table class="w-full">
                    <thead>
                      <tr class="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100/80">
                        <th class="text-left px-4 py-2 font-medium">Platform</th>
                        <th class="text-left px-4 py-2 font-medium">Prompt</th>
                        <th class="text-center px-4 py-2 font-medium">Mentioned</th>
                        <th class="text-center px-4 py-2 font-medium">Cited</th>
                        <th class="text-center px-4 py-2 font-medium">Limit</th>
                        <th class="text-center px-4 py-2 font-medium">Chat</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100/50">
                      <tr v-for="result in sessionResults" :key="result.id" class="text-sm">
                        <td class="px-4 py-2">
                          <span class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100/80 text-gray-700">
                            {{ formatModelName(result.ai_model) }}
                          </span>
                        </td>
                        <td class="px-4 py-2">
                          <div class="text-gray-900 truncate max-w-xs" :title="result.prompt">
                            {{ result.prompt }}
                          </div>
                        </td>
                        <td class="px-4 py-2 text-center">
                          <span
                            class="inline-flex w-5 h-5 rounded-full items-center justify-center text-xs"
                            :class="result.brand_mentioned ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'"
                          >
                            {{ result.brand_mentioned ? '✓' : '−' }}
                          </span>
                        </td>
                        <td class="px-4 py-2 text-center">
                          <span
                            class="inline-flex w-5 h-5 rounded-full items-center justify-center text-xs"
                            :class="result.citation_present ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-400'"
                          >
                            {{ result.citation_present ? '✓' : '−' }}
                          </span>
                        </td>
                        <td class="px-4 py-2 text-center">
                          <span
                            v-if="result.credits_exhausted"
                            class="inline-flex w-5 h-5 rounded-full items-center justify-center text-xs bg-amber-50 text-amber-600"
                            title="Credit limit exceeded"
                          >
                            ⚠
                          </span>
                          <span v-else class="text-gray-300">−</span>
                        </td>
                        <td class="px-4 py-2 text-center">
                          <a
                            v-if="result.chat_url"
                            :href="result.chat_url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex w-5 h-5 rounded items-center justify-center text-xs bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                            title="Open chat"
                            @click.stop
                          >
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <span v-else class="text-gray-300">−</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="px-4 py-3 border-t border-gray-100/80 flex items-center justify-between">
            <div class="text-xs text-gray-500">
              Page {{ currentPage }} of {{ totalPages }}
            </div>
            <div class="flex items-center gap-2">
              <button
                :disabled="currentPage <= 1"
                class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                :class="currentPage <= 1 ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'"
                @click="goToPage(currentPage - 1)"
              >
                Previous
              </button>
              <button
                :disabled="currentPage >= totalPages"
                class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                :class="currentPage >= totalPages ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'"
                @click="goToPage(currentPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
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

const supabase = useSupabaseClient()
const { activeProductId, initialized: productInitialized } = useActiveProduct()

const loading = ref(true)
const loadingResults = ref(false)
const scanSessions = ref<any[]>([])
const sessionResults = ref<any[]>([])
const sessionSources = ref<{ domain: string; count: number; isBrand: boolean }[]>([])
const totalSessionCitations = ref(0)
const brandSessionCitations = ref(0)
const expandedSession = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = 10
const totalScans = ref(0)
let sourcesChart: Chart | null = null

const sourceColors = [
  '#10b981', // emerald (brand)
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

const getSourceColor = (index: number, isBrand: boolean) => {
  if (isBrand) return '#10b981'
  return sourceColors[(index % (sourceColors.length - 1)) + 1]
}

const brandSourcePercent = computed(() => {
  if (totalSessionCitations.value === 0) return 0
  return Math.round((brandSessionCitations.value / totalSessionCitations.value) * 100)
})

const topSources = computed(() => sessionSources.value.slice(0, 5))

const totalPages = computed(() => Math.ceil(totalScans.value / pageSize))

watch(activeProductId, async (newProductId) => {
  if (newProductId) {
    currentPage.value = 1
    await loadScanSessions()
  }
})

onMounted(async () => {
  if (productInitialized.value && activeProductId.value) {
    await loadScanSessions()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadScanSessions()
        unwatch()
      }
    })
  }
})

const loadScanSessions = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    // Get count for pagination
    const { count } = await supabase
      .from('prompt_results')
      .select('scan_session_id', { count: 'exact', head: true })
      .eq('product_id', productId)
      .not('scan_session_id', 'is', null)

    // Get distinct scan sessions with stats
    const { data } = await supabase
      .from('prompt_results')
      .select('scan_session_id, ai_model, brand_mentioned, citation_present, tested_at')
      .eq('product_id', productId)
      .not('scan_session_id', 'is', null)
      .order('tested_at', { ascending: false })

    if (data) {
      // Group by scan_session_id and calculate stats
      const sessionMap = new Map<string, any>()

      for (const row of data) {
        if (!row.scan_session_id) continue

        if (!sessionMap.has(row.scan_session_id)) {
          sessionMap.set(row.scan_session_id, {
            scan_session_id: row.scan_session_id,
            started_at: row.tested_at,
            total_prompts: 0,
            mentioned_count: 0,
            cited_count: 0,
            platforms: new Set()
          })
        }

        const session = sessionMap.get(row.scan_session_id)
        session.total_prompts++
        if (row.brand_mentioned) session.mentioned_count++
        if (row.citation_present) session.cited_count++
        session.platforms.add(row.ai_model)
        if (new Date(row.tested_at) < new Date(session.started_at)) {
          session.started_at = row.tested_at
        }
      }

      // Convert to array and calculate rates
      const sessions = Array.from(sessionMap.values()).map(s => ({
        ...s,
        platforms: Array.from(s.platforms),
        mention_rate: s.total_prompts > 0 ? Math.round((s.mentioned_count / s.total_prompts) * 100) : 0,
        citation_rate: s.total_prompts > 0 ? Math.round((s.cited_count / s.total_prompts) * 100) : 0
      }))

      // Sort by date and paginate
      sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

      totalScans.value = sessions.length
      const start = (currentPage.value - 1) * pageSize
      scanSessions.value = sessions.slice(start, start + pageSize)
    }
  } catch (error) {
    console.error('Error loading scan sessions:', error)
  } finally {
    loading.value = false
  }
}

const toggleSession = async (sessionId: string) => {
  if (expandedSession.value === sessionId) {
    expandedSession.value = null
    sessionResults.value = []
    sessionSources.value = []
    if (sourcesChart) {
      sourcesChart.destroy()
      sourcesChart = null
    }
    return
  }

  expandedSession.value = sessionId
  loadingResults.value = true

  try {
    // Load prompt results for this session
    const { data } = await supabase
      .from('prompt_results')
      .select('*, prompts(prompt_text)')
      .eq('scan_session_id', sessionId)
      .order('tested_at', { ascending: true })

    sessionResults.value = data?.map(r => ({
      ...r,
      prompt: r.prompts?.prompt_text || 'Unknown prompt'
    })) || []

    // Load citations for this session's results
    const resultIds = sessionResults.value.map(r => r.id)
    if (resultIds.length > 0) {
      const { data: citations } = await supabase
        .from('prompt_citations')
        .select('source_domain, is_brand_source')
        .in('prompt_result_id', resultIds)

      // Aggregate by domain
      const domainCounts: Record<string, { count: number; isBrand: boolean }> = {}
      let total = 0
      let brand = 0

      for (const row of citations || []) {
        const key = row.source_domain
        if (!domainCounts[key]) {
          domainCounts[key] = { count: 0, isBrand: row.is_brand_source }
        }
        domainCounts[key].count++
        total++
        if (row.is_brand_source) brand++
      }

      sessionSources.value = Object.entries(domainCounts)
        .map(([domain, { count, isBrand }]) => ({ domain, count, isBrand }))
        .sort((a, b) => b.count - a.count)

      totalSessionCitations.value = total
      brandSessionCitations.value = brand

      // Render chart after DOM updates
      renderSourcesChart(sessionId)
    } else {
      sessionSources.value = []
      totalSessionCitations.value = 0
      brandSessionCitations.value = 0
    }
  } catch (error) {
    console.error('Error loading session results:', error)
    sessionResults.value = []
    sessionSources.value = []
  } finally {
    loadingResults.value = false
  }
}

const renderSourcesChart = async (sessionId: string) => {
  // Wait for DOM to be ready
  await nextTick()

  if (sessionSources.value.length === 0) return

  // Get canvas by ID
  const canvas = document.getElementById(`sources-chart-${sessionId}`) as HTMLCanvasElement | null
  if (!canvas) {
    // Retry after a short delay if DOM not ready
    setTimeout(() => renderSourcesChart(sessionId), 50)
    return
  }

  if (sourcesChart) {
    sourcesChart.destroy()
    sourcesChart = null
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Take top 5 for chart, rest in "Other"
  const chartSources = sessionSources.value.slice(0, 5)
  const otherCount = sessionSources.value.slice(5).reduce((sum, s) => sum + s.count, 0)

  const labels = chartSources.map(s => s.domain)
  const data = chartSources.map(s => s.count)
  const backgroundColors = chartSources.map((s, i) => getSourceColor(i, s.isBrand))

  if (otherCount > 0) {
    labels.push('Other')
    data.push(otherCount)
    backgroundColors.push('#9ca3af')
  }

  sourcesChart = new Chart(ctx, {
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
              const percent = Math.round((value / totalSessionCitations.value) * 100)
              return `${context.label}: ${value} (${percent}%)`
            }
          }
        }
      }
    }
  })
}

const goToPage = async (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  expandedSession.value = null
  sessionResults.value = []
  await loadScanSessions()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatModelName = (model: string) => {
  switch (model?.toLowerCase()) {
    case 'chatgpt': return 'GPT'
    case 'claude': return 'Claude'
    case 'gemini': return 'Gemini'
    case 'perplexity': return 'Pplx'
    default: return model
  }
}

onUnmounted(() => {
  if (sourcesChart) {
    sourcesChart.destroy()
  }
})
</script>
