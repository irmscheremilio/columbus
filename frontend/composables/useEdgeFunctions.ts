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

  // Stripe functions
  const createCheckout = async (planId: string) => {
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: { planId }
    })

    if (error) throw error
    return data
  }

  const createPortal = async () => {
    const { data, error } = await supabase.functions.invoke('stripe-portal', {
      body: {}
    })

    if (error) throw error
    return data
  }

  // Team invitations
  const getInvitations = async () => {
    const { data, error } = await supabase.functions.invoke('team-invitations', {
      method: 'GET'
    })

    if (error) throw error
    return data
  }

  const sendInvitation = async (email: string, role: 'admin' | 'member') => {
    const { data, error } = await supabase.functions.invoke('team-invitations', {
      body: { email, role }
    })

    if (error) throw error
    return data
  }

  const revokeInvitation = async (invitationId: string) => {
    const { data, error } = await supabase.functions.invoke('team-invitations', {
      method: 'DELETE',
      body: { id: invitationId }
    })

    if (error) throw error
    return data
  }

  // Accept invitation
  const getInvitationDetails = async (token: string) => {
    const { data, error } = await supabase.functions.invoke('accept-invitation', {
      body: { token }
    })

    if (error) throw error
    return data
  }

  const acceptInvitation = async (token: string) => {
    const { data, error } = await supabase.functions.invoke('accept-invitation', {
      body: { token }
    })

    if (error) throw error
    return data
  }

  // Team members
  const getTeamMembers = async () => {
    const { data, error } = await supabase.functions.invoke('team-members', {
      method: 'GET'
    })

    if (error) throw error
    return data
  }

  const updateMemberRole = async (memberId: string, role: 'admin' | 'member') => {
    const { data, error } = await supabase.functions.invoke('team-members', {
      method: 'PATCH',
      body: { memberId, role }
    })

    if (error) throw error
    return data
  }

  const removeMember = async (memberId: string) => {
    const { data, error } = await supabase.functions.invoke('team-members', {
      method: 'DELETE',
      body: { id: memberId }
    })

    if (error) throw error
    return data
  }

  return {
    triggerScan,
    submitWaitlist,
    setupUser,
    // Stripe
    createCheckout,
    createPortal,
    // Team
    getInvitations,
    sendInvitation,
    revokeInvitation,
    getInvitationDetails,
    acceptInvitation,
    getTeamMembers,
    updateMemberRole,
    removeMember,
  }
}
