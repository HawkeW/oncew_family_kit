<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面头部 -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              @click="$router.back()"
              class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100"
              title="返回"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <div>
              <h1 class="text-3xl font-bold text-gray-900">{{ group?.name || '群组详情' }}</h1>
              <p class="text-gray-600 mt-1">{{ members.length }} 名成员</p>
            </div>
          </div>
          
          <!-- 群组操作按钮 -->
          <div class="flex items-center space-x-2" v-if="group">
            <!-- 管理员：邀请成员 -->
            <button
              v-if="isAdmin"
              @click="openInviteModal"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span>邀请成员</span>
            </button>
            
            <!-- 管理员：邀请管理 -->
            <button
              v-if="isAdmin"
              @click="showInviteManagement = true"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>邀请管理</span>
            </button>
            
            <!-- 退出/解散群组 -->
            <button
              v-if="group.created_by === currentUserId"
              @click="dissolveGroup"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              <span>解散群组</span>
            </button>
            <button
              v-else
              @click="leaveGroup"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span>退出群组</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 群成员列表 -->
      <div class="bg-white rounded-lg shadow-md border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">群成员</h2>
        </div>
        
        <div class="divide-y divide-gray-200">
          <div
            v-for="member in sortedMembers"
            :key="member.user_id"
            class="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div class="flex items-center space-x-4">
              <!-- 用户头像 -->
              <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {{ member.username.charAt(0).toUpperCase() }}
              </div>
              
              <!-- 用户信息 -->
              <div>
                <div class="flex items-center space-x-2">
                  <h3 class="text-lg font-medium text-gray-900">{{ member.username }}</h3>
                  <span
                    v-if="member.role === 'admin'"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    管理员
                  </span>
                  <span
                    v-if="member.user_id === group?.created_by"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                  >
                    创建者
                  </span>
                </div>
                <p class="text-sm text-gray-500">加入时间：{{ formatDate(member.joined_at) }}</p>
              </div>
            </div>
            
            <!-- 成员操作 -->
            <div class="flex items-center space-x-2" v-if="isAdmin && member.user_id !== currentUserId">
              <button
                v-if="member.role !== 'admin'"
                @click="promoteToAdmin(member.user_id)"
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                设为管理员
              </button>
              <button
                v-else-if="group?.created_by === currentUserId"
                @click="demoteFromAdmin(member.user_id)"
                class="text-orange-600 hover:text-orange-800 text-sm font-medium"
              >
                取消管理员
              </button>
              <button
                @click="removeMember(member.user_id)"
                class="text-red-600 hover:text-red-800 text-sm font-medium ml-2"
              >
                移除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 邀请弹窗 -->
      <div v-if="showInviteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">邀请成员</h3>
            <button @click="showInviteModal = false" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">邀请链接有效期</label>
              <select v-model="inviteExpireDays" class="w-full border border-gray-300 rounded-md px-3 py-2">
                <option value="1">1天</option>
                <option value="3">3天</option>
                <option value="7">7天</option>
                <option value="30">30天</option>
              </select>
            </div>
            
            <div class="flex justify-end space-x-3">
              <button
                @click="showInviteModal = false"
                class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                @click="createInvitation"
                :disabled="loading"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {{ loading ? '创建中...' : '创建邀请' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 邀请管理弹窗 -->
      <div v-if="showInviteManagement" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">邀请管理</h3>
            <button @click="showInviteManagement = false" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <!-- 邀请码列表 -->
          <div class="mb-6">
            <h4 class="text-md font-medium mb-3">邀请码列表</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邀请码</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">过期时间</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="invitation in invitations" :key="invitation.id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {{ invitation.invite_token }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ formatDate(invitation.created_at) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ formatDate(invitation.expires_at) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        @click="copyInviteLink(invitation.invite_token)"
                        class="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        复制链接
                      </button>
                      <button
                        @click="deleteInvitation(invitation.id)"
                        class="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Group {
  id: number
  name: string
  description: string
  created_by: number
  created_at: string
  member_count: number
}

interface Member {
  user_id: number
  username: string
  role: 'admin' | 'member'
  joined_at: string
}

interface Invitation {
  id: number
  invite_token: string
  created_at: string
  expires_at: string
}

const route = useRoute()
const router = useRouter()
const groupId = parseInt(route.params.id as string)

// 响应式数据
const group = ref<Group | null>(null)
const members = ref<Member[]>([])
const invitations = ref<Invitation[]>([])
const currentUserId = ref<number | null>(null)
const userRole = ref<string>('')
const loading = ref(false)
const showInviteModal = ref(false)
const showInviteManagement = ref(false)
const inviteExpireDays = ref(7)

useHead({
  title: computed(() => group.value ? `${group.value.name} - 群组详情 - Oncew Family Kit` : '群组详情 - Oncew Family Kit')
})

// 计算属性
const isAdmin = computed(() => userRole.value === 'admin')

const sortedMembers = computed(() => {
  return [...members.value].sort((a, b) => {
    // 首先按角色排序：管理员优先
    if (a.role === 'admin' && b.role !== 'admin') return -1
    if (a.role !== 'admin' && b.role === 'admin') return 1
    
    // 角色相同时按用户名排序
    return a.username.localeCompare(b.username)
  })
})

// 页面加载时获取数据
onMounted(async () => {
  await loadCurrentUser()
  await loadGroupDetails()
  await loadGroupMembers()
  await loadUserRole()
})

// 加载当前用户信息
const loadCurrentUser = async () => {
  try {
    const user = await $fetch<{ id: number }>('/api/auth/profile')
    currentUserId.value = user.id
  } catch (error) {
    console.error('获取用户信息失败:', error)
    router.push('/login')
  }
}

// 加载群组详情
const loadGroupDetails = async () => {
  try {
    const data = await $fetch<Group>(`/api/groups/${groupId}`)
    group.value = data
  } catch (error) {
    console.error('获取群组详情失败:', error)
    router.push('/groups')
  }
}

// 加载群成员
const loadGroupMembers = async () => {
  try {
    const data = await $fetch<Member[]>(`/api/group-members?group_id=${groupId}`)
    members.value = data
  } catch (error) {
    console.error('获取群成员失败:', error)
  }
}

// 加载用户角色
const loadUserRole = async () => {
  try {
    const data = await $fetch<Member[]>(`/api/group-members?group_id=${groupId}`)
    const currentMember = data.find(member => member.user_id === currentUserId.value)
    userRole.value = currentMember?.role || ''
  } catch (error) {
    console.error('获取用户角色失败:', error)
  }
}

// 打开邀请弹窗
const openInviteModal = () => {
  showInviteModal.value = true
}

// 创建邀请
const createInvitation = async () => {
  loading.value = true
  try {
    await $fetch('/api/group-invitations', {
      method: 'POST',
      body: {
        group_id: groupId,
        expire_days: inviteExpireDays.value
      }
    })
    
    showInviteModal.value = false
    alert('邀请创建成功！')
    await loadInvitations()
  } catch (error) {
    console.error('创建邀请失败:', error)
    alert('创建邀请失败，请重试')
  } finally {
    loading.value = false
  }
}

// 加载邀请列表
const loadInvitations = async () => {
  if (!isAdmin.value) return
  
  try {
    const data = await $fetch<Invitation[]>(`/api/group-invitations?group_id=${groupId}`)
    invitations.value = data
  } catch (error) {
    console.error('加载邀请列表失败:', error)
  }
}

// 复制邀请链接
const copyInviteLink = async (token: string) => {
  const link = `${window.location.origin}/invite/${token}`
  try {
    await navigator.clipboard.writeText(link)
    alert('邀请链接已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    alert('复制失败，请手动复制链接')
  }
}

// 删除邀请
const deleteInvitation = async (invitationId: number) => {
  if (!confirm('确定要删除这个邀请吗？')) return
  
  try {
    await $fetch(`/api/group-invitations/${invitationId}`, {
      method: 'DELETE'
    })
    
    alert('邀请已删除')
    await loadInvitations()
  } catch (error) {
    console.error('删除邀请失败:', error)
    alert('删除邀请失败，请重试')
  }
}

// 提升为管理员
const promoteToAdmin = async (userId: number) => {
  if (!confirm('确定要将此用户设为管理员吗？')) return
  
  try {
    await $fetch(`/api/group-members/${userId}`, {
      method: 'PUT',
      body: {
        group_id: groupId,
        role: 'admin'
      }
    })
    
    alert('已设为管理员')
    await loadGroupMembers()
  } catch (error) {
    console.error('设置管理员失败:', error)
    alert('设置管理员失败，请重试')
  }
}

// 取消管理员
const demoteFromAdmin = async (userId: number) => {
  if (!confirm('确定要取消此用户的管理员权限吗？')) return
  
  try {
    await $fetch(`/api/group-members/${userId}`, {
      method: 'PUT',
      body: {
        group_id: groupId,
        role: 'member'
      }
    })
    
    alert('已取消管理员权限')
    await loadGroupMembers()
  } catch (error) {
    console.error('取消管理员失败:', error)
    alert('取消管理员失败，请重试')
  }
}

// 移除成员
const removeMember = async (userId: number) => {
  if (!confirm('确定要移除此成员吗？')) return
  
  try {
    await $fetch(`/api/group-members/${userId}`, {
      method: 'DELETE',
      body: {
        group_id: groupId
      }
    })
    
    alert('成员已移除')
    await loadGroupMembers()
  } catch (error) {
    console.error('移除成员失败:', error)
    alert('移除成员失败，请重试')
  }
}

// 退出群组
const leaveGroup = async () => {
  if (!confirm('确定要退出群组吗？')) return
  
  try {
    await $fetch(`/api/group-members/${currentUserId.value}`, {
      method: 'DELETE',
      body: {
        group_id: groupId
      }
    })
    
    alert('已退出群组')
    router.push('/groups')
  } catch (error) {
    console.error('退出群组失败:', error)
    alert('退出群组失败，请重试')
  }
}

// 解散群组
const dissolveGroup = async () => {
  if (!confirm('确定要解散群组吗？此操作不可撤销！')) return
  
  try {
    await $fetch(`/api/groups/${groupId}`, {
      method: 'DELETE'
    })
    
    alert('群组已解散')
    router.push('/groups')
  } catch (error) {
    console.error('解散群组失败:', error)
    alert('解散群组失败，请重试')
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 监听邀请管理弹窗打开，加载邀请列表
watch(showInviteManagement, (newValue) => {
  if (newValue && isAdmin.value) {
    loadInvitations()
  }
})
</script>