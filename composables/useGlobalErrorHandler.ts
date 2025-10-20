import { useRouter } from 'vue-router'
import { useCustomAuthState } from './useCustomAuthState'

export const useGlobalErrorHandler = () => {
  const router = useRouter()
  const { setLoggedIn } = useCustomAuthState()

  // 全局fetch拦截器
  const interceptFetch = () => {
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        // 检查401未授权错误
        if (response.status === 401) {
          console.warn('检测到401未授权错误，正在跳转到登录页面')
          
          // 更新认证状态
          setLoggedIn(false)
          
          // 跳转到登录页面
          await router.push('/login')
          
          // 返回原始响应，让调用方也能处理
          return response
        }
        
        return response
      } catch (error) {
        console.error('网络请求失败:', error)
        throw error
      }
    }
  }

  // 恢复原始fetch
  const restoreFetch = () => {
    // 这里可以保存原始fetch的引用并恢复，但通常不需要
  }

  return {
    interceptFetch,
    restoreFetch
  }
}