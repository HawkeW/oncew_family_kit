<template>
  <div class="text-foreground">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-lg font-medium">便便记录</h1>
      <p class="text-sm text-muted-foreground">{{ records.length }} 条记�?/p>
    </div>

    <main class="max-w-4xl">
      <!-- 顶部操作�?-->
      <div class="flex items-center justify-between mb-6">
        <div class="flex gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            @click="switchDataType(tab.value)"
            class="px-3 py-1.5 rounded-lg text-sm transition-all"
            :class="dataType === tab.value ? 'bg-theme-stool-light text-theme-stool' : 'text-zinc-400 hover:text-foreground'"
          >
            {{ tab.label }}
          </button>
        </div>
        <button
          @click="openAddDialog"
          class="flex items-center gap-2 rounded-lg bg-theme-stool px-4 py-2 text-sm font-medium text-zinc-900 transition-all hover:bg-theme-stool/90 active:scale-95"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          添加
        </button>
      </div>

      <!-- 空状�?-->
      <div v-if="records.length === 0" class="rounded-xl border border-border bg-card/30 p-12 text-center">
        <div class="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span class="text-3xl">💩</span>
        </div>
        <h3 class="text-lg font-medium text-muted-foreground">还没有记�?/h3>
        <p class="mt-2 text-sm text-muted-foreground">点击右上角「添加」开始记�?/p>
      </div>

      <!-- 记录列表 -->
      <div v-else class="rounded-xl border border-border/60 bg-card/30 divide-y divide-zinc-800/50">
        <div
          v-for="record in records"
          :key="record.id"
          class="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-full" :style="{ backgroundColor: getConsistencyColor(record.consistency) }">
            <span class="text-xl">💩</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-medium text-foreground">{{ formatRecordTime(record.record_time) }}</p>
              <span class="text-xs px-2 py-0.5 rounded-full bg-muted text-zinc-400">{{ getComfortLevelText(record.comfort_level) }}</span>
            </div>
            <p class="text-sm text-muted-foreground mt-0.5">
              {{ getConsistencyText(record.consistency) }} · {{ record.notes || '无备�? }}
            </p>
          </div>
          <div class="flex items-center gap-1">
            <button @click="editRecord(record)" class="p-2 text-zinc-400 hover:text-foreground transition-colors">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button @click="confirmDeleteRecord(record)" class="p-2 text-zinc-400 hover:text-red-400 transition-colors">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- 添加记录弹窗 -->
    <Transition name="modal">
      <div v-if="showAddDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="showAddDialog = false"></div>
        <div class="relative w-full max-w-md rounded-2xl bg-card border border-border p-6">
          <h2 class="text-lg font-medium mb-4">添加便便记录</h2>
          <form @submit.prevent="addRecord" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-muted-foreground mb-2">日期时间</label>
              <input
                type="datetime-local"
                v-model="newRecordDateTime"
                class="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-foreground focus:border-theme-stool focus:outline-none focus:ring-1 focus:ring-theme-stool"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-muted-foreground mb-2">舒适度</label>
              <select
                v-model="newRecord.comfort_level"
                class="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-foreground focus:border-theme-stool focus:outline-none focus:ring-1 focus:ring-theme-stool"
              >
                <option value="uncomfortable">不�?/option>
                <option value="normal">正常</option>
                <option value="comfortable">舒�?/option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-muted-foreground mb-2">便便性状</label>
              <select
                v-model="newRecord.consistency"
                class="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-foreground focus:border-theme-stool focus:outline-none focus:ring-1 focus:ring-theme-stool"
              >
                <option value="hard">�?/option>
                <option value="normal">正常</option>
                <option value="soft">�?/option>
                <option value="liquid">液�?/option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-muted-foreground mb-2">备注</label>
              <textarea
                v-model="newRecord.notes"
                rows="3"
                class="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-foreground focus:border-theme-stool focus:outline-none focus:ring-1 focus:ring-theme-stool"
              ></textarea>
            </div>
            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click="showAddDialog = false"
                class="flex-1 rounded-lg border border-input px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                class="flex-1 rounded-lg bg-theme-stool px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-theme-stool/90 transition-colors"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- 编辑记录对话�?-->
    <Dialog :open="isEditDialogOpen" @update:open="isEditDialogOpen = $event">
      <DialogContent class="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle class="text-foreground">编辑记录</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-muted-foreground mb-2">日期时间</label>
            <input
              type="datetime-local"
              v-model="editRecordDateTime"
              class="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-foreground focus:border-theme-stool focus:outline-none focus:ring-1 focus:ring-theme-stool"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-muted-foreground mb-2">舒适度</label>
            <select
              v-model="editingRecord.comfort_level"
              class="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-foreground focus:border-theme-stool focus:outline-none focus:ring-1 focus:ring-theme-stool"
            >
              <option value="uncomfortable">不�?/option>
              <option value="normal">正常</option>
              <option value="comfortable">舒�?/option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-muted-foreground mb-2">便便性状</label>
            <select
              v-model="editingRecord.consistency"
              class="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-foreground focus:border-theme-stool focus:outline-none focus:ring-1 focus:ring-theme-stool"
            >
              <option value="hard">�?/option>
              <option value="normal">正常</option>
              <option value="soft">�?/option>
              <option value="liquid">液�?/option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-muted-foreground mb-2">备注</label>
            <textarea
              v-model="editingRecord.notes"
              rows="3"
              class="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-foreground focus:border-theme-stool focus:outline-none focus:ring-1 focus:ring-theme-stool"
            ></textarea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isEditDialogOpen = false" class="bg-muted border-input text-muted-foreground">取消</Button>
          <Button @click="updateRecord" class="bg-theme-stool hover:bg-theme-stool/90 text-zinc-900">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 删除确认对话�?-->
    <Dialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <DialogContent class="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle class="text-foreground">确认删除</DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <p class="text-sm text-zinc-400">确定要删除这条记录吗？此操作无法撤销�?/p>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isDeleteDialogOpen = false" class="bg-muted border-input text-muted-foreground">取消</Button>
          <Button variant="destructive" @click="deleteRecord">确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { StoolRecord } from '~/server/models/schema'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: '便便记录 - Nestory'
})

const records = ref<StoolRecord[]>([])
const isEditDialogOpen = ref(false)
const editingRecord = ref<Partial<StoolRecord>>({})
const dataType = ref<'user' | 'all' | 'group'>('user')
const isDeleteDialogOpen = ref(false)
const recordToDelete = ref<StoolRecord | null>(null)
const showAddDialog = ref(false)

// 标签页选项
const tabs = [
  { label: '我的', value: 'user' as const },
  { label: '全部', value: 'all' as const },
  { label: '朋友', value: 'group' as const },
]

// 获取当前时间并格式化�?HH:mm
const getCurrentTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 获取当前日期时间并格式化�?ISO 字符�?const getCurrentDateTime = () => {
  const now = new Date()
  return now.toISOString()
}

const newRecord = ref<Partial<StoolRecord>>({
  record_time: getCurrentDateTime(),
  comfort_level: 'normal',
  consistency: 'normal',
  notes: ''
})

// 用于 v-model 绑定日期时间输入�?const newRecordDateTime = ref('')
const editRecordDateTime = ref('')

// 初始化日期时�?const updateNewRecordDateTime = () => {
  if (newRecord.value.record_time) {
    const date = new Date(newRecord.value.record_time)
    newRecordDateTime.value = date.toISOString().slice(0, 16)
  } else {
    newRecordDateTime.value = new Date().toISOString().slice(0, 16)
  }
}

const updateEditRecordDateTime = () => {
  if (editingRecord.value.record_time) {
    const date = new Date(editingRecord.value.record_time)
    editRecordDateTime.value = date.toISOString().slice(0, 16)
  } else {
    editRecordDateTime.value = new Date().toISOString().slice(0, 16)
  }
}

// 监听日期时间变化
const onNewRecordDateTimeChange = () => {
  if (newRecordDateTime.value) {
    newRecord.value.record_time = new Date(newRecordDateTime.value).toISOString()
  }
}

const onEditRecordDateTimeChange = () => {
  if (editRecordDateTime.value) {
    editingRecord.value.record_time = new Date(editRecordDateTime.value).toISOString()
  }
}

// 打开添加弹窗
const openAddDialog = () => {
  newRecord.value = {
    record_time: getCurrentDateTime(),
    comfort_level: 'normal',
    consistency: 'normal',
    notes: ''
  }
  updateNewRecordDateTime()
  showAddDialog.value = true
}

// 获取记录列表
async function fetchRecords() {
  try {
    const response = await fetch(`/api/stool-records?type=${dataType.value}`)
    if (response.ok) {
      const data = await response.json()
      records.value = data
    }
  } catch (error) {
    console.error('获取记录失败:', error)
  }
}

// 切换数据类型
function switchDataType(type: 'user' | 'all' | 'group') {
  dataType.value = type
  fetchRecords()
}

// 添加新记�?async function addRecord() {
  try {
    const response = await fetch('/api/stool-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newRecord.value)
    })

    if (response.ok) {
      showAddDialog.value = false
      await fetchRecords()
    }
  } catch (error) {
    console.error('添加记录失败:', error)
  }
}

// 编辑记录
function editRecord(record: StoolRecord) {
  editingRecord.value = { ...record }
  updateEditRecordDateTime()
  isEditDialogOpen.value = true
}

// 更新记录
async function updateRecord() {
  if (!editingRecord.value.id) return

  try {
    const response = await fetch(`/api/stool-records?id=${editingRecord.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editingRecord.value)
    })

    if (response.ok) {
      isEditDialogOpen.value = false
      await fetchRecords()
    }
  } catch (error) {
    console.error('更新记录失败:', error)
  }
}

// 格式化记录时�?function formatRecordTime(timeString: string) {
  if (!timeString) return '-'
  const recordDate = new Date(timeString)
  const now = new Date()
  const diffInMs = now.getTime() - recordDate.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInDays === 0) {
    if (diffInMinutes < 1) return '刚刚'
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`
    return `${diffInHours}小时前`
  } else if (diffInDays === 1) {
    return `昨天 ${recordDate.getHours().toString().padStart(2, '0')}:${recordDate.getMinutes().toString().padStart(2, '0')}`
  } else if (diffInDays < 7) {
    return `${diffInDays}天前`
  } else {
    const month = (recordDate.getMonth() + 1).toString().padStart(2, '0')
    const day = recordDate.getDate().toString().padStart(2, '0')
    const hours = recordDate.getHours().toString().padStart(2, '0')
    const minutes = recordDate.getMinutes().toString().padStart(2, '0')
    if (recordDate.getFullYear() === now.getFullYear()) {
      return `${month}-${day} ${hours}:${minutes}`
    }
    return `${recordDate.getFullYear()}-${month}-${day}`
  }
}

// 获取舒适度文本
function getComfortLevelText(level: string) {
  const map: Record<string, string> = {
    uncomfortable: '不�?,
    normal: '正常',
    comfortable: '舒�?
  }
  return map[level] || level
}

// 获取便便性状文本
function getConsistencyText(consistency: string) {
  const map: Record<string, string> = {
    hard: '�?,
    normal: '正常',
    soft: '�?,
    liquid: '液�?
  }
  return map[consistency] || consistency
}

// 获取便便性状颜色
function getConsistencyColor(consistency: string) {
  const map: Record<string, string> = {
    hard: 'rgba(239, 68, 68, 0.2)',
    normal: 'rgba(34, 197, 94, 0.2)',
    soft: 'rgba(251, 191, 36, 0.2)',
    liquid: 'rgba(139, 92, 246, 0.2)'
  }
  return map[consistency] || 'rgba(161, 161, 170, 0.2)'
}

// 确认删除记录
function confirmDeleteRecord(record: StoolRecord) {
  recordToDelete.value = record
  isDeleteDialogOpen.value = true
}

// 删除记录
async function deleteRecord() {
  if (!recordToDelete.value?.id) return

  try {
    const response = await fetch(`/api/stool-records?id=${recordToDelete.value.id}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      isDeleteDialogOpen.value = false
      recordToDelete.value = null
      await fetchRecords()
    }
  } catch (error) {
    console.error('删除记录失败:', error)
  }
}

// 组件挂载时获取记�?onMounted(() => {
  updateNewRecordDateTime()
  fetchRecords()
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
</style>
