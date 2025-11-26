export default defineNuxtRouteMiddleware(async (to, from) => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Wait for auth state to be resolved
  if (import.meta.server) {
    // On server, check session directly
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return navigateTo('/')
    }
  } else {
    // On client, use the reactive user state
    // If user is not authenticated and trying to access protected route
    if (!user.value) {
      // Double-check with getSession for edge cases
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return navigateTo('/')
      }
    }
  }
})
