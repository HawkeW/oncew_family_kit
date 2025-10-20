export default defineNuxtRouteMiddleware(async (to, from) => {
  // This middleware will redirect to login if user is not authenticated
  // We'll use client-side authentication check
  if (process.client) {
    try {
      const response = await fetch('/api/auth/profile')
      if (!response.ok) {
        // 添加返回地址参数，登录后可以跳转回原页面
        const returnUrl = to.fullPath
        return navigateTo(`/login?redirect=${encodeURIComponent(returnUrl)}`)
      }
    } catch (error) {
      // 添加返回地址参数，登录后可以跳转回原页面
      const returnUrl = to.fullPath
      return navigateTo(`/login?redirect=${encodeURIComponent(returnUrl)}`)
    }
  }
})