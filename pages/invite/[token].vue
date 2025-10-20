<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- 加载状态 -->
        <div v-if="loading" class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">加载中...</p>
        </div>

        <!-- 邀请已过期 -->
        <div v-else-if="invitation && invitation.expired" class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-medium text-gray-900">邀请已过期</h3>
          <p class="mt-2 text-sm text-gray-500">
            这个邀请链接已经过期，请联系群组管理员重新发送邀请。
          </p>
          <div class="mt-6">
            <NuxtLink
              to="/"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              返回首页
            </NuxtLink>
          </div>
        </div>

        <!-- 邀请已处理 -->
        <div v-else-if="invitation && invitation.current_user_response" class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full" :class="invitation.current_user_response.action === 'accept' ? 'bg-green-100' : 'bg-red-100'">
            <svg v-if="invitation.current_user_response.action === 'accept'" class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <svg v-else class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-medium text-gray-900">
            {{ invitation.current_user_response.action === 'accept' ? '已加入群组' : '已拒绝邀请' }}
          </h3>
          <p class="mt-2 text-sm text-gray-500">
            {{ invitation.current_user_response.action === 'accept' ? '您已经成功加入群组。' : '您已经拒绝了这个邀请。' }}
          </p>
          <p class="mt-1 text-xs text-gray-400">
            处理时间：{{ formatDate(invitation.current_user_response.responded_at) }}
          </p>
          <div class="mt-6">
            <NuxtLink
              to="/groups"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              查看我的群组
            </NuxtLink>
          </div>
        </div>

        <!-- 有效的邀请 -->
        <div v-else-if="invitation" class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-medium text-gray-900">群组邀请</h3>
          <div class="mt-4 bg-gray-50 rounded-lg p-4">
            <h4 class="text-lg font-semibold text-gray-900">{{ invitation.group_name }}</h4>
            <p v-if="invitation.group_description" class="mt-1 text-sm text-gray-600">{{ invitation.group_description }}</p>
            <div class="mt-3 flex justify-between text-sm text-gray-500">
              <span>{{ invitation.member_count }} 名成员</span>
              <span>邀请人：{{ invitation.invited_by_name }}</span>
            </div>
          </div>
          <p class="mt-4 text-sm text-gray-600">
            您被邀请加入上述群组，请选择：
          </p>
          <div class="mt-6 flex gap-3">
            <button
              @click="handleInvitation('reject')"
              :disabled="!!processing"
              class="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {{ processing === 'reject' ? '处理中...' : '拒绝' }}
            </button>
            <button
              @click="handleInvitation('accept')"
              :disabled="!!processing"
              class="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {{ processing === 'accept' ? '处理中...' : '接受' }}
            </button>
          </div>
          <p class="mt-4 text-xs text-gray-500">
            邀请将于 {{ formatDate(invitation.expires_at) }} 过期
          </p>
        </div>

        <!-- 邀请不存在 -->
        <div v-else-if="!loading" class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-medium text-gray-900">邀请不存在</h3>
          <p class="mt-2 text-sm text-gray-500">
            找不到这个邀请，可能链接有误或邀请已被删除。
          </p>
          <div class="mt-6">
            <NuxtLink
              to="/"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: '群组邀请 - Oncew Family Kit'
})

interface InvitationDetail {
  id: number
  group_id: number
  invited_by: number
  invite_token: string
  status: 'pending' | 'accepted' | 'rejected'
  expires_at: string
  created_at: string
  updated_at: string
  group_name: string
  group_description: string
  invited_by_name: string
  member_count: number
  expired: boolean
  current_user_response?: {
    action: 'accept' | 'reject'
    responded_at: string
  } | null
}

const route = useRoute()
const router = useRouter()
const token = route.params.token as string

const invitation = ref<InvitationDetail | null>(null)
const loading = ref(true)
const processing = ref<'accept' | 'reject' | null>(null)

onMounted(async () => {
  await loadInvitation()
})

const loadInvitation = async () => {
  try {
    const data = await $fetch<InvitationDetail>(`/api/invite/${token}`)
    invitation.value = data
  } catch (error) {
    console.error('加载邀请详情失败:', error)
    invitation.value = null
  } finally {
    loading.value = false
  }
}

const handleInvitation = async (action: 'accept' | 'reject') => {
  if (!invitation.value) return
  
  processing.value = action
  try {
    const result = await $fetch(`/api/group-invitations?token=${token}`, {
      method: 'PUT',
      body: { action }
    })
    
    // 更新当前用户的响应状态
    invitation.value.current_user_response = {
      action: action,
      responded_at: new Date().toISOString()
    }
    
    // 显示成功消息
    if (action === 'accept') {
      alert('成功加入群组！')
      // 可以选择跳转到群组页面
      setTimeout(() => {
        router.push('/groups')
      }, 2000)
    } else {
      alert('已拒绝邀请')
    }
  } catch (error) {
    console.error('处理邀请失败:', error)
    alert('处理邀请失败，请重试')
  } finally {
    processing.value = null
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}
</script>