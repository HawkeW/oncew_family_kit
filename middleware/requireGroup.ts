export default defineNuxtRouteMiddleware(async (to) => {
  // 只在客户端检查
  if (process.server) return

  const router = useRouter()

  try {
    // 获取用户群组
    const res = await fetch('/api/groups')
    if (res.ok) {
      const groups = await res.json()
      // 如果没有群组，跳转到 onboarding
      if (groups.length === 0) {
        return router.push('/onboarding')
      }
    }
  } catch (e) {
    // 获取失败，留在当前页
    console.error('检查群组状态失败:', e)
  }
})
