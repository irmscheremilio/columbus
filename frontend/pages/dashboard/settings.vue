<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardNav />

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Page Header -->
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
            <svg class="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
            <p class="text-gray-500">Manage your organization and subscription</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Main Settings Column -->
          <div class="lg:col-span-2 space-y-4">
            <!-- Organization Settings -->
            <div class="bg-white rounded-xl border border-gray-200 p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Organization Details</h2>
              <form @submit.prevent="updateOrganization" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    v-model="orgForm.name"
                    type="text"
                    class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    v-model="orgForm.domain"
                    type="text"
                    class="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                    disabled
                  />
                  <p class="text-xs text-gray-500 mt-1">Contact support to change your domain</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select v-model="orgForm.industry" class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                    <option value="">Select industry...</option>
                    <option value="saas">SaaS</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="consulting">Consulting</option>
                    <option value="agency">Agency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button
                  type="submit"
                  class="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
                  :disabled="orgLoading"
                >
                  <svg v-if="!orgLoading" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div v-else class="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  {{ orgLoading ? 'Saving...' : 'Save Changes' }}
                </button>
              </form>
            </div>

            <!-- Danger Zone -->
            <div class="bg-white rounded-xl border border-gray-200 p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h2>
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <div class="font-medium text-gray-900">Delete Organization</div>
                  <div class="text-sm text-gray-500 mt-0.5">Permanently delete your organization and all data</div>
                </div>
                <button
                  class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  @click="deleteOrganization"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <!-- Subscription Sidebar -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>

              <div v-if="subscription" class="space-y-4">
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div class="text-sm text-gray-500 mb-1">Current Plan</div>
                  <div class="text-2xl font-bold text-gray-900">{{ formatPlanName(subscription.plan_type) }}</div>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-2"
                    :class="subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                  >
                    {{ formatStatus(subscription.status) }}
                  </span>
                </div>

                <div v-if="subscription.current_period_end" class="text-sm text-gray-500">
                  Next billing: {{ formatDate(subscription.current_period_end) }}
                </div>

                <button
                  v-if="subscription.plan_type === 'free'"
                  class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors"
                  @click="upgradePlan"
                >
                  Upgrade Plan
                </button>
                <button
                  v-else
                  class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  @click="manageBilling"
                >
                  Manage Billing
                </button>
              </div>

              <div v-else class="text-center py-6">
                <p class="text-sm text-gray-500">Loading subscription...</p>
              </div>
            </div>
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

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const orgLoading = ref(false)
const organization = ref<any>(null)
const subscription = ref<any>(null)
const orgForm = ref({
  name: '',
  domain: '',
  industry: ''
})

onMounted(async () => {
  await loadSettings()
})

const loadSettings = async () => {
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) return

    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userData.organization_id)
      .single()

    if (org) {
      organization.value = org
      orgForm.value = {
        name: org.name,
        domain: org.domain,
        industry: org.industry || ''
      }
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .single()

    subscription.value = sub
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

const updateOrganization = async () => {
  if (!organization.value) return

  orgLoading.value = true
  try {
    const { error } = await supabase
      .from('organizations')
      .update({
        name: orgForm.value.name,
        industry: orgForm.value.industry || null,
      })
      .eq('id', organization.value.id)

    if (error) throw error

    alert('Settings saved successfully!')
  } catch (error) {
    console.error('Error updating organization:', error)
    alert('Failed to save settings')
  } finally {
    orgLoading.value = false
  }
}

const upgradePlan = async () => {
  try {
    const response = await $fetch('/api/stripe/create-checkout', {
      method: 'POST',
      body: { planId: 'PRO' }
    })

    if (response.url) {
      window.location.href = response.url
    }
  } catch (error: any) {
    console.error('Checkout error:', error)
    alert('Failed to start checkout. Please try again.')
  }
}

const manageBilling = async () => {
  try {
    const response = await $fetch('/api/stripe/create-portal', {
      method: 'POST'
    })

    if (response.url) {
      window.location.href = response.url
    }
  } catch (error: any) {
    console.error('Billing portal error:', error)
    alert('Failed to open billing portal. Please try again.')
  }
}

const deleteOrganization = async () => {
  const confirmed = confirm('Are you sure you want to delete your organization? This action cannot be undone.')
  if (!confirmed) return

  const doubleConfirm = prompt('Type "DELETE" to confirm deletion:')
  if (doubleConfirm !== 'DELETE') {
    alert('Deletion cancelled')
    return
  }

  alert('Deletion feature will be implemented with backend support')
}

const formatPlanName = (plan: string) => {
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>
