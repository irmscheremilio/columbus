<template>
  <div
    class="flex gap-3 p-3 rounded-xl transition-colors"
    :class="[
      notification.read_at ? 'bg-white' : 'bg-brand/5',
      'hover:bg-gray-50'
    ]"
  >
    <!-- Icon based on type -->
    <div
      class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
      :class="iconBgClass"
    >
      <component :is="iconComponent" class="w-4 h-4" :class="iconColorClass" />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ notification.title }}</p>
          <p v-if="notification.message" class="text-xs text-gray-500 line-clamp-2 mt-0.5">
            {{ notification.message }}
          </p>
        </div>
        <button
          @click.stop="$emit('dismiss', notification.id)"
          class="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          title="Dismiss"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Team invite actions -->
      <div v-if="notification.type === 'team_invite' && !notification.dismissed_at" class="flex items-center gap-2 mt-2">
        <button
          @click.stop="$emit('accept', notification.id)"
          :disabled="actionLoading"
          class="px-3 py-1.5 text-xs font-medium text-white bg-brand rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50"
        >
          {{ actionLoading ? 'Joining...' : 'Accept' }}
        </button>
        <button
          @click.stop="$emit('decline', notification.id)"
          :disabled="actionLoading"
          class="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Decline
        </button>
        <span v-if="notification.metadata?.organization_name" class="text-xs text-gray-400 ml-auto truncate">
          {{ notification.metadata.organization_name }}
        </span>
      </div>

      <!-- Timestamp -->
      <p class="text-xs text-gray-400 mt-1.5">{{ formatTime(notification.created_at) }}</p>
    </div>

    <!-- Unread indicator -->
    <div v-if="!notification.read_at" class="w-2 h-2 bg-brand rounded-full flex-shrink-0 mt-2" />
  </div>
</template>

<script setup lang="ts">
import type { Notification } from '~/composables/useNotifications'

const props = defineProps<{
  notification: Notification
  actionLoading?: boolean
}>()

defineEmits<{
  (e: 'dismiss', id: string): void
  (e: 'accept', id: string): void
  (e: 'decline', id: string): void
  (e: 'click', notification: Notification): void
}>()

// Icon configurations by type
const iconConfigs: Record<string, { bg: string, color: string, icon: string }> = {
  team_invite: { bg: 'bg-purple-100', color: 'text-purple-600', icon: 'users-plus' },
  member_joined: { bg: 'bg-green-100', color: 'text-green-600', icon: 'user-check' },
  member_left: { bg: 'bg-red-100', color: 'text-red-600', icon: 'user-minus' },
  role_changed: { bg: 'bg-blue-100', color: 'text-blue-600', icon: 'shield' },
  scan_complete: { bg: 'bg-brand/10', color: 'text-brand', icon: 'check-circle' },
  gap_found: { bg: 'bg-orange-100', color: 'text-orange-600', icon: 'alert' },
  recommendation: { bg: 'bg-yellow-100', color: 'text-yellow-600', icon: 'lightbulb' },
  system: { bg: 'bg-gray-100', color: 'text-gray-600', icon: 'info' }
}

const iconBgClass = computed(() => iconConfigs[props.notification.type]?.bg || 'bg-gray-100')
const iconColorClass = computed(() => iconConfigs[props.notification.type]?.color || 'text-gray-600')

// Icon components
const UsersPlus = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' })
])

const UserCheck = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }),
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M16 11l2 2 4-4' })
])

const UserMinus = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6' })
])

const Shield = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' })
])

const CheckCircle = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
])

const Alert = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' })
])

const Lightbulb = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' })
])

const Info = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
])

const iconComponents: Record<string, any> = {
  'users-plus': UsersPlus,
  'user-check': UserCheck,
  'user-minus': UserMinus,
  'shield': Shield,
  'check-circle': CheckCircle,
  'alert': Alert,
  'lightbulb': Lightbulb,
  'info': Info
}

const iconComponent = computed(() => {
  const iconName = iconConfigs[props.notification.type]?.icon || 'info'
  return iconComponents[iconName] || Info
})

// Format relative time
const formatTime = (date: string) => {
  const now = new Date()
  const notifDate = new Date(date)
  const diffMs = now.getTime() - notifDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return notifDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>
