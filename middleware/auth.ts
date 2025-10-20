export default defineNuxtRouteMiddleware((to, from) => {
  // This middleware will redirect to login if user is not authenticated
  // We'll use client-side authentication check
  if (process.client) {
    // Check authentication status on client side
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/profile')
        if (!response.ok) {
          return navigateTo('/login')
        }
      } catch (error) {
        return navigateTo('/login')
      }
    }
    
    return checkAuth()
  }
})