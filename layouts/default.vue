<template>
  <div class="min-h-screen bg-background">
    <!-- 首页导航 -->
    <nav class="border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div class="mx-auto max-w-6xl px-6 py-4">
        <div class="flex items-center justify-between">
          <NuxtLink to="/" class="text-xl font-bold text-foreground">
            Nestory
          </NuxtLink>
          <div class="flex items-center space-x-4">
            <!-- 主题切换 -->
            <button 
              @click="toggleTheme"
              class="p-2 rounded-lg hover:bg-muted transition-colors"
              :title="isDark ? '切换亮色模式' : '切换暗色模式'"
            >
              <!-- 太阳图标 (暗色模式显示) -->
              <svg v-if="isDark" class="h-5 w-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <!-- 月亮图标 (亮色模式显示) -->
              <svg v-else class="h-5 w-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
            <template v-if="isLoggedIn">
              <NuxtLink to="/dashboard" class="text-muted-foreground hover:text-foreground">
                进入首页
              </NuxtLink>
            </template>
            <template v-else>
              <NuxtLink to="/login" class="text-muted-foreground hover:text-foreground">
                登录
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main :class="isHomePage ? 'px-0 py-0' : 'container mx-auto px-4 py-8'">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useCustomAuthState } from '~/composables/useCustomAuthState'

const { isLoggedIn, checkAuthStatus } = useCustomAuthState()
const route = useRoute()
const isHomePage = computed(() => route.path === '/')

// 主题切换
const isDark = ref(false)

function toggleTheme() {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  // 恢复主题设置
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  }
  checkAuthStatus()
})
</script>
