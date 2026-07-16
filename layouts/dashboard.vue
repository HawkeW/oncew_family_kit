<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- 侧边栏 - PC端固定显示，移动端作为抽屉 -->
    <div
      ref="drawerRef"
      class="fixed inset-y-0 left-0 z-50 w-72 border-r border-border/80 bg-background/95 backdrop-blur-xl transition-transform duration-300
        -translate-x-full lg:translate-x-0"
      :class="{ 'translate-x-0': isDrawerOpen }"
    >
      <div class="flex h-full flex-col">
        <!-- Logo 区域 -->
        <div class="border-b border-border/60 px-6 py-5">
          <NuxtLink to="/dashboard" class="text-lg font-semibold">Nestory</NuxtLink>
          <p class="mt-0.5 text-xs text-muted-foreground">家庭健康记录</p>
        </div>

        <!-- 导航列表 -->
        <nav class="flex-1 overflow-y-auto px-3 py-4">
          <div class="space-y-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all"
              :class="isActive(item.path)"
              @click="closeDrawer"
            >
              <span class="text-base">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </NuxtLink>
          </div>
        </nav>

        <!-- 底部用户信息 -->
        <div class="border-t border-border/60 p-4">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary">
              {{ user?.username?.charAt(0) || '用户' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="truncate text-sm font-medium">{{ user?.username || '用户' }}</p>
              <p class="truncate text-xs text-muted-foreground">{{ currentGroup?.name || '未加入家庭' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 遮罩层 - 仅移动端 -->
    <div
      v-if="isDrawerOpen"
      class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
      @click="closeDrawer"
    />

    <!-- 主内容区 -->
    <div class="min-h-screen lg:pl-72">
      <!-- 顶部栏 -->
      <header class="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div class="flex h-16 items-center gap-4 px-6">
          <!-- 移动端菜单按钮（侧边栏隐藏时显示） -->
          <button
            v-show="!isDrawerOpen"
            class="lg:hidden"
            @click="toggleDrawer"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- 页面标题 -->
          <div class="flex-1">
            <h1 class="text-lg font-medium">{{ pageTitle }}</h1>
          </div>

          <!-- 右侧操作 -->
          <div class="flex items-center gap-3">
            <!-- 主题切换 -->
            <button 
              @click="toggleTheme"
              class="p-2 rounded-lg hover:bg-muted transition-colors"
              :title="isDark ? '切换亮色模式' : '切换暗色模式'"
            >
              <svg v-if="isDark" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
            <NuxtLink to="/dashboard" class="text-sm text-muted-foreground hover:text-foreground">
              首页
            </NuxtLink>
          </div>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const route = useRoute()

// 用户和群组状态
const user = ref<any>(null)
const currentGroup = ref<any>(null)

// 抽屉状态
const isDrawerOpen = ref(false)
const drawerRef = ref<HTMLElement | null>(null)

// 主题状态
const isDark = ref(false)

const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value
}

const closeDrawer = () => {
  isDrawerOpen.value = false
}

// 主题切换
const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

// 导航项
const navItems = [
  { path: '/dashboard', label: '仪表盘', icon: '🏠' },
  { path: '/records/menstrual', label: '经期记录', icon: '🩸' },
  { path: '/records/stool', label: '便便记录', icon: '💩' },
  { path: '/wedding/admin', label: '婚礼筹备', icon: '💒' },
  { path: '/migrate', label: '数据迁移', icon: '🔄' },
  { path: '/profile', label: '个人中心', icon: '👤' },
]

// 判断当前路径是否激活
const isActive = (path: string) => {
  if (path === '/dashboard') {
    return route.path === '/dashboard' 
      ? 'bg-primary/20 text-primary'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }
  return route.path.startsWith(path)
    ? 'bg-primary/20 text-primary'
    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
}

// 根据路由获取页面标题
const pageTitle = computed(() => {
  const path = route.path
  if (path === '/dashboard') return '仪表盘'
  if (path.startsWith('/records/menstrual')) return '经期记录'
  if (path.startsWith('/records/stool')) return '便便记录'
  if (path.startsWith('/profile')) return '个人中心'
  return 'Nestory'
})

// 加载数据
onMounted(async () => {
  // 恢复主题设置
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  }

  try {
    // 获取用户信息
    const profileRes = await fetch('/api/auth/profile')
    if (profileRes.ok) {
      user.value = await profileRes.json()
    }

    // 获取用户群组
    const groupsRes = await fetch('/api/groups')
    if (groupsRes.ok) {
      const groups = await groupsRes.json()
      if (groups.length > 0) {
        currentGroup.value = groups[0]
      }
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
})
</script>
