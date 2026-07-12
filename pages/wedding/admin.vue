<template>
  <div class="text-zinc-100">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-lg font-medium">婚礼管理</h1>
      <p class="text-sm text-zinc-500">宾客名单 (RSVP)</p>
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
        <div class="flex items-center gap-3">
          <div class="px-4 py-2 rounded-lg bg-rose-500/20 text-rose-400 text-sm font-medium">
            总人数: {{ total }}
          </div>
        </div>
        <button
          @click="openDialog()"
          class="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-all hover:bg-rose-400 active:scale-95"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          添加宾客
        </button>
      </div>

      <!-- 空状态 -->
      <div v-if="list.length === 0" class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
        <div class="mx-auto h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
          <span class="text-3xl">👥</span>
        </div>
        <h3 class="text-lg font-medium text-zinc-300">还没有宾客名单</h3>
        <p class="mt-2 text-sm text-zinc-500">点击右上角「添加宾客」开始记录</p>
      </div>

      <!-- 宾客列表 -->
      <div v-else class="rounded-xl border border-zinc-800/60 bg-zinc-900/30 divide-y divide-zinc-800/50">
        <div
          v-for="rsvp in list"
          :key="rsvp.id"
          class="flex items-center gap-4 p-4 hover:bg-zinc-800/30 transition-colors"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20">
            <span class="text-xl">👤</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-medium text-zinc-200">{{ rsvp.name }}</p>
              <span class="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">{{ rsvp.count }}人</span>
            </div>
            <p class="text-sm text-zinc-500 mt-0.5">
              {{ rsvp.phone || '无电话' }} · {{ rsvp.remark || '无备注' }}
            </p>
          </div>
          <div class="flex items-center gap-1">
            <button @click="openDialog(rsvp)" class="p-2 text-zinc-400 hover:text-zinc-200 transition-colors">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button @click="deleteRsvp(rsvp.id)" class="p-2 text-zinc-400 hover:text-red-400 transition-colors">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- 添加/编辑弹窗 -->
    <Transition name="modal">
      <div v-if="showDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="closeDialog"></div>
        <div class="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
          <h2 class="text-lg font-medium mb-4">{{ editingId ? '编辑宾客' : '添加宾客' }}</h2>
          <form @submit.prevent="saveRsvp" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">姓名 *</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="输入姓名"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">手机号</label>
              <input
                v-model="form.phone"
                type="tel"
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="输入手机号"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">出席人数 *</label>
              <input
                v-model.number="form.count"
                type="number"
                min="1"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">备注</label>
              <textarea
                v-model="form.remark"
                rows="3"
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="输入备注信息"
              ></textarea>
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
  title: '宾客名单 - 婚礼管理 - Nestory'
})

const route = useRoute()

interface Rsvp {
  id?: number
  name: string
  phone?: string
  count: number
  remark?: string
  created_at?: string
}

const list = ref<Rsvp[]>([])
const total = ref(0)
const showDialog = ref(false)
const editingId = ref<number | null>(null)
const form = ref<Rsvp>({
  name: '',
  phone: '',
  count: 1,
  remark: ''
})

async function fetchRsvps() {
  try {
    const res = await $fetch('/api/wedding/rsvp')
    list.value = res.list || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取RSVP列表失败:', error)
  }
}

function openDialog(rsvp?: Rsvp) {
  if (rsvp) {
    editingId.value = rsvp.id!
    form.value = { ...rsvp }
  } else {
    editingId.value = null
    form.value = {
      name: '',
      phone: '',
      count: 1,
      remark: ''
    }
  }
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingId.value = null
}

async function saveRsvp() {
  try {
    if (editingId.value) {
      await $fetch(`/api/wedding/rsvp/${editingId.value}`, {
        method: 'PUT',
        body: form.value
      })
    } else {
      await $fetch('/api/wedding/rsvp', {
        method: 'POST',
        body: form.value
      })
    }
    closeDialog()
    await fetchRsvps()
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败')
  }
}

async function deleteRsvp(id: number) {
  if (!confirm('确定要删除这条记录吗？')) return
  try {
    await $fetch(`/api/wedding/rsvp/${id}`, { method: 'DELETE' })
    await fetchRsvps()
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败')
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchRsvps()
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
