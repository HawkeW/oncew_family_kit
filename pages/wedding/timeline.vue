<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">婚礼管理后台</h1>
    </div>

    <div class="flex gap-4 border-b border-zinc-800 pb-4 overflow-x-auto">
      <NuxtLink to="/wedding/admin" class="px-4 py-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 whitespace-nowrap">
        宾客名单 (RSVP)
      </NuxtLink>
      <NuxtLink to="/wedding/finance" class="px-4 py-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 whitespace-nowrap">
        财务管理
      </NuxtLink>
      <NuxtLink to="/wedding/tasks" class="px-4 py-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 whitespace-nowrap">
        任务清单
      </NuxtLink>
      <NuxtLink to="/wedding/timeline" class="px-4 py-2 rounded-lg whitespace-nowrap font-medium bg-primary text-primary-foreground">
        流程时间轴
      </NuxtLink>
    </div>

    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">婚礼当天流程</h2>
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
        <Button @click="openDialog()" variant="secondary" class="hidden md:inline-flex">添加环节</Button>
      </div>
    </div>

    <!-- Timeline View -->
    <div class="space-y-4">
      <div v-if="list.length === 0" class="text-center py-10 text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800">
        暂无流程安排，快去添加吧！
      </div>

      <div v-else class="relative border-l-2 border-primary/20 ml-4 md:ml-6 space-y-8 py-4">
        <div v-for="(item, index) in list" :key="item.id" class="relative pl-8 md:pl-10">
          <!-- Dot -->
          <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-rose-500 border-4 border-zinc-950"></div>
          
          <div class="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-shadow">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-1">
                  <span class="text-lg font-bold text-theme-timeline font-mono">
                    {{ item.start_time }}
                    <span v-if="item.end_time" class="text-zinc-400 font-normal text-sm">- {{ item.end_time }}</span>
                  </span>
                  <h3 class="font-semibold text-lg">{{ item.title }}</h3>
                </div>
                
                <div class="flex flex-wrap gap-y-1 gap-x-4 text-sm text-zinc-400 mb-2">
                  <div v-if="item.location" class="flex items-center gap-1">
                    <span class="i-heroicons-map-pin w-4 h-4"></span>
                    📍 {{ item.location }}
                  </div>
                  <div v-if="item.owner" class="flex items-center gap-1">
                    <span class="i-heroicons-user w-4 h-4"></span>
                    👤 负责人: {{ item.owner }}
                  </div>
                </div>

                <p v-if="item.description" class="text-zinc-500 whitespace-pre-wrap text-sm">{{ item.description }}</p>
              </div>

              <div class="flex gap-2 self-end md:self-start">
                <Button variant="ghost" size="sm" @click="openDialog(item)">编辑</Button>
                <Button variant="ghost" size="sm" class="text-red-400 hover:text-red-300 hover:bg-red-900/50" @click="deleteItem(item.id)">删除</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ editingId ? '编辑流程' : '添加流程' }}</DialogTitle>
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

          <div class="flex gap-4">
            <div class="grid w-full items-center gap-1.5">
              <Label for="start_time">开始时间</Label>
              <input
                id="start_time"
                type="time"
                v-model="form.start_time"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div class="grid w-full items-center gap-1.5">
              <Label for="end_time">结束时间 (可选)</Label>
              <input
                id="end_time"
                type="time"
                v-model="form.end_time"
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="title">环节名称</Label>
            <input
              id="title"
              v-model="form.title"
              required
              placeholder="例如：新郎接亲、仪式开始"
              class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="location">地点 (可选)</Label>
            <input
              id="location"
              v-model="form.location"
              placeholder="例如：新娘家、酒店宴会厅"
              class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="owner">负责人 (可选)</Label>
            <input
              id="owner"
              v-model="form.owner"
              placeholder="例如：伴郎团、婚庆督导"
              class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="description">详细说明</Label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              placeholder="具体的流程细节、注意事项..."
              class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
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
  title: '婚礼流程时间轴'
})

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

interface TimelineItem {
  id: number
  start_time: string
  end_time?: string
  title: string
  description?: string
  location?: string;
  owner?: string;
  created_at: string
  group_id?: number
}

const groups = ref<any[]>([])
const selectedGroupId = ref<string>(localStorage.getItem('wedding_selectedGroupId') || 'all')
const list = ref<TimelineItem[]>([])
const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  group_id: null as number | null,
  start_time: '',
  end_time: '',
  title: '',
  description: '',
  location: '',
  owner: ''
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
      ? '/api/wedding/timeline' 
      : `/api/wedding/timeline?group_id=${selectedGroupId.value}`
    const data = await $fetch<{ list: TimelineItem[] }>(url)
    list.value = data.list
  } catch (e) {
    console.error('获取数据失败', e)
  }
}

function openDialog(item?: TimelineItem) {
  if (item) {
    editingId.value = item.id
    form.start_time = item.start_time
    form.end_time = item.end_time || ''
    form.title = item.title
    form.description = item.description || ''
    form.location = item.location || ''
    form.owner = item.owner || ''
    form.group_id = item.group_id || null
  } else {
    editingId.value = null
    form.start_time = ''
    form.end_time = ''
    form.title = ''
    form.description = ''
    form.location = ''
    form.owner = ''
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
      await $fetch(`/api/wedding/timeline/${editingId.value}`, {
        method: 'PUT',
        body: form
      })
    } else {
      await $fetch('/api/wedding/timeline', {
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
  if (!confirm('确定要删除这个流程吗？')) return

  try {
    await $fetch(`/api/wedding/timeline/${id}`, {
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