<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <!-- Loading state -->
      <div v-if="!showSetup && !analyzing" class="space-y-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="text-gray-600">{{ statusMessage }}</p>
      </div>

      <!-- Analyzing website state -->
      <div v-else-if="analyzing" class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Analyzing Your Website</h2>
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
            <span class="text-gray-600">{{ analysisStatus }}</span>
          </div>
          <div class="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
            We're crawling your website and using AI to understand your product.
            This usually takes 30-60 seconds.
          </div>
        </div>
      </div>

      <!-- Setup form for first-time OAuth users -->
      <div v-else class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Complete Your Setup</h2>
        <p class="text-gray-600 mb-6">Enter your company details to get started</p>

        <form @submit.prevent="completeSetup" class="space-y-4">
          <div v-if="error" class="rounded-md bg-red-50 p-3">
            <div class="text-sm text-red-700">{{ error }}</div>
          </div>

          <div>
            <label for="companyName" class="block text-sm font-medium text-gray-700 text-left mb-1">
              Company Name <span class="text-red-500">*</span>
            </label>
            <input
              id="companyName"
              v-model="setupForm.companyName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Acme Inc"
            />
          </div>

          <div>
            <label for="website" class="block text-sm font-medium text-gray-700 text-left mb-1">
              Website <span class="text-red-500">*</span>
            </label>
            <input
              id="website"
              v-model="setupForm.website"
              type="url"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="https://yourcompany.com"
            />
            <p class="text-xs text-gray-500 mt-1">
              We'll analyze your website to generate relevant search prompts
            </p>
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 text-left mb-1">
              What does your business do? <span class="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="description"
              v-model="setupForm.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., We provide AI-powered analytics for e-commerce businesses..."
            ></textarea>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {{ loading ? 'Setting up...' : 'Analyze & Get Started' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const router = useRouter()

const statusMessage = ref('Completing sign in...')
const showSetup = ref(false)
const analyzing = ref(false)
const analysisStatus = ref('Starting analysis...')
const loading = ref(false)
const error = ref('')

const setupForm = ref({
  companyName: '',
  website: '',
  description: ''
})

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      await router.push('/auth/login')
      return
    }

    statusMessage.value = 'Checking your account...'

    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!userData || !userData.organization_id) {
      statusMessage.value = 'Almost there!'
      showSetup.value = true

      // Pre-fill email domain as company name hint
      const emailDomain = user.email?.split('@')[1]?.split('.')[0]
      if (emailDomain) {
        setupForm.value.companyName = emailDomain.charAt(0).toUpperCase() + emailDomain.slice(1)
      }
    } else {
      statusMessage.value = 'Redirecting to dashboard...'
      await router.push('/dashboard')
    }
  } catch (err) {
    console.error('Auth callback error:', err)
    await router.push('/auth/login')
  }
})

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
      .upsert({
        id: user.id,
        email: user.email!,
        organization_id: org.id,
      })

    if (updateError) throw updateError

    // 4. Switch to analyzing state
    showSetup.value = false
    analyzing.value = true
    analysisStatus.value = 'Crawling your website...'

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

    // 6. Poll for job completion (or just redirect after a short delay)
    if (analysisResult?.jobId) {
      analysisStatus.value = 'Analyzing your product...'
      await pollJobStatus(analysisResult.jobId)
    }

    // 7. Redirect to dashboard
    analysisStatus.value = 'Setup complete! Redirecting...'
    setTimeout(() => {
      router.push('/dashboard')
    }, 1000)

  } catch (e: any) {
    console.error('Setup error:', e)
    error.value = e.message || 'Failed to complete setup'
    loading.value = false
    analyzing.value = false
    showSetup.value = true
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
      analysisStatus.value = 'Analysis complete!'
      return
    }

    if (job?.status === 'failed') {
      analysisStatus.value = 'Analysis encountered an issue, but you can continue'
      return
    }

    // Update status message based on progress
    if (attempts > 10) {
      analysisStatus.value = 'Understanding your product...'
    }
    if (attempts > 20) {
      analysisStatus.value = 'Generating search prompts...'
    }
    if (attempts > 30) {
      analysisStatus.value = 'Almost done...'
    }

    await new Promise(resolve => setTimeout(resolve, 2000))
    attempts++
  }

  // Timed out - just continue
  analysisStatus.value = 'Analysis taking longer than expected, redirecting...'
}
</script>
