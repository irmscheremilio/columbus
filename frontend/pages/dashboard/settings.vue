<template>
  <div class="min-h-screen bg-gray-50">
    <div class="p-4 lg:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Settings</h1>
          <p class="text-sm text-gray-500">Manage your organization and subscription</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Main Settings Column -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Organization Settings -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="text-sm font-semibold text-gray-900 mb-3">Organization Details</h2>
            <form @submit.prevent="updateOrganization" class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
                  <input
                    v-model="orgForm.name"
                    type="text"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Industry</label>
                  <select v-model="orgForm.industry" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand">
                    <option value="">Select industry...</option>
                    <option value="saas">SaaS</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="consulting">Consulting</option>
                    <option value="agency">Agency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                class="inline-flex items-center gap-2 px-3 py-1.5 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand/90 transition-colors disabled:opacity-50"
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
          <div class="bg-white rounded-lg border border-gray-200">
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 class="text-sm font-semibold text-gray-900">Team Members</h2>
              <button
                v-if="isAdminOrOwner"
                @click="showInviteModal = true"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand text-white text-xs font-medium rounded-md hover:bg-brand/90 transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Invite
              </button>
            </div>

            <div v-if="membersLoading" class="flex items-center justify-center py-8">
              <div class="w-5 h-5 animate-spin rounded-full border-2 border-brand border-t-transparent"></div>
            </div>
            <div v-else-if="members.length === 0" class="text-center py-8">
              <p class="text-sm text-gray-500 mb-2">No team members yet</p>
              <button
                v-if="isAdminOrOwner"
                @click="showInviteModal = true"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/5 rounded-md transition-colors"
              >
                Invite your first member
              </button>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th class="text-left px-4 py-2 font-medium">Member</th>
                    <th class="text-center px-4 py-2 font-medium hidden sm:table-cell">Joined</th>
                    <th class="text-center px-4 py-2 font-medium">Role</th>
                    <th class="text-right px-4 py-2 font-medium w-24">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr
                    v-for="member in members"
                    :key="member.id"
                    class="text-sm hover:bg-gray-50"
                  >
                    <td class="px-4 py-2.5">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-semibold flex-shrink-0">
                          {{ member.email?.charAt(0).toUpperCase() }}
                        </div>
                        <div class="min-w-0">
                          <div class="text-gray-900 truncate">{{ member.email }}</div>
                          <span v-if="member.isCurrentUser" class="text-xs text-brand">(You)</span>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-2.5 text-center hidden sm:table-cell">
                      <span class="text-xs text-gray-500">{{ formatDateShort(member.joinedAt) }}</span>
                    </td>
                    <td class="px-4 py-2.5 text-center">
                      <span
                        class="inline-flex px-1.5 py-0.5 rounded text-xs font-medium"
                        :class="{
                          'bg-purple-100 text-purple-700': member.role === 'owner',
                          'bg-blue-100 text-blue-700': member.role === 'admin',
                          'bg-gray-100 text-gray-600': member.role === 'member'
                        }"
                      >
                        {{ member.role }}
                      </span>
                    </td>
                    <td class="px-4 py-2.5 text-right">
                      <div v-if="isAdminOrOwner && !member.isCurrentUser && member.role !== 'owner'" class="flex items-center justify-end gap-1">
                        <select
                          v-if="currentUserRole === 'owner'"
                          :value="member.role"
                          @change="handleRoleChange(member.id, ($event.target as HTMLSelectElement).value)"
                          class="text-xs px-1.5 py-1 border border-gray-200 rounded"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                        <button
                          @click="handleRemoveMember(member.id)"
                          class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove member"
                        >
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <span v-else class="text-xs text-gray-400">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pending Invitations -->
            <div v-if="invitations.length > 0" class="border-t border-gray-100">
              <div class="px-4 py-2 bg-yellow-50/50">
                <h3 class="text-xs font-medium text-gray-600 mb-2">Pending Invitations</h3>
                <div class="space-y-1.5">
                  <div
                    v-for="invite in invitations"
                    :key="invite.id"
                    class="flex items-center justify-between py-1.5 text-sm"
                  >
                    <div>
                      <span class="text-gray-900">{{ invite.email }}</span>
                      <span class="text-xs text-gray-500 ml-2">{{ invite.role }} - expires {{ formatDateShort(invite.expires_at) }}</span>
                    </div>
                    <button
                      @click="handleRevokeInvitation(invite.id)"
                      class="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Danger Zone - Owner Only -->
          <div v-if="isOwner" class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="text-sm font-semibold text-gray-900 mb-3">Danger Zone</h2>
            <div class="flex items-center justify-between p-3 bg-red-50 rounded-md border border-red-100">
              <div>
                <div class="text-sm font-medium text-gray-900">Delete Organization</div>
                <div class="text-xs text-gray-500">Permanently delete all data</div>
              </div>
              <button
                class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                @click="deleteOrganization"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <!-- Subscription Sidebar - Owner/Admin Only for Management -->
        <div class="lg:col-span-1 space-y-4">
          <div class="bg-white rounded-lg border border-gray-200 p-4 sticky top-20">
            <h2 class="text-sm font-semibold text-gray-900 mb-3">Subscription</h2>

            <div v-if="subscription" class="space-y-4">
              <!-- Plan Badge -->
              <div
                class="p-3 rounded-lg border"
                :class="currentPlanId === 'free' ? 'bg-gray-50 border-gray-200' : 'bg-brand/5 border-brand/20'"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs text-gray-500">Current Plan</span>
                  <span
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                    :class="subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full mr-1" :class="subscription.status === 'active' ? 'bg-green-500' : 'bg-gray-400'"></span>
                    {{ formatStatus(subscription.status || 'active') }}
                  </span>
                </div>
                <div class="text-xl font-bold text-gray-900">{{ formatPlanName(currentPlanId) }}</div>
              </div>

              <!-- Usage Stats -->
              <div class="space-y-2">
                <div class="text-xs font-medium text-gray-500 uppercase">Usage</div>
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">Prompts</span>
                    <span class="font-medium" :class="currentPlanId === 'free' ? 'text-gray-900' : 'text-green-600'">
                      {{ currentPlanId === 'free' ? '0 / 5' : 'Unlimited' }}
                    </span>
                  </div>
                  <div v-if="currentPlanId === 'free'" class="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-brand rounded-full" style="width: 0%"></div>
                  </div>
                </div>
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">Scans</span>
                    <span class="font-medium" :class="currentPlanId === 'free' ? 'text-gray-900' : 'text-green-600'">
                      {{ currentPlanId === 'free' ? '0 / 2' : 'Unlimited' }}
                    </span>
                  </div>
                  <div v-if="currentPlanId === 'free'" class="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-brand rounded-full" style="width: 0%"></div>
                  </div>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">Competitors</span>
                  <span class="font-medium text-gray-900">
                    {{ currentPlanId === 'free' ? '0 / 1' : currentPlanId === 'pro' ? '0 / 10' : '0 / 50' }}
                  </span>
                </div>
              </div>

              <div v-if="subscription.current_period_end && isAdminOrOwner" class="pt-2 border-t border-gray-100">
                <div class="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Next billing: {{ formatDateShort(subscription.current_period_end) }}
                </div>
              </div>

              <!-- Billing actions - Owner/Admin only (wait for role to load) -->
              <template v-if="!roleLoaded">
                <div class="h-10 bg-gray-100 rounded-md animate-pulse"></div>
              </template>
              <template v-else-if="isAdminOrOwner">
                <button
                  v-if="currentPlanId === 'free'"
                  class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand/90 transition-colors"
                  @click="upgradePlan"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Upgrade to Pro
                </button>
                <button
                  v-else
                  class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                  @click="manageBilling"
                >
                  Manage Billing
                </button>

                <NuxtLink
                  to="/pricing"
                  class="block text-center text-xs text-brand hover:text-brand/80 transition-colors"
                >
                  View all plans
                </NuxtLink>
              </template>

              <!-- Member notice -->
              <template v-else>
                <div class="pt-2 border-t border-gray-100">
                  <p class="text-xs text-gray-500 text-center">
                    Contact your organization owner to manage billing
                  </p>
                </div>
              </template>
            </div>

            <div v-else class="text-center py-6">
              <div class="w-5 h-5 animate-spin rounded-full border-2 border-brand border-t-transparent mx-auto mb-2"></div>
              <p class="text-xs text-gray-500">Loading subscription...</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Invite Modal -->
    <Teleport to="body">
      <div v-if="showInviteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="showInviteModal = false">
        <div class="bg-white rounded-lg p-5 w-full max-w-sm">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h3>
          <form @submit.prevent="handleSendInvitation" class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
              <input
                v-model="inviteForm.email"
                type="email"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                placeholder="colleague@company.com"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <select
                v-model="inviteForm.role"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
              >
                <option value="member">Member - View and use features</option>
                <option value="admin">Admin - Manage team and settings</option>
              </select>
            </div>
            <div class="flex gap-2 pt-2">
              <button
                type="button"
                @click="showInviteModal = false"
                class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="flex-1 px-3 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand/90 transition-colors disabled:opacity-50"
                :disabled="inviteLoading"
              >
                {{ inviteLoading ? 'Sending...' : 'Send' }}
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
const currentUserRole = ref<string | null>(null) // null until loaded

const orgForm = ref({
  name: '',
  industry: ''
})

const inviteForm = ref({
  email: '',
  role: 'member' as 'admin' | 'member'
})

const isAdminOrOwner = computed(() => currentUserRole.value !== null && ['owner', 'admin'].includes(currentUserRole.value))
const isOwner = computed(() => currentUserRole.value === 'owner')
const roleLoaded = computed(() => currentUserRole.value !== null)
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
    // Role will be set from organization_members in loadTeamData

    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (org) {
      organization.value = org
      orgForm.value = {
        name: org.name,
        industry: org.industry || ''
      }
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle()

    subscription.value = sub || { plan_type: org?.plan || 'free', status: 'active' }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

const loadTeamData = async () => {
  membersLoading.value = true
  try {
    const [membersResult, invitationsResult] = await Promise.allSettled([
      getTeamMembers(),
      getInvitations()
    ])

    if (membersResult.status === 'fulfilled') {
      members.value = membersResult.value?.members || []
      const currentMember = members.value.find(m => m.isCurrentUser)
      if (currentMember) {
        currentUserRole.value = currentMember.role
      } else {
        // Fallback: check if user is org creator (owner)
        if (organization.value?.created_by === user.value?.id) {
          currentUserRole.value = 'owner'
        } else {
          currentUserRole.value = 'member'
        }
      }
    } else {
      console.error('Error loading members:', membersResult.reason)
      // On error, default to member for safety
      currentUserRole.value = 'member'
    }

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

const formatDateShort = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
