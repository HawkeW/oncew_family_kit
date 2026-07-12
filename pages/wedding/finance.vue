<template>
  <div class="text-zinc-100">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-lg font-medium">婚礼管理</h1>
      <p class="text-sm text-zinc-500">财务管理</p>
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
        <h2 class="text-lg font-medium">财务概览</h2>
        <button
          @click="openDialog()"
          class="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-all hover:bg-rose-400 active:scale-95"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          记一笔
        </button>
      </div>

      <!-- 统计卡片 -->
      <div class="grid gap-4 grid-cols-3">
        <div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-1">
          <h3 class="text-xs font-medium text-zinc-500 uppercase tracking-wider">总收入</h3>
          <div class="text-2xl font-bold text-green-400">+{{ formatMoney(summary.total_income) }}</div>
        </div>
        <div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-1">
          <h3 class="text-xs font-medium text-zinc-500 uppercase tracking-wider">总支出</h3>
          <div class="text-2xl font-bold text-red-400">-{{ formatMoney(summary.total_expense) }}</div>
        </div>
        <div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-1">
          <h3 class="text-xs font-medium text-zinc-500 uppercase tracking-wider">结余</h3>
          <div class="text-2xl font-bold" :class="summary.balance >= 0 ? 'text-green-400' : 'text-red-400'">
            {{ summary.balance >= 0 ? '+' : '' }}{{ formatMoney(summary.balance) }}
          </div>
        </div>
      </div>

      <!-- 筛选 -->
      <div class="flex gap-2">
        <button
          v-for="filter in ['all', 'income', 'expense']"
          :key="filter"
          @click="currentFilter = filter"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
          :class="currentFilter === filter ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'"
        >
          {{ filter === 'all' ? '全部' : (filter === 'income' ? '收入' : '支出') }}
        </button>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredList.length === 0" class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
        <div class="mx-auto h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
          <span class="text-3xl">💰</span>
        </div>
        <h3 class="text-lg font-medium text-zinc-300">还没有财务记录</h3>
        <p class="mt-2 text-sm text-zinc-500">点击右上角「记一笔」开始记录</p>
      </div>

      <!-- 记录列表 -->
      <div v-else class="rounded-xl border border-zinc-800/60 bg-zinc-900/30 divide-y divide-zinc-800/50">
        <div
          v-for="item in filteredList"
          :key="item.id"
          class="flex items-center gap-4 p-4 hover:bg-zinc-800/30 transition-colors"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-full" :class="item.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'">
            <span class="text-xl">{{ item.type === 'income' ? '💵' : '🛒' }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-medium text-zinc-200">{{ item.description || item.category }}</p>
              <span class="text-xs px-2 py-0.5 rounded-full" :class="item.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'">
                {{ item.type === 'income' ? '收入' : '支出' }}
              </span>
            </div>
            <p class="text-sm text-zinc-500 mt-0.5">{{ formatDate(item.record_date) }} · {{ item.category }}</p>
          </div>
          <div class="text-right">
            <p class="font-medium" :class="item.type === 'income' ? 'text-green-400' : 'text-red-400'">
              {{ item.type === 'income' ? '+' : '-' }}{{ formatMoney(item.amount) }}
            </p>
          </div>
          <div class="flex items-center gap-1">
            <button @click="openDialog(item)" class="p-2 text-zinc-400 hover:text-zinc-200 transition-colors">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button @click="deleteFinance(item.id)" class="p-2 text-zinc-400 hover:text-red-400 transition-colors">
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
          <h2 class="text-lg font-medium mb-4">{{ editingId ? '编辑记录' : '记一笔' }}</h2>
          <form @submit.prevent="saveFinance" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">类型</label>
              <select
                v-model="form.type"
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="income">收入</option>
                <option value="expense">支出</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">分类</label>
              <select
                v-model="form.category"
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="礼金">礼金</option>
                <option value="餐饮">餐饮</option>
                <option value="场地">场地</option>
                <option value="服装">服装</option>
                <option value="摄影">摄影</option>
                <option value="婚车">婚车</option>
                <option value="化妆">化妆</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">金额</label>
              <input
                v-model.number="form.amount"
                type="number"
                step="0.01"
                min="0"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">日期</label>
              <input
                v-model="form.record_date"
                type="date"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">描述</label>
              <textarea
                v-model="form.description"
                rows="2"
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="输入描述信息"
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: '财务管理 - 婚礼管理 - Nestory'
})

const route = useRoute()

interface Finance {
  id?: number
  type: 'income' | 'expense'
  category: string
  amount: number
  description?: string
  record_date: string
  created_at?: string
}

const list = ref<Finance[]>([])
const summary = ref({ total_income: 0, total_expense: 0, balance: 0 })
const currentFilter = ref('all')
const showDialog = ref(false)
const editingId = ref<number | null>(null)
const form = ref<Partial<Finance>>({
  type: 'expense',
  category: '其他',
  amount: 0,
  description: '',
  record_date: new Date().toISOString().split('T')[0]
})

const filteredList = computed(() => {
  if (currentFilter.value === 'all') return list.value
  return list.value.filter(item => item.type === currentFilter.value)
})

async function fetchFinances() {
  try {
    const res = await $fetch('/api/wedding/finance')
    list.value = res.list || []
    summary.value = res.summary || { total_income: 0, total_expense: 0, balance: 0 }
  } catch (error) {
    console.error('获取财务列表失败:', error)
  }
}

function openDialog(item?: Finance) {
  if (item) {
    editingId.value = item.id!
    form.value = { ...item }
  } else {
    editingId.value = null
    form.value = {
      type: 'expense',
      category: '其他',
      amount: 0,
      description: '',
      record_date: new Date().toISOString().split('T')[0]
    }
  }
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingId.value = null
}

async function saveFinance() {
  try {
    if (editingId.value) {
      await $fetch(`/api/wedding/finance/${editingId.value}`, {
        method: 'PUT',
        body: form.value
      })
    } else {
      await $fetch('/api/wedding/finance', {
        method: 'POST',
        body: form.value
      })
    }
    closeDialog()
    await fetchFinances()
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败')
  }
}

async function deleteFinance(id: number) {
  if (!confirm('确定要删除这条记录吗？')) return
  try {
    await $fetch(`/api/wedding/finance/${id}`, { method: 'DELETE' })
    await fetchFinances()
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败')
  }
}

function formatMoney(amount: number) {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchFinances()
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
