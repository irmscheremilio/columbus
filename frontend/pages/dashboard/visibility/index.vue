<template>
  <div class="min-h-screen bg-gray-50">
    <div class="p-4 lg:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Visibility</h1>
          <p class="text-sm text-gray-500">Track brand presence across AI platforms</p>
        </div>
        <button
          class="inline-flex items-center gap-2 px-3 py-1.5 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand/90 transition-colors"
          @click="refreshData"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Score</div>
          <div class="text-lg font-bold text-gray-900">{{ overallScore }}<span class="text-xs font-normal text-gray-400">/100</span></div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Tests Run</div>
          <div class="text-lg font-bold text-gray-900">{{ totalTests }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Mention Rate</div>
          <div class="text-lg font-bold text-brand">{{ mentionRate }}%</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Citation Rate</div>
          <div class="text-lg font-bold text-gray-900">{{ citationRate }}%</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Avg Position</div>
          <div class="text-lg font-bold text-gray-900">#{{ avgPosition || '-' }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Positive</div>
          <div class="text-lg font-bold text-green-600">{{ positiveSentiment }}%</div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <!-- Chart Section -->
        <div class="lg:col-span-2">
          <VisibilityChart :product-id="activeProductId" />
        </div>

        <!-- Platform Stats -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="text-sm font-semibold text-gray-900 mb-3">By Platform</h2>
          <div class="space-y-3">
            <div v-for="platform in platforms" :key="platform.name" class="flex items-center gap-3">
              <div class="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span class="text-[10px] font-bold text-gray-600">{{ platform.name.charAt(0) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs text-gray-600 truncate">{{ platform.name }}</span>
                  <span class="text-xs font-medium text-gray-900">{{ platform.score }}%</span>
                </div>
                <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-brand rounded-full transition-all" :style="{ width: `${platform.score}%` }"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <div class="flex justify-between mb-1">
              <span>Best performer:</span>
              <span class="font-medium text-gray-900">{{ bestPlatform }}</span>
            </div>
            <div class="flex justify-between">
              <span>Total mentions:</span>
              <span class="font-medium text-gray-900">{{ totalMentions }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Results Table -->
      <div class="bg-white rounded-lg border border-gray-200">
        <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900">Recent Scan Results</h2>
          <span class="text-xs text-gray-500">{{ results.length }} results</span>
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
              <tr class="text-xs text-gray-500 uppercase tracking-wide">
                <th class="text-left px-4 py-2 font-medium">Platform</th>
                <th class="text-left px-4 py-2 font-medium">Prompt</th>
                <th class="text-center px-4 py-2 font-medium">Mentioned</th>
                <th class="text-center px-4 py-2 font-medium hidden sm:table-cell">Cited</th>
                <th class="text-center px-4 py-2 font-medium hidden md:table-cell">Position</th>
                <th class="text-center px-4 py-2 font-medium hidden lg:table-cell">Sentiment</th>
                <th class="text-right px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="result in results" :key="result.id" class="text-sm hover:bg-gray-50">
                <td class="px-4 py-2.5">
                  <span class="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {{ formatModelName(result.ai_model) }}
                  </span>
                </td>
                <td class="px-4 py-2.5">
                  <div class="text-gray-900 truncate max-w-xs" :title="result.prompt">{{ result.prompt }}</div>
                </td>
                <td class="px-4 py-2.5 text-center">
                  <span
                    class="inline-flex w-5 h-5 rounded-full items-center justify-center text-xs"
                    :class="result.brand_mentioned ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'"
                  >
                    {{ result.brand_mentioned ? '✓' : '−' }}
                  </span>
                </td>
                <td class="px-4 py-2.5 text-center hidden sm:table-cell">
                  <span
                    class="inline-flex w-5 h-5 rounded-full items-center justify-center text-xs"
                    :class="result.citation_present ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-400'"
                  >
                    {{ result.citation_present ? '✓' : '−' }}
                  </span>
                </td>
                <td class="px-4 py-2.5 text-center hidden md:table-cell text-gray-600">
                  {{ result.position || '−' }}
                </td>
                <td class="px-4 py-2.5 text-center hidden lg:table-cell">
                  <span
                    class="text-xs"
                    :class="result.sentiment === 'positive' ? 'text-green-600' : result.sentiment === 'negative' ? 'text-red-600' : 'text-gray-500'"
                  >
                    {{ result.sentiment || 'neutral' }}
                  </span>
                </td>
                <td class="px-4 py-2.5 text-right text-gray-500 text-xs">
                  {{ formatDate(result.tested_at) }}
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
</script>
