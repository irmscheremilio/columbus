<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Analyzing state -->
      <div v-if="analyzing" class="bg-white rounded-lg shadow-md p-8 text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Analyzing Your Website</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-center gap-3">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
            <span class="text-gray-600">{{ analysisStatus }}</span>
          </div>
          <div class="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
            We're crawling your website and using AI to understand your product.
            This usually takes 30-60 seconds.
          </div>
        </div>
      </div>

      <!-- Signup form -->
      <template v-else>
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Already have an account?
            <NuxtLink to="/auth/login" class="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </NuxtLink>
          </p>
        </div>
        <form class="mt-8 space-y-6" @submit.prevent="handleSignup">
          <div v-if="error" class="rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-700">{{ error }}</div>
          </div>

          <div v-if="success" class="rounded-md bg-green-50 p-4">
            <div class="text-sm text-green-700">{{ success }}</div>
          </div>

          <div class="rounded-md shadow-sm space-y-4">
            <div>
              <label for="company-name" class="label">Company Name <span class="text-red-500">*</span></label>
              <input
                id="company-name"
                v-model="companyName"
                type="text"
                required
                class="input"
                placeholder="Acme Inc."
              />
            </div>

            <div>
              <label for="website" class="label">Website <span class="text-red-500">*</span></label>
              <input
                id="website"
                v-model="website"
                type="url"
                required
                class="input"
                placeholder="https://yourcompany.com"
              />
              <p class="text-xs text-gray-500 mt-1">
                We'll analyze your website to generate relevant search prompts
              </p>
            </div>

            <div>
              <label for="description" class="label">What does your business do? <span class="text-gray-400">(optional)</span></label>
              <textarea
                id="description"
                v-model="description"
                rows="2"
                class="input"
                placeholder="e.g., We provide AI-powered analytics..."
              ></textarea>
            </div>

            <div>
              <label for="email-address" class="label">Email address <span class="text-red-500">*</span></label>
              <input
                id="email-address"
                v-model="email"
                type="email"
                autocomplete="email"
                required
                class="input"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label for="password" class="label">Password <span class="text-red-500">*</span></label>
              <input
                id="password"
                v-model="password"
                type="password"
                autocomplete="new-password"
                required
                class="input"
                placeholder="Min. 8 characters"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {{ loading ? 'Creating account...' : 'Create account' }}
            </button>
          </div>

          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <!-- Google OAuth Button -->
          <div>
            <button
              type="button"
              @click="handleGoogleSignup"
              :disabled="loading"
              class="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>
          </div>

          <p class="text-xs text-gray-600 text-center">
            By creating an account, you agree to our
            <a href="#" class="text-primary-600 hover:text-primary-500">Terms of Service</a>
            and
            <a href="#" class="text-primary-600 hover:text-primary-500">Privacy Policy</a>
          </p>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  auth: 'guest'
})

const supabase = useSupabaseClient()
const router = useRouter()

const email = ref('')
const password = ref('')
const companyName = ref('')
const website = ref('')
const description = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const analyzing = ref(false)
const analysisStatus = ref('Starting analysis...')

const handleSignup = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    // Validate website URL
    let websiteUrl = website.value.trim()
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl
    }

    // Extract domain from URL
    const domain = new URL(websiteUrl).hostname

    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          company_name: companyName.value,
          website: websiteUrl,
        }
      }
    })

    if (signUpError) throw signUpError

    if (authData.user) {
      try {
        // 1. Create organization
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert([{
            name: companyName.value,
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
            name: companyName.value,
            website: websiteUrl,
            is_active: true,
          }])

        if (brandError) throw brandError

        // 3. Update user with organization_id
        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: email.value,
            organization_id: org.id,
          })

        if (updateError) throw updateError

        // 4. Switch to analyzing state
        analyzing.value = true
        analysisStatus.value = 'Crawling your website...'

        // 5. Trigger website analysis job (worker will generate prompts)
        const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
          'trigger-website-analysis',
          {
            body: {
              domain: domain,
              businessDescription: description.value
            }
          }
        )

        if (analysisError) {
          console.error('Analysis trigger error:', analysisError)
          // Don't fail - just redirect to dashboard
        }

        // 6. Poll for job completion
        if (analysisResult?.jobId) {
          analysisStatus.value = 'Analyzing your product...'
          await pollJobStatus(analysisResult.jobId)
        }

        // 7. Redirect to dashboard
        analysisStatus.value = 'Setup complete! Redirecting...'
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)

      } catch (setupErr: any) {
        console.error('Failed to setup user:', setupErr)
        error.value = setupErr.message || 'Failed to complete setup. Please try again.'
        loading.value = false
        analyzing.value = false
      }
    }
  } catch (e: any) {
    error.value = e.message || 'An error occurred during sign up'
    loading.value = false
  }
}

const pollJobStatus = async (jobId: string) => {
  const maxAttempts = 60
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

    if (attempts > 10) analysisStatus.value = 'Understanding your product...'
    if (attempts > 20) analysisStatus.value = 'Generating search prompts...'
    if (attempts > 30) analysisStatus.value = 'Almost done...'

    await new Promise(resolve => setTimeout(resolve, 2000))
    attempts++
  }

  analysisStatus.value = 'Analysis taking longer than expected, redirecting...'
}

const handleGoogleSignup = async () => {
  error.value = ''
  loading.value = true

  try {
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?setup=true`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })

    if (signInError) throw signInError
  } catch (e: any) {
    error.value = e.message || 'An error occurred during Google sign up'
    loading.value = false
  }
}
</script>
