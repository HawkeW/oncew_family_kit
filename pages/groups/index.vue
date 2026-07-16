<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-foreground">群组</h1>
        <button
          @click="showCreateModal = true"
          class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          创建
        </button>
      </div>

      <!-- 群组列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div
          v-for="group in groups"
          :key="group.id"
          class="bg-card rounded-xl border border-border p-6 cursor-pointer hover:border-border transition-all"
          @click="navigateToGroupDetail(group.id)"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-xl font-semibold text-foreground">{{ group.name }}</h3>
              <p class="text-muted-foreground text-sm mt-1">{{ group.description || '暂无描述' }}</p>
            </div>
            <div class="flex gap-2">
              <!-- 只有管理员才能看到邀请成员按�?-->
              <button
                v-if="isGroupAdmin(group.id)"
                @click.stop="openInviteModal(group)"
                class="text-blue-400 hover:text-blue-300 p-1"
                title="邀请成�?
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </button>
              <!-- 查看成员/邀请管�?- 管理员可以看到邀请管理，普通成员只能查看成�?-->
              <button
                v-if="isGroupAdmin(group.id)"
                @click.stop="viewGroupInvitations(group)"
                class="text-green-400 hover:text-green-300 p-1"
                :title="'邀请管�?"
              >
                <svg  class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </button>
              <!-- 管理员：解散群组 -->
              <button
                v-if="isGroupAdmin(group.id)"
                @click.stop="dissolveGroup(group)"
                class="text-red-400 hover:text-red-300 p-1"
                title="解散群组"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
              <!-- 成员：退出群�?-->
              <button
                v-else
                @click.stop="leaveGroup(group)"
                class="text-red-400 hover:text-red-300 p-1"
                title="退出群�?
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="flex justify-between items-center text-sm text-muted-foreground">
            <span>{{ group.member_count }} 名成�?/span>
            <span>创建�?{{ formatDate(group.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- 邀请管�?-->
      <div v-if="selectedGroup" class="space-y-6">
        <!-- 邀请码列表 -->
        <div class="bg-card rounded-xl border border-border p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-foreground">{{ selectedGroup.name }} - 邀请码列表</h2>
            <button
              @click="selectedGroup = null"
              class="text-muted-foreground hover:text-foreground"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-zinc-800">
              <thead class="bg-muted/50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">邀请码</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">创建时间</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">过期时间</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody class="bg-card divide-y divide-zinc-800">
                <tr v-for="invitation in invitations" :key="invitation.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground">
                    {{ invitation.invite_token }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {{ formatDate(invitation.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {{ formatDate(invitation.expires_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      @click="copyInviteLink(invitation.invite_token)"
                      class="text-blue-400 hover:text-blue-300 mr-3"
                    >
                      复制链接
                    </button>
                    <button
                      @click="deleteInvitation(invitation.id)"
                      class="text-red-400 hover:text-red-300"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 响应列表 -->
        <div class="bg-card rounded-xl border border-border p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4">{{ selectedGroup.name }} - 响应记录</h2>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-zinc-800">
              <thead class="bg-muted/50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">邀请码</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">用户</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">响应时间</th>
                </tr>
              </thead>
              <tbody class="bg-card divide-y divide-zinc-800">
                <template v-for="invitation in invitations" :key="invitation.id">
                  <tr v-for="response in invitation.responses" :key="response.id" v-if="invitation.responses && invitation.responses.length > 0">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground">
                      {{ invitation.invite_token }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {{ response.user_name }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <span :class="response.action === 'accept' ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400' : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400'">
                        {{ response.action === 'accept' ? '已接�? : '已拒�? }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {{ formatDate(response.responded_at) }}
                    </td>
                  </tr>
                </template>
                <tr v-if="!hasAnyResponses">
                  <td colspan="4" class="px-6 py-4 text-center text-sm text-muted-foreground italic">
                    暂无响应记录
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 创建群组模态框 -->
      <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-card rounded-lg p-6 w-full max-w-md border border-border">
          <h2 class="text-xl font-semibold text-foreground mb-4">创建新群�?/h2>
          <form @submit.prevent="createGroup">
            <div class="mb-4">
              <label class="block text-sm font-medium text-muted-foreground mb-2">群组名称</label>
              <input
                v-model="newGroup.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground bg-muted placeholder-zinc-500"
                placeholder="请输入群组名�?
              >
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-muted-foreground mb-2">群组描述</label>
              <textarea
                v-model="newGroup.description"
                rows="3"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground bg-muted placeholder-zinc-500"
                placeholder="请输入群组描述（可选）"
              ></textarea>
            </div>
            <div class="flex justify-end gap-3">
              <button
                type="button"
                @click="showCreateModal = false"
                class="px-4 py-2 text-muted-foreground border border-border rounded-md hover:bg-muted/50"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="loading"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {{ loading ? '创建�?..' : '创建' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 邀请成员模态框 -->
      <div v-if="showInviteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-card rounded-lg p-6 w-full max-w-md border border-border">
          <h2 class="text-xl font-semibold text-foreground mb-4">邀请成员到 "{{ inviteGroup?.name }}"</h2>
          <form @submit.prevent="createInvitation">
            <div class="mb-6">
              <label class="block text-sm font-medium text-muted-foreground mb-2">邀请链接有效期</label>
              <select
                v-model="inviteForm.expires_hours"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground bg-muted"
              >
                <option :value="1">1小时</option>
                <option :value="6">6小时</option>
                <option :value="24">24小时</option>
                <option :value="72">3�?/option>
                <option :value="168">7�?/option>
              </select>
            </div>
            <div class="flex justify-end gap-3">
              <button
                type="button"
                @click="showInviteModal = false"
                class="px-4 py-2 text-muted-foreground border border-border rounded-md hover:bg-muted/50"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="loading"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {{ loading ? '生成�?..' : '生成邀请链�? }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: '群组 - Nestory'
})

interface Group {
  id: number
  name: string
  description?: string
  created_by: number
  created_at: string
  updated_at: string
  member_count: number
  creator_name: string
  user_role?: string // 添加用户在该群组中的角色
}

interface Invitation {
  id: number
  group_id: number
  invited_by: number
  invite_token: string
  status: 'pending' | 'accepted' | 'rejected'
  expires_at: string
  created_at: string
  updated_at: string
  responses?: InvitationResponse[]
}

interface InvitationResponse {
  id: number
  invite_token: string
  user_id: number
  user_name: string
  action: 'accept' | 'reject'
  responded_at: string
}

const groups = ref<Group[]>([])
const invitations = ref<Invitation[]>([])
const selectedGroup = ref<Group | null>(null)
const showCreateModal = ref(false)
const showInviteModal = ref(false)
const inviteGroup = ref<Group | null>(null)
const loading = ref(false)
const currentUserId = ref<number | null>(null)
const userRoles = ref<Record<number, string>>({}) // 存储用户在各群组中的角色

// 计算属性：检查是否有任何响应记录
const hasAnyResponses = computed(() => {
  return invitations.value.some(invitation => 
    invitation.responses && invitation.responses.length > 0
  )
})

const newGroup = ref({
  name: '',
  description: ''
})

const inviteForm = ref({
  expires_hours: 24
})

onMounted(async () => {
  await loadGroups()
  await loadCurrentUser()
})

const loadCurrentUser = async () => {
  try {
    const data = await $fetch<{ id: number }>('/api/auth/profile')
    currentUserId.value = data.id
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

const loadGroups = async () => {
  try {
    const data = await $fetch<Group[]>('/api/groups')
    groups.value = data
    
    // 获取用户在各群组中的角色
    await loadUserRoles()
  } catch (error) {
    console.error('加载群组列表失败:', error)
  }
}

// 新增：获取用户在各群组中的角�?
const loadUserRoles = async () => {
  try {
    for (const group of groups.value) {
      const members = await $fetch<any[]>(`/api/group-members?group_id=${group.id}`)
      const currentUserMember = members.find(member => member.user_id === currentUserId.value)
      if (currentUserMember) {
        userRoles.value[group.id] = currentUserMember.role
        group.user_role = currentUserMember.role
      }
    }
  } catch (error) {
    console.error('获取用户角色失败:', error)
  }
}

// 新增：检查用户是否为群组管理�?
const isGroupAdmin = (groupId: number) => {
  return userRoles.value[groupId] === 'admin'
}

// 跳转到群组详情页
const navigateToGroupDetail = (groupId: number) => {
  navigateTo(`/groups/${groupId}`)
}

const createGroup = async () => {
  if (!newGroup.value.name.trim()) return
  
  loading.value = true
  try {
    await $fetch('/api/groups', {
      method: 'POST',
      body: newGroup.value
    })
    
    showCreateModal.value = false
    newGroup.value = { name: '', description: '' }
    await loadGroups()
  } catch (error) {
    console.error('创建群组失败:', error)
    alert('创建群组失败，请重试')
  } finally {
    loading.value = false
  }
}

const leaveGroup = async (group: Group) => {
  if (!confirm(`确定要退出群�?"${group.name}" 吗？`)) return
  
  try {
    await $fetch(`/api/group-members?group_id=${group.id}&user_id=${currentUserId.value}`, {
      method: 'DELETE'
    })
    await loadGroups()
  } catch (error) {
    console.error('退出群组失�?', error)
    alert('退出群组失败，请重�?)
  }
}

const dissolveGroup = async (group: Group) => {
  if (!confirm(`确定要解散群�?"${group.name}" 吗？此操作不可撤销，将删除群组及其所有相关数据。`)) return
  
  try {
    await $fetch(`/api/groups?id=${group.id}`, {
      method: 'DELETE'
    })
    await loadGroups()
    // 如果当前正在查看被解散的群组，关闭详情页
    if (selectedGroup.value?.id === group.id) {
      selectedGroup.value = null
    }
    alert('群组已成功解�?)
  } catch (error) {
    console.error('解散群组失败:', error)
    alert('解散群组失败，请重试')
  }
}

const openInviteModal = (group: Group) => {
  inviteGroup.value = group
  showInviteModal.value = true
}

const createInvitation = async () => {
  if (!inviteGroup.value) return
  
  loading.value = true
  try {
    const result = await $fetch<{ invite_url: string }>('/api/group-invitations', {
      method: 'POST',
      body: {
        group_id: inviteGroup.value.id,
        expires_hours: inviteForm.value.expires_hours
      }
    })
    
    showInviteModal.value = false
    
    // 复制邀请链接到剪贴�?
    if (result?.invite_url) {
      await navigator.clipboard.writeText(result.invite_url)
      alert('邀请链接已生成并复制到剪贴板！')
    }
    
    // 如果当前显示的是该群组的邀请列表，刷新列表
    if (selectedGroup.value?.id === inviteGroup.value.id) {
      await loadInvitations(inviteGroup.value.id)
    }
  } catch (error) {
    console.error('创建邀请失�?', error)
    alert('创建邀请失败，请重�?)
  } finally {
    loading.value = false
  }
}

const viewGroupInvitations = async (group: Group) => {
  selectedGroup.value = group
  await loadInvitations(group.id)
}

const loadInvitations = async (groupId: number) => {
  try {
    const data = await $fetch<Invitation[]>(`/api/group-invitations?group_id=${groupId}`)
    invitations.value = data
  } catch (error) {
    console.error('加载邀请列表失�?', error)
  }
}

const copyInviteLink = async (token: string) => {
  const inviteUrl = `${window.location.origin}/invite/${token}`
  try {
    await navigator.clipboard.writeText(inviteUrl)
    alert('邀请链接已复制到剪贴板�?)
  } catch (error) {
    console.error('复制失败:', error)
    alert('复制失败，请手动复制链接')
  }
}

const deleteInvitation = async (invitationId: number) => {
  if (!confirm('确定要删除这个邀请吗�?)) return
  
  try {
    await $fetch(`/api/group-invitations?id=${invitationId}`, {
      method: 'DELETE'
    })
    
    if (selectedGroup.value) {
      await loadInvitations(selectedGroup.value.id)
    }
  } catch (error) {
    console.error('删除邀请失�?', error)
    alert('删除邀请失败，请重�?)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getStatusText = (status: string) => {
  const statusMap = {
    pending: '待处�?,
    accepted: '已接�?,
    rejected: '已拒�?
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const getStatusClass = (status: string) => {
  const classMap = {
    pending: 'bg-yellow-900/50 text-yellow-400',
    accepted: 'bg-green-900/50 text-green-400',
    rejected: 'bg-red-900/50 text-red-400'
  }
  return classMap[status as keyof typeof classMap] || 'bg-muted text-foreground'
}
</script>