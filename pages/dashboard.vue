<template>
  <div class="text-zinc-100">
    <!-- 页面标题区 -->
    <div class="mb-6">
      <h1 class="text-lg font-medium">仪表盘</h1>
      <p class="text-sm text-zinc-500">{{ greeting }}，{{ user?.username || '用户' }}</p>
    </div>

    <main class="max-w-6xl">
      <!-- 群组信息卡片 -->
      <div v-if="currentGroup" class="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-500 uppercase tracking-wider">当前群组</p>
            <p class="mt-1 text-lg font-medium">{{ currentGroup.name }}</p>
          </div>
          <NuxtLink
            to="/groups"
            class="text-sm text-cyan-400 hover:text-cyan-300"
          >
            切换群组
          </NuxtLink>
        </div>
      </div>

      <!-- 最近记录 -->
      <section>
        <h2 class="mb-4 text-lg font-medium">最近记录</h2>

        <!-- 空状态 -->
        <div v-if="recentRecords.length === 0" class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <div class="mx-auto h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
            <svg class="h-8 w-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-zinc-300">还没有记录</h3>
          <p class="mt-2 text-sm text-zinc-500">点击右上角「添加」开始记录你的第一条数据</p>
        </div>

        <!-- 记录列表 -->
        <div v-else class="space-y-2">
          <div
            v-for="record in recentRecords"
            :key="record.id"
            class="flex items-center gap-4 rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-4 transition-all hover:border-zinc-700/60 hover:bg-zinc-900/60"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg"
              :style="{ backgroundColor: record.iconBg }"
            >
              <span class="text-lg">{{ record.icon }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">{{ record.title }}</p>
              <p class="text-sm text-zinc-500 truncate">{{ record.subtitle }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-zinc-400">{{ record.date }}</p>
              <p class="text-xs text-zinc-500">{{ record.time }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 分区快捷入口 -->
      <section class="pt-8">
        <h2 class="mb-4 text-lg font-medium">分区</h2>
        <div class="grid gap-3 md:grid-cols-3">
          <NuxtLink
            to="/records/menstrual"
            class="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-all hover:border-cyan-500/40 hover:bg-zinc-900/50"
          >
            <span class="text-2xl">🩸</span>
            <div>
              <p class="font-medium">经期记录</p>
              <p class="text-xs text-zinc-500">健康追踪</p>
            </div>
          </NuxtLink>

          <NuxtLink
            to="/records/stool"
            class="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-all hover:border-amber-500/40 hover:bg-zinc-900/50"
          >
            <span class="text-2xl">💩</span>
            <div>
              <p class="font-medium">便便记录</p>
              <p class="text-xs text-zinc-500">肠道健康</p>
            </div>
          </NuxtLink>

          <NuxtLink
            to="/wedding"
            class="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-all hover:border-rose-500/40 hover:bg-zinc-900/50"
          >
            <span class="text-2xl">💒</span>
            <div>
              <p class="font-medium">婚礼筹备</p>
              <p class="text-xs text-zinc-500">人生大事</p>
            </div>
          </NuxtLink>
        </div>
      </section>
    </main>

    <!-- 快速添加弹窗 -->
    <Transition name="modal">
      <div v-if="showQuickAdd" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="showQuickAdd = false"></div>
        <div class="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
          <h2 class="text-lg font-medium mb-4">添加记录</h2>
          <div class="space-y-3">
            <button
              @click="addRecord('menstrual')"
              class="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 text-left transition-all hover:border-cyan-500/50 hover:bg-zinc-800/50"
            >
              <span class="text-2xl">🩸</span>
              <div>
                <p class="font-medium">经期记录</p>
                <p class="text-xs text-zinc-500">记录经期时间、流量和身体状态</p>
              </div>
            </button>
            <button
              @click="addRecord('stool')"
              class="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 text-left transition-all hover:border-amber-500/50 hover:bg-zinc-800/50"
            >
              <span class="text-2xl">💩</span>
              <div>
                <p class="font-medium">便便记录</p>
                <p class="text-xs text-zinc-500">记录排便频率、性状和体感</p>
              </div>
            </button>
            <button
              @click="goToWedding()"
              class="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 text-left transition-all hover:border-rose-500/50 hover:bg-zinc-800/50"
            >
              <span class="text-2xl">💒</span>
              <div>
                <p class="font-medium">婚礼记录</p>
                <p class="text-xs text-zinc-500">宾客、任务、财务等</p>
              </div>
            </button>
          </div>
          <button
            @click="showQuickAdd = false"
            class="mt-4 w-full rounded-lg border border-zinc-800 py-2 text-sm text-zinc-400 hover:bg-zinc-800/30"
          >
            取消
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 状态
const showQuickAdd = ref(false)
const user = ref<any>(null)
const currentGroup = ref<any>(null)
const recentRecords = ref<any[]>([])

// 计算问候语
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
})

// 加载数据
const loadData = async () => {
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

    // 获取最近记录（从多个 API 获取并合并）
    const allRecentRecords: any[] = []

    // 获取经期记录
    try {
      const menstrualRes = await fetch('/api/menstrual-records')
      if (menstrualRes.ok) {
        const data = await menstrualRes.json()
        if (Array.isArray(data)) {
          data.slice(0, 5).forEach((r: any) => {
            allRecentRecords.push({
              id: r.id,
              title: '经期记录',
              subtitle: getFlowLevelText(r.flow_level),
              date: r.record_time ? r.record_time.split('T')[0] : '',
              time: r.record_time ? r.record_time.split('T')[1]?.slice(0, 5) : '',
              icon: '🩸',
              iconBg: 'rgba(251, 113, 133, 0.2)'
            })
          })
        }
      }
    } catch (e) { console.error('获取经期记录失败', e) }

    // 获取便便记录
    try {
      const stoolRes = await fetch('/api/stool-records')
      if (stoolRes.ok) {
        const data = await stoolRes.json()
        if (Array.isArray(data)) {
          data.slice(0, 5).forEach((r: any) => {
            allRecentRecords.push({
              id: r.id,
              title: '便便记录',
              subtitle: getConsistencyText(r.consistency),
              date: r.record_time ? r.record_time.split('T')[0] : '',
              time: r.record_time ? r.record_time.split('T')[1]?.slice(0, 5) : '',
              icon: '💩',
              iconBg: 'rgba(251, 191, 36, 0.2)'
            })
          })
        }
      }
    } catch (e) { console.error('获取便便记录失败', e) }

    // 按日期排序并取前5条
    allRecentRecords.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.time)
      const dateB = new Date(b.date + ' ' + b.time)
      return dateB.getTime() - dateA.getTime()
    })
    recentRecords.value = allRecentRecords.slice(0, 5)
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

// 获取经期量文本
function getFlowLevelText(level: string) {
  const map: Record<string, string> = {
    light: '轻',
    medium: '中等',
    heavy: '重'
  }
  return map[level] || level
}

// 获取便便性状文本
function getConsistencyText(consistency: string) {
  const map: Record<string, string> = {
    hard: '硬',
    normal: '正常',
    soft: '软',
    watery: '水样'
  }
  return map[consistency] || consistency
}

// 获取记录图标
const getRecordIcon = (typeName: string) => {
  if (!typeName) return '📝'
  const name = typeName.toLowerCase()
  if (name.includes('经期') || name.includes('menstrual')) return '🩸'
  if (name.includes('便') || name.includes('stool')) return '💩'
  if (name.includes('婚礼') || name.includes('wedding')) return '💒'
  if (name.includes('任务') || name.includes('task')) return '✅'
  if (name.includes('宾客') || name.includes('rsvp')) return '👥'
  if (name.includes('财务') || name.includes('finance')) return '💰'
  return '📝'
}

// 获取图标背景色
const getRecordIconBg = (typeName: string) => {
  if (!typeName) return 'rgba(161, 161, 170, 0.2)'
  const name = typeName.toLowerCase()
  if (name.includes('经期') || name.includes('menstrual')) return 'rgba(251, 113, 133, 0.2)'
  if (name.includes('便') || name.includes('stool')) return 'rgba(251, 191, 36, 0.2)'
  if (name.includes('婚礼') || name.includes('wedding')) return 'rgba(251, 113, 133, 0.2)'
  return 'rgba(161, 161, 170, 0.2)'
}

// 添加记录
const addRecord = (type: string) => {
  showQuickAdd.value = false
  if (type === 'menstrual') {
    router.push('/records/menstrual?add=true')
  } else if (type === 'stool') {
    router.push('/records/stool?add=true')
  }
}

// 跳转婚礼
const goToWedding = () => {
  showQuickAdd.value = false
  router.push('/wedding')
}

onMounted(() => {
  loadData()
})

definePageMeta({
  layout: 'dashboard',
  middleware: ['require-group']
})

useHead({
  title: '仪表盘 - Nestory'
})
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-active .absolute.right-0,
.drawer-leave-active .absolute.right-0 {
  transition: transform 0.3s ease;
}

.drawer-enter-from .absolute.right-0,
.drawer-leave-to .absolute.right-0 {
  transform: translateX(100%);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
</style>
