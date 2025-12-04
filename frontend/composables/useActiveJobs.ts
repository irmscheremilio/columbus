interface ActiveJob {
  id: string
  job_type: string
  status: string
  started_at: string | null
  metadata: any
  product_id: string | null
}

const JOB_TYPE_LABELS: Record<string, string> = {
  website_analysis: 'Analyzing website',
  visibility_scan: 'Running visibility scan',
  competitor_analysis: 'Analyzing competitor',
  freshness_check: 'Checking freshness',
  report_generation: 'Generating report',
  prompt_evaluation: 'Evaluating response'
}

// Global state shared across all components
const activeJobs = ref<ActiveJob[]>([])
const isSubscribed = ref(false)
let currentChannel: any = null
let pollingInterval: ReturnType<typeof setInterval> | null = null

export const useActiveJobs = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { activeProductId } = useActiveProduct()

  const jobCount = computed(() => activeJobs.value.length)

  const primaryJob = computed(() => {
    if (activeJobs.value.length === 0) return null
    // Prioritize 'processing' over 'queued'
    const processing = activeJobs.value.find(j => j.status === 'processing')
    return processing || activeJobs.value[0]
  })

  const primaryJobLabel = computed(() => {
    if (!primaryJob.value) return ''
    return JOB_TYPE_LABELS[primaryJob.value.job_type] || 'Processing'
  })

  const additionalJobsCount = computed(() => {
    return Math.max(0, activeJobs.value.length - 1)
  })

  const loadActiveJobs = async () => {
    if (!user.value || !activeProductId.value) {
      activeJobs.value = []
      return
    }

    const { data } = await supabase
      .from('jobs')
      .select('id, job_type, status, started_at, metadata, product_id')
      .eq('product_id', activeProductId.value)
      .in('status', ['queued', 'processing'])
      .order('created_at', { ascending: false })
      .limit(20)

    activeJobs.value = data || []
  }

  const subscribe = async () => {
    if (isSubscribed.value) return
    if (!user.value) return

    // Initial load
    await loadActiveJobs()

    // Clean up existing channel if any
    if (currentChannel) {
      supabase.removeChannel(currentChannel)
      currentChannel = null
    }

    // Subscribe to realtime changes
    currentChannel = supabase
      .channel('active-jobs-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs'
        },
        async () => {
          await loadActiveJobs()
        }
      )
      .subscribe((status) => {
        console.log('Jobs realtime subscription status:', status)
      })

    // Also poll every 5 seconds as fallback (in case realtime isn't enabled)
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
    pollingInterval = setInterval(async () => {
      await loadActiveJobs()
    }, 5000)

    isSubscribed.value = true

    // Return cleanup function
    return () => {
      if (currentChannel) {
        supabase.removeChannel(currentChannel)
        currentChannel = null
      }
      if (pollingInterval) {
        clearInterval(pollingInterval)
        pollingInterval = null
      }
      isSubscribed.value = false
    }
  }

  // Watch for product changes and reload
  watch(activeProductId, async () => {
    await loadActiveJobs()
  })

  return {
    activeJobs,
    jobCount,
    primaryJob,
    primaryJobLabel,
    additionalJobsCount,
    loadActiveJobs,
    subscribe
  }
}
