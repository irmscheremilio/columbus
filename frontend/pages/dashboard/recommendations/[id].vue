<template>
  <div>
    <main class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="text-center">
          <div class="relative w-16 h-16 mx-auto mb-4">
            <div class="absolute inset-0 rounded-full border-4 border-primary-100"></div>
            <div class="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
          </div>
          <p class="text-gray-500">Loading recommendation...</p>
        </div>
      </div>

      <!-- Not Found State -->
      <div v-else-if="!recommendation" class="bg-white rounded-2xl border border-gray-200 text-center py-16 px-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Recommendation not found</h2>
        <p class="text-gray-500 mb-6">This recommendation may have been removed or doesn't exist.</p>
        <NuxtLink to="/dashboard/recommendations" class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Recommendations
        </NuxtLink>
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-6">
        <!-- Back Link -->
        <NuxtLink
          to="/dashboard/recommendations"
          class="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium group"
        >
          <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Recommendations
        </NuxtLink>

        <!-- Hero Card -->
        <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <!-- Header with gradient based on priority -->
          <div
            class="px-8 py-6"
            :class="getHeaderGradient(recommendation.priority)"
          >
            <div class="flex items-start gap-5">
              <!-- Priority Badge -->
              <div class="flex-shrink-0">
                <div
                  class="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                  :class="getPriorityBgClass(recommendation.priority)"
                >
                  P{{ recommendation.priority }}
                </div>
              </div>

              <!-- Title & Meta -->
              <div class="flex-1 min-w-0">
                <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ recommendation.title }}</h1>
                <p class="text-gray-600 leading-relaxed">{{ recommendation.description }}</p>
              </div>
            </div>
          </div>

          <!-- Meta Tags -->
          <div class="px-8 py-4 border-t border-gray-100 bg-gray-50/50">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {{ recommendation.category }}
              </span>
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                :class="getImpactClass(recommendation.estimated_impact)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {{ recommendation.estimated_impact }} impact
              </span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-sm font-medium">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {{ recommendation.difficulty }}
              </span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-medium">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ recommendation.estimated_time }}
              </span>
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                :class="getStatusClass(recommendation.status)"
              >
                <span class="w-2 h-2 rounded-full" :class="getStatusDotClass(recommendation.status)"></span>
                {{ formatStatus(recommendation.status) }}
              </span>
            </div>
          </div>

          <!-- Page URL indicator -->
          <div v-if="recommendation.page_url || recommendation.page_title || recommendation.ai_platform_specific" class="px-8 py-4 border-t border-gray-100">
            <div class="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-medium text-blue-900">
                  <span v-if="recommendation.page_url">
                    Applies to:
                    <a :href="recommendation.page_url" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-800 underline underline-offset-2">
                      {{ recommendation.page_title || recommendation.page_url }}
                    </a>
                  </span>
                  <span v-else-if="recommendation.ai_platform_specific && recommendation.ai_platform_specific.length > 0">
                    Optimized for: {{ recommendation.ai_platform_specific.join(', ') }}
                  </span>
                  <span v-else>{{ recommendation.page_title || 'General / Sitewide' }}</span>
                </p>
                <p class="text-xs text-blue-600 mt-1">This recommendation targets specific optimization opportunities.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
              <p class="text-sm text-gray-500 mt-0.5">Update the status of this recommendation</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                v-if="recommendation.status === 'pending'"
                @click="updateStatus('in_progress')"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all font-medium shadow-sm hover:shadow-md"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Implementation
              </button>
              <button
                v-if="recommendation.status === 'in_progress'"
                @click="updateStatus('completed')"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium shadow-sm hover:shadow-md"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mark Complete
              </button>
              <button
                v-if="recommendation.status !== 'dismissed'"
                @click="updateStatus('dismissed')"
                class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Dismiss
              </button>
              <button
                v-if="recommendation.status !== 'pending'"
                @click="updateStatus('pending')"
                class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reopen
              </button>
            </div>
          </div>
        </div>

        <!-- Research Insight -->
        <div v-if="recommendation.research_insight" class="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-amber-900 mb-1">Research-Backed Insight</h3>
              <p class="text-amber-800 leading-relaxed">{{ recommendation.research_insight }}</p>
            </div>
          </div>
        </div>

        <!-- Implementation Guide -->
        <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-100">
            <h2 class="text-xl font-semibold text-gray-900">Implementation Guide</h2>
            <p class="text-sm text-gray-500 mt-1">Step-by-step instructions for your platform</p>
          </div>

          <!-- Platform Tabs -->
          <div v-if="implementationGuide.length > 0" class="border-b border-gray-100">
            <div class="px-6 flex gap-1 overflow-x-auto">
              <button
                v-for="guide in implementationGuide"
                :key="guide.platform"
                @click="selectedPlatform = guide.platform"
                class="relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
                :class="selectedPlatform === guide.platform
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'"
              >
                {{ formatPlatform(guide.platform) }}
                <span
                  v-if="selectedPlatform === guide.platform"
                  class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                ></span>
              </button>
            </div>
          </div>

          <!-- Guide Content -->
          <div v-if="currentGuide" class="p-6 space-y-6">
            <!-- Recommended Tools -->
            <div v-if="currentGuide.pluginsOrTools && currentGuide.pluginsOrTools.length > 0">
              <div class="flex items-center gap-2 mb-3">
                <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <h3 class="font-semibold text-gray-900">Recommended Tools</h3>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tool in currentGuide.pluginsOrTools"
                  :key="tool"
                  class="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-medium"
                >
                  {{ tool }}
                </span>
              </div>
            </div>

            <!-- Steps -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h3 class="font-semibold text-gray-900">Step-by-Step Instructions</h3>
              </div>
              <div class="space-y-3">
                <div
                  v-for="(step, index) in currentGuide.steps"
                  :key="index"
                  class="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                    {{ index + 1 }}
                  </div>
                  <p class="flex-1 text-gray-700 pt-1">{{ step }}</p>
                </div>
              </div>
            </div>

            <!-- Video Link -->
            <div v-if="currentGuide.videoUrl" class="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1">
                <a :href="currentGuide.videoUrl" target="_blank" rel="noopener" class="font-medium text-purple-700 hover:text-purple-800">
                  Watch Video Tutorial
                </a>
                <p class="text-sm text-purple-600">Learn with a step-by-step walkthrough</p>
              </div>
              <svg class="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>

          <!-- No guides fallback -->
          <div v-else class="p-6 text-center text-gray-500">
            <p>No implementation guide available for this recommendation.</p>
          </div>
        </div>

        <!-- Code Snippets -->
        <div v-if="codeSnippets && codeSnippets.length > 0" class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-100">
            <h2 class="text-xl font-semibold text-gray-900">Code Snippets</h2>
            <p class="text-sm text-gray-500 mt-1">Ready-to-use code for implementation</p>
          </div>

          <div class="p-6 space-y-4">
            <div
              v-for="(snippet, index) in codeSnippets"
              :key="index"
              class="rounded-xl overflow-hidden border border-gray-200"
            >
              <div class="bg-gray-100 px-4 py-3 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-mono uppercase">{{ snippet.language || 'code' }}</span>
                  <span class="text-sm text-gray-600">{{ snippet.description }}</span>
                  <span v-if="snippet.filename" class="text-xs text-gray-400">{{ snippet.filename }}</span>
                </div>
                <button
                  @click="copyCode(snippet.code, index)"
                  class="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  :class="copiedStates[index] ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-600'"
                >
                  <svg v-if="!copiedStates[index]" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ copiedStates[index] ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <pre class="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm leading-relaxed"><code>{{ snippet.code }}</code></pre>
            </div>
          </div>
        </div>

        <!-- Expected Impact -->
        <div class="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white shadow-lg shadow-primary-500/20">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="flex-1">
              <h2 class="text-xl font-bold mb-3">Expected Impact</h2>
              <p class="text-white/90 leading-relaxed mb-4">
                Implementing this recommendation will have a <strong class="text-white">{{ recommendation.estimated_impact }}</strong> impact
                on your overall AEO visibility score. This fix is rated as <strong class="text-white">{{ recommendation.difficulty }}</strong> difficulty
                and should take approximately <strong class="text-white">{{ recommendation.estimated_time }}</strong> to complete.
              </p>
              <p class="text-white/80 text-sm">
                Based on our analysis of {{ totalScans }} AI model tests, this optimization addresses a key factor
                in how AI engines discover and cite your content.
              </p>
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

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(true)
const recommendation = ref<any>(null)
const selectedPlatform = ref<string>('')
const copiedStates = ref<Record<number, boolean>>({})
const totalScans = ref(0)

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

const getHeaderGradient = (priority: number) => {
  if (priority >= 5) return 'bg-gradient-to-r from-red-50 to-orange-50'
  if (priority >= 4) return 'bg-gradient-to-r from-orange-50 to-amber-50'
  if (priority >= 3) return 'bg-gradient-to-r from-yellow-50 to-lime-50'
  return 'bg-gradient-to-r from-blue-50 to-cyan-50'
}

const getPriorityBgClass = (priority: number) => {
  if (priority >= 5) return 'bg-gradient-to-br from-red-500 to-red-600'
  if (priority >= 4) return 'bg-gradient-to-br from-orange-500 to-orange-600'
  if (priority >= 3) return 'bg-gradient-to-br from-yellow-500 to-yellow-600'
  return 'bg-gradient-to-br from-blue-500 to-blue-600'
}

const getImpactClass = (impact: string) => {
  switch (impact?.toLowerCase()) {
    case 'high':
      return 'bg-red-50 text-red-700 border border-red-100'
    case 'medium':
      return 'bg-orange-50 text-orange-700 border border-orange-100'
    default:
      return 'bg-blue-50 text-blue-700 border border-blue-100'
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-50 text-green-700 border border-green-100'
    case 'in_progress':
      return 'bg-blue-50 text-blue-700 border border-blue-100'
    case 'dismissed':
      return 'bg-gray-100 text-gray-600 border border-gray-200'
    default:
      return 'bg-yellow-50 text-yellow-700 border border-yellow-100'
  }
}

const getStatusDotClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500'
    case 'in_progress':
      return 'bg-blue-500'
    case 'dismissed':
      return 'bg-gray-400'
    default:
      return 'bg-yellow-500'
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
