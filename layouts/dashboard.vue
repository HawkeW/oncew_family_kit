<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100">
    <!-- 侧边抽屉 -->
    <div
      ref="drawerRef"
      class="fixed inset-y-0 left-0 z-50 w-72 transform border-r border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl transition-transform duration-300"
      :class="isDrawerOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-full flex-col">
        <!-- Logo 区域 -->
        <div class="border-b border-zinc-800/60 px-6 py-5">
          <NuxtLink to="/dashboard" class="text-lg font-semibold text-zinc-100">Nestory</NuxtLink>
          <p class="mt-0.5 text-xs text-zinc-500">家庭健康记录</p>
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
        <div class="border-t border-zinc-800/60 p-4">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
              {{ user?.username?.charAt(0) || '用户' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="truncate text-sm font-medium text-zinc-200">{{ user?.username || '用户' }}</p>
              <p class="truncate text-xs text-zinc-500">{{ currentGroup?.name || '未加入群组' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div
      v-if="isDrawerOpen"
      class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      @click="closeDrawer"
    />

    <!-- 主内容区 -->
    <div class="min-h-screen" :class="isDrawerOpen ? 'lg:pl-72' : ''">
      <!-- 顶部栏 -->
      <header class="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div class="flex h-16 items-center gap-4 px-6">
          <!-- 移动端菜单按钮 -->
          <button
            class="lg:hidden"
            @click="toggleDrawer"
          >
            <svg class="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- 页面标题 -->
          <div class="flex-1">
            <h1 class="text-lg font-medium text-zinc-100">{{ pageTitle }}</h1>
          </div>

          <!-- 右侧操作 -->
          <div class="flex items-center gap-3">
            <NuxtLink to="/dashboard" class="text-sm text-zinc-400 hover:text-zinc-200">
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

const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value
}

const closeDrawer = () => {
  isDrawerOpen.value = false
}

// 导航项
const navItems = [
  { path: '/dashboard', label: '仪表盘', icon: '🏠' },
  { path: '/records/menstrual', label: '经期记录', icon: '🩸' },
  { path: '/records/stool', label: '便便记录', icon: '💩' },
  { path: '/wedding/admin', label: '婚礼筹备', icon: '💒' },
  { path: '/profile', label: '个人中心', icon: '👤' },
]

// 判断当前路径是否激活
const isActive = (path: string) => {
  if (path === '/dashboard') {
    return route.path === '/dashboard' 
      ? 'bg-cyan-500/20 text-cyan-400'
      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
  }
  return route.path.startsWith(path)
    ? 'bg-cyan-500/20 text-cyan-400'
    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
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
