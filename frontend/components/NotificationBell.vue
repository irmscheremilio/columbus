<template>
  <div class="relative" data-notification-bell>
    <!-- Bell Button -->
    <button
      @click.stop="toggleDropdown"
      class="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200"
      :class="isOpen && 'bg-gray-100/80 text-gray-900'"
      title="Notifications"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>

      <!-- Unread Badge -->
      <span
        v-if="hasUnread"
        class="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

  </div>

  <!-- Notification Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="isOpen = false"
      >
        <div
          class="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:w-96 max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <h3 class="text-sm font-semibold text-gray-900">Notifications</h3>
            <div class="flex items-center gap-2">
              <button
                v-if="hasUnread"
                @click="handleMarkAllAsRead"
                :disabled="markingAllRead"
                class="text-xs font-medium text-brand hover:text-brand/80 transition-colors disabled:opacity-50"
              >
                {{ markingAllRead ? 'Marking...' : 'Mark all read' }}
              </button>
              <button
                @click="isOpen = false"
                class="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Notifications List -->
          <div class="flex-1 overflow-y-auto">
            <!-- Loading State -->
            <div v-if="loading" class="flex items-center justify-center py-8">
              <div class="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>

            <!-- Empty State -->
            <div v-else-if="notifications.length === 0" class="py-8 text-center">
              <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p class="text-sm text-gray-500">No notifications</p>
            </div>

            <!-- Notification Items -->
            <div v-else class="divide-y divide-gray-100">
              <NotificationItem
                v-for="notification in visibleNotifications"
                :key="notification.id"
                :notification="notification"
                :actionLoading="actionLoadingId === notification.id"
                @click="handleNotificationClick(notification)"
                @dismiss="handleDismiss"
                @accept="handleAcceptInvite"
                @decline="handleDeclineInvite"
              />
            </div>
          </div>

          <!-- Footer -->
          <div v-if="notifications.length > maxVisible" class="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
            <NuxtLink
              to="/dashboard/notifications"
              @click="isOpen = false"
              class="text-xs font-medium text-brand hover:text-brand/80 transition-colors"
            >
              View all notifications
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const {
  notifications,
  unreadCount,
  loading,
  hasUnread,
  load,
  markAsRead,
  markAllAsRead,
  dismiss,
  acceptInvite,
  declineInvite,
  subscribe,
  unsubscribe
} = useNotifications()

const isOpen = ref(false)
const markingAllRead = ref(false)
const actionLoadingId = ref<string | null>(null)
const maxVisible = 10

// Computed for limited notifications display
const visibleNotifications = computed(() =>
  notifications.value.slice(0, maxVisible)
)

// Load notifications on mount
onMounted(async () => {
  await load({ includeRead: true, limit: 20 })
  subscribe()
})

onUnmounted(() => {
  unsubscribe()
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  // Refresh when opening
  if (isOpen.value) {
    load({ includeRead: true, limit: 20 })
  }
}

const handleNotificationClick = async (notification: any) => {
  if (!notification.read_at) {
    await markAsRead(notification.id)
  }

  // Handle navigation based on notification type
  if (notification.type === 'scan_complete' && notification.metadata?.product_id) {
    isOpen.value = false
    navigateTo('/dashboard/visibility')
  } else if (notification.type === 'recommendation' && notification.metadata?.recommendation_id) {
    isOpen.value = false
    navigateTo('/dashboard/recommendations')
  }
}

const handleMarkAllAsRead = async () => {
  try {
    markingAllRead.value = true
    await markAllAsRead()
  } catch (e) {
    console.error('Failed to mark all as read:', e)
  } finally {
    markingAllRead.value = false
  }
}

const handleDismiss = async (id: string) => {
  try {
    actionLoadingId.value = id
    await dismiss(id)
  } catch (e) {
    console.error('Failed to dismiss notification:', e)
  } finally {
    actionLoadingId.value = null
  }
}

const handleAcceptInvite = async (id: string) => {
  try {
    actionLoadingId.value = id
    const result = await acceptInvite(id)

    // Show success and reload page to reflect new organization
    if (result?.organization) {
      isOpen.value = false
      // Reload to refresh organization context
      window.location.reload()
    }
  } catch (e: any) {
    console.error('Failed to accept invite:', e)
    alert(e.message || 'Failed to accept invitation')
  } finally {
    actionLoadingId.value = null
  }
}

const handleDeclineInvite = async (id: string) => {
  try {
    actionLoadingId.value = id
    await declineInvite(id)
  } catch (e: any) {
    console.error('Failed to decline invite:', e)
    alert(e.message || 'Failed to decline invitation')
  } finally {
    actionLoadingId.value = null
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: translateY(100%);
}

@media (min-width: 640px) {
  .modal-enter-from > div,
  .modal-leave-to > div {
    transform: scale(0.95);
  }
}
</style>
