<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Visibility</h1>
          <p class="text-sm text-gray-500">Track brand presence across AI platforms</p>
        </div>
        <button
          class="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg shadow-sm shadow-brand/25 hover:shadow-md hover:shadow-brand/30 hover:bg-brand/95 transition-all duration-200"
          @click="refreshData"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-3 border border-white/50">
          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Score</div>
          <div class="text-2xl font-bold text-gray-900">{{ overallScore }}<span class="text-sm font-medium text-gray-300 ml-0.5">/100</span></div>
        </div>
        <div class="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-3 border border-white/50">
          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Tests Run</div>
          <div class="text-xl font-bold text-gray-900">{{ totalTests }}</div>
        </div>
        <div class="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-3 border border-white/50">
          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Mention Rate</div>
          <div class="text-xl font-bold text-brand">{{ mentionRate }}%</div>
        </div>
        <div class="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-3 border border-white/50">
          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Citation Rate</div>
          <div class="text-xl font-bold text-gray-900">{{ citationRate }}%</div>
        </div>
        <div class="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-3 border border-white/50">
          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Avg Position</div>
          <div class="text-xl font-bold text-gray-900">#{{ avgPosition || '-' }}</div>
        </div>
        <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-3 border border-emerald-100/50">
          <div class="text-[11px] font-semibold text-emerald-600/70 uppercase tracking-wider mb-1">Positive</div>
          <div class="text-xl font-bold text-emerald-600">{{ positiveSentiment }}%</div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Chart Section -->
        <div class="lg:col-span-2">
          <VisibilityChart :product-id="activeProductId" />
        </div>

        <!-- Platform Stats -->
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4 hover:shadow-md transition-shadow duration-200">
          <h2 class="text-sm font-semibold text-gray-900 mb-4">By Platform</h2>
          <div class="space-y-4">
            <div v-for="platform in platforms" :key="platform.name" class="group">
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-gray-100/80 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200/80 transition-colors">
                  <span class="text-[10px] font-bold text-gray-600">{{ platform.name.charAt(0) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs font-medium text-gray-700">{{ platform.name }}</span>
                    <span class="text-xs font-semibold text-gray-900">{{ platform.score }}%</span>
                  </div>
                  <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-brand to-brand/80 rounded-full transition-all duration-500" :style="{ width: `${platform.score}%` }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-gray-100/80 text-xs text-gray-500">
            <div class="flex justify-between mb-1">
              <span>Best performer:</span>
              <span class="font-semibold text-gray-900">{{ bestPlatform }}</span>
            </div>
            <div class="flex justify-between">
              <span>Total mentions:</span>
              <span class="font-semibold text-gray-900">{{ totalMentions }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Results Table -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent">
          <h2 class="text-sm font-semibold text-gray-900">Recent Scan Results</h2>
          <span class="text-xs text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-full">{{ results.length }} results</span>
        </div>
        <div v-if="loading" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-5 w-5 border-2 border-brand border-t-transparent"></div>
        </div>
        <div v-else-if="!results.length" class="text-center py-8 text-sm text-gray-500">
          No scan results yet. Run a visibility scan to see data here.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100/80">
                <th class="text-left px-4 py-3 font-medium">Platform</th>
                <th class="text-left px-4 py-3 font-medium">Prompt</th>
                <th class="text-center px-4 py-3 font-medium">Mentioned</th>
                <th class="text-center px-4 py-3 font-medium hidden sm:table-cell">Cited</th>
                <th class="text-center px-4 py-3 font-medium hidden md:table-cell">Position</th>
                <th class="text-center px-4 py-3 font-medium hidden lg:table-cell">Sentiment</th>
                <th class="text-right px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100/80">
              <tr
                v-for="result in results"
                :key="result.id"
                class="text-sm hover:bg-gray-50/80 transition-colors cursor-pointer"
                @click="openResultDetail(result)"
              >
                <td class="px-4 py-3">
                  <span class="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-gray-100/80 text-gray-700">
                    {{ formatModelName(result.ai_model) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="text-gray-900 truncate max-w-xs" :title="result.prompt">{{ result.prompt }}</div>
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-flex w-6 h-6 rounded-full items-center justify-center text-xs"
                    :class="result.brand_mentioned ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'"
                  >
                    {{ result.brand_mentioned ? '✓' : '−' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center hidden sm:table-cell">
                  <span
                    class="inline-flex w-6 h-6 rounded-full items-center justify-center text-xs"
                    :class="result.citation_present ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-400'"
                  >
                    {{ result.citation_present ? '✓' : '−' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center hidden md:table-cell text-gray-600 font-medium">
                  {{ result.position || '−' }}
                </td>
                <td class="px-4 py-3 text-center hidden lg:table-cell">
                  <span
                    class="text-xs font-medium px-2 py-0.5 rounded-full"
                    :class="result.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-600' : result.sentiment === 'negative' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'"
                  >
                    {{ result.sentiment || 'neutral' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right text-gray-500 text-xs">
                  {{ formatDate(result.tested_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Scan Result Detail Modal -->
    <Teleport to="body">
      <div
        v-if="showDetailModal && selectedResult"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="closeDetailModal"
      >
        <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-white/50">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100/80">
            <div class="flex items-center gap-3">
              <span class="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold" :class="getPlatformClass(selectedResult.ai_model)">
                {{ formatModelName(selectedResult.ai_model) }}
              </span>
              <span class="text-sm text-gray-500">{{ formatDateTime(selectedResult.tested_at) }}</span>
            </div>
            <button
              @click="closeDetailModal"
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all duration-200"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-5">
            <!-- Status Indicators -->
            <div class="flex flex-wrap gap-3">
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" :class="selectedResult.brand_mentioned ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path v-if="selectedResult.brand_mentioned" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span class="text-xs font-medium">{{ selectedResult.brand_mentioned ? 'Brand Mentioned' : 'Not Mentioned' }}</span>
              </div>
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" :class="selectedResult.citation_present ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-500'">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span class="text-xs font-medium">{{ selectedResult.citation_present ? 'Citation Found' : 'No Citation' }}</span>
              </div>
              <div v-if="selectedResult.position" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700">
                <span class="text-xs font-medium">Position #{{ selectedResult.position }}</span>
              </div>
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" :class="getSentimentClass(selectedResult.sentiment)">
                <span class="text-xs font-medium capitalize">{{ selectedResult.sentiment || 'neutral' }}</span>
              </div>
            </div>

            <!-- Prompt Section -->
            <div>
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Prompt</h3>
              <div class="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                <p class="text-sm text-gray-800 leading-relaxed">{{ selectedResult.prompt }}</p>
              </div>
            </div>

            <!-- Response Section -->
            <div>
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Response</h3>
              <div class="bg-gray-50/80 rounded-xl p-4 border border-gray-100 max-h-[400px] overflow-y-auto">
                <p v-if="selectedResult.response_text" class="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{{ selectedResult.response_text }}</p>
                <p v-else class="text-sm text-gray-400 italic">Response not available</p>
              </div>
            </div>

            <!-- Competitor Mentions -->
            <div v-if="selectedResult.competitor_mentions?.length">
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Competitor Mentions</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="competitor in selectedResult.competitor_mentions"
                  :key="competitor"
                  class="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-lg"
                >
                  {{ competitor }}
                </span>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 border-t border-gray-100/80 bg-gray-50/50 rounded-b-2xl">
            <button
              @click="closeDetailModal"
              class="w-full px-4 py-2.5 bg-gray-100/80 text-gray-700 rounded-xl font-medium hover:bg-gray-200/80 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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
const overallScore = ref(0)
const totalTests = ref(0)
const mentionRate = ref(0)
const citationRate = ref(0)
const avgPosition = ref(0)
const positiveSentiment = ref(0)

const platforms = ref([
  { name: 'ChatGPT', score: 0, mentions: 0, tests: 0 },
  { name: 'Claude', score: 0, mentions: 0, tests: 0 },
  { name: 'Gemini', score: 0, mentions: 0, tests: 0 },
  { name: 'Perplexity', score: 0, mentions: 0, tests: 0 }
])

const results = ref<any[]>([])
const showDetailModal = ref(false)
const selectedResult = ref<any>(null)

const bestPlatform = computed(() => {
  const sorted = [...platforms.value].sort((a, b) => b.score - a.score)
  return sorted[0]?.score > 0 ? sorted[0].name : '-'
})

const totalMentions = computed(() => {
  return platforms.value.reduce((sum, p) => sum + p.mentions, 0)
})

watch(activeProductId, async (newProductId) => {
  if (newProductId) {
    await loadVisibilityData()
  }
})

onMounted(async () => {
  if (productInitialized.value && activeProductId.value) {
    await loadVisibilityData()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadVisibilityData()
        unwatch()
      }
    })
  }
})

const loadVisibilityData = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const { data: promptResults } = await supabase
      .from('prompt_results')
      .select('*, prompts(prompt_text)')
      .eq('product_id', productId)
      .order('tested_at', { ascending: false })
      .limit(50)

    results.value = promptResults?.map(r => ({
      ...r,
      prompt: r.prompts?.prompt_text || 'Unknown prompt'
    })) || []

    if (results.value.length > 0) {
      totalTests.value = results.value.length

      const mentioned = results.value.filter(r => r.brand_mentioned).length
      mentionRate.value = Math.round((mentioned / totalTests.value) * 100)

      const cited = results.value.filter(r => r.citation_present).length
      citationRate.value = Math.round((cited / totalTests.value) * 100)

      const positions = results.value.filter(r => r.position !== null).map(r => r.position)
      avgPosition.value = positions.length > 0
        ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length)
        : 0

      const positive = results.value.filter(r => r.sentiment === 'positive').length
      positiveSentiment.value = Math.round((positive / totalTests.value) * 100)

      overallScore.value = Math.round(
        (mentionRate.value * 0.4) + (citationRate.value * 0.3) + (positiveSentiment.value * 0.3)
      )

      for (const platform of platforms.value) {
        const modelKey = platform.name.toLowerCase()
        const platformResults = results.value.filter(r => r.ai_model === modelKey)

        platform.tests = platformResults.length
        platform.mentions = platformResults.filter(r => r.brand_mentioned).length
        platform.score = platform.tests > 0
          ? Math.round((platform.mentions / platform.tests) * 100)
          : 0
      }
    }
  } catch (error) {
    console.error('Error loading visibility data:', error)
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await loadVisibilityData()
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

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const openResultDetail = (result: any) => {
  selectedResult.value = result
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedResult.value = null
}

const getPlatformClass = (model: string) => {
  switch (model?.toLowerCase()) {
    case 'chatgpt': return 'bg-emerald-100 text-emerald-700'
    case 'claude': return 'bg-orange-100 text-orange-700'
    case 'gemini': return 'bg-blue-100 text-blue-700'
    case 'perplexity': return 'bg-cyan-100 text-cyan-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const getSentimentClass = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return 'bg-emerald-50 text-emerald-700'
    case 'negative': return 'bg-red-50 text-red-700'
    default: return 'bg-gray-100 text-gray-500'
  }
}
</script>
