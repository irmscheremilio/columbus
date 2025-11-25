<template>
  <div class="min-h-screen bg-background">
    <DashboardNav />

    <main class="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
      </div>

      <div v-else-if="!recommendation" class="card-highlight text-center py-12">
        <p class="text-gray-500">Recommendation not found</p>
        <NuxtLink to="/dashboard/recommendations" class="btn-primary mt-4 inline-block">
          Back to Recommendations
        </NuxtLink>
      </div>

      <div v-else class="px-4 py-6 sm:px-0">
        <!-- Header -->
        <div class="mb-6">
          <NuxtLink to="/dashboard/recommendations" class="text-brand hover:text-brand-dark mb-4 inline-flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Recommendations
          </NuxtLink>

          <div class="flex items-start gap-6">
            <div
              class="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
              :class="getPriorityColor(recommendation.priority)"
            >
              {{ recommendation.priority }}
            </div>

            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ recommendation.title }}</h1>
              <p class="text-lg text-gray-600 mb-4">{{ recommendation.description }}</p>

              <div class="flex flex-wrap items-center gap-3">
                <span class="text-sm px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full font-medium">
                  {{ recommendation.category }}
                </span>
                <span
                  class="text-sm px-3 py-1.5 rounded-full font-medium"
                  :class="getImpactClass(recommendation.estimated_impact)"
                >
                  {{ recommendation.estimated_impact }} impact
                </span>
                <span class="text-sm px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full font-medium">
                  {{ recommendation.difficulty }}
                </span>
                <span class="text-sm px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full font-medium">
                  {{ recommendation.estimated_time }}
                </span>
                <span
                  class="text-sm px-3 py-1.5 rounded-full font-medium"
                  :class="getStatusClass(recommendation.status)"
                >
                  {{ formatStatus(recommendation.status) }}
                </span>
              </div>

              <!-- Page URL indicator -->
              <div v-if="recommendation.page_url || recommendation.page_title" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-center gap-2 text-blue-800">
                  <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span class="font-medium">Page:</span>
                  <span v-if="recommendation.page_url">
                    <a :href="recommendation.page_url" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-800 underline">
                      {{ recommendation.page_title || recommendation.page_url }}
                    </a>
                  </span>
                  <span v-else>{{ recommendation.page_title || 'General / Sitewide' }}</span>
                </div>
                <p class="text-sm text-blue-700 mt-1">
                  This recommendation applies specifically to this page.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="card-highlight mb-6">
          <h2 class="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h2>
          <div class="flex flex-wrap gap-3">
            <button
              v-if="recommendation.status === 'pending'"
              @click="updateStatus('in_progress')"
              class="btn-primary"
            >
              Start Implementation
            </button>
            <button
              v-if="recommendation.status === 'in_progress'"
              @click="updateStatus('completed')"
              class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Mark as Completed
            </button>
            <button
              v-if="recommendation.status !== 'dismissed'"
              @click="updateStatus('dismissed')"
              class="btn-outline"
            >
              Dismiss
            </button>
            <button
              v-if="recommendation.status !== 'pending'"
              @click="updateStatus('pending')"
              class="btn-outline"
            >
              Reopen
            </button>
          </div>
        </div>

        <!-- Research Data -->
        <div v-if="researchData[recommendation.category]" class="card-highlight mb-6 border-l-4 border-brand">
          <div class="flex items-start gap-3">
            <svg class="w-6 h-6 text-brand flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">Research-Backed Insight</h3>
              <p class="text-gray-700">{{ researchData[recommendation.category] }}</p>
            </div>
          </div>
        </div>

        <!-- Platform Selector -->
        <div class="card-highlight mb-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-900">Implementation Guide</h2>

          <!-- Platform Tabs -->
          <div class="border-b border-gray-200 mb-6">
            <nav class="-mb-px flex space-x-6 overflow-x-auto">
              <button
                v-for="guide in implementationGuide"
                :key="guide.platform"
                @click="selectedPlatform = guide.platform"
                class="py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors"
                :class="selectedPlatform === guide.platform
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              >
                {{ formatPlatform(guide.platform) }}
              </button>
            </nav>
          </div>

          <!-- Selected Platform Guide -->
          <div v-if="currentGuide" class="space-y-6">
            <!-- Plugins/Tools -->
            <div v-if="currentGuide.pluginsOrTools && currentGuide.pluginsOrTools.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 class="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Recommended Tools
              </h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tool in currentGuide.pluginsOrTools"
                  :key="tool"
                  class="px-3 py-1.5 bg-white border border-blue-300 text-blue-800 rounded-full text-sm font-medium"
                >
                  {{ tool }}
                </span>
              </div>
            </div>

            <!-- Steps -->
            <div class="space-y-4">
              <h3 class="font-semibold text-gray-900 text-lg">Step-by-Step Instructions</h3>
              <div
                v-for="(step, index) in currentGuide.steps"
                :key="index"
                class="flex gap-4 group"
              >
                <div class="flex-shrink-0 w-10 h-10 bg-brand bg-opacity-10 text-brand rounded-full flex items-center justify-center font-bold group-hover:bg-opacity-20 transition-colors">
                  {{ index + 1 }}
                </div>
                <div class="flex-1 pt-2">
                  <p class="text-gray-700 text-base">{{ step }}</p>
                </div>
              </div>
            </div>

            <!-- Video Link -->
            <div v-if="currentGuide.videoUrl" class="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <a :href="currentGuide.videoUrl" target="_blank" rel="noopener" class="flex items-center gap-3 text-purple-900 hover:text-purple-700">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="font-medium">Watch Video Tutorial</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <!-- Code Snippets -->
        <div v-if="codeSnippets && codeSnippets.length > 0" class="card-highlight mb-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-900">Code Snippets</h2>
          <div class="space-y-6">
            <div
              v-for="(snippet, index) in codeSnippets"
              :key="index"
              class="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div class="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <span class="text-sm font-medium text-gray-700">{{ snippet.description || snippet.language }}</span>
                  <span v-if="snippet.filename" class="text-xs text-gray-500 ml-2">{{ snippet.filename }}</span>
                </div>
                <button
                  @click="copyCode(snippet.code, index)"
                  class="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <svg v-if="!copiedStates[index]" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <svg v-else class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ copiedStates[index] ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <div class="relative">
                <pre class="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm"><code>{{ snippet.code }}</code></pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Expected Impact -->
        <div class="card-highlight bg-gradient-to-br from-brand to-brand-dark text-white">
          <h2 class="text-xl font-semibold mb-3">Expected Impact</h2>
          <div class="prose prose-invert max-w-none">
            <p class="text-white text-opacity-95">
              Implementing this recommendation will have a <strong class="text-white">{{ recommendation.estimated_impact }}</strong> impact
              on your overall AEO visibility score. This fix is rated as <strong>{{ recommendation.difficulty }}</strong> difficulty
              and should take approximately <strong>{{ recommendation.estimated_time }}</strong> to complete.
            </p>
            <p class="text-white text-opacity-90 mt-3">
              Based on our analysis of {{ totalScans }} AI model tests, this optimization addresses a key factor
              in how AI engines discover and cite your content.
            </p>
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

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(true)
const recommendation = ref<any>(null)
const selectedPlatform = ref<string>('')
const copiedStates = ref<Record<number, boolean>>({})
const totalScans = ref(0)

const researchData: Record<string, string> = {
  schema: 'Research shows FAQ schema is the #1 most effective AEO optimization with 40-60% improvement in visibility. AI models explicitly look for structured Q&A content in JSON-LD format.',
  content: 'Studies show content with 40-60 word direct answers has a 3.2× higher citation rate. AI models prioritize concise, factual responses that directly answer user queries.',
  technical: 'Pages loading under 2.5 seconds have 47% higher AI citation rates. 3 out of 4 AI platforms cannot execute JavaScript, making SSR critical for visibility.',
  authority: 'Wikipedia accounts for 7.8% of total ChatGPT citations. Getting mentioned on high-authority platforms like G2, Reddit, and industry publications significantly increases AI visibility.'
}

const implementationGuide = computed(() => {
  if (!recommendation.value?.implementation_guide) return []
  return recommendation.value.implementation_guide
})

const currentGuide = computed(() => {
  if (!selectedPlatform.value || !implementationGuide.value) return null
  return implementationGuide.value.find((g: any) => g.platform === selectedPlatform.value)
})

const codeSnippets = computed(() => {
  return recommendation.value?.code_snippets || []
})

onMounted(async () => {
  await loadRecommendation()
  await loadScanCount()
})

const loadRecommendation = async () => {
  loading.value = true
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) return

    const { data } = await supabase
      .from('fix_recommendations')
      .select('*')
      .eq('id', route.params.id)
      .eq('organization_id', userData.organization_id)
      .single()

    recommendation.value = data

    // Set default platform
    if (data?.implementation_guide && Array.isArray(data.implementation_guide) && data.implementation_guide.length > 0) {
      selectedPlatform.value = data.implementation_guide[0].platform
    }
  } catch (error) {
    console.error('Error loading recommendation:', error)
  } finally {
    loading.value = false
  }
}

const loadScanCount = async () => {
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) return

    const { count } = await supabase
      .from('prompt_results')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userData.organization_id)

    totalScans.value = count || 0
  } catch (error) {
    console.error('Error loading scan count:', error)
  }
}

const updateStatus = async (status: string) => {
  if (!recommendation.value) return

  try {
    const updates: any = { status }
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    } else if (status === 'in_progress') {
      updates.started_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('fix_recommendations')
      .update(updates)
      .eq('id', recommendation.value.id)

    if (error) throw error

    await loadRecommendation()
  } catch (error) {
    console.error('Error updating status:', error)
    alert('Failed to update status')
  }
}

const copyCode = async (code: string, index: number) => {
  try {
    await navigator.clipboard.writeText(code)
    copiedStates.value[index] = true
    setTimeout(() => {
      copiedStates.value[index] = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy:', error)
    alert('Failed to copy code')
  }
}

const getPriorityColor = (priority: number) => {
  if (priority >= 5) return 'bg-red-500'
  if (priority >= 4) return 'bg-orange-500'
  if (priority >= 3) return 'bg-yellow-500'
  return 'bg-blue-500'
}

const getImpactClass = (impact: string) => {
  switch (impact?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'dismissed':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-yellow-100 text-yellow-800'
  }
}

const formatStatus = (status: string) => {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const formatPlatform = (platform: string) => {
  const platformNames: Record<string, string> = {
    wordpress: 'WordPress',
    shopify: 'Shopify',
    webflow: 'Webflow',
    nextjs: 'Next.js',
    nuxt: 'Nuxt',
    react: 'React',
    vue: 'Vue',
    custom: 'Custom/HTML',
    general: 'General',
    all: 'All Platforms'
  }
  return platformNames[platform.toLowerCase()] || platform
}
</script>
