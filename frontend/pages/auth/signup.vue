<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <CookieBanner />
    <div class="max-w-md w-full space-y-8">
      <!-- Email confirmation sent state -->
      <div v-if="emailSent" class="bg-white rounded-lg shadow-md p-8 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p class="text-gray-600 mb-4">
          We've sent a confirmation link to <strong>{{ email }}</strong>
        </p>
        <p class="text-sm text-gray-500">
          Click the link in your email to confirm your account and get started.
        </p>
        <div class="mt-6 pt-6 border-t border-gray-200">
          <p class="text-sm text-gray-500">
            Didn't receive the email?
            <button
              @click="resendConfirmation"
              :disabled="resendCooldown > 0"
              class="text-primary-600 hover:text-primary-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend' }}
            </button>
          </p>
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

          <div class="rounded-md shadow-sm space-y-4">
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
            <NuxtLink to="/terms" class="text-primary-600 hover:text-primary-500">Terms of Service</NuxtLink>
            and
            <NuxtLink to="/privacy" class="text-primary-600 hover:text-primary-500">Privacy Policy</NuxtLink>
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
const { initConsent } = useCookieConsent()

onMounted(() => {
  initConsent()
})

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const emailSent = ref(false)
const resendCooldown = ref(0)

const handleSignup = async () => {
  error.value = ''
  loading.value = true

  try {
    // Sign up the user - no company data needed anymore
    // The organization will be created in the callback
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?type=email_confirmation`,
        data: {
          signup_pending: true
        }
      }
    })

    if (signUpError) throw signUpError

    // Show email confirmation message
    emailSent.value = true
    loading.value = false

  } catch (e: any) {
    error.value = e.message || 'An error occurred during sign up'
    loading.value = false
  }
}

const resendConfirmation = async () => {
  if (resendCooldown.value > 0) return

  try {
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.value,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?type=email_confirmation`
      }
    })

    if (resendError) throw resendError

    // Start cooldown
    resendCooldown.value = 60
    const interval = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) {
        clearInterval(interval)
      }
    }, 1000)

  } catch (e: any) {
    error.value = e.message || 'Failed to resend confirmation email'
  }
}

const handleGoogleSignup = async () => {
  error.value = ''
  loading.value = true

  try {
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?type=oauth`,
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
