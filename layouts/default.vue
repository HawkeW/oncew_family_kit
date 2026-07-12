<template>
  <div class="min-h-screen bg-zinc-950">
    <!-- 首页导航 -->
    <nav class="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div class="mx-auto max-w-6xl px-6 py-4">
        <div class="flex items-center justify-between">
          <NuxtLink to="/" class="text-xl font-bold text-zinc-100">
            Nestory
          </NuxtLink>
          <div class="flex items-center space-x-4">
            <template v-if="isLoggedIn">
              <NuxtLink to="/dashboard" class="text-zinc-400 hover:text-zinc-100">
                进入首页
              </NuxtLink>
            </template>
            <template v-else>
              <NuxtLink to="/login" class="text-zinc-400 hover:text-zinc-100">
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

onMounted(() => {
  checkAuthStatus()
})
</script>
