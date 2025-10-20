import { ref, computed } from 'vue'

// 全局认证状态
const isLoggedIn = ref(false)
const user = ref(null)

export const useCustomAuthState = () => {
  // 检查登录状态
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/profile')
      if (response.ok) {
        const userData = await response.json()
        isLoggedIn.value = true
        user.value = userData
      } else {
        isLoggedIn.value = false
        user.value = null
      }
    } catch (error) {
      console.error('检查认证状态失败:', error)
      isLoggedIn.value = false
      user.value = null
    }
  }

  // 设置登录状态
  const setLoggedIn = (status: boolean, userData?: any) => {
    isLoggedIn.value = status
    user.value = userData || null
  }

  // 登出
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      isLoggedIn.value = false
      user.value = null
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  return {
    isLoggedIn: computed(() => isLoggedIn.value),
    user: computed(() => user.value),
    checkAuthStatus,
    setLoggedIn,
    logout
  }
}