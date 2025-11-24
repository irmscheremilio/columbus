<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div v-if="!showSetup" class="space-y-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="text-gray-600">{{ statusMessage }}</p>
      </div>

      <!-- Setup form for first-time OAuth users -->
      <div v-else class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Complete Your Setup</h2>
        <p class="text-gray-600 mb-6">Let's set up your organization to get started</p>

        <form @submit.prevent="completeSetup" class="space-y-4">
          <div v-if="error" class="rounded-md bg-red-50 p-3">
            <div class="text-sm text-red-700">{{ error }}</div>
          </div>

          <div>
            <label for="companyName" class="block text-sm font-medium text-gray-700 text-left mb-1">
              Company Name
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
              Website (Optional)
            </label>
            <input
              id="website"
              v-model="setupForm.website"
              type="url"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="https://example.com"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {{ loading ? 'Setting up...' : 'Complete Setup' }}
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
const route = useRoute()

const statusMessage = ref('Completing sign in...')
const showSetup = ref(false)
const loading = ref(false)
const error = ref('')

const setupForm = ref({
  companyName: '',
  website: ''
})

onMounted(async () => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // No user found, redirect to login
      await router.push('/auth/login')
      return
    }

    // Always check if user has an organization
    statusMessage.value = 'Checking your account...'

    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle() // Use maybeSingle() instead of single() to handle 0 rows gracefully

    // If user doesn't exist in users table yet, or has no organization, show setup
    if (!userData || !userData.organization_id) {
      statusMessage.value = 'Almost there!'
      showSetup.value = true

      // Pre-fill email domain as company name hint
      const emailDomain = user.email?.split('@')[1]?.split('.')[0]
      if (emailDomain) {
        setupForm.value.companyName = emailDomain.charAt(0).toUpperCase() + emailDomain.slice(1)
      }
    } else {
      // User has organization, go to dashboard
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

    // 1. Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name: setupForm.value.companyName,
        // plan defaults to 'free' in database
      }])
      .select()
      .single()

    if (orgError) {
      console.error('Organization creation error:', orgError)
      throw orgError
    }

    // 2. Create brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert([{
        organization_id: org.id,
        name: setupForm.value.companyName,
        website: setupForm.value.website || null,
        is_active: true,
      }])
      .select()
      .single()

    if (brandError) throw brandError

    // 3. Create/update user record with organization_id
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        organization_id: org.id,
      })

    if (updateError) throw updateError

    // 4. Create default prompts
    const defaultPrompts = [
      {
        organization_id: org.id,
        title: 'General Product Recommendation',
        prompt: `What are the best ${setupForm.value.companyName} products for [use case]?`,
        category: 'product',
        is_active: true,
      },
      {
        organization_id: org.id,
        title: 'Competitor Comparison',
        prompt: `Compare ${setupForm.value.companyName} with competitors for [specific need]`,
        category: 'comparison',
        is_active: true,
      },
    ]

    await supabase.from('prompts').insert(defaultPrompts)

    statusMessage.value = 'Setup complete! Redirecting...'
    showSetup.value = false

    setTimeout(() => {
      router.push('/dashboard')
    }, 1000)
  } catch (e: any) {
    console.error('Setup error:', e)
    error.value = e.message || 'Failed to complete setup'
    loading.value = false
  }
}
</script>
