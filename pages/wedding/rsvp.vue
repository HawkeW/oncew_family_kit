<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="max-w-md w-full space-y-8 bg-white p-6 rounded-lg shadow-lg">
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-gray-900">婚礼邀请函</h2>
        <p class="mt-2 text-sm text-gray-600">期待您的光临，请填写下方信息</p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <div>
            <Label for="name">姓名 <span class="text-red-500">*</span></Label>
            <Input id="name" v-model="form.name" type="text" placeholder="请输入您的姓名" required class="mt-1" />
          </div>

          <div>
            <Label for="phone">手机号</Label>
            <Input id="phone" v-model="form.phone" type="tel" placeholder="方便我们联系您" class="mt-1" />
          </div>

          <div>
            <Label for="count">出席人数 <span class="text-red-500">*</span></Label>
            <Input id="count" v-model.number="form.count" type="number" min="1" required class="mt-1" />
          </div>

          <div>
            <Label for="remark">备注</Label>
            <Textarea id="remark" v-model="form.remark" placeholder="有什么想对我们说的..." class="mt-1" />
          </div>
        </div>

        <div>
          <Button type="submit" class="w-full" :disabled="loading || !form.group_id">
            {{ loading ? '提交中...' : '提交回复' }}
          </Button>
        </div>
      </form>

      <div v-if="success" class="mt-4 p-4 bg-green-100 text-green-700 rounded-md text-center">
        🎉 提交成功！感谢您的祝福！
      </div>

      <div v-if="!form.group_id" class="mt-4 p-4 bg-yellow-100 text-yellow-700 rounded-md text-center text-sm">
        ⚠️ 请通过邀请链接访问，或联系新人获取正确的邀请码
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

useHead({
  title: '婚礼邀请函 - RSVP'
})

definePageMeta({
  layout: false
})

const route = useRoute()

const form = ref({
  name: '',
  phone: '',
  count: 1,
  remark: '',
  group_id: null as number | null
})

const loading = ref(false)
const success = ref(false)

async function handleSubmit() {
  if (loading.value || !form.value.group_id) return
  loading.value = true
  success.value = false

  try {
    const { data, error } = await useFetch('/api/wedding/rsvp', {
      method: 'POST',
      body: form.value
    })

    if (error.value) {
      alert(error.value.data?.message || '提交失败，请重试')
    } else {
      success.value = true
      form.value = {
        name: '',
        phone: '',
        count: 1,
        remark: '',
        group_id: form.value.group_id
      }
    }
  } catch (e) {
    alert('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 从 URL query 参数获取 group_id
  const groupId = route.query.group_id
  if (groupId) {
    form.value.group_id = Number(groupId)
  }
})
</script>