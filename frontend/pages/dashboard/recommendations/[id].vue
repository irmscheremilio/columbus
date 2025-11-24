<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardNav />

    <main class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>

      <div v-else-if="!recommendation" class="card text-center py-12">
        <p class="text-gray-500">Recommendation not found</p>
        <NuxtLink to="/dashboard/recommendations" class="btn btn-primary mt-4">
          Back to Recommendations
        </NuxtLink>
      </div>

      <div v-else class="px-4 py-6 sm:px-0">
        <!-- Header -->
        <div class="mb-6">
          <NuxtLink to="/dashboard/recommendations" class="text-primary-600 hover:text-primary-700 mb-4 inline-block">
            ← Back to Recommendations
          </NuxtLink>
          <div class="flex items-start gap-4">
            <div
              class="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
              :class="getPriorityColor(recommendation.priority)"
            >
              {{ recommendation.priority }}
            </div>
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900">{{ recommendation.title }}</h1>
              <p class="text-gray-600 mt-2">{{ recommendation.description }}</p>
              <div class="flex items-center gap-3 mt-4">
                <span class="text-sm px-3 py-1 bg-gray-100 rounded-full">
                  {{ recommendation.category }}
                </span>
                <span
                  class="text-sm px-3 py-1 rounded-full"
                  :class="getImpactClass(recommendation.estimated_impact)"
                >
                  Impact: {{ recommendation.estimated_impact }}
                </span>
                <span
                  class="text-sm px-3 py-1 rounded-full"
                  :class="getStatusClass(recommendation.status)"
                >
                  {{ formatStatus(recommendation.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="card mb-6">
          <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
          <div class="flex flex-wrap gap-3">
            <button
              v-if="recommendation.status === 'pending'"
              @click="updateStatus('in_progress')"
              class="btn btn-primary"
            >
              Mark as In Progress
            </button>
            <button
              v-if="recommendation.status === 'in_progress'"
              @click="updateStatus('completed')"
              class="btn bg-green-600 text-white hover:bg-green-700"
            >
              Mark as Completed
            </button>
            <button
              v-if="recommendation.status !== 'dismissed'"
              @click="updateStatus('dismissed')"
              class="btn btn-outline"
            >
              Dismiss
            </button>
            <button
              v-if="recommendation.status !== 'pending'"
              @click="updateStatus('pending')"
              class="btn btn-outline"
            >
              Reopen
            </button>
          </div>
        </div>

        <!-- Implementation Guide -->
        <div class="card mb-6">
          <h2 class="text-lg font-semibold mb-4">Implementation Guide</h2>

          <div v-if="!recommendation.implementation_guide || Object.keys(recommendation.implementation_guide).length === 0" class="text-gray-500">
            No implementation guide available for this recommendation.
          </div>

          <div v-else class="space-y-6">
            <!-- Platform Tabs -->
            <div class="border-b border-gray-200">
              <nav class="-mb-px flex space-x-8">
                <button
                  v-for="platform in Object.keys(recommendation.implementation_guide)"
                  :key="platform"
                  @click="selectedPlatform = platform"
                  class="py-4 px-1 border-b-2 font-medium text-sm"
                  :class="selectedPlatform === platform
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                >
                  {{ formatPlatform(platform) }}
                </button>
              </nav>
            </div>

            <!-- Platform Guide -->
            <div v-if="selectedPlatform && recommendation.implementation_guide[selectedPlatform]">
              <div class="mb-4 flex items-center gap-4 text-sm">
                <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Difficulty: {{ recommendation.implementation_guide[selectedPlatform].difficulty }}
                </span>
                <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                  Time: {{ recommendation.implementation_guide[selectedPlatform].estimatedTime }}
                </span>
              </div>

              <div class="space-y-4">
                <div
                  v-for="(step, index) in recommendation.implementation_guide[selectedPlatform].steps"
                  :key="index"
                  class="flex gap-4"
                >
                  <div class="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold">
                    {{ index + 1 }}
                  </div>
                  <div class="flex-1 pt-1">
                    <p class="text-gray-700">{{ step }}</p>
                  </div>
                </div>
              </div>

              <!-- Code Snippets -->
              <div
                v-if="recommendation.implementation_guide[selectedPlatform].codeSnippets"
                class="mt-6"
              >
                <h3 class="font-semibold mb-3">Code Snippets</h3>
                <div
                  v-for="(snippet, index) in recommendation.implementation_guide[selectedPlatform].codeSnippets"
                  :key="index"
                  class="mb-4"
                >
                  <div v-if="snippet.description" class="text-sm text-gray-600 mb-2">
                    {{ snippet.description }}
                  </div>
                  <div class="relative">
                    <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto"><code>{{ snippet.code }}</code></pre>
                    <button
                      @click="copyCode(snippet.code)"
                      class="absolute top-2 right-2 btn btn-outline text-xs bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Why This Matters -->
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Why This Matters</h2>
          <div class="prose max-w-none">
            <p class="text-gray-700">
              Implementing this fix will help AI engines better understand and recommend your brand.
              Based on our analysis, this change has a <strong>{{ recommendation.estimated_impact }}</strong> impact
              on your overall visibility score.
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
const selectedPlatform = ref<string>('wordpress')

onMounted(async () => {
  await loadRecommendation()
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
    if (data?.implementation_guide) {
      const platforms = Object.keys(data.implementation_guide)
      if (platforms.length > 0) {
        selectedPlatform.value = platforms[0]
      }
    }
  } catch (error) {
    console.error('Error loading recommendation:', error)
  } finally {
    loading.value = false
  }
}

const updateStatus = async (status: string) => {
  if (!recommendation.value) return

  try {
    const updates: any = { status }
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
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

const copyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    alert('Code copied to clipboard!')
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

const getPriorityColor = (priority: number) => {
  if (priority >= 4) return 'bg-red-500'
  if (priority >= 3) return 'bg-orange-500'
  return 'bg-yellow-500'
}

const getImpactClass = (impact: string) => {
  switch (impact) {
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
    custom: 'Custom/HTML',
    general: 'General'
  }
  return platformNames[platform] || platform
}
</script>
