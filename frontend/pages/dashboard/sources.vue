<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Citation Sources</h1>
          <p class="text-sm text-gray-500">Track which sources AI models cite when mentioning your brand</p>
        </div>
        <div class="flex items-center gap-3">
          <DateRangeSelector />
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
            <div class="text-center px-3 py-1.5 bg-blue-50 rounded-lg">
              <div class="text-base font-bold text-blue-600">{{ brandUrlStats.length }}</div>
              <div class="text-[10px] text-gray-500">Your Pages Cited</div>
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

      <!-- Brand Pages Performance Chart -->
      <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-1 h-4 rounded-full bg-emerald-500"></div>
            <div>
              <h2 class="text-sm font-semibold text-gray-900">Your Most Cited Pages</h2>
              <p class="text-[10px] text-gray-500 mt-0.5">Which pages of your site are being cited by AI</p>
            </div>
          </div>
          <span class="text-xs text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-full">
            {{ brandUrlStats.length }} unique pages
          </span>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
        </div>

        <div v-else-if="brandUrlStats.length === 0" class="text-center py-12 text-sm text-gray-500">
          <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          No brand citations yet
        </div>

        <div v-else class="p-4">
          <!-- Bar Chart -->
          <div class="space-y-3">
            <div
              v-for="(urlStat, idx) in brandUrlStats.slice(0, 10)"
              :key="urlStat.url"
              class="group"
            >
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold bg-emerald-100 text-emerald-700 shrink-0">
                  {{ idx + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <a
                      :href="urlStat.url"
                      target="_blank"
                      class="text-xs font-medium text-gray-700 hover:text-brand truncate transition-colors"
                      :title="urlStat.url"
                    >
                      {{ formatUrlPath(urlStat.url) }}
                    </a>
                    <span class="text-xs font-bold text-emerald-600 ml-2 shrink-0">{{ urlStat.count }}</span>
                  </div>
                  <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                      :style="{ width: `${(urlStat.count / maxBrandUrlCount) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="brandUrlStats.length > 10" class="mt-4 pt-4 border-t border-gray-100 text-center">
            <span class="text-xs text-gray-500">
              +{{ brandUrlStats.length - 10 }} more pages cited
            </span>
          </div>
        </div>
      </div>

      <!-- Brand Citations Table -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 hover:shadow-md transition-shadow duration-200">
        <div class="flex items-center justify-between p-4 pb-3 border-b border-gray-100/80">
          <div class="flex items-center gap-2">
            <div class="w-1 h-4 rounded-full bg-emerald-500"></div>
            <h2 class="text-sm font-semibold text-gray-900">Brand Citations</h2>
            <span class="text-xs text-gray-500 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
              {{ totalBrandCitations }} total
            </span>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model="brandSearchQuery"
              type="text"
              placeholder="Search URLs..."
              class="text-sm bg-gray-50/80 border border-gray-200/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/20 w-40"
            />
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full table-fixed">
            <thead class="bg-gray-50/50">
              <tr>
                <th class="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5">URL</th>
                <th class="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5 w-[100px]">Platform</th>
                <th class="text-center text-[11px] font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5 w-[70px]">Chat</th>
                <th class="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5 w-[120px]">Date</th>
              </tr>
            </thead>
          </table>
          <div class="max-h-80 overflow-y-auto">
            <table class="w-full table-fixed">
              <tbody class="divide-y divide-gray-100/80">
                <tr
                  v-for="citation in paginatedBrandCitations"
                  :key="citation.id"
                  class="hover:bg-emerald-50/30 transition-colors"
                >
                  <td class="py-2.5 px-4">
                    <a
                      :href="citation.url"
                      target="_blank"
                      class="text-sm text-emerald-600 hover:text-emerald-800 truncate block transition-colors"
                      :title="citation.url"
                    >
                      {{ citation.url }}
                    </a>
                  </td>
                  <td class="py-2.5 px-4 w-[100px]">
                    <span class="text-xs font-medium text-gray-600">
                      {{ formatModelName(citation.ai_model) }}
                    </span>
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

          <div v-if="filteredBrandCitations.length === 0" class="text-center py-8">
            <p class="text-sm text-gray-500">No brand citations found</p>
          </div>
        </div>

        <!-- Brand Citations Pagination -->
        <div v-if="totalBrandPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100/80 bg-gray-50/30">
          <span class="text-xs text-gray-500">
            Page {{ brandCurrentPage }} of {{ totalBrandPages }} ({{ filteredBrandCitations.length }} results)
          </span>
          <div class="flex items-center gap-1">
            <button
              @click="brandCurrentPage = Math.max(1, brandCurrentPage - 1)"
              :disabled="brandCurrentPage === 1"
              class="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              @click="brandCurrentPage = Math.min(totalBrandPages, brandCurrentPage + 1)"
              :disabled="brandCurrentPage === totalBrandPages"
              class="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- All Citations Table -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 hover:shadow-md transition-shadow duration-200">
        <div class="flex items-center justify-between p-4 pb-3 border-b border-gray-100/80">
          <div class="flex items-center gap-2">
            <div class="w-1 h-4 rounded-full bg-blue-500"></div>
            <h2 class="text-sm font-semibold text-gray-900">All Citations</h2>
            <span class="text-xs text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-full">
              {{ totalCitations }} total
            </span>
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
                <th class="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5 w-[100px]">Platform</th>
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
                  <td class="py-2.5 px-4 w-[100px]">
                    <span class="text-xs font-medium text-gray-600">
                      {{ formatModelName(citation.ai_model) }}
                    </span>
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

          <div v-if="loadingCitations" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-5 w-5 border-2 border-brand border-t-transparent"></div>
          </div>

          <div v-else-if="citations.length === 0" class="text-center py-8">
            <p class="text-sm text-gray-500">No citations found</p>
          </div>
        </div>

        <!-- All Citations Pagination -->
        <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100/80 bg-gray-50/30">
          <span class="text-xs text-gray-500">
            Page {{ currentPage }} of {{ totalPages }} ({{ totalCitations }} total)
          </span>
          <div class="flex items-center gap-1">
            <button
              @click="goToPage(1)"
              :disabled="currentPage === 1"
              class="px-2 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="First page"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span class="px-2 text-xs text-gray-500">
              {{ currentPage }} / {{ totalPages }}
            </span>
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
            <button
              @click="goToPage(totalPages)"
              :disabled="currentPage === totalPages"
              class="px-2 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Last page"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
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
const { formatModelName } = useAIPlatforms()
const { dateRange } = useDateRange()

const loading = ref(false)
const loadingCitations = ref(false)
const searchQuery = ref('')
const brandSearchQuery = ref('')
const currentPage = ref(1)
const brandCurrentPage = ref(1)
const pageSize = 25

interface Citation {
  id: string
  url: string
  source_domain: string
  source_title: string | null
  is_brand_source: boolean
  created_at: string
  chat_url: string | null
  ai_model: string | null
}

interface SourceData {
  domain: string
  count: number
  isBrand: boolean
}

interface BrandUrlStat {
  url: string
  count: number
}

const citations = ref<Citation[]>([])
const brandCitations = ref<Citation[]>([])
const sources = ref<SourceData[]>([])
const brandUrlStats = ref<BrandUrlStat[]>([])
const totalCitations = ref(0)
const totalBrandCitations = ref(0)

const maxBrandUrlCount = computed(() => {
  if (brandUrlStats.value.length === 0) return 1
  return brandUrlStats.value[0].count
})

const stats = computed(() => {
  const brandCitationsCount = sources.value
    .filter(s => s.isBrand)
    .reduce((sum, s) => sum + s.count, 0)

  return {
    totalCitations: totalCitations.value,
    brandCitations: brandCitationsCount,
    uniqueDomains: sources.value.length,
    brandPercent: totalCitations.value > 0
      ? Math.round((brandCitationsCount / totalCitations.value) * 100)
      : 0
  }
})

// All citations pagination (server-side)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCitations.value / pageSize)))

const paginatedCitations = computed(() => citations.value)

// Brand citations pagination (client-side since we load all for the chart)
const filteredBrandCitations = computed(() => {
  let result = brandCitations.value

  if (brandSearchQuery.value) {
    const query = brandSearchQuery.value.toLowerCase()
    result = result.filter(c =>
      c.url.toLowerCase().includes(query)
    )
  }

  return result
})

const totalBrandPages = computed(() => Math.max(1, Math.ceil(filteredBrandCitations.value.length / pageSize)))

const paginatedBrandCitations = computed(() => {
  const start = (brandCurrentPage.value - 1) * pageSize
  return filteredBrandCitations.value.slice(start, start + pageSize)
})

// Build date filter
const getDateFilter = () => {
  const startDate = dateRange.value.startDate
  return startDate ? startDate.toISOString() : null
}

// Get filtered result IDs based on region
const getFilteredResultIds = async (dateFilter: string | null): Promise<string[] | null> => {
  if (!selectedRegion.value) return null

  let resultsQuery = supabase
    .from('prompt_results')
    .select('id')
    .eq('product_id', activeProductId.value)
    .ilike('request_country', selectedRegion.value)

  if (dateFilter) {
    resultsQuery = resultsQuery.gte('tested_at', dateFilter)
  }

  const { data: regionResults } = await resultsQuery
  return (regionResults || []).map(r => r.id)
}

const loadAggregateData = async () => {
  if (!activeProductId.value) return

  loading.value = true
  try {
    const dateFilter = getDateFilter()
    const filteredResultIds = await getFilteredResultIds(dateFilter)

    if (filteredResultIds && filteredResultIds.length === 0) {
      sources.value = []
      brandUrlStats.value = []
      brandCitations.value = []
      totalCitations.value = 0
      totalBrandCitations.value = 0
      loading.value = false
      return
    }

    // Get total count
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
    let allCitationsData: { source_domain: string; url: string; is_brand_source: boolean }[] = []
    let offset = 0
    const batchSize = 1000

    while (true) {
      let allCitationsQuery = supabase
        .from('prompt_citations')
        .select('source_domain, url, is_brand_source')
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

    // Aggregate sources
    const domainCounts: Record<string, { count: number; isBrand: boolean }> = {}
    const brandUrlCounts: Record<string, number> = {}

    for (const c of allCitationsData) {
      if (!domainCounts[c.source_domain]) {
        domainCounts[c.source_domain] = { count: 0, isBrand: c.is_brand_source }
      }
      domainCounts[c.source_domain].count++

      // Track brand URLs
      if (c.is_brand_source && c.url) {
        brandUrlCounts[c.url] = (brandUrlCounts[c.url] || 0) + 1
      }
    }

    sources.value = Object.entries(domainCounts)
      .map(([domain, { count, isBrand }]) => ({ domain, count, isBrand }))
      .sort((a, b) => b.count - a.count)

    brandUrlStats.value = Object.entries(brandUrlCounts)
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)

    // Load all brand citations for the brand table
    await loadBrandCitations(dateFilter, filteredResultIds)

  } catch (error) {
    console.error('Error loading aggregate data:', error)
  } finally {
    loading.value = false
  }
}

const loadBrandCitations = async (dateFilter: string | null, filteredResultIds: string[] | null) => {
  try {
    // Get brand citations count
    let brandCountQuery = supabase
      .from('prompt_citations')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', activeProductId.value)
      .eq('is_brand_source', true)

    if (dateFilter) {
      brandCountQuery = brandCountQuery.gte('created_at', dateFilter)
    }

    if (filteredResultIds) {
      brandCountQuery = brandCountQuery.in('prompt_result_id', filteredResultIds)
    }

    const { count: brandCount } = await brandCountQuery
    totalBrandCitations.value = brandCount || 0

    // Load all brand citations
    let allBrandCitations: any[] = []
    let offset = 0
    const batchSize = 1000

    while (true) {
      let query = supabase
        .from('prompt_citations')
        .select('id, url, source_domain, source_title, is_brand_source, created_at, prompt_result_id')
        .eq('product_id', activeProductId.value)
        .eq('is_brand_source', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + batchSize - 1)

      if (dateFilter) {
        query = query.gte('created_at', dateFilter)
      }

      if (filteredResultIds) {
        query = query.in('prompt_result_id', filteredResultIds)
      }

      const { data } = await query
      if (!data || data.length === 0) break

      allBrandCitations = allBrandCitations.concat(data)
      if (data.length < batchSize) break
      offset += batchSize
    }

    // Get chat_urls and ai_model for brand citations
    const resultIds = [...new Set(allBrandCitations.map(c => c.prompt_result_id).filter(Boolean))]

    let chatUrlMap = new Map<string, { chat_url: string; ai_model: string }>()
    if (resultIds.length > 0) {
      // Batch the result ID queries to avoid URL length limits
      const batchSize = 100
      for (let i = 0; i < resultIds.length; i += batchSize) {
        const batch = resultIds.slice(i, i + batchSize)
        const { data: results } = await supabase
          .from('prompt_results')
          .select('id, chat_url, ai_model')
          .in('id', batch)

        for (const r of results || []) {
          chatUrlMap.set(r.id, { chat_url: r.chat_url || '', ai_model: r.ai_model || '' })
        }
      }
    }

    brandCitations.value = allBrandCitations.map(c => ({
      ...c,
      chat_url: chatUrlMap.get(c.prompt_result_id)?.chat_url || null,
      ai_model: chatUrlMap.get(c.prompt_result_id)?.ai_model || null
    }))

  } catch (error) {
    console.error('Error loading brand citations:', error)
  }
}

const loadCitationsPage = async () => {
  if (!activeProductId.value) return

  loadingCitations.value = true
  try {
    const dateFilter = getDateFilter()
    const filteredResultIds = await getFilteredResultIds(dateFilter)

    if (filteredResultIds && filteredResultIds.length === 0) {
      citations.value = []
      loadingCitations.value = false
      return
    }

    const offset = (currentPage.value - 1) * pageSize

    // Build query with search filter
    let query = supabase
      .from('prompt_citations')
      .select('id, url, source_domain, source_title, is_brand_source, created_at, prompt_result_id')
      .eq('product_id', activeProductId.value)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (dateFilter) {
      query = query.gte('created_at', dateFilter)
    }

    if (filteredResultIds) {
      query = query.in('prompt_result_id', filteredResultIds)
    }

    if (searchQuery.value) {
      query = query.ilike('source_domain', `%${searchQuery.value}%`)
    }

    const { data, error } = await query

    if (error) throw error

    // Get chat_urls and ai_model
    const resultIds = [...new Set((data || []).map(c => c.prompt_result_id).filter(Boolean))]

    let chatUrlMap = new Map<string, { chat_url: string; ai_model: string }>()
    if (resultIds.length > 0) {
      const { data: results } = await supabase
        .from('prompt_results')
        .select('id, chat_url, ai_model')
        .in('id', resultIds)

      for (const r of results || []) {
        chatUrlMap.set(r.id, { chat_url: r.chat_url || '', ai_model: r.ai_model || '' })
      }
    }

    citations.value = (data || []).map(c => ({
      ...c,
      chat_url: chatUrlMap.get(c.prompt_result_id)?.chat_url || null,
      ai_model: chatUrlMap.get(c.prompt_result_id)?.ai_model || null
    }))

  } catch (error) {
    console.error('Error loading citations page:', error)
  } finally {
    loadingCitations.value = false
  }
}

const goToPage = async (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  await loadCitationsPage()
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatUrlPath = (url: string) => {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname + parsed.search
    return path.length > 60 ? path.substring(0, 60) + '...' : path || '/'
  } catch {
    return url.length > 60 ? url.substring(0, 60) + '...' : url
  }
}

// Initial load
watch(() => activeProductId.value, async () => {
  currentPage.value = 1
  brandCurrentPage.value = 1
  await loadAggregateData()
  await loadCitationsPage()
}, { immediate: true })

// Watch for global date range changes
watch(dateRange, async () => {
  currentPage.value = 1
  brandCurrentPage.value = 1
  await loadAggregateData()
  await loadCitationsPage()
}, { deep: true })

// Watch for search query changes (debounced)
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    currentPage.value = 1
    await loadCitationsPage()
  }, 300)
})

// Watch brand search query
watch(brandSearchQuery, () => {
  brandCurrentPage.value = 1
})

// Watch for global region filter changes
watch(selectedRegion, async () => {
  currentPage.value = 1
  brandCurrentPage.value = 1
  await loadAggregateData()
  await loadCitationsPage()
})
</script>
