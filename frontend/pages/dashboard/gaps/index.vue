<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Visibility Gaps</h1>
          <p class="text-sm text-gray-500">AI-detected improvement opportunities</p>
        </div>
        <div class="flex items-center gap-3">
          <RegionFilter v-model="selectedRegion" @change="onRegionChange" />
          <button
            class="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg shadow-sm shadow-brand/25 hover:shadow-md hover:shadow-brand/30 hover:bg-brand/95 transition-all duration-200 disabled:opacity-50"
            @click="runGapAnalysis"
            :disabled="analyzing"
          >
            <div v-if="analyzing" class="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            {{ analyzing ? 'Analyzing...' : 'Run Analysis' }}
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Open Gaps</div>
          <div class="text-2xl font-bold text-brand">{{ openGaps }}</div>
        </div>
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Critical</div>
          <div class="text-2xl font-bold text-red-600">{{ criticalGaps }}</div>
        </div>
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
          <div class="text-[10px] font-medium text-gray-400 uppercase">High Priority</div>
          <div class="text-2xl font-bold text-orange-500">{{ highPriorityGaps }}</div>
        </div>
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Resolved</div>
          <div class="text-2xl font-bold text-emerald-600">{{ resolvedGaps }}</div>
        </div>
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Competitors</div>
          <div class="text-2xl font-bold text-gray-900">{{ uniqueCompetitors }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-3">
        <div class="flex flex-wrap items-center gap-2">
          <select
            v-model="filterStatus"
            class="pl-2 pr-7 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            v-model="filterSeverity"
            class="pl-2 pr-7 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            v-model="filterIssueType"
            class="pl-2 pr-7 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">All Issues</option>
            <option value="missing_mention">Not Mentioned</option>
            <option value="negative_sentiment">Negative Sentiment</option>
            <option value="price_comparison">Pricing Concern</option>
            <option value="feature_gap">Feature Gap</option>
            <option value="recommendation_bias">Competitor Favored</option>
            <option value="market_position">Low Position</option>
          </select>
          <select
            v-model="filterPlatform"
            class="pl-2 pr-7 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">All Platforms</option>
            <option v-for="p in availablePlatforms" :key="p" :value="p">{{ formatPlatformName(p) }}</option>
          </select>
          <select
            v-model="filterCompetitor"
            class="pl-2 pr-7 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">All Competitors</option>
            <option v-for="c in competitors" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Clear
          </button>
          <div class="ml-auto text-xs text-gray-500">{{ filteredGaps.length }} of {{ gaps.length }}</div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="gaps.length === 0" class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-12 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
          <svg class="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No visibility gaps found</h3>
        <p class="text-sm text-gray-500 mb-4">
          {{ competitors.length === 0 ? 'Add competitors first to detect gaps' : 'Run a gap analysis to identify opportunities' }}
        </p>
        <NuxtLink
          v-if="competitors.length === 0"
          to="/dashboard/competitors"
          class="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg"
        >
          Add Competitors
        </NuxtLink>
        <button
          v-else
          @click="runGapAnalysis"
          :disabled="analyzing"
          class="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg disabled:opacity-50"
        >
          Run Gap Analysis
        </button>
      </div>

      <!-- No Results for Filters -->
      <div v-else-if="filteredGaps.length === 0" class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-8 text-center">
        <p class="text-sm text-gray-500">No gaps match your filters</p>
        <button @click="clearFilters" class="mt-2 text-sm text-brand hover:underline">Clear filters</button>
      </div>

      <!-- Gaps List -->
      <div v-else class="space-y-3">
        <div
          v-for="gap in filteredGaps"
          :key="gap.id"
          class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
          @click="expandedGap === gap.id ? expandedGap = null : expandedGap = gap.id"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                  :class="gap.resolved_at ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'"
                >
                  {{ gap.resolved_at ? 'Resolved' : 'Open' }}
                </span>
                <span
                  class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                  :class="getSeverityClass(gap.severity)"
                >
                  {{ gap.severity || 'medium' }}
                </span>
                <span class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {{ formatPlatformName(gap.ai_model) }}
                </span>
                <span
                  v-if="gap.issue_type"
                  class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700"
                >
                  {{ formatIssueType(gap.issue_type) }}
                </span>
                <span class="text-xs text-gray-400">{{ formatDate(gap.detected_at) }}</span>
              </div>

              <h3 class="text-sm font-medium text-gray-900 mb-1">{{ gap.prompt_text || 'Prompt not available' }}</h3>

              <!-- AI Analysis Summary -->
              <p v-if="gap.ai_analysis" class="text-xs text-gray-600 mb-2">
                {{ gap.ai_analysis }}
              </p>
              <p v-else class="text-xs text-gray-500 mb-2">
                <span class="font-medium text-brand">{{ gap.competitor_name }}</span> appears but you don't
              </p>

              <!-- Suggested Action Badge -->
              <div v-if="gap.suggested_action" class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-brand/10 text-brand">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {{ formatSuggestedAction(gap.suggested_action) }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                v-if="!gap.resolved_at"
                @click.stop="markAsResolved(gap.id)"
                class="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Mark as resolved"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                v-else
                @click.stop="reopenGap(gap.id)"
                class="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="Reopen"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <svg
                class="w-4 h-4 text-gray-400 transition-transform"
                :class="{ 'rotate-180': expandedGap === gap.id }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <!-- Expanded Details -->
          <div v-if="expandedGap === gap.id" class="mt-4 pt-4 border-t border-gray-100 space-y-4">
            <!-- Response Excerpt -->
            <div v-if="gap.response_excerpt">
              <div class="text-[10px] font-medium text-gray-400 uppercase mb-1">AI Response Excerpt</div>
              <div class="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 italic">
                "{{ gap.response_excerpt }}"
              </div>
            </div>

            <!-- Improvement Suggestion -->
            <div v-if="gap.improvement_suggestion">
              <div class="text-[10px] font-medium text-gray-400 uppercase mb-1">Improvement Suggestion</div>
              <div class="text-xs text-gray-700 bg-brand/5 rounded-lg p-3 border border-brand/10">
                {{ gap.improvement_suggestion }}
              </div>
            </div>

            <!-- Sentiment Analysis -->
            <div v-if="gap.brand_sentiment || gap.competitor_sentiment" class="flex gap-4">
              <div v-if="gap.brand_sentiment">
                <div class="text-[10px] font-medium text-gray-400 uppercase mb-1">Your Brand Sentiment</div>
                <span
                  class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                  :class="getSentimentClass(gap.brand_sentiment)"
                >
                  {{ gap.brand_sentiment }}
                </span>
              </div>
              <div v-if="gap.competitor_sentiment">
                <div class="text-[10px] font-medium text-gray-400 uppercase mb-1">Competitor Sentiment</div>
                <span
                  class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                  :class="getSentimentClass(gap.competitor_sentiment)"
                >
                  {{ gap.competitor_sentiment }}
                </span>
              </div>
            </div>

            <!-- Competitor Info -->
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <span>Competitor:</span>
              <span class="font-medium text-gray-700">{{ gap.competitor_name }}</span>
            </div>
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
const { activeProductId, initialized: productInitialized } = useActiveProduct()
const { formatModelName } = useAIPlatforms()

const loading = ref(true)
const analyzing = ref(false)
const gaps = ref<any[]>([])
const competitors = ref<any[]>([])
const selectedRegion = ref<string | null>(null)
const filterStatus = ref('open')
const filterSeverity = ref('all')
const filterIssueType = ref('all')
const filterPlatform = ref('all')
const filterCompetitor = ref('all')
const expandedGap = ref<string | null>(null)

const formatPlatformName = (model: string) => formatModelName(model)

const onRegionChange = (region: string | null) => {
  selectedRegion.value = region
  loadGaps()
}

const hasActiveFilters = computed(() => {
  return filterStatus.value !== 'all' || filterSeverity.value !== 'all' ||
    filterIssueType.value !== 'all' || filterPlatform.value !== 'all' ||
    filterCompetitor.value !== 'all'
})

const clearFilters = () => {
  filterStatus.value = 'all'
  filterSeverity.value = 'all'
  filterIssueType.value = 'all'
  filterPlatform.value = 'all'
  filterCompetitor.value = 'all'
}

const filteredGaps = computed(() => {
  return gaps.value.filter(gap => {
    if (filterStatus.value === 'open' && gap.resolved_at) return false
    if (filterStatus.value === 'resolved' && !gap.resolved_at) return false
    if (filterSeverity.value !== 'all' && gap.severity !== filterSeverity.value) return false
    if (filterIssueType.value !== 'all' && gap.issue_type !== filterIssueType.value) return false
    if (filterPlatform.value !== 'all' && gap.ai_model !== filterPlatform.value) return false
    if (filterCompetitor.value !== 'all' && gap.competitor_id !== filterCompetitor.value) return false
    return true
  })
})

const openGaps = computed(() => gaps.value.filter(g => !g.resolved_at).length)
const resolvedGaps = computed(() => gaps.value.filter(g => g.resolved_at).length)
const criticalGaps = computed(() => gaps.value.filter(g => !g.resolved_at && g.severity === 'critical').length)
const highPriorityGaps = computed(() => gaps.value.filter(g => !g.resolved_at && g.severity === 'high').length)
const uniqueCompetitors = computed(() => {
  const ids = new Set(gaps.value.map(g => g.competitor_id))
  return ids.size
})
const availablePlatforms = computed(() => {
  return [...new Set(gaps.value.map(g => g.ai_model))].sort()
})

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-700'
    case 'high': return 'bg-orange-100 text-orange-700'
    case 'medium': return 'bg-yellow-100 text-yellow-700'
    case 'low': return 'bg-blue-100 text-blue-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const getSentimentClass = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return 'bg-emerald-100 text-emerald-700'
    case 'negative': return 'bg-red-100 text-red-700'
    case 'neutral': return 'bg-gray-100 text-gray-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const formatIssueType = (issueType: string) => {
  const labels: Record<string, string> = {
    missing_mention: 'Not Mentioned',
    negative_sentiment: 'Negative',
    price_comparison: 'Pricing',
    feature_gap: 'Feature Gap',
    recommendation_bias: 'Competitor Favored',
    market_position: 'Low Position',
    outdated_info: 'Outdated'
  }
  return labels[issueType] || issueType
}

const formatSuggestedAction = (action: string) => {
  const labels: Record<string, string> = {
    create_comparison_post: 'Create Comparison Post',
    create_comparison_content: 'Create Comparison Content',
    add_feature_docs: 'Add Feature Documentation',
    create_differentiator_content: 'Create Differentiator Content',
    update_pricing_page: 'Update Pricing Page',
    update_website_content: 'Update Website Content',
    improve_brand_authority: 'Improve Brand Authority',
    create_authoritative_content: 'Create Authoritative Content',
    review_content_strategy: 'Review Content Strategy'
  }
  return labels[action] || action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

watch(activeProductId, async (newProductId) => {
  if (newProductId) {
    await loadCompetitors()
    await loadGaps()
  }
})

onMounted(async () => {
  if (productInitialized.value && activeProductId.value) {
    await loadCompetitors()
    await loadGaps()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadCompetitors()
        await loadGaps()
        unwatch()
      }
    })
  }
})

const loadCompetitors = async () => {
  const productId = activeProductId.value
  if (!productId) return

  try {
    const { data } = await supabase
      .from('competitors')
      .select('id, name')
      .eq('product_id', productId)
      .eq('status', 'tracking')

    competitors.value = data || []
  } catch (error) {
    console.error('Error loading competitors:', error)
  }
}

const loadGaps = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('visibility_gaps')
      .select(`
        *,
        prompts (prompt_text),
        competitors (name)
      `)
      .eq('product_id', productId)
      .order('detected_at', { ascending: false })

    if (error) {
      console.error('Error loading gaps:', error)
      loading.value = false
      return
    }

    gaps.value = (data || []).map(gap => ({
      ...gap,
      prompt_text: gap.prompts?.prompt_text,
      competitor_name: gap.competitors?.name
    }))
  } catch (error) {
    console.error('Error loading gaps:', error)
  } finally {
    loading.value = false
  }
}

const runGapAnalysis = async () => {
  if (competitors.value.length === 0) {
    alert('Please add competitors first in the Competitors page.')
    return
  }

  analyzing.value = true
  try {
    for (const competitor of competitors.value) {
      await supabase.functions.invoke('trigger-competitor-analysis', {
        body: { competitorId: competitor.id }
      })
    }

    alert(`Gap analysis started for ${competitors.value.length} competitors! Results will appear shortly.`)

    // Reload after a delay
    setTimeout(loadGaps, 30000)
  } catch (error: any) {
    console.error('Error running gap analysis:', error)
    alert(`Failed to start gap analysis: ${error.message || 'Unknown error'}`)
  } finally {
    analyzing.value = false
  }
}

const markAsResolved = async (gapId: string) => {
  try {
    const { error } = await supabase
      .from('visibility_gaps')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', gapId)

    if (error) throw error
    await loadGaps()
  } catch (error) {
    console.error('Error marking gap as resolved:', error)
  }
}

const reopenGap = async (gapId: string) => {
  try {
    const { error } = await supabase
      .from('visibility_gaps')
      .update({ resolved_at: null })
      .eq('id', gapId)

    if (error) throw error
    await loadGaps()
  } catch (error) {
    console.error('Error reopening gap:', error)
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
</script>
