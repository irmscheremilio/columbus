<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50">
    <div class="text-center w-full max-w-lg px-4">
      <!-- Loading state (initial auth check) -->
      <div v-if="!showSetup && !analyzing" class="space-y-6">
        <div class="relative w-16 h-16 mx-auto">
          <div class="absolute inset-0 rounded-full border-4 border-primary-100"></div>
          <div class="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
        </div>
        <p class="text-gray-600 font-medium">{{ statusMessage }}</p>
      </div>

      <!-- Analyzing website state - Beautiful step-by-step progress -->
      <div v-else-if="analyzing" class="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10">
        <!-- Header with animated icon -->
        <div class="mb-8">
          <div class="relative w-20 h-20 mx-auto mb-6">
            <!-- Outer ring pulse -->
            <div class="absolute inset-0 rounded-full bg-primary-500/20 animate-ping"></div>
            <!-- Main circle -->
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
            v-for="(step, index) in analysisSteps"
            :key="step.id"
            class="flex items-center gap-4 p-4 rounded-xl transition-all duration-500"
            :class="getStepClasses(index)"
          >
            <!-- Step indicator -->
            <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500"
                 :class="getStepIndicatorClasses(index)">
              <!-- Completed check -->
              <svg v-if="currentStep > index" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <!-- Current spinner -->
              <div v-else-if="currentStep === index" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <!-- Pending number -->
              <span v-else class="text-sm font-semibold text-gray-400">{{ index + 1 }}</span>
            </div>

            <!-- Step content -->
            <div class="flex-1 text-left">
              <p class="font-medium transition-colors duration-300"
                 :class="currentStep >= index ? 'text-gray-900' : 'text-gray-400'">
                {{ step.title }}
              </p>
              <p v-if="currentStep === index" class="text-sm text-gray-500 mt-0.5">
                {{ step.description }}
              </p>
            </div>

            <!-- Status indicator -->
            <div class="flex-shrink-0">
              <span v-if="currentStep > index" class="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Done
              </span>
              <span v-else-if="currentStep === index" class="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full animate-pulse">
                In Progress
              </span>
            </div>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
          <div
            class="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700 ease-out"
            :style="{ width: `${progressPercent}%` }"
          ></div>
          <!-- Shimmer effect -->
          <div
            v-if="currentStep < analysisSteps.length"
            class="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>

        <!-- Estimated time -->
        <p class="text-sm text-gray-400">
          {{ currentStep >= analysisSteps.length ? 'Complete!' : 'Usually takes 30-60 seconds' }}
        </p>
      </div>

      <!-- Setup form for first-time OAuth users -->
      <div v-else class="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10">
        <!-- Header -->
        <div class="mb-8">
          <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Complete Your Setup</h2>
          <p class="text-gray-500">Enter your company details to get started with AI visibility tracking</p>
        </div>

        <form @submit.prevent="completeSetup" class="space-y-5">
          <div v-if="error" class="rounded-xl bg-red-50 border border-red-100 p-4">
            <div class="flex gap-3">
              <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p class="text-sm text-red-700">{{ error }}</p>
            </div>
          </div>

          <div>
            <label for="companyName" class="block text-sm font-medium text-gray-700 text-left mb-2">
              Company Name <span class="text-red-500">*</span>
            </label>
            <input
              id="companyName"
              v-model="setupForm.companyName"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              placeholder="Acme Inc"
            />
          </div>

          <div>
            <label for="website" class="block text-sm font-medium text-gray-700 text-left mb-2">
              Website <span class="text-red-500">*</span>
            </label>
            <input
              id="website"
              v-model="setupForm.website"
              type="url"
              required
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              placeholder="https://yourcompany.com"
            />
            <p class="text-xs text-gray-400 mt-2 text-left">
              We'll analyze your website to generate relevant search prompts
            </p>
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 text-left mb-2">
              What does your business do? <span class="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="description"
              v-model="setupForm.description"
              rows="3"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
              placeholder="e.g., We provide AI-powered analytics for e-commerce businesses..."
            ></textarea>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30"
          >
            <svg v-if="loading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
            {{ loading ? 'Setting up...' : 'Analyze & Get Started' }}
          </button>
        </form>
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
const route = useRoute()

const statusMessage = ref('Completing sign in...')
const showSetup = ref(false)
const analyzing = ref(false)
const currentStep = ref(0)
const loading = ref(false)
const error = ref('')

const setupForm = ref({
  companyName: '',
  website: '',
  description: ''
})

// Analysis steps for the progress UI
const analysisSteps = [
  {
    id: 'crawl',
    title: 'Crawling your website',
    description: 'Discovering pages and collecting content...'
  },
  {
    id: 'analyze',
    title: 'Understanding your product',
    description: 'Using AI to identify your core offerings...'
  },
  {
    id: 'prompts',
    title: 'Generating search prompts',
    description: 'Creating relevant queries to track...'
  },
  {
    id: 'recommendations',
    title: 'Building recommendations',
    description: 'Preparing AI-powered optimization tips...'
  },
  {
    id: 'complete',
    title: 'Finalizing setup',
    description: 'Preparing your dashboard...'
  }
]

// Calculate progress percentage
const progressPercent = computed(() => {
  return Math.min(100, (currentStep.value / analysisSteps.length) * 100)
})

// Get classes for step container
const getStepClasses = (index: number) => {
  if (currentStep.value > index) {
    return 'bg-green-50/50'
  } else if (currentStep.value === index) {
    return 'bg-primary-50/50 border border-primary-100'
  }
  return 'bg-gray-50/30'
}

// Get classes for step indicator circle
const getStepIndicatorClasses = (index: number) => {
  if (currentStep.value > index) {
    return 'bg-green-500'
  } else if (currentStep.value === index) {
    return 'bg-primary-500'
  }
  return 'bg-gray-200'
}

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      await router.push('/auth/login')
      return
    }

    statusMessage.value = 'Checking your account...'

    // Check if user already has an organization
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    if (userData?.organization_id) {
      // User already has organization - redirect to dashboard
      statusMessage.value = 'Redirecting to dashboard...'
      await router.push('/dashboard')
      return
    }

    // Determine the callback type
    const callbackType = route.query.type as string

    if (callbackType === 'email_confirmation') {
      // Email confirmation flow - user metadata should have company info
      const userMeta = user.user_metadata

      if (userMeta?.signup_pending && userMeta?.company_name && userMeta?.website) {
        // Auto-complete setup using stored metadata
        statusMessage.value = 'Setting up your account...'
        await completeSetupFromMetadata(user.id, userMeta)
      } else {
        // Fallback: show setup form if metadata is missing
        showSetup.value = true
        prefillFromUser(user)
      }
    } else {
      // OAuth flow - show setup form
      statusMessage.value = 'Almost there!'
      showSetup.value = true
      prefillFromUser(user)
    }
  } catch (err) {
    console.error('Auth callback error:', err)
    await router.push('/auth/login')
  }
})

const prefillFromUser = (_user: any) => {
  // No prefill - let user enter their actual company name
}

const completeSetupFromMetadata = async (userId: string, metadata: any) => {
  try {
    const companyName = metadata.company_name
    const websiteUrl = metadata.website
    const businessDescription = metadata.business_description || ''

    // Extract domain from URL
    const domain = new URL(websiteUrl).hostname

    // 1. Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name: companyName,
        domain: domain,
      }])
      .select()
      .single()

    if (orgError) throw orgError

    // 2. Create brand
    const { error: brandError } = await supabase
      .from('brands')
      .insert([{
        organization_id: org.id,
        name: companyName,
        website: websiteUrl,
        is_active: true,
      }])

    if (brandError) throw brandError

    // 3. Update user profile with organization_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ organization_id: org.id })
      .eq('id', userId)

    if (updateError) {
      // Try inserting if update failed (profile might not exist yet)
      const { data: { user } } = await supabase.auth.getUser()
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user?.email || '',
          organization_id: org.id,
        })
      if (insertError) throw insertError
    }

    // 4. Clear the signup_pending flag from user metadata
    await supabase.auth.updateUser({
      data: { signup_pending: false }
    })

    // 5. Switch to analyzing state and trigger website analysis
    analyzing.value = true
    currentStep.value = 0

    const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
      'trigger-website-analysis',
      {
        body: {
          domain: domain,
          businessDescription: businessDescription
        }
      }
    )

    if (analysisError) {
      console.error('Analysis trigger error:', analysisError)
      // Don't fail - just redirect to dashboard
    }

    // 6. Poll for job completion with step updates
    if (analysisResult?.jobId) {
      await pollJobStatus(analysisResult.jobId)
    } else {
      // Simulate steps if no job ID
      await simulateSteps()
    }

    // 7. Redirect to dashboard
    currentStep.value = analysisSteps.length
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)

  } catch (e: any) {
    console.error('Setup from metadata error:', e)
    // Fallback: show setup form
    error.value = e.message || 'Failed to complete setup'
    showSetup.value = true
    analyzing.value = false
  }
}

const completeSetup = async () => {
  error.value = ''
  loading.value = true

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No user found')

    // Validate website URL
    let websiteUrl = setupForm.value.website.trim()
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl
    }

    // Extract domain from URL
    const domain = new URL(websiteUrl).hostname

    // 1. Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name: setupForm.value.companyName,
        domain: domain,
      }])
      .select()
      .single()

    if (orgError) {
      console.error('Organization creation error:', orgError)
      throw orgError
    }

    // 2. Create brand
    const { error: brandError } = await supabase
      .from('brands')
      .insert([{
        organization_id: org.id,
        name: setupForm.value.companyName,
        website: websiteUrl,
        is_active: true,
      }])

    if (brandError) throw brandError

    // 3. Update user profile with organization_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ organization_id: org.id })
      .eq('id', user.id)

    if (updateError) {
      // Try inserting if update failed
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          organization_id: org.id,
        })
      if (insertError) throw insertError
    }

    // 4. Switch to analyzing state
    showSetup.value = false
    analyzing.value = true
    currentStep.value = 0

    // 5. Trigger website analysis job (worker will generate prompts)
    const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
      'trigger-website-analysis',
      {
        body: {
          domain: domain,
          businessDescription: setupForm.value.description
        }
      }
    )

    if (analysisError) {
      console.error('Analysis trigger error:', analysisError)
      // Don't fail - just redirect to dashboard, they can re-run analysis later
    }

    // 6. Poll for job completion with step updates
    if (analysisResult?.jobId) {
      await pollJobStatus(analysisResult.jobId)
    } else {
      // Simulate steps if no job ID
      await simulateSteps()
    }

    // 7. Complete and redirect to dashboard
    currentStep.value = analysisSteps.length
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)

  } catch (e: any) {
    console.error('Setup error:', e)
    error.value = e.message || 'Failed to complete setup'
    loading.value = false
    analyzing.value = false
    showSetup.value = true
  }
}

const simulateSteps = async () => {
  // Simulate progression through steps with realistic timing
  const stepDurations = [3000, 5000, 4000, 3000, 2000]

  for (let i = 0; i < analysisSteps.length; i++) {
    currentStep.value = i
    await new Promise(resolve => setTimeout(resolve, stepDurations[i] || 3000))
  }
}

const pollJobStatus = async (jobId: string) => {
  const maxAttempts = 60 // 2 minutes max
  let attempts = 0

  while (attempts < maxAttempts) {
    const { data: job } = await supabase
      .from('jobs')
      .select('status')
      .eq('id', jobId)
      .single()

    if (job?.status === 'completed') {
      // Quickly complete remaining steps
      for (let i = currentStep.value; i < analysisSteps.length; i++) {
        currentStep.value = i
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      return
    }

    if (job?.status === 'failed') {
      // Still complete the UI gracefully
      currentStep.value = analysisSteps.length
      return
    }

    // Update step based on time elapsed (map time to steps)
    if (attempts < 5) {
      currentStep.value = 0 // Crawling
    } else if (attempts < 15) {
      currentStep.value = 1 // Analyzing
    } else if (attempts < 25) {
      currentStep.value = 2 // Generating prompts
    } else if (attempts < 35) {
      currentStep.value = 3 // Building recommendations
    } else {
      currentStep.value = 4 // Finalizing
    }

    await new Promise(resolve => setTimeout(resolve, 2000))
    attempts++
  }

  // Timed out - complete anyway
  currentStep.value = analysisSteps.length
}
</script>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
</style>
