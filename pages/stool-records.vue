<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">便便记录</h1>

    <!-- 添加记录表单 -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <h2 class="text-xl font-semibold mb-4">添加新记录</h2>
      <form @submit.prevent="addRecord" class="space-y-4">
        <FormField name="date">
          <FormItem class="space-y-2">
            <Label>日期</Label>
            <Popover>
              <PopoverTrigger as-child>
                <FormControl>
                  <Button variant="outline" :class="cn(
        'w-[240px] ps-3 text-start font-normal',
        !recordDate && 'text-muted-foreground',
      )">
                    <span>{{ recordDate ? df.format(toDate(recordDate)) : "选择日期" }}</span>
                    <CalendarIcon class="ms-auto h-4 w-4 opacity-50" />
                  </Button>
                  <input hidden>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0">
                <Calendar v-model:placeholder="recordDatePlaceholder" v-model="recordDate" calendar-label="Record Date"
                  initial-focus :min-value="new CalendarDate(1900, 1, 1)" :max-value="today(getLocalTimeZone())"
                  @update:model-value="(v) => {
        if (v) {
          setFieldValue('date', v.toString())
        }
        else {
          setFieldValue('date', undefined)
        }
      }" />
              </PopoverContent>
            </Popover>
          </FormItem>
        </FormField>

        <!-- 时间选择 -->
        <FormField name="time">
          <FormItem class="space-y-2">
            <Label>时间</Label>
            <TimePicker v-model="recordTime" />
          </FormItem>
        </FormField>

        <FormField name="comfort_level">
          <FormItem class="space-y-2">
            <Label>舒适度</Label>
            <Select v-model="newRecord.comfort_level">
              <SelectTrigger>
                <SelectValue placeholder="选择舒适度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncomfortable">不适</SelectItem>
                <SelectItem value="normal">正常</SelectItem>
                <SelectItem value="comfortable">舒适</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        </FormField>

        <FormField name="consistency">
          <FormItem class="space-y-2">
            <Label>便便性状</Label>
            <Select v-model="newRecord.consistency">
              <SelectTrigger>
                <SelectValue placeholder="选择性状" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hard">硬</SelectItem>
                <SelectItem value="normal">正常</SelectItem>
                <SelectItem value="soft">软</SelectItem>
                <SelectItem value="liquid">液态</SelectItem>
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
              <TableHead>日期</TableHead>
              <TableHead>舒适度</TableHead>
              <TableHead>便便性状</TableHead>
              <TableHead>备注</TableHead>
              <TableHead v-if="dataType !== 'user'">用户</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="record in records" :key="record.id">
              <TableCell>{{ record.record_time }}</TableCell>
              <TableCell>{{ getComfortLevelText(record.comfort_level) }}</TableCell>
              <TableCell>{{ getConsistencyText(record.consistency) }}</TableCell>
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
          <FormField name="edit_date">
            <FormItem class="space-y-2">
              <Label>日期</Label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    :class="cn(
                      'w-full justify-start text-left font-normal',
                      !editRecordDate && 'text-muted-foreground'
                    )"
                  >
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    {{ editRecordDate ? df.format(toDate(editRecordDate)) : '选择日期' }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar v-model="editRecordDate" initial-focus />
                </PopoverContent>
              </Popover>
            </FormItem>
          </FormField>

          <FormField name="edit_time">
            <FormItem class="space-y-2">
              <Label>时间</Label>
              <TimePicker v-model="editRecordTime" />
            </FormItem>
          </FormField>

          <div class="space-y-2">
            <Label>舒适度</Label>
            <Select v-model="editingRecord.comfort_level">
              <SelectTrigger>
                <SelectValue placeholder="选择舒适度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncomfortable">不适</SelectItem>
                <SelectItem value="normal">正常</SelectItem>
                <SelectItem value="comfortable">舒适</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>便便性状</Label>
            <Select v-model="editingRecord.consistency">
              <SelectTrigger>
                <SelectValue placeholder="选择性状" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hard">硬</SelectItem>
                <SelectItem value="normal">正常</SelectItem>
                <SelectItem value="soft">软</SelectItem>
                <SelectItem value="liquid">液态</SelectItem>
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
import { ref, onMounted, computed } from 'vue'
import type { StoolRecord } from '~/server/models/schema'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: '便便记录 - Oncew Family Kit'
})
import { CalendarIcon } from 'lucide-vue-next'
import { toDate } from 'reka-ui/date'
import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { TimePicker } from '@/components/ui/time-picker'

const records = ref<StoolRecord[]>([])
const isEditDialogOpen = ref(false)
const editingRecord = ref<Partial<StoolRecord>>({})
const dataType = ref<'user' | 'all' | 'group'>('user')

const nowDate = new Date()

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

const newRecord = ref<Partial<StoolRecord>>({
  record_time: getCurrentDateTime(), // 使用完整的日期时间作为默认值
  comfort_level: 'normal',
  consistency: 'normal',
  notes: ''
})

// 获取所有
async function fetchRecords() {
  try {
    const response = await fetch(`/api/stool-records?type=${dataType.value}`)
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
    const response = await fetch('/api/stool-records', {
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
        comfort_level: 'normal',
        consistency: 'normal',
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
function editRecord(record: StoolRecord) {
  editingRecord.value = { ...record }
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

// 获取舒适度显示文本
function getComfortLevelText(level: string) {
  const map: Record<string, string> = {
    uncomfortable: '不适',
    normal: '正常',
    comfortable: '舒适'
  }
  return map[level] || level
}

// 获取便便性状显示文本
function getConsistencyText(consistency: string) {
  const map: Record<string, string> = {
    hard: '硬',
    normal: '正常',
    soft: '软',
    liquid: '液态'
  }
  return map[consistency] || consistency
}

// 组件挂载时获取记录
onMounted(() => {
  fetchRecords()
})

const df = new DateFormatter('en-US', {
  dateStyle: 'long',
})

const formSchema = toTypedSchema(z.object({
  date: z
    .string()
    .refine(v => v, { message: '日期是必填项。' }),
}))
const { handleSubmit, setFieldValue, values } = useForm({
  validationSchema: formSchema,
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
const recordDatePlaceholder = ref(parseDate(nowDate.toISOString().split('T')[0]))

// 编辑弹窗的日期计算属性
const editRecordDate = computed({
  get: () => editingRecord.value.record_time ? parseDate(editingRecord.value.record_time.split('T')[0]) : undefined,
  set: (val) => {
    if (val) {
      // 保持现有的时间部分，只更新日期部分
      const currentTime = editingRecord.value.record_time ? new Date(editingRecord.value.record_time) : new Date()
      const newDateTime = new Date(val.toString())
      newDateTime.setHours(currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds(), currentTime.getMilliseconds())
      editingRecord.value.record_time = newDateTime.toISOString()
    }
  },
})

// 编辑弹窗的时间计算属性
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

// 组件挂载时获取记录
onMounted(() => {
  fetchRecords()
})
</script>