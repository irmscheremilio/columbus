/**
 * Composable for realtime dashboard updates
 * Subscribes to prompt_results changes and triggers refresh callbacks
 */

let channel: any = null
let pollingInterval: ReturnType<typeof setInterval> | null = null
const isSubscribed = ref(false)

export const useDashboardRealtime = () => {
  const supabase = useSupabaseClient()
  const { activeProductId } = useActiveProduct()

  const subscribe = (onUpdate: () => void) => {
    if (isSubscribed.value) return

    // Clean up existing channel if any
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }

    // Subscribe to realtime changes on prompt_results
    channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prompt_results'
        },
        (payload) => {
          // Only trigger update if the new result is for the active product
          if (payload.new && payload.new.product_id === activeProductId.value) {
            console.log('[Dashboard Realtime] New prompt result, refreshing...')
            onUpdate()
          }
        }
      )
      .subscribe((status) => {
        console.log('[Dashboard Realtime] Subscription status:', status)
      })

    // Also poll every 30 seconds as fallback
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
    pollingInterval = setInterval(() => {
      onUpdate()
    }, 30000)

    isSubscribed.value = true
  }

  const unsubscribe = () => {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    isSubscribed.value = false
  }

  return {
    subscribe,
    unsubscribe,
    isSubscribed
  }
}
