<template>
  <div class="text-zinc-100">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-lg font-medium">婚礼管理</h1>
      <p class="text-sm text-zinc-500">流程时间轴</p>
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
        <h2 class="text-lg font-medium">婚礼当天流程</h2>
        <button
          @click="openDialog()"
          class="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-all hover:bg-rose-400 active:scale-95"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          添加环节
        </button>
      </div>

      <!-- 空状态 -->
      <div v-if="list.length === 0" class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
        <div class="mx-auto h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
          <span class="text-3xl">📅</span>
        </div>
        <h3 class="text-lg font-medium text-zinc-300">还没有流程安排</h3>
        <p class="mt-2 text-sm text-zinc-500">点击右上角「添加环节」开始规划婚礼当天流程</p>
      </div>

      <!-- 时间轴 -->
      <div v-else class="relative">
        <!-- 时间线 -->
        <div class="absolute left-[21px] top-4 bottom-4 w-0.5 bg-rose-500/30 rounded"></div>

        <!-- 时间轴列表 -->
        <div class="space-y-6 pl-12">
          <div
            v-for="item in list"
            :key="item.id"
            class="relative"
          >
            <!-- 时间点 -->
            <div class="absolute -left-[29px] top-4 w-4 h-4 rounded-full bg-rose-500 border-4 border-zinc-950"></div>

            <!-- 内容卡片 -->
            <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4 hover:border-rose-500/50 transition-colors">
              <div class="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div class="flex items-center gap-3 mb-1">
                    <span class="text-lg font-bold text-rose-400 font-mono">
                      {{ item.start_time }}
                      <span v-if="item.end_time" class="text-zinc-500 font-normal text-sm"> - {{ item.end_time }}</span>
                    </span>
                  </div>
                  <h3 class="font-semibold text-zinc-200">{{ item.title }}</h3>
                </div>
                <div class="flex items-center gap-1">
                  <button @click="openDialog(item)" class="p-2 text-zinc-400 hover:text-zinc-200 transition-colors">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button @click="deleteTimeline(item.id)" class="p-2 text-zinc-400 hover:text-red-400 transition-colors">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <p v-if="item.description" class="text-sm text-zinc-400 mb-3">{{ item.description }}</p>

              <div class="flex flex-wrap gap-4 text-sm text-zinc-500">
                <div v-if="item.location" class="flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{{ item.location }}</span>
                </div>
                <div v-if="item.owner" class="flex items-center gap-1.5">
                  <span>👤</span>
                  <span>负责人: {{ item.owner }}</span>
                </div>
              </div>
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
          <h2 class="text-lg font-medium mb-4">{{ editingId ? '编辑环节' : '添加环节' }}</h2>
          <form @submit.prevent="saveTimeline" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-zinc-300 mb-2">开始时间 *</label>
                <input
                  v-model="form.start_time"
                  type="time"
                  required
                  class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-zinc-300 mb-2">结束时间</label>
                <input
                  v-model="form.end_time"
                  type="time"
                  class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">环节标题 *</label>
              <input
                v-model="form.title"
                type="text"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="输入环节标题"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">描述</label>
              <textarea
                v-model="form.description"
                rows="2"
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="输入环节描述"
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-zinc-300 mb-2">地点</label>
                <input
                  v-model="form.location"
                  type="text"
                  class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="输入地点"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-zinc-300 mb-2">负责人</label>
                <input
                  v-model="form.owner"
                  type="text"
                  class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="输入负责人"
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: '流程时间轴 - 婚礼管理 - Nestory'
})

const route = useRoute()

interface Timeline {
  id?: number
  start_time: string
  end_time?: string
  title: string
  description?: string
  location?: string
  owner?: string
  created_at?: string
}

const list = ref<Timeline[]>([])
const showDialog = ref(false)
const editingId = ref<number | null>(null)
const form = ref<Partial<Timeline>>({
  start_time: '',
  end_time: '',
  title: '',
  description: '',
  location: '',
  owner: ''
})

async function fetchTimeline() {
  try {
    const res = await $fetch('/api/wedding/timeline')
    list.value = res.list || []
  } catch (error) {
    console.error('获取时间轴失败:', error)
  }
}

function openDialog(item?: Timeline) {
  if (item) {
    editingId.value = item.id!
    form.value = { ...item }
  } else {
    editingId.value = null
    form.value = {
      start_time: '',
      end_time: '',
      title: '',
      description: '',
      location: '',
      owner: ''
    }
  }
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingId.value = null
}

async function saveTimeline() {
  try {
    if (editingId.value) {
      await $fetch(`/api/wedding/timeline/${editingId.value}`, {
        method: 'PUT',
        body: form.value
      })
    } else {
      await $fetch('/api/wedding/timeline', {
        method: 'POST',
        body: form.value
      })
    }
    closeDialog()
    await fetchTimeline()
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败')
  }
}

async function deleteTimeline(id: number) {
  if (!confirm('确定要删除这个环节吗？')) return
  try {
    await $fetch(`/api/wedding/timeline/${id}`, { method: 'DELETE' })
    await fetchTimeline()
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败')
  }
}

onMounted(() => {
  fetchTimeline()
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
