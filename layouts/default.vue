<template>
  <div :class="isHome ? 'min-h-screen bg-zinc-950' : 'min-h-screen bg-background'">
    <!-- 导航栏 -->
    <nav :class="isHome ? 'border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md' : 'border-b bg-card'">
      <div class="container mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-6">
            <NuxtLink to="/" :class="isHome ? 'text-xl font-bold text-zinc-100' : 'text-xl font-bold text-primary'">
              Family Kit
            </NuxtLink>
            <div class="flex space-x-4">
              <NuxtLink v-if="isLoggedIn" to="/wedding/admin" :class="isHome ? 'text-zinc-400 hover:text-zinc-100' : 'text-muted-foreground hover:text-foreground'">
                婚礼筹备
              </NuxtLink>
              <!-- <NuxtLink v-if="isLoggedIn" to="/records" class="text-muted-foreground hover:text-foreground">
                生活记录
              </NuxtLink> -->
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <NuxtLink v-if="isLoggedIn" to="/profile" :class="isHome ? 'text-zinc-400 hover:text-zinc-100' : 'text-muted-foreground hover:text-foreground'">
              {{ user?.username || '个人中心' }}
            </NuxtLink>
            <NuxtLink v-else to="/login" :class="isHome ? 'text-zinc-400 hover:text-zinc-100' : 'text-muted-foreground hover:text-foreground'">
              登录
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main :class="isHome ? 'px-0 py-0' : 'container mx-auto px-4 py-8'">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useCustomAuthState } from '~/composables/useCustomAuthState'

const { isLoggedIn, user, checkAuthStatus } = useCustomAuthState()
const route = useRoute()
const isHome = computed(() => route.path === '/')

onMounted(async () => {
  if (isHome.value) {
    return
  }
  await checkAuthStatus()
})
</script>
