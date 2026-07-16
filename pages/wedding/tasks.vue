<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">婚礼管理后台</h1>
    </div>

    <div class="flex gap-4 border-b border-border pb-4 overflow-x-auto">
      <NuxtLink to="/wedding/admin" class="px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground whitespace-nowrap">
        宾客名单 (RSVP)
      </NuxtLink>
      <NuxtLink to="/wedding/finance" class="px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground whitespace-nowrap">
        财务管理
      </NuxtLink>
      <NuxtLink to="/wedding/tasks" class="px-4 py-2 rounded-lg whitespace-nowrap font-medium bg-primary text-primary-foreground">
        任务清单
      </NuxtLink>
      <NuxtLink to="/wedding/timeline" class="px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground whitespace-nowrap">
        流程时间�?
      </NuxtLink>
    </div>

    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">任务列表</h2>
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
        <Button @click="openDialog()" size="sm" variant="secondary" class="md:hidden">添加</Button>
        <Button @click="openDialog()" variant="secondary" class="hidden md:inline-flex">添加任务</Button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 overflow-x-auto pb-2">
      <Button 
        v-for="cat in ['all', 'preparation', 'wedding_day']" 
        :key="cat"
        :variant="currentCategory === cat ? 'secondary' : 'ghost'"
        @click="currentCategory = cat"
        class="whitespace-nowrap"
      >
        {{ cat === 'all' ? '全部任务' : (cat === 'preparation' ? '筹备�? : '婚礼当天') }}
      </Button>
    </div>

    <!-- Task List -->
    <div class="space-y-4">
        <div v-if="filteredList.length === 0" class="text-center py-10 text-muted-foreground bg-muted rounded-xl border border-border">
            暂无任务，快去添加吧�?
        </div>

        <div v-else class="grid gap-4">
            <div 
                v-for="task in filteredList" 
                :key="task.id" 
                class="bg-muted p-4 rounded-xl border border-border flex flex-col md:flex-row md:items-start gap-4 transition-all"
                :class="{'opacity-60 bg-muted': task.status === 'completed'}"
            >
                <div class="flex items-start gap-3 w-full">
                    <div class="pt-1">
                        <input 
                            type="checkbox" 
                            :checked="task.status === 'completed'" 
                            @change="toggleStatus(task)"
                            class="w-5 h-5 rounded border-input text-primary focus:ring-primary cursor-pointer"
                        />
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                            <h3 class="font-medium text-lg" :class="{'line-through text-muted-foreground': task.status === 'completed'}">
                                {{ task.title }}
                            </h3>
                            <span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                                {{ task.category === 'preparation' ? '筹备�? : '婚礼当天' }}
                            </span>
                            <span v-if="task.due_date" class="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" :class="isOverdue(task) ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'">
                                {{ formatDate(task.due_date) }} 截止
                            </span>
                        </div>
                        <p class="text-muted-foreground mt-1 whitespace-pre-wrap text-sm md:text-base">{{ task.description }}</p>
                    </div>
                </div>
                
                <div class="flex gap-2 self-end md:self-start w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 mt-2 md:mt-0">
                    <Button variant="ghost" size="sm" @click="openDialog(task)">编辑</Button>
                    <Button variant="ghost" size="sm" class="text-red-400 hover:text-red-300 hover:bg-red-900/50" @click="deleteTask(task.id)">删除</Button>
                </div>
            </div>
        </div>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ editingId ? '编辑任务' : '添加任务' }}</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="submitForm" class="space-y-4">
          <div class="grid w-full items-center gap-1.5">
            <Label>家庭</Label>
            <select
              v-model="form.group_id"
              class="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option>
            </select>
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="title">任务名称</Label>
            <input
              id="title"
              v-model="form.title"
              required
              placeholder="例如：预定酒店、联系摄影师"
              class="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label>分类</Label>
            <div class="flex gap-4">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="radio" v-model="form.category" value="preparation" class="hidden peer" />
                <span class="px-3 py-1.5 rounded-lg text-sm border transition-all peer-checked:bg-primary/20 peer-checked:text-primary peer-checked:border-primary border-border text-muted-foreground hover:text-foreground">筹备�?/span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="radio" v-model="form.category" value="wedding_day" class="hidden peer" />
                <span class="px-3 py-1.5 rounded-lg text-sm border transition-all peer-checked:bg-primary/20 peer-checked:text-primary peer-checked:border-primary border-border text-muted-foreground hover:text-foreground">婚礼当天</span>
              </label>
            </div>
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="due_date">截止日期 (可�?</Label>
            <input
              id="due_date"
              type="date"
              v-model="form.due_date"
              class="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="description">详细说明</Label>
            <textarea
              id="description"
              v-model="form.description"
              rows="4"
              placeholder="任务的具体细�?.."
              class="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
            ></textarea>
          </div>

          <DialogFooter>
            <Button type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? '保存�?..' : '保存' }}
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
  title: '婚礼任务清单'
})

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

interface Task {
  id: number
  title: string
  description: string
  due_date: string
  status: 'pending' | 'completed'
  category: 'preparation' | 'wedding_day'
  created_at: string
  group_id?: number
}

const groups = ref<any[]>([])
const selectedGroupId = ref<string>(localStorage.getItem('wedding_selectedGroupId') || 'all')
const list = ref<Task[]>([])
const currentCategory = ref('all')
const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  group_id: null as number | null,
  title: '',
  description: '',
  due_date: '',
  category: 'preparation' as 'preparation' | 'wedding_day',
  status: 'pending' as 'pending' | 'completed'
})

const filteredList = computed(() => {
  let result = list.value
  if (currentCategory.value !== 'all') {
    result = result.filter(item => item.category === currentCategory.value)
  }
  return result.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    return 0
  })
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function isOverdue(task: Task) {
    if (!task.due_date || task.status === 'completed') return false
    return new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0))
}

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
      ? '/api/wedding/tasks' 
      : `/api/wedding/tasks?group_id=${selectedGroupId.value}`
    const data = await $fetch<{ list: Task[] }>(url)
    list.value = data.list
  } catch (e) {
    console.error('获取数据失败', e)
  }
}

function openDialog(item?: Task) {
  if (item) {
    editingId.value = item.id
    form.title = item.title
    form.description = item.description || ''
    form.due_date = item.due_date || ''
    form.category = item.category
    form.status = item.status
    form.group_id = item.group_id || null
  } else {
    editingId.value = null
    form.title = ''
    form.description = ''
    form.due_date = ''
    form.category = 'preparation'
    form.status = 'pending'
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
      await $fetch(`/api/wedding/tasks/${editingId.value}`, {
        method: 'PUT',
        body: form
      })
    } else {
      await $fetch('/api/wedding/tasks', {
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

async function toggleStatus(task: Task) {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending'
    task.status = newStatus
    
    try {
        await $fetch(`/api/wedding/tasks/${task.id}`, {
            method: 'PUT',
            body: { ...task, status: newStatus }
        })
    } catch (e) {
        console.error('更新状态失�?, e)
        task.status = task.status === 'pending' ? 'completed' : 'pending'
        alert('更新状态失�?)
    }
}

async function deleteTask(id: number) {
  if (!confirm('确定要删除这个任务吗�?)) return

  try {
    await $fetch(`/api/wedding/tasks/${id}`, {
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