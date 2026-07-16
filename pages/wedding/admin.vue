<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">婚礼管理后台</h1>
    </div>

    <div class="flex gap-4 border-b border-zinc-800 pb-4 overflow-x-auto">
      <NuxtLink to="/wedding/admin" class="px-4 py-2 rounded-lg whitespace-nowrap font-medium bg-primary text-primary-foreground">
        宾客名单 (RSVP)
      </NuxtLink>
      <NuxtLink to="/wedding/finance" class="px-4 py-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 whitespace-nowrap">
        财务管理
      </NuxtLink>
      <NuxtLink to="/wedding/tasks" class="px-4 py-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 whitespace-nowrap">
        任务清单
      </NuxtLink>
      <NuxtLink to="/wedding/timeline" class="px-4 py-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 whitespace-nowrap">
        流程时间轴
      </NuxtLink>
    </div>

    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">RSVP 列表</h2>
      <div class="flex gap-4 items-center">
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
        <div class="bg-rose-500/20 text-rose-400 px-3 py-2 rounded-lg font-medium flex items-center text-sm md:text-base">
          总人数: {{ total }}
        </div>
        <Button @click="openDialog()" size="sm" variant="secondary" class="md:hidden">添加</Button>
        <Button @click="openDialog()" variant="secondary" class="hidden md:inline-flex">添加 RSVP</Button>
      </div>
    </div>

    <!-- Desktop Table View -->
    <div class="hidden md:block bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
      <Table>
        <TableCaption>婚礼出席名单</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>姓名</TableHead>
            <TableHead>手机号</TableHead>
            <TableHead>人数</TableHead>
            <TableHead>备注</TableHead>
            <TableHead>提交时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="rsvp in list" :key="rsvp.id">
            <TableCell class="font-medium">{{ rsvp.name }}</TableCell>
            <TableCell>{{ rsvp.phone || '-' }}</TableCell>
            <TableCell>{{ rsvp.count }}</TableCell>
            <TableCell class="max-w-xs truncate" :title="rsvp.remark">{{ rsvp.remark || '-' }}</TableCell>
            <TableCell>{{ formatDate(rsvp.created_at) }}</TableCell>
            <TableCell class="text-right space-x-2">
              <Button variant="outline" size="sm" @click="openDialog(rsvp)">编辑</Button>
              <Button variant="destructive" size="sm" @click="deleteRsvp(rsvp.id)">删除</Button>
            </TableCell>
          </TableRow>
          <TableRow v-if="list.length === 0">
            <TableCell colspan="6" class="text-center py-8 text-zinc-500">
              暂无数据
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Mobile Card View -->
    <div class="md:hidden space-y-4">
      <div v-if="list.length === 0" class="text-center py-8 text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800">
        暂无数据
      </div>
      <div v-else v-for="rsvp in list" :key="rsvp.id" class="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-lg">{{ rsvp.name }}</h3>
            <p class="text-sm text-zinc-500" v-if="rsvp.phone">{{ rsvp.phone }}</p>
          </div>
          <div class="bg-rose-500/20 text-rose-400 px-2 py-1 rounded text-sm font-medium">
            {{ rsvp.count }}人
          </div>
        </div>
        
        <div v-if="rsvp.remark" class="text-sm text-zinc-400 bg-zinc-800/50 p-2 rounded">
          备注：{{ rsvp.remark }}
        </div>
        
        <div class="flex justify-between items-center pt-2 border-t mt-2">
          <span class="text-xs text-zinc-400">{{ formatDate(rsvp.created_at) }}</span>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" class="h-8" @click="openDialog(rsvp)">编辑</Button>
            <Button variant="destructive" size="sm" class="h-8" @click="deleteRsvp(rsvp.id)">删除</Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ editingId ? '编辑 RSVP' : '添加 RSVP' }}</DialogTitle>
          <DialogDescription>
            {{ editingId ? '修改现有的出席信息。' : '添加新的出席记录。' }}
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="submitForm" class="space-y-4">
          <div class="grid w-full items-center gap-1.5">
            <Label>家庭</Label>
            <select
              v-model="form.group_id"
              class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option>
            </select>
          </div>
          <div class="grid w-full items-center gap-1.5">
            <Label for="name">姓名</Label>
            <input
              id="name"
              v-model="form.name"
              required
              class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div class="grid w-full items-center gap-1.5">
            <Label for="phone">手机号</Label>
            <input
              id="phone"
              v-model="form.phone"
              class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div class="grid w-full items-center gap-1.5">
            <Label for="count">人数</Label>
            <input
              id="count"
              type="number"
              v-model.number="form.count"
              min="1"
              required
              class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div class="grid w-full items-center gap-1.5">
            <Label for="remark">备注</Label>
            <textarea
              id="remark"
              v-model="form.remark"
              class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px]"
            ></textarea>
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
import { ref, onMounted, reactive } from 'vue'

useHead({
  title: '婚礼 RSVP 管理'
})

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

interface Rsvp {
  id: number
  name: string
  phone: string
  count: number
  remark: string
  created_at: string
  group_id?: number
}

const groups = ref<any[]>([])
const selectedGroupId = ref<string>(localStorage.getItem('wedding_selectedGroupId') || 'all')
const list = ref<Rsvp[]>([])
const total = ref(0)
const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  group_id: null as number | null,
  name: '',
  phone: '',
  count: 1,
  remark: ''
})

async function fetchGroups() {
  try {
    const data = await $fetch<any[]>('/api/groups')
    groups.value = data
    if (groups.value.length > 0 && !form.group_id) {
      form.group_id = groups.value[0].id
    }
  } catch (e) {
    console.error('获取家庭失败', e)
  }
}

async function fetchData() {
  try {
    const url = selectedGroupId.value === 'all' 
      ? '/api/wedding/rsvp' 
      : `/api/wedding/rsvp?group_id=${selectedGroupId.value}`
    const data = await $fetch<{ list: Rsvp[], total: number }>(url)
    list.value = data.list
    total.value = data.total
  } catch (e) {
    console.error('获取数据失败', e)
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function openDialog(rsvp?: Rsvp) {
  if (rsvp) {
    editingId.value = rsvp.id
    form.name = rsvp.name
    form.phone = rsvp.phone || ''
    form.count = rsvp.count
    form.remark = rsvp.remark || ''
    form.group_id = rsvp.group_id || null
  } else {
    editingId.value = null
    form.name = ''
    form.phone = ''
    form.count = 1
    form.remark = ''
    // Default to first family or cached selection
    const cached = localStorage.getItem('wedding_selectedGroupId')
    const cachedId = cached && cached !== 'all' ? Number(cached) : null
    form.group_id = groups.value.length > 0 ? (cachedId || groups.value[0].id) : null
  }
  isDialogOpen.value = true
}

// Watch and cache selectedGroupId
watch(selectedGroupId, (val) => {
  localStorage.setItem('wedding_selectedGroupId', val)
})

async function submitForm() {
  if (isSubmitting.value) return
  if (!form.group_id) {
    alert('请选择家庭')
    return
  }
  isSubmitting.value = true

  try {
    if (editingId.value) {
      await $fetch(`/api/wedding/rsvp/${editingId.value}`, {
        method: 'PUT',
        body: form
      })
    } else {
      await $fetch('/api/wedding/rsvp', {
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

async function deleteRsvp(id: number) {
  if (!confirm('确定要删除这条记录吗？')) return

  try {
    await $fetch(`/api/wedding/rsvp/${id}`, {
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