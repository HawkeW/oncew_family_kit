<template>
  <div class="text-zinc-100">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-lg font-medium">数据迁移中心</h1>
      <p class="text-sm text-zinc-500">管理和导出您的婚礼数据</p>
    </div>

    <main class="max-w-4xl space-y-6">
      <!-- 婚礼数据概览 -->
      <section class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium">💒 婚礼数据</h2>
          <Button @click="exportWeddingData" size="sm" class="bg-cyan-500 hover:bg-cyan-400 text-zinc-950">
            导出全部数据
          </Button>
        </div>

        <!-- 数据统计卡片 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="rounded-lg bg-zinc-800/50 p-4 text-center">
            <p class="text-2xl font-semibold text-cyan-400">{{ stats.rsvpCount }}</p>
            <p class="text-xs text-zinc-500 mt-1">宾客名单</p>
          </div>
          <div class="rounded-lg bg-zinc-800/50 p-4 text-center">
            <p class="text-2xl font-semibold text-amber-400">{{ stats.financeCount }}</p>
            <p class="text-xs text-zinc-500 mt-1">财务记录</p>
          </div>
          <div class="rounded-lg bg-zinc-800/50 p-4 text-center">
            <p class="text-2xl font-semibold text-rose-400">{{ stats.taskCount }}</p>
            <p class="text-xs text-zinc-500 mt-1">任务清单</p>
          </div>
          <div class="rounded-lg bg-zinc-800/50 p-4 text-center">
            <p class="text-2xl font-semibold text-purple-400">{{ stats.timelineCount }}</p>
            <p class="text-xs text-zinc-500 mt-1">时间轴</p>
          </div>
        </div>

        <!-- 导出选项 -->
        <div class="border-t border-zinc-800 pt-4">
          <h3 class="text-sm font-medium mb-3">按类型导出</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button @click="exportData('rsvp')" variant="secondary" size="sm">
              导出宾客名单
            </Button>
            <Button @click="exportData('finance')" variant="secondary" size="sm">
              导出财务
            </Button>
            <Button @click="exportData('tasks')" variant="secondary" size="sm">
              导出任务
            </Button>
            <Button @click="exportData('timeline')" variant="secondary" size="sm">
              导出时间轴
            </Button>
          </div>
        </div>
      </section>

      <!-- 健康数据概览 -->
      <section class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium">🩺 健康数据</h2>
          <Button @click="exportHealthData" size="sm" class="bg-cyan-500 hover:bg-cyan-400 text-zinc-950">
            导出全部数据
          </Button>
        </div>

        <!-- 数据统计卡片 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="rounded-lg bg-zinc-800/50 p-4 text-center">
            <p class="text-2xl font-semibold text-pink-400">{{ stats.menstrualCount }}</p>
            <p class="text-xs text-zinc-500 mt-1">经期记录</p>
          </div>
          <div class="rounded-lg bg-zinc-800/50 p-4 text-center">
            <p class="text-2xl font-semibold text-amber-400">{{ stats.stoolCount }}</p>
            <p class="text-xs text-zinc-500 mt-1">便便记录</p>
          </div>
        </div>

        <!-- 导出选项 -->
        <div class="border-t border-zinc-800 pt-4 mt-4">
          <h3 class="text-sm font-medium mb-3">按类型导出</h3>
          <div class="grid grid-cols-2 gap-3">
            <Button @click="exportData('menstrual')" variant="secondary" size="sm">
              导出经期记录
            </Button>
            <Button @click="exportData('stool')" variant="secondary" size="sm">
              导出便便记录
            </Button>
          </div>
        </div>
      </section>

      <!-- 导入功能 -->
      <section class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 class="text-lg font-medium mb-4">📥 导入数据</h2>
        <p class="text-sm text-zinc-500 mb-4">
          从之前导出的 JSON 文件导入数据
        </p>
        <div class="flex items-center gap-4">
          <input
            type="file"
            accept=".json"
            @change="handleFileImport"
            class="hidden"
            ref="fileInput"
          />
          <Button @click="$refs.fileInput.click()" variant="secondary" size="sm">
            选择 JSON 文件
          </Button>
          <span v-if="importFileName" class="text-sm text-zinc-400">{{ importFileName }}</span>
        </div>
        <p v-if="importMessage" class="mt-3 text-sm" :class="importSuccess ? 'text-green-400' : 'text-red-400'">
          {{ importMessage }}
        </p>
      </section>

      <!-- 快速导航 -->
      <section class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 class="text-lg font-medium mb-4">🔗 快速导航</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NuxtLink to="/wedding/admin" class="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-4 py-3 text-sm hover:bg-zinc-800 transition-colors">
            <span>👥</span> 宾客管理
          </NuxtLink>
          <NuxtLink to="/wedding/finance" class="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-4 py-3 text-sm hover:bg-zinc-800 transition-colors">
            <span>💰</span> 财务管理
          </NuxtLink>
          <NuxtLink to="/wedding/tasks" class="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-4 py-3 text-sm hover:bg-zinc-800 transition-colors">
            <span>📋</span> 任务清单
          </NuxtLink>
          <NuxtLink to="/wedding/timeline" class="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-4 py-3 text-sm hover:bg-zinc-800 transition-colors">
            <span>📅</span> 时间轴
          </NuxtLink>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const stats = ref({
  rsvpCount: 0,
  financeCount: 0,
  taskCount: 0,
  timelineCount: 0,
  menstrualCount: 0,
  stoolCount: 0
})

const fileInput = ref<HTMLInputElement | null>(null)
const importFileName = ref('')
const importMessage = ref('')
const importSuccess = ref(false)

// 加载数据统计
async function loadStats() {
  try {
    // 获取婚礼数据统计
    const [rsvpRes, financeRes, taskRes, timelineRes, menstrualRes, stoolRes] = await Promise.all([
      fetch('/api/wedding/rsvp').catch(() => ({ ok: false, json: async () => ({ list: [] }) })),
      fetch('/api/wedding/finance').catch(() => ({ ok: false, json: async () => [] })),
      fetch('/api/wedding/tasks').catch(() => ({ ok: false, json: async () => [] })),
      fetch('/api/wedding/timeline').catch(() => ({ ok: false, json: async () => [] })),
      fetch('/api/menstrual-records').catch(() => ({ ok: false, json: async () => [] })),
      fetch('/api/stool-records').catch(() => ({ ok: false, json: async () => [] }))
    ])

    if (rsvpRes.ok) {
      const data = await rsvpRes.json()
      stats.value.rsvpCount = data.list?.length || 0
    }
    if (financeRes.ok) {
      const data = await financeRes.json()
      stats.value.financeCount = Array.isArray(data) ? data.length : 0
    }
    if (taskRes.ok) {
      const data = await taskRes.json()
      stats.value.taskCount = Array.isArray(data) ? data.length : 0
    }
    if (timelineRes.ok) {
      const data = await timelineRes.json()
      stats.value.timelineCount = Array.isArray(data) ? data.length : 0
    }
    if (menstrualRes.ok) {
      const data = await menstrualRes.json()
      stats.value.menstrualCount = Array.isArray(data) ? data.length : 0
    }
    if (stoolRes.ok) {
      const data = await stoolRes.json()
      stats.value.stoolCount = Array.isArray(data) ? data.length : 0
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 导出单个类型数据
async function exportData(type: string) {
  try {
    let data: any[] = []
    let filename = ''

    switch (type) {
      case 'rsvp': {
        const rsvpRes = await fetch('/api/wedding/rsvp')
        if (rsvpRes.ok) {
          const res = await rsvpRes.json()
          data = res.list || []
        }
        filename = `wedding_rsvp_${formatDateForFile(new Date())}.json`
        break
      }
      case 'finance': {
        const financeRes = await fetch('/api/wedding/finance')
        if (financeRes.ok) data = await financeRes.json()
        filename = `wedding_finance_${formatDateForFile(new Date())}.json`
        break
      }
      case 'tasks': {
        const taskRes = await fetch('/api/wedding/tasks')
        if (taskRes.ok) data = await taskRes.json()
        filename = `wedding_tasks_${formatDateForFile(new Date())}.json`
        break
      }
      case 'timeline': {
        const timelineRes = await fetch('/api/wedding/timeline')
        if (timelineRes.ok) data = await timelineRes.json()
        filename = `wedding_timeline_${formatDateForFile(new Date())}.json`
        break
      }
      case 'menstrual': {
        const menstrualRes = await fetch('/api/menstrual-records')
        if (menstrualRes.ok) data = await menstrualRes.json()
        filename = `menstrual_${formatDateForFile(new Date())}.json`
        break
      }
      case 'stool': {
        const stoolRes = await fetch('/api/stool-records')
        if (stoolRes.ok) data = await stoolRes.json()
        filename = `stool_${formatDateForFile(new Date())}.json`
        break
      }
    }

    if (data.length > 0) {
      downloadJSON(data, filename)
    } else {
      alert('暂无数据可导出')
    }
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败')
  }
}

// 导出全部婚礼数据
async function exportWeddingData() {
  try {
    const [rsvpRes, financeRes, taskRes, timelineRes] = await Promise.all([
      fetch('/api/wedding/rsvp').catch(() => ({ ok: false, json: async () => ({ list: [] }) })),
      fetch('/api/wedding/finance').catch(() => ({ ok: false, json: async () => [] })),
      fetch('/api/wedding/tasks').catch(() => ({ ok: false, json: async () => [] })),
      fetch('/api/wedding/timeline').catch(() => ({ ok: false, json: async () => [] }))
    ])

    let rsvpData: any[] = []
    if (rsvpRes.ok) {
      const res = await rsvpRes.json()
      rsvpData = res.list || []
    }

    const data = {
      exportTime: new Date().toISOString(),
      version: '1.0',
      wedding: {
        rsvps: rsvpData,
        finances: financeRes.ok ? await financeRes.json() : [],
        tasks: taskRes.ok ? await taskRes.json() : [],
        timeline: timelineRes.ok ? await timelineRes.json() : []
      }
    }

    downloadJSON(data, `wedding_all_${formatDateForFile(new Date())}.json`)
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败')
  }
}

// 导出全部健康数据
async function exportHealthData() {
  try {
    const [menstrualRes, stoolRes] = await Promise.all([
      fetch('/api/menstrual-records').catch(() => ({ ok: false, json: async () => [] })),
      fetch('/api/stool-records').catch(() => ({ ok: false, json: async () => [] }))
    ])

    const data = {
      exportTime: new Date().toISOString(),
      version: '1.0',
      health: {
        menstrual: menstrualRes.ok ? await menstrualRes.json() : [],
        stool: stoolRes.ok ? await stoolRes.json() : []
      }
    }

    downloadJSON(data, `health_all_${formatDateForFile(new Date())}.json`)
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败')
  }
}

// 下载 JSON 文件
function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 格式化日期用于文件名
function formatDateForFile(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// 处理文件导入
async function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  importFileName.value = file.name

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    // 验证数据格式
    if (!data.exportTime || !data.version) {
      throw new Error('无效的导入文件格式')
    }

    // TODO: 根据数据类型导入
    importMessage.value = `文件 "${file.name}" 格式正确，但导入功能暂未实现`
    importSuccess.value = false
  } catch (error: any) {
    importMessage.value = `导入失败: ${error.message}`
    importSuccess.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>
