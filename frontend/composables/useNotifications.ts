export interface Notification {
  id: string
  user_id: string
  type: 'team_invite' | 'member_joined' | 'member_left' | 'role_changed' | 'scan_complete' | 'gap_found' | 'recommendation' | 'system'
  title: string
  message: string | null
  metadata: Record<string, any>
  read_at: string | null
  dismissed_at: string | null
  created_at: string
  expires_at: string | null
}

export const useNotifications = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // State
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Realtime subscription channel
  let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

  /**
   * Load notifications from the server
   */
  const load = async (options?: { includeRead?: boolean; limit?: number }) => {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (options?.includeRead) params.set('includeRead', 'true')
      if (options?.limit) params.set('limit', options.limit.toString())

      const { data, error: err } = await supabase.functions.invoke('notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (err) throw err

      notifications.value = data.notifications || []
      unreadCount.value = data.unreadCount || 0
    } catch (e: any) {
      console.error('Error loading notifications:', e)
      error.value = e.message || 'Failed to load notifications'
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark a single notification as read
   */
  const markAsRead = async (id: string) => {
    try {
      const { error: err } = await supabase.functions.invoke('notifications', {
        method: 'PATCH',
        body: { id, action: 'read' }
      })

      if (err) throw err

      // Update local state
      const notif = notifications.value.find(n => n.id === id)
      if (notif) {
        notif.read_at = new Date().toISOString()
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (e: any) {
      console.error('Error marking notification as read:', e)
      throw e
    }
  }

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    try {
      const { error: err } = await supabase.functions.invoke('notifications', {
        method: 'PATCH',
        body: { action: 'mark_all_read' }
      })

      if (err) throw err

      // Update local state
      notifications.value.forEach(n => {
        if (!n.read_at) {
          n.read_at = new Date().toISOString()
        }
      })
      unreadCount.value = 0
    } catch (e: any) {
      console.error('Error marking all as read:', e)
      throw e
    }
  }

  /**
   * Dismiss a notification (hide from list)
   */
  const dismiss = async (id: string) => {
    try {
      const { error: err } = await supabase.functions.invoke('notifications', {
        method: 'PATCH',
        body: { id, action: 'dismiss' }
      })

      if (err) throw err

      // Remove from local state
      const index = notifications.value.findIndex(n => n.id === id)
      if (index > -1) {
        const notif = notifications.value[index]
        if (!notif.read_at) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        notifications.value.splice(index, 1)
      }
    } catch (e: any) {
      console.error('Error dismissing notification:', e)
      throw e
    }
  }

  /**
   * Accept a team invite from a notification
   */
  const acceptInvite = async (notificationId: string) => {
    try {
      const { data, error: err } = await supabase.functions.invoke('notifications', {
        method: 'POST',
        body: { notificationId },
        headers: {
          'x-action': 'accept-invite'
        }
      })

      // The edge function uses pathname, so we need to call it differently
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/notifications/accept-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ notificationId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to accept invite')
      }

      const result = await response.json()

      // Remove from local state
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index > -1) {
        const notif = notifications.value[index]
        if (!notif.read_at) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        notifications.value.splice(index, 1)
      }

      return result
    } catch (e: any) {
      console.error('Error accepting invite:', e)
      throw e
    }
  }

  /**
   * Decline a team invite from a notification
   */
  const declineInvite = async (notificationId: string) => {
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/notifications/decline-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ notificationId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to decline invite')
      }

      // Remove from local state
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index > -1) {
        const notif = notifications.value[index]
        if (!notif.read_at) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        notifications.value.splice(index, 1)
      }
    } catch (e: any) {
      console.error('Error declining invite:', e)
      throw e
    }
  }

  /**
   * Subscribe to realtime notification updates
   */
  const subscribe = () => {
    if (!user.value?.id) return

    // Unsubscribe from any existing channel
    unsubscribe()

    realtimeChannel = supabase
      .channel(`notifications:${user.value.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.value.id}`
        },
        (payload) => {
          // Add new notification to the beginning of the list
          const newNotification = payload.new as Notification
          notifications.value.unshift(newNotification)
          if (!newNotification.read_at) {
            unreadCount.value++
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.value.id}`
        },
        (payload) => {
          // Update notification in list
          const updatedNotification = payload.new as Notification
          const index = notifications.value.findIndex(n => n.id === updatedNotification.id)
          if (index > -1) {
            const wasUnread = !notifications.value[index].read_at
            const isNowRead = !!updatedNotification.read_at

            notifications.value[index] = updatedNotification

            // Update unread count if read status changed
            if (wasUnread && isNowRead) {
              unreadCount.value = Math.max(0, unreadCount.value - 1)
            }

            // Remove from list if dismissed
            if (updatedNotification.dismissed_at) {
              notifications.value.splice(index, 1)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.value.id}`
        },
        (payload) => {
          // Remove notification from list
          const deletedId = (payload.old as any).id
          const index = notifications.value.findIndex(n => n.id === deletedId)
          if (index > -1) {
            if (!notifications.value[index].read_at) {
              unreadCount.value = Math.max(0, unreadCount.value - 1)
            }
            notifications.value.splice(index, 1)
          }
        }
      )
      .subscribe()
  }

  /**
   * Unsubscribe from realtime updates
   */
  const unsubscribe = () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  // Computed properties
  const hasUnread = computed(() => unreadCount.value > 0)

  const inviteNotifications = computed(() =>
    notifications.value.filter(n => n.type === 'team_invite' && !n.dismissed_at)
  )

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribe()
  })

  return {
    // State
    notifications: readonly(notifications),
    unreadCount: readonly(unreadCount),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    hasUnread,
    inviteNotifications,

    // Methods
    load,
    markAsRead,
    markAllAsRead,
    dismiss,
    acceptInvite,
    declineInvite,
    subscribe,
    unsubscribe
  }
}
