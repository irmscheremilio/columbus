export default defineNuxtRouteMiddleware(async (to, from) => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Skip check for auth routes
  if (to.path.startsWith('/auth')) {
    return
  }

  // Only check for dashboard routes (but not the onboarding page itself)
  if (!to.path.startsWith('/dashboard')) {
    return
  }

  // Allow access to onboarding page without redirect loop
  if (to.path === '/dashboard/onboarding') {
    return
  }

  try {
    // Get user's profile with organization and onboarding status
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, active_organization_id, onboarding_complete')
      .eq('id', user.value?.id)
      .single()

    const organizationId = profile?.active_organization_id || profile?.organization_id
    const onboardingComplete = profile?.onboarding_complete ?? false

    // If no organization OR onboarding not complete, redirect to onboarding
    if (!organizationId || !onboardingComplete) {
      return navigateTo('/dashboard/onboarding')
    }

    // Organization exists and onboarding is complete - allow access to dashboard
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    // On error, redirect to onboarding to be safe
    return navigateTo('/dashboard/onboarding')
  }
})
