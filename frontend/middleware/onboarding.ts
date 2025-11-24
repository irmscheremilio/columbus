export default defineNuxtRouteMiddleware(async (to, from) => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Skip check for onboarding page itself
  if (to.path === '/onboarding') {
    return
  }

  // Only check for dashboard routes
  if (!to.path.startsWith('/dashboard')) {
    return
  }

  try {
    // Get user's organization
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) {
      return navigateTo('/onboarding')
    }

    // Check if onboarding is completed
    const { data: org } = await supabase
      .from('organizations')
      .select('onboarding_completed, website_analyzed')
      .eq('id', userData.organization_id)
      .single()

    if (!org?.onboarding_completed) {
      return navigateTo('/onboarding')
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return navigateTo('/onboarding')
  }
})
