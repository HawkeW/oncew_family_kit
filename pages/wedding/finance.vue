<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">婚礼管理后台</h1>
    </div>

    <div class="flex gap-4 border-b pb-4">
      <NuxtLink to="/wedding/admin" class="px-4 py-2 rounded-lg hover:bg-gray-100">
        宾客名单 (RSVP)
      </NuxtLink>
      <NuxtLink to="/wedding/finance" class="px-4 py-2 rounded-lg hover:bg-gray-100 bg-primary text-primary-foreground font-medium">
        财务管理
      </NuxtLink>
      <NuxtLink to="/wedding/tasks" class="px-4 py-2 rounded-lg hover:bg-gray-100">
        任务清单
      </NuxtLink>
      <NuxtLink to="/wedding/timeline" class="px-4 py-2 rounded-lg hover:bg-gray-100">
        流程时间轴
      </NuxtLink>
    </div>

    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">财务概览</h2>
      <Button @click="openDialog()">记一笔</Button>
    </div>

    <!-- Summary Cards -->
    <div class="grid gap-4 md:grid-cols-3">
      <div class="bg-white p-6 rounded-lg shadow space-y-2">
        <h3 class="text-sm font-medium text-gray-500">总收入 (礼金等)</h3>
        <div class="text-2xl font-bold text-green-600">+{{ formatMoney(summary.total_income) }}</div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow space-y-2">
        <h3 class="text-sm font-medium text-gray-500">总支出</h3>
        <div class="text-2xl font-bold text-red-600">-{{ formatMoney(summary.total_expense) }}</div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow space-y-2">
        <h3 class="text-sm font-medium text-gray-500">结余</h3>
        <div class="text-2xl font-bold" :class="summary.balance >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ summary.balance >= 0 ? '+' : '' }}{{ formatMoney(summary.balance) }}
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-2">
      <Button 
        v-for="filter in ['all', 'income', 'expense']" 
        :key="filter"
        :variant="currentFilter === filter ? 'default' : 'outline'"
        @click="currentFilter = filter"
        class="capitalize"
      >
        {{ filter === 'all' ? '全部' : (filter === 'income' ? '收入' : '支出') }}
      </Button>
    </div>

    <!-- List -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日期</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>分类</TableHead>
            <TableHead>描述</TableHead>
            <TableHead class="text-right">金额</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in filteredList" :key="item.id">
            <TableCell>{{ formatDate(item.record_date) }}</TableCell>
            <TableCell>
              <span :class="item.type === 'income' ? 'text-green-600 bg-green-50 px-2 py-1 rounded' : 'text-red-600 bg-red-50 px-2 py-1 rounded'">
                {{ item.type === 'income' ? '收入' : '支出' }}
              </span>
            </TableCell>
            <TableCell>{{ item.category }}</TableCell>
            <TableCell class="max-w-xs truncate" :title="item.description">{{ item.description || '-' }}</TableCell>
            <TableCell class="text-right font-medium">
              {{ item.type === 'income' ? '+' : '-' }}{{ formatMoney(item.amount) }}
            </TableCell>
            <TableCell class="text-right space-x-2">
              <Button variant="outline" size="sm" @click="openDialog(item)">编辑</Button>
              <Button variant="destructive" size="sm" @click="deleteItem(item.id)">删除</Button>
            </TableCell>
          </TableRow>
          <TableRow v-if="filteredList.length === 0">
            <TableCell colspan="6" class="text-center py-8 text-gray-500">
              暂无数据
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ editingId ? '编辑记录' : '添加记录' }}</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="submitForm" class="space-y-4">
          <div class="grid w-full items-center gap-1.5">
            <Label>类型</Label>
            <div class="flex gap-4">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="radio" v-model="form.type" value="expense" class="accent-primary" />
                <span>支出</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="radio" v-model="form.type" value="income" class="accent-primary" />
                <span>收入</span>
              </label>
            </div>
          </div>
          
          <div class="grid w-full items-center gap-1.5">
            <Label for="category">分类</Label>
            <Input id="category" v-model="form.category" placeholder="例如：酒席、装饰、礼金" list="categories" required />
            <datalist id="categories">
              <option value="礼金"></option>
              <option value="酒席"></option>
              <option value="装饰"></option>
              <option value="婚庆"></option>
              <option value="服饰"></option>
              <option value="礼品"></option>
              <option value="交通"></option>
              <option value="其他"></option>
            </datalist>
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="amount">金额</Label>
            <Input id="amount" type="number" step="0.01" v-model.number="form.amount" required />
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="date">日期</Label>
            <Input id="date" type="date" v-model="form.record_date" required />
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="description">备注</Label>
            <Textarea id="description" v-model="form.description" />
          </div>

          <DialogFooter>
            <Button type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? '保存中...' : '保存' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'

useHead({
  title: '婚礼财务管理'
})

definePageMeta({
  middleware: 'auth'
})

interface FinanceItem {
  id: number
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  record_date: string
  created_at: string
}

interface Summary {
  total_income: number
  total_expense: number
  balance: number
}

const list = ref<FinanceItem[]>([])
const summary = ref<Summary>({ total_income: 0, total_expense: 0, balance: 0 })
const currentFilter = ref('all')
const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  type: 'expense' as 'income' | 'expense',
  category: '',
  amount: 0,
  description: '',
  record_date: new Date().toISOString().split('T')[0]
})

const filteredList = computed(() => {
  if (currentFilter.value === 'all') return list.value
  return list.value.filter(item => item.type === currentFilter.value)
})

function formatMoney(amount: number) {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

async function fetchData() {
  try {
    const data = await $fetch<{ list: FinanceItem[], summary: Summary }>('/api/wedding/finance')
    list.value = data.list
    summary.value = data.summary
  } catch (e) {
    console.error('获取数据失败', e)
  }
}

function openDialog(item?: FinanceItem) {
  if (item) {
    editingId.value = item.id
    form.type = item.type
    form.category = item.category
    form.amount = item.amount
    form.description = item.description || ''
    form.record_date = item.record_date
  } else {
    editingId.value = null
    form.type = 'expense'
    form.category = ''
    form.amount = 0
    form.description = ''
    form.record_date = new Date().toISOString().split('T')[0]
  }
  isDialogOpen.value = true
}

async function submitForm() {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    if (editingId.value) {
      await $fetch(`/api/wedding/finance/${editingId.value}`, {
        method: 'PUT',
        body: form
      })
    } else {
      await $fetch('/api/wedding/finance', {
        method: 'POST',
        body: form
      })
    }

    isDialogOpen.value = false
    await fetchData()
  } catch (e) {
    console.error('保存失败', e)
    alert('保存失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

async function deleteItem(id: number) {
  if (!confirm('确定要删除这条记录吗？')) return

  try {
    await $fetch(`/api/wedding/finance/${id}`, {
      method: 'DELETE'
    })
    await fetchData()
  } catch (e) {
    console.error('删除失败', e)
    alert('删除失败，请重试')
  }
}

onMounted(() => {
  fetchData()
})
</script>
