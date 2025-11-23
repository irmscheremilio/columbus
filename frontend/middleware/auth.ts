export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()

  // If user is not authenticated and trying to access protected route
  if (!user.value) {
    return navigateTo('/auth/login')
  }
})
