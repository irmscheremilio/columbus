<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div class="w-12 h-12 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto mb-4"></div>
        <p class="text-gray-600">Loading invitation...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
        <p class="text-gray-600 mb-6">{{ error }}</p>
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors"
        >
          Go to Homepage
        </NuxtLink>
      </div>

      <!-- Invitation Details -->
      <div v-else-if="invitation" class="bg-white rounded-xl border border-gray-200 p-8">
        <div class="text-center mb-6">
          <div class="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">You're Invited!</h1>
          <p class="text-gray-600">
            You've been invited to join
            <span class="font-semibold text-gray-900">{{ invitation.organizationName }}</span>
          </p>
        </div>

        <div class="space-y-4 mb-6">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span class="text-gray-600">Organization</span>
            <span class="font-semibold text-gray-900">{{ invitation.organizationName }}</span>
          </div>
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span class="text-gray-600">Your Role</span>
            <span
              class="px-2 py-0.5 rounded text-xs font-medium"
              :class="{
                'bg-blue-100 text-blue-700': invitation.role === 'admin',
                'bg-gray-100 text-gray-600': invitation.role === 'member'
              }"
            >
              {{ invitation.role }}
            </span>
          </div>
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span class="text-gray-600">Expires</span>
            <span class="text-gray-900">{{ formatDate(invitation.expiresAt) }}</span>
          </div>
        </div>

        <!-- Not logged in -->
        <div v-if="!user" class="space-y-3">
          <p class="text-sm text-gray-600 text-center mb-4">
            Please sign in or create an account to accept this invitation.
          </p>
          <NuxtLink
            :to="`/auth/login?redirect=/invite/${token}`"
            class="w-full flex items-center justify-center px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors"
          >
            Sign In to Accept
          </NuxtLink>
          <NuxtLink
            :to="`/auth/signup?redirect=/invite/${token}&email=${encodeURIComponent(invitation.email)}`"
            class="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Create Account
          </NuxtLink>
        </div>

        <!-- Logged in -->
        <div v-else class="space-y-3">
          <button
            @click="handleAccept"
            :disabled="accepting"
            class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
          >
            <div v-if="accepting" class="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            {{ accepting ? 'Accepting...' : 'Accept Invitation' }}
          </button>
          <button
            @click="handleDecline"
            class="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const user = useSupabaseUser()
const { getInvitationDetails, acceptInvitation } = useEdgeFunctions()

const token = computed(() => route.params.token as string)

const loading = ref(true)
const accepting = ref(false)
const error = ref<string | null>(null)
const invitation = ref<any>(null)

onMounted(async () => {
  await loadInvitation()
})

// Watch for user changes (after login)
watch(user, async (newUser) => {
  if (newUser && invitation.value) {
    // User just logged in, try to accept
    await handleAccept()
  }
})

const loadInvitation = async () => {
  loading.value = true
  error.value = null

  try {
    const result = await getInvitationDetails(token.value)

    if (result.error) {
      error.value = result.error
    } else if (result.invitation) {
      invitation.value = result.invitation
    } else {
      error.value = 'Invalid invitation'
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load invitation'
  } finally {
    loading.value = false
  }
}

const handleAccept = async () => {
  if (!user.value) {
    router.push(`/auth/login?redirect=/invite/${token.value}`)
    return
  }

  accepting.value = true
  try {
    const result = await acceptInvitation(token.value)

    if (result.success) {
      // Redirect to dashboard
      router.push('/dashboard?welcome=joined')
    } else if (result.error) {
      alert(result.error)
    }
  } catch (e: any) {
    alert(e.message || 'Failed to accept invitation')
  } finally {
    accepting.value = false
  }
}

const handleDecline = () => {
  router.push('/')
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
</script>
