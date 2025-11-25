<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardNav />

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Page Header -->
        <div class="flex justify-between items-start mb-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
              <svg class="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">AI Visibility Dashboard</h1>
              <p class="text-gray-500">Track how often your brand appears in AI-generated responses</p>
            </div>
          </div>
          <button
            class="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors"
            @click="refreshData"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>

        <!-- Overall Score Card -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div class="flex items-start justify-between mb-6">
            <div>
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                  <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span class="text-sm font-medium text-gray-600">Overall Visibility Score</span>
              </div>
              <div class="text-5xl font-bold text-gray-900 mb-2">{{ overallScore }}</div>
              <p class="text-gray-500 text-sm">
                Based on <span class="font-medium text-gray-900">{{ totalTests }}</span> prompts across <span class="font-medium text-gray-900">4</span> AI engines
              </p>
            </div>
            <div class="text-right">
              <div
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
                :class="scoreChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                <svg v-if="scoreChange >= 0" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                {{ scoreChange >= 0 ? '+' : '' }}{{ scoreChange }}
              </div>
              <p class="text-xs text-gray-400 mt-1">vs last week</p>
            </div>
          </div>

          <!-- Score breakdown -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div class="text-sm text-gray-600 mb-1">Mention Rate</div>
              <div class="text-2xl font-bold text-gray-900">{{ mentionRate }}%</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div class="text-sm text-gray-600 mb-1">Citation Rate</div>
              <div class="text-2xl font-bold text-gray-900">{{ citationRate }}%</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div class="text-sm text-gray-600 mb-1">Avg Position</div>
              <div class="text-2xl font-bold text-gray-900">#{{ avgPosition || '-' }}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div class="text-sm text-gray-600 mb-1">Positive Sentiment</div>
              <div class="text-2xl font-bold text-gray-900">{{ positiveSentiment }}%</div>
            </div>
          </div>
        </div>

        <!-- Platform Comparison -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900">Platform Comparison</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="(platform, index) in platforms" :key="platform.name" class="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                    <svg class="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                      <path v-if="platform.name === 'ChatGPT'" d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073z"/>
                      <path v-else-if="platform.name === 'Claude'" d="M4.709 15.955l4.72-2.647.08-.08v-.08l-.08-.08H9.35l-.08.08v.08l-2.249 3.363-.159.239h-.08l-2.074-.875z"/>
                      <path v-else-if="platform.name === 'Gemini'" d="M12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12zm0-3.6c4.636 0 8.4-3.764 8.4-8.4S16.636 3.6 12 3.6 3.6 7.364 3.6 12s3.764 8.4 8.4 8.4z"/>
                      <path v-else d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <span class="font-medium text-gray-900">{{ platform.name }}</span>
                </div>
                <span class="px-2 py-0.5 text-xs font-bold rounded bg-gray-200 text-gray-700">
                  {{ platform.score }}
                </span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Mentions</span>
                  <span class="font-medium text-gray-900">{{ platform.mentions }}/{{ platform.tests }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Citations</span>
                  <span class="font-medium text-gray-900">{{ platform.citations }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Sentiment</span>
                  <span class="font-medium" :class="platform.sentiment === 'Positive' ? 'text-green-600' : platform.sentiment === 'Negative' ? 'text-red-600' : 'text-gray-600'">
                    {{ platform.sentiment }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Platform Insights -->
          <div class="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h4 class="font-medium text-gray-900 mb-3">Platform-Specific Insights</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div><strong>ChatGPT:</strong> Prioritizes Wikipedia (7.8% of citations) and recent content</div>
              <div><strong>Perplexity:</strong> Reddit is #1 source (6.6%), most transparent citation model</div>
              <div><strong>Gemini:</strong> Only AI with full JavaScript rendering - can index modern web apps</div>
              <div><strong>Claude:</strong> Newest search feature (March 2025) with evolving citation patterns</div>
            </div>
          </div>
        </div>

        <!-- Recent Scan Results -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900">Recent Scan Results</h2>
          </div>

          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
          </div>

          <div v-else-if="!results.length" class="text-center py-12">
            <p class="text-gray-500 mb-1">No scan results yet</p>
            <p class="text-sm text-gray-400">Run your first visibility scan to see data here</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="result in results"
              :key="result.id"
              class="p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center flex-wrap gap-2 mb-2">
                    <span class="px-2 py-0.5 text-xs font-medium rounded bg-gray-200 text-gray-700">
                      {{ formatModelName(result.ai_model) }}
                    </span>
                    <span
                      class="px-2 py-0.5 text-xs font-medium rounded"
                      :class="result.brand_mentioned ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'"
                    >
                      {{ result.brand_mentioned ? 'Mentioned' : 'Not Mentioned' }}
                    </span>
                    <span
                      v-if="result.citation_present"
                      class="px-2 py-0.5 text-xs font-medium bg-brand/10 text-brand rounded"
                    >
                      Cited
                    </span>
                  </div>
                  <p class="text-sm text-gray-700 mb-2 line-clamp-2">{{ result.prompt }}</p>
                  <div class="flex items-center gap-4 text-xs text-gray-500">
                    <span>Position: {{ result.position || 'N/A' }}</span>
                    <span>{{ result.sentiment || 'Neutral' }}</span>
                    <span>{{ formatDate(result.tested_at) }}</span>
                  </div>
                </div>
                <button
                  class="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand transition-colors"
                  @click="viewDetails(result)"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
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
const user = useSupabaseUser()

const loading = ref(true)
const overallScore = ref(0)
const scoreChange = ref(0)
const totalTests = ref(0)
const mentionRate = ref(0)
const citationRate = ref(0)
const avgPosition = ref(0)
const positiveSentiment = ref(0)

const platforms = ref([
  { name: 'ChatGPT', score: 0, mentions: 0, tests: 0, citations: 0, sentiment: 'Neutral' },
  { name: 'Claude', score: 0, mentions: 0, tests: 0, citations: 0, sentiment: 'Neutral' },
  { name: 'Gemini', score: 0, mentions: 0, tests: 0, citations: 0, sentiment: 'Neutral' },
  { name: 'Perplexity', score: 0, mentions: 0, tests: 0, citations: 0, sentiment: 'Neutral' }
])

const results = ref<any[]>([])

onMounted(async () => {
  await loadVisibilityData()
})

const loadVisibilityData = async () => {
  loading.value = true
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) return

    const { data: promptResults } = await supabase
      .from('prompt_results')
      .select('*, prompts(prompt_text)')
      .eq('organization_id', userData.organization_id)
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
        platform.citations = platformResults.filter(r => r.citation_present).length

        const posCount = platformResults.filter(r => r.sentiment === 'positive').length
        const negCount = platformResults.filter(r => r.sentiment === 'negative').length

        if (posCount > negCount) platform.sentiment = 'Positive'
        else if (negCount > posCount) platform.sentiment = 'Negative'
        else platform.sentiment = 'Neutral'

        platform.score = platform.tests > 0
          ? Math.round((platform.mentions / platform.tests) * 100)
          : 0
      }
    }

    scoreChange.value = 0
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
    case 'chatgpt': return 'ChatGPT'
    case 'claude': return 'Claude'
    case 'gemini': return 'Gemini'
    case 'perplexity': return 'Perplexity'
    default: return model
  }
}

const viewDetails = (result: any) => {
  console.log('View result:', result)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
</script>
