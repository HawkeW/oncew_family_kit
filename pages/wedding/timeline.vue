<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">婚礼管理后台</h1>
    </div>

    <div class="flex gap-4 border-b pb-4 overflow-x-auto">
      <NuxtLink to="/wedding/admin" class="px-4 py-2 rounded-lg hover:bg-muted whitespace-nowrap">
        宾客名单 (RSVP)
      </NuxtLink>
      <NuxtLink to="/wedding/finance" class="px-4 py-2 rounded-lg hover:bg-muted whitespace-nowrap">
        财务管理
      </NuxtLink>
      <NuxtLink to="/wedding/tasks" class="px-4 py-2 rounded-lg hover:bg-muted whitespace-nowrap">
        任务清单
      </NuxtLink>
      <NuxtLink to="/wedding/timeline" class="px-4 py-2 rounded-lg hover:bg-muted bg-primary text-primary-foreground font-medium whitespace-nowrap">
        流程时间�?
      </NuxtLink>
    </div>

    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">婚礼当天流程</h2>
      <Button @click="openDialog()" size="sm" class="md:hidden">添加</Button>
      <Button @click="openDialog()" class="hidden md:inline-flex">添加环节</Button>
    </div>

    <!-- Timeline View -->
    <div class="space-y-4">
      <div v-if="list.length === 0" class="text-center py-10 text-muted-foreground bg-card rounded-lg shadow">
        暂无流程安排，快去添加吧�?
      </div>

      <div v-else class="relative border-l-2 border-primary/20 ml-4 md:ml-6 space-y-8 py-4">
        <div v-for="(item, index) in list" :key="item.id" class="relative pl-8 md:pl-10">
          <!-- Dot -->
          <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm"></div>
          
          <div class="bg-card p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-1">
                  <span class="text-lg font-bold text-primary font-mono">
                    {{ item.start_time }}
                    <span v-if="item.end_time" class="text-muted-foreground font-normal text-sm">- {{ item.end_time }}</span>
                  </span>
                  <h3 class="font-semibold text-lg">{{ item.title }}</h3>
                </div>
                
                <div class="flex flex-wrap gap-y-1 gap-x-4 text-sm text-muted-foreground mb-2">
                  <div v-if="item.location" class="flex items-center gap-1">
                    <span class="i-heroicons-map-pin w-4 h-4"></span>
                    📍 {{ item.location }}
                  </div>
                  <div v-if="item.owner" class="flex items-center gap-1">
                    <span class="i-heroicons-user w-4 h-4"></span>
                    👤 负责�? {{ item.owner }}
                  </div>
                </div>

                <p v-if="item.description" class="text-muted-foreground whitespace-pre-wrap text-sm">{{ item.description }}</p>
              </div>

              <div class="flex gap-2 self-end md:self-start">
                <Button variant="ghost" size="sm" @click="openDialog(item)">编辑</Button>
                <Button variant="ghost" size="sm" class="text-red-600 hover:text-red-700 hover:bg-red-50" @click="deleteItem(item.id)">删除</Button>
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
          <div class="flex gap-4">
            <div class="grid w-full items-center gap-1.5">
              <Label for="start_time">开始时�?/Label>
              <Input id="start_time" type="time" v-model="form.start_time" required />
            </div>
            <div class="grid w-full items-center gap-1.5">
              <Label for="end_time">结束时间 (可�?</Label>
              <Input id="end_time" type="time" v-model="form.end_time" />
            </div>
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="title">环节名称</Label>
            <Input id="title" v-model="form.title" required placeholder="例如：新郎接亲、仪式开�? />
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="location">地点 (可�?</Label>
            <Input id="location" v-model="form.location" placeholder="例如：新娘家、酒店宴会厅" />
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="owner">负责�?(可�?</Label>
            <Input id="owner" v-model="form.owner" placeholder="例如：伴郎团、婚庆督�? />
          </div>

          <div class="grid w-full items-center gap-1.5">
            <Label for="description">详细说明</Label>
            <Textarea id="description" v-model="form.description" rows="3" placeholder="具体的流程细节、注意事�?.." />
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
import { ref, onMounted, reactive } from 'vue'

useHead({
  title: '婚礼流程时间�?
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
}

const list = ref<TimelineItem[]>([])
const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  start_time: '',
  end_time: '',
  title: '',
  description: '',
  location: '',
  owner: ''
})

async function fetchData() {
  try {
    const data = await $fetch<{ list: TimelineItem[] }>('/api/wedding/timeline')
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
  } else {
    editingId.value = null
    form.start_time = ''
    form.end_time = ''
    form.title = ''
    form.description = ''
    form.location = ''
    form.owner = ''
  }
  isDialogOpen.value = true
}

async function submitForm() {
  if (isSubmitting.value) return
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
  if (!confirm('确定要删除这个流程吗�?)) return

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

onMounted(() => {
  fetchData()
})
</script>
