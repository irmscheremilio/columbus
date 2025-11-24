<template>
  <div class="min-h-screen bg-background">
    <DashboardNav />

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">AI Visibility Dashboard</h1>
            <p class="mt-2 text-gray-600">
              Track how often your brand appears in AI-generated responses
            </p>
          </div>
          <button class="btn-primary" @click="refreshData">
            Refresh Data
          </button>
        </div>

        <!-- Overall Score Card -->
        <div class="card-highlight mb-6 p-8">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-600 mb-2">Overall Visibility Score</h2>
              <div class="text-6xl font-bold text-brand mb-2">
                {{ overallScore }}
              </div>
              <p class="text-sm text-gray-500">
                Based on {{ totalTests }} prompts across 4 AI engines
              </p>
            </div>
            <div class="text-right">
              <div
                class="text-2xl font-bold mb-1"
                :class="scoreChange >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ scoreChange >= 0 ? '+' : '' }}{{ scoreChange }}
              </div>
              <p class="text-sm text-gray-500">vs last week</p>
            </div>
          </div>

          <!-- Score breakdown -->
          <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 bg-background rounded-lg">
              <div class="text-sm text-gray-600 mb-1">Mention Rate</div>
              <div class="text-2xl font-bold text-gray-900">{{ mentionRate }}%</div>
            </div>
            <div class="text-center p-4 bg-background rounded-lg">
              <div class="text-sm text-gray-600 mb-1">Citation Rate</div>
              <div class="text-2xl font-bold text-gray-900">{{ citationRate }}%</div>
            </div>
            <div class="text-center p-4 bg-background rounded-lg">
              <div class="text-sm text-gray-600 mb-1">Avg Position</div>
              <div class="text-2xl font-bold text-gray-900">{{ avgPosition }}</div>
            </div>
            <div class="text-center p-4 bg-background rounded-lg">
              <div class="text-sm text-gray-600 mb-1">Positive Sentiment</div>
              <div class="text-2xl font-bold text-gray-900">{{ positiveSentiment }}%</div>
            </div>
          </div>
        </div>

        <!-- Platform Comparison -->
        <div class="card-highlight mb-6">
          <h2 class="text-xl font-semibold mb-4">Platform Comparison</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="platform in platforms"
              :key="platform.name"
              class="border border-border rounded-lg p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-semibold text-gray-900">{{ platform.name }}</h3>
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="getScoreColor(platform.score)"
                >
                  {{ platform.score }}
                </span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Mentions:</span>
                  <span class="font-medium">{{ platform.mentions }}/{{ platform.tests }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Citations:</span>
                  <span class="font-medium">{{ platform.citations }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Sentiment:</span>
                  <span
                    class="font-medium"
                    :class="getSentimentColor(platform.sentiment)"
                  >
                    {{ platform.sentiment }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 class="font-semibold text-blue-900 mb-2">Platform-Specific Insights</h4>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>• ChatGPT: Prioritizes Wikipedia (7.8% of citations) and recent content (76.4% from last 30 days)</li>
              <li>• Perplexity: Reddit is #1 source (6.6%), most transparent citation model</li>
              <li>• Gemini: Only AI with full JavaScript rendering - can index modern web apps</li>
              <li>• Claude: Newest search feature (March 2025) with evolving citation patterns</li>
            </ul>
          </div>
        </div>

        <!-- Recent Scan Results -->
        <div class="card-highlight">
          <h2 class="text-xl font-semibold mb-4">Recent Scan Results</h2>

          <div v-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
          </div>

          <div v-else-if="!results.length" class="text-center py-8 text-gray-500">
            No scan results yet. Run your first visibility scan to see data here.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="result in results"
              :key="result.id"
              class="border border-border rounded-lg p-4 hover:border-brand transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm font-medium text-gray-900">{{ result.ai_model }}</span>
                    <span
                      class="px-2 py-1 text-xs rounded-full"
                      :class="result.brand_mentioned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
                    >
                      {{ result.brand_mentioned ? 'Mentioned' : 'Not Mentioned' }}
                    </span>
                    <span
                      v-if="result.citation_present"
                      class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                    >
                      Cited
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">{{ result.prompt }}</p>
                  <div class="flex items-center gap-4 text-xs text-gray-500">
                    <span>Position: {{ result.position || 'N/A' }}</span>
                    <span>Sentiment: {{ result.sentiment }}</span>
                    <span>{{ formatDate(result.tested_at) }}</span>
                  </div>
                </div>
                <button
                  class="text-brand hover:opacity-80 text-sm font-medium"
                  @click="viewDetails(result)"
                >
                  View →
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
    // Get user's organization
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) return

    // Load recent prompt results
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

    // Calculate metrics
    if (results.value.length > 0) {
      totalTests.value = results.value.length

      // Mention rate
      const mentioned = results.value.filter(r => r.brand_mentioned).length
      mentionRate.value = Math.round((mentioned / totalTests.value) * 100)

      // Citation rate
      const cited = results.value.filter(r => r.citation_present).length
      citationRate.value = Math.round((cited / totalTests.value) * 100)

      // Average position
      const positions = results.value.filter(r => r.position !== null).map(r => r.position)
      avgPosition.value = positions.length > 0
        ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length)
        : 0

      // Positive sentiment rate
      const positive = results.value.filter(r => r.sentiment === 'positive').length
      positiveSentiment.value = Math.round((positive / totalTests.value) * 100)

      // Calculate overall score
      overallScore.value = Math.round(
        (mentionRate.value * 0.4) + (citationRate.value * 0.3) + (positiveSentiment.value * 0.3)
      )

      // Platform-specific metrics
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

    // TODO: Calculate scoreChange from previous period
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

const getScoreColor = (score: number) => {
  if (score >= 70) return 'bg-green-100 text-green-800'
  if (score >= 40) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

const getSentimentColor = (sentiment: string) => {
  if (sentiment === 'Positive') return 'text-green-600'
  if (sentiment === 'Negative') return 'text-red-600'
  return 'text-gray-600'
}

const viewDetails = (result: any) => {
  // TODO: Open modal or navigate to details page
  console.log('View result:', result)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
</script>
