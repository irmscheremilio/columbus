export default defineNuxtRouteMiddleware(async (to, from) => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Skip check for auth routes
  if (to.path.startsWith('/auth')) {
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
      // User hasn't completed setup - redirect to callback which handles onboarding
      return navigateTo('/auth/callback')
    }

    // Organization exists - user can access dashboard
    // Note: We no longer require onboarding_completed since the worker runs async
    // The dashboard will show a "generating prompts" state if prompts aren't ready yet
  } catch (error) {
    console.error('Error checking organization status:', error)
    return navigateTo('/auth/callback')
  }
})
