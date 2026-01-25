<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">婚礼 RSVP 管理</h1>
      <div class="flex gap-4">
        <div class="bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium flex items-center">
          总人数: {{ total }}
        </div>
        <Button @click="openDialog()">添加 RSVP</Button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
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
          <DialogTitle>{{ editingId ? '编辑 RSVP' : '添加 RSVP' }}</DialogTitle>
          <DialogDescription>
            {{ editingId ? '修改现有的出席信息。' : '添加新的出席记录。' }}
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="submitForm" class="space-y-4">
          <div class="grid w-full items-center gap-1.5">
            <Label for="name">姓名</Label>
            <Input id="name" v-model="form.name" required />
          </div>
          <div class="grid w-full items-center gap-1.5">
            <Label for="phone">手机号</Label>
            <Input id="phone" v-model="form.phone" />
          </div>
          <div class="grid w-full items-center gap-1.5">
            <Label for="count">人数</Label>
            <Input id="count" type="number" v-model.number="form.count" min="1" required />
          </div>
          <div class="grid w-full items-center gap-1.5">
            <Label for="remark">备注</Label>
            <Textarea id="remark" v-model="form.remark" />
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
  middleware: 'auth'
})

interface Rsvp {
  id: number
  name: string
  phone: string
  count: number
  remark: string
  created_at: string
}

const list = ref<Rsvp[]>([])
const total = ref(0)
const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  name: '',
  phone: '',
  count: 1,
  remark: ''
})

async function fetchData() {
  try {
    const data = await $fetch<{ list: Rsvp[], total: number }>('/api/wedding/rsvp')
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
  } else {
    editingId.value = null
    form.name = ''
    form.phone = ''
    form.count = 1
    form.remark = ''
  }
  isDialogOpen.value = true
}

async function submitForm() {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    if (editingId.value) {
      // Edit
      await $fetch(`/api/wedding/rsvp/${editingId.value}`, {
        method: 'PUT',
        body: form
      })
    } else {
      // Add
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

onMounted(() => {
  fetchData()
})
</script>
