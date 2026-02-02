<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">婚礼管理后台</h1>
    </div>

    <div class="flex gap-4 border-b pb-4">
      <NuxtLink to="/wedding/admin" class="px-4 py-2 rounded-lg hover:bg-gray-100">
        宾客名单 (RSVP)
      </NuxtLink>
      <NuxtLink to="/wedding/finance" class="px-4 py-2 rounded-lg hover:bg-gray-100">
        财务管理
      </NuxtLink>
      <NuxtLink to="/wedding/tasks" class="px-4 py-2 rounded-lg hover:bg-gray-100 bg-primary text-primary-foreground font-medium">
        任务清单
      </NuxtLink>
      <NuxtLink to="/wedding/timeline" class="px-4 py-2 rounded-lg hover:bg-gray-100">
        流程时间轴
      </NuxtLink>
    </div>

    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">任务列表</h2>
      <Button @click="openDialog()">添加任务</Button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2">
      <Button 
        v-for="cat in ['all', 'preparation', 'wedding_day']" 
        :key="cat"
        :variant="currentCategory === cat ? 'default' : 'outline'"
        @click="currentCategory = cat"
      >
        {{ cat === 'all' ? '全部任务' : (cat === 'preparation' ? '筹备期' : '婚礼当天') }}
      </Button>
    </div>

    <!-- Task List -->
    <div class="space-y-4">
        <div v-if="filteredList.length === 0" class="text-center py-10 text-gray-500 bg-white rounded-lg shadow">
            暂无任务，快去添加吧！
        </div>

        <div v-else class="grid gap-4">
            <div 
                v-for="task in filteredList" 
                :key="task.id" 
                class="bg-white p-4 rounded-lg shadow flex items-start gap-4 transition-all"
                :class="{'opacity-60 bg-gray-50': task.status === 'completed'}"
            >
                <div class="pt-1">
                    <input 
                        type="checkbox" 
                        :checked="task.status === 'completed'" 
                        @change="toggleStatus(task)"
                        class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <h3 class="font-medium text-lg" :class="{'line-through text-gray-500': task.status === 'completed'}">
                            {{ task.title }}
                        </h3>
                        <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {{ task.category === 'preparation' ? '筹备期' : '婚礼当天' }}
                        </span>
                        <span v-if="task.due_date" class="text-xs px-2 py-0.5 rounded-full" :class="isOverdue(task) ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'">
                            {{ formatDate(task.due_date) }} 截止
                        </span>
                    </div>
                    <p class="text-gray-500 mt-1 whitespace-pre-wrap">{{ task.description }}</p>
                </div>
                <div class="flex gap-2">
                    <Button variant="ghost" size="sm" @click="openDialog(task)">编辑</Button>
                    <Button variant="ghost" size="sm" class="text-red-600 hover:text-red-700 hover:bg-red-50" @click="deleteTask(task.id)">删除</Button>
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
            <Label for="title">任务名称</Label>
            <Input id="title" v-model="form.title" required placeholder="例如：预定酒店、联系摄影师" />
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label>分类</Label>
            <div class="flex gap-4">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="radio" v-model="form.category" value="preparation" class="accent-primary" />
                <span>筹备期</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="radio" v-model="form.category" value="wedding_day" class="accent-primary" />
                <span>婚礼当天</span>
              </label>
            </div>
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="due_date">截止日期 (可选)</Label>
            <Input id="due_date" type="date" v-model="form.due_date" />
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="description">详细说明</Label>
            <Textarea id="description" v-model="form.description" rows="4" placeholder="任务的具体细节..." />
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
  title: '婚礼任务清单'
})

definePageMeta({
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
}

const list = ref<Task[]>([])
const currentCategory = ref('all')
const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
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
  // Sort: Pending first, then by due date
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

async function fetchData() {
  try {
    const data = await $fetch<{ list: Task[] }>('/api/wedding/tasks')
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
  } else {
    editingId.value = null
    form.title = ''
    form.description = ''
    form.due_date = ''
    form.category = 'preparation'
    form.status = 'pending'
  }
  isDialogOpen.value = true
}

async function submitForm() {
  if (isSubmitting.value) return
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
    // Optimistic update
    task.status = newStatus
    
    try {
        await $fetch(`/api/wedding/tasks/${task.id}`, {
            method: 'PUT',
            body: { ...task, status: newStatus }
        })
    } catch (e) {
        console.error('更新状态失败', e)
        // Revert on failure
        task.status = task.status === 'pending' ? 'completed' : 'pending'
        alert('更新状态失败')
    }
}

async function deleteTask(id: number) {
  if (!confirm('确定要删除这个任务吗？')) return

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

onMounted(() => {
  fetchData()
})
</script>
