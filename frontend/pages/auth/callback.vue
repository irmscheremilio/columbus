<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50">
    <div class="text-center w-full max-w-lg px-4">
      <div class="space-y-6">
        <div class="relative w-16 h-16 mx-auto">
          <div class="absolute inset-0 rounded-full border-4 border-primary-100"></div>
          <div class="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
        </div>
        <p class="text-gray-600 font-medium">{{ statusMessage }}</p>
      </div>

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

const statusMessage = ref('Completing sign in...')

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      await router.push('/auth/login')
      return
    }

    statusMessage.value = 'Setting up your account...'

    // Check user's onboarding status
    const { data: setupResult, error: setupError } = await supabase.functions.invoke('setup-user', {
      body: {}
    })

    if (setupError) {
      console.error('Setup error:', setupError)
      // On error, still redirect to dashboard - the middleware will handle it
      await router.push('/dashboard')
      return
    }

    statusMessage.value = 'Redirecting...'

    // Always redirect to dashboard - the onboarding middleware will redirect to onboarding if needed
    await router.push('/dashboard')

  } catch (err: any) {
    console.error('Auth callback error:', err)
    // On error, redirect to dashboard and let middleware handle it
    await router.push('/dashboard')
  }
})
</script>
