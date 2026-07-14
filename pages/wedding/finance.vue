<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">婚礼管理后台</h1>
    </div>

    <div class="flex gap-4 border-b border-zinc-800 pb-4 overflow-x-auto">
      <NuxtLink to="/wedding/admin" class="px-4 py-2 rounded-lg hover:bg-zinc-800/50 whitespace-nowrap">
        宾客名单 (RSVP)
      </NuxtLink>
      <NuxtLink to="/wedding/finance" class="px-4 py-2 rounded-lg hover:bg-zinc-800/50 bg-primary text-primary-foreground font-medium whitespace-nowrap">
        财务管理
      </NuxtLink>
      <NuxtLink to="/wedding/tasks" class="px-4 py-2 rounded-lg hover:bg-zinc-800/50 whitespace-nowrap">
        任务清单
      </NuxtLink>
      <NuxtLink to="/wedding/timeline" class="px-4 py-2 rounded-lg hover:bg-zinc-800/50 whitespace-nowrap">
        流程时间轴
      </NuxtLink>
    </div>

    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">财务概览</h2>
      <div class="flex items-center gap-4">
        <Select v-model="selectedGroupId" @update:modelValue="fetchData" class="w-[160px]">
          <SelectTrigger>
            <SelectValue placeholder="选择家庭" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部家庭</SelectItem>
            <SelectGroup v-for="group in groups" :key="group.id">
              <SelectItem :value="String(group.id)">{{ group.name }}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button @click="openDialog()" size="sm" class="md:hidden">记一笔</Button>
        <Button @click="openDialog()" class="hidden md:inline-flex">记一笔</Button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid gap-4 grid-cols-1 md:grid-cols-3">
      <div class="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 space-y-2">
        <h3 class="text-sm font-medium text-zinc-500">总收入 (礼金等)</h3>
        <div class="text-2xl font-bold text-green-600">+{{ formatMoney(summary.total_income) }}</div>
      </div>
      <div class="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 space-y-2">
        <h3 class="text-sm font-medium text-zinc-500">总支出</h3>
        <div class="text-2xl font-bold text-red-600">-{{ formatMoney(summary.total_expense) }}</div>
      </div>
      <div class="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 space-y-2">
        <h3 class="text-sm font-medium text-zinc-500">结余</h3>
        <div class="text-2xl font-bold" :class="summary.balance >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ summary.balance >= 0 ? '+' : '' }}{{ formatMoney(summary.balance) }}
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-2 overflow-x-auto pb-2">
      <Button 
        v-for="filter in ['all', 'income', 'expense']" 
        :key="filter"
        :variant="currentFilter === filter ? 'default' : 'outline'"
        @click="currentFilter = filter"
        class="capitalize whitespace-nowrap"
      >
        {{ filter === 'all' ? '全部' : (filter === 'income' ? '收入' : '支出') }}
      </Button>
    </div>

    <!-- Desktop Table List -->
    <div class="hidden md:block bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
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
            <TableCell colspan="6" class="text-center py-8 text-zinc-500">
              暂无数据
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Mobile Card List -->
    <div class="md:hidden space-y-4">
      <div v-if="filteredList.length === 0" class="text-center py-8 text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800">
        暂无数据
      </div>
      <div v-else v-for="item in filteredList" :key="item.id" class="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
        <div class="flex justify-between items-start">
           <div class="flex items-center gap-2">
              <span :class="item.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="text-xs px-2 py-1 rounded font-medium">
                {{ item.type === 'income' ? '收入' : '支出' }}
              </span>
              <span class="font-medium">{{ item.category }}</span>
           </div>
           <div class="font-bold" :class="item.type === 'income' ? 'text-green-600' : 'text-red-600'">
             {{ item.type === 'income' ? '+' : '-' }}{{ formatMoney(item.amount) }}
           </div>
        </div>

        <p v-if="item.description" class="text-sm text-zinc-400 bg-zinc-800/50 p-2 rounded">
          {{ item.description }}
        </p>

        <div class="flex justify-between items-center pt-2 border-t mt-2">
          <span class="text-xs text-zinc-400">{{ formatDate(item.record_date) }}</span>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" class="h-8" @click="openDialog(item)">编辑</Button>
            <Button variant="destructive" size="sm" class="h-8" @click="deleteItem(item.id)">删除</Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ editingId ? '编辑记录' : '添加记录' }}</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="submitForm" class="space-y-4">
          <div class="grid w-full items-center gap-1.5">
            <Label>家庭</Label>
            <Select v-model="form.group_id">
              <SelectTrigger>
                <SelectValue placeholder="选择家庭" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup v-for="group in groups" :key="group.id">
                  <SelectItem :value="String(group.id)">{{ group.name }}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

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
  layout: 'dashboard',
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
  group_id?: number
}

interface Summary {
  total_income: number
  total_expense: number
  balance: number
}

const groups = ref<any[]>([])
const selectedGroupId = ref<string>('all')
const list = ref<FinanceItem[]>([])
const summary = ref<Summary>({ total_income: 0, total_expense: 0, balance: 0 })
const currentFilter = ref('all')
const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  group_id: null as number | null,
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

async function fetchGroups() {
  try {
    const data = await $fetch<any[]>('/api/groups')
    groups.value = data
    if (groups.value.length > 0 && !form.group_id) {
      form.group_id = groups.value[0].id
    }
  } catch (e) {
    console.error('获取群组失败', e)
  }
}

async function fetchData() {
  try {
    const url = selectedGroupId.value === 'all' 
      ? '/api/wedding/finance' 
      : `/api/wedding/finance?group_id=${selectedGroupId.value}`
    const data = await $fetch<{ list: FinanceItem[], summary: Summary }>(url)
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
    form.group_id = item.group_id || null
  } else {
    editingId.value = null
    form.type = 'expense'
    form.category = ''
    form.amount = 0
    form.description = ''
    form.record_date = new Date().toISOString().split('T')[0]
    form.group_id = groups.value.length > 0 ? groups.value[0].id : null
  }
  isDialogOpen.value = true
}

async function submitForm() {
  if (isSubmitting.value) return
  if (!form.group_id) {
    alert('请选择家庭')
    return
  }
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

onMounted(async () => {
  await fetchGroups()
  await fetchData()
})
</script>