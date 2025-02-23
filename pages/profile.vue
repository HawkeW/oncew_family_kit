<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold mb-8">个人信息</h1>

    <div class="bg-white rounded-lg shadow p-6 space-y-6">
      <div class="flex items-center space-x-4">
        <div class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
          我的
        </div>
        <div>
          <h2 class="text-2xl font-semibold">{{ username }}</h2>
        </div>
      </div>

      <div class="space-y-4">
        <Button @click="handleLogout" variant="outline" class="w-full">
          退出登录
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')

onMounted(async () => {
  try {
    const response = await fetch('/api/auth/profile')
    if (response.ok) {
      const data = await response.json()
      username.value = data.username
    } else {
      // 如果未登录，重定向到登录页面
      router.push('/login')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    router.push('/login')
  }
})

async function handleLogout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST'
    })

    if (response.ok) {
      router.push('/login')
    }
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}
</script>