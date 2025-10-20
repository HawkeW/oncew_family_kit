<template>
  <div>
    <header class="bg-gray-800 text-white p-4">
      <nav class="container mx-auto flex justify-between items-center">
        <div class="flex space-x-4">
          <NuxtLink to="/" class="hover:text-gray-300 transition-colors">首页</NuxtLink>
          <NuxtLink to="/menstrual-records" class="hover:text-gray-300 transition-colors">经期记录</NuxtLink>
          <NuxtLink to="/stool-records" class="hover:text-gray-300 transition-colors">便便记录</NuxtLink>
          <NuxtLink v-if="isLoggedIn" to="/groups" class="hover:text-gray-300 transition-colors">群组管理</NuxtLink>
          <NuxtLink to="/about" class="hover:text-gray-300 transition-colors">关于</NuxtLink>
        </div>
        <div>
          <NuxtLink v-if="isLoggedIn" to="/profile" class="hover:text-gray-300 transition-colors">我的</NuxtLink>
          <NuxtLink v-else to="/login" class="hover:text-gray-300 transition-colors">我的</NuxtLink>
        </div>
      </nav>
    </header>
    <main class="container mx-auto p-4">
      <slot />
    </main>
    <footer class="bg-gray-800 text-white p-4 mt-8">
      <div class="container mx-auto">
        © 2024 Oncew Family Kit
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isLoggedIn = ref(false)

onMounted(async () => {
  try {
    const response = await fetch('/api/auth/profile')
    isLoggedIn.value = response.ok
  } catch (error) {
    console.error('检查登录状态失败:', error)
    isLoggedIn.value = false
  }
})
</script>