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
      <h2 class="text-xl font-semibold mb-4">历史记录</h2>
      <div class="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>舒适度</TableHead>
              <TableHead>便便性状</TableHead>
              <TableHead>备注</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="record in records" :key="record.id">
              <TableCell>{{ record.date }}</TableCell>
              <TableCell>{{ getComfortLevelText(record.comfort_level) }}</TableCell>
              <TableCell>{{ getConsistencyText(record.consistency) }}</TableCell>
              <TableCell>{{ record.notes || '-' }}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" @click="editRecord(record)">编辑</Button>
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
          <div class="space-y-2">
            <Label>日期</Label>
            <Input type="date" v-model="editingRecord.date" required />
          </div>

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
import { CalendarIcon } from 'lucide-vue-next'
import { toDate } from 'reka-ui/date'
import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { cn } from '@/lib/utils'

const records = ref<StoolRecord[]>([])
const isEditDialogOpen = ref(false)
const editingRecord = ref<Partial<StoolRecord>>({})

const nowDate = new Date()
const newRecord = ref<Partial<StoolRecord>>({
  date: nowDate.toISOString().split('T')[0],
  comfort_level: 'normal',
  consistency: 'normal',
  notes: ''
})

// 获取所有记录
async function fetchRecords() {
  try {
    const response = await fetch('/api/stool-records')
    records.value = await response.json()
  } catch (error) {
    console.error('获取记录失败:', error)
  }
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
        date: nowDate.toISOString().split('T')[0],
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
  get: () => newRecord.value.date ? parseDate(newRecord.value.date) : undefined,
  set: val => val,
})

const recordDatePlaceholder = ref(parseDate(nowDate.toISOString().split('T')[0]))

// 组件挂载时获取记录
onMounted(() => {
  fetchRecords()
})
</script>