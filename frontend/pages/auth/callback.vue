<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50">
    <div class="text-center w-full max-w-lg px-4">
      <!-- Loading state (initial auth check) -->
      <div v-if="step === 'loading'" class="space-y-6">
        <div class="relative w-16 h-16 mx-auto">
          <div class="absolute inset-0 rounded-full border-4 border-primary-100"></div>
          <div class="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
        </div>
        <p class="text-gray-600 font-medium">{{ statusMessage }}</p>
      </div>

      <!-- Welcome screen - Ask if user wants free audit -->
      <div v-else-if="step === 'welcome'" class="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10">
        <div class="mb-8">
          <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome to Columbus!</h2>
          <p class="text-gray-500">Your account is ready. Would you like a free AI visibility audit?</p>
        </div>

        <div class="space-y-4">
          <button
            @click="step = 'product-form'"
            class="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
            Yes, Analyze My Website
          </button>

          <button
            @click="skipToGashboard"
            class="w-full py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Skip for now
          </button>
        </div>

        <p class="mt-6 text-xs text-gray-400">
          You can always add a product later from your dashboard.
        </p>
      </div>

      <!-- Product form -->
      <div v-else-if="step === 'product-form'" class="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10">
        <div class="mb-8">
          <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Add Your Product</h2>
          <p class="text-gray-500">Tell us about your product so we can analyze its AI visibility</p>
        </div>

        <form @submit.prevent="createProduct" class="space-y-5">
          <div v-if="error" class="rounded-xl bg-red-50 border border-red-100 p-4">
            <div class="flex gap-3">
              <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p class="text-sm text-red-700">{{ error }}</p>
            </div>
          </div>

          <div>
            <label for="productName" class="block text-sm font-medium text-gray-700 text-left mb-2">
              Product Name <span class="text-red-500">*</span>
            </label>
            <input
              id="productName"
              v-model="productForm.name"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              placeholder="My Awesome Product"
            />
          </div>

          <div>
            <label for="website" class="block text-sm font-medium text-gray-700 text-left mb-2">
              Website <span class="text-red-500">*</span>
            </label>
            <input
              id="website"
              v-model="productForm.website"
              type="url"
              required
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              placeholder="https://yourproduct.com"
            />
            <p class="text-xs text-gray-400 mt-2 text-left">
              We'll analyze your website to understand your product
            </p>
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 text-left mb-2">
              What does your product do? <span class="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="description"
              v-model="productForm.description"
              rows="3"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
              placeholder="e.g., We provide AI-powered analytics for e-commerce businesses..."
            ></textarea>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="step = 'welcome'"
              class="px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/25"
            >
              <svg v-if="loading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Creating...' : 'Analyze & Continue' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Analyzing website state -->
      <div v-else-if="step === 'analyzing'" class="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10">
        <div class="mb-8">
          <div class="relative w-20 h-20 mx-auto mb-6">
            <div class="absolute inset-0 rounded-full bg-primary-500/20 animate-ping"></div>
            <div class="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Website</h2>
          <p class="text-gray-500">We're using AI to understand your product and optimize for visibility</p>
        </div>

        <!-- Progress Steps -->
        <div class="space-y-4 mb-8">
          <div
            v-for="(analysisStep, index) in analysisSteps"
            :key="analysisStep.id"
            class="flex items-center gap-4 p-4 rounded-xl transition-all duration-500"
            :class="getStepClasses(index)"
          >
            <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500"
                 :class="getStepIndicatorClasses(index)">
              <svg v-if="currentAnalysisStep > index" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <div v-else-if="currentAnalysisStep === index" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span v-else class="text-sm font-semibold text-gray-400">{{ index + 1 }}</span>
            </div>

            <div class="flex-1 text-left">
              <p class="font-medium transition-colors duration-300"
                 :class="currentAnalysisStep >= index ? 'text-gray-900' : 'text-gray-400'">
                {{ analysisStep.title }}
              </p>
              <p v-if="currentAnalysisStep === index" class="text-sm text-gray-500 mt-0.5">
                {{ analysisStep.description }}
              </p>
            </div>

            <div class="flex-shrink-0">
              <span v-if="currentAnalysisStep > index" class="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Done
              </span>
              <span v-else-if="currentAnalysisStep === index" class="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full animate-pulse">
                In Progress
              </span>
            </div>
          </div>
        </div>

        <div class="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
          <div
            class="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700 ease-out"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>

        <p class="text-sm text-gray-400">
          {{ currentAnalysisStep >= analysisSteps.length ? 'Complete!' : 'This may take 1-2 minutes...' }}
        </p>
      </div>

      <!-- Footer branding -->
      <p class="mt-8 text-sm text-gray-400">
        Powered by <span class="font-semibold text-primary-600">Columbus</span> AI Visibility Platform
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const router = useRouter()

const step = ref<'loading' | 'welcome' | 'product-form' | 'analyzing'>('loading')
const statusMessage = ref('Completing sign in...')
const loading = ref(false)
const error = ref('')
const currentAnalysisStep = ref(0)

const productForm = ref({
  name: '',
  website: '',
  description: ''
})

const analysisSteps = [
  { id: 'crawl', title: 'Crawling your website', description: 'Discovering pages and collecting content...' },
  { id: 'analyze', title: 'Understanding your product', description: 'Using AI to identify your core offerings...' },
  { id: 'prompts', title: 'Generating search prompts', description: 'Creating relevant queries to track...' },
  { id: 'recommendations', title: 'Building recommendations', description: 'Preparing AI-powered optimization tips...' },
  { id: 'complete', title: 'Finalizing setup', description: 'Preparing your dashboard...' }
]

const progressPercent = computed(() => {
  return Math.min(100, (currentAnalysisStep.value / analysisSteps.length) * 100)
})

const getStepClasses = (index: number) => {
  if (currentAnalysisStep.value > index) return 'bg-green-50/50'
  if (currentAnalysisStep.value === index) return 'bg-primary-50/50 border border-primary-100'
  return 'bg-gray-50/30'
}

const getStepIndicatorClasses = (index: number) => {
  if (currentAnalysisStep.value > index) return 'bg-green-500'
  if (currentAnalysisStep.value === index) return 'bg-primary-500'
  return 'bg-gray-200'
}

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      await router.push('/auth/login')
      return
    }

    statusMessage.value = 'Setting up your account...'

    // Call setup-user to create/get organization
    const { data: setupResult, error: setupError } = await supabase.functions.invoke('setup-user', {
      body: {}
    })

    if (setupError) {
      console.error('Setup error:', setupError)
      error.value = setupError.message || 'Failed to setup account'
      step.value = 'welcome' // Show welcome anyway, they can try again
      return
    }

    // If user already has products, go to dashboard
    if (setupResult.hasProducts) {
      statusMessage.value = 'Redirecting to dashboard...'
      await router.push('/dashboard')
      return
    }

    // Show welcome screen
    step.value = 'welcome'

  } catch (err: any) {
    console.error('Auth callback error:', err)
    error.value = err.message || 'An error occurred'
    step.value = 'welcome'
  }
})

const skipToGashboard = async () => {
  await router.push('/dashboard')
}

const createProduct = async () => {
  error.value = ''
  loading.value = true

  try {
    // Validate website URL
    let websiteUrl = productForm.value.website.trim()
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl
    }

    // Call create-product edge function
    const { data: productResult, error: productError } = await supabase.functions.invoke('create-product', {
      body: {
        name: productForm.value.name,
        website: websiteUrl,
        description: productForm.value.description,
        triggerAnalysis: true
      }
    })

    if (productError) {
      throw new Error(productError.message || 'Failed to create product')
    }

    if (!productResult.success) {
      throw new Error(productResult.error || 'Failed to create product')
    }

    // Switch to analyzing state
    step.value = 'analyzing'
    currentAnalysisStep.value = 0

    // Poll for job completion if we have a job ID
    if (productResult.jobId) {
      await pollJobStatus(productResult.jobId)
    } else {
      // Simulate steps if no job ID
      await simulateSteps()
    }

    // Redirect to dashboard
    currentAnalysisStep.value = analysisSteps.length
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)

  } catch (e: any) {
    console.error('Create product error:', e)
    error.value = e.message || 'Failed to create product'
    loading.value = false
    step.value = 'product-form'
  }
}

const simulateSteps = async () => {
  const stepDurations = [5000, 8000, 6000, 5000, 3000]
  for (let i = 0; i < analysisSteps.length; i++) {
    currentAnalysisStep.value = i
    await new Promise(resolve => setTimeout(resolve, stepDurations[i] || 5000))
  }
}

const pollJobStatus = async (jobId: string) => {
  const maxAttempts = 90
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const { data: job } = await supabase
        .from('jobs')
        .select('status, metadata')
        .eq('id', jobId)
        .single()

      if (job?.status === 'completed') {
        for (let i = currentAnalysisStep.value; i <= analysisSteps.length; i++) {
          currentAnalysisStep.value = i
          await new Promise(resolve => setTimeout(resolve, 400))
        }
        return
      }

      if (job?.status === 'failed') {
        console.error('Job failed:', job)
        currentAnalysisStep.value = analysisSteps.length
        return
      }

      // Time-based progression
      if (attempts < 10) {
        currentAnalysisStep.value = 0
      } else if (attempts < 25) {
        currentAnalysisStep.value = 1
      } else if (attempts < 40) {
        currentAnalysisStep.value = 2
      } else if (attempts < 55) {
        currentAnalysisStep.value = 3
      } else {
        currentAnalysisStep.value = 4
      }
    } catch (err) {
      console.error('Error polling job status:', err)
    }

    await new Promise(resolve => setTimeout(resolve, 2000))
    attempts++
  }

  currentAnalysisStep.value = analysisSteps.length
}
</script>
