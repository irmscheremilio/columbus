<template>
  <div>
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Visibility Gaps</h1>
            <p class="mt-2 text-gray-600">
              Prompts where competitors appear but you don't - your biggest opportunities
            </p>
          </div>
          <button class="btn-primary" @click="runGapAnalysis" :disabled="analyzing">
            <svg v-if="!analyzing" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div v-else class="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            {{ analyzing ? 'Analyzing...' : 'Run Gap Analysis' }}
          </button>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div class="card-highlight">
            <div class="text-sm text-gray-600 mb-1">Total Gaps</div>
            <div class="text-3xl font-bold text-brand">{{ totalGaps }}</div>
            <div class="text-xs text-gray-500 mt-1">Opportunities found</div>
          </div>

          <div class="card-highlight">
            <div class="text-sm text-gray-600 mb-1">High Priority</div>
            <div class="text-3xl font-bold text-red-600">{{ highPriorityGaps }}</div>
            <div class="text-xs text-gray-500 mt-1">Competitive threats</div>
          </div>

          <div class="card-highlight">
            <div class="text-sm text-gray-600 mb-1">By Platform</div>
            <div class="text-lg font-semibold text-gray-900 mt-1">
              <div class="space-y-1">
                <div v-for="platform in platformBreakdown" :key="platform.name" class="flex justify-between text-sm">
                  <span>{{ platform.name }}</span>
                  <span class="font-bold">{{ platform.count }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card-highlight">
            <div class="text-sm text-gray-600 mb-1">Resolved</div>
            <div class="text-3xl font-bold text-green-600">{{ resolvedGaps }}</div>
            <div class="text-xs text-gray-500 mt-1">Gaps closed</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="card-highlight mb-6">
          <div class="flex flex-wrap gap-4">
            <div>
              <label class="label">Status</label>
              <select v-model="filterStatus" class="input w-40">
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label class="label">Platform</label>
              <select v-model="filterPlatform" class="input w-40">
                <option value="all">All</option>
                <option value="chatgpt">ChatGPT</option>
                <option value="claude">Claude</option>
                <option value="gemini">Gemini</option>
                <option value="perplexity">Perplexity</option>
              </select>
            </div>
            <div>
              <label class="label">Competitor</label>
              <select v-model="filterCompetitor" class="input w-48">
                <option value="all">All</option>
                <option v-for="comp in competitors" :key="comp.id" :value="comp.id">
                  {{ comp.name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!filteredGaps.length" class="card-highlight text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-gray-500 text-lg mb-2">
            {{ filterStatus === 'all' ? 'No visibility gaps found' : 'No gaps match your filters' }}
          </p>
          <p class="text-gray-400 text-sm mb-4">
            {{ filterStatus === 'all' ? 'Run a gap analysis to identify opportunities where competitors appear but you don\'t' : 'Try adjusting your filters' }}
          </p>
          <button v-if="filterStatus === 'all'" class="btn-primary" @click="runGapAnalysis">
            Run Gap Analysis
          </button>
        </div>

        <!-- Gaps List -->
        <div v-else class="space-y-4">
          <div
            v-for="gap in filteredGaps"
            :key="gap.id"
            class="card-highlight hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <!-- Header -->
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900 mb-1">
                      {{ gap.prompt_text || 'Prompt not available' }}
                    </h3>
                    <div class="flex items-center gap-2 text-sm text-gray-600">
                      <span class="px-2 py-1 bg-gray-100 rounded-full font-medium">
                        {{ gap.ai_model }}
                      </span>
                      <span>•</span>
                      <span class="font-medium text-brand">{{ gap.competitor_name }}</span>
                      <span>appears but you don't</span>
                    </div>
                  </div>

                  <span
                    v-if="!gap.resolved_at"
                    class="ml-4 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                  >
                    Open
                  </span>
                  <span
                    v-else
                    class="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    Resolved
                  </span>
                </div>

                <!-- Details -->
                <div class="bg-gray-50 rounded-lg p-4 mb-3">
                  <h4 class="text-sm font-semibold text-gray-900 mb-2">Why This Matters</h4>
                  <p class="text-sm text-gray-700">
                    This prompt represents actual user queries on {{ gap.ai_model }}. Your competitor
                    <strong>{{ gap.competitor_name }}</strong> is being recommended, but your brand isn't appearing.
                    This is a direct revenue opportunity.
                  </p>
                </div>

                <!-- Action Items -->
                <div class="border-t border-gray-200 pt-4">
                  <h4 class="text-sm font-semibold text-gray-900 mb-3">Recommended Actions</h4>
                  <div class="space-y-2">
                    <div class="flex items-start gap-3">
                      <div class="flex-shrink-0 w-6 h-6 bg-brand bg-opacity-10 text-brand rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                        1
                      </div>
                      <div class="flex-1">
                        <p class="text-sm text-gray-700">
                          Create content specifically targeting this query with FAQ schema markup
                        </p>
                      </div>
                    </div>
                    <div class="flex items-start gap-3">
                      <div class="flex-shrink-0 w-6 h-6 bg-brand bg-opacity-10 text-brand rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                        2
                      </div>
                      <div class="flex-1">
                        <p class="text-sm text-gray-700">
                          Include 40-60 word direct answer immediately after the question heading
                        </p>
                      </div>
                    </div>
                    <div class="flex items-start gap-3">
                      <div class="flex-shrink-0 w-6 h-6 bg-brand bg-opacity-10 text-brand rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                        3
                      </div>
                      <div class="flex-1">
                        <p class="text-sm text-gray-700">
                          Update content every 48-72 hours to leverage {{ gap.ai_model }}'s recency bias
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                  <button
                    v-if="!gap.resolved_at"
                    @click="createContentForGap(gap)"
                    class="btn-primary text-sm"
                  >
                    Create Content Brief
                  </button>
                  <button
                    v-if="!gap.resolved_at"
                    @click="markAsResolved(gap.id)"
                    class="btn-outline text-sm"
                  >
                    Mark as Resolved
                  </button>
                  <button
                    v-else
                    @click="reopenGap(gap.id)"
                    class="btn-outline text-sm"
                  >
                    Reopen
                  </button>
                  <span class="text-xs text-gray-500 ml-auto">
                    Detected {{ formatDate(gap.detected_at) }}
                  </span>
                </div>
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
  middleware: 'auth',
  layout: 'dashboard'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(true)
const analyzing = ref(false)
const gaps = ref<any[]>([])
const competitors = ref<any[]>([])
const filterStatus = ref('open')
const filterPlatform = ref('all')
const filterCompetitor = ref('all')

const filteredGaps = computed(() => {
  return gaps.value.filter(gap => {
    if (filterStatus.value === 'open' && gap.resolved_at) return false
    if (filterStatus.value === 'resolved' && !gap.resolved_at) return false
    if (filterPlatform.value !== 'all' && gap.ai_model !== filterPlatform.value) return false
    if (filterCompetitor.value !== 'all' && gap.competitor_id !== filterCompetitor.value) return false
    return true
  })
})

const totalGaps = computed(() => {
  return gaps.value.filter(g => !g.resolved_at).length
})

const highPriorityGaps = computed(() => {
  // Gaps from ChatGPT and Perplexity are higher priority (more traffic)
  return gaps.value.filter(
    g => !g.resolved_at && (g.ai_model === 'chatgpt' || g.ai_model === 'perplexity')
  ).length
})

const resolvedGaps = computed(() => {
  return gaps.value.filter(g => g.resolved_at).length
})

const platformBreakdown = computed(() => {
  const breakdown = gaps.value
    .filter(g => !g.resolved_at)
    .reduce((acc: any, gap) => {
      const platform = gap.ai_model
      acc[platform] = (acc[platform] || 0) + 1
      return acc
    }, {})

  return Object.entries(breakdown).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count
  }))
})

onMounted(async () => {
  await loadCompetitors()
  await loadGaps()
})

const loadCompetitors = async () => {
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) return

    const { data } = await supabase
      .from('competitors')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .eq('is_active', true)

    competitors.value = data || []
  } catch (error) {
    console.error('Error loading competitors:', error)
  }
}

const loadGaps = async () => {
  loading.value = true
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) return

    const { data } = await supabase
      .from('visibility_gaps')
      .select(`
        *,
        prompts (
          prompt_text
        ),
        competitors (
          name
        )
      `)
      .eq('organization_id', userData.organization_id)
      .order('detected_at', { ascending: false })

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
    // Trigger competitor analysis for each competitor
    for (const competitor of competitors.value) {
      await supabase.functions.invoke('trigger-competitor-analysis', {
        body: {
          competitorId: competitor.id
        }
      })
    }

    alert(`Gap analysis started for ${competitors.value.length} competitors! This typically takes 5-10 minutes. Refresh this page to see results.`)

    // Refresh after 10 minutes
    setTimeout(async () => {
      await loadGaps()
    }, 600000)
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
    alert('Failed to mark gap as resolved')
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
    alert('Failed to reopen gap')
  }
}

const createContentForGap = (gap: any) => {
  // Create a downloadable content brief
  const brief = `
CONTENT BRIEF: ${gap.prompt_text}

Platform: ${gap.ai_model}
Current Status: ${gap.competitor_name} appears, but you don't
Priority: High - Direct revenue opportunity

OBJECTIVE:
Create content that appears in ${gap.ai_model} responses for the query: "${gap.prompt_text}"

CONTENT REQUIREMENTS:

1. Title/H1:
   - Use the exact query as your H1: "${gap.prompt_text}"
   - Keep under 70 characters if possible

2. Direct Answer (40-60 words):
   - Place immediately after H1
   - Start with the direct answer first, then elaborate
   - Use factual, non-promotional language
   - Include specific data points and numbers

3. Content Structure:
   - Use question-based H2/H3 headings
   - Break content into scannable sections with <section> tags
   - Target 2,000-3,000 words for comprehensive coverage
   - Include comparison table if relevant

4. Technical Requirements:
   - Add FAQ schema markup (JSON-LD)
   - Use semantic HTML5 tags (<article>, <section>, <header>)
   - Ensure page loads under 2.5 seconds
   - Mobile responsive design
   - HTTPS enabled

5. Freshness Strategy:
   - Update content every 48-72 hours
   - Add new statistics or data points
   - Expand existing sections
   - Update "Last Modified" date prominently

6. Authority Signals:
   - Cite authoritative sources
   - Include expert quotes
   - Link to research studies
   - Add author bio with credentials

WHY THIS MATTERS:
${gap.ai_model} users are actively searching for this information. Your competitor is being recommended
while you're invisible. This content will help you capture this audience.

PLATFORM-SPECIFIC NOTES:
${getPlatformNotes(gap.ai_model)}

Generated by Columbus AEO Platform
  `.trim()

  const blob = new Blob([brief], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `content-brief-${gap.prompt_text.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

const getPlatformNotes = (platform: string) => {
  const notes: Record<string, string> = {
    chatgpt: '- ChatGPT has 76.4% recency bias (prioritizes content updated in last 30 days)\n- Wikipedia accounts for 7.8% of total citations\n- Does NOT execute JavaScript (use SSR)\n- Average 5 domains cited per response',
    perplexity: '- Reddit is #1 source (6.6% of citations)\n- 60% overlap with Google top 10 results\n- Transparent citation model always shows sources\n- Does NOT execute JavaScript\n- Strong freshness bias (7-day engagement window)',
    gemini: '- ONLY AI platform that executes JavaScript fully\n- Uses Googlebot index\n- Full Chrome rendering capabilities\n- Leverage Google Search Console data',
    claude: '- Uses ClaudeBot for indexing\n- Does NOT execute JavaScript\n- Less data available on citation preferences\n- Focus on content quality and structure'
  }
  return notes[platform] || '- Follow general AEO best practices'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>
