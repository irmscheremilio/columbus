export const useEdgeFunctions = () => {
  const supabase = useSupabaseClient()

  const triggerScan = async (promptIds?: string[]) => {
    const { data, error } = await supabase.functions.invoke('trigger-scan', {
      body: { promptIds: promptIds || [] }
    })

    if (error) throw error
    return data
  }

  const submitWaitlist = async (email: string, companyName: string, website?: string) => {
    const { data, error } = await supabase.functions.invoke('waitlist', {
      body: { email, companyName, website }
    })

    if (error) throw error
    return data
  }

  const setupUser = async (organizationName: string, brandName: string, website?: string) => {
    const { data, error } = await supabase.functions.invoke('setup-user', {
      body: { organizationName, brandName, website }
    })

    if (error) throw error
    return data
  }

  return {
    triggerScan,
    submitWaitlist,
    setupUser,
  }
}
