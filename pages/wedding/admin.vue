<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">婚礼 RSVP 列表</h1>
      <div class="bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium">
        总人数: {{ total }}
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
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="rsvp in list" :key="rsvp.id">
            <TableCell class="font-medium">{{ rsvp.name }}</TableCell>
            <TableCell>{{ rsvp.phone || '-' }}</TableCell>
            <TableCell>{{ rsvp.count }}</TableCell>
            <TableCell class="max-w-xs truncate" :title="rsvp.remark">{{ rsvp.remark || '-' }}</TableCell>
            <TableCell>{{ formatDate(rsvp.created_at) }}</TableCell>
          </TableRow>
          <TableRow v-if="list.length === 0">
            <TableCell colspan="5" class="text-center py-8 text-gray-500">
              暂无数据
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

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

async function fetchData() {
  try {
    const { data } = await useFetch('/api/wedding/rsvp')
    if (data.value) {
      list.value = data.value.list
      total.value = data.value.total
    }
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

onMounted(() => {
  fetchData()
})
</script>
