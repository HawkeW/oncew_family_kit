<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">经期记录</h1>

    <!-- 添加记录表单 -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <h2 class="text-xl font-semibold mb-4">添加新记录</h2>
      <form @submit.prevent="addRecord" class="space-y-4">
        <!-- 日期时间选择 -->
        <DateTimePicker v-model="newRecord.record_time" />
        
        <FormField name="flow_level">
          <FormItem class="space-y-2">
            <Label>经期量</Label>
            <Select v-model="newRecord.flow_level">
              <SelectTrigger>
                <SelectValue placeholder="选择经期量" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="light">轻</SelectItem>
                  <SelectItem value="medium">中等</SelectItem>
                  <SelectItem value="heavy">重</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormItem>
        </FormField>

        <FormField name="pain_level">
          <FormItem class="space-y-2">
            <Label>疼痛程度</Label>
            <Select v-model="newRecord.pain_level">
              <SelectTrigger>
                <SelectValue placeholder="选择疼痛程度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无痛</SelectItem>
                <SelectItem value="mild">轻微</SelectItem>
                <SelectItem value="moderate">中等</SelectItem>
                <SelectItem value="severe">严重</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        </FormField>
        <FormField name="notes">
          <FormItem class="space-y-2">
            <Label>备注</Label>
            <Textarea v-model="newRecord.notes" placeholder="输入备注信息" rows="3" />
          </FormItem>
        </FormField>


        <FormItem>
          <Button type="submit" class="w-full">
            添加记录
          </Button>
        </FormItem>
      </form>
    </div>

    <!-- 记录列表 -->
    <div class="bg-white p-4 rounded-lg shadow">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">历史记录</h2>
        <!-- 数据类型切换器 -->
        <div class="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            :class="{ 'bg-blue-100 border-blue-500': dataType === 'user' }"
            @click="switchDataType('user')"
          >
            我的
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            :class="{ 'bg-blue-100 border-blue-500': dataType === 'all' }"
            @click="switchDataType('all')"
          >
            所有
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            :class="{ 'bg-blue-100 border-blue-500': dataType === 'group' }"
            @click="switchDataType('group')"
          >
            群组
          </Button>
        </div>
      </div>
      <div class="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>记录时间</TableHead>
              <TableHead>经期量</TableHead>
              <TableHead>疼痛程度</TableHead>
              <TableHead>备注</TableHead>
              <TableHead v-if="dataType !== 'user'">用户</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="record in records" :key="record.id">
              <TableCell>{{ formatRecordTime(record.record_time) }}</TableCell>
              <TableCell>{{ getFlowLevelText(record.flow_level) }}</TableCell>
              <TableCell>{{ getPainLevelText(record.pain_level) }}</TableCell>
              <TableCell>{{ record.notes || '-' }}</TableCell>
              <TableCell v-if="dataType !== 'user'">{{ record.username || '-' }}</TableCell>
              <TableCell>
                <Button 
                  v-if="!record.username" 
                  variant="outline" 
                  size="sm" 
                  @click="editRecord(record)"
                >
                  编辑
                </Button>
                <span v-else class="text-gray-400 text-sm">-</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- 编辑记录对话框 -->
    <Dialog :open="isEditDialogOpen" @update:open="isEditDialogOpen = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑记录</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <!-- 日期选择 -->
          <!-- 日期时间选择 -->
          <DateTimePicker v-model="editingRecord.record_time" />

          <div class="space-y-2">
            <Label>经期量</Label>
            <Select v-model="editingRecord.flow_level">
              <SelectTrigger>
                <SelectValue placeholder="选择经期量" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">轻</SelectItem>
                <SelectItem value="medium">中等</SelectItem>
                <SelectItem value="heavy">重</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>疼痛程度</Label>
            <Select v-model="editingRecord.pain_level">
              <SelectTrigger>
                <SelectValue placeholder="选择疼痛程度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无痛</SelectItem>
                <SelectItem value="mild">轻微</SelectItem>
                <SelectItem value="moderate">中等</SelectItem>
                <SelectItem value="severe">严重</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>备注</Label>
            <Textarea v-model="editingRecord.notes" placeholder="输入备注信息" rows="3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isEditDialogOpen = false">取消</Button>
          <Button @click="updateRecord">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { MenstrualRecord } from '~/server/models/schema'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: '经期记录 - Oncew Family Kit'
})
import { CalendarIcon } from 'lucide-vue-next'
import { toDate } from 'reka-ui/date'
import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate, today,  } from '@internationalized/date'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { TimePicker } from '@/components/ui/time-picker'
import { DateTimePicker } from '@/components/ui/date-time-picker'

const records = ref<MenstrualRecord[]>([])
const isEditDialogOpen = ref(false)
const editingRecord = ref<Partial<MenstrualRecord>>({})
const dataType = ref<'user' | 'all' | 'group'>('user')


const df = new DateFormatter('en-US', {
  dateStyle: 'long',
})

const formSchema = toTypedSchema(z.object({
  record_date: z
    .string()
    .refine(v => v, { message: 'A start date is required.' }),
}))
const { handleSubmit, setFieldValue, values } = useForm({
  validationSchema: formSchema,
})
// 设置默认日期
const nowDate = new Date()
const defaultEndDate = new Date(nowDate)
defaultEndDate.setDate(nowDate.getDate() + 7)

// 获取当前时间并格式化为 HH:mm
const getCurrentTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 获取当前日期时间并格式化为 ISO 字符串
const getCurrentDateTime = () => {
  const now = new Date()
  return now.toISOString()
}

const newRecord = ref<Partial<MenstrualRecord>>({
  record_time: getCurrentDateTime(), // 使用完整的日期时间作为默认值
  flow_level: 'medium',
  pain_level: 'none',
  notes: ''
})

const recordDate = computed({
  get: () => newRecord.value.record_time ? parseDate(newRecord.value.record_time.split('T')[0]) : undefined,
  set: (val) => {
    if (val) {
      // 保持现有的时间部分，只更新日期部分
      const currentTime = newRecord.value.record_time ? new Date(newRecord.value.record_time) : new Date()
      const newDateTime = new Date(val.toString())
      newDateTime.setHours(currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds(), currentTime.getMilliseconds())
      newRecord.value.record_time = newDateTime.toISOString()
    } else {
      newRecord.value.record_time = getCurrentDateTime()
    }
  },
})

const recordTime = computed({
  get: () => {
    if (newRecord.value.record_time) {
      const date = new Date(newRecord.value.record_time)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
    return getCurrentTime()
  },
  set: (val) => {
    if (val && newRecord.value.record_time) {
      const [hours, minutes] = val.split(':')
      const currentDate = new Date(newRecord.value.record_time)
      currentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      newRecord.value.record_time = currentDate.toISOString()
    }
  },
})

// 编辑弹窗的日期和时间计算属性
const editRecordDate = computed({
  get: () => editingRecord.value.record_time ? parseDate(editingRecord.value.record_time.split('T')[0]) : undefined,
  set: (val) => {
    if (val) {
      // 保持现有的时间部分，只更新日期部分
      const currentTime = editingRecord.value.record_time ? new Date(editingRecord.value.record_time) : new Date()
      const newDateTime = new Date(val.toString())
      newDateTime.setHours(currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds(), currentTime.getMilliseconds())
      editingRecord.value.record_time = newDateTime.toISOString()
    } else {
      editingRecord.value.record_time = getCurrentDateTime()
    }
  },
})

const editRecordTime = computed({
  get: () => {
    if (editingRecord.value.record_time) {
      const date = new Date(editingRecord.value.record_time)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
    return getCurrentTime()
  },
  set: (val) => {
    if (val && editingRecord.value.record_time) {
      const [hours, minutes] = val.split(':')
      const currentDate = new Date(editingRecord.value.record_time)
      currentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      editingRecord.value.record_time = currentDate.toISOString()
    }
  },
})
const recordDatePlaceholder = ref(parseDate(nowDate.toISOString().split('T')[0]))

// 获取所有
async function fetchRecords() {
  try {
    const response = await fetch(`/api/menstrual-records?type=${dataType.value}`)
    records.value = await response.json()
  } catch (error) {
    console.error('获取记录失败:', error)
  }
}

// 切换数据类型
function switchDataType(type: 'user' | 'all' | 'group') {
  dataType.value = type
  fetchRecords()
}

// 添加新记录
async function addRecord() {
  try {
    const response = await fetch('/api/menstrual-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newRecord.value)
    })

    if (response.ok) {
      // 重置表单
      newRecord.value = {
        record_time: getCurrentDateTime(), // 使用当前日期时间重置
        flow_level: 'medium',
        pain_level: 'none',
        notes: ''
      }
      // 刷新记录列表
      await fetchRecords()
    }
  } catch (error) {
    console.error('添加记录失败:', error)
  }
}

// 编辑记录
function editRecord(record: MenstrualRecord) {
  editingRecord.value = { ...record }
  isEditDialogOpen.value = true
}

// 更新记录
async function updateRecord() {
  if (!editingRecord.value.id) return

  try {
    const response = await fetch(`/api/menstrual-records?id=${editingRecord.value.id}`, {
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

// 格式化记录时间为人性化显示
function formatRecordTime(timeString: string) {
  if (!timeString) return '-'
  
  const recordDate = new Date(timeString)
  const now = new Date()
  const diffInMs = now.getTime() - recordDate.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  
  // 如果是今天
  if (diffInDays === 0) {
    if (diffInMinutes < 1) {
      return '刚刚'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟前`
    } else {
      return `${diffInHours}小时前`
    }
  }
  // 如果是昨天
  else if (diffInDays === 1) {
    const hours = recordDate.getHours().toString().padStart(2, '0')
    const minutes = recordDate.getMinutes().toString().padStart(2, '0')
    return `昨天 ${hours}:${minutes}`
  }
  // 如果是一周内
  else if (diffInDays < 7) {
    return `${diffInDays}天前`
  }
  // 超过一周，显示具体日期和时间
  else {
    const year = recordDate.getFullYear()
    const month = (recordDate.getMonth() + 1).toString().padStart(2, '0')
    const day = recordDate.getDate().toString().padStart(2, '0')
    const hours = recordDate.getHours().toString().padStart(2, '0')
    const minutes = recordDate.getMinutes().toString().padStart(2, '0')
    
    // 如果是今年，不显示年份
    if (year === now.getFullYear()) {
      return `${month}-${day} ${hours}:${minutes}`
    } else {
      return `${year}-${month}-${day} ${hours}:${minutes}`
    }
  }
}

// 获取经期量显示文本
function getFlowLevelText(level: string) {
  const map: Record<string, string> = {
    light: '轻',
    medium: '中等',
    heavy: '重'
  }
  return map[level] || level
}

// 获取疼痛程度显示文本
function getPainLevelText(level: string) {
  const map: Record<string, string> = {
    none: '无痛',
    mild: '轻微',
    moderate: '中等',
    severe: '严重'
  }
  return map[level] || level
}

// 组件挂载时获取记录
onMounted(() => {
  fetchRecords()
})
</script>