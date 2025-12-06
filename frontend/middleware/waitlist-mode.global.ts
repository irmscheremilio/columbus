// Global middleware to block auth/dashboard access in waitlist mode
export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()

  if (!config.public.waitlistMode) {
    return // Not in waitlist mode, allow all routes
  }

  // Block access to auth and dashboard routes in waitlist mode
  const blockedPaths = ['/auth', '/dashboard']
  const isBlocked = blockedPaths.some(path => to.path.startsWith(path))

  if (isBlocked) {
    return navigateTo('/')
  }
})
