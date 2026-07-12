<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100">
    <div class="mx-auto max-w-md px-6 py-16">
      <!-- 步骤指示器 -->
      <div class="flex items-center justify-center gap-2 mb-12">
        <div
          v-for="i in 3"
          :key="i"
          class="h-1.5 w-8 rounded-full transition-colors"
          :class="i <= step ? 'bg-cyan-500' : 'bg-zinc-800'"
        ></div>
      </div>

      <!-- 步骤 1: 选择创建还是加入 -->
      <div v-if="step === 1" class="space-y-6">
        <div class="text-center">
          <div class="mx-auto h-16 w-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
            <span class="text-3xl">👥</span>
          </div>
          <h1 class="text-2xl font-semibold">欢迎使用 Nestory</h1>
          <p class="mt-2 text-zinc-400">创建或加入一个群组，开始你的记录之旅</p>
        </div>

        <div class="space-y-3 mt-8">
          <button
            @click="selectMode('create')"
            class="flex w-full items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-left transition-all hover:border-cyan-500/50 hover:bg-zinc-900"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
              <span class="text-2xl">➕</span>
            </div>
            <div>
              <p class="font-medium">创建新群组</p>
              <p class="text-sm text-zinc-500">和家人、朋友一起开始</p>
            </div>
          </button>

          <button
            @click="selectMode('join')"
            class="flex w-full items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-left transition-all hover:border-cyan-500/50 hover:bg-zinc-900"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
              <span class="text-2xl">🔗</span>
            </div>
            <div>
              <p class="font-medium">加入已有群组</p>
              <p class="text-sm text-zinc-500">输入邀请码加入</p>
            </div>
          </button>
        </div>
      </div>

      <!-- 步骤 2: 填写信息 -->
      <div v-if="step === 2" class="space-y-6">
        <!-- 创建群组表单 -->
        <div v-if="mode === 'create'" class="space-y-4">
          <div class="text-center">
            <h1 class="text-2xl font-semibold">创建群组</h1>
            <p class="mt-2 text-zinc-400">给你的群组起个名字</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-300 mb-2">群组名称</label>
            <input
              v-model="groupName"
              type="text"
              placeholder="例如：我们的家庭"
              class="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-300 mb-2">描述（可选）</label>
            <textarea
              v-model="groupDesc"
              placeholder="描述这个群组..."
              rows="2"
              class="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
            ></textarea>
          </div>
        </div>

        <!-- 加入群组表单 -->
        <div v-if="mode === 'join'" class="space-y-4">
          <div class="text-center">
            <h1 class="text-2xl font-semibold">加入群组</h1>
            <p class="mt-2 text-zinc-400">输入邀请码加入已有群组</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-300 mb-2">邀请码</label>
            <input
              v-model="inviteCode"
              type="text"
              placeholder="输入8位邀请码"
              class="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white text-center text-xl tracking-widest placeholder-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 uppercase"
              maxlength="8"
            />
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="space-y-3 mt-6">
          <button
            @click="submit"
            :disabled="loading || (mode === 'create' && !groupName.trim()) || (mode === 'join' && inviteCode.length < 8)"
            class="w-full rounded-xl bg-cyan-500 py-3.5 text-sm font-medium text-zinc-950 transition-all hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? '处理中...' : '继续' }}
          </button>
          <button
            @click="step = 1"
            class="w-full rounded-xl border border-zinc-800 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-900/50"
          >
            返回
          </button>
        </div>

        <!-- 错误提示 -->
        <p v-if="error" class="text-center text-sm text-red-400">{{ error }}</p>
      </div>

      <!-- 步骤 3: 完成 -->
      <div v-if="step === 3" class="space-y-6 text-center">
        <div class="space-y-4">
          <div class="mx-auto h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
            <span class="text-4xl">✅</span>
          </div>
          <h1 class="text-2xl font-semibold">完成！</h1>
          <p class="text-zinc-400">
            {{ mode === 'create' ? `「${createdGroupName}」已创建` : '已成功加入群组' }}
          </p>
        </div>

        <div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-left">
          <p class="text-sm text-zinc-400">接下来你可以：</p>
          <ul class="mt-3 space-y-2 text-sm">
            <li class="flex items-center gap-2">
              <span class="text-cyan-400">•</span>
              添加你的第一条健康记录
            </li>
            <li class="flex items-center gap-2">
              <span class="text-cyan-400">•</span>
              邀请家人朋友加入群组
            </li>
            <li class="flex items-center gap-2">
              <span class="text-cyan-400">•</span>
              开始记录婚礼筹备
            </li>
          </ul>
        </div>

        <button
          @click="goToDashboard"
          class="w-full rounded-xl bg-cyan-500 py-3.5 text-sm font-medium text-zinc-950 transition-all hover:bg-cyan-400"
        >
          进入仪表盘
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const step = ref(1)
const mode = ref<'create' | 'join'>('create')
const loading = ref(false)
const error = ref('')
const createdGroupName = ref('')

// 创建群组
const groupName = ref('')
const groupDesc = ref('')

// 加入群组
const inviteCode = ref('')

// 选择模式
const selectMode = (m: 'create' | 'join') => {
  mode.value = m
  step.value = 2
}

// 提交
const submit = async () => {
  loading.value = true
  error.value = ''

  try {
    if (mode.value === 'create') {
      // 创建群组
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.value.trim(),
          description: groupDesc.value.trim()
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || '创建失败')
      }

      const data = await res.json()
      createdGroupName.value = data.name
    } else {
      // 加入群组 - 通过邀请码查找
      // TODO: 需要先有通过邀请码获取群组信息的 API
      // 暂时使用邀请码直接加入
      const res = await fetch(`/api/invite/${inviteCode.value}`, {
        method: 'POST'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || '邀请码无效')
      }
    }

    step.value = 3
  } catch (e: any) {
    error.value = e.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}

// 进入仪表盘
const goToDashboard = () => {
  router.push('/dashboard')
}

useHead({
  title: '欢迎 - Nestory'
})
</script>
