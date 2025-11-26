<template>
  <div>
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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

            <!-- Team Members -->
            <div class="bg-white rounded-xl border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-gray-900">Team Members</h2>
                <button
                  v-if="isAdminOrOwner"
                  @click="showInviteModal = true"
                  class="flex items-center gap-2 px-3 py-1.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Invite Member
                </button>
              </div>

              <!-- Members List -->
              <div v-if="membersLoading" class="text-center py-4">
                <div class="w-6 h-6 animate-spin rounded-full border-2 border-brand border-t-transparent mx-auto"></div>
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="member in members"
                  :key="member.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-semibold">
                      {{ member.email?.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div class="font-medium text-gray-900">{{ member.email }}</div>
                      <div class="text-xs text-gray-500">
                        Joined {{ formatDate(member.joinedAt) }}
                        <span v-if="member.isCurrentUser" class="text-brand">(You)</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="px-2 py-0.5 rounded text-xs font-medium"
                      :class="{
                        'bg-purple-100 text-purple-700': member.role === 'owner',
                        'bg-blue-100 text-blue-700': member.role === 'admin',
                        'bg-gray-100 text-gray-600': member.role === 'member'
                      }"
                    >
                      {{ member.role }}
                    </span>
                    <div v-if="isAdminOrOwner && !member.isCurrentUser && member.role !== 'owner'" class="flex items-center gap-1">
                      <select
                        v-if="currentUserRole === 'owner'"
                        :value="member.role"
                        @change="handleRoleChange(member.id, ($event.target as HTMLSelectElement).value)"
                        class="text-xs px-2 py-1 border border-gray-200 rounded"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <button
                        @click="handleRemoveMember(member.id)"
                        class="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Remove member"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Empty state -->
                <div v-if="members.length === 0" class="text-center py-8">
                  <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 class="text-sm font-medium text-gray-900 mb-1">No team members yet</h3>
                  <p class="text-sm text-gray-500 mb-4">Invite colleagues to collaborate on your AI visibility.</p>
                  <button
                    v-if="isAdminOrOwner"
                    @click="showInviteModal = true"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-lg text-sm font-medium hover:bg-brand/20 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Invite your first member
                  </button>
                </div>
              </div>

              <!-- Pending Invitations -->
              <div v-if="invitations.length > 0" class="mt-6">
                <h3 class="text-sm font-medium text-gray-700 mb-3">Pending Invitations</h3>
                <div class="space-y-2">
                  <div
                    v-for="invite in invitations"
                    :key="invite.id"
                    class="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <div>
                      <div class="font-medium text-gray-900">{{ invite.email }}</div>
                      <div class="text-xs text-gray-500">
                        Invited as {{ invite.role }} - Expires {{ formatDate(invite.expires_at) }}
                      </div>
                    </div>
                    <button
                      @click="handleRevokeInvitation(invite.id)"
                      class="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
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
          <div class="lg:col-span-1 space-y-4">
            <!-- Current Plan Card -->
            <div class="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <div class="flex items-center gap-2 mb-4">
                <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <h2 class="text-lg font-semibold text-gray-900">Subscription</h2>
              </div>

              <div v-if="subscription" class="space-y-4">
                <!-- Plan Badge -->
                <div
                  class="p-4 rounded-xl border-2"
                  :class="currentPlanId === 'free' ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-br from-brand/5 to-yellow-50 border-brand/20'"
                >
                  <div class="flex items-center justify-between mb-2">
                    <div class="text-sm text-gray-500">Current Plan</div>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                    >
                      <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="subscription.status === 'active' ? 'bg-green-500' : 'bg-gray-400'"></span>
                      {{ formatStatus(subscription.status || 'active') }}
                    </span>
                  </div>
                  <div class="flex items-baseline gap-1">
                    <span class="text-3xl font-bold text-gray-900">{{ formatPlanName(currentPlanId) }}</span>
                    <span v-if="currentPlanId !== 'free'" class="text-gray-500 text-sm">/month</span>
                  </div>
                </div>

                <!-- Usage Stats -->
                <div class="space-y-3">
                  <div class="text-sm font-medium text-gray-700">Usage This Month</div>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-600">Prompts</span>
                      <span class="font-medium" :class="currentPlanId === 'free' ? 'text-gray-900' : 'text-brand'">
                        {{ currentPlanId === 'free' ? '0 / 5' : 'Unlimited' }}
                      </span>
                    </div>
                    <div v-if="currentPlanId === 'free'" class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full bg-brand rounded-full" style="width: 0%"></div>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-600">Scans</span>
                      <span class="font-medium" :class="currentPlanId === 'free' ? 'text-gray-900' : 'text-brand'">
                        {{ currentPlanId === 'free' ? '0 / 2' : 'Unlimited' }}
                      </span>
                    </div>
                    <div v-if="currentPlanId === 'free'" class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full bg-brand rounded-full" style="width: 0%"></div>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-600">Competitors</span>
                      <span class="font-medium text-gray-900">
                        {{ currentPlanId === 'free' ? '0 / 1' : currentPlanId === 'pro' ? '0 / 10' : '0 / 50' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div v-if="subscription.current_period_end" class="pt-3 border-t border-gray-100">
                  <div class="flex items-center gap-2 text-sm text-gray-500">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Next billing: {{ formatDate(subscription.current_period_end) }}
                  </div>
                </div>

                <button
                  v-if="currentPlanId === 'free'"
                  class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-brand to-yellow-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-brand/20 transition-all"
                  @click="upgradePlan"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Upgrade to Pro
                </button>
                <button
                  v-else
                  class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  @click="manageBilling"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Manage Billing
                </button>

                <!-- View pricing link -->
                <NuxtLink
                  to="/pricing"
                  class="block text-center text-sm text-brand hover:text-brand/80 transition-colors"
                >
                  View all plans →
                </NuxtLink>
              </div>

              <div v-else class="text-center py-8">
                <div class="w-8 h-8 animate-spin rounded-full border-2 border-brand border-t-transparent mx-auto mb-3"></div>
                <p class="text-sm text-gray-500">Loading subscription...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Invite Modal -->
    <Teleport to="body">
      <div v-if="showInviteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showInviteModal = false">
        <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h3>
          <form @submit.prevent="handleSendInvitation" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                v-model="inviteForm.email"
                type="email"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                placeholder="colleague@company.com"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                v-model="inviteForm.role"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              >
                <option value="member">Member - Can view and use features</option>
                <option value="admin">Admin - Can manage team and settings</option>
              </select>
            </div>
            <div class="flex gap-3 justify-end">
              <button
                type="button"
                @click="showInviteModal = false"
                class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
                :disabled="inviteLoading"
              >
                {{ inviteLoading ? 'Sending...' : 'Send Invitation' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { createCheckout, createPortal, getTeamMembers, getInvitations, sendInvitation, revokeInvitation, updateMemberRole, removeMember } = useEdgeFunctions()

const orgLoading = ref(false)
const membersLoading = ref(true)
const inviteLoading = ref(false)
const showInviteModal = ref(false)

const organization = ref<any>(null)
const subscription = ref<any>(null)
const members = ref<any[]>([])
const invitations = ref<any[]>([])
const currentUserRole = ref<string>('member')

const orgForm = ref({
  name: '',
  domain: '',
  industry: ''
})

const inviteForm = ref({
  email: '',
  role: 'member' as 'admin' | 'member'
})

const isAdminOrOwner = computed(() => ['owner', 'admin'].includes(currentUserRole.value))
const currentPlanId = computed(() => subscription.value?.plan_type || organization.value?.plan || 'free')

onMounted(async () => {
  await loadSettings()
  await loadTeamData()
})

const loadSettings = async () => {
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id, active_organization_id, role')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id && !userData?.active_organization_id) return

    const organizationId = userData.active_organization_id || userData.organization_id
    currentUserRole.value = userData.role || 'member'

    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
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
      .eq('organization_id', organizationId)
      .single()

    subscription.value = sub || { plan_type: org?.plan || 'free', status: 'active' }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

const loadTeamData = async () => {
  membersLoading.value = true
  try {
    // Use Promise.allSettled so one failure doesn't break the other
    const [membersResult, invitationsResult] = await Promise.allSettled([
      getTeamMembers(),
      getInvitations()
    ])

    // Handle members result
    if (membersResult.status === 'fulfilled') {
      members.value = membersResult.value?.members || []
      // Update current user role from members data
      const currentMember = members.value.find(m => m.isCurrentUser)
      if (currentMember) {
        currentUserRole.value = currentMember.role
      }
    } else {
      console.error('Error loading members:', membersResult.reason)
    }

    // Handle invitations result
    if (invitationsResult.status === 'fulfilled') {
      invitations.value = invitationsResult.value?.invitations || []
    } else {
      console.error('Error loading invitations:', invitationsResult.reason)
    }
  } catch (error) {
    console.error('Error loading team data:', error)
  } finally {
    membersLoading.value = false
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
    const response = await createCheckout('pro')

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
    const response = await createPortal()

    if (response.url) {
      window.location.href = response.url
    }
  } catch (error: any) {
    console.error('Billing portal error:', error)
    alert('Failed to open billing portal. Please try again.')
  }
}

const handleSendInvitation = async () => {
  inviteLoading.value = true
  try {
    await sendInvitation(inviteForm.value.email, inviteForm.value.role)
    alert('Invitation sent successfully!')
    showInviteModal.value = false
    inviteForm.value = { email: '', role: 'member' }
    await loadTeamData()
  } catch (error: any) {
    console.error('Error sending invitation:', error)
    alert(error.message || 'Failed to send invitation')
  } finally {
    inviteLoading.value = false
  }
}

const handleRevokeInvitation = async (invitationId: string) => {
  if (!confirm('Are you sure you want to revoke this invitation?')) return

  try {
    await revokeInvitation(invitationId)
    await loadTeamData()
  } catch (error: any) {
    console.error('Error revoking invitation:', error)
    alert(error.message || 'Failed to revoke invitation')
  }
}

const handleRoleChange = async (memberId: string, newRole: string) => {
  try {
    await updateMemberRole(memberId, newRole as 'admin' | 'member')
    await loadTeamData()
  } catch (error: any) {
    console.error('Error updating role:', error)
    alert(error.message || 'Failed to update role')
  }
}

const handleRemoveMember = async (memberId: string) => {
  if (!confirm('Are you sure you want to remove this team member?')) return

  try {
    await removeMember(memberId)
    await loadTeamData()
  } catch (error: any) {
    console.error('Error removing member:', error)
    alert(error.message || 'Failed to remove member')
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
