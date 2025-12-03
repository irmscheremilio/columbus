<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Citation Sources</h1>
          <p class="text-sm text-gray-500">Track which sources AI models cite when mentioning your brand</p>
        </div>
        <div class="flex items-center gap-3">
          <select
            v-model="selectedPeriod"
            class="text-sm bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      <!-- Brand Citation Rate Hero Card -->
      <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
        <div class="px-5 py-4 flex items-center justify-between border-l-4 border-l-brand">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <div class="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Brand Citation Rate</div>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-bold text-gray-900">{{ stats.brandPercent }}</span>
                <span class="text-lg font-medium text-gray-400">%</span>
              </div>
            </div>
          </div>
          <div class="hidden sm:flex items-center gap-4">
            <div class="text-center px-3 py-1.5 bg-gray-50 rounded-lg">
              <div class="text-base font-bold text-gray-900">{{ stats.totalCitations }}</div>
              <div class="text-[10px] text-gray-500">Total Citations</div>
            </div>
            <div class="text-center px-3 py-1.5 bg-emerald-50 rounded-lg">
              <div class="text-base font-bold text-emerald-600">{{ stats.brandCitations }}</div>
              <div class="text-[10px] text-gray-500">Your Domain</div>
            </div>
            <div class="text-center px-3 py-1.5 bg-gray-50 rounded-lg">
              <div class="text-base font-bold text-gray-900">{{ stats.uniqueDomains }}</div>
              <div class="text-[10px] text-gray-500">Unique Sources</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Top Sources List -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center gap-2">
            <div class="w-1 h-4 rounded-full bg-brand"></div>
            <div>
              <h2 class="text-sm font-semibold text-gray-900">Top Citation Sources</h2>
              <p class="text-[10px] text-gray-500 mt-0.5">Most cited domains</p>
            </div>
          </div>

          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
          </div>

          <div v-else-if="sources.length === 0" class="text-center py-12 text-sm text-gray-500">
            No citation data available
          </div>

          <div v-else class="divide-y divide-gray-100/80">
            <div
              v-for="(source, idx) in sources.slice(0, 8)"
              :key="source.domain"
              class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors"
            >
              <div class="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                   :class="source.isBrand ? 'bg-emerald-100 text-emerald-700' : idx < 3 ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'">
                {{ idx + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-medium truncate" :class="source.isBrand ? 'text-brand' : 'text-gray-900'">
                    {{ source.domain }}
                  </span>
                  <span v-if="source.isBrand" class="px-1.5 py-0.5 text-[9px] font-medium bg-emerald-50 text-emerald-700 rounded-full shrink-0">
                    You
                  </span>
                </div>
                <div class="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="source.isBrand ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-brand to-amber-400'"
                    :style="{ width: `${Math.min((source.count / stats.totalCitations) * 100 * 2, 100)}%` }"
                  ></div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-sm font-bold text-gray-900">{{ Math.round((source.count / stats.totalCitations) * 100) }}%</div>
                <div class="text-[10px] text-gray-400">{{ source.count }} cites</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Donut Chart -->
        <div class="lg:col-span-2">
          <SourcesDonutChart :product-id="activeProductId" title="Citation Distribution" />
        </div>
      </div>

      <!-- Citation Details Table -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 hover:shadow-md transition-shadow duration-200">
        <div class="flex items-center justify-between p-4 pb-3 border-b border-gray-100/80">
          <div class="flex items-center gap-2">
            <div class="w-1 h-4 rounded-full bg-blue-500"></div>
            <h2 class="text-sm font-semibold text-gray-900">Recent Citations</h2>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search domains..."
              class="text-sm bg-gray-50/80 border border-gray-200/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/20 w-40"
            />
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full table-fixed">
            <thead class="bg-gray-50/50">
              <tr>
                <th class="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5 w-[140px]">Source</th>
                <th class="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5">URL</th>
                <th class="text-center text-[11px] font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5 w-[70px]">Chat</th>
                <th class="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5 w-[120px]">Date</th>
              </tr>
            </thead>
          </table>
          <div class="max-h-80 overflow-y-auto">
            <table class="w-full table-fixed">
              <tbody class="divide-y divide-gray-100/80">
                <tr
                  v-for="citation in paginatedCitations"
                  :key="citation.id"
                  class="hover:bg-gray-50/50 transition-colors"
                >
                  <td class="py-2.5 px-4 w-[140px]">
                    <div class="flex items-center gap-1.5">
                      <span
                        class="font-medium text-sm truncate"
                        :class="citation.is_brand_source ? 'text-brand' : 'text-gray-900'"
                        :title="citation.source_domain"
                      >
                        {{ citation.source_domain }}
                      </span>
                      <span
                        v-if="citation.is_brand_source"
                        class="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"
                        title="Your domain"
                      ></span>
                    </div>
                  </td>
                  <td class="py-2.5 px-4">
                    <a
                      :href="citation.url"
                      target="_blank"
                      class="text-sm text-blue-600 hover:text-blue-800 truncate block transition-colors"
                      :title="citation.url"
                    >
                      {{ citation.url }}
                    </a>
                  </td>
                  <td class="py-2.5 px-4 w-[70px] text-center">
                    <a
                      v-if="citation.chat_url"
                      :href="citation.chat_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex w-6 h-6 rounded items-center justify-center text-xs bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                      title="Open chat"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <span v-else class="text-gray-300">−</span>
                  </td>
                  <td class="py-2.5 px-4 w-[120px]">
                    <span class="text-xs text-gray-500 whitespace-nowrap">
                      {{ formatDate(citation.created_at) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="filteredCitations.length === 0" class="text-center py-8">
            <p class="text-sm text-gray-500">No citations found</p>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100/80 bg-gray-50/30">
          <span class="text-xs text-gray-500">
            Page {{ currentPage }} of {{ totalPages }} ({{ filteredCitations.length }} results)
          </span>
          <div class="flex items-center gap-1">
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
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
const { activeProductId } = useActiveProduct()
const { selectedRegion } = useRegionFilter()

const loading = ref(false)
const selectedPeriod = ref('30')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 20

interface Citation {
  id: string
  url: string
  source_domain: string
  source_title: string | null
  citation_text: string | null
  is_brand_source: boolean
  created_at: string
  chat_url: string | null
}

interface SourceData {
  domain: string
  count: number
  isBrand: boolean
}

const citations = ref<Citation[]>([])
const sources = ref<SourceData[]>([])
const totalCitations = ref(0)

const stats = computed(() => {
  const brandCitations = sources.value
    .filter(s => s.isBrand)
    .reduce((sum, s) => sum + s.count, 0)

  return {
    totalCitations: totalCitations.value,
    brandCitations,
    uniqueDomains: sources.value.length,
    brandPercent: totalCitations.value > 0
      ? Math.round((brandCitations / totalCitations.value) * 100)
      : 0
  }
})

const filteredCitations = computed(() => {
  let result = citations.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c =>
      c.source_domain.toLowerCase().includes(query) ||
      c.url.toLowerCase().includes(query)
    )
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredCitations.value.length / pageSize))

const paginatedCitations = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredCitations.value.slice(start, start + pageSize)
})

const loadData = async () => {
  if (!activeProductId.value) return

  loading.value = true
  try {
    // Build date filter
    let dateFilter: string | null = null
    if (selectedPeriod.value !== 'all') {
      const daysAgo = parseInt(selectedPeriod.value)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)
      dateFilter = startDate.toISOString()
    }

    // If region is selected, we need to filter citations by their linked prompt_results
    let filteredResultIds: string[] | null = null
    if (selectedRegion.value) {
      // First get prompt_result_ids that match the region filter
      let resultsQuery = supabase
        .from('prompt_results')
        .select('id')
        .eq('product_id', activeProductId.value)
        .ilike('request_country', selectedRegion.value)

      if (dateFilter) {
        resultsQuery = resultsQuery.gte('tested_at', dateFilter)
      }

      const { data: regionResults } = await resultsQuery
      filteredResultIds = (regionResults || []).map(r => r.id)

      if (filteredResultIds.length === 0) {
        // No results for this region
        citations.value = []
        sources.value = []
        totalCitations.value = 0
        loading.value = false
        return
      }
    }

    // First, get accurate total count
    let countQuery = supabase
      .from('prompt_citations')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', activeProductId.value)

    if (dateFilter) {
      countQuery = countQuery.gte('created_at', dateFilter)
    }

    if (filteredResultIds) {
      countQuery = countQuery.in('prompt_result_id', filteredResultIds)
    }

    const { count: exactCount } = await countQuery
    totalCitations.value = exactCount || 0

    // Load all citations for aggregation using pagination
    let allCitationsData: { source_domain: string; is_brand_source: boolean }[] = []
    let offset = 0
    const batchSize = 1000

    while (true) {
      let allCitationsQuery = supabase
        .from('prompt_citations')
        .select('source_domain, is_brand_source')
        .eq('product_id', activeProductId.value)
        .range(offset, offset + batchSize - 1)

      if (dateFilter) {
        allCitationsQuery = allCitationsQuery.gte('created_at', dateFilter)
      }

      if (filteredResultIds) {
        allCitationsQuery = allCitationsQuery.in('prompt_result_id', filteredResultIds)
      }

      const { data: batchData } = await allCitationsQuery
      if (!batchData || batchData.length === 0) break

      allCitationsData = allCitationsData.concat(batchData)
      if (batchData.length < batchSize) break
      offset += batchSize
    }

    // Aggregate sources from all citations
    const domainCounts: Record<string, { count: number; isBrand: boolean }> = {}
    for (const c of allCitationsData) {
      if (!domainCounts[c.source_domain]) {
        domainCounts[c.source_domain] = { count: 0, isBrand: c.is_brand_source }
      }
      domainCounts[c.source_domain].count++
    }

    // Load recent citations for table display (with limit)
    let query = supabase
      .from('prompt_citations')
      .select('*')
      .eq('product_id', activeProductId.value)
      .order('created_at', { ascending: false })
      .limit(500)

    if (dateFilter) {
      query = query.gte('created_at', dateFilter)
    }

    if (filteredResultIds) {
      query = query.in('prompt_result_id', filteredResultIds)
    }

    const { data: citationData, error } = await query

    if (error) throw error

    // Get unique prompt_result_ids to fetch chat_urls
    const resultIds = [...new Set((citationData || []).map(c => c.prompt_result_id).filter(Boolean))]

    // Fetch chat_urls for these results
    let chatUrlMap = new Map<string, string>()
    if (resultIds.length > 0) {
      const { data: results } = await supabase
        .from('prompt_results')
        .select('id, chat_url')
        .in('id', resultIds)
        .not('chat_url', 'is', null)

      for (const r of results || []) {
        if (r.chat_url) {
          chatUrlMap.set(r.id, r.chat_url)
        }
      }
    }

    // Map citations with chat_url
    citations.value = (citationData || []).map(c => ({
      ...c,
      chat_url: chatUrlMap.get(c.prompt_result_id) || null
    }))

    sources.value = Object.entries(domainCounts)
      .map(([domain, { count, isBrand }]) => ({ domain, count, isBrand }))
      .sort((a, b) => b.count - a.count)

  } catch (error) {
    console.error('Error loading citations:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

watch([() => activeProductId.value, selectedPeriod], () => {
  currentPage.value = 1
  loadData()
}, { immediate: true })

// Watch for global region filter changes
watch(selectedRegion, () => {
  currentPage.value = 1
  loadData()
})
</script>
