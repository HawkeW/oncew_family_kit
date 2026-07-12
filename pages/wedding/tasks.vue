<template>
  <div class="text-zinc-100">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-lg font-medium">婚礼管理</h1>
      <p class="text-sm text-zinc-500">任务清单</p>
    </div>

    <main class="max-w-4xl space-y-6">
      <!-- 顶部 Tab 导航 -->
      <div class="flex gap-2 border-b border-zinc-800 pb-4">
        <NuxtLink
          to="/wedding/admin"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
          :class="route.path === '/wedding/admin' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'"
        >
          宾客名单 (RSVP)
        </NuxtLink>
        <NuxtLink
          to="/wedding/finance"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
          :class="route.path === '/wedding/finance' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'"
        >
          财务管理
        </NuxtLink>
        <NuxtLink
          to="/wedding/tasks"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
          :class="route.path === '/wedding/tasks' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'"
        >
          任务清单
        </NuxtLink>
        <NuxtLink
          to="/wedding/timeline"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
          :class="route.path === '/wedding/timeline' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'"
        >
          流程时间轴
        </NuxtLink>
      </div>

      <!-- 操作栏 -->
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-medium">任务列表</h2>
        <button
          @click="openDialog()"
          class="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-all hover:bg-rose-400 active:scale-95"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          添加任务
        </button>
      </div>

      <!-- 筛选 -->
      <div class="flex gap-2">
        <button
          v-for="cat in ['all', 'preparation', 'wedding_day']"
          :key="cat"
          @click="currentCategory = cat"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          :class="currentCategory === cat ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'"
        >
          {{ cat === 'all' ? '全部任务' : (cat === 'preparation' ? '筹备期' : '婚礼当天') }}
        </button>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredList.length === 0" class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
        <div class="mx-auto h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
          <span class="text-3xl">📋</span>
        </div>
        <h3 class="text-lg font-medium text-zinc-300">还没有任务</h3>
        <p class="mt-2 text-sm text-zinc-500">点击右上角「添加任务」开始记录</p>
      </div>

      <!-- 任务列表 -->
      <div v-else class="space-y-3">
        <div
          v-for="task in filteredList"
          :key="task.id"
          class="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4 transition-all"
          :class="{ 'opacity-50': task.status === 'completed' }"
        >
          <div class="flex items-start gap-3">
            <button
              @click="toggleStatus(task)"
              class="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
              :class="task.status === 'completed' ? 'bg-rose-500 border-rose-500' : 'border-zinc-600 hover:border-rose-500'"
            >
              <svg v-if="task.status === 'completed'" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-medium" :class="task.status === 'completed' ? 'text-zinc-500 line-through' : 'text-zinc-200'">
                  {{ task.title }}
                </p>
                <span class="text-xs px-2 py-0.5 rounded-full" :class="task.category === 'preparation' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'">
                  {{ task.category === 'preparation' ? '筹备期' : '婚礼当天' }}
                </span>
              </div>
              <p v-if="task.description" class="text-sm text-zinc-500 mt-1">{{ task.description }}</p>
              <p v-if="task.due_date" class="text-xs text-zinc-600 mt-2">截止: {{ formatDate(task.due_date) }}</p>
            </div>
            <div class="flex items-center gap-1">
              <button @click="openDialog(task)" class="p-2 text-zinc-400 hover:text-zinc-200 transition-colors">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button @click="deleteTask(task.id)" class="p-2 text-zinc-400 hover:text-red-400 transition-colors">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 添加/编辑弹窗 -->
    <Transition name="modal">
      <div v-if="showDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="closeDialog"></div>
        <div class="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
          <h2 class="text-lg font-medium mb-4">{{ editingId ? '编辑任务' : '添加任务' }}</h2>
          <form @submit.prevent="saveTask" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">任务标题 *</label>
              <input
                v-model="form.title"
                type="text"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="输入任务标题"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">描述</label>
              <textarea
                v-model="form.description"
                rows="2"
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="输入任务描述"
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-zinc-300 mb-2">分类</label>
                <select
                  v-model="form.category"
                  class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="preparation">筹备期</option>
                  <option value="wedding_day">婚礼当天</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-zinc-300 mb-2">截止日期</label>
                <input
                  v-model="form.due_date"
                  type="date"
                  class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click="closeDialog"
                class="flex-1 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                class="flex-1 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-rose-400 transition-colors"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: '任务清单 - 婚礼管理 - Nestory'
})

const route = useRoute()

interface Task {
  id?: number
  title: string
  description?: string
  due_date?: string
  status: 'pending' | 'completed'
  category: 'preparation' | 'wedding_day'
  created_at?: string
}

const list = ref<Task[]>([])
const currentCategory = ref('all')
const showDialog = ref(false)
const editingId = ref<number | null>(null)
const form = ref<Partial<Task>>({
  title: '',
  description: '',
  due_date: '',
  category: 'preparation',
  status: 'pending'
})

const filteredList = computed(() => {
  if (currentCategory.value === 'all') return list.value
  return list.value.filter(task => task.category === currentCategory.value)
})

async function fetchTasks() {
  try {
    const res = await $fetch('/api/wedding/tasks')
    list.value = res.list || []
  } catch (error) {
    console.error('获取任务列表失败:', error)
  }
}

function openDialog(task?: Task) {
  if (task) {
    editingId.value = task.id!
    form.value = { ...task }
  } else {
    editingId.value = null
    form.value = {
      title: '',
      description: '',
      due_date: '',
      category: 'preparation',
      status: 'pending'
    }
  }
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingId.value = null
}

async function saveTask() {
  try {
    if (editingId.value) {
      await $fetch(`/api/wedding/tasks/${editingId.value}`, {
        method: 'PUT',
        body: form.value
      })
    } else {
      await $fetch('/api/wedding/tasks', {
        method: 'POST',
        body: form.value
      })
    }
    closeDialog()
    await fetchTasks()
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败')
  }
}

async function toggleStatus(task: Task) {
  const newStatus = task.status === 'completed' ? 'pending' : 'completed'
  try {
    await $fetch(`/api/wedding/tasks/${task.id}`, {
      method: 'PUT',
      body: { ...task, status: newStatus }
    })
    await fetchTasks()
  } catch (error) {
    console.error('更新状态失败:', error)
  }
}

async function deleteTask(id: number) {
  if (!confirm('确定要删除这个任务吗？')) return
  try {
    await $fetch(`/api/wedding/tasks/${id}`, { method: 'DELETE' })
    await fetchTasks()
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败')
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchTasks()
})
</script>

<style scoped>
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
