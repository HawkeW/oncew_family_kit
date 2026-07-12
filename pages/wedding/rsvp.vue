<template>
  <div class="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md space-y-8">
      <!-- 标题 -->
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-zinc-100">💒 婚礼邀请函</h2>
        <p class="mt-2 text-sm text-zinc-500">期待您的光临，请填写下方信息</p>
      </div>

      <!-- 表单卡片 -->
      <div class="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-zinc-300 mb-2">
                姓名 <span class="text-rose-400">*</span>
              </label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                placeholder="请输入您的姓名"
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-zinc-300 mb-2">
                手机号
              </label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                placeholder="方便我们联系您"
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label for="count" class="block text-sm font-medium text-zinc-300 mb-2">
                出席人数 <span class="text-rose-400">*</span>
              </label>
              <input
                id="count"
                v-model.number="form.count"
                type="number"
                min="1"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label for="remark" class="block text-sm font-medium text-zinc-300 mb-2">
                备注
              </label>
              <textarea
                id="remark"
                v-model="form.remark"
                rows="3"
                placeholder="有什么想对我们说的..."
                class="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-lg bg-rose-500 px-4 py-3 text-sm font-medium text-zinc-950 hover:bg-rose-400 transition-colors disabled:opacity-50"
          >
            {{ loading ? '提交中...' : '提交回复' }}
          </button>
        </form>

        <!-- 成功提示 -->
        <div v-if="success" class="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-center">
          <p class="text-green-400">🎉 提交成功！感谢您的祝福！</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: '婚礼邀请函 - RSVP'
})

definePageMeta({
  layout: false
})

const form = ref({
  name: '',
  phone: '',
  count: 1,
  remark: ''
})

const loading = ref(false)
const success = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    const res = await $fetch('/api/wedding/rsvp', {
      method: 'POST',
      body: form.value
    })
    success.value = true
    form.value = {
      name: '',
      phone: '',
      count: 1,
      remark: ''
    }
  } catch (error) {
    console.error('提交失败:', error)
    alert('提交失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>
