<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardNav />

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <!-- Organization Settings -->
        <div class="card mb-6">
          <h2 class="text-xl font-semibold mb-4">Organization Details</h2>
          <form @submit.prevent="updateOrganization" class="space-y-4">
            <div>
              <label class="label">Company Name</label>
              <input
                v-model="orgForm.name"
                type="text"
                class="input"
                required
              />
            </div>
            <div>
              <label class="label">Website</label>
              <input
                v-model="orgForm.domain"
                type="text"
                class="input"
                disabled
                title="Contact support to change your domain"
              />
              <p class="text-sm text-gray-500 mt-1">
                Contact support to change your domain
              </p>
            </div>
            <div>
              <label class="label">Industry</label>
              <select v-model="orgForm.industry" class="input">
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
              class="btn btn-primary"
              :disabled="orgLoading"
            >
              {{ orgLoading ? 'Saving...' : 'Save Changes' }}
            </button>
          </form>
        </div>

        <!-- Subscription -->
        <div class="card mb-6">
          <h2 class="text-xl font-semibold mb-4">Subscription</h2>
          <div v-if="subscription" class="space-y-4">
            <div class="flex justify-between items-center">
              <div>
                <div class="font-medium">Current Plan</div>
                <div class="text-2xl font-bold text-primary-600 mt-1">
                  {{ formatPlanName(subscription.plan_type) }}
                </div>
              </div>
              <span
                class="px-4 py-2 rounded-full text-sm font-medium"
                :class="subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              >
                {{ formatStatus(subscription.status) }}
              </span>
            </div>

            <div v-if="subscription.current_period_end" class="text-sm text-gray-600">
              Next billing date: {{ formatDate(subscription.current_period_end) }}
            </div>

            <div class="pt-4 border-t">
              <button
                v-if="subscription.plan_type === 'free'"
                class="btn btn-primary"
                @click="upgradePlan"
              >
                Upgrade Plan
              </button>
              <button
                v-else
                class="btn btn-outline"
                @click="manageBilling"
              >
                Manage Billing
              </button>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="card border-red-200">
          <h2 class="text-xl font-semibold text-red-900 mb-4">Danger Zone</h2>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <div>
                <div class="font-medium text-red-900">Delete Organization</div>
                <div class="text-sm text-red-700">
                  Permanently delete your organization and all associated data
                </div>
              </div>
              <button
                class="btn bg-red-600 text-white hover:bg-red-700"
                @click="deleteOrganization"
              >
                Delete
              </button>
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
    // Load user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) return

    // Load organization
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

    // Load subscription
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

const upgradePlan = () => {
  // TODO: Implement Stripe checkout
  alert('Upgrade feature coming soon!')
}

const manageBilling = () => {
  // TODO: Redirect to Stripe billing portal
  alert('Billing management coming soon!')
}

const deleteOrganization = async () => {
  const confirmed = confirm(
    'Are you sure you want to delete your organization? This action cannot be undone.'
  )

  if (!confirmed) return

  const doubleConfirm = prompt(
    'Type "DELETE" to confirm deletion:'
  )

  if (doubleConfirm !== 'DELETE') {
    alert('Deletion cancelled')
    return
  }

  // TODO: Implement organization deletion
  alert('Deletion feature will be implemented with backend support')
}

const formatPlanName = (plan: string) => {
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
