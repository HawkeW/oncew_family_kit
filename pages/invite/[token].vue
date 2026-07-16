<template>
  <div class="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- 加载状态 -->
        <div v-if="loading" class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p class="mt-4 text-muted-foreground">加载中...</p>
        </div>

        <!-- 邀请已过期 -->
        <div v-else-if="invitation && invitation.expired" class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/20">
            <svg class="h-6 w-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-medium text-foreground">邀请已过期</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            这个邀请链接已经过期，请联系群组管理员重新发送邀请。
          </p>
          <div class="mt-6">
            <NuxtLink
              to="/"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              返回首页
            </NuxtLink>
          </div>
        </div>

        <!-- 邀请已处理 -->
        <div v-else-if="invitation && invitation.current_user_response" class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full" :class="invitation.current_user_response.action === 'accept' ? 'bg-green-500/20' : 'bg-destructive/20'">
            <svg v-if="invitation.current_user_response.action === 'accept'" class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <svg v-else class="h-6 w-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-medium text-foreground">
            {{ invitation.current_user_response.action === 'accept' ? '已加入群组' : '已拒绝邀请' }}
          </h3>
          <p class="mt-2 text-sm text-muted-foreground">
            {{ invitation.current_user_response.action === 'accept' ? '您已经成功加入群组。' : '您已经拒绝了这个邀请。' }}
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            处理时间：{{ formatDate(invitation.current_user_response.responded_at) }}
          </p>

          <div class="mt-6">
            <NuxtLink
              to="/"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              返回首页
            </NuxtLink>
          </div>
        </div>

        <!-- 邀请详情 -->
        <div v-else-if="invitation" class="space-y-6">
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/20">
              <svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
            </div>
            <h2 class="mt-4 text-2xl font-bold text-foreground">邀请您加入群组</h2>
            <p class="mt-2 text-sm text-muted-foreground">
              {{ invitation.group_name }}
            </p>
          </div>

          <div class="bg-muted rounded-lg p-4">
            <div class="text-sm text-muted-foreground space-y-2">
              <div class="flex justify-between">
                <span>邀请人</span>
                <span class="text-foreground font-medium">{{ invitation.invited_by_username || '未知' }}</span>
              </div>
              <div class="flex justify-between">
                <span>过期时间</span>
                <span class="text-foreground font-medium">{{ formatDate(invitation.expires_at) }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-4">
            <button
              @click="handleResponse('accept')"
              :disabled="processing"
              class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {{ processing ? '处理中...' : '接受邀请' }}
            </button>
            <button
              @click="handleResponse('reject')"
              :disabled="processing"
              class="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {{ processing ? '处理中...' : '拒绝邀请' }}
            </button>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/20">
            <svg class="h-6 w-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-medium text-foreground">邀请不存在</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            找不到对应的邀请链接，请检查链接是否正确。
          </p>
          <div class="mt-6">
            <NuxtLink
              to="/"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              返回首页
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const processing = ref(false)
const invitation = ref<any>(null)

definePageMeta({
  layout: false
})

useHead({
  title: '群组邀请 - Nestory'
})

async function fetchInvitation() {
  try {
    const token = route.params.token
    const response = await fetch(`/api/groups/invitations/${token}`)
    if (response.ok) {
      invitation.value = await response.json()
    }
  } catch (error) {
    console.error('获取邀请信息失败:', error)
  } finally {
    loading.value = false
  }
}

async function handleResponse(action: 'accept' | 'reject') {
  if (processing.value) return

  processing.value = true
  try {
    const response = await fetch(`/api/groups/invitations/${route.params.token}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action })
    })

    if (response.ok) {
      await fetchInvitation()
    } else {
      const error = await response.json()
      alert(error.message || '操作失败')
    }
  } catch (error) {
    console.error('处理邀请失败:', error)
    alert('处理失败，请稍后重试')
  } finally {
    processing.value = false
  }
}

function formatDate(dateString: string) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchInvitation()
})
</script>
