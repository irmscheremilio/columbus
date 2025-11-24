<template>
  <div class="min-h-screen bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center p-4">
    <div class="max-w-2xl w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Welcome to Columbus AEO!</h1>
        <p class="text-lg text-gray-600">Let's get your website optimized for AI search engines</p>
      </div>

      <!-- Onboarding Card -->
      <div class="card-highlight">
        <!-- Progress Steps -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div class="flex flex-col items-center flex-1">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                :class="step >= 1 ? 'bg-brand' : 'bg-gray-300'"
              >
                1
              </div>
              <span class="text-xs mt-2 font-medium">Website</span>
            </div>
            <div class="flex-1 h-1 mx-4" :class="step >= 2 ? 'bg-brand' : 'bg-gray-300'"></div>
            <div class="flex flex-col items-center flex-1">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                :class="step >= 2 ? 'bg-brand' : 'bg-gray-300'"
              >
                2
              </div>
              <span class="text-xs mt-2 font-medium">Analysis</span>
            </div>
            <div class="flex-1 h-1 mx-4" :class="step >= 3 ? 'bg-brand' : 'bg-gray-300'"></div>
            <div class="flex flex-col items-center flex-1">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                :class="step >= 3 ? 'bg-brand' : 'bg-gray-300'"
              >
                3
              </div>
              <span class="text-xs mt-2 font-medium">Complete</span>
            </div>
          </div>
        </div>

        <!-- Step 1: Website URL -->
        <div v-if="step === 1" class="space-y-6">
          <div>
            <h2 class="text-2xl font-bold mb-2">What's your website URL?</h2>
            <p class="text-gray-600">
              We'll analyze your website to understand your product and generate personalized search prompts.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              v-model="websiteUrl"
              type="url"
              placeholder="https://yourcompany.com"
              class="input-field"
              :class="{ 'border-red-500': urlError }"
              @input="urlError = ''"
            />
            <p v-if="urlError" class="mt-2 text-sm text-red-600">{{ urlError }}</p>
          </div>

          <button
            @click="submitWebsite"
            :disabled="loading || !websiteUrl"
            class="btn-primary w-full"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing website...
            </span>
            <span v-else>Continue →</span>
          </button>
        </div>

        <!-- Step 2: Analysis in Progress -->
        <div v-else-if="step === 2" class="space-y-6 text-center py-8">
          <div class="flex justify-center">
            <svg class="animate-spin h-16 w-16 text-brand" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>

          <div>
            <h2 class="text-2xl font-bold mb-2">Analyzing your website...</h2>
            <p class="text-gray-600">
              Our AI is crawling your site, understanding your product, and generating personalized search prompts. This usually takes 1-2 minutes.
            </p>
          </div>

          <div class="text-left bg-gray-50 rounded-lg p-4 space-y-2">
            <div class="flex items-center" :class="analysisStep >= 1 ? 'text-green-600' : 'text-gray-400'">
              <svg v-if="analysisStep >= 1" class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              <svg v-else class="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="font-medium">Crawling website</span>
            </div>
            <div class="flex items-center" :class="analysisStep >= 2 ? 'text-green-600' : 'text-gray-400'">
              <svg v-if="analysisStep >= 2" class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              <svg v-else class="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="font-medium">Understanding your product</span>
            </div>
            <div class="flex items-center" :class="analysisStep >= 3 ? 'text-green-600' : 'text-gray-400'">
              <svg v-if="analysisStep >= 3" class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              <svg v-else class="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="font-medium">Generating search prompts</span>
            </div>
          </div>
        </div>

        <!-- Step 3: Complete -->
        <div v-else-if="step === 3" class="space-y-6 text-center py-8">
          <div class="flex justify-center">
            <svg class="w-20 h-20 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
          </div>

          <div>
            <h2 class="text-2xl font-bold mb-2">You're all set!</h2>
            <p class="text-gray-600 mb-4">
              We've generated {{ generatedPromptsCount }} personalized search prompts for your product.
            </p>
            <p class="text-sm text-gray-500">
              These prompts are at different granularity levels (broad to specific) to help you understand where your brand appears in AI search results.
            </p>
          </div>

          <div class="flex gap-4 justify-center">
            <NuxtLink to="/dashboard" class="btn-primary">
              Go to Dashboard →
            </NuxtLink>
            <NuxtLink to="/dashboard/prompts" class="btn-outline">
              View Prompts
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const step = ref(1)
const loading = ref(false)
const websiteUrl = ref('')
const urlError = ref('')
const analysisStep = ref(0)
const jobId = ref<string | null>(null)
const generatedPromptsCount = ref(0)

// Check if already onboarded
onMounted(async () => {
  const { data: userData } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.value?.id)
    .single()

  if (userData?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('domain, onboarding_completed, website_analyzed')
      .eq('id', userData.organization_id)
      .single()

    if (org?.onboarding_completed) {
      // Already onboarded, redirect to dashboard
      navigateTo('/dashboard')
    } else if (org?.domain) {
      // Has domain but not completed, prefill it
      websiteUrl.value = org.domain
    }
  }
})

const submitWebsite = async () => {
  if (!websiteUrl.value) {
    urlError.value = 'Please enter your website URL'
    return
  }

  // Validate URL
  try {
    const url = new URL(websiteUrl.value.startsWith('http') ? websiteUrl.value : `https://${websiteUrl.value}`)
    websiteUrl.value = url.origin
  } catch {
    urlError.value = 'Please enter a valid URL'
    return
  }

  loading.value = true
  urlError.value = ''

  try {
    // Get organization
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) {
      throw new Error('Organization not found')
    }

    // Update organization domain
    await supabase
      .from('organizations')
      .update({ domain: websiteUrl.value })
      .eq('id', userData.organization_id)

    // Trigger website analysis
    const { data: { session } } = await supabase.auth.getSession()

    const { data, error } = await supabase.functions.invoke('trigger-website-analysis', {
      headers: {
        Authorization: `Bearer ${session?.access_token}`
      },
      body: {
        domain: websiteUrl.value
      }
    })

    if (error) {
      throw error
    }

    jobId.value = data.jobId
    step.value = 2
    loading.value = false

    // Start polling for job completion
    pollJobStatus()
  } catch (error: any) {
    console.error('Error submitting website:', error)
    urlError.value = error.message || 'Failed to start analysis'
    loading.value = false
  }
}

const pollJobStatus = async () => {
  if (!jobId.value) return

  analysisStep.value = 1

  const pollInterval = setInterval(async () => {
    try {
      const { data: job } = await supabase
        .from('jobs')
        .select('status')
        .eq('id', jobId.value)
        .single()

      if (!job) return

      // Update analysis steps based on time elapsed
      if (analysisStep.value === 1) {
        setTimeout(() => analysisStep.value = 2, 5000)
      }
      if (analysisStep.value === 2) {
        setTimeout(() => analysisStep.value = 3, 10000)
      }

      if (job.status === 'completed') {
        clearInterval(pollInterval)
        analysisStep.value = 3

        // Get generated prompts count
        const { data: userData } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.value?.id)
          .single()

        if (userData?.organization_id) {
          const { count } = await supabase
            .from('prompts')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', userData.organization_id)

          generatedPromptsCount.value = count || 0
        }

        // Move to step 3 after a short delay
        setTimeout(() => {
          step.value = 3
        }, 1000)
      } else if (job.status === 'failed') {
        clearInterval(pollInterval)
        urlError.value = 'Website analysis failed. Please try again.'
        step.value = 1
        loading.value = false
      }
    } catch (error) {
      console.error('Error polling job status:', error)
    }
  }, 3000) // Poll every 3 seconds
}
</script>
